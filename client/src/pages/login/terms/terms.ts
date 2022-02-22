import { Component } from '@angular/core';
import {IonicPage, NavController, NavParams, ViewController} from 'ionic-angular';

@Component({
  selector: 'modal-terms',
  templateUrl: 'terms.html',
})
export class TermsModal {

  constructor(public viewCtrl: ViewController, public navParams: NavParams) {
  }

  dismiss(){
    this.viewCtrl.dismiss()
  }

}
