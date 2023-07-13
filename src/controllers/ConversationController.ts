import { controller, httpGet, httpPost, interfaces, requestParam } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { Conversation, Connection } from "../models";
import { DeliveryHelper } from "../helpers/DeliveryHelper";
import { ArrayHelper } from "../apiBase";

@controller("/conversations")
export class ConversationController extends MessagingBaseController {

  @httpGet("/social/ids")
  public async getSocialByIds(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      const ids = req.query.ids.toString().split(",");
      const result =  await this.repositories.conversation.loadByIds(au.churchId, ids);
      if (result.length > 0) {
        const postIds: string[] = [];
        result.forEach((c: Conversation) => {
          if (c.firstPostId && postIds.indexOf(c.firstPostId) === -1) postIds.push(c.firstPostId);
          if (c.lastPostId && postIds.indexOf(c.lastPostId) === -1) postIds.push(c.lastPostId);
        });
        if (postIds.length > 0)
        {
          const posts = await this.repositories.message.loadByIds(au.churchId, postIds);
          result.forEach((c: any) => {
            if (c.firstPostId) {
              const post = ArrayHelper.getOne(posts, "id", c.firstPostId);
              if (post) c.firstPost = { personId: post.personId, dislayName: post.dislayName, message: post.message, timeSent: post.timeSent }
            }
            if (c.lastPostId) {
              const post = ArrayHelper.getOne(posts, "id", c.lastPostId);
              if (post) c.lastPost = { personId: post.personId, dislayName: post.dislayName, message: post.message, timeSent: post.timeSent }
            }
          });
        }
        result.forEach((c: Conversation) => {
          c.firstPostId = undefined;
          c.lastPostId = undefined;
        });
      }
      return result;
    });
  }

  @httpGet("/posts")
  public async getPosts(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.conversation.loadPosts(au.churchId, au.personId);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Conversation[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      const promises: Promise<Conversation>[] = [];
      req.body.forEach(conv => {
        conv.churchId = au.churchId;
        promises.push(this.repositories.conversation.save(conv));
      });
      const result = await Promise.all(promises);
      return result;
    });
  }

  @httpGet("/:videoChat/:connectionId/:room")
  public async videoChat(@requestParam("connectionId") connectionId: string, @requestParam("room") room: string, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {

      // Permissions are controlled outside of MessagingApi.  If we need to restrict these actions, encrypt the room id in streaminglive app and pass it here to prove access.

      // if (!au.checkAccess(Permissions.chat.host)) return this.json({}, 401);
      // else {
      const connection: Connection = await this.repositories.connection.loadById(au.churchId, connectionId);
      if (connection !== null) {
        await DeliveryHelper.sendMessage(connection, { churchId: au.churchId, conversationId: connection.conversationId, action: "videoChatInvite", data: room });
        return {}
      }
      // }
    });
  }

  @httpGet("/:contentType/:contentId")
  public async forContent(@requestParam("contentType") contentType: string, @requestParam("contentId") contentId: string, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const conversations: Conversation[] = await this.repositories.conversation.loadForContent(au.churchId, contentType, contentId);
      const messageIds: string[] = [];
      conversations.forEach(c => {
        if (messageIds.indexOf(c.firstPostId) === -1) messageIds.push(c.firstPostId);
        if (messageIds.indexOf(c.lastPostId) === -1) messageIds.push(c.lastPostId);
      });
      if (messageIds.length > 0) {
        const allMessages = await this.repositories.message.loadByIds(au.churchId, messageIds);
        conversations.forEach(c => {
          c.messages = [ArrayHelper.getOne(allMessages, "id", c.firstPostId)];
          if (c.lastPostId !== c.firstPostId) c.messages.push(ArrayHelper.getOne(allMessages, "id", c.lastPostId));
        })
      }
      return conversations;
    });
  }

  /*
  @httpGet("/:privateMessage/:connectionId")
  public async privateMessage(@requestParam("connectionId") connectionId: string, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      // if (!au.checkAccess(Permissions.chat.host)) return this.json({}, 401);
      // else {
      const connection: Connection = await this.repositories.connection.loadById(au.churchId, connectionId);
      if (connection !== null) {
        const privateConversation = await this.repositories.conversation.save({ contentId: connectionId, contentType: "privateMessage", dateCreated: new Date(), title: "Private chat with " + connection.displayName, churchId: au.churchId });
        await DeliveryHelper.sendMessage(connection, { churchId: au.churchId, conversationId: privateConversation.id, action: "privateMessage", data: privateConversation });

        const hostConversation = await this.repositories.conversation.loadHostConversation(connection.churchId, connection.conversationId)
        await DeliveryHelper.sendMessages({ churchId: au.churchId, conversationId: hostConversation.id, action: "privateRoomAdded", data: privateConversation });

        return privateConversation;
      }
      // }

    });
  }*/

  @httpGet("/requestPrayer/:churchId/:conversationId")
  public async requestPrayer(@requestParam("churchId") churchId: string, @requestParam("conversationId") conversationId: string, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      const conversation = await this.repositories.conversation.loadById(churchId, conversationId);
      const hostConversation = await this.getOrCreate(churchId, "streamingLiveHost", conversation.contentId, "hidden", true);
      const prayerConversation = await this.repositories.conversation.save({ contentId: conversation.contentId, contentType: "prayer", dateCreated: new Date(), title: "Prayer request", churchId });
      await DeliveryHelper.sendMessages({ churchId: hostConversation.churchId, conversationId: hostConversation.id, action: "prayerRequest", data: prayerConversation });
      return prayerConversation;
    });
  }


  @httpGet("/current/:churchId/:contentType/:contentId")
  public async current(@requestParam("churchId") churchId: string, @requestParam("contentType") contentType: string, @requestParam("contentId") contentId: string, req: express.Request<{}, {}, {}>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.getOrCreate(churchId, contentType, contentId, "public", true);
    });
  }

  @httpGet("/cleanup")
  public async cleanup(req: express.Request<{}, {}, {}>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      return "";

    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.conversation.loadById(au.churchId, id);
    });
  }

  private async getOrCreate(churchId: string, contentType: string, contentId: string, visibility: string, allowAnonymousPosts: boolean) {
    let result: Conversation = await this.repositories.conversation.loadCurrent(churchId, contentType, contentId);
    if (result === null) {
      result = { contentId, contentType, dateCreated: new Date(), title: contentType + " #" + contentId, churchId, visibility, allowAnonymousPosts }
      result = await this.repositories.conversation.save(result);
    }
    return result;
  }



}
