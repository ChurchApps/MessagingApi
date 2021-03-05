import { DB } from "../apiBase/db";
import { Connection } from "../models";
import { UniqueIdHelper } from "../helpers";
import { ViewerInterface } from "../helpers/Interfaces";

export class ConnectionRepository {

    public async loadAttendance(churchId: string, conversationId: string) {
        const sql = "SELECT displayName as name, count(*) as count FROM connections WHERE churchId=? AND conversationId=? GROUP BY displayName ORDER BY name;"
        const data: ViewerInterface[] = await DB.query(sql, [churchId, conversationId]);
        console.log(JSON.stringify(data));
        data.forEach((d: any) => { if (d.name === '') d.name = 'Anonymous'; });
        return data;
    }

    public async loadById(churchId: string, id: string) {
        return DB.queryOne("SELECT * FROM connections WHERE id=? and churchId=?;", [id, churchId]);
    }

    public async loadForConversation(churchId: string, conversationId: string) {
        return DB.query("SELECT * FROM connections WHERE churchId=? AND conversationId=?", [churchId, conversationId]);
    }

    public async loadBySocketId(socketId: string) {
        return DB.query("SELECT * FROM connections WHERE socketId=?", [socketId]);
    }

    public async delete(churchId: string, id: string) {
        console.log("DELETE FROM connections WHERE id='" + id + "' AND churchId='" + churchId + "';")
        DB.query("DELETE FROM connections WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public async deleteForSocket(socketId: string) {
        DB.query("DELETE FROM connections WHERE socketId=?;", [socketId]);
    }

    public async save(connection: Connection) {
        if (UniqueIdHelper.isMissing(connection.id)) return this.create(connection); else return this.update(connection);
    }

    public async create(connection: Connection) {
        connection.id = UniqueIdHelper.shortId();
        const sql = "INSERT INTO connections (id, churchId, conversationId, userId, displayName, timeJoined, socketId) VALUES (?, ?, ?, ?, ?, NOW(), ?);";
        const params = [connection.id, connection.churchId, connection.conversationId, connection.userId, connection.displayName, connection.socketId];
        return DB.query(sql, params).then((row: any) => { return connection; });
    }

    public async update(connection: Connection) {
        const sql = "UPDATE connections SET userId=?, displayName=? WHERE id=? AND churchId=?;";
        const params = [connection.userId, connection.displayName, connection.id, connection.churchId]
        return DB.query(sql, params).then(() => { return connection });
    }

    public convertToModel(data: any) {
        const result: Connection = { id: data.id, churchId: data.churchId, conversationId: data.conversationId, userId: data.userId, displayName: data.displayName, timeJoined: data.timeJoined, socketId: data.socketId };
        return result;
    }

    public convertAllToModel(data: any[]) {
        const result: Connection[] = [];
        data.forEach(d => result.push(this.convertToModel(d)));
        return result;
    }

}
