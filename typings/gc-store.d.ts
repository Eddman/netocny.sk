declare interface IConstructorOptions {
    projectId?: string;
    keyFilename?: string;
    email?: string;
    credentials?: {
        client_email?: string;
        private_key?: string;
    }
    autoRetry?: boolean;
    maxRetries?: number;
}

declare module '@google-cloud/storage' {
    import {Readable, Writable} from 'stream';

    function Storage<T>(opt?: IConstructorOptions): Storage.Storage;

    namespace Storage {

        interface Storage {
            bucket(name: string): Bucket;
        }

        interface Bucket {
            file(fileName: string): File;
        }

        interface File {
            createWriteStream(options: { metadata: { contentType: string; } }): Writable;
            createReadStream(): Readable;

            makePublic(): Promise<any>;

            download(): Promise<{ 0: Buffer; }>;

            delete(): Promise<any>;
            delete(callback: (err?: any, apiResponse?: any) => void): void;
        }
    }

    export = Storage;
}