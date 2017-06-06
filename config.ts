import {argv, get} from 'nconf';
import {join} from 'path';

const GCLOUD_PROJECT: string = 'GCLOUD_PROJECT';
const GCLOUD_BUCKET: string = 'GCLOUD_BUCKET';
const PORT = 'PORT';
const NODE_ENV = 'NODE_ENV';

// 1. Command-line arguments
argv()
// 2. Environment variables
    .env([
        GCLOUD_PROJECT,
        GCLOUD_BUCKET,
        NODE_ENV,
        PORT
    ])
    // 4. Defaults
    .defaults({
        // This is the id of your project in the Google Cloud Developers Console.
        [GCLOUD_PROJECT]: 'netocny-sk',
        [GCLOUD_BUCKET] : 'netocny-sk.appspot.com',

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
    production : get(NODE_ENV) === 'production'
};

export const GOOGLE_CLOUD_API_CONFIG: IConstructorOptions = {
    projectId: get(GCLOUD_PROJECT)
};

if (get(NODE_ENV) !== 'production') {
    GOOGLE_CLOUD_API_CONFIG.keyFilename = join(__dirname, 'netocny-sk-key.json');
}