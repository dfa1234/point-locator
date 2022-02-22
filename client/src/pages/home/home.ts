import {Component, NgZone, OnInit} from '@angular/core';
import {IonicPage, NavParams, Platform} from 'ionic-angular';
import {CenterLocation, Maps} from "../../providers/map.service";
import {Utils} from "../../providers/utils.service";
import {Geolocation, Geoposition} from "@ionic-native/geolocation";
import {Api} from "../../providers/api.service";
import {BoundsMap, EatPoint, EP_TYPES, IEatPoint, IMapItem, OBJ_TYPE, SearchEatPoints, User} from "../../models/models";
import {EditEpModal} from "./edit-ep/edit-ep";
import {EditUserModal} from "./edit-user/edit-user";
import {PAGES_NAME} from "../../const/pages";
import {Observable, Subject} from "rxjs";

@IonicPage({
  segment: 'home'
})
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit {

  CENTER_PARIS: CenterLocation = {latitude: 48.85974578950385, longitude: 2.344207763671875, zoom: 11};
  CENTER_FRANCE: CenterLocation = {latitude: 46.619261036171515, longitude: 3.2080078125, zoom: 5};

  eatPoints: EatPoint[] = [];
  eatPointsDisplay: IMapItem[] = [];

  get eatPointsDisplayOnly() {
    return this.eatPointsDisplay && this.eatPointsDisplay.filter((ep) => ep.typeItem === OBJ_TYPE.EATPOINT)
  }

  E_MAPITEM_TYPE = OBJ_TYPE;
  DISPLAY_TYPE = {MAP: "MAP", LIST: "LIST", USER: "USER"};
  display = this.DISPLAY_TYPE.MAP;
  loading = false;
  searchBar: string = '';
  eatPointPersonnalList: EatPoint[] = [];

  center: CenterLocation;
  me: User = new User();

  specialSearch: SearchEatPoints = {};

  constructor(public navParams: NavParams,
              private geolocation: Geolocation,
              private utils: Utils,
              private mapService: Maps,
              private platform: Platform,
              private api: Api,
              private zone: NgZone) {
  }

  ngOnInit() {
    this.center = this.CENTER_FRANCE;

    // [Violation] Only request geolocation information in response to a user gesture.
    //this.geolocalizeMe();

    this.eatPointPersonnalList = [];
    this.api.getMyAccount$
      .concatMap((user) => {
        this.me = user;
        //this.eatPoints.push(this.me);
        return this.api.getEatPoints$({creatorId: this.me._id})
      }).subscribe(
      eps => {
        console.log('My ep', eps)
        this.eatPointPersonnalList.push(...eps)
      }
    )

    this.utils.notifySearch$.subscribe(
      res => {
        console.warn('SEARCH', res);
        let search: SearchEatPoints = {bounds: this.currentBound};

        this.specialSearch = res;

        if (res.type) {
          search.type = res.type;
        }
        if (res.name) {
          search.name = res.name;
        }


        this.searchEpToDisplay(search)
      }
    )

  }


  cancelSpecialSearch() {
    this.specialSearch = {};
    this.searchEpToDisplay({bounds: this.currentBound});
  }

  getNavigatorLocation$ = new Observable(observer => {
    let id = window.navigator.geolocation.getCurrentPosition((result) => {
      observer.next(result);
      observer.complete();
    }, err => observer.error(err), {
      timeout: 1000,
      enableHighAccuracy: true,
      maximumAge: Infinity
    })
  }).catch(e => {
    console.log(e);
    return Observable.of(null)
  });


  boundsChangeEventDebounced = new Subject<{ j: { j: number, l: number }, l: { j: number, l: number } }>();

  boundsChangeEventDebounced$ = this.boundsChangeEventDebounced.asObservable()
    .debounceTime(1000)
    .subscribe(($event: any) => {

      if (!$event.j && $event.ga) {
        $event.j = $event.ga;
      }

      if (!$event.j && $event.ia) {
        $event.j = $event.ia;
      }

      if (!$event.l && $event.ma) {
        $event.l = $event.ma;
      }

      if (!$event.l && $event.na) {
        $event.l = $event.na;
      }


      if (!$event.j && !$event.l) {
        let keys = Object.keys($event);
        console.error('KEY FOR BOUND CHANGED TO ', keys);
        if (keys.length > 1) {
          $event.j = $event[keys[1]];
          $event.l = $event[keys[0]];
        }
      }

      if ($event && $event.j && $event.l) {
        let bounds: BoundsMap = {
          minXLong: $event.j.j,
          maxXLong: $event.j.l,
          minYLat: $event.l.j,
          maxYLat: $event.l.l,
        };
        this.currentBound = bounds;
        console.warn("BOUND CHANGE", bounds);
        this.searchEpToDisplay({bounds: this.currentBound})
      } else {
        console.error('BOUND CHANGE NOT CORRECT:', $event);
        //this.utils.displayToast('Impossible de vous localiser pour le moment. Verifiez les paramétres de votre téléphone')
      }

    });


  epTypeFlip = HomePage.flip(EP_TYPES);

  getMarker(point: IMapItem) {
    let url = '';
    if (point.typeItem === OBJ_TYPE.USER) {
      url = 'assets/imgs/marker-green.png';
    } else {
      if (point.typeItem === OBJ_TYPE.EATPOINT) {
        let ep: EatPoint = point as EatPoint;
        url = `assets/imgs/icons/${this.epTypeFlip[ep.typeEP] && this.epTypeFlip[ep.typeEP].toLowerCase()}-1.png`
      } else {
        url = 'assets/imgs/marker-blue.png';
      }
    }

    return url
  }

  toogleSearch() {
    this.utils.broadcastCustom.next('toggle-search');
  }

  static flip(trans) {
    var key, tmp_ar = {};
    for (key in trans) {
      if (trans.hasOwnProperty(key)) {
        tmp_ar[trans[key]] = key;
      }
    }
    return tmp_ar;
  }

  currentCenter = null;

  searchEpToDisplay({name, type, bounds, creatorId}: SearchEatPoints) {
    this.loading = true;
    this.eatPoints = [];
    this.api.getEatPoints$({name, type, bounds, creatorId})
      .finally(() => this.loading = false)
      .subscribe((eps: EatPoint[]) => {
          this.eatPoints.push(...eps);
          this.eatPoints.sort(Maps.sortByDistanceFrom(this.me));
          this.utils.displayToast(`${this.eatPoints.length} EatPoint${this.eatPoints.length > 1 ? 's' : ''} dans la zone`);
          console.log(this.eatPoints)
        },
        e => {
          console.error(e);
          this.utils.displayToast('Erreur lors de la recherche des eatpoints')
        }
      );
  }


  ///USER SECTION
  centerChangeEventDebounced = new Subject<{ lat: number, lng: number }>();
  centerChangeEventDebounced$ = this.centerChangeEventDebounced.asObservable()
    .debounceTime(1000)
    .subscribe($event => {
      this.currentCenter = $event;
      console.warn("CENTER CHANGE", $event);
    });

  geolocalizeMe() {

    this.utils.displayToast('Localisation en cours...');

    this.getNavigatorLocation$
      .concatMap(geoLoc1 => {

        if (geoLoc1 && geoLoc1.message !== "Timeout expired") {
          console.warn('geoLoc1', geoLoc1);
          return Observable.of(geoLoc1)
        } else {
          return Observable.fromPromise(this.platform.ready())
            .concatMap(r => Observable.fromPromise(this.geolocation.getCurrentPosition({
              timeout: 8000,
              enableHighAccuracy: false,
              maximumAge: Infinity
            })))
        }
      })
      .subscribe((resp: Geoposition) => {

        this.me.address.lat = resp.coords.latitude;
        this.me.address.lon = resp.coords.longitude;

        this.center = {
          latitude: this.me.address.lat,
          longitude: this.me.address.lon,
          zoom: 12
        };

        //this.eatPoints.push(this.me);

        console.warn("Center on Location Found", this.center);

      }, err => {
        console.log(' Error : ', err);
        this.utils.displayToast('Impossible de vous localiser, essayez de vous mettre en exterieur.')
      })


  }

  addEp() {
    this.utils.displayModal(EditEpModal, {center: this.currentCenter}, (data) => {
      if (data && data.eatpoint) {
        console.log(data.eatpoint);
        this.zone.run(() => {
          this.eatPoints.push(data.eatpoint);
          this.eatPointPersonnalList.push(data.eatpoint);
        })

      }
    });
  }

  mapClick($event) {
    console.warn('CLICK', $event)
  }

  mapReady($event) {
    console.warn('READY', $event)
  }

  editUser() {

    if (!this.me.email) {
      this.utils.displayAlert('', `Impossible de modifier un utilisateur anonyme. Voulez vous créer un compte?`, [
        {
          text: 'Non',
          role: 'cancel'
        },
        {
          text: 'Oui',
          handler: () => {

            this.api.clearSession$.subscribe(
              res => {
                this.utils.switchPage(PAGES_NAME.LoginPage)
              }
            )

          }
        }
      ]);
      return;
    }

    this.utils.displayModal(EditUserModal, {user: this.me}, (data) => {
      if (data && data.success) {
        this.me = data.user;
      }
    });
  }

  centerChange($event) {
    this.centerChangeEventDebounced.next($event)
  }


  logout() {
    this.api.clearSession$.subscribe(
      res => {
        this.utils.switchPage(PAGES_NAME.LoginPage)
      }
    )
  }


  currentBound: BoundsMap;

  boundsChange($event) {
    this.boundsChangeEventDebounced.next($event)
  }


  deleteEP(eatpoint: EatPoint) {
    this.api.deleteEatPoint$(eatpoint)
      .subscribe(
        res => {
          console.log(res)
          this.eatPointPersonnalList.splice(this.eatPointPersonnalList.indexOf(eatpoint), 1);
          this.eatPoints.splice(this.eatPoints.indexOf(eatpoint), 1);
        }
      )
  }


  getNorthEast($event) {
    console.log($event);
  }

  getNorthWest($event) {
    console.log($event);
  }

  getSouthEast($event) {
    console.log($event);
  }

  getSouthWest($event) {
    console.log($event);
  }

}
