import { controller, httpPost, requestParam, httpDelete, interfaces } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { Device, Message } from "../models";
import { FirebaseHelper } from "../helpers/FirebaseHelper";

@controller("/devices")
export class DeviceController extends MessagingBaseController {

  @httpPost("/register")
  public async register(req: express.Request<{}, {}, Device>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const device: Device = req.body;
      device.personId = au.personId;
      if (device.personId) await this.repositories.device.save(device);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Device[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const promises: Promise<Device>[] = [];
      req.body.forEach(device => {
        device.personId = au.personId;
        promises.push(this.repositories.device.save(device));
      });
      const result = await Promise.all(promises);
      return result;
    });
  }

  @httpPost("/tempMessageUser")
  public async sendUser(req: express.Request<{}, {}, any>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      const result:string[] = [];
      const devices:Device[] = await this.repositories.device.loadForPerson(req.body.personId);
      const promises: Promise<any>[] = [];
      devices.forEach(device => {
        result.push(device.fcmToken);
        promises.push(FirebaseHelper.sendMessage(device.fcmToken, req.body.title.toString(), req.body.body.toString()));
      });
      await Promise.all(promises);
      return {devices: result};
    });
  }

  @httpPost("/tempSendManual")
  public async sendManual(req: express.Request<{}, {}, any>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      await FirebaseHelper.sendMessage(req.body.fcmToken, req.body.title.toString(), req.body.body.toString());
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      await this.repositories.device.delete(id);
    });
  }




}
