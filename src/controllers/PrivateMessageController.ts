import { controller, httpGet, httpPost, interfaces, requestParam } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { PrivateMessage } from "../models";
import { ArrayHelper } from "@churchapps/apihelper";
import { NotificationHelper } from "../helpers/NotificationHelper";

@controller("/privateMessages")
export class PrivateMessageController extends MessagingBaseController {

  @httpPost("/")
  public async save(req: express.Request<{}, {}, PrivateMessage[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      const promises: Promise<PrivateMessage>[] = [];
      req.body.forEach(conv => {
        conv.churchId = au.churchId;
        const promise = this.repositories.privateMessage.save(conv).then(c => {
          // console.log("NOTIFYING")
          // NotificationHelper.notifyUser(au.churchId, c.toPersonId);
          return c;
        });
        promises.push(promise);
      });
      const result = await Promise.all(promises);
      return result;
    });
  }

  @httpGet("/")
  public async getAll(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const privateMessages: PrivateMessage[] = await this.repositories.privateMessage.loadForPerson(au.churchId, au.personId);
      const messageIds: string[] = [];
      privateMessages.forEach(pm => {
        if (messageIds.indexOf(pm.conversation.lastPostId) === -1) messageIds.push(pm.conversation.lastPostId);
      });
      if (messageIds.length > 0) {
        const allMessages = await this.repositories.message.loadByIds(au.churchId, messageIds);
        privateMessages.forEach(pm => {
          pm.conversation.messages = [ArrayHelper.getOne(allMessages, "id", pm.conversation.lastPostId)];
        })
      }

      await this.repositories.privateMessage.markAllRead(au.churchId, au.personId);

      return privateMessages;
    });
  }

  @httpGet("/existing/:personId")
  public async getExisting(@requestParam("personId") personId: string, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const existing = await this.repositories.privateMessage.loadExisting(au.churchId, au.personId, personId);
      return existing || {};
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.privateMessage.loadById(au.churchId, id);
    });
  }

}
