import {authenticate, deserializeUser, initialize, session as passportSession, serializeUser, use} from 'passport';
import {Profile, Strategy} from 'passport-google-oauth20';

import {Application, Request, Response, NextFunction} from 'express';
import * as session from 'express-session';

import * as memcachedStoreFactory from 'connect-memcached';
let MemcachedStore: memcachedStoreFactory.MemcachedStoreConstructor = memcachedStoreFactory(session);

import {config} from '../../config';

import {AbstractRouter} from '../abstract.router';

export interface GoogleProfile {
    id: string;
    displayName: string;
    image: string;
}

class OAuth2Router extends AbstractRouter {

    constructor() {
        super('/auth');
    }

    public initialize(app: Application) {
        OAuth2Router.initializeSession(app);
        this.configurePassport();
        this.registerRoutes();
        app.use(this.path, this.router);
    }

    private static initializeSession(app: Application) {
        const sessionConfig: any = {
            resave           : false,
            saveUninitialized: false,
            secret           : config.sessionSecret,
            signed           : true
        };

        // In production use the App Engine Memcache instance to store session data,
        // otherwise fallback to the default MemoryStore in development.
        if (config.production && config.memcacheUrl) {
            sessionConfig.store = new MemcachedStore({
                hosts: [config.memcacheUrl]
            });
        }

        app.use(session(sessionConfig));

        app.use(initialize());
        app.use(passportSession());
    }

    private configurePassport(): void {
        use(new Strategy({
                clientID    : config.oauth2ClientId,
                clientSecret: config.oauth2ClientSecret,
                callbackURL : config.oauth2Callback,
                accessType  : 'offline'
            },
            (accessToken: string, refreshToken: string, profile: Profile, cb) => {
                cb(null, OAuth2Router.extractProfile(profile));
            }));
        serializeUser((user, cb) => {
            cb(null, user);
        });
        deserializeUser((obj, cb) => {
            cb(null, obj);
        });
    }

    private static extractProfile(profile: Profile): GoogleProfile {
        let imageUrl = '';
        if (profile.photos && profile.photos.length) {
            imageUrl = profile.photos[0].value;
        }
        return {
            id         : profile.id,
            displayName: profile.displayName,
            image      : imageUrl
        };
    }

    private registerRoutes() {
        this.router.get('/login',
            // Save the url of the user's current page so the app can redirect back to
            // it after authorization
            (req: Request, res: Response, next: NextFunction) => {
                if (req.query.return) {
                    req.session.oauth2return = req.query.return;
                }
                next();
            },
            // Start OAuth 2 flow using Passport.js
            authenticate('google', {scope: ['email', 'profile']})
        );

        this.router.get('/google/callback',
            // Finish OAuth 2 flow using Passport.js
            authenticate('google'),
            // Redirect back to the original page, if any
            (req: Request, res: Response) => {
                const redirect = req.session.oauth2return || '/';
                delete req.session.oauth2return;
                res.redirect(redirect);
            }
        );

        this.router.get('/logout', (req: Request, res: Response) => {
            req.logout();
            res.redirect('/');
        });

        this.registerErrorHandler();
    }
}

export function initializeOAuth2(app: Application) {
    let auth: OAuth2Router = new OAuth2Router();
    auth.initialize(app);
}

export class OAuth2Utils {
    public static authRequired(req: Request, res: Response, next: NextFunction): void {
        if (!req.user) {
            req.session.oauth2return = req.originalUrl;
            return res.redirect('/auth/login');
        }
        next();
    }
}