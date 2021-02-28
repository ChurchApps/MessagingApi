import { controller, httpGet, httpPost, requestParam, httpDelete, interfaces } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { Message, Connection, Conversation } from "../models";
import { Permissions } from "../helpers/Permissions";


@controller("/messages")
export class MessageController extends MessagingBaseController {


    @httpPost("/send")
    public async send(req: express.Request<{}, {}, Message[]>, res: express.Response): Promise<any> {
        return this.actionWrapperAnon(req, res, async () => {
            const promises: Promise<Message>[] = [];
            req.body.forEach((message: Message) => {
                //message.userId = 
                message.messageType = "message";
                promises.push(this.repositories.message.save(message));
            });
            return this.repositories.message.convertAllToModel(await Promise.all(promises));
        });
    }

    @httpPost("/setCallout")
    public async setCallout(req: express.Request<{}, {}, Message>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            const promises: Promise<Message>[] = [];
            req.body.messageType = "callout";
            this.repositories.message.save(req.body);
            return this.repositories.message.convertAllToModel(await Promise.all(promises));
        });
    }

    @httpDelete("/:id")
    public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.chat.host)) return this.json({}, 401);
            else await this.repositories.message.delete(au.churchId, id);
        });
    }

    @httpGet("/requestPrayer/:churchId/:connectionId")
    public async loadAll(@requestParam("churchId") churchId: string, @requestParam("connectionId") connectionId: string, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
        return this.actionWrapperAnon(req, res, async () => {
            const connection: Connection = await this.repositories.connection.loadById(churchId, connectionId);
            if (connection !== null) {
                const hostConversation: Conversation = await this.repositories.conversation.loadHostConversation(churchId, connection.conversationId);
                if (hostConversation !== null) {
                    const prayerConversation = await this.createPrayerConversation(connection);
                    //send a message to host room
                    return { conversationId: prayerConversation.id };
                }
            }
            return null;
        });
    }


    private async createPrayerConversation(connection: Connection) {
        return await this.repositories.conversation.save({
            title: connection.displayName + "Prayer Request",
            churchId: connection.churchId,
            contentId: connection.conversationId,
            contentType: "prayerRequest",
        });
    }



}
