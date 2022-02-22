export enum IMAGES_ORIENTATION {
  Up = 1,
  Down = 3,
  Right = 6,
  Left = 8,
  UpMirrored = 2,
  DownMirrored = 4,
  LeftMirrored = 5,
  RightMirrored = 7,
  NotJpeg = -1,
  NotDefined = -2
}

export enum IMAGES_MIMES {
  JPEG = 'image/jpeg',
  JPG = 'image/jpg',
  PNG = 'image/png',
  GIF = 'image/gif',
  WEBP = 'image/webp',
}

export enum IMAGES_TYPES {
  jpg = 'jpeg',
  jpeg = 'jpg',
  gif = 'gif',
  png = 'png',
  webp = 'webp',
}

export interface ISimpleImage {
  _id?: any;
  name: string;
  type: IMAGES_TYPES;
  url?: string;
  data?: string;
  orientation: IMAGES_ORIENTATION;
  mime: IMAGES_MIMES;
  created: Date;
}


export class SimpleImage implements ISimpleImage {
  _id = null;
  name = '';
  mime = IMAGES_MIMES.JPEG;
  type = IMAGES_TYPES.jpg;
  url = null;
  orientation = IMAGES_ORIENTATION.Up;
  data = '';
  created = new Date();
}
