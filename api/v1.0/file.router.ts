import * as cloudStorage from '@google-cloud/storage';
import {Bucket, Storage, File, Stream} from '@google-cloud/storage';

import * as datastore from '@google-cloud/datastore';
import {Datastore} from '@google-cloud/datastore';

import {NextFunction, Response, Request} from 'express';
import * as Multer from 'multer';
import {memoryStorage} from 'multer';

import {config, GOOGLE_CLOUD_API_CONFIG, GOOGLE_CLOUD_DATASTORE_API_CONFIG} from '../../config';
import {AbstractRouter} from '../abstract.router';
import {Page, PAGE_KIND} from './types/page';
import {UploadedFile} from './types/upload.file';

const storage: Storage = cloudStorage(GOOGLE_CLOUD_API_CONFIG);
const bucket: Bucket = storage.bucket(config.file_bucket);

let dataStore: Datastore<Page> = datastore(GOOGLE_CLOUD_DATASTORE_API_CONFIG);

const multer = Multer({
    storage: memoryStorage(),
    limits : {
        fileSize: 5 * 1024 * 1024 // no larger than 5mb
    }
});

export abstract class AbstractFileRouter extends AbstractRouter {

    constructor(path: string, private fieldName: string) {
        super(path);
        this.router.post(
            '/add',
            (req: Request, res: Response, next: NextFunction) => this.validate(req, next),
            multer.array(fieldName),
            (req: Request, res: Response, next: NextFunction) => this.sendUploadToGCS(req, next),
            (req: Request, res: Response, next: NextFunction) => {
                if ((req as any).uploadedFiles) {
                    this.filesAdded((req as any).uploadedFiles, req, res, next);
                } else {
                    next('No file returned from cloud storage!');
                }
            }
        );
    }

    private static getPublicUrl(filename: string): string {
        return `https://storage.googleapis.com/${config.file_bucket}/${filename}`;
    }

    private sendUploadToGCS(req: Request, next: NextFunction): void {
        if (!req.files && req.files[this.fieldName]) {
            return next('No files uploaded!');
        }

        let result: UploadedFile[] = [];
        let promises: Promise<any>[] = [];

        req.files[this.fieldName].forEach((uploadedFile: Express.Multer.File) => {
            promises.push(new Promise((resolve, reject) => {
                const gcsname = Date.now() + uploadedFile.originalname;
                const file: File = bucket.file(gcsname);

                const stream: Stream = file.createWriteStream({
                    metadata: {
                        contentType: uploadedFile.mimetype
                    }
                });

                stream.on('error', (err) => {
                    reject(err);
                });

                stream.on('finish', () => {
                    file.makePublic().then(() => {
                        result.push({
                            bucketName: config.file_bucket,
                            objectId  : gcsname,
                            publicURL : AbstractFileRouter.getPublicUrl(gcsname)
                        });
                        resolve();
                    }).catch((err) => reject(err));
                });

                stream.end(uploadedFile.buffer);
            }));
        });
        Promise.all(promises).then(() => {
            (req as any).uploadedFiles = result;
            next();
        }).catch((err) => next(err));
    }

    private validate(req: Request, next: NextFunction): void {
        if (req.query.pageId) {
            let pagePath = req.params.pageId.split('/').reduce((result: string[], element: string) => {
                result.push(PAGE_KIND);
                result.push(element);
                return result;
            }, []);
            dataStore.get(dataStore.key(pagePath)).then((apiResult) => {
                (req as any).pageEntity = apiResult[0];
                next();
            }).catch((err) => next('Page does not exist'));

        } else {
            next('pageId has to be specified');
        }
    }

    private filesAdded(files: UploadedFile[], req: Request, res: Response, next: NextFunction): void {
        let page: Page = (req as any).pageEntity;
        if (!page || !files) {
            next('Page does not exist');
            return;
        }

        let promises: Promise<any>[] = [];

        files.forEach((file: UploadedFile) => promises.push(this.storeFile(file, page)));

        Promise.all(promises).then(() => {
            res.sendStatus(201);
            res.end();
        }).catch((err) => next(err));
    }

    protected abstract storeFile(file: UploadedFile, page: Page): Promise<any>;
}