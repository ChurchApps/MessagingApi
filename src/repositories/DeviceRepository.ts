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

  public loadForPerson(personId: string) {
    return DB.query("SELECT * FROM devices WHERE personId=?", [personId]);
  }

  public loadByFcmToken(fcmToken: string) {
    return DB.query("SELECT * FROM devices WHERE fcmToken=?", [fcmToken]);
  }

  public delete(id: string) {
    return DB.query("DELETE FROM devices WHERE personId=?;", [id]);
  }

  public async save(device: Device) {
    let result = null;
    if (device.id) result = this.update(device);
    else {
      const existing = await this.loadByFcmToken(device.fcmToken)
      if (existing?.id) {
        existing.lastActiveDate = new Date();
        result = this.update(existing);
      }
      else result = this.create(device);
    }
    return result;
  }

  private async create(device: Device) {
    device.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO devices (id, churchId, personId, fcmToken, label, registrationDate, lastActiveDate, deviceInfo) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?);";
    const params = [device.id, device.churchId, device.personId, device.fcmToken, device.label, device.deviceInfo];
    await DB.query(sql, params);
    return device;
  }

  private async update(device: Device) {
    const sql = "UPDATE devices SET personId=?, fcmToken=?, label=?, registrationDate=?, lastActiveDate=?, deviceInfo=? WHERE id=? and churchId=?;";
    const params = [device.personId, device.fcmToken, device.label, device.registrationDate, device.lastActiveDate, device.deviceInfo, device.id, device.churchId]
    await DB.query(sql, params)
    return device;
  }

}
