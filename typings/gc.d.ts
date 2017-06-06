declare interface IConstructorOptions {
    projectId?: string;
    keyFilename?: string;
    email?: string;
    credentials?: {
        client_email?: string;
        private_key?: string;
    }
    autoRetry?: boolean;
    maxRetries?: number;
}