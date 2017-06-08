import {NextFunction, Response, Request} from 'express';
import * as Multer from 'multer';
import {memoryStorage} from 'multer';

import {AbstractRouter} from '../abstract.router';

import {FileModel} from './model/file.model';
import {FileStorage} from './model/file.storage';
import {Attachment} from './model/types/attachment';
import {UploadedFile} from './model/types/upload.file';

const multer = Multer({
    storage: memoryStorage(),
    limits : {
        fileSize: 20 * 1024 * 1024 // no larger than 5mb
    }
});

export abstract class AbstractFileRouter extends AbstractRouter {

    protected abstract get model(): FileModel;

    constructor(path: string, fieldName: string) {
        super(path);

        // Get single
        this.router.get('/*', (req: Request, res: Response, next: NextFunction) => {
            this.getFiles(req, res, next);
        });

        this.router.post(
            '/upload/*',
            multer.array(fieldName),
            (req: Request, res: Response, next: NextFunction) => this.sendUploadToGCS(req, res, next)
        );

        this.router.post('/*',
            (req: Request, res: Response, next: NextFunction) =>
                this.save(req, res, next));

        this.router.delete('/*',
            (req: Request, res: Response, next: NextFunction) =>
                this.delete(req, res, next));

        this.registerErrorHandler();
    }

    private getFiles(req: Request, res: Response, next: NextFunction): void {
        if (req.path) {
            this.model.getFiles(req.path.slice(1))
                .then((files: Attachment[]) => res.json(files))
                .catch((err) => next(err));
        } else {
            next({
                message: 'Invalid request!',
                code   : 400
            });
        }
    }

    private sendUploadToGCS(req: Request, res: Response, next: NextFunction): void {
        if (!req.path) {
            next({
                message: 'Invalid request!',
                code   : 400
            });
            return;
        }
        if (!req.files) {
            return next({
                message: 'No files uploaded!',
                code   : 400
            });
        }

        (req.files as any)
            .reduce((promise: Promise<any>, uploadedFile: Express.Multer.File) => {
                return promise
                    .then(() => FileStorage.storeFile(uploadedFile))
                    .then((uploadedFile: UploadedFile) => {
                        return {
                            ...uploadedFile,
                            order: Date.now().toString()
                        };
                    })
                    .then((attachment: Attachment) => this.model.save(req.path.slice('/upload/'.length), attachment));
            }, Promise.resolve())
            .then(() => {
                res.sendStatus(201);
                res.end();
            })
            .catch((err: any) => next(err));
    }

    private save(req: Request, res: Response, next: NextFunction): void {
        if (req.path) {
            let data: Attachment = req.body;
            this.model.save(req.path.slice(1), data)
                .then(() => {
                    res.sendStatus(201);
                    res.end();
                })
                .catch((err) => next(err));
        } else {
            next({
                message: 'Invalid request!',
                code   : 400
            });
        }
    }

    private delete(req: Request, res: Response, next: NextFunction): void {
        if (req.path) {
            let data: Attachment = req.body;
            this.model.delete(req.path.slice(1), data.objectId)
                .then(() => {
                    res.sendStatus(202);
                    res.end();
                })
                .catch((err) => next(err));
        } else {
            next({
                message: 'Invalid request!',
                code   : 400
            });
        }
    }
}