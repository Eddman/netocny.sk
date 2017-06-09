import * as datastore from '@google-cloud/datastore';
import {Datastore} from '@google-cloud/datastore';

import {createHash} from 'crypto';

import {config, GOOGLE_CLOUD_DATASTORE_API_CONFIG} from '../../../config';

import {User, USER_KIND} from './types/user';

const dataStore: Datastore<User> = datastore(GOOGLE_CLOUD_DATASTORE_API_CONFIG);

if (!config.production) {
    const adminKey = dataStore.key([USER_KIND, 'admin']);
    dataStore.get(adminKey).then((apiResult: { 0: User }) => apiResult[0])
        .then((user: User) => {
            if (user) {
                return Promise.reject('Test user available!');
            }
            return Promise.resolve();
        })
        .then(() => dataStore.save({
            key : adminKey,
            data: {
                username: 'admin',
                password: createHash('sha256')
                    .update('admin')
                    .digest('hex')
            }
        }))
        .then(() => console.log('Test user created!'))
        .catch((err) => console.log(err));
}

export interface UserModel {

    validateUser(user: string, password: string): Promise<User>;
}

class UserModelImpl implements UserModel {

    public validateUser(user: string, password: string): Promise<User> {
        return dataStore.get(dataStore.key([USER_KIND, user]))
            .then((apiResult: { 0: User }) => apiResult[0])
            .then((user: User) => {
                if (!user) {
                    return Promise.reject({message: 'Invalid user or password.'});
                }
                let passHash = createHash('sha256')
                        .update(password || '')
                        .digest('hex') || '';
                if (passHash.toLowerCase() === (user.password || '').toLowerCase()) {
                    return Promise.resolve(user);
                }
                return Promise.reject({message: 'Invalid user or password.'});
            })
            .catch(() => Promise.reject({message: 'Invalid user or password.'}));
    }
}

export const userModel: UserModel = new UserModelImpl();