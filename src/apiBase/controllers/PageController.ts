import { controller, httpPost, httpGet, httpDelete, requestParam } from "inversify-express-utils";
import { Page } from "../models";
import express from "express";
import { CustomBaseController } from "./CustomBaseController";
import { Permissions } from "../helpers";

@controller("/pages")
export class PageController extends CustomBaseController {

    @httpGet("/")
    public async loadAll(req: express.Request, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            return await this.baseRepositories.page.loadAll(au.churchId);
        });
    }

    @httpGet("/:id")
    public async load(@requestParam("id") id: number, req: express.Request, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            const result = await this.baseRepositories.page.loadById(id, au.churchId);
            return result;
        });
    }

    @httpPost("/")
    public async save(req: express.Request<{}, {}, Page[]>, res: express.Response): Promise<any> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.pages.edit)) return this.json({}, 401);
            else {
                let pages: Page[] = req.body;
                const promises: Promise<Page>[] = [];
                pages.forEach((page) => {
                    if (page.churchId === au.churchId) promises.push(
                        this.baseRepositories.page.save(page).then(async (p) => {
                            return p;
                        })
                    )
                });
                pages = await Promise.all(promises);
                return this.json(pages, 200);
            }
        });
    }

    @httpDelete("/:id")
    public async delete(@requestParam("id") id: number, req: express.Request, res: express.Response): Promise<void> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.pages.edit)) return this.json({}, 401);
            else this.baseRepositories.page.delete(id, au.churchId);
        });
    }

}
