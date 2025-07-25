import { controller, httpGet, httpPost, requestParam, httpDelete, interfaces } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController";
import { Message, Connection } from "../models";
import { DeliveryHelper } from "../helpers/DeliveryHelper";
import { NotificationHelper } from "../helpers/NotificationHelper";

@controller("/messages")
export class MessageController extends MessagingBaseController {
  @httpPost("/")
  public async save(req: express.Request<{}, {}, Message[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      if (!req.body || !Array.isArray(req.body)) {
        return res.status(400).json({ error: "Request body must be an array of messages" });
      }
      
      const promises: Promise<Message>[] = [];
      for (const message of req.body) {
        message.messageType = "message";
        if (message?.id && message.personId !== au.personId) {
          return res.status(403).json({ error: "You can not edit the message sent by others." });
        }
        if (!au || !au.personId) {
          return res.status(401).json({ error: "Authentication required" });
        }
        
        message.personId = au.personId;
        message.displayName = au.firstName + " " + au.lastName;
        message.churchId = au.churchId;

        promises.push(
          this.repositories.message.save(message).then(async (m: Message) => {
            this.repositories.conversation.updateStats(m.conversationId);
            await DeliveryHelper.sendConversationMessages({
              churchId: m.churchId,
              conversationId: m.conversationId,
              action: "message",
              data: m
            });
            const conv = await this.repositories.conversation.loadById(m.churchId, m.conversationId);
            await NotificationHelper.checkShouldNotify(conv, m, au.personId, message.content);
            return m;
          })
        );
      }
      try {
        const results = await Promise.all(promises);
        return this.repositories.message.convertAllToModel(results);
      } catch (error) {
        console.error("Error saving messages:", error);
        return res.status(500).json({ error: "Failed to save messages" });
      }
    });
  }

  // Legacy endpoint for streaming live functionality - will be consolidated with save() in future
  @httpPost("/send")
  public async send(req: express.Request<{}, {}, Message[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      if (!req.body || !Array.isArray(req.body)) {
        return res.status(400).json({ error: "Request body must be an array of messages" });
      }
      
      const promises: Promise<Message>[] = [];
      for (const message of req.body) {
        message.messageType = "message";
        if (!au || !au.personId) {
          return res.status(401).json({ error: "Authentication required" });
        }
        
        message.personId = au.personId;
        message.displayName = au.firstName + " " + au.lastName;

        promises.push(
          this.repositories.message.save(message).then(async (m: Message) => {
            this.repositories.conversation.updateStats(m.conversationId);
            await DeliveryHelper.sendConversationMessages({
              churchId: m.churchId,
              conversationId: m.conversationId,
              action: "message",
              data: m
            });
            const conv = await this.repositories.conversation.loadById(m.churchId, m.conversationId);
            await NotificationHelper.checkShouldNotify(conv, m, au.personId);
            return m;
          })
        );
      }
      try {
        const results = await Promise.all(promises);
        return this.repositories.message.convertAllToModel(results);
      } catch (error) {
        console.error("Error sending messages:", error);
        return res.status(500).json({ error: "Failed to send messages" });
      }
    });
  }

  @httpPost("/setCallout")
  public async setCallout(req: express.Request<{}, {}, Message>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      // if (!au.checkAccess(Permissions.chat.host)) return this.json({}, 401);
      // else {
      req.body.messageType = "callout";
      const m = this.repositories.message.convertToModel(await this.repositories.message.save(req.body));
      await DeliveryHelper.sendConversationMessages({
        churchId: m.churchId,
        conversationId: m.conversationId,
        action: "callout",
        data: m
      });
      return m;
      // }
    });
  }

  @httpDelete("/:id")
  public async delete(
    @requestParam("id") id: string,
    req: express.Request<{}, {}, null>,
    res: express.Response
  ): Promise<unknown> {
    return this.actionWrapper(req, res, async (au) => {
      // if (!au.checkAccess(Permissions.chat.host)) return this.json({}, 401);
      // else {
      const m = await this.repositories.message.loadById(au.churchId, id);
      if (m !== null) {
        await this.repositories.message.delete(au.churchId, id);
        this.repositories.conversation.updateStats(m.conversationId);
        await DeliveryHelper.sendConversationMessages({
          churchId: au.churchId,
          conversationId: m.conversationId,
          action: "deleteMessage",
          data: m.id
        });
        return m;
      }

      // }
    });
  }

  @httpGet("/conversation/:conversationId")
  public async loadByConversation(
    @requestParam("conversationId") conversationId: string,
    req: express.Request<{}, {}, []>,
    res: express.Response
  ): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const messages: Message[] = await this.repositories.message.loadForConversation(au.churchId, conversationId);
      return this.repositories.message.convertAllToModel(messages);
    });
  }

  @httpGet("/catchup/:churchId/:conversationId")
  public async catchup(
    @requestParam("churchId") churchId: string,
    @requestParam("conversationId") conversationId: string,
    req: express.Request<{}, {}, []>,
    res: express.Response
  ): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      const messages: Message[] = await this.repositories.message.loadForConversation(churchId, conversationId);
      return this.repositories.message.convertAllToModel(messages);
    });
  }

  @httpGet("/:id")
  public async get(
    @requestParam("id") id: string,
    req: express.Request<{}, {}, null>,
    res: express.Response
  ): Promise<unknown> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.message.loadById(au.churchId, id);
    });
  }

  private async createPrayerConversation(connection: Connection) {
    return await this.repositories.conversation.save({
      title: connection.displayName + "Prayer Request",
      churchId: connection.churchId,
      contentId: connection.conversationId,
      contentType: "prayerRequest"
    });
  }
}
