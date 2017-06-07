import * as express from 'express';
import {NextFunction, Request, Response} from 'express';

import {json, urlencoded} from 'body-parser';

import {join} from 'path';

import {Server as HttpServer} from 'http';

import {config} from './config';

import {AbstractRouter} from './api/abstract.router';
import {PageRouter} from './api/v1.0/page.router';
import {ImageRouter} from './api/v1.0/image.router';
import {AttachmentRouter} from './api/v1.0/attachment.router';

export class Server {

    public app: express.Application;

    constructor() {
        //create expressjs application
        this.app = express();

        //configure application
        this.config();
    }

    private config() {
        //mount logger
        //this.app.use(logger("dev"));

        //mount json form parser
        this.app.use(json());

        //mount query string parser
        this.app.use(urlencoded({extended: true}));

        //add static paths
        this.app.use(express.static(join(__dirname, 'public')));

        //configure routes
        this.routes();

        // Basic 404 handler
        this.app.use((req: Request, res: Response) => {
            res.status(404).send('Not Found');
        });

        // Basic error handler
        this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
            /* jshint unused:false */
            console.error(err);
            // If our routes specified a specific response, then send that. Otherwise,
            // send a generic message so as not to leak anything.
            res.status(500).send(err.response || 'Something broke!');
        });
    }

    private routes() {
        let routersV10: AbstractRouter[] = [
            new PageRouter('en'),
            new ImageRouter('en'),
            new AttachmentRouter('en')
        ];

        //use router middleware
        routersV10.forEach((router: AbstractRouter) => {
            this.app.use('/api/v1.0' + router.path, router.router);
        });
    }

    public bind(port: number = 8080): HttpServer {
        // Start the server
        const server = this.app.listen(port, () => {
            const port = server.address().port;
            console.log(`App listening on port ${port}`);
        });
        return server;
    }
}

if (module === require.main) {
    let server: Server = new Server();
    server.bind(config.port || 8080);
}