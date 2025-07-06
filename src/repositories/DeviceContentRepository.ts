import { DB } from "@churchapps/apihelper";
import { DeviceContent } from "../models";
import { UniqueIdHelper } from "../helpers";

export class DeviceContentRepository {
  public async loadByDeviceId(deviceId: string) {
    const result: any = await DB.query("SELECT * FROM deviceContents WHERE deviceId=?;", [deviceId]);
    return result.rows || result || [];
  }

  public async loadById(id: string) {
    const result: any = await DB.queryOne("SELECT * FROM deviceContents WHERE id=?;", [id]);
    return result.rows || result || {};
  }

  public async loadByIds(ids: string[]) {
    const result: any = await DB.query("SELECT * FROM deviceContents WHERE id IN (?);", [ids]);
    return result.rows || result || [];
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
