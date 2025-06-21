import { DB } from "@churchapps/apihelper";
import { NotificationPreference } from "../models";
import { UniqueIdHelper } from "../helpers";

export class NotificationPreferenceRepository {
  public async loadForPerson(churchId: string, personId: string) {
    const sql = "SELECT * FROM notificationPreferences WHERE churchId=? AND personId = ?;";
    return DB.queryOne(sql, [churchId, personId]);
  }

  public async loadByPersonIds(personIds: string[]) {
    const sql = "SELECT * FROM notificationPreferences WHERE personId IN (?);";
    return DB.query(sql, [personIds]);
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
