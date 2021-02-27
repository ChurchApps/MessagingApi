import { injectable } from "inversify"
import { DB } from "../db";
import { Setting } from "../models";

@injectable()
export class SettingRepository {

    public async save(setting: Setting) {
        if (setting.id > 0) {
            return this.update(setting);
        } else {
            return this.create(setting);
        }
    }

    public async create(setting: Setting) {
        return DB.query(
            "INSERT INTO settings (churchId, keyName, value) VALUES (?, ?, ?)",
            [setting.churchId, setting.keyName, setting.value]
        ).then((row: any) => {
            setting.id = row.insertId;
            return setting;
        })
    }

    public async update(setting: Setting) {
        return DB.query(
            "UPDATE settings SET churchId=?, keyName=?, value=? WHERE id=? AND churchId=?",
            [setting.churchId, setting.keyName, setting.value, setting.id, setting.churchId]
        ).then(() => setting)
    }

    public async loadAll(setting: number) {
        return DB.query("SELECT * FROM settings WHERE churchId=?;", [setting]);
    }

    public convertToModel(churchId: number, data: any) {
        const result: Setting = {
            id: data.id,
            keyName: data.keyName,
            value: data.value
        };
        return result;
    }

    public convertAllToModel(churchId: number, data: any[]) {
        const result: Setting[] = [];
        data.forEach(d => result.push(this.convertToModel(churchId, d)));
        return result;
    }
}