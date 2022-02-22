import { describe, it } from 'mocha';
import { MailServer } from './mail-server';
import * as assert from 'assert';

describe('MAIL', () => {

    it('should send a email', (done) => {

        const mServer = new MailServer();
        mServer.sendMessage$('dfaure123+sender@gmail.com')({
            to: 'dfaure123+receiver@gmail.com',
            subject: 'mail test à ç _ è - (  é é é ',
            message: `successfully tested on ${new Date().toLocaleString('fr-FR', { hour12:false })} `,
        }).subscribe(
            res => {
                assert.ok(res);
                done();
            },
            err => {
                assert.fail(err);
                done();
            },
        );

    });

});
