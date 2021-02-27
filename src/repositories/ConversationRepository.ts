import { DB } from "../apiBase/db";
import { Conversation } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ConversationRepository {

    public async loadById(churchId: string, id: string) {
        return DB.queryOne("SELECT * FROM conversations WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public async loadForContent(churchId: string, contentType: string, contentId: string) {
        return DB.query("SELECT * FROM conversations WHERE churchId=? AND contentType=? AND contentId=?", [churchId, contentType, contentId]);
    }

    public async delete(churchId: number, id: number) {
        DB.query("DELETE FROM conversations WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public async save(conversation: Conversation) {
        if (UniqueIdHelper.isMissing(conversation.id)) return this.create(conversation); else return this.update(conversation);
    }

    public async create(conversation: Conversation) {
        conversation.id = UniqueIdHelper.shortId();
        const sql = "INSERT INTO conversations (id, churchId, contentType, contentId, title, dateCreated) VALUES (?, ?, ?, ?, ?, NOW());";
        const params = [conversation.id, conversation.churchId, conversation.contentType, conversation.contentId, conversation.title];
        return DB.query(sql, params).then((row: any) => { return conversation; });
    }

    public async update(conversation: Conversation) {
        const sql = "UPDATE conversations SET title=? WHERE id=? AND churchId=?;";
        const params = [conversation.title, conversation.id, conversation.churchId]
        return DB.query(sql, params).then(() => { return conversation });
    }

    public convertToModel(data: any) {
        const result: Conversation = { id: data.id, churchId: data.churchId, contentType: data.contentType, contentId: data.contentId, title: data.title, dateCreated: data.dateCreated };
        return result;
    }

    public convertAllToModel(data: any[]) {
        const result: Conversation[] = [];
        data.forEach(d => result.push(this.convertToModel(d)));
        return result;
    }

}
