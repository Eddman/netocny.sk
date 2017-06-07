import {AbstractFileRouter} from './file.router';

import {FileModel, getAttachmentModel} from './model/file.model';

export class AttachmentRouter extends AbstractFileRouter {

    constructor(private lang: string) {
        super('/attachments/' + lang, 'attachments');

        this.registerErrorHandler();
    }

    protected get model(): FileModel {
        return getAttachmentModel(this.lang);
    }
}