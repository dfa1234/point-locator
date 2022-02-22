import {Component, Input} from '@angular/core';
import {Maps} from "../../providers/map.service";
import {OBJ_TYPE, EatPoint, User, EP_TYPES} from "../../models/models";
import {APP_CONFIG} from "../../theme/variables";
import {Utils} from "../../providers/utils.service";
import {ViewEpModal} from "../../pages/home/view-ep/view-ep";

@Component({
  selector: 'px-marker',
  templateUrl: 'px-marker.html'
})
export class PxMarkerComponent {

  @Input() eatPoint = new EatPoint();
  @Input('origin') me = new User();
  OBJ_TYPE = OBJ_TYPE;
  APP_CONFIG = APP_CONFIG;
  EP_TYPES = EP_TYPES;
  distance = Maps.distance;
  get typeKeys(){
    return Object.keys(EP_TYPES);
  }

  constructor(private utils:Utils) {

  }

  selectDetails(ep: EatPoint) {
    this.utils.displayModal(ViewEpModal,{eatPoint:ep})
  }


  getNameType(en:EatPoint){
    let goodKey = this.typeKeys.find(key=> {
      if(EP_TYPES[key]=== this.eatPoint.typeEP){
        return true;
      }
    })
    return goodKey;
  }

}
