import { DB } from "../apiBase/db";
import { Connection } from "../models";
import { UniqueIdHelper } from "../helpers";
import { ViewerInterface } from "../helpers/Interfaces";

export class ConnectionRepository {

    public async loadAttendance(churchId: string, conversationId: string) {
        const sql = "SELECT id, displayName FROM connections WHERE churchId=? AND conversationId=? ORDER BY displayName;"
        const data: ViewerInterface[] = await DB.query(sql, [churchId, conversationId]);
        data.forEach((d: ViewerInterface) => { if (d.displayName === '') d.displayName = 'Anonymous'; });
        return data;
    }

    public loadById(churchId: string, id: string) {
        return DB.queryOne("SELECT * FROM connections WHERE id=? and churchId=?;", [id, churchId]);
    }

    public loadForConversation(churchId: string, conversationId: string) {
        return DB.query("SELECT * FROM connections WHERE churchId=? AND conversationId=?", [churchId, conversationId]);
    }

    public loadBySocketId(socketId: string) {
        return DB.query("SELECT * FROM connections WHERE socketId=?", [socketId]);
    }

    public delete(churchId: string, id: string) {
        return DB.query("DELETE FROM connections WHERE id=? AND churchId=?;", [id, churchId]);
    }

    public deleteForSocket(socketId: string) {
        return DB.query("DELETE FROM connections WHERE socketId=?;", [socketId]);
    }

    public deleteExisting(churchId: string, conversationId: string, socketId: string, id: string) {
        const sql = "DELETE FROM connections WHERE churchId=? AND conversationId=? AND socketId=? AND id<>?;"
        const params = [churchId, conversationId, socketId, id];
        return DB.query(sql, params);
    }

    public save(connection: Connection) {
        return connection.id ? this.update(connection) : this.create(connection);
    }

    private async create(connection: Connection): Promise<Connection> {
        connection.id = UniqueIdHelper.shortId();
        await this.deleteExisting(connection.churchId, connection.conversationId, connection.socketId, connection.id)
        const sql = "INSERT INTO connections (id, churchId, conversationId, userId, displayName, timeJoined, socketId) VALUES (?, ?, ?, ?, ?, NOW(), ?);";
        const params = [connection.id, connection.churchId, connection.conversationId, connection.userId, connection.displayName, connection.socketId];
        await DB.query(sql, params);
        return connection;
    }

    private async update(connection: Connection) {
        const sql = "UPDATE connections SET userId=?, displayName=? WHERE id=? AND churchId=?;";
        const params = [connection.userId, connection.displayName, connection.id, connection.churchId]
        await DB.query(sql, params);
        return connection;
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
