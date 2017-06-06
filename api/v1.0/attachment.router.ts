import * as datastore from '@google-cloud/datastore';
import {Datastore, IInsetEntity, KEY, Key} from '@google-cloud/datastore';

import {NextFunction, Response, Request} from 'express';

import {GOOGLE_CLOUD_API_CONFIG} from '../../config';
import {AbstractRouter} from '../abstract.router';
import {AbstractFileRouter} from './file.router';

import {Page, PAGE_KIND} from './types/page';
import {UploadedFile} from './types/upload.file';
import {Attachment, ATTACHMENT_KIND} from './types/attachment';

let dataStore: Datastore<Attachment> = datastore(GOOGLE_CLOUD_API_CONFIG);

export class AttachmentRouter extends AbstractFileRouter {

    constructor() {
        super('/attachments', 'attachments');

        // Get single
        this.router.get('/*', (req: Request, res: Response, next: NextFunction) => {
            this.getAttachments(req, res, next);
        });

        this.registerErrorHandler();
    }

    private getAttachments(req: Request, res: Response, next: NextFunction): void {
        if (req.path) {
            let pagePath = req.path.split('/').slice(1).reduce((result: string[], element: string) => {
                result.push(PAGE_KIND);
                result.push(element);
                return result;
            }, []);
            dataStore.runQuery(dataStore.createQuery(ATTACHMENT_KIND).hasAncestor(dataStore.key(pagePath)))
                .then((apiResponse: any) => {
                    res.json(apiResponse[0]);
                }).catch((err) => next(err));
        } else {
            next('Invalid request!');
        }
    }

    protected storeFile(file: UploadedFile, page: Page): Promise<any> {
        let parentKey: Key = (page as any)[KEY];
        let key = dataStore.key([ATTACHMENT_KIND, file.objectId]);
        key.parent = parentKey;

        let attachment: Attachment = {
            ...file,
            order: Date.now().toString()
        };

        const entity: IInsetEntity = {
            key : key,
            data: AbstractRouter.toDatastore(attachment, ['alt', 'bucketName', 'objectId', 'publicURL'])
        };
        return dataStore.save(entity);
    }
}