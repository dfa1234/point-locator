import {NgModule} from '@angular/core';
import {PxMarkerComponent} from './px-marker/px-marker';
import {CommonModule} from "@angular/common";
import {PxSearchComponent} from './px-search/px-search';
import {IonicPageModule} from "ionic-angular";

@NgModule({
  declarations: [
    PxSearchComponent,
    PxMarkerComponent,

  ],
  imports: [
    CommonModule,
    IonicPageModule.forChild(PxSearchComponent)
  ],
  exports: [
    PxSearchComponent,
    PxMarkerComponent,
  ]
})
export class ComponentsModule {
}
