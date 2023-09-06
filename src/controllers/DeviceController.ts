import { controller, httpPost, requestParam, httpDelete, interfaces } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { Device } from "../models";
import { FirebaseHelper } from "../helpers/FirebaseHelper";


@controller("/devices")
export class MessageController extends MessagingBaseController {

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Device[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const promises: Promise<Device>[] = [];
      req.body.forEach(device => {
        device.userId = au.id;
        promises.push(this.repositories.device.save(device));
      });
      const result = await Promise.all(promises);
      return result;
    });
  }


  @httpPost("/tempSendManual")
  public async send(req: express.Request<{}, {}, any>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      await FirebaseHelper.sendMessage(req.body.fcmToken, req.body.message);
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      await this.repositories.device.delete(id);
    });
  }




}
