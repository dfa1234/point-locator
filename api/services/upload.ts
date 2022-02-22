import * as fs from 'fs';
import {NextFunction, Request, Response} from 'express';


const UPLOAD_DIR = './cache/uploads';

const newGUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});


export const uploadPictureService = function (req: Request, res: Response, next: NextFunction) {

    if (!req.body || !req.body.data || !req.body.type) {
        return res.json({error: 'wrong format'});
    }

    const base64Data = req.body.data;
    const type = req.body.type.toLowerCase();
    let name = req.body.name;

    if (name) {
        name = name.toLowerCase().normalize().replace(/\s+/, '');
        if (name.length > 10) {
            name = name.substring(0, 9);
        }
    }

    const ACCEPTED_MIMES = [
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/png',
        'image/webp',
        'application/pdf',
    ];

    const ACCEPTED_EXTENTIONS = [
        'jpeg',
        'jpg',
        'gif',
        'png',
        'webp',
        'pdf',
    ];

    let extension = type;

    if (ACCEPTED_EXTENTIONS.indexOf(type) < 0 && ACCEPTED_MIMES.indexOf(type) < 0) {
        return res.json({error: 'wrong type'});
    } else if (ACCEPTED_MIMES.indexOf(type) >= 0) {
        switch (type) {
            case 'image/jpeg':
                extension = 'jpeg';
                break;
            case  'image/jpg':
                extension = 'jpg';
                break;
            case      'image/gif':
                extension = 'gif';
                break;
            case      'image/png':
                extension = 'png';
                break;
            case      'image/webp':
                extension = 'webp';
                break;
            case     'application/pdf':
                extension = 'pdf';
                break;
        }
    } else if (ACCEPTED_MIMES.indexOf(extension) >= 0) {
        extension = type;
    }


    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR);
    }

    let fileName = '';
    if (name) {
        fileName = newGUID() + '-' + name + '.' + extension;
    } else {
        fileName = newGUID() + '.' + extension;
    }

    fs.writeFile(UPLOAD_DIR + '/' + fileName, base64Data, 'base64', error => {
        if (error) {
            res.json({error, success: false});
        } else {
            return res.json({fileName, success: true});
        }
    });


};
