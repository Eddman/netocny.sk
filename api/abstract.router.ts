import {NextFunction, Response, Request, Router} from 'express';
import {json} from 'body-parser';

export class AbstractRouter {

    private _router: Router;

    constructor(private _path: string) {
        this._router = Router();

        // Automatically parse request body as JSON
        this._router.use(json());
    }

    protected registerErrorHandler(): void {
        this._router.use((err: any, req: Request, res: Response, next: NextFunction) => {
            // Format error and forward to generic error handler for logging and
            // responding to the request
            err.response = {
                message     : err.message,
                internalCode: err.code
            };
            next(err);
        });
    }

    public get router(): Router {
        return this._router;
    }

    public get path(): string {
        return this._path;
    }
}