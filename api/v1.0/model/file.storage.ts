import * as cloudStorage from '@google-cloud/storage';
import {Bucket, Storage, File} from '@google-cloud/storage';

import {config, GOOGLE_CLOUD_API_CONFIG} from '../../../config';
import {UploadedFile} from './types/upload.file';

import {Writable} from 'stream';

const storage: Storage = cloudStorage(GOOGLE_CLOUD_API_CONFIG);
const bucket: Bucket = storage.bucket(config.file_bucket);

export class FileStorage {

    public static getPublicUrl(filename: string): string {
        return `https://storage.googleapis.com/${config.file_bucket}/${filename}`;
    }

    public static storeFile(uploadedFile: Express.Multer.File): Promise<UploadedFile> {
        return new Promise((resolve, reject) => {
            const gcsname = Date.now() + uploadedFile.originalname;
            const file: File = bucket.file(gcsname);

            const stream: Writable = file.createWriteStream({
                metadata: {
                    contentType: uploadedFile.mimetype
                }
            });

            stream.on('error', (err: Error) => reject(err));

            stream.on('finish', () => {
                file.makePublic().then(() => {
                    resolve({
                        bucketName: config.file_bucket,
                        objectId  : gcsname,
                        publicURL : FileStorage.getPublicUrl(gcsname)
                    });
                }).catch((err) => reject(err));
            });

            stream.end(uploadedFile.buffer);
        });
    }

    public static deleteFile(uploadedFile: UploadedFile): Promise<any> {
        const bucket = storage.bucket(uploadedFile.bucketName);
        const file: File = bucket.file(uploadedFile.objectId);
        return file.delete();
    }

    public static readFile(uploadedFile: UploadedFile): Promise<string> {
        const bucket = storage.bucket(uploadedFile.bucketName);
        const file: File = bucket.file(uploadedFile.objectId);
        return file.download().then((apiResponse: { 0: Buffer }) => apiResponse[0].toString('utf8'));
    }
}