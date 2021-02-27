import { DB } from "../apiBase/db";
import { Message } from "../models";
import { UniqueIdHelper } from "../helpers";

export class MessageRepository {

    public async loadById(churchId: string, id: string) {
        return DB.queryOne("SELECT * FROM messages WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public async loadForConversation(churchId: string, conversationId: string) {
        return DB.query("SELECT * FROM messages WHERE churchId=? AND conversationId=?", [churchId, conversationId]);
    }

    public async delete(churchId: number, id: number) {
        DB.query("DELETE FROM messages WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public async save(message: Message) {
        if (UniqueIdHelper.isMissing(message.id)) return this.create(message); else return this.update(message);
    }

    public async create(message: Message) {
        message.id = UniqueIdHelper.shortId();
        const sql = "INSERT INTO messages (id, churchId, conversationId, userId, displayName, timeSent, messageType, content) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?);";
        const params = [message.id, message.churchId, message.conversationId, message.userId, message.displayName, message.messageType, message.content];
        return DB.query(sql, params);
    }

    public async update(message: Message) {
        const sql = "UPDATE messages SET userId=?, displayName=?, content=? WHERE id=? AND churchId=?;";
        const params = [message.userId, message.displayName, message.content, message.id, message.churchId]
        return DB.query(sql, params);
    }

    public convertToModel(data: any) {
        const result: Message = { id: data.id, churchId: data.churchId, conversationId: data.conversationId, userId: data.userId, displayName: data.displayName, timeSent: data.timeSent, messageType: data.messageType, content: data.content };
        return result;
    }

    public convertAllToModel(data: any[]) {
        const result: Message[] = [];
        data.forEach(d => result.push(this.convertToModel(d)));
        return result;
    }

}
