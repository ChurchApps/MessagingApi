import { DB } from "../apiBase/db";
import { Connection } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ConnectionRepository {

    public async loadById(churchId: string, id: string) {
        return DB.queryOne("SELECT * FROM connections WHERE id=? and churchId=?;", [id, churchId]);
    }

    public async loadForConversation(churchId: string, conversationId: string) {
        return DB.query("SELECT * FROM connections WHERE churchId=? AND conversationId=?", [churchId, conversationId]);
    }

    public async delete(churchId: number, id: number) {
        DB.query("DELETE FROM connections WHERE id=? AND churchId=?;", [id, churchId]);
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
