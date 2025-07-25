import { DB } from "@churchapps/apihelper";
import { Notification } from "../models";
import { UniqueIdHelper } from "../helpers";

export class NotificationRepository {
  public async loadUndelivered() {
    const result: any = await DB.query(
      "SELECT * FROM notifications WHERE isNew=1 and deliveryMethod not in ('email', 'none');",
      []
    );
    return result.rows || result || [];
  }

  public async loadNewCounts(churchId: string, personId: string) {
    const sql =
      "SELECT (" +
      "  SELECT COUNT(*) FROM notifications where churchId=? and personId=? and isNew=1" +
      ") AS notificationCount, (" +
      "  SELECT COUNT(*) FROM privateMessages where churchId=? and notifyPersonId=?" +
      ") AS pmCount";
    const result: any = await DB.queryOne(sql, [churchId, personId, churchId, personId]);
    return result.rows || result || {};
  }

  public async loadForPerson(churchId: string, personId: string) {
    const sql = "SELECT * FROM notifications WHERE churchId=? AND personId=? ORDER BY timeSent DESC;";
    const result: any = await DB.query(sql, [churchId, personId]);
    return result.rows || result || [];
  }

  public async loadExistingUnread(churchId: string, contentType: string, contentId: string) {
    const sql = "SELECT * FROM notifications WHERE churchId=? AND contentType=? AND contentId=? AND isNew=1;";
    const result: any = await DB.query(sql, [churchId, contentType, contentId]);
    return result.rows || result || [];
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
    const sql =
      "INSERT INTO notifications (id, churchId, personId, contentType, contentId, timeSent, isNew, message, link, deliveryMethod) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [
      notification.id,
      notification.churchId,
      notification.personId,
      notification.contentType,
      notification.contentId,
      notification.timeSent,
      notification.isNew,
      notification.message,
      notification.link,
      notification.deliveryMethod
    ];
    await DB.query(sql, params);
    return notification;
  }

  private async update(notification: Notification) {
    const sql =
      "UPDATE notifications SET personId=?, contentType=?, contentId=?, timeSent=?, isNew=?, message=?, link=?, deliveryMethod=? WHERE id=? AND churchId=?;";
    const params = [
      notification.personId,
      notification.contentType,
      notification.contentId,
      notification.timeSent,
      notification.isNew,
      notification.message,
      notification.link,
      notification.deliveryMethod,
      notification.id,
      notification.churchId
    ];
    await DB.query(sql, params);
    return notification;
  }
}
