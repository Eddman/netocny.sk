declare module 'passport-google-oauth20' {
    import {Strategy as StrategyPassport} from 'passport';
    import {Request} from 'express';

    class Strategy implements StrategyPassport {
        name: 'google';

        constructor(options: Options, verify: VerifyFunction);

        authenticate(req: Request, options?: any): void;
    }

    type VerifyFunction = (accessToken: string, refreshToken: string, profile: Profile,
        cb: (err: any, profile: any) => void) => void;

    interface Options {
        clientID: string;
        clientSecret: string;
        callbackURL: string;
        accessType: string;
    }

    interface Profile {
        provider: 'google';
        _raw: string;
        _json: any;
        id: string;
        displayName: string;
        name: {
            familyName: string;
            givenName: string;
        };
        gender?: string;
        emails?: Array<{ value: string, type: string }>;
        photos?: Array<{ value: string }>;
    }
}