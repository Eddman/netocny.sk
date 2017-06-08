import {Response, Request, NextFunction} from 'express';

import {AbstractRouter} from '../abstract.router';
import {JWTUtils} from './jwt/jwt.utils';

export class AuthRouter extends AbstractRouter {

    constructor() {
        super('/auth');

        this.router.post('/login', (req: Request, res: Response, next: NextFunction) => {
            this.login(req, res, next);
        });

        this.registerErrorHandler();
    }

    private login(req: Request, res: Response, next: NextFunction) {
        JWTUtils.generateToken().then((token: string) => {
            res.json({id_token: token});
            res.end();
        }).catch((err) => next(err));
    }
}