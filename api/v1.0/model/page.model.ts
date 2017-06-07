import * as datastore from '@google-cloud/datastore';
import {Datastore, IInsetEntity, Key, KEY, Query} from '@google-cloud/datastore';

import {GOOGLE_CLOUD_DATASTORE_API_CONFIG} from '../../../config';

import {Page, PAGE_KIND} from './types/page';
import {languageModel} from './lang.model';
import {Language} from './types/lang';
import {toDatastore} from './utils';

const dataStore: Datastore<Page> = datastore(GOOGLE_CLOUD_DATASTORE_API_CONFIG);

export interface PageModel {

    getPage(pageId: string): Promise<Page>;

    getPageChildren(pageId: string): Promise<Page[]>;

    save(page: Page): Promise<void>;

    delete(pageId: string): Promise<void>;

    readonly allPages: Promise<Page[]>;

    readonly menuRoots: Promise<Page[]>;
}

class PageModelImpl implements PageModel {

    constructor(private lang: string) {
    }

    private get languageKey(): Promise<Key> {
        return languageModel.getLang(this.lang).then((lang: Language) => (lang as any)[KEY]);
    }

    private get allPagesQuery(): Promise<Query> {
        return this.languageKey.then(
            (langKey: Key) => dataStore.createQuery(PAGE_KIND).hasAncestor(langKey).order('order'));
    }

    public get allPages(): Promise<Page[]> {
        return this.allPagesQuery
            .then((query: Query) => dataStore.runQuery(query))
            .then((apiResult: { 0: Page[] }) => apiResult[0]);
    }

    public get menuRoots(): Promise<Page[]> {
        return this.allPagesQuery
            .then((query: Query) => query.filter('menu', true))
            .then((query: Query) => dataStore.runQuery(query))
            .then((apiResult: { 0: Page[] }) => apiResult[0]);
    }

    private getPageKey(pageId: string): Promise<Key> {
        let pagePath = pageId.split('/').reduce((result: string[], element: string) => {
            result.push(PAGE_KIND);
            result.push(element);
            return result;
        }, []);
        let pageKey = dataStore.key(pagePath);
        return this.languageKey.then((langKey: Key) => {
            let curr: Key = pageKey;
            while (curr && curr.parent) {
                curr = curr.parent;
            }
            curr.parent = langKey;
            return pageKey;
        });
    }

    public getPage(resourceId: string): Promise<Page> {
        return this.getPageKey(resourceId)
            .then((pageKey: Key) => dataStore.get(pageKey))
            .then((apiResult: { 0: Page }) => apiResult[0]);
    }

    public getPageChildren(resourceId: string): Promise<Page[]> {
        return this.allPagesQuery
            .then((query: Query) => query.filter('parent', resourceId))
            .then((query: Query) => dataStore.runQuery(query))
            .then((apiResult: { 0: Page[] }) => apiResult[0]);
    }

    public save(page: Page): Promise<void> {
        let pageId: string[] = [];
        if (page.parent) {
            pageId.push(page.parent);
        }
        pageId.push(page.resourceId);

        page.menu = !page.parent;

        return this.getPageKey(pageId.join('/'))
            .then((pageKey: Key) => ({
                key : pageKey,
                data: toDatastore(page, ['content', 'title', 'resourceId'])
            }))
            .then((entity: IInsetEntity<Page>) => dataStore.save(entity));
    }

    public delete(resourceId: string): Promise<void> {
        return this.getPageKey(resourceId)
            .then((pageKey: Key) => dataStore.delete(pageKey));
    }
}

const models: { [key: string]: PageModel } = {};
export function getPageModel(lang: string): PageModel {
    if (!models[lang]) {
        models[lang] = new PageModelImpl(lang);
    }
    return models[lang];
}