import { BaseHttpController } from "inversify-express-utils";
import { Repositories } from "../repositories";
import express from "express";
import { LoggingHelper } from "../helpers/LoggingHelper";
import { AuthenticatedUser } from "../auth"


export class CustomBaseController extends BaseHttpController {

    public baseRepositories: Repositories;
    public logger: LoggingHelper;

    constructor() {
        super()
        this.baseRepositories = Repositories.getCurrent();
        this.logger = LoggingHelper.getCurrent();
    }

    public error(errors: string[]) {
        return this.json({ errors }, 500);
    }

    public denyAccess(errors: string[]) {
        return this.json({ errors }, 401);
    }

    public authUser(): AuthenticatedUser {
        return new AuthenticatedUser(this.httpContext.user);
    }

    public include(req: express.Request, item: string) {
        let result = false;
        if (req.query.include !== undefined) {
            const value: string = req.query.include as string;
            const items = value.split(",");
            if (items.indexOf(item) > -1) result = true;
        }
        return result;
    }

    public async actionWrapper(req: express.Request, res: express.Response, fetchFunction: (au: AuthenticatedUser) => any): Promise<any> {
        try {
            const result = await fetchFunction(this.authUser());
            await this.logger.flush();
            return result;
        } catch (e) {
            try {
                this.logger.error(e);
                await this.logger.flush();
            } catch (e) {
                console.log(e);
            }

            return this.internalServerError(e);
        }
    }



}
