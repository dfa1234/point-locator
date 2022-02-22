import {Injectable} from "@angular/core";
import {MapsAPILoader} from "@agm/core";
import {Observable, Observer} from "rxjs";
import {Geolocation} from "@ionic-native/geolocation";
import {Address, IMapItem, User} from "../models/models";

declare var google: any;

export type CenterLocation = { latitude: number, longitude: number, zoom: number };

@Injectable()
export class Maps {

  constructor(private __loader: MapsAPILoader,
              private geolocation: Geolocation) {
  }

  static distance(mapItem1: IMapItem, mapItem2: IMapItem): number {

    if (!mapItem1 || !mapItem1.address || !mapItem1.address.lat || !mapItem1.address.lon
      || !mapItem2 || !mapItem2.address || !mapItem2.address.lat || !mapItem2.address.lon) {
      return null;
    }

    const radlat1 = Math.PI * mapItem1.address.lat / 180;
    const radlat2 = Math.PI * mapItem2.address.lat / 180;
    const theta = mapItem1.address.lon - mapItem2.address.lon;
    const radtheta = Math.PI * theta / 180;
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    //miles to km
    dist = dist * 1.609344;
    // nautical miles:  dist = dist * 0.8684
    dist = Math.round(dist * 100) / 100;
    return dist
  }


  getGeoLocationFromAddress$(user: User, forceRefresh = false): Observable<User> {
    return Observable.create(observer => {
      try {
        //If it is already saved in database we don't try to locate
        if (user.address.lat && user.address.lon && !forceRefresh) {
          observer.next(user);
          observer.complete();
        } else {
          console.log('address: ', user.address.toString);
          //at this point the variable google may be still undefined (google maps scripts still loading)
          //so load all the scripts, then...
          this.__loader.load().then(() => {
            let geocoder = new google.maps.Geocoder();
            geocoder.geocode({address: user.address.toString}, (results, status) => {

              if (status === google.maps.GeocoderStatus.OK) {
                const place = results[0].geometry.location;
                user.address.lat = place.lat();
                user.address.lon = place.lng();
                observer.next(user);
                observer.complete();
              } else {
                //if (status === google.maps.GeocoderStatus.ZERO_RESULTS || status === google.maps.GeocoderStatus.INVALID_REQUEST) {}else{}
                console.error(`Google Service Error "${status}" for ${user.name}`);
                //next (not error) for continuing to next user
                observer.next(user);
                observer.complete();
              }
            });
          });
        }

      } catch (error) {
        observer.error('error getGeocoding' + error);
        observer.complete();
      }

    }).catch(res =>
      console.error(res)
    );
  }


  getGeoLocationsFromAddresses$(contacts: User[]): Observable<User> {
    return Observable.from(contacts)
      .concatMap((contact: User) => {
        if (contact && contact.address && contact.address.lat && contact.address.lon) {
          return Observable.of(contact)
        } else {
          return this.getGeoLocationFromAddress$(contact).delay(1000)
        }
      })
  }


  getMyAddress$(): Observable<Address> {

    return Observable.create(observer => {
      try {
        //at this point the variable google may be still undefined (google maps scripts still loading)
        //so load all the scripts, then...
        this.__loader.load().then(() => {

          this.geolocation.getCurrentPosition({timeout: 10000, enableHighAccuracy: true, maximumAge: 3600}).then((resp) => {
            console.warn("Location Found", resp);
            let lat = resp.coords.latitude;
            let lng = resp.coords.longitude;

            let geocoder = new google.maps.Geocoder();
            let latLng = new google.maps.LatLng(lat, lng);
            let request = {latLng};
            geocoder.geocode(request, (results, status) => {
              if (status == google.maps.GeocoderStatus.OK) {
                //GeocoderResult
                console.warn('Address found', results[0]);

                let address = new Address();
                for (let info of results[0].address_components) {

                  console.warn(info,info.types[0])

                  let type = info.types[0];
                  if (type == "street_number") {
                    address.name = info.long_name;
                  } else if (info.types[0] == "postal_code") {
                    address.zipCode = info.long_name;
                  } else if (info.types[0] == "route" || info.types[0] == "establishment") {
                    address.name = address.name + " " + info.long_name;
                  } else if (info.types[0] == "locality") {
                    address.city = info.long_name;
                  } else if (info.types[0] == "country") {
                    address.country = info.long_name;
                  }
                }

                address.lat = results[0].geometry.location.lat();
                address.lon = results[0].geometry.location.lng();

                observer.next(address);
                observer.complete();
              } else {
                console.error('Error: ', results, ' & Status: ', status);
                observer.error('Impossible de recupérer votre position pour le moment');
              }
            });


          },err=>{
            console.log('EEE',err)
            observer.error('Impossible de recupérer votre position pour le moment');
          }).catch((error) => {
            console.error('Error getLocation', error);
            observer.error('Impossible de recupérer votre position pour le moment');
          });

        });
      } catch (error) {
        console.error('Error getGeocoding', error)
        observer.error('Impossible de recupérer votre position pour le moment');
      }

    });

  }

  /**
   * Retrieves geographic position in terms of latitude and longitude of the device.
   * @returns {Observable<Position>} Geographical location of the device running
   *                                 the client.
   */
  getCurrentPosition(): Observable<Position> {
    let options = {
      enableHighAccuracy: true
    };
    return new Observable((observer: Observer<Position>) => {
      (navigator.geolocation as any).getCurrentPosition(
        (position: Position) => {
          observer.next(position);
          observer.complete();
        },
        (error: PositionError) => {
          console.error('Geolocation service: ' + error.message);
          observer.error(error);
        },
        options
      );
    });
  }


  /**
   *
   * @param a eatpoint item
   * @param b eatpoint item
   * @param origin: The User
   */
  static sortByDistanceFrom = (origin: IMapItem) => (a: IMapItem, b: IMapItem) => {
    let dist1 = Maps.distance(a, origin);
    let dist2 = Maps.distance(b, origin);
    if (dist1 < dist2) {
      return -1
    } else if (dist1 > dist2) {
      return +1
    } else {
      return 0
    }
  }

}
