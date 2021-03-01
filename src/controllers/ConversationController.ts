import { controller, httpGet, httpPost } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { Permissions } from "../helpers/Permissions";


@controller("/conversations")
export class ConversationController extends MessagingBaseController {


    @httpPost("/updateConfig")
    public async updateConfig(req: express.Request<{}, {}, { churchId: string, conversationId: string }>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.chat.host)) return this.json({}, 401);
            else {
                // await this.repositories.message.delete(au.churchId, id);
                return "";
            }
        });
    }

    @httpGet("/cleanup")
    public async cleanup(req: express.Request<{}, {}, {}>, res: express.Response): Promise<any> {
        return this.actionWrapperAnon(req, res, async () => {
            return "";

        });
    }



}
