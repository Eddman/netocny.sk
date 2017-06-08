declare interface IMemcachedStoreOptions {
    hosts: string[];
}

declare module 'connect-memcached' {
    import {Store} from 'express-session';

    function MemcachedStore(sessionFn: any): MemcachedStore.MemcachedStoreConstructor;

    namespace MemcachedStore {
        interface MemcachedStoreConstructor {
            new (options: IMemcachedStoreOptions): MemcachedStore;
        }

        class MemcachedStore extends Store {
            constructor(options: IMemcachedStoreOptions);
        }
    }

    export = MemcachedStore;
}