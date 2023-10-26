import { controller, httpGet, httpPost, interfaces } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { Notification } from "../models";
import { ArrayHelper } from "@churchapps/apihelper";
import { NotificationHelper } from "../helpers/NotificationHelper";

@controller("/notifications")
export class NotificationController extends MessagingBaseController {

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Notification[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      const promises: Promise<Notification>[] = [];
      req.body.forEach(n => {
        n.churchId = au.churchId;
        promises.push(this.repositories.notification.save(n));
      });
      const result = await Promise.all(promises);
      return result;
    });
  }

  @httpPost("/ping")
  public async ping(req: express.Request<{}, {}, any>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const notifications:Notification[] = [];
      req.body.peopleIds.forEach((personId: string) => {
        const notification:Notification = {
          churchId: req.body.churchId,
          personId,
          contentType: req.body.contentType,
          contentId: req.body.contentId,
          timeSent: new Date(),
          isNew: true,
          message: req.body.message
        };
        console.log(notification);
        notifications.push(notification);
      });

      // don't notify people a second time about the same type of event.
      const existing = await this.repositories.notification.loadExistingUnread(notifications[0].churchId, notifications[0].contentType, notifications[0].contentId);
      for (let i=notifications.length-1; i>=0; i--) {
        if (ArrayHelper.getAll(existing, "personId", notifications[i].personId).length > 0) notifications.splice(i, 1);
      }

      if (notifications.length > 0) {
        const promises: Promise<Notification>[] = [];
        notifications.forEach(n => {
          const promise = this.repositories.notification.save(n).then((notification) => {
            NotificationHelper.notifyUser(n.churchId, n.personId);
            return n;
          });
          promises.push(promise);
        });
        const result = await Promise.all(promises);
        return result;
      } else return []


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
