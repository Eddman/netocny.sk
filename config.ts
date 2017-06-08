import {argv, get} from 'nconf';
import {join} from 'path';

const GCLOUD_PROJECT: string = 'GCLOUD_PROJECT';
const GCLOUD_BUCKET: string = 'GCLOUD_BUCKET';

const DATASTORE_EMULATOR_HOST: string = 'DATASTORE_EMULATOR_HOST';

const PORT = 'PORT';

const NODE_ENV = 'NODE_ENV';

const OAUTH2_CLIENT_ID = 'OAUTH2_CLIENT_ID';
const OAUTH2_CLIENT_SECRET = 'OAUTH2_CLIENT_SECRET';
const OAUTH2_CALLBACK = 'OAUTH2_CALLBACK';

const SECRET = 'SECRET';
const MEMCACHE_URL = 'MEMCACHE_URL';

// 1. Command-line arguments
argv()
// 2. Environment variables
    .env([
        GCLOUD_PROJECT,
        GCLOUD_BUCKET,
        DATASTORE_EMULATOR_HOST,
        NODE_ENV,
        PORT,
        MEMCACHE_URL,
        OAUTH2_CLIENT_ID,
        OAUTH2_CLIENT_SECRET,
        OAUTH2_CALLBACK,
        SECRET
    ])
    // 4. Defaults
    .defaults({
        // This is the id of your project in the Google Cloud Developers Console.
        [GCLOUD_PROJECT]         : 'netocny-sk',
        [GCLOUD_BUCKET]          : 'netocny-sk.appspot.com',
        [DATASTORE_EMULATOR_HOST]: 'http://localhost:8081',

        // Connection url for the Memcache instance used to store session data
        [MEMCACHE_URL]: 'localhost:11211',

        [OAUTH2_CLIENT_ID]    : '',
        [OAUTH2_CLIENT_SECRET]: '',
        [OAUTH2_CALLBACK]     : 'http://localhost:8080/auth/google/callback',

        [PORT]: 8080,

        // Set this a secret string of your choosing
        [SECRET]: 'jkdfnsdhlsusdxvbjklx789&*()x465vhvcsdbfsdlczn,zxcmzsdjsbvzxnxcvzxc'
    });

// Check for required settings
checkConfig(GCLOUD_PROJECT);
checkConfig(OAUTH2_CLIENT_ID);
checkConfig(OAUTH2_CLIENT_SECRET);

function checkConfig(setting: string) {
    if (!get(setting)) {
        throw new Error(`You must set ${setting} as an environment variable or in config.json!`);
    }
}

export const config = {
    project           : get(GCLOUD_PROJECT),
    file_bucket       : get(GCLOUD_BUCKET),
    port              : parseInt(get(PORT), 10),
    production        : get(NODE_ENV) === 'production',
    sessionSecret     : get(SECRET),
    memcacheUrl       : get(MEMCACHE_URL),
    oauth2ClientId    : get(OAUTH2_CLIENT_ID),
    oauth2ClientSecret: get(OAUTH2_CLIENT_SECRET),
    oauth2Callback    : get(OAUTH2_CALLBACK)
};

export const GOOGLE_CLOUD_API_CONFIG: IConstructorOptions = {
    projectId: get(GCLOUD_PROJECT)
};

if (get(NODE_ENV) !== 'production') {
    GOOGLE_CLOUD_API_CONFIG.keyFilename = join(__dirname, 'netocny-sk-key.json');
}

export const GOOGLE_CLOUD_DATASTORE_API_CONFIG: IDatastoreConstructorOptions = {
    ...GOOGLE_CLOUD_API_CONFIG
};

if (get(NODE_ENV) !== 'production') {
    GOOGLE_CLOUD_DATASTORE_API_CONFIG.apiEndpoint = get(DATASTORE_EMULATOR_HOST);
}