import {Component, NgZone, OnInit} from '@angular/core';
import {NavParams, ViewController} from 'ionic-angular';
import {Maps} from "../../../providers/map.service";
import {Utils} from "../../../providers/utils.service";
import {EatPoint, EP_TYPES, Product} from "../../../models/models";
import {SimpleImage} from "../../../models/image";
import {Api} from "../../../providers/api.service";
import {APP_CONFIG} from "../../../theme/variables";


enum E_EDIT_EP_STEPS {
  FORM1 = 'FORM1',
  FORM2 = 'FORM2',
  FORM3 = 'FORM3'
}

@Component({
  selector: 'modal-edit-ep',
  templateUrl: 'edit-ep.html',
})
export class EditEpModal implements OnInit {

  APP_CONFIG = APP_CONFIG;
  E_EDIT_EP_STEPS = E_EDIT_EP_STEPS;
  EP_TYPES = EP_TYPES;
  currentStep = E_EDIT_EP_STEPS.FORM1;
  currentProduct = new Product();
  eatPoint: EatPoint = new EatPoint();

  get epTypeKeys(){
    return Object.keys(EP_TYPES);
  }


  days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  constructor(public viewCtrl: ViewController,
              public navParams: NavParams,
              public api: Api,
              public maps: Maps,
              public ngZone: NgZone,
              public utils: Utils) {
  }

  dismiss() {
    this.viewCtrl.dismiss()
  }

  ngOnInit(): void {
    this.api.getMyAccount$.subscribe(
      user=>  this.eatPoint.creator = user
    )

    let center = this.navParams.get('center');
    console.log(center)
    if(center && center.lat && center.lng){
      this.ngZone.run(()=>{
        this.eatPoint.address.lat = center.lat;
        this.eatPoint.address.lon = center.lng;
      })
    }
  }

  uploadPicture(image: SimpleImage) {
    if (image) {
      this.api.postImage$(image).subscribe(
        res => {
          image.url = res.fileName;
          this.eatPoint.images.push(image)
        }
      )
    }
  }


  uploadPictureProduct(image: SimpleImage, product: Product) {
    if (image) {
      this.api.postImage$(image).subscribe(
        res => {
          image.url = res.fileName;
          product.image = image;
        }
      )
    }
  }

  selectType(type:string) {
    console.warn(type);
  }

  loadingLocalUser = false;

  localUser() {
    this.loadingLocalUser = true;
    this.maps.getMyAddress$()
      .finally(() => this.loadingLocalUser = false)
      .subscribe(
        res => {
          this.ngZone.run(() => {
            Object.assign(this.eatPoint.address, res)
          })
        }, e => this.utils.displayToast('Localisation', e)
      )
  }


  addProduct() {
    this.currentProduct = new Product();
    this.eatPoint.products.push(this.currentProduct);
  }

  removeProduct(product: Product) {
    this.eatPoint.products.splice(this.eatPoint.products.indexOf(product), 1);
    if (product === this.currentProduct) {
      this.addProduct();
    }
  }

  openHoursFor(i: number) {
    this.eatPoint.openingHours[i] = this.eatPoint.openingHours[i] === null ? "" : null;
  }

  endStep1() {
    // this.api.createEatPoint$(this.eatPoint).subscribe(
    //   res => {
    //     this.eatPoint = res;
    //     this.currentStep = E_EDIT_EP_STEPS.FORM2;
    //   }, err => {
    //     this.utils.displayToast('Eatpoint', err)
    //   }
    // )


    if(!this.eatPoint.name){
      this.utils.displayToast(`Nom manquant`);
      return;
    }

    if(!this.eatPoint.address || !this.eatPoint.address.lat){
      this.utils.displayToast(`Latitude manquante`);
      return;
    }

    if(!this.eatPoint.address || !this.eatPoint.address.lon){
      this.utils.displayToast(`Longitude manquante`);
      return;
    }

    this.currentStep = E_EDIT_EP_STEPS.FORM2;
  }

  endStep2() {
    // this.api.editEatPoint$(this.eatPoint).subscribe(
    //   res => {
    //     this.eatPoint = res;
    //     this.addProduct();
    //     this.currentStep = E_EDIT_EP_STEPS.FORM3;
    //   }, err => {
    //     this.utils.displayToast('Eatpoint', err)
    //   }
    // )
    this.currentStep = E_EDIT_EP_STEPS.FORM3;
  }

  endStep3() {
    //this.api.editEatPoint$(this.eatPoint).subscribe(

    if(!this.eatPoint.products || !this.eatPoint.products.length){
      this.utils.displayToast('Vous devez mettre au moins 1 produit dans votre eatpoint')
      return;
    }

    this.api.createEatPoint$(this.eatPoint).subscribe(
      res => {
        this.eatPoint = res;
        this.utils.displayToast('Nouveau eatpoint enregistré!');
        this.viewCtrl.dismiss({eatpoint: this.eatPoint})
      }, err => {
        this.utils.displayToast('Eatpoint', err)
      }
    )
  }
}
