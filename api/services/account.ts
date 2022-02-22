import {NextFunction, Request, Response} from 'express';
import {IUser, User} from "../../client/src/models/models";
import {addObjectToCollection$, getCollection$, updateObject$} from "./api-generic";
import {Collection, ObjectId} from "mongodb";
import {Collections} from "../const/collections";
import {Observable} from "rxjs";
import {HttpStatus} from "../const/http-status";
import {sha1Hash} from "../tools/sha1";
import moment = require("moment");


interface Session {
    _id?: number | string,
    loginDate: Date,
    expiration: Date,
    user: IUser,
    anonymousConnection?:boolean
}

export const registerAccountService = function (req: Request, res: Response, next: NextFunction) {

    let user: IUser = req.body;
    let userCollect: Collection;
    let newUser = false;
    let anonymousConnection = user.uuid && !user.password;


    getCollection$(Collections.users)
        .concatMap(collect => {
            userCollect = collect;
            if (user.email && user.password) {
                return userCollect.findOne({email: user.email})
            }else if(anonymousConnection){
                return userCollect.findOne({uuid: user.uuid})
            } else {
                return Observable.throw('Il manque des parametres pour cree votre compte.')
            }
        })
        .concatMap((userExist: IUser) => {
            if (userExist && userExist._id) {
                newUser = false;
                return Observable.of(userExist)
            } else {
                newUser = true;
                user.password = sha1Hash(user.password);
                return addObjectToCollection$(user)(userCollect);
            }
        })
        .subscribe(
            userResult => {
                delete userResult.password;
                return res.json({
                    newUser,
                    success: true,
                    user: userResult
                })
            },
            error => {
                if (error && error.message) {
                    res.json({error: error.message, success: false, newUser: false, user: null})
                } else {
                    res.json({error, success: false, newUser: false, user: null})
                }
            }
        )

};

export const loginService = function (req: Request, res: Response, next: NextFunction) {

    let user: IUser = req.body;
    let userCollect: Collection;
    let sessionCollect: Collection;

    let anonymousConnection = user.uuid && !user.password;

    Observable.zip(getCollection$(Collections.users), getCollection$(Collections.sessions))
        .concatMap(collect => {
            userCollect = collect[0];
            sessionCollect = collect[1];

            if (user.email && user.password) {
                return userCollect.findOne({$and:[{email: user.email},{password:sha1Hash(user.password)}]})
            }else if(anonymousConnection){
                return userCollect.findOne({uuid: user.uuid})
            } else {
                return Observable.throw('Il manque des parametres pour vous authentifier.')
            }
        })
        .concatMap((userExist: IUser) => {
            if (!userExist || !userExist._id) {
                return Observable.throw('Mauvais login ou mot de passe');
            } else {

                delete userExist.password;

                let nextYear = new Date();
                nextYear.setFullYear(nextYear.getFullYear() + 1);

                let session: Session = {
                    loginDate: new Date(),
                    expiration: nextYear,
                    user: userExist,
                    anonymousConnection:anonymousConnection
                };

                //todo reuse old session id if we havent expired date
                return addObjectToCollection$(session)(sessionCollect);
            }

        })
        .subscribe(
            (sessionResult: Session) => {
                sessionResult._id = sessionResult && sessionResult._id && sessionResult._id.toString();
                res.cookie('sessionId', sessionResult._id, {
                    maxAge: 31536000000,
                    httpOnly: true,
                });
                res.json(sessionResult)
            },
            error => {
                if(error && error.message){
                    res.json(error)
                }else if (error){
                    res.json({error})
                }else{
                    res.json({error:{message:'Le systeme de login ne fonctionne pas'}})
                }
            }
        )

};


export const checkSession = function (req: Request, res: Response, next: NextFunction) {

    //Only to test the session cookie

    let sessionCollect: Collection;

    console.log('Cookie:',req.cookies);

    getCollection$(Collections.sessions)
        .concatMap(collect => {
            sessionCollect = collect;
            if (req.cookies.sessionId) {
                return sessionCollect.findOne({_id: new ObjectId(req.cookies.sessionId)})
            } else {
                return Observable.throw('No active session')
            }
        })
        .concatMap((sessionExist: Session) => {
            if (!sessionExist || !sessionExist._id) {
                return Observable.throw('No such session');
            } else {
                if (moment(sessionExist.expiration).isAfter(moment())) {

                    //TODO pas de limite de temps
                    let nextYear = new Date();
                    nextYear.setFullYear(nextYear.getFullYear() + 1);
                    sessionExist.expiration = nextYear;

                    return updateObject$(sessionExist)(sessionCollect);
                } else {
                    return Observable.throw('Session expired, please login again');
                }
            }
        })
        .subscribe(
            sessionResult => {
                sessionResult._id = sessionResult._id.toString();
                res.locals.session = sessionResult;
                res.cookie('sessionId', sessionResult._id, {
                    maxAge: 31536000000,
                    httpOnly: true,
                });
                next();
            },
            error => {
                let errorMessage = (error && error.message)? error.message : typeof error === 'object' ? JSON.stringify(error): error;
                res.status(HttpStatus.UNAUTHORIZED).json({error:errorMessage})
            }
        )

};



export const getAccount = function (req: Request, res: Response, next: NextFunction) {

    let userCollect: Collection;

    getCollection$(Collections.users)
        .concatMap(collect => {
            userCollect = collect;
            return userCollect.findOne({_id: new ObjectId(res.locals.session.user._id)})
        })
        .concatMap((userExist: User) => {
            if (!userExist || !userExist._id) {
                return Observable.throw('Erreur avec votre session, veuillez vous logguer de nouveau');
            } else {
                return Observable.of(userExist);
            }
        })
        .subscribe(
            userExist => res.json(userExist),
            error => {
                let errorMessage = (error && error.message)? error.message : typeof error === 'object' ? JSON.stringify(error): error;
                res.status(HttpStatus.BAD_REQUEST).json({error:errorMessage})
            }
        )

};


export const clearSession = function (req: Request, res: Response, next: NextFunction) {

    let sessionCollect: Collection;

    getCollection$(Collections.sessions)
        .concatMap(collect => {
            sessionCollect = collect;
            console.log(new ObjectId(res.locals.session._id));
            return sessionCollect.deleteOne({_id: new ObjectId(res.locals.session._id)})
        })
        .subscribe(
            result => res.json(result),
            error => {
                let errorMessage = (error && error.message) ? error.message : typeof error === 'object' ? JSON.stringify(error) : error;
                res.status(HttpStatus.BAD_REQUEST).json({error: errorMessage})
            }
        )

};