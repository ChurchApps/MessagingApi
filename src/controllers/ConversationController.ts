import { controller, httpGet, httpPost, requestParam } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { Permissions } from "../helpers/Permissions";
import { Conversation } from "../models";


@controller("/conversations")
export class ConversationController extends MessagingBaseController {


    @httpGet("/current/:churchId/:contentType/:contentId")
    public async current(@requestParam("churchId") churchId: string, @requestParam("contentType") contentType: string, @requestParam("contentId") contentId: string, req: express.Request<{}, {}, {}>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            if (contentType === "streamingLive" || au.checkAccess(Permissions.chat.host)) {
                let result: Conversation = await this.repositories.conversation.loadCurrent(churchId, contentType, contentId);
                if (result === null) {
                    result = { contentId, contentType, dateCreated: new Date(), title: contentType + " #" + contentId, churchId }
                    result = await this.repositories.conversation.save(result);
                }
                return result;
            } else return this.json({}, 401);
        });
    }

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
