export const PAGE_KIND: string = 'Page';

export interface Page {
    resourceId: string;
    title: string;
    content: string;
    parent: string;
    menu: boolean;
    order: string;
}