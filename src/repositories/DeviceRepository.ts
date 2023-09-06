import { DB } from "@churchapps/apihelper";
import { Device } from "../models";
import { UniqueIdHelper } from "../helpers";

export class DeviceRepository {

  public loadById(id: string) {
    return DB.queryOne("SELECT * FROM devices WHERE id=?;", [id]);
  }

  public loadByIds(ids: string[]) {
    return DB.query("SELECT * FROM devices WHERE id IN (?);", [ids]);
  }

  public loadForUser(userId: string) {
    return DB.query("SELECT * FROM devices WHERE userId=?", [userId]);
  }

  public delete(id: string) {
    return DB.query("DELETE FROM devices WHERE userId=?;", [id]);
  }

  public save(device: Device) {
    return device.id ? this.update(device) : this.create(device);
  }

  private async create(device: Device) {
    device.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO devices (id, userId, fcmToken, label, registrationDate, lastActiveDate, deviceInfo) VALUES (?, ?, ?, ?, NOW(), NOW(), ?);";
    const params = [device.id, device.userId, device.fcmToken, device.label, device.registrationDate, device.lastActiveDate, device.deviceInfo];
    await DB.query(sql, params);
    return device;
  }

  private async update(device: Device) {
    const sql = "UPDATE devices SET userId=?, fcmToken=?, label=?, registrationDate=?, lastActiveDate=?, deviceInfo=? WHERE id=?;";
    const params = [device.userId, device.fcmToken, device.label, device.registrationDate, device.lastActiveDate, device.deviceInfo, device.id]
    await DB.query(sql, params)
    return device;
  }

}
