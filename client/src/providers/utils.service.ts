import {Component, Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {Subject} from "rxjs/Subject";
import {ModalOptions as ModalOptionsIonic3, Platform} from 'ionic-angular';
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import {HttpStatus} from "../const/http-status";
import {APP_CONFIG} from "../theme/variables";
import {ScreenOrientation} from "@ionic-native/screen-orientation";
import {UniqueDeviceID} from "@ionic-native/unique-device-id";
import {SearchEatPoints, User} from "../models/models";


export enum TARGET_MODE {
  ROOT = 'ROOT',
  PUSH = 'PUSH',
  POP = 'POP'
}

export type IonicRouterWrapper = {
  page: string | any,
  data: any,
  mode: TARGET_MODE
}

export type ModalOptions = ModalOptionsIonic3;


@Injectable()
export class Utils {

  private alreadyNotify = false;
  private context: any = {};

  public platform: Platform;
  public uniqueDeviceID: UniqueDeviceID;

  constructor(private platformIonic: Platform,
              private screenOrientation: ScreenOrientation,
              private uniqueDeviceIDIonic: UniqueDeviceID,
              private http: HttpClient) {

    this.uniqueDeviceID = this.uniqueDeviceIDIonic;
    this.platform = this.platformIonic;

  }


  public static headers = {withCredentials: true, 'Content-Type': 'application/json'};

  public static optionsFullResponse = {
    headers: new HttpHeaders({'Content-Type': 'application/json'}),
    withCredentials: true,
    observe: 'response'
  };

  public static optionsResponseText = {withCredentials: true, responseType: 'text'};

  public broadcastLogin: Subject<User> = new Subject<User>();
  public notifyLogin$ = this.broadcastLogin.asObservable().do(user => this.getFreshUser$());

  private broadcastUserChange: Subject<User> = new Subject<User>();
  public notifyUserChange$ = this.broadcastUserChange.asObservable();

  private broadcastRedirection: Subject<IonicRouterWrapper> = new Subject<IonicRouterWrapper>();
  public notifyRedirection$: Observable<IonicRouterWrapper> = this.broadcastRedirection.asObservable();

  private broadcastMenu: Subject<{ open: boolean, data: any }> = new Subject<{ open: boolean, data: any }>();
  public notifyMenu$: Observable<{ open: boolean, data: any }> = this.broadcastMenu.asObservable();

  private broadcastAlert: Subject<{ title: string, message: string, buttons: any, inputs?: any }> = new Subject<{ title: string, message: string, buttons: any, inputs?: any }>();
  public notifyAlert$: Observable<{ title: string, message: string, buttons: any, inputs?: any }> = this.broadcastAlert.asObservable();

  private broadcastToast: Subject<{ message, duration, position }> = new Subject<{ message, duration, position }>();
  public notifyToast$: Observable<{ message, duration, position }> = this.broadcastToast.asObservable();

  public broadcastCustom: Subject<string> = new Subject<string>();
  public notifyCustom$: Observable<string> = this.broadcastCustom.asObservable();

  public broadcastSearch: Subject<SearchEatPoints> = new Subject<SearchEatPoints>();
  public notifySearch$: Observable<SearchEatPoints> = this.broadcastSearch.asObservable();

  private broadcastScreenOrientation: Subject<any> = new Subject<any>();
  public notifyScreenOrientation$: Observable<any> = this.broadcastScreenOrientation.asObservable();

  private broadcastModal: Subject<{ modalName: string | Component, data: any, onDismiss: (data) => void, options: any }> = new Subject<{ modalName: string | Component, data: any, onDismiss: (data) => void, options: any }>();
  public notifyModal$: Observable<{ modalName: string | any, data: any, onDismiss: (data) => void, options: any }> = this.broadcastModal.asObservable();


  public handleError(error: HttpErrorResponse | any): Observable<any> {


    if (error) {
      if (error.status === HttpStatus.UNAUTHORIZED) {

        if (!this.alreadyNotify) {

          this.alreadyNotify = true;
          setTimeout(() => {
            this.alreadyNotify = false;
          }, 3000);

          this.displayAlert("Authentification requise", "Pour accéder à cette page, veuillez tout d'abord vous connecter.",
            [
              {
                text: 'Annuler',
                role: 'cancel',
                handler: () => {
                }
              },
              {
                text: 'Login',
                handler: () => {
                  //TODO this.switchPage(PAGES_NAMES.LOGIN)
                }
              }
            ]);
        }

        //cancel any further displayAlert to be executed:
        error.message = "";

      } else {
        if (error.message) {
          console.error(`💩 ${error.message}`, error);
        } else {
          console.error(`💩 ${error.status} /// ${error.statusText} /// ${error.name}`);
        }
      }
      return Observable.throw(error);
    } else {
      console.error("Unspecified error sent");
      return Observable.throw("Erreur serveur");
    }
  }


  /**
   * ionic workaround for many bugs in navigation (setRoot etc...)
   * @param page value from PAGES_NAME
   * @param data params
   * @param target TARGET_FRAME optional
   * @param mode TARGET_MODE optional
   */
  public switchPage(page: string | any, data: any = {}, mode: TARGET_MODE = TARGET_MODE.ROOT) {
    this.broadcastRedirection.next({page, data, mode});
  }

  /**
   * ionic workaround for many bugs in menu (bad display on ios etc...)
   * @param open true to open or false to close
   * @param data (not is use)
   * @param target TARGET_FRAME optional
   */
  public switchMenu(open: boolean, data: any = {}) {
    this.broadcastMenu.next({open, data});
  }


  public displayAlert(title: string, message: string = null, buttons: { text, handler?, role? }[] | string[] = ['Ok'], inputs: any[] = null) {
    if (title || message) {
      if (inputs) {
        this.broadcastAlert.next({title, message, buttons, inputs});
      } else {
        this.broadcastAlert.next({title, message, buttons});
      }
    } else
      console.error('no message, maybe already catched error')
  }


  public displayModal(modalName: string | any, data: any = {}, onDismiss: (data) => void = null, options: ModalOptions = {}) {
    this.broadcastModal.next({modalName, data, onDismiss, options});
  }

  public displayToast(...messages: string[]) {

    let duration = 3000;
    let position = 'bottom';

    let results = messages[0];
    if (messages[1]) {
      results = results + ': ' + messages[1];
    }

    this.broadcastToast.next({message: results, duration, position});
  }

  public screenLockPortrait() {
    if (this.platform.is('cordova')) {
      this.platform.ready().then(() => {
        this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
        this.broadcastScreenOrientation.next(this.screenOrientation.ORIENTATIONS.PORTRAIT);
      })
    }
  }

  public screenLockLandscape() {
    if (this.platform.is('cordova')) {
      this.platform.ready().then(() => {
        this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE);
        this.broadcastScreenOrientation.next(this.screenOrientation.ORIENTATIONS.LANDSCAPE);
      })
    }
  }

  public screenUnlock() {
    if (this.platform.is('cordova')) {
      this.platform.ready().then(() => {
        this.screenOrientation.unlock();
        this.broadcastScreenOrientation.next(null);
      })
    }
  }


  private getUserCall$() {
    return this.http.get<User>(APP_CONFIG.baseUrl + '/account', {withCredentials: true})
      .map(user => Object.assign(new User(), user))
      .do(r => this.broadcastUserChange.next(r))
      .publishLast()
      .refCount();
  }


  /**
   * WARNING is we dont log error everything fail
   * @returns {Observable<Models>}
   */
  public getUser$ = this.getUserCall$();

  public getFreshUser$() {
    //weird way I found to relaunch the XHR
    this.getUser$ = this.getUserCall$();
    return this.getUser$;
  }

}
