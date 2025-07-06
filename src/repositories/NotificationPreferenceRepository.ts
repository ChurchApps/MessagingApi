import { DB } from "@churchapps/apihelper";
import { NotificationPreference } from "../models";
import { UniqueIdHelper } from "../helpers";

export class NotificationPreferenceRepository {
  public async loadForPerson(churchId: string, personId: string) {
    const sql = "SELECT * FROM notificationPreferences WHERE churchId=? AND personId = ?;";
    const result: any = await DB.queryOne(sql, [churchId, personId]);
    return result.rows || result || {};
  }

  public async loadByPersonIds(personIds: string[]) {
    const sql = "SELECT * FROM notificationPreferences WHERE personId IN (?);";
    const result: any = await DB.query(sql, [personIds]);
    return result.rows || result || [];
  }

  public async save(preference: NotificationPreference) {
    return preference.id ? this.update(preference) : this.create(preference);
  }

  private async create(preference: NotificationPreference) {
    preference.id = UniqueIdHelper.shortId();
    const sql =
      "INSERT INTO notificationPreferences (id, churchId, personId, allowPush, emailFrequency) VALUES (?, ?, ?, ?, ?);";
    const params = [
      preference.id,
      preference.churchId,
      preference.personId,
      preference.allowPush,
      preference.emailFrequency
    ];
    await DB.query(sql, params);
    return preference;
  }

  private async update(preference: NotificationPreference) {
    const sql =
      "UPDATE notificationPreferences SET personId=?, allowPush=?, emailFrequency=? WHERE id=? AND churchId=?;";
    const params = [
      preference.personId,
      preference.allowPush,
      preference.emailFrequency,
      preference.id,
      preference.churchId
    ];
    await DB.query(sql, params);
    return preference;
  }
}
