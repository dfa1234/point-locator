import { Request, Response } from 'express';
import { Collection, DeleteWriteOpResultObject, MongoClient, ObjectID, UpdateWriteOpResult } from 'mongodb';
import { dbConf } from '../config';
import { Observable } from 'rxjs';

export const getCollection$ = (collectionName: string): Observable<Collection> => Observable.fromPromise(MongoClient.connect(dbConf.URI, { useNewUrlParser: true }))
    .map((clientMongo: MongoClient) => clientMongo.db(dbConf.database).collection(collectionName));

export const getAllObjects$ = (collection: Collection): Observable<any[]> => Observable.fromPromise(collection.find().toArray());

export const getObjectId$ = (_id: number) => (collection: Collection): Observable<any> => Observable.fromPromise(collection.findOne({ _id: new ObjectID(_id) }));

export const addObjectToCollection$ = (object: any) =>
    (collection: Collection): Observable<any> =>
        Observable.fromPromise(collection.insertOne(object)).map(res => res.ops[0]);

export const updateObject$ = (objectModified: any) =>
    (collection: Collection): Observable<any> => {
        const changeToCommit = Object.assign({}, objectModified);
        delete changeToCommit._id;
        return Observable.fromPromise(collection.updateOne({ _id: new ObjectID(objectModified._id) }, { $set: changeToCommit }, { upsert: false }))
            .map((res: UpdateWriteOpResult) => objectModified);
    };

export const delObject$ = (_id: string) =>
    (collection: Collection): Observable<DeleteWriteOpResultObject> =>
        Observable.fromPromise(collection.deleteOne({ _id: new ObjectID(_id) }));
        // result is like {n: number, ok: number}

export const subscribeService = operation => (collectionName: string) => (res: Response) =>
    getCollection$(collectionName)
        .concatMap(collection => operation(collection))
        .subscribe(
            result => res.json(result),
            error => res.json({ error }),
        );

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//      SERVICES
//

export const getObjects = (collectionName: string) => (req: Request, res: Response) => {
    subscribeService(getAllObjects$)(collectionName)(res);
};

export const postObject = (collectionName: string) => (req: Request, res: Response) => {
    subscribeService(addObjectToCollection$(req.body))(collectionName)(res);
};

export const putObject = (collectionName: string) => (req: Request, res: Response) => {
    subscribeService(updateObject$(req.body))(collectionName)(res);
};

export const delObject = (collectionName: string) => (req: Request, res: Response) => {
    subscribeService(delObject$(req.params.id))(collectionName)(res);
};

export const getObjectsRestrictOnlyTo = (restrict:string, collectionName: string) => (req: Request, res: Response) => {
    const query = {};
    query[restrict] = req.params.group;
    const getObjects$ = (collection: Collection): Observable<any[]> => Observable.fromPromise(collection.find(query).toArray());
    subscribeService(getObjects$)(collectionName)(res);
};
