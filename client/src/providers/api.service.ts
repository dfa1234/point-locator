import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {APP_CONFIG} from "../theme/variables";
import {Observable} from "rxjs";
import {SimpleImage} from "../models/image";
import {EatPoint, IEatPoint, IUser, SearchEatPoints, Session, User} from "../models/models";
import {PAGES_NAME} from "../const/pages";
import {Utils} from "./utils.service";

@Injectable()
export class Api {

  constructor(private http: HttpClient, private utils: Utils) {

  }

  //getEatPoints$ = this.http.get(APP_CONFIG.baseUrl+'/ws/eatpoints');
  //getEatPoints$ = Observable.of(MOCK_EATPOINTS);

  //getEatPoints$ = this.http.get(APP_CONFIG.baseUrl+'/ws/eatpoints');
  //getMyUser$ = Observable.of(MOCK_USERS);

  createAccount$ = (object: IUser): Observable<{ newUser: boolean, success: boolean, user: User, error?: string }> => this.http.post<{ newUser: boolean, success: boolean, user: User, error?: string }>(APP_CONFIG.baseUrl + '/account', object);

  login$ = (object: IUser) => this.http.post<IUser | { error: string }>(APP_CONFIG.baseUrl + '/login', object, {withCredentials: true})
    .concatMap((loginUser: any) => {
      if (loginUser && !loginUser.error) {
        this.utils.switchPage(PAGES_NAME.HomePage);
        return Observable.empty();
      } else if (loginUser && loginUser.error) {
        return Observable.throw(loginUser.error);
      } else {
        return Observable.throw('Impossible de proceder au login.');
      }
    })
    .catch(e => {
      let message = (e && e.message) ? e.message : e;
      console.error(e);
      this.utils.displayToast('Erreur compte', message);
      return Observable.empty();
    });

  testSession$ = this.http.get<Session>(APP_CONFIG.baseUrl + '/protected', {withCredentials: true});

  clearSession$ = this.http.delete<Session>(APP_CONFIG.baseUrl + '/protected', {withCredentials: true});

  getMyAccount$ = this.http.get<User>(APP_CONFIG.baseUrl + '/account', {withCredentials: true}).map(user => Object.assign(new User(), user));

  editMyAccount$ = (user: User): Observable<User> => this.http.put<IUser>(APP_CONFIG.baseUrl + '/account', user, {withCredentials: true}).map(u => Object.assign(new User(), u));

  postImage$ = (object: SimpleImage) => this.http.post<{ fileName: string, success: boolean }>(APP_CONFIG.baseUrl + '/upload', object, {withCredentials: true});

  private b64EncodeUnicode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
        // @ts-ignore
        return String.fromCharCode('0x' + p1);
      }));
  }

  getEatPoints$ = ({name, type, bounds, creatorId}: SearchEatPoints): Observable<EatPoint[]> => {
    let searchParameters = this.b64EncodeUnicode(JSON.stringify({name, type, bounds, creatorId}));
    return this.http.get<IEatPoint[]>(APP_CONFIG.baseUrl + '/eatpoints?search=' + searchParameters, {withCredentials: true})
      .map(eatpoints => eatpoints && eatpoints.length ? eatpoints : [])
      .map(eatpoints => eatpoints && eatpoints.map(ep => Object.assign(new EatPoint(), ep)) || []);
  };

  createEatPoint$ = (ep: EatPoint): Observable<EatPoint> => this.http.post<IEatPoint>(APP_CONFIG.baseUrl + '/eatpoint', ep, {withCredentials: true}).map(ep => Object.assign(new EatPoint(), ep));

  editEatPoint$ = (ep: EatPoint): Observable<EatPoint> => this.http.put<IEatPoint>(APP_CONFIG.baseUrl + '/eatpoint', ep, {withCredentials: true}).map(ep => Object.assign(new EatPoint(), ep));

  deleteEatPoint$ = (ep:EatPoint) => this.http.delete(APP_CONFIG.baseUrl + '/eatpoint/'+ep._id, {withCredentials: true})

}
