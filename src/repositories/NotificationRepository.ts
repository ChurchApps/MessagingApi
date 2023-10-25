import { DB } from "@churchapps/apihelper";
import { Notification } from "../models";
import { UniqueIdHelper } from "../helpers";

export class NotificationRepository {

  public async loadNewCounts(churchId: string, personId: string) {
    const sql = "SELECT ("
    + "  SELECT COUNT(*) FROM notifications where churchId=? and personId=? and isNew=1"
    + ") AS notificationCount, ("
    + "  SELECT COUNT(*) FROM privateMessages where churchId=? and notifyPersonId=?"
    + ") AS pmCount";
    return DB.queryOne(sql, [churchId, personId, churchId, personId]);
  }

  public async loadForPerson(churchId: string, personId: string) {
    const sql = "SELECT * FROM notifications WHERE churchId=? AND personId=? ORDER BY timeSent DESC;";
    return DB.query(sql, [churchId, personId]);
  }

  public async markALlRead(churchId: string, personId: string) {
    const sql = "UPDATE notifications set isNew=0 WHERE churchId=? AND personId=?;";
    return DB.query(sql, [churchId, personId]);
  }

  public save(notification: Notification) {
    return notification.id ? this.update(notification) : this.create(notification);
  }

  private async create(notification: Notification) {
    notification.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO notifications (id, churchId, contentType, contentId, timeSent, read, message) VALUES (?, ?, ?, ?, ?, ?, ?);";
    const params = [notification.id, notification.churchId, notification.contentType, notification.contentId, notification.timeSent, notification.read, notification.message];
    await DB.query(sql, params);
    return notification;
  }

  private async update(notification: Notification) {
    const sql = "UPDATE notifications SET personId=?, contentType=?, contentId=?, timeSent=?, read=?, message=? WHERE id=? AND churchId=?;";
    const params = [notification.personId, notification.contentType, notification.contentId, notification.timeSent, notification.read, notification.message, notification.id, notification.churchId]
    await DB.query(sql, params)
    return notification;
  }


}
