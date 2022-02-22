import {Component, OnInit} from '@angular/core';
import {IonicPage, NavController, NavParams, ViewController} from 'ionic-angular';
import {User} from "../../../models/models";
import {Api} from "../../../providers/api.service";
import {Utils} from "../../../providers/utils.service";

@Component({
  selector: 'modal-edit-user',
  templateUrl: 'edit-user.html',
})
export class EditUserModal implements OnInit{

  user =new User();


  constructor(public viewCtrl: ViewController,
              public navParams: NavParams,
              private api:Api,
              private utils:Utils) {
  }

  ngOnInit(): void {
    this.user = this.navParams.get('user');
  }

  dismiss(){
    this.viewCtrl.dismiss()
  }


  saveProfile(){
    this.api.editMyAccount$(this.user).subscribe(
      res=>{
        this.utils.displayToast('Compte','Modification sauvegardée');
        this.viewCtrl.dismiss({success:true,user:this.user});
      },
      err=>{
        this.utils.displayToast('Compte','Erreur lors de la sauvegarde')
      }
    )
  }

}
