import {Request, Response, NextFunction} from 'express';

import {JWTUtils} from './jwt/jwt.utils';

import {AbstractRouter} from '../abstract.router';

import {Page} from './model/types/page';
import {getPageModel, PageModel} from './model/page.model';

export class PageRouter extends AbstractRouter {
    private model: PageModel;

    constructor(lang: string) {
        super('/page/' + lang);
        this.model = getPageModel(lang);
        // Get all ;)
        this.router.get('/', (req: Request, res: Response, next: NextFunction) => {
            this.getAllPages(res, next);
        });

        // Get menu items
        this.router.get('/menuRoots', (req: Request, res: Response, next: NextFunction) => {
            this.getMenuRoots(res, next);
        });

        // Get single
        this.router.get('/children/*', (req: Request, res: Response, next: NextFunction) => {
            this.getPageChildren(req, res, next);
        });

        // Get single
        this.router.get('/*', (req: Request, res: Response, next: NextFunction) => {
            this.getPage(req, res, next);
        });

        // Remove
        this.router.delete('/*',
            JWTUtils.authRequired,
            (req: Request, res: Response, next: NextFunction) => {
                this.deletePage(req, res, next);
            });

        // Create-edit
        this.router.post('/',
            JWTUtils.authRequired,
            (req: Request, res: Response, next: NextFunction) => {
                this.savePage(req, res, next);
            });

        this.registerErrorHandler();
    }

    private getAllPages(res: Response, next: NextFunction): void {
        this.model.allPages
            .then((pages: Page[]) => res.json(pages))
            .catch((err) => next(err));
    }

    private getPage(req: Request, res: Response, next: NextFunction): void {
        if (req.path) {
            this.model.getPage(req.path.slice(1)).then((page: Page) => {
                if (!page) {
                    next({
                        message: 'Page not found!',
                        code   : 404
                    });
                    return;
                }
                res.json(page);
            }).catch((err) => next(err));
        } else {
            next({
                message: 'Invalid request!',
                code   : 400
            });
        }
    }

    private getPageChildren(req: Request, res: Response, next: NextFunction): void {
        if (req.path) {
            this.model.getPageChildren(req.path.slice('/children/'.length))
                .then((page: Page[]) => res.json(page))
                .catch((err) => next(err));
        } else {
            next({
                message: 'Invalid request!',
                code   : 400
            });
        }
    }

    private getMenuRoots(res: Response, next: NextFunction): void {
        this.model.menuRoots
            .then((pages: Page[]) => res.json(pages))
            .catch((err) => next(err));
    }

    private savePage(req: Request, res: Response, next: NextFunction): void {
        let data: Page = req.body;
        this.model.save(data)
            .then(() => {
                res.sendStatus(201);
                res.end();
            })
            .catch((err) => next(err));
    }

    private deletePage(req: Request, res: Response, next: NextFunction): void {
        if (req.path) {
            this.model.delete(req.path.slice(1)).then(() => {
                res.sendStatus(202);
                res.end();
            }).catch((err) => next(err));
        } else {
            next({
                message: 'Invalid request!',
                code   : 400
            });
        }
    }
}