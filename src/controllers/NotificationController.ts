import { controller, httpGet, httpPost, interfaces } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { Notification } from "../models";

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


  @httpGet("/my")
  public async loadMy(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const existing = await this.repositories.notification.loadForPerson(au.churchId, au.personId);
      return existing || {};
    });
  }


}
