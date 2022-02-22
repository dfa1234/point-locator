import {Directive, EventEmitter, HostListener, OnInit, Output, Renderer2} from "@angular/core";
import {Utils} from "../../providers/utils.service";
import {IMAGES_MIMES, IMAGES_ORIENTATION, IMAGES_TYPES, SimpleImage} from "../../models/image";
import {Camera, CameraOptions} from "@ionic-native/camera";


@Directive({
  selector: '[pxImportPicture]'
})
export class PxImportPictureDirective implements OnInit {

  @Output('result') result = new EventEmitter<SimpleImage>();

  constructor(private renderer: Renderer2,
              private utilsService: Utils,
              private camera:Camera) {
  }

  ngOnInit() {
  }

  static getOrientation(file: File, callback: (result: IMAGES_ORIENTATION) => void) {
    let reader = new FileReader();
    try {
      reader.onload = function ($event) {
        let view = new DataView(reader.result);
        if (view.getUint16(0, false) != 0xFFD8) return callback(-2);
        let length = view.byteLength, offset = 2;
        while (offset < length) {
          let marker = view.getUint16(offset, false);
          offset += 2;
          if (marker == 0xFFE1) {
            if (view.getUint32(offset += 2, false) != 0x45786966) return callback(-1);
            let little = view.getUint16(offset += 6, false) == 0x4949;
            offset += view.getUint32(offset + 4, little);
            let tags = view.getUint16(offset, little);
            offset += 2;
            for (let i = 0; i < tags; i++)
              if (view.getUint16(offset + (i * 12), little) == 0x0112)
                return callback(view.getUint16(offset + (i * 12) + 8, little));
          } else if ((marker & 0xFF00) != 0xFF00) break;
          else offset += view.getUint16(offset, false);
        }
        return callback(-1);
      };
      reader.readAsArrayBuffer(file);
    } catch (e) {
      return callback(0);
    }

  }


  static newSimpleDocFromUpload(readerResult: string): SimpleImage {
    let image = new SimpleImage();
    let dataFromFile = readerResult.split(';base64,');

    //il reste dans dataFromFile[0] un truc du genre 'data:image/png', on enleve 'data:'
    image.mime = dataFromFile[0].substr(5, dataFromFile[0].length) as IMAGES_MIMES;

    if (image.mime !== IMAGES_MIMES.JPEG
      && image.mime !== IMAGES_MIMES.GIF
      && image.mime !== IMAGES_MIMES.JPG
      && image.mime !== IMAGES_MIMES.WEBP
      && image.mime !== IMAGES_MIMES.PNG) {
      console.error('Barrez vous con de mimes:', image.mime);
      return null;
    }

    image.type = image.mime && image.mime.length && image.mime.split('/').length > 1 && image.mime.split('/')[1] as IMAGES_TYPES;

    image.data = dataFromFile && dataFromFile.length && dataFromFile.length > 1 && dataFromFile[1];
    return image;
  }


  /**
   * return a callback with the new image
   * @param render
   * @param callBack
   */
  static uploadFile(render: Renderer2, callBack: (image: SimpleImage) => void) {
    let inputElement = render.createElement("input");
    render.setStyle(inputElement, "display", "none");
    render.setProperty(inputElement, "type", "file");

    render.listen(inputElement, "click", ($event) => {
      //console.log('javascript teachable moment:');
      //console.log('This is MouseEvent:',$event);
      //console.log('This is our Input:',$event.target);
      $event.target.value = null;
    });


    render.listen(inputElement, "change", ($event) => {
      let file: File = $event.target.files[0];

      let myReader: FileReader = new FileReader();

      myReader.onloadend = (e) => {
        try {
          let image = PxImportPictureDirective.newSimpleDocFromUpload(myReader.result);
          if (!image) {
            //wrong format
            callBack(null);
          } else {
            PxImportPictureDirective.getOrientation(file, result => {
              image.orientation = result;
              callBack(image);
            });
          }

        } catch (e) {
          console.error(`ERROR ${e}`);
          callBack(null);
        }
      };

      try {
        myReader.readAsDataURL(file);
      } catch (e) {
        console.error(`ERROR - probably no file have been selected: ${e}`);
        callBack(null);
      }

    });
    inputElement.click();
  }



  static newSimpleDocFromCamera(cameraResult: string,type = IMAGES_MIMES.JPG): SimpleImage {
    let image = new SimpleImage();
    image.mime = type;
    image.type = image.mime && image.mime.length && image.mime.split('/').length > 1 && image.mime.split('/')[1] as IMAGES_TYPES;
    image.data = cameraResult;
    return image;
  }

  // With upload version
  // @HostListener('click') onClick() {
  //   PxImportPictureDirective.uploadFile(this.renderer, (image) => {
  //     if (!image) {
  //       this.utilsService.displayAlert('Erreur de format', "Utilisez le format image uniquement (JPEG,PNG,GIF,WEBP)");
  //     } else {
  //       this.result.emit(image);
  //     }
  //   });
  // }

  @HostListener('click') onClick() {

    const cameraOptions: CameraOptions = {
      quality: 60,
      targetWidth: 3508 / 2,
      targetHeight: 3508 / 2,
      correctOrientation: true,
      allowEdit: true,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    };

    this.camera.getPicture(cameraOptions).then(
      (imageData: string) => {
        let image = PxImportPictureDirective.newSimpleDocFromCamera(imageData,IMAGES_MIMES.JPG);
        if (!image) {
          this.utilsService.displayToast("Utilisez le format image uniquement (JPEG,PNG,GIF,WEBP)");
        } else {
          this.result.emit(image);
        }
      }, e => {
        this.utilsService.displayToast('Impossible de prendre une photo sur cet appareil');
        console.error(e)
      });
  }

}
