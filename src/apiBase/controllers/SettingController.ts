import { controller, httpPost, httpGet, interfaces } from "inversify-express-utils"
import express from "express"
import { Setting } from "../models"
import { CustomBaseController } from "./CustomBaseController"
import { Permissions } from "../helpers"

@controller("/settings")
export class SettingController extends CustomBaseController {

    @httpGet("/")
    public async get(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.settings.edit)) return this.json({}, 401);
            else {
                return this.baseRepositories.setting.convertAllToModel(au.churchId, await this.baseRepositories.setting.loadAll(au.churchId));
            }
        })
    }

    @httpPost("/")
    public async post(req: express.Request<{}, {}, Setting[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.settings.edit)) return this.json({}, 401);
            else {
                const promises: Promise<Setting>[] = []
                req.body.forEach(setting => {
                    setting.churchId = au.churchId;
                    promises.push(this.baseRepositories.setting.save(setting));
                })
                const result = await Promise.all(promises);
                return this.baseRepositories.setting.convertAllToModel(au.churchId, result);
            }
        })
    }
}