import { DB } from "@churchapps/apihelper";
import { DeviceContent } from "../models";
import { UniqueIdHelper } from "../helpers";

export class DeviceContentRepository {
  public loadByDeviceId(deviceId: string) {
    return DB.query("SELECT * FROM deviceContents WHERE deviceId=?;", [deviceId]);
  }

  public loadById(id: string) {
    return DB.queryOne("SELECT * FROM deviceContents WHERE id=?;", [id]);
  }

  public loadByIds(ids: string[]) {
    return DB.query("SELECT * FROM deviceContents WHERE id IN (?);", [ids]);
  }

  public delete(id: string) {
    return DB.query("DELETE FROM deviceContents WHERE id=?;", [id]);
  }

  public async save(deviceContent: DeviceContent) {
    return deviceContent.id ? this.update(deviceContent) : this.create(deviceContent);
  }

  private async create(deviceContent: DeviceContent) {
    deviceContent.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO deviceContents (id, churchId, deviceId, contentType, contentId) VALUES (?, ?, ?, ?, ?);";
    const params = [
      deviceContent.id,
      deviceContent.churchId,
      deviceContent.deviceId,
      deviceContent.contentType,
      deviceContent.contentId
    ];
    await DB.query(sql, params);
    return deviceContent;
  }

  private async update(deviceContent: DeviceContent) {
    const sql = "UPDATE deviceContents SET deviceId=?, contentType=?, contentId=? WHERE id=? and churchId=?;";
    const params = [
      deviceContent.deviceId,
      deviceContent.contentType,
      deviceContent.contentId,
      deviceContent.id,
      deviceContent.churchId
    ];
    await DB.query(sql, params);
    return deviceContent;
  }
}
