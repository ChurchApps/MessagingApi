import { injectable } from "inversify";
import { DB } from "../db";
import { FormSubmission } from "../models";
import { DateTimeHelper } from '../helpers'

@injectable()
export class FormSubmissionRepository {

    public async save(formSubmission: FormSubmission) {
        if (formSubmission.id > 0) return this.update(formSubmission); else return this.create(formSubmission);
    }

    public async create(formSubmission: FormSubmission) {
        const submissionDate = DateTimeHelper.toMysqlDate(formSubmission.submissionDate);
        const revisionDate = DateTimeHelper.toMysqlDate(formSubmission.revisionDate);
        return DB.query(
            "INSERT INTO formSubmissions (churchId, formId, contentType, contentId, submissionDate, submittedBy, revisionDate, revisedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
            [formSubmission.churchId, formSubmission.formId, formSubmission.contentType, formSubmission.contentId, submissionDate, formSubmission.submittedBy, revisionDate, formSubmission.revisedBy]
        ).then((row: any) => { formSubmission.id = row.insertId; return formSubmission; });
    }

    public async update(formSubmission: FormSubmission) {
        return DB.query(
            "UPDATE formSubmissions SET revisionDate=NOW(), contentId=?, revisedBy=? WHERE id=? and churchId=?",
            [formSubmission.contentId, formSubmission.revisedBy, formSubmission.id, formSubmission.churchId]
        ).then(() => { return formSubmission });
    }

    public async delete(churchId: number, id: number) {
        const sql = "DELETE FROM formSubmissions WHERE id=? AND churchId=?;";
        // const params = [id, churchId];  //I can't figure ot why, but "id" is a string here.
        const params = [parseInt(id.toString(), 0), churchId];
        DB.query(sql, params);
    }

    public async load(churchId: number, id: number) {
        return DB.queryOne("SELECT * FROM formSubmissions WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public async loadAll(churchId: number) {
        return DB.query("SELECT * FROM formSubmissions WHERE churchId=?;", [churchId]);
    }

    public async loadForContent(churchId: number, contentType: string, contentId: number) {
        return DB.query("SELECT * FROM formSubmissions WHERE churchId=? AND contentType=? AND contentId=?;", [churchId, contentType, contentId]);
    }

    public convertToModel(churchId: number, data: any) {
        const result: FormSubmission = { id: data.id, formId: data.formId, contentType: data.contentType, contentId: data.contentId, submissionDate: data.subissionDate, submittedBy: data.submittedBy, revisionDate: data.revisionDate, revisedBy: data.revisedBy };
        return result;
    }

    public convertAllToModel(churchId: number, data: any[]) {
        const result: FormSubmission[] = [];
        data.forEach(d => result.push(this.convertToModel(churchId, d)));
        return result;
    }

}
