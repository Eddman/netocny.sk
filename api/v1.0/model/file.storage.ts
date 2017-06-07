import * as cloudStorage from '@google-cloud/storage';
import {Bucket, Storage, File, Stream} from '@google-cloud/storage';

import {config, GOOGLE_CLOUD_API_CONFIG} from '../../../config';
import {UploadedFile} from './types/upload.file';

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
}