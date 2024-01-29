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

  public loadByAppDevice(appName: string, deviceId:string) {
    return DB.query("SELECT * FROM devices WHERE appName=? AND deviceId=?", [appName, deviceId]);
  }

  public delete(id: string) {
    return DB.query("DELETE FROM devices WHERE personId=?;", [id]);
  }

  public async save(device: Device) {
    let result = null;
    if (device.id) result = await this.update(device);
    else {
      const allExisting = (device.deviceId) ? await this.loadByAppDevice(device.appName, device.deviceId) : this.loadByFcmToken(device.fcmToken);
      if (allExisting.length > 0) {
        const existing = allExisting[0];
        existing.lastActiveDate = new Date();
        existing.personId = device.personId;
        existing.churchId = device.churchId;
        existing.fcmToken = device.fcmToken;
        result = await this.update(existing);
      }
      else result = await this.create(device);
    }
    return result;
  }

  private async create(device: Device) {
    device.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO devices (id, appName, deviceId, churchId, personId, fcmToken, label, registrationDate, lastActiveDate, deviceInfo) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?);";
    const params = [device.id, device.appName, device.deviceId, device.churchId, device.personId, device.fcmToken, device.label, device.deviceInfo];
    await DB.query(sql, params);
    return device;
  }

  private async update(device: Device) {
    const sql = "UPDATE devices SET appName=?, deviceId=?, churchId=?, personId=?, fcmToken=?, label=?, registrationDate=?, lastActiveDate=?, deviceInfo=? WHERE id=?;";
    const params = [device.appName, device.deviceId, device.churchId, device.personId, device.fcmToken, device.label, device.registrationDate, device.lastActiveDate, device.deviceInfo, device.id]
    await DB.query(sql, params)
    return device;
  }

}
