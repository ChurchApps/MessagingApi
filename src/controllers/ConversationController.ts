import { controller, httpGet, httpPost, requestParam } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { Permissions } from "../helpers/Permissions";
import { Conversation } from "../models";
import { DeliveryHelper } from "../helpers/DeliveryHelper";

@controller("/conversations")
export class ConversationController extends MessagingBaseController {


    @httpGet("/:privateMessage/:connectionId")
    public async privateMessage(@requestParam("connectionId") connectionId: string, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.chat.host)) return this.json({}, 401);
            else {
                const connection = await this.repositories.connection.loadById(au.churchId, connectionId);
                if (connection !== null) {
                    const privateConversation = await this.repositories.conversation.save({ contentId: connectionId, contentType: "privateMessage", dateCreated: new Date(), title: "Private Message", churchId: au.churchId });
                    await DeliveryHelper.sendMessage(connection, { churchId: au.churchId, conversationId: privateConversation.id, action: "privateMessage", data: privateConversation });

                    const hostConversation = await this.repositories.conversation.loadHostConversation(connection.churchId, connection.conversationId)
                    await DeliveryHelper.sendMessages({ churchId: au.churchId, conversationId: hostConversation.id, action: "privateRoomAdded", data: privateConversation });

                    return privateConversation;
                }
            }

        });
    }


    @httpGet("/requestPrayer/:churchId/:conversationId")
    public async requestPrayer(@requestParam("churchId") churchId: string, @requestParam("conversationId") conversationId: string, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
        return this.actionWrapperAnon(req, res, async () => {
            const conversation = await this.repositories.conversation.loadById(churchId, conversationId);
            const hostConversation = await this.getOrCreate(churchId, "streamingLiveHost", conversation.contentId);
            const prayerConversation = await this.repositories.conversation.save({ contentId: conversation.contentId, contentType: "prayer", dateCreated: new Date(), title: "Prayer request", churchId });
            await DeliveryHelper.sendMessages({ churchId: hostConversation.churchId, conversationId: hostConversation.id, action: "prayerRequest", data: prayerConversation });
            return prayerConversation;
        });
    }


    @httpGet("/current/:churchId/:contentType/:contentId")
    public async current(@requestParam("churchId") churchId: string, @requestParam("contentType") contentType: string, @requestParam("contentId") contentId: string, req: express.Request<{}, {}, {}>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            if (contentType === "streamingLive" || au.checkAccess(Permissions.chat.host)) {
                return await this.getOrCreate(churchId, contentType, contentId);
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

    private async getOrCreate(churchId: string, contentType: string, contentId: string) {
        let result: Conversation = await this.repositories.conversation.loadCurrent(churchId, contentType, contentId);
        if (result === null) {
            result = { contentId, contentType, dateCreated: new Date(), title: contentType + " #" + contentId, churchId }
            result = await this.repositories.conversation.save(result);
        }
        return result;
    }



}
