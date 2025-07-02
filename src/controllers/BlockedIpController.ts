import { controller, httpPost } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController";
import { BlockedIp } from "../models";
import { DeliveryHelper } from "../helpers/DeliveryHelper";

@controller("/blockedIps")
export class BlockedIpController extends MessagingBaseController {
  @httpPost("/")
  public async save(req: express.Request<{}, {}, BlockedIp[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      const promises: Promise<BlockedIp>[] = [];
      req.body.forEach((blockedIp) => {
        blockedIp.churchId = au.churchId;
        const promise = this.repositories.blockedIp.save(blockedIp).then(async (ip: BlockedIp) => {
          await DeliveryHelper.sendBlockedIps(blockedIp.churchId, blockedIp.conversationId);
          return ip;
        });
        promises.push(promise);
      });
      const result = this.repositories.blockedIp.convertAllToModel(await Promise.all(promises));
      return result;
    });
  }

  @httpPost("/clear")
  public async clear(
    req: express.Request<{}, {}, { serviceId: string; churchId: string }[]>,
    res: express.Response
  ): Promise<any> {
    return this.actionWrapper(req, res, async () => {
      for (const { serviceId, churchId } of req.body) {
        const ips = await this.repositories.blockedIp.loadByServiceId(churchId, serviceId);
        if (ips.length > 0) {
          await this.repositories.blockedIp.deleteByServiceId(churchId, serviceId);
        }
      }
    });
  }
}
