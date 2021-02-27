import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { CustomBaseController } from "./CustomBaseController"
import { Note } from "../models"
import { Permissions } from "../helpers";

@controller("/notes")
export class NoteController extends CustomBaseController {

    @httpGet("/:id")
    public async get(@requestParam("id") id: number, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.notes.view)) return this.json({}, 401);
            else return this.baseRepositories.note.convertToModel(au.churchId, await this.baseRepositories.note.load(au.churchId, id));
        });
    }

    @httpGet("/:contentType/:contentId")
    public async getForContent(@requestParam("contentType") contentType: string, @requestParam("contentId") contentId: number, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.notes.view)) return this.json({}, 401);
            else return await this.baseRepositories.note.loadForContent(au.churchId, contentType, contentId).then(data => {
                return this.baseRepositories.note.convertAllToModel(au.churchId, data)
            });
        });
    }

    @httpGet("/")
    public async getAll(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.notes.view)) return this.json({}, 401);
            else return this.baseRepositories.note.convertAllToModel(au.churchId, await this.baseRepositories.note.loadAll(au.churchId));
        });
    }

    @httpPost("/")
    public async save(req: express.Request<{}, {}, Note[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.notes.edit)) return this.json({}, 401);
            else {
                const promises: Promise<Note>[] = [];
                req.body.forEach(note => { note.churchId = au.churchId; note.addedBy = au.id; promises.push(this.baseRepositories.note.save(note)); });
                const result = await Promise.all(promises);
                return this.baseRepositories.note.convertAllToModel(au.churchId, result);
            }
        });
    }

    @httpDelete("/:id")
    public async delete(@requestParam("id") id: number, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.notes.edit)) return this.json({}, 401);
            else await this.baseRepositories.note.delete(au.churchId, id);
        });
    }




}
