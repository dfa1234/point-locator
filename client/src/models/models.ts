import {SimpleImage} from "./image";

export enum OBJ_TYPE {
  USER = 'user',
  EATPOINT = 'eatpoint',
  ADDRESS = 'address'
}


export enum EP_TYPES {
  Hunting = 'Chasse',
  Sweets = 'Confiseries',
  Gathering = 'Cueillette',
  Farms = 'Ferme',
  Forest = 'Forêt',
  Fruits_and_Vegetables = 'Fruit et legumes',
  Essential_Oils = 'Huiles essentielles',
  Milk_and_Dairies = 'Produit laitier',
  Market = 'Marché',
  Honey = 'Miel',
  Eggs = 'Oeuf',
  Fishing = 'Pêche',
  Fish = 'Poisson',
  Meat = 'Viande',
  Wine = 'Vin',
  Water = 'Eau',
  Other = 'Autres'
}

export class Product {
  name: string;
  image: SimpleImage;
  price: string;
  description: string;
}

export interface IEatPoint {
  _id: number;
  slogan: string;
  typeEP: EP_TYPES;
  phone?: string;
  email?: string;
  products: Product[];
  images: SimpleImage[];
  openingHours: string[];
}

export class EatPoint implements IEatPoint, IMapItem {
  _id: number;
  name = '';
  slogan = '';
  typeItem = OBJ_TYPE.EATPOINT;
  typeEP = EP_TYPES.Other;
  address: Address = new Address();
  phone? = '';
  email? = '';
  products = [];
  images = [];
  creator: User = null;
  openingHours = new Array(7);

  constructor(){
    this.openingHours = ['','','','','','',''];
  }

}


export interface SearchEatPoints {
  name?: string,
  type?: EP_TYPES,
  bounds?: BoundsMap,
  creatorId?: string
}

export interface IAddress {
  name?: string;
  city?: string;
  country?: string;
  zipCode?: string;
  lat?: number;
  lon?: number;
}

export interface IMapItem {
  address: IAddress;
  name: string;
  typeItem: OBJ_TYPE;
}

export interface BoundsMap {
  minXLong: number;
  maxXLong: number;
  minYLat: number;
  maxYLat: number;
}

export class Address implements IAddress {
  name: string = '';
  city?: string = '';
  country?: string = '';
  zipCode?: string = '';
  lat: number = null;
  lon: number = null;
  typeItem = OBJ_TYPE.ADDRESS;

  toString() {
    return Address.formatToString(this);
  }

  static formatToString(thisAddress: Address) {
    let result = '';
    if (thisAddress.name)
      result += thisAddress.name + ' ';
    if (thisAddress.zipCode)
      result += thisAddress.zipCode + ' ';
    if (thisAddress.city)
      result += thisAddress.city + ' ';
    if (thisAddress.country)
      result += thisAddress.country;
    return result;
  }

}

export interface IUser {
  _id?: number;
  name: string;
  email?: string;
  password: string;
  phone?: string;
  avatar: SimpleImage;
  uuid?: string;
  birthday?: Date;
}

export class User implements IUser, IMapItem {
  _id? = null;
  name = '';
  email? = '';
  phone? = '';
  password = '';
  birthday = null;
  avatar = null;
  uuid = null;
  typeItem = OBJ_TYPE.USER;
  address: IAddress = new Address();
}


export interface Session {
  _id?: number | string,
  loginDate: Date,
  expiration: Date,
  user: IUser,
  anonymousConnection?: boolean
}
