import {Request, Response, NextFunction} from 'express';
import * as datastore from '@google-cloud/datastore';
import {Datastore, IInsetEntity, Key, Query} from '@google-cloud/datastore';

import {GOOGLE_CLOUD_API_CONFIG} from '../../config';

import {AbstractRouter} from '../abstract.router';
import {Page} from './types/page';

let dataStore: Datastore<Page> = datastore(GOOGLE_CLOUD_API_CONFIG);

const PAGE_KIND: string = 'Page';
const ROOT_PAGE: Key = dataStore.key([PAGE_KIND, '_!root!_']);

export class PageRouter extends AbstractRouter {
    constructor() {
        super('/page');
        // Get all ;)
        this.router.get('/', (req: Request, res: Response, next: NextFunction) => {
            this.getAllPages(req, res, next);
        });

        // Get menu items
        this.router.get('/roots', (req: Request, res: Response, next: NextFunction) => {
            this.getRoots(req, res, next);
        });

        // Get single
        this.router.get('/:pageId', (req: Request, res: Response, next: NextFunction) => {
            this.getPage(req, res, next);
        });

        // Create-edit
        this.router.post('/save', (req: Request, res: Response, next: NextFunction) => {
            this.savePage(req, res, next);
        });

        this.registerErrorHandler();
    }

    private static get allPagesQuery(): Query {
        return dataStore.createQuery(PAGE_KIND).order('order');
    }

    private getAllPages(req: Request, res: Response, next: NextFunction): void {
        dataStore.runQuery(PageRouter.allPagesQuery).then((apiResponse: any) => {
            res.json(apiResponse[0]);
        }).catch((err) => next(err));
    }

    private getPage(req: Request, res: Response, next: NextFunction): void {
        if (req.params.pageId) {
            dataStore.get(dataStore.key([ROOT_PAGE, req.params.pageId])).then((apiResponse: any) => {
                res.json(apiResponse[0]);
            }).catch((err) => next(err));
        }
    }

    private getRoots(req: Request, res: Response, next: NextFunction): void {
        let query = PageRouter.allPagesQuery.filter('parent', ROOT_PAGE);
        dataStore.runQuery(query).then((apiResponse: any) => {
            res.json(apiResponse[0]);
        }).catch((err) => next(err));
    }

    private savePage(req: Request, res: Response, next: NextFunction): void {
        let data: Page = req.body;
        if (data.parent) {
            data.parent = [PAGE_KIND, data.parent[data.parent.length - 1]];
        }
        const entity: IInsetEntity = {
            key : dataStore.key([PAGE_KIND, data.resourceId]),
            data: AbstractRouter.toDatastore(data, ['content'])
        };
        if (data.parent) {
            entity.key.parent = dataStore.key(data.parent);
        } else {
            entity.key.parent = ROOT_PAGE;
        }

        dataStore.save(entity).then(() => {
            res.sendStatus(201);
            res.end();
        }).catch((err) => next(err));
    }
}