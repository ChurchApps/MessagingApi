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

    public async delete(churchId: string, id: string) {
        DB.query("DELETE FROM conversations WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public async save(conversation: Conversation) {
        if (UniqueIdHelper.isMissing(conversation.id)) return this.create(conversation); else return this.update(conversation);
    }

    public async loadCurrent(churchId: string, contentType: string, contentId: string) {
        const cutOff = new Date();
        cutOff.setDate(cutOff.getDate() - 1);
        const sql = "select *"
            + " FROM conversations"
            + " WHERE churchId=? and contentType=? AND contentId=? AND dateCreated>=? LIMIT 1;"
        return DB.queryOne(sql, [churchId, contentType, contentId, cutOff]);
    }

    public async loadHostConversation(churchId: string, mainConversationId: string) {
        const sql = "select c2.*"
            + " FROM conversations c"
            + " INNER JOIN conversations c2 on c2.churchId=c.churchId and c2.contentType='hostChat' and c2.contentId=c.contentId"
            + " WHERE c.id=? AND c.churchId=? LIMIT 1;"
        return DB.queryOne(sql, [mainConversationId, churchId]);
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
