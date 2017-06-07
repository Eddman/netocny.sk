import {UploadedFile} from './upload.file';

export const ATTACHMENT_KIND: string = 'Attachment';

export const IMAGE_KIND: string = 'Image';

export interface Attachment extends UploadedFile {
    alt?: string;
    order: string;
}
