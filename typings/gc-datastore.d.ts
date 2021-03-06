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
    function Datastore<T>(opt?: IDatastoreConstructorOptions): Datastore.Datastore<T>;

    namespace Datastore {

        const KEY: string;

        interface Datastore<T> {

            createQuery(kind: string): Query;
            createQuery(namespace: string, kind: string): Query;

            int(i: number): string;

            double(i: number): string;

            key(path: string | string[]): Key;
            key(options: { namespace?: string, path?: string | string[] }): Key;

            get(key: Key | Key[]): Promise<{ 0: T }>;
            get(key: Key | Key[],
                options: { consistency?: 'strong' | 'eventual', maxApiCalls?: number }): Promise<{ 0: T }>;
            get(key: Key | Key[], callback: (err?: any, entity?: T | T[]) => void): void;
            get(key: Key | Key[],
                options: { consistency?: 'strong' | 'eventual', maxApiCalls?: number },
                callback: (err?: any, entity?: T | T[]) => void): void;

            runQuery(query: Query): Promise<{ 0: T[] }>;
            runQuery(query: Query,
                options: { consistency?: 'strong' | 'eventual', maxApiCalls?: number }): Promise<{ 0: T[] }>;
            runQuery(query: Query,
                callback: (err: any, entities?: T | T[],
                    info?: { endCursor: string, moreResults: string }) => void): void;
            runQuery(query: Query, options: { consistency?: 'strong' | 'eventual', maxApiCalls?: number },
                callback: (err: any, entities?: T | T[],
                    info?: { endCursor: string, moreResults: string }) => void): void;

            save(entity: IInsetEntity<T> | IInsetEntity<T>[]): Promise<any>;
            save(entity: IInsetEntity<T> | IInsetEntity<T>[], callback: (err: any, apiResponse: any) => void): void;

            delete(key: Key | Key[]): Promise<any>;
            delete(key: Key | Key[], callback: (err: any, apiResponse: any) => void): void;
        }

        interface Key {
            name: string;
            path: string[];
            parent: Key;
        }

        interface Query {
            filter(property: string, value: any): Query;
            filter(property: string, operator: '=' | '<' | '>' | '<=' | '>=', value: any): Query;

            groupBy(properties: string[]): Query;

            hasAncestor(key: Key): Query;

            limit(limit: number): Query;

            offset(offset: number): Query;

            order(property: string, options?: { descending: boolean }): Query;

            select(property: string): Query;
            select(properties: string[]): Query;
        }

        interface IInsetEntity<T> {
            key: Key;
            method?: 'insert' | 'update' | 'upsert';
            data: IInsetAttribute | IInsetAttribute[] | T;
        }

        interface IInsetAttribute {
            name: string;
            value: any;
            excludeFromIndexes: boolean;
        }
    }

    export = Datastore;
}