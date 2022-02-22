import { AgmCoreModule } from "@agm/core";
import { CommonModule } from "@angular/common";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { ErrorHandler, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Camera } from "@ionic-native/camera";
import { Facebook } from "@ionic-native/facebook";
import { Geolocation } from "@ionic-native/geolocation";
import { GooglePlus } from "@ionic-native/google-plus";
import { ScreenOrientation } from "@ionic-native/screen-orientation";
import { SplashScreen } from "@ionic-native/splash-screen";
import { StatusBar } from "@ionic-native/status-bar";
import { UniqueDeviceID } from "@ionic-native/unique-device-id";
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { IonicApp, IonicErrorHandler, IonicModule } from "ionic-angular";
import { StarRatingModule } from "ionic3-star-rating";
import { ComponentsModule } from "../components/components.module";
import { DirectivesModule } from "../directives/directives.module";
import { EditEpModal } from "../pages/home/edit-ep/edit-ep";
import { EditUserModal } from "../pages/home/edit-user/edit-user";
import { ViewEpModal } from "../pages/home/view-ep/view-ep";
import { TermsModal } from "../pages/login/terms/terms";
import { Api } from "../providers/api.service";
import { Maps } from "../providers/map.service";
import { Utils } from "../providers/utils.service";
import { MyApp } from "./app.component";

@NgModule({
  declarations: [MyApp, TermsModal, EditUserModal, EditEpModal, ViewEpModal],
  imports: [
    BrowserModule,
    CommonModule,
    IonicModule.forRoot(MyApp),
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    StarRatingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (httpClient) =>
          new TranslateHttpLoader(httpClient, "./assets/i18n/", ".json"),
        deps: [HttpClient],
      },
    }),
    ComponentsModule,
    DirectivesModule,
    AgmCoreModule.forRoot({
      apiKey: "XXXXXXX",
    }),
  ],
  bootstrap: [IonicApp],
  entryComponents: [MyApp, TermsModal, EditUserModal, EditEpModal, ViewEpModal],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    ScreenOrientation,
    Facebook,
    GooglePlus,
    UniqueDeviceID,
    Geolocation,
    Camera,
    // our services:
    Api,
    Utils,
    Maps,
  ],
})
export class AppModule {}
