import * as datastore from '@google-cloud/datastore';
import {Datastore, IInsetEntity, KEY, Key} from '@google-cloud/datastore';

import {NextFunction, Response, Request} from 'express';

import {GOOGLE_CLOUD_API_CONFIG} from '../../config';
import {AbstractRouter} from '../abstract.router';
import {AbstractFileRouter} from './file.router';

import {Page, PAGE_KIND} from './types/page';
import {UploadedFile} from './types/upload.file';
import {Image, IMAGE_KIND} from './types/image';

let dataStore: Datastore<Image> = datastore(GOOGLE_CLOUD_API_CONFIG);

export class ImageRouter extends AbstractFileRouter {

    constructor() {
        super('/images', 'images');

        // Get single
        this.router.get('/*', (req: Request, res: Response, next: NextFunction) => {
            this.getImages(req, res, next);
        });

        this.registerErrorHandler();
    }

    private getImages(req: Request, res: Response, next: NextFunction): void {
        if (req.path) {
            let pagePath = req.path.split('/').slice(1).reduce((result: string[], element: string) => {
                result.push(PAGE_KIND);
                result.push(element);
                return result;
            }, []);
            dataStore.runQuery(dataStore.createQuery(IMAGE_KIND).hasAncestor(dataStore.key(pagePath)))
                .then((apiResponse: any) => {
                    res.json(apiResponse[0]);
                }).catch((err) => next(err));
        } else {
            next('Invalid request!');
        }
    }

    protected storeFile(file: UploadedFile, page: Page): Promise<any> {
        let parentKey: Key = (page as any)[KEY];
        let key = dataStore.key([IMAGE_KIND, file.objectId]);
        key.parent = parentKey;

        let image: Image = {
            ...file,
            order: Date.now().toString()
        };

        const entity: IInsetEntity = {
            key : key,
            data: AbstractRouter.toDatastore(image, ['alt', 'bucketName', 'objectId', 'publicURL'])
        };
        return dataStore.save(entity);
    }
}