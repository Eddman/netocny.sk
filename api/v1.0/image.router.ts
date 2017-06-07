import {AbstractFileRouter} from './file.router';

import {FileModel, getImageModel} from './model/file.model';

export class ImageRouter extends AbstractFileRouter {

    constructor(private lang: string) {
        super('/images/' + lang, 'images');

        this.registerErrorHandler();
    }

    protected get model(): FileModel {
        return getImageModel(this.lang);
    }
}