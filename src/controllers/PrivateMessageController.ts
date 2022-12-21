import { controller, httpGet, httpPost, interfaces, requestParam } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { PrivateMessage } from "../models";
import { ArrayHelper } from "../apiBase";

@controller("/privateMessages")
export class PrivateMessageController extends MessagingBaseController {

  @httpPost("/")
  public async save(req: express.Request<{}, {}, PrivateMessage[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      const promises: Promise<PrivateMessage>[] = [];
      req.body.forEach(conv => {
        conv.churchId = au.churchId;
        promises.push(this.repositories.privateMessage.save(conv));
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
      return privateMessages;
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.privateMessage.loadById(au.churchId, id);
    });
  }

}
