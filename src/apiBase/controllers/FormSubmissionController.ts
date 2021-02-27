import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { CustomBaseController } from "./CustomBaseController"
import { FormSubmission, Answer } from "../models"
import { Permissions } from "../helpers";

@controller("/formsubmissions")
export class FormSubmissionController extends CustomBaseController {

    @httpGet("/:id")
    public async get(@requestParam("id") id: number, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.forms.view)) return this.json({}, 401);
            const result: FormSubmission = this.baseRepositories.formSubmission.convertToModel(au.churchId, await this.baseRepositories.formSubmission.load(au.churchId, id));
            if (this.include(req, "form")) await this.appendForm(au.churchId, result);
            if (this.include(req, "questions")) await this.appendQuestions(au.churchId, result);
            if (this.include(req, "answers")) await this.appendAnswers(au.churchId, result);
            return result;
        });
    }

    @httpGet("/")
    public async getAll(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.forms.view)) return this.json({}, 401);
            else {
                let result = null;
                if (req.query.personId !== undefined) result = await this.baseRepositories.formSubmission.loadForContent(au.churchId, "person", parseInt(req.query.personId.toString(), 0));
                else result = await this.baseRepositories.formSubmission.loadAll(au.churchId);
                return this.baseRepositories.formSubmission.convertAllToModel(au.churchId, result);
            }
        });
    }

    @httpPost("/")
    public async save(req: express.Request<{}, {}, FormSubmission[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.forms.edit)) return this.json({}, 401);
            else {
                const promises: Promise<FormSubmission>[] = [];
                req.body.forEach(formsubmission => { formsubmission.churchId = au.churchId; promises.push(this.baseRepositories.formSubmission.save(formsubmission)); });
                const result = await Promise.all(promises);

                const answerPromises: Promise<Answer>[] = []
                for (let i = 0; i < req.body.length; i++) {
                    const answers = req.body[i].answers;
                    if (answers !== undefined && answers !== null) {
                        answers.forEach(a => {
                            a.formSubmissionId = result[i].id;
                            a.churchId = au.churchId;
                            answerPromises.push(this.baseRepositories.answer.save(a));
                        });
                    }
                }
                if (answerPromises.length > 0) await Promise.all(answerPromises);

                return this.baseRepositories.formSubmission.convertAllToModel(au.churchId, result);
            }
        });
    }

    @httpDelete("/:id")
    public async delete(@requestParam("id") id: number, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.forms.edit)) return this.json({}, 401);
            else {
                await this.baseRepositories.answer.deleteForSubmission(au.churchId, id);
                await new Promise(resolve => setTimeout(resolve, 500)); // I think it takes a split second for the FK restraints to see the answers were deleted sometimes and the delete below fails.
                await this.baseRepositories.formSubmission.delete(au.churchId, id);
            }
        });
    }

    private async appendForm(churchId: number, formSubmission: FormSubmission) {
        const data = await this.baseRepositories.form.load(churchId, formSubmission.formId);
        formSubmission.form = this.baseRepositories.form.convertToModel(churchId, data);
    }

    private async appendQuestions(churchId: number, formSubmission: FormSubmission) {
        const data = await this.baseRepositories.question.loadForForm(churchId, formSubmission.formId);
        formSubmission.questions = this.baseRepositories.question.convertAllToModel(churchId, data);
    }

    private async appendAnswers(churchId: number, formSubmission: FormSubmission) {
        const data = await this.baseRepositories.answer.loadForFormSubmission(churchId, formSubmission.id);
        formSubmission.answers = this.baseRepositories.answer.convertAllToModel(churchId, data);
    }

}
