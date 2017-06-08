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
    function Storage<T>(opt?: IConstructorOptions): Storage.Storage;

    namespace Storage {

        interface Storage {
            bucket(name: string): Bucket;
        }

        interface Bucket {
            file(fileName: string): File;
        }

        interface File {
            createWriteStream(options: { metadata: { contentType: string; } }): Stream;

            makePublic(): Promise<any>;

            delete(): Promise<any>;
            delete(callback: (err?: any, apiResponse?: any) => void): void;
        }

        interface Stream {
            on(event: 'error' | 'finish', callback: (err?: any) => void): void;
            end(data: Buffer): void;
        }
    }

    export = Storage;
}