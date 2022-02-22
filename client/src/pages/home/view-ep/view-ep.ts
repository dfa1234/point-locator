import {Component, NgZone, OnInit} from '@angular/core';
import {Events, NavParams, ViewController} from 'ionic-angular';
import {Maps} from "../../../providers/map.service";
import {Utils} from "../../../providers/utils.service";
import {Address, EatPoint, EP_TYPES, Product} from "../../../models/models";
import {SimpleImage} from "../../../models/image";
import {Api} from "../../../providers/api.service";
import {APP_CONFIG} from "../../../theme/variables";


enum E_EDIT_EP_STEPS {
  FORM1 = 'FORM1',
  FORM2 = 'FORM2',
  FORM3 = 'FORM3'
}

@Component({
  selector: 'modal-view-ep',
  templateUrl: 'view-ep.html',
})
export class ViewEpModal implements OnInit {

  APP_CONFIG = APP_CONFIG;
  EP_TYPES = EP_TYPES;
  eatPoint: EatPoint = new EatPoint();
  Address = Address;

  get epTypeKey() {
    // return Object.keys(EP_TYPES);
    return this.eatPoint ? this.eatPoint.typeEP : null;
  }


  days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  constructor(public viewCtrl: ViewController,
              public navParams: NavParams,
              public api: Api,
              public maps: Maps,
              public utils: Utils,
              public events: Events) {
    events.subscribe('star-rating:changed', starRating => {
      console.log(starRating)
    });
  }


  dismiss() {
    this.viewCtrl.dismiss()
  }

  ngOnInit() {
    this.eatPoint = this.navParams.get('eatPoint');
  }


}
