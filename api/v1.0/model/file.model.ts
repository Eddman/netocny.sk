import * as datastore from '@google-cloud/datastore';
import {Datastore, IInsetEntity, Key, KEY} from '@google-cloud/datastore';

import {GOOGLE_CLOUD_DATASTORE_API_CONFIG} from '../../../config';

import {Attachment, ATTACHMENT_KIND, IMAGE_KIND} from './types/attachment';
import {Page} from './types/page';

import {toDatastore} from './utils';

import {getPageModel, PageModel} from './page.model';
import {FileStorage} from './file.storage';

const dataStore: Datastore<Attachment> = datastore(GOOGLE_CLOUD_DATASTORE_API_CONFIG);

export interface FileModel {

    getFile(pageId: string, fileId: string): Promise<Attachment>;

    getFiles(pageId: string): Promise<Attachment[]>;

    save(pageId: string, attachment: Attachment): Promise<void>;

    delete(pageId: string, fileId: string): Promise<void>;
}

class FileModelImpl implements FileModel {

    private pageModel: PageModel;

    constructor(lang: string, private kind: string) {
        this.pageModel = getPageModel(lang);
    }

    private getPageKey(pageId: string): Promise<Key> {
        return this.pageModel.getPage(pageId)
            .then((page: Page) => (page as any)[KEY]);
    }

    private getFileKey(pageId: string, fileId: string): Promise<Key> {
        return this.getPageKey(pageId).then((pageKey: Key) => {
            let key = dataStore.key([this.kind, fileId]);
            key.parent = pageKey;
            return key;
        });
    }

    public getFile(pageId: string, fileId: string): Promise<Attachment> {
        return this.getFileKey(pageId, fileId)
            .then((fileKey: Key) => dataStore.get(fileKey))
            .then((apiResponse: { 0: Attachment }) => apiResponse[0]);
    }

    public getFiles(pageId: string): Promise<Attachment[]> {
        return this.getPageKey(pageId)
            .then((pageKey: Key) => dataStore.runQuery(
                dataStore.createQuery(this.kind).hasAncestor(pageKey).order('order')))
            .then((apiResponse: { 0: Attachment[] }) => apiResponse[0]);
    }

    public save(pageId: string, attachment: Attachment): Promise<void> {
        return this.getPageKey(pageId).then((pageKey: Key) => {
            let key = dataStore.key([this.kind, attachment.objectId]);
            key.parent = pageKey;

            return {
                key : key,
                data: toDatastore(attachment, ['alt', 'bucketName', 'objectId', 'publicURL'])
            };
        }).then((entity: IInsetEntity<Attachment>) => dataStore.save(entity));
    }

    public delete(pageId: string, fileId: string): Promise<void> {
        return this.getFileKey(pageId, fileId)
            .then((fileKey: Key) => dataStore.get(fileKey)
                .then((attachemt: { 0: Attachment }) => FileStorage.deleteFile(attachemt[0])).then(() => fileKey))
            .then((fileKey: Key) => dataStore.delete(fileKey));
    }
}

const models: { [key: string]: FileModel } = {};
function getFileModel(lang: string, kind: string): FileModel {
    if (!models[lang + kind]) {
        models[lang + kind] = new FileModelImpl(lang, kind);
    }
    return models[lang + kind];
}

export function getImageModel(lang: string) {
    return getFileModel(lang, IMAGE_KIND);
}

export function getAttachmentModel(lang: string) {
    return getFileModel(lang, ATTACHMENT_KIND);
}