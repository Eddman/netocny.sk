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

declare interface IDatastoreConstructorOptions extends IConstructorOptions {
    apiEndpoint?: string;
    namespace?: string;
}

declare module '@google-cloud/datastore' {

    export interface Key {
    }

    export class Query {
        public filter(property: string, value: any): Query;
        public filter(property: string, operator: '=' | '<' | '>' | '<=' | '>=', value: any): Query;

        public groupBy(properties: string[]): Query;

        public hasAncestor(key: Key): Query;

        public limit(limit: number): Query;

        public offset(offset: number): Query;

        public order(property: string, options?: { descending: boolean }): Query;

        public select(property: string): Query;
        public select(properties: string[]): Query;
    }

    export interface IInsetEntity<T> {
        key: Key;
        method?: 'insert' | 'update' | 'upsert';
        data: T | T[];
    }

    export class Datastore<T> {
        constructor(opt?: IDatastoreConstructorOptions);

        public createQuery(kind: string): Query;
        public createQuery(namespace: string, kind: string): Query;

        public int(i: number): string;

        public double(i: number): string;

        public key(path: string | string[]): Key;
        public key(options: { namespace?: string, path?: string | string[] }): Key;

        public get(key: Key | Key[]): Promise<any>;
        public get(key: Key | Key[],
            options: { consistency?: 'strong' | 'eventual', maxApiCalls?: number }): Promise<any>;
        public get(key: Key | Key[], callback: (err?: any, entity?: T | T[]) => void): void;
        public get(key: Key | Key[],
            options: { consistency?: 'strong' | 'eventual', maxApiCalls?: number },
            callback: (err?: any, entity?: T | T[]) => void): void;

        public runQuery(query: Query): Promise<any>;
        public runQuery(query: Query,
            options: { consistency?: 'strong' | 'eventual', maxApiCalls?: number }): Promise<any>;
        public runQuery(query: Query,
            callback: (err: any, entities?: T | T[], info?: { endCursor: string, moreResults: string }) => void): void;
        public runQuery(query: Query, options: { consistency?: 'strong' | 'eventual', maxApiCalls?: number },
            callback: (err: any, entities?: T | T[], info?: { endCursor: string, moreResults: string }) => void): void;

        public save(entity: IInsetEntity<T> | IInsetEntity<T>[]): Promise<any>;
        public save(entity: IInsetEntity<T> | IInsetEntity<T>[], callback: (err: any, apiResponse: any) => void): void;

        public delete(key: Key | Key[]): Promise<any>;
        public delete(key: Key | Key[], callback: (err: any, apiResponse: any) => void): void;
    }
}