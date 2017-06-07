import {IInsetAttribute} from '@google-cloud/datastore';

export function toDatastore(obj: any, nonIndexed: string[] = []): IInsetAttribute[] {
    const results: IInsetAttribute[] = [];
    Object.keys(obj).forEach((k) => {
        if (obj[k] === undefined) {
            return;
        }
        results.push({
            name              : k,
            value             : obj[k],
            excludeFromIndexes: nonIndexed.indexOf(k) !== -1
        });
    });
    return results;
}