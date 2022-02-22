import {Component, OnInit, ViewChild} from '@angular/core';
import {AlertController, App, ModalController, NavController, Platform, ToastController} from 'ionic-angular';
import {StatusBar} from '@ionic-native/status-bar';
import {SplashScreen} from '@ionic-native/splash-screen';

import {HomePage} from '../pages/home/home';
import {APP_CONFIG} from "../theme/variables";
import {TARGET_MODE, Utils} from "../providers/utils.service";
import {ScreenOrientation} from "@ionic-native/screen-orientation";
import {LoginPage} from "../pages/login/login";
import {TranslateService} from '@ngx-translate/core';

@Component({
  templateUrl: 'app.html'
})
export class MyApp implements OnInit {
  rootPage: any = HomePage;
  menuIsOpen: boolean = false;
  searchOpened: boolean = false;


  @ViewChild('nav') nav: NavController;

  constructor(private platform: Platform,
              private statusBar: StatusBar,
              private splashScreen: SplashScreen,
              private screenOrientation: ScreenOrientation,
              private alertCtrl: AlertController,
              private modalCtrl: ModalController,
              private toastCtrl: ToastController,
              private app: App,
              private utils: Utils,
              private translate: TranslateService) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });

    translate.setDefaultLang('en');

    if(navigator.language){
      let lang = navigator.language.substring(0,2);
      console.warn('Language set to',lang);
      translate.use(lang);
    }

  }


  ngOnInit() {

    this.app.setTitle(APP_CONFIG.title);

    console.time('🎬');

    this.rootPage = 'LoginPage';

    ///////////////////////////////////////////////////////
    //GLOBAL BROADCASTS


    this.utils.notifyRedirection$.subscribe(
      redirection => {

        if (redirection.mode === TARGET_MODE.ROOT) {
          this.nav.setRoot(redirection.page, redirection.data).then(value => {
            //this.controlSize();
          }, console.error)
        } else if (redirection.mode === TARGET_MODE.PUSH) {
          this.nav.push(redirection.page, redirection.data).then(value => {
            //this.controlSize();
          }, console.error)
        } else if (redirection.mode === TARGET_MODE.POP) {
          if (this.nav.canGoBack()) {
            this.nav.pop().then(value => {
              //this.controlSize();
            }, console.error)
          } else if (redirection.page) {
            console.error('ERROR NAV 3');
            this.nav.setRoot(redirection.page, redirection.data).then(value => {
              //this.controlSize();
            }, console.error)
          } else {
            console.error('ERROR NAV 2')
          }
        } else {
          console.error('ERROR NAV 1');
          this.nav.setRoot(redirection.page, redirection.data).then(value => {
            //this.controlSize();
          }, console.error)
        }

      }
    );

    this.utils.notifyMenu$.subscribe(
      order => this.menuIsOpen = order.open
    );

    this.utils.notifyAlert$.subscribe(
      myAlert => this.alertCtrl.create(myAlert).present()
    );

    this.utils.notifyModal$.subscribe(
      myModal => {

        let modalToPresent;

        if (myModal.data) {
          modalToPresent = this.modalCtrl.create(myModal.modalName, myModal.data, myModal.options)
        } else {
          modalToPresent = this.modalCtrl.create(myModal.modalName)
        }

        if (myModal.onDismiss) {
          modalToPresent.onDidDismiss(myModal.onDismiss)
        }

        modalToPresent.present();
      }
    );

    this.utils.notifyToast$.subscribe(
      toastValues => {
        let toast = this.toastCtrl.create(toastValues);
        toast.onDidDismiss(() => {
          //console.log('Dismissed toast');
        });
        toast.present();
      }
    );

    this.utils.notifyCustom$.subscribe(
      typeCustom => {
        if (typeCustom === 'toggle-search') {
          this.searchOpened = !this.searchOpened;
        } else {
          console.error('wrong custom code')
        }
      }
    );

    this.utils.notifyLogin$.subscribe(
      result => {
        //.realTimeService.connectSocket();
        //this.controlSize();
      }
    );

    this.utils.notifyScreenOrientation$.subscribe(
      orientation => {
        setTimeout(() => {
          //this.controlSize();
        }, 500)
      }
    );

    this.utils.notifyUserChange$.subscribe(
      result => {
        //.realTimeService.connectSocket();
        //this.controlSize();
      }
    );

    ///////////////////////////////////////////////////////
    //INIT SOCKET
    //.realTimeService.connectSocket();


    ///////////////////////////////////////////////////////
    //PAGE WIDTH

    setTimeout(() => {
      //this.controlSize();
    }, 500)
  }

}

