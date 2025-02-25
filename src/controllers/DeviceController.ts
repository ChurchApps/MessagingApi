import { controller, httpPost, requestParam, httpDelete, interfaces, httpGet } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { Device } from "../models";
import { FirebaseHelper } from "../helpers/FirebaseHelper";

@controller("/devices")
export class DeviceController extends MessagingBaseController {

  @httpGet("/my")
  public async loadMy(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      return this.repositories.device.loadActiveForPerson(au.personId);
    });
  }


  @httpGet("/deviceId/:deviceId")
  public async getUnique(@requestParam("uniqueId") uniqueId: string, req: express.Request<{}, {}, {}>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const device = await this.repositories.device.loadByDeviceId(uniqueId);
      return device || {};
    })
  }

  @httpGet("/player/:deviceId")
  public async load(@requestParam("deviceId") deviceId: string, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {

      const device = await this.repositories.device.loadById(deviceId);
      if (!device) return { error: "Device not found" };
      const result = {
        manualPlaylistsApiUrl: "https://api.lessons.church/classrooms/player/" + deviceId,
        libraryApiUrl: "https://contentapi.churchapps.org/sermons/public/tvWrapper/" + device.churchId
      }
      return result;
    });
  }

  @httpPost("/register")
  public async register(req: express.Request<{}, {}, Device>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      let device: Device = req.body;
      if (au) {
        device.personId = au.personId;
        device.churchId = au.churchId;
      }
      device = await this.repositories.device.save(device);
      return { "id": device.id };
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
      const result: string[] = [];
      const devices: Device[] = await this.repositories.device.loadForPerson(req.body.personId);
      const promises: Promise<any>[] = [];
      devices.forEach(device => {
        result.push(device.fcmToken);
        promises.push(FirebaseHelper.sendMessage(device.fcmToken, req.body.title.toString(), req.body.body.toString()));
      });
      await Promise.all(promises);
      return { devices: result };
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
      return this.json({});
    });
  }




}
