import {NgModule} from "@angular/core";
import {HomePage} from "./home";
import {IonicPageModule} from "ionic-angular";
import {AgmCoreModule} from "@agm/core";
import {ComponentsModule} from "../../components/components.module";
import {TranslateModule} from "@ngx-translate/core";


@NgModule({
  declarations:[HomePage],
  imports:[
    IonicPageModule.forChild(HomePage),
    ComponentsModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyD6cPD_xHbJIozKw8CZX4bWAuPvMnkV3SM'
    }),
    TranslateModule
  ]
})
export class HomeModule{

}
