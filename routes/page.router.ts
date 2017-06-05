import {Datastore} from '@google-cloud/datastore';
import {GOOGLE_CLOUD_API_CONFIG} from '../config';

let dataStore: Datastore<any> = new Datastore(GOOGLE_CLOUD_API_CONFIG);

export class PageRouter {

}