import {json, urlencoded} from 'body-parser';
import * as express from 'express';
import {NextFunction, Request, Response} from 'express';
import {join} from 'path';
import {argv, get} from 'nconf';
import {Server as HttpServer} from 'http';

argv();

/**
 * The server.
 *
 * @class Server
 */
export class Server {

    public app: express.Application;

    /**
     * Constructor.
     *
     * @class Server
     * @constructor
     */
    constructor() {
        //create expressjs application
        this.app = express();

        //configure application
        this.config();

        //configure routes
        this.routes();
    }

    /**
     * Configure application
     *
     * @class Server
     * @method config
     * @return void
     */
    private config() {
        //mount logger
        //this.app.use(logger("dev"));

        //mount json form parser
        this.app.use(json());

        //mount query string parser
        this.app.use(urlencoded({extended: true}));

        //add static paths
        this.app.use(express.static(join(__dirname, 'public')));

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

    /**
     * Configure routes
     *
     * @class Server
     * @method routes
     * @return void
     */
    private routes() {
        //get router
        let router: express.Router;
        router = express.Router();

        //home page
        // router.get('/', index.index.bind(index.index));

        //use router middleware
        this.app.use(router);
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
    server.bind(parseInt(get('port'), 10) || 8080);
}