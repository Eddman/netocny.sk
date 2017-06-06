import {UploadedFile} from './upload.file';

export const ATTACHMENT_KIND: string = 'Attachment';

export interface Attachment extends UploadedFile {
    alt?: string;
    order: string;
}
