import { controller, httpPost, requestParam, httpDelete, interfaces, httpGet } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { DeviceContent } from "../models";
import { FirebaseHelper } from "../helpers/FirebaseHelper";

@controller("/deviceContentContents")
export class DeviceContentController extends MessagingBaseController {

  @httpGet("/deviceId/:deviceId")
  public async getUnique(@requestParam("deviceId") deviceId: string, req: express.Request<{}, {}, {}>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const deviceContent = await this.repositories.deviceContent.loadByDeviceId(deviceId);
      return deviceContent;
    })
  }


  @httpPost("/")
  public async save(req: express.Request<{}, {}, DeviceContent[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const promises: Promise<DeviceContent>[] = [];
      req.body.forEach(deviceContent => {
        deviceContent.churchId = au.churchId;
        promises.push(this.repositories.deviceContent.save(deviceContent));
      });
      const result = await Promise.all(promises);
      return result;
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      await this.repositories.deviceContent.delete(id);
      return this.json({});
    });
  }




}
