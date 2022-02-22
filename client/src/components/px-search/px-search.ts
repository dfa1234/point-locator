import {Component, Input} from '@angular/core';
import {Utils} from "../../providers/utils.service";
import {EP_TYPES, SearchEatPoints} from "../../models/models";

@Component({
  selector: 'px-search',
  templateUrl: 'px-search.html'
})
export class PxSearchComponent {

  @Input() searchOpened = false;
  EP_TYPES = EP_TYPES;

  searchParams:SearchEatPoints = new class implements SearchEatPoints {
    name = null;
    type = null;
  };

  get epTypeKeys(){
    return Object.keys(EP_TYPES);
  }


  constructor(private utils:Utils) {
  }


  launchSearch(){
    this.utils.broadcastCustom.next('toggle-search');
    this.utils.broadcastSearch.next(this.searchParams)
  }


  dismiss(){
    this.utils.broadcastCustom.next('toggle-search');
  }

}
