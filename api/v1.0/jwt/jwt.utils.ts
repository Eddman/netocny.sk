import {NextFunction, Response, Request} from 'express';
import {JsonWebTokenError, NotBeforeError, sign, TokenExpiredError, verify as verifyToken} from 'jsonwebtoken';

import {config} from '../../../config';
import {FileStorage} from '../model/file.storage';

declare global {
    namespace Express {
        export interface Request {
            token: TokenData
        }
    }
}

export interface TokenData {
    username: string;
    typ?: string;

    //The issuer of the token.
    iss?: string;
    //The subject of the token.
    sub?: string;
    //The audience of the token.
    aud?: string;
    // This will probably be the registered claim most often used. This will define the expiration in NumericDate value.
    // The expiration MUST be after the current date/time.
    exp: number;
    //Defines the time before which the JWT MUST NOT be accepted for processing.
    nbf?: number;
    //The time the JWT was issued. Can be used to determine the age of the JWT.
    iat?: number;
    //Unique identifier for the JWT. Can be used to prevent the JWT from being replayed.
    // This is helpful for a one time use token.
    jti?: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
}

export class JWTUtils {

    private static cert: string;

    private static verify(token: string, cert: string): Promise<object> {
        return new Promise((resolve, reject) =>
            verifyToken(token, cert, {
                    issuer  : config.jwtISS,
                    audience: config.jwtAUD
                },
                (err: JsonWebTokenError | NotBeforeError | TokenExpiredError, decoded: object) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(decoded);
                }));
    }

    private static newToken(cert: string, data: object = {}): Promise<string> {
        return new Promise((resolve, reject) =>
            sign(data, cert, {
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

        if (config.production) {
            return FileStorage.readFile({
                objectId  : config.jwtKey,
                bucketName: config.file_bucket
            }).then((cert: string) => {
                JWTUtils.cert = cert;
                return JWTUtils.cert;
            });
        } else {
            JWTUtils.cert = 'some dummy key';
            return Promise.resolve(JWTUtils.cert);
        }
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
            .then((decoded: any) => {
                req.token = decoded;
                next();
            })
            .catch(() => {
                res.sendStatus(401);
                return res.end();
            });
    }

    public static generateToken(username: string): Promise<AuthResponse> {
        return JWTUtils.getCert()
            .then((cert: string) =>
                JWTUtils.newToken(cert, {
                    username    : username,
                    allowRefresh: true
                }).then((refreshToken: string) =>
                    JWTUtils.newToken(cert, {
                        username: username
                    }).then((acessToken: string) => ({
                        access_token : acessToken,
                        refresh_token: refreshToken
                    }))));
    }

    public static refreshToken(refreshToken: string): Promise<AuthResponse> {
        return JWTUtils.getCert()
            .then((cert: string) => JWTUtils.verify(refreshToken, cert))
            .then((decoded: any) => {
                if (decoded.allowRefresh !== true) {
                    return Promise.reject({message: 'Invalid refresh_token!'});
                }
                return Promise.resolve(decoded.username);
            })
            .then(JWTUtils.generateToken);
    }

}
