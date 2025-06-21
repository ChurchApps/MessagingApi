import { DB } from "@churchapps/apihelper";
import { Device } from "../models";
import { UniqueIdHelper } from "../helpers";

export class DeviceRepository {
  public loadByPairingCode(pairingCode: string) {
    return DB.queryOne("SELECT * FROM devices WHERE pairingCode=?;", [pairingCode]);
  }

  public loadByDeviceId(deviceId: string) {
    return DB.queryOne("SELECT * FROM devices WHERE deviceId=?;", [deviceId]);
  }

  public loadById(id: string) {
    return DB.queryOne("SELECT * FROM devices WHERE id=?;", [id]);
  }

  public loadByIds(ids: string[]) {
    return DB.query("SELECT * FROM devices WHERE id IN (?);", [ids]);
  }

  public loadForPerson(personId: string) {
    return DB.query("SELECT * FROM devices WHERE personId=? order by lastActiveDate desc", [personId]);
  }

  public loadActiveForPerson(personId: string) {
    return DB.query(
      "SELECT * FROM devices WHERE personId=? and lastActiveDate>DATE_SUB(NOW(), INTERVAL 1 YEAR) order by lastActiveDate desc",
      [personId]
    );
  }

  public loadByFcmToken(fcmToken: string) {
    return DB.query("SELECT * FROM devices WHERE fcmToken=?", [fcmToken]);
  }

  public loadByAppDevice(appName: string, deviceId: string) {
    return DB.query("SELECT * FROM devices WHERE appName=? AND deviceId=?", [appName, deviceId]);
  }

  public delete(id: string) {
    return DB.query("DELETE FROM devices WHERE id=?;", [id]);
  }

  public deleteByToken(token: string) {
    return DB.query("DELETE FROM devices WHERE fcmToken=?;", [token]);
  }

  public async save(device: Device) {
    let result = null;
    if (device.id) result = await this.update(device);
    else {
      // If we have an FCM token, delete any other devices that have the same token
      if (device.fcmToken) {
        const existingDevices = await this.loadByFcmToken(device.fcmToken);
        for (const existingDevice of existingDevices) {
          await this.delete(existingDevice.id);
        }
      }
      const allExisting = device.deviceId
        ? await this.loadByAppDevice(device.appName, device.deviceId)
        : await this.loadByFcmToken(device.fcmToken);
      if (allExisting.length > 0) {
        const existing = allExisting[0];
        existing.lastActiveDate = new Date();
        existing.personId = device.personId;
        existing.churchId = device.churchId;
        existing.fcmToken = device.fcmToken;
        result = await this.update(existing);
      } else result = await this.create(device);
    }
    return result;
  }

  private async create(device: Device) {
    device.id = UniqueIdHelper.shortId();
    const sql =
      "INSERT INTO devices (id, appName, deviceId, churchId, personId, fcmToken, label, registrationDate, lastActiveDate, deviceInfo, admId, pairingCode, ipAddress) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?);";
    const params = [
      device.id,
      device.appName,
      device.deviceId,
      device.churchId,
      device.personId,
      device.fcmToken,
      device.label,
      device.deviceInfo,
      device.admId,
      device.pairingCode,
      device.ipAddress
    ];
    await DB.query(sql, params);
    return device;
  }

  private async update(device: Device) {
    const sql =
      "UPDATE devices SET appName=?, deviceId=?, churchId=?, personId=?, fcmToken=?, label=?, registrationDate=?, lastActiveDate=?, deviceInfo=?, admId=?, pairingCode=?, ipAddress=? WHERE id=?;";
    const params = [
      device.appName,
      device.deviceId,
      device.churchId,
      device.personId,
      device.fcmToken,
      device.label,
      device.registrationDate,
      device.lastActiveDate,
      device.deviceInfo,
      device.admId,
      device.pairingCode,
      device.ipAddress,
      device.id
    ];
    await DB.query(sql, params);
    return device;
  }
}
