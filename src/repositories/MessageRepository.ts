import { DB } from "../apiBase/db";
import { Message } from "../models";
import { UniqueIdHelper } from "../helpers";
import { ConversationRepository } from "./ConversationRepository";

export class MessageRepository {

  public loadById(churchId: string, id: string) {
    return DB.queryOne("SELECT * FROM messages WHERE id=? AND churchId=?;", [id, churchId]);
  }

  public loadForConversation(churchId: string, conversationId: string) {
    return DB.query("SELECT * FROM messages WHERE churchId=? AND conversationId=? ORDER BY timeSent", [churchId, conversationId]);
  }

  public delete(churchId: string, id: string) {
    return DB.query("DELETE FROM messages WHERE id=? AND churchId=?;", [id, churchId]);
  }

  public save(message: Message) {
    return message.id ? this.update(message) : this.create(message);
  }

  private async create(message: Message) {
    message.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO messages (id, churchId, conversationId, userId, personId, displayName, timeSent, messageType, content) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?);";
    const params = [message.id, message.churchId, message.conversationId, message.userId, message.personId, message.displayName, message.messageType, message.content];
    await DB.query(sql, params);
    return message;
  }

  private async update(message: Message) {
    const sql = "UPDATE messages SET userId=?, displayName=?, content=?, timeUpdated=? WHERE id=? AND churchId=?;";
    const params = [message.userId, message.displayName, message.content, message.timeUpdated, message.id, message.churchId]
    await DB.query(sql, params)
    return message;
  }

  public convertToModel(data: any) {
    const result: Message = { id: data.id, churchId: data.churchId, conversationId: data.conversationId, userId: data.userId, displayName: data.displayName, timeSent: data.timeSent, messageType: data.messageType, content: data.content, personId: data.personId, timeUpdated: data.timeUpdated };
    return result;
  }

  public convertAllToModel(data: any[]) {
    const result: Message[] = [];
    data.forEach(d => result.push(this.convertToModel(d)));
    return result;
  }

}
