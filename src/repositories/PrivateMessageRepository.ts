import { DB } from "@churchapps/apihelper";
import { PrivateMessage } from "../models";
import { UniqueIdHelper } from "../helpers";

export class PrivateMessageRepository {
  public async loadUndelivered() {
    const result: any = await DB.query(
      "SELECT * FROM privateMessages WHERE notifyPersonId IS NOT NULL AND deliveryMethod<>'email';",
      []
    );
    return result.rows || result || [];
  }

  public async loadForPerson(churchId: string, personId: string) {
    const sql =
      "SELECT c.*, pm.id as pmId, pm.fromPersonId, pm.toPersonId, pm.notifyPersonId, m.timeSent as lastMessageTime" +
      " FROM privateMessages pm" +
      " INNER JOIN conversations c on c.id=pm.conversationId" +
      " LEFT JOIN messages m on m.id=c.lastPostId" +
      " WHERE pm.churchId=? AND (pm.fromPersonId=? OR pm.toPersonId=?)" +
      " ORDER by COALESCE(m.timeSent, c.dateCreated) desc";
    const result: any = await DB.query(sql, [churchId, personId, personId]);
    const data = result.rows || result || [];
    return this.convertAllToModel(data);
  }

  public async loadExisting(churchId: string, personId: string, otherPersonId: string) {
    const sql =
      "SELECT c.*, pm.id as pmId, pm.fromPersonId, pm.toPersonId, pm.notifyPersonId, m.timeSent as lastMessageTime" +
      " FROM privateMessages pm" +
      " INNER JOIN conversations c on c.id=pm.conversationId" +
      " LEFT JOIN messages m on m.id=c.lastPostId" +
      " WHERE pm.churchId=? AND ((pm.fromPersonId=? and pm.toPersonId=?) OR (pm.fromPersonId=? AND pm.toPersonId=?))" +
      " ORDER by COALESCE(m.timeSent, c.dateCreated) desc";
    const result: any = await DB.queryOne(sql, [churchId, personId, otherPersonId, otherPersonId, personId]);
    const data = result.rows || result || {};
    return data ? this.convertToModel(data) : null;
  }

  public async loadById(churchId: string, id: string) {
    const result: any = await DB.queryOne("SELECT * FROM privateMessages WHERE id=? AND churchId=?;", [id, churchId]);
    return result.rows || result || {};
  }

  public async loadByConversationId(churchId: string, converstationId: string) {
    const result: any = await DB.queryOne("SELECT * FROM privateMessages WHERE churchId=? AND conversationId=?;", [
      churchId,
      converstationId
    ]);
    return result.rows || result || {};
  }

  public save(pm: PrivateMessage) {
    return pm.id ? this.update(pm) : this.create(pm);
  }

  private async create(pm: PrivateMessage) {
    pm.id = UniqueIdHelper.shortId();
    const sql =
      "INSERT INTO privateMessages (id, churchId, fromPersonId, toPersonId, conversationId, notifyPersonId) VALUES (?, ?, ?, ?, ?, ?);";
    const params = [pm.id, pm.churchId, pm.fromPersonId, pm.toPersonId, pm.conversationId, pm.notifyPersonId];
    await DB.query(sql, params);
    return pm;
  }

  private async update(pm: PrivateMessage) {
    const sql = "UPDATE privateMessages SET notifyPersonId=? WHERE id=? AND churchId=?;";
    const params = [pm.notifyPersonId, pm.id, pm.churchId];
    await DB.query(sql, params);
    return pm;
  }

  public async markAllRead(churchId: string, personId: string) {
    const sql =
      "UPDATE privateMessages set notifyPersonId=NULL, deliveryMethod=NULL WHERE churchId=? AND notifyPersonId=?;";
    return DB.query(sql, [churchId, personId]);
  }

  public convertToModel(data: any) {
    const result: PrivateMessage = {
      id: data.pmId,
      churchId: data.churchId,
      conversationId: data.id,
      fromPersonId: data.fromPersonId,
      toPersonId: data.toPersonId,
      notifyPersonId: data.notifyPersonId,

      conversation: {
        id: data.id,
        churchId: data.churchId,
        contentType: data.contentType,
        contentId: data.contentId,
        title: data.title,
        dateCreated: data.dateCreated,
        groupId: data.groupId,
        visibility: data.visibility,
        firstPostId: data.firstPostId,
        lastPostId: data.lastPostId,
        postCount: data.postCount,
        allowAnonymousPosts: data.allowAnonymousPosts
      }
    };
    return result;
  }

  public convertAllToModel(data: any[]) {
    const result: PrivateMessage[] = [];
    data.forEach((d) => result.push(this.convertToModel(d)));
    return result;
  }
}
