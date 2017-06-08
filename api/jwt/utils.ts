import * as https from 'https';
import * as http from 'http';
import {IncomingMessage, RequestOptions} from 'http';

export function isRSAKey(key: any) {
    return key.use === 'sig' && key.kty === 'RSA' && key.kid && ((key.x5c && key.x5c.length) || (key.n && key.e));
}

export function certToPEM(cert: string): string {
    let pem = cert.match(/.{1,64}/g).join('\n');
    return `-----BEGIN CERTIFICATE-----\n${pem}\n-----END CERTIFICATE-----\n`;
}

function prepadSigned(hexStr: string): string {
    const msb = hexStr[0];
    if (msb < '0' || msb > '7') {
        return `00${hexStr}`;
    }
    return hexStr;
}

function toHex(number: number): string {
    const nstr = number.toString(16);
    if (nstr.length % 2) {
        return `0${nstr}`;
    }
    return nstr;
}

function encodeLengthHex(n: number): string {
    if (n <= 127) {
        return toHex(n);
    }
    const nHex = toHex(n);
    const lengthOfLengthByte = 128 + nHex.length / 2;
    return toHex(lengthOfLengthByte) + nHex;
}

/*
 * Source: http://stackoverflow.com/questions/18835132/xml-to-pem-in-node-js
 */
export function rsaPublicKeyToPEM(modulusB64: string, exponentB64: string): string {
    const modulus = new Buffer(modulusB64, 'base64');
    const exponent = new Buffer(exponentB64, 'base64');
    const modulusHex = prepadSigned(modulus.toString('hex'));
    const exponentHex = prepadSigned(exponent.toString('hex'));
    const modlen = modulusHex.length / 2;
    const explen = exponentHex.length / 2;

    const encodedModlen = encodeLengthHex(modlen);
    const encodedExplen = encodeLengthHex(explen);
    const encodedPubkey = '30' +
        encodeLengthHex(modlen + explen + encodedModlen.length / 2 + encodedExplen.length / 2 + 2) +
        '02' + encodedModlen + modulusHex +
        '02' + encodedExplen + exponentHex;

    const der = new Buffer(encodedPubkey, 'hex')
        .toString('base64');

    let pem = `-----BEGIN RSA PUBLIC KEY-----\n`;
    pem += `${der.match(/.{1,64}/g).join('\n')}`;
    pem += `\n-----END RSA PUBLIC KEY-----\n`;
    return pem;
}

export function getJSON(url: string): Promise<any> {
    let url_parts = url
            .match(/^((https?)\:\/\/)?(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/) || [];
    let options: RequestOptions = {
        host   : url_parts[4],
        port   : url_parts[5] ? parseInt(url_parts[5], 10) : undefined,
        path   : url_parts[6],
        headers: {
            'Accept': 'application/json'
        }
    };
    let prot = url_parts[2] === 'https' ? https : (http as any);

    return new Promise((resolve, reject) => {
        let req = prot.request(options, (res: IncomingMessage) => {
            let output = '';
            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                output += chunk;
            });

            res.on('end', function () {
                let obj = JSON.parse(output);
                resolve(obj);
            });
        });

        req.on('error', (err: Error) => reject(err));

        req.end();
    });
}
