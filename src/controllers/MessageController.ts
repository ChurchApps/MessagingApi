import { controller, httpGet, httpPost, requestParam, httpDelete, interfaces } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { Message, Connection, Conversation } from "../models";
import { Permissions } from "../helpers/Permissions";
import { DeliveryHelper } from "../helpers/DeliveryHelper";


@controller("/messages")
export class MessageController extends MessagingBaseController {

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Message[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const promises: Promise<Message>[] = [];
      req.body.forEach((message: Message) => {
        message.messageType = "message";
        if (au?.id) {
          message.userId = au.id;
          message.displayName = au.firstName + " " + au.lastName;
          message.personId = au.personId;
          message.churchId = au.churchId;
        }

        promises.push(this.repositories.message.save(message).then(async (m: Message) => {
          this.repositories.conversation.updateStats(m.conversationId);
          await DeliveryHelper.sendMessages({ churchId: m.churchId, conversationId: m.conversationId, action: "message", data: m });
          return m;
        }));
      });
      return this.repositories.message.convertAllToModel(await Promise.all(promises));
    });
  }

  // todo remove duplicate (used by streaming live.  Just post to /)
  @httpPost("/send")
  public async send(req: express.Request<{}, {}, Message[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const promises: Promise<Message>[] = [];
      req.body.forEach((message: Message) => {
        message.messageType = "message";
        if (au?.id) {
          message.userId = au.id;
          message.displayName = au.firstName + " " + au.lastName;
          message.personId = au.personId
        }

        promises.push(this.repositories.message.save(message).then(async (m: Message) => {
          this.repositories.conversation.updateStats(m.conversationId);
          await DeliveryHelper.sendMessages({ churchId: m.churchId, conversationId: m.conversationId, action: "message", data: m });
          return m;
        }));
      });
      return this.repositories.message.convertAllToModel(await Promise.all(promises));
    });
  }

  @httpPost("/setCallout")
  public async setCallout(req: express.Request<{}, {}, Message>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      // if (!au.checkAccess(Permissions.chat.host)) return this.json({}, 401);
      // else {
      req.body.messageType = "callout";
      const m = this.repositories.message.convertToModel(await this.repositories.message.save(req.body));
      await DeliveryHelper.sendMessages({ churchId: m.churchId, conversationId: m.conversationId, action: "callout", data: m });
      return m;
      // }
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      // if (!au.checkAccess(Permissions.chat.host)) return this.json({}, 401);
      // else {
      const m = await this.repositories.message.loadById(au.churchId, id);
      if (m !== null) {
        await this.repositories.message.delete(au.churchId, id);
        this.repositories.conversation.updateStats(m.conversationId);
        await DeliveryHelper.sendMessages({ churchId: au.churchId, conversationId: m.conversationId, action: "deleteMessage", data: m.id });
        return m;
      }

      // }
    });
  }

  @httpGet("/conversation/:conversationId")
  public async loadByConversation(@requestParam("conversationId") conversationId: string, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const messages: Message[] = await this.repositories.message.loadForConversation(au.churchId, conversationId);
      return this.repositories.message.convertAllToModel(messages);
    });
  }

  @httpGet("/catchup/:churchId/:conversationId")
  public async catchup(@requestParam("churchId") churchId: string, @requestParam("conversationId") conversationId: string, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      const messages: Message[] = await this.repositories.message.loadForConversation(churchId, conversationId);
      return this.repositories.message.convertAllToModel(messages);
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
