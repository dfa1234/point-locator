import { google as googleApis, GoogleApis } from 'googleapis';
import * as fs from 'fs';
import { Observable, Observer } from 'rxjs';
import { OAuth2Client } from 'google-auth-library';

const google: GoogleApis = googleApis;

interface CredentialGAPI {
    installed: {
        client_id: string,
        project_id: string,
        auth_uri: string,
        token_uri: string,
        auth_provider_x509_cert_url: string,
        client_secret: string,
        redirect_uris: string[],
    };
}

interface TokenGApi {
    access_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
    expiry_date: Date;
}

export class MailServer {

    public sendMessage$ = (from: string) => ({ to, subject, message }: { to: string, subject: string, message: string }) => {
        return this.getOAuth2Client$
            .concatMap(auth => this.sendMessageWithAuth$(auth)(({ from, to, subject, message })));
    }

    private TOKEN_PATH = __dirname + '/token.json'; // +'/services/mails/'

    private CREDENTIALS_PATH = __dirname + '/credentials.json';

    private readFile$ = (path: string) => Observable.create((observer: Observer<any>) => {
        fs.readFile(path, (err, file) => {
            if (err) observer.error(err);
            else observer.next(JSON.parse(file.toString()));
            observer.complete();
        });
    })

    private getOAuth2ClientFromCredential$ = (credentials: CredentialGAPI): Observable<OAuth2Client> => {
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        return this.readFile$(this.TOKEN_PATH)
            .map(token => {
                oAuth2Client.setCredentials(token);
                return oAuth2Client;
            });
    }

    private getOAuth2Client$: Observable<OAuth2Client> =
        this.readFile$(this.CREDENTIALS_PATH)
            .concatMap(credentials => this.getOAuth2ClientFromCredential$(credentials));

    private makeBody = (from, to, subject, message) => {

        const subNorm = subject.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const str = [
            'Content-Type: text/plain; charset="UTF-8"\n',
            'MIME-Version: 1.0\n',
            'Content-Transfer-Encoding: 7bit\n',
            'to: ', to, '\n',
            'from: ', from, '\n',
            'subject: ', subNorm, '\n\n',
            message,
        ].join('');
        return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    }

    private sendMessageWithAuth$ = (auth: OAuth2Client) =>
        ({ from, to, subject, message }: { from: string, to: string, subject: string, message: string }) =>
            Observable.create((observer: Observer<boolean | any>) => {
                const raw = this.makeBody(from, to, subject, message);

                const gmail = google.gmail({ version: 'v1', auth });
                gmail.users.messages.send({
                    auth,
                    userId: 'me',
                    resource: {
                        raw,
                    },
                } as any,                        (err, response) => {
                    const OK = response.statusText === 'OK';
                    const SENDED = response && response.data && response.data.labelIds && response.data.labelIds.length && response.data.labelIds[0] === 'SENT';

                    if (!err && OK && SENDED) {
                        observer.next(true);
                    } else {
                        observer.error(err || response);
                    }
                    observer.complete;
                });
            })

}
