import { PayloadInterface } from "../helpers/Interfaces";
import WebSocket from "ws";
import { Repositories } from "../repositories";
import { Connection } from "../models";
import { AttendanceInterface } from "../helpers/Interfaces";
import { ApiGatewayManagementApi } from 'aws-sdk';
import { SocketHelper } from "./SocketHelper";
import { LoggingHelper } from "../apiBase";

export class DeliveryHelper {

    static sendMessages = async (payload: PayloadInterface) => {
        const repos = Repositories.getCurrent();
        const connections = repos.connection.convertAllToModel(await repos.connection.loadForConversation(payload.churchId, payload.conversationId));
        const promises: Promise<boolean>[] = [];
        connections.forEach(connection => {
            promises.push(DeliveryHelper.sendMessage(connection, payload));
        });
        const results = await Promise.all(promises);
        let allSuccess = true;
        results.forEach(r => { if (!r) allSuccess = false; })
        if (!allSuccess) DeliveryHelper.sendAttendance(payload.churchId, payload.conversationId)
    }

    static sendMessage = async (connection: Connection, payload: PayloadInterface) => {
        let success = true;
        if (process.env.DELIVERY_PROVIDER === "aws") success = await DeliveryHelper.sendAws(connection, payload);
        else success = await DeliveryHelper.sendLocal(connection, payload);
        if (!success) await Repositories.getCurrent().connection.delete(connection.churchId, connection.id);
        return success;
    }

    static sendAttendance = async (churchId: string, conversationId: string) => {
        const viewers = await Repositories.getCurrent().connection.loadAttendance(churchId, conversationId);
        console.log(viewers.length);
        let totalViewers = 0;
        viewers.forEach(v => { totalViewers += v.count });
        const data: AttendanceInterface = { conversationId, viewers, totalViewers };
        await DeliveryHelper.sendMessages({ churchId, conversationId, action: "attendance", data });
    }

    private static sendAws = async (connection: Connection, payload: PayloadInterface) => {
        const apigwManagementApi = new ApiGatewayManagementApi({ apiVersion: '2020-04-16', endpoint: process.env.SOCKET_URL });
        let success = true;
        try {
            await apigwManagementApi.postToConnection({ ConnectionId: connection.socketId, Data: JSON.stringify(payload) }).promise();
        } catch (ex: any) {
            success = false;
            LoggingHelper.getCurrent().error(ex);
        }
        return success;
    }

    private static sendLocal = async (connection: Connection, payload: PayloadInterface) => {
        let success = true;
        try {
            const sc = SocketHelper.getConnection(connection.socketId);
            if (sc !== null && sc.socket.readyState === WebSocket.OPEN) sc.socket.send(JSON.stringify(payload));
            else success = false;
        } catch (e) {
            success = false;
        }
        if (!success) SocketHelper.deleteConnection(connection.socketId);
        return success;
    }

}