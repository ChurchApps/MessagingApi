import { controller, httpPost, interfaces } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController";
import { SocketHelper } from "../helpers/SocketHelper";

@controller("/blockedIps")
export class BlockedIpsController extends MessagingBaseController {

    @httpPost("/clear")
    public async clearBlockedIps(req: express.Request<{}, {}, { serviceId: string }[]>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            req.body.forEach(({ serviceId }) => {
                SocketHelper.clearBlockedIps(serviceId);
                res.status(200).send({ message: "BlockedIps Cleared for service: " + serviceId });
            });
        });
    }
}