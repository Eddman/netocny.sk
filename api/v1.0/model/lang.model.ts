import * as datastore from '@google-cloud/datastore';
import {Datastore, Key, Query} from '@google-cloud/datastore';

import {GOOGLE_CLOUD_DATASTORE_API_CONFIG} from '../../../config';

import {Language, LANGUAGE_KIND} from './types/lang';

const dataStore: Datastore<Language> = datastore(GOOGLE_CLOUD_DATASTORE_API_CONFIG);

class LanguageModel {

    private langCache: { [key: string]: Language } = {};

    constructor() {
    }

    public get langages(): Promise<Language[]> {
        return new Promise((resolve, reject) => {
            let query: Query = dataStore.createQuery(LANGUAGE_KIND).order('order');
            dataStore.runQuery(query).then((apiResult: { 0: Language[] }) => {
                resolve(apiResult[0]);
            }).catch((err) => reject(err));
        });
    }

    public getLang(lang: string): Promise<Language> {
        return new Promise((resolve, reject) => {
            const cache = this.langCache[lang];
            if (cache) {
                resolve(cache);
                return;
            }
            const langKey: Key = dataStore.key([LANGUAGE_KIND, lang]);
            dataStore.get(langKey).then((apiResult: { 0: Language }) => {
                if (apiResult[0]) {
                    this.langCache[lang] = apiResult[0];
                    resolve(apiResult[0]);
                    return;
                }

                dataStore.save({
                    key : langKey,
                    data: {
                        lang: lang
                    }
                }).then((apiResult: { 0: Language }) => {
                    dataStore.get(langKey).then((apiResult: { 0: Language }) => {
                        this.langCache[lang] = apiResult[0];
                        resolve(apiResult[0]);
                    });
                }).catch((err) => reject(err));
            }).catch(() => {
                dataStore.save({
                    key : langKey,
                    data: {
                        lang: lang
                    }
                }).then((apiResult: { 0: Language }) => {
                    dataStore.get(langKey).then((apiResult: { 0: Language }) => {
                        this.langCache[lang] = apiResult[0];
                        resolve(apiResult[0]);
                    });
                }).catch((err) => reject(err));
            });
        });
    }
}

export const languageModel = new LanguageModel();