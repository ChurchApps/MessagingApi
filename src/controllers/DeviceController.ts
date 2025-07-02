import { controller, httpPost, requestParam, httpDelete, interfaces, httpGet } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController";
import { Device, DeviceContent } from "../models";
import { ExpoPushHelper } from "../helpers/ExpoPushHelper";

@controller("/devices")
export class DeviceController extends MessagingBaseController {
  @httpGet("/my")
  public async loadMy(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      return this.repositories.device.loadActiveForPerson(au.personId);
    });
  }

  @httpGet("/deviceId/:deviceId")
  public async getUnique(
    @requestParam("deviceId") deviceId: string,
    req: express.Request<{}, {}, {}>,
    res: express.Response
  ): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const device = await this.repositories.device.loadByDeviceId(deviceId);
      device.paired = device.personId !== null;
      return device || {};
    });
  }

  @httpGet("/player/:deviceId")
  public async load(
    @requestParam("deviceId") deviceId: string,
    req: express.Request<{}, {}, []>,
    res: express.Response
  ): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      const device = await this.repositories.device.loadById(deviceId);
      if (!device) return { error: "Device not found" };
      const deviceContents = await this.repositories.deviceContent.loadByDeviceId(deviceId);
      const classRoomIds: string[] = [];
      deviceContents.forEach((dc: DeviceContent) => {
        if (dc.contentType === "classroom") classRoomIds.push(dc.contentId);
      });
      const result = {
        manualPlaylistsApiUrl:
          "https://api.lessons.church/classrooms/player/" + device.churchId + "?classrooms=" + classRoomIds.join(","),
        libraryApiUrl: "https://contentapi.churchapps.org/sermons/public/tvWrapper/" + device.churchId
      };
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
      return { id: device.id };
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Device[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const promises: Promise<Device>[] = [];
      req.body.forEach((device) => {
        device.personId = au.personId;
        promises.push(this.repositories.device.save(device));
      });
      const result = await Promise.all(promises);
      return result;
    });
  }

  @httpGet("/pair/:pairingCode")
  public async pair(
    @requestParam("pairingCode") pairingCode: string,
    req: express.Request<{}, {}, {}>,
    res: express.Response
  ): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      let success = false;
      const existing = await this.repositories.device.loadByPairingCode(pairingCode);
      if (existing) {
        existing.personId = au.personId;
        existing.churchId = au.churchId;
        existing.pairingCode = "";
        await this.repositories.device.save(existing);
        success = true;
      }
      return { success };
    });
  }

  @httpPost("/enroll")
  public async enroll(req: express.Request<{}, {}, Device>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      let result = await this.repositories.device.loadByDeviceId(req.body.deviceId);
      if (result) {
        result.pairingCode = req.body.pairingCode;
        result.personId = null;
        await this.repositories.device.save(result);
      } else result = await this.repositories.device.save(req.body);
      return result;
    });
  }

  @httpPost("/tempMessageUser")
  public async sendUser(req: express.Request<{}, {}, any>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      const result: string[] = [];
      const devices: Device[] = await this.repositories.device.loadForPerson(req.body.personId);
      const expoPushTokens = devices.map((device) => device.fcmToken).filter((token) => token);

      if (expoPushTokens.length > 0) {
        await ExpoPushHelper.sendBulkMessages(expoPushTokens, req.body.title.toString(), req.body.body.toString());
      }

      return { devices: expoPushTokens };
    });
  }

  @httpPost("/tempSendManual")
  public async sendManual(req: express.Request<{}, {}, any>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      await ExpoPushHelper.sendMessage(req.body.fcmToken, req.body.title.toString(), req.body.body.toString());
    });
  }

  @httpDelete("/:id")
  public async delete(
    @requestParam("id") id: string,
    req: express.Request<{}, {}, null>,
    res: express.Response
  ): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      await this.repositories.device.delete(id);
      return this.json({});
    });
  }

  @httpGet("/testNotification/:deviceId")
  public async testNotification(
    @requestParam("deviceId") deviceId: string,
    req: express.Request<{}, {}, {}>,
    res: express.Response
  ): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const device = await this.repositories.device.loadById(deviceId);
      if (!device || !device.fcmToken) return { error: "Device not found or has no FCM token" };

      await ExpoPushHelper.sendMessage(
        device.fcmToken,
        "Test Notification",
        "This is a test notification from the API"
      );

      return { success: true, message: "Test notification sent" };
    });
  }
}
