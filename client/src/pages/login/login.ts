import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { Component, OnInit } from "@angular/core";
import { Facebook, FacebookLoginResponse } from "@ionic-native/facebook";
import { GooglePlus } from "@ionic-native/google-plus";
import { IonicPage } from "ionic-angular";
import { Observable } from "rxjs";
import { moment } from "../../const/moment";
import { PAGES_NAME } from "../../const/pages";
import { User } from "../../models/models";
import { Api } from "../../providers/api.service";
import { Utils } from "../../providers/utils.service";
import { TermsModal } from "./terms/terms";

enum STEP_LOGIN {
  CONNECTION = "CONNECTION",
  LOGIN = "LOGIN",
  FORGOT_PASSWORD = "FORGOT_PASSWORD",
  REGISTER_ACCOUNT = "REGISTER_ACCOUNT",
}

@IonicPage()
@Component({
  selector: "page-login",
  templateUrl: "login.html",
  animations: [
    trigger("simpleFadeAnimation", [
      state("in", style({ opacity: 1 })),
      transition(":enter", [style({ opacity: 0 }), animate(600)]),
      transition(
        ":leave",
        animate(0, style({ opacity: 0, position: "absolute" }))
      ),
    ]),
  ],
})
export class LoginPage implements OnInit {
  currentStep: STEP_LOGIN = STEP_LOGIN.CONNECTION;
  STEP_LOGIN = STEP_LOGIN;

  credentials = new User();
  user = new User();
  password2 = "";

  constructor(
    public utils: Utils,
    public api: Api,
    public fb: Facebook,
    private gp: GooglePlus
  ) {}

  ngOnInit(): void {
    this.api.testSession$.subscribe((res) => {
      if (res._id && moment(res.expiration).isAfter(moment())) {
        console.log("still logged in, login...", res);
        let message = "";
        if (res.user && res.user.email) {
          message = `Vous êtes connecté avec le compte ${res.user.email}`;
        } else if (res.anonymousConnection) {
          message = `Vous êtes connecté en connexion anonyme`;
        } else {
          message = `Connexion automatique`;
        }
        this.utils.displayToast(message);
        this.utils.switchPage(PAGES_NAME.HomePage);
      }
    });
  }

  login() {
    this.api.login$(this.credentials).subscribe();
  }

  forgotPass() {
    this.utils.displayToast(
      "Si votre email est correct, vous allez recevoir un rappel de votre mot de passe dans votre boite de reception"
    );
    //TODO
  }

  connectWithGoogle() {
    if (!this.utils.platform.is("cordova")) {
      this.utils.displayToast(
        "Google",
        `Le login Google n'est disponible qu'en application native pour le moment`
      );
      return;
    }

    this.gp
      .login({})
      .then((user) => {
        console.warn("GOOGLE", user);
        this.registerToService(user);
      })
      .catch((err) => {
        this.utils.displayToast("Google", "Erreur lors du login Google");
        console.error("GOOGLE ERROR", err);
      });
  }

  connectWithFacebook() {
    if (!this.utils.platform.is("cordova")) {
      this.utils.displayToast(
        "Facebook",
        `Le login Facebook n'est disponible qu'en application native pour le moment`
      );
      return;
    }

    this.fb
      .login(["public_profile", "user_photos", "email", "user_birthday"])
      .then((res: FacebookLoginResponse) => {
        if (res.status == "connected") {
          // const userID = res.authResponse.userID;
          // const accessToken = res.authResponse.accessToken;

          this.fb
            .api("/me?fields=name,gender,birthday,email", [])
            .then((userFacebook) => {
              let user = new User();
              user.email = userFacebook.email;
              user.uuid = userFacebook.id; //same as res.authResponse.userID
              user.name = userFacebook.name;
              try {
                user.birthday = new Date(userFacebook.birthday);
              } catch (e) {
                console.error(e);
              }

              this.registerToService(user);
            });
        } else {
          this.utils.displayToast("Facebook", `Erreur lors du login Facebook`);
          console.error(res);
        }
      })
      .catch((e) => {
        this.utils.displayToast(
          "Facebook",
          `Erreur lors du login avec Facebook`
        );
        console.error(e);
      });
  }

  connectAnonymous() {
    let user = new User();

    if (!this.utils.platform.is("cordova")) {
      user.uuid = "CONNECTION_WEB";
      this.registerToService(user);
    } else {
      this.utils.uniqueDeviceID.get().then((uuid) => {
        user.uuid = uuid;
        this.registerToService(user);
      });
    }
  }

  registerToService(user: User = new User()) {
    // TODO Open user session and redirect to the next page

    console.log(user);

    this.api
      .createAccount$(user)
      .concatMap((createAccountResponse) => {
        if (createAccountResponse && createAccountResponse.success) {
          if (createAccountResponse.newUser) {
            this.utils.displayToast("Compte créé!");
            return this.api.login$(user);
          } else {
            this.utils.displayToast("Compte existant. Login...");
            return this.api.login$(user);
          }
        } else {
          return Observable.throw(
            "Compte non créé: " + createAccountResponse.error
          );
        }
      })
      .subscribe(
        (res) => {},
        (err) => {
          if (!err) {
            return this.utils.displayToast("Erreur avec l'API PointLocator");
          } else if (err.message) {
            return this.utils.displayToast(err.message);
          } else if (err.error) {
            return this.utils.displayToast(err.error);
          } else {
            return this.utils.displayToast(JSON.stringify({ erreur: err }));
          }
        }
      );
  }

  openTerms() {
    this.utils.displayModal(TermsModal);
  }
}
