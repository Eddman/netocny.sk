import {argv, get} from 'nconf';
import {join} from 'path';

const GCLOUD_PROJECT: string = 'GCLOUD_PROJECT';
const GCLOUD_BUCKET: string = 'GCLOUD_BUCKET';
const DATASTORE_EMULATOR_HOST: string = 'DATASTORE_EMULATOR_HOST';
const PORT = 'PORT';
const NODE_ENV = 'NODE_ENV';
const JWT_ISS = 'JWT_ISS';
const JWT_AUD = 'JWT_AUD';
const JWT_KEY = 'JWT_KEY';

// 1. Command-line arguments
argv()
// 2. Environment variables
    .env([
        GCLOUD_PROJECT,
        GCLOUD_BUCKET,
        DATASTORE_EMULATOR_HOST,
        NODE_ENV,
        PORT,
        JWT_ISS,
        JWT_AUD,
        JWT_KEY
    ])
    // 4. Defaults
    .defaults({
        // This is the id of your project in the Google Cloud Developers Console.
        [GCLOUD_PROJECT]         : 'netocny-sk',
        [GCLOUD_BUCKET]          : 'netocny-sk.appspot.com',
        [DATASTORE_EMULATOR_HOST]: 'http://localhost:8081',

        [JWT_ISS]: 'https://netocny.sk',
        [JWT_AUD]: 'Netocny.sk',
        [JWT_KEY]: 'netocny.sk.jwt.key',

        [PORT]: 8080
    });

// Check for required settings
checkConfig(GCLOUD_PROJECT);

function checkConfig(setting: string) {
    if (!get(setting)) {
        throw new Error(`You must set ${setting} as an environment variable or in config.json!`);
    }
}

export const config = {
    project    : get(GCLOUD_PROJECT),
    file_bucket: get(GCLOUD_BUCKET),
    port       : parseInt(get(PORT), 10),
    production : get(NODE_ENV) === 'production',
    jwtAUD     : get(JWT_AUD),
    jwtISS     : get(JWT_ISS),
    jwtKey     : get(JWT_KEY)
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