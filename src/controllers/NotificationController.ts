import { controller, httpGet, httpPost, interfaces } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController";
import { Notification } from "../models";
import { NotificationHelper } from "../helpers/NotificationHelper";

@controller("/notifications")
export class NotificationController extends MessagingBaseController {
  @httpPost("/")
  public async save(req: express.Request<{}, {}, Notification[]>, res: express.Response): Promise<unknown> {
    return this.actionWrapper(req, res, async (au) => {
      const promises: Promise<Notification>[] = [];
      req.body.forEach((n) => {
        n.churchId = au.churchId;
        promises.push(this.repositories.notification.save(n));
      });
      const result = await Promise.all(promises);
      return result;
    });
  }

  @httpPost("/create")
  public async create(req: express.Request<{}, {}, any>, res: express.Response): Promise<unknown> {
    return this.actionWrapper(req, res, async (au) => {
      return await NotificationHelper.createNotifications(
        req.body.peopleIds,
        au.churchId,
        req.body.contentType,
        req.body.contentId,
        req.body.message,
        req.body?.link
      );
    });
  }

  @httpPost("/ping")
  public async ping(req: express.Request<{}, {}, any>, res: express.Response): Promise<unknown> {
    return this.actionWrapperAnon(req, res, async () => {
      return await NotificationHelper.createNotifications(
        [req.body.personId],
        req.body.churchId,
        req.body.contentType,
        req.body.contentId,
        req.body.message
      );
    });
  }

  @httpGet("/tmpEmail")
  public async tmpEmail(req: express.Request<{}, {}, any>, res: express.Response): Promise<unknown> {
    return this.actionWrapperAnon(req, res, async () => {
      return await NotificationHelper.sendEmailNotifications("daily");
    });
  }

  @httpGet("/my")
  public async loadMy(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const existing = await this.repositories.notification.loadForPerson(au.churchId, au.personId);
      await this.repositories.notification.markALlRead(au.churchId, au.personId);
      return existing || {};
    });
  }

  @httpGet("/unreadCount")
  public async loadMyUnread(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const existing = await this.repositories.notification.loadNewCounts(au.churchId, au.personId);
      return existing || {};
    });
  }
}
