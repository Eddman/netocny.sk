import {NextFunction, Response, Request} from 'express';
import {JsonWebTokenError, NotBeforeError, sign, TokenExpiredError, verify as verifyToken} from 'jsonwebtoken';

import {config} from '../../../config';
import {FileStorage} from '../model/file.storage';

export class JWTUtils {

    private static cert: string;

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

    private static newToken(cert: string): Promise<string> {
        return new Promise((resolve, reject) =>
            sign({}, cert, {
                    issuer   : config.jwtISS,
                    audience : config.jwtAUD,
                    expiresIn: '2h'
                },
                (err: Error, encoded: string) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(encoded);
                }));
    }

    private static getCert(): Promise<string> {
        if (JWTUtils.cert) {
            return Promise.resolve(JWTUtils.cert);
        }
        return FileStorage.readFile({
            objectId  : config.jwtKey,
            bucketName: config.file_bucket
        }).then((cert: string) => {
            JWTUtils.cert = cert;
            return JWTUtils.cert;
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
            .then((cert: string) => JWTUtils.verify(headerParts[1], cert))
            .then(() => next())
            .catch(() => {
                res.sendStatus(401);
                return res.end();
            });
    }

    public static generateToken(): Promise<string> {
        return JWTUtils.getCert()
            .then((cert: string) => JWTUtils.newToken(cert));
    }

}
