import {Response, Request, NextFunction} from 'express';

import {AbstractRouter} from '../abstract.router';
import {languageModel} from './model/lang.model';
import {Language} from './model/types/lang';

export class LangRouter extends AbstractRouter {

    constructor() {
        super('/languages');

        this.router.get('/',
            (req: Request, res: Response, next: NextFunction) => {
                languageModel.langages
                    .then((languages: Language[]) => {
                        res.json(languages);
                        res.end();
                    })
                    .catch((err) => next(err));
            });

        this.registerErrorHandler();
    }
}