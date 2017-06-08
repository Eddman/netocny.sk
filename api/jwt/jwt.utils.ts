import {NextFunction, Response, Request} from 'express';
import {JsonWebTokenError, NotBeforeError, TokenExpiredError, verify as verifyToken} from 'jsonwebtoken';

import {config} from '../../config';
import {certToPEM, getJSON, isRSAKey, rsaPublicKeyToPEM} from './utils';

export class JWTUtils {

    private static verify(token: string, cert: string): Promise<any> {
        return new Promise((resolve, reject) =>
            verifyToken(token, cert, {
                    issuer  : config.jwtISS,
                    audience: config.jwtAUD
                },
                (err: JsonWebTokenError | NotBeforeError | TokenExpiredError) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                }));
    }

    private static getCert(): Promise<string[]> {
        let url = config.openIdConnectUrl;
        return getJSON(url)
            .then((config: any) => getJSON(config.jwks_uri))
            .then((jwks: any) => {
                if (!jwks || !jwks.keys) {
                    return Promise.reject({
                        message: 'Could not retrieve JWT keys!',
                        code   : 500
                    });
                }
                return jwks.keys
                    .filter((key: any) => isRSAKey(key))
                    .map((key: any) => key.x5c ? certToPEM(key.x5c) : rsaPublicKeyToPEM(key.n, key.e));
            });
    }

    public static authRequired(req: Request, res: Response, next: NextFunction): void {
        let authorizationHeader = req.header('Authorization');
        if (!authorizationHeader) {
            res.sendStatus(401);
            return res.end();
        }

        let headerParts = authorizationHeader.split(' ');
        if (headerParts.length !== 2 || headerParts[0] !== 'Bearer') {
            res.sendStatus(401);
            return res.end();
        }

        JWTUtils.getCert()
            .then((cert: string[]) => JWTUtils.verify(headerParts[1], cert[0]))
            .then(() => next())
            .catch((err) => next(err));
    }

}
