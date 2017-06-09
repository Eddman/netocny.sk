import {Response, Request, NextFunction} from 'express';

import {AbstractRouter} from '../abstract.router';
import {AuthResponse, JWTUtils} from './jwt/jwt.utils';
import {userModel} from './model/user.model';
import {config} from '../../config';

export class AuthRouter extends AbstractRouter {

    constructor() {
        super(`/auth/realms/${config.authRealm}/protocol/openid-connect`);

        this.router.post('/token', (req: Request, res: Response, next: NextFunction) => {
            this.login(req, res, next);
        });

        this.router.get('/user_info',
            JWTUtils.authRequired,
            (req: Request, res: Response) => {
                res.json({username: req.token.username});
                res.end();
            });

        this.registerErrorHandler();
    }

    private login(req: Request, res: Response, next: NextFunction) {
        let username = req.body.username;
        let password = req.body.password;
        let refresh_token = req.body.refresh_token;
        let grant_type = req.body.grant_type;
        let client_id = req.body.client_id;
        if (grant_type !== 'password' && grant_type != 'refresh_token') {
            res.sendStatus(400);
            return res.end();
        }

        if (client_id !== config.authClientID) {
            res.sendStatus(400);
            return res.end();
        }

        if (grant_type === 'password') {
            userModel.validateUser(username, password)
                .then(() => JWTUtils.generateToken(username))
                .then((token: AuthResponse) => {
                    res.json(token);
                    res.end();
                }).catch((err) => next(err));
        } else {
            JWTUtils.refreshToken(refresh_token)
                .then((token: AuthResponse) => {
                    res.json(token);
                    res.end();
                }).catch((err) => next(err));
        }
    }
}