import {Request, Response} from "express";
import {SearchEatPoints} from "../../client/src/models/models";
import {getCollection$} from "./api-generic";
import {Collections} from "../const/collections";
import {Observable} from "rxjs";
import {ObjectId} from "bson";

const b64DecodeUnicode = (str) => {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    const atob = (b64Encoded) => Buffer.from(b64Encoded, 'base64').toString();
    return decodeURIComponent(atob(str).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
};


export const getEatPoints = (req: Request, res: Response) => {

    let search: SearchEatPoints = null;
    try {
        search = JSON.parse(b64DecodeUnicode(req.query.search));
    } catch (e) {
        search = null;
        console.log('DEBUG ERROR SEARCH', e);
    }

    if (!search) {
        return res.sendStatus(400).json({error: 'no search param'});
    }

    let query: any = {
        $and: []
    };

    if (search.bounds && search.bounds.maxXLong) {
        query.$and.push(
            {"address.lat": {$gte: search.bounds.minYLat}},
            {"address.lat": {$lte: search.bounds.maxYLat}},
            {"address.lon": {$gte: search.bounds.minXLong}},
            {"address.lon": {$lte: search.bounds.maxXLong}}
        )
    }

    if (search.type) {
        query.$and.push(
            {"typeEP": search.type}
        )
    }

    if (search.creatorId) {
        query.$and.push(
            {"creator._id": new ObjectId(search.creatorId)}
        )
    }

    if (search.name) {
        query.$and.push(
            {"name": {$regex:".*"+search.name+".*"}}
        )
    }

    console.log('DEBUG SEARCH', query);
    getCollection$(Collections.eatpoints).concatMap(
        collectEp => Observable.fromPromise(collectEp.find(query).toArray())
    ).subscribe(result => {
        res.json(result)
    })


};