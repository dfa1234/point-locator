import * as express from 'express';
import {NextFunction, Request, Response} from 'express';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import {serverConf} from './config';
import {HttpStatus} from './const/http-status';
import {uploadPictureService} from './services/upload';
import {checkSession, clearSession, getAccount, loginService, registerAccountService} from "./services/account";
import {delObject, postObject, putObject} from "./services/api-generic";
import {Collections} from "./const/collections";
import {getEatPoints} from "./services/eatpoints";
import bodyParser = require('body-parser');

const logger = require('morgan');
const sslRootCas = require('ssl-root-cas');
const cookieParser = require('cookie-parser');

// SERVER CONFIGURATION
const app = express();
app.use(bodyParser.json({limit: '6mb'}));
app.use(cookieParser());
app.use(logger('[:date[clf]] - :remote-addr - :method - :url - :status - :response-time ms'));
app.use((req: Request, res: Response, next: NextFunction) => {
    const origin: any = req.get('origin') || '*';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers',
        'X-Requested-With, ' +
        'X-HTTP-Method-Override, ' +
        'Content-Type, ' +
        'Accept,' +
        'Access-Control-Allow-Credentials,' +
        'Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(HttpStatus.OK);
    } else {
        next();
    }
});

// ROUTES
app.get('/', (req: Request, res: Response, next: NextFunction) => res.send('👍'));

app.get('/version', (req, res) => res.json({version:"1.0.7"}));

app.use('/images', express.static('cache/uploads'));

app.post('/upload', uploadPictureService);

app.post('/login', loginService);
app.get('/protected', checkSession, (req, res) => res.json(res.locals.session));
app.delete('/protected', checkSession, clearSession);

app.post('/account', registerAccountService);
app.get('/account', checkSession, getAccount);
//TODO protect from differents users
app.put('/account', checkSession, putObject(Collections.users));

//TODO protect from differents users
app.post('/eatpoint', checkSession, postObject(Collections.eatpoints));
//TODO protect from differents users
app.put('/eatpoint', checkSession, putObject(Collections.eatpoints));
//TODO protect from differents users
app.delete('/eatpoint/:id', checkSession, delObject(Collections.eatpoints));
app.get('/eatpoints', checkSession, getEatPoints);

app.get('*', (req: Request, res: Response, next: NextFunction) => res.send('👎'));

// START
http.createServer(app).setTimeout(10000).listen(serverConf.port, () => {
    console.log('server started');
});
if (fs.existsSync('./tls/privkey.pem') && fs.existsSync('./tls/fullchain.pem')) {
    sslRootCas.inject();
    https.createServer({
        cert: fs.readFileSync('./tls/fullchain.pem'),
        key: fs.readFileSync('./tls/privkey.pem'),
    }, app).setTimeout(10000).listen(serverConf.portSSL, () => {
        console.log('server ssl started');
    });
}
