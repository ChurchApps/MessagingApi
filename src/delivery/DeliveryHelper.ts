import { SocketResponse } from "../helpers/Interfaces";
import { DeliveryProviderInterface } from "./DeliveryProviderInterface";
import { AwsDeliveryProvider } from "./AwsDeliveryProvider"
import { LocalDeliveryProvider } from "./LocalDeliveryProvider"
import WebSocket from "ws";
import { Repositories } from "../repositories";
import { Connection } from "../models";

export class DeliveryHelper {

    static provider: DeliveryProviderInterface;

    static getProvider = () => {
        if (DeliveryHelper.provider === undefined) DeliveryHelper.provider = (process.env.DELIVERY_PROVIDER === "aws") ? new AwsDeliveryProvider() : new LocalDeliveryProvider();
        return DeliveryHelper.provider;
    }

    static sendMessages = async (churchId: string, conversationId: string, data: SocketResponse) => {
        const repos = Repositories.getCurrent();
        const connections = repos.connection.convertAllToModel(await repos.connection.loadForConversation(churchId, conversationId));
        const promises: Promise<any>[] = [];
        connections.forEach(connection => {
            promises.push(DeliveryHelper.sendMessage(connection, data));
        });
        await Promise.all(promises);
    }

    static sendMessage = async (connection: Connection, data: SocketResponse, socket?: WebSocket) => {
        const success = DeliveryHelper.getProvider().sendMessage(connection, data, socket);
        if (!success) {
            //delete connection

        }
    }
    /*
        static sendAttendance = async (room: string) => {
            let names: string[] = await DBHelper.loadAttendance(room);
            names = names.sort();
            const consolidated = [];
            let lastName = null;
            for (let i = 0; i <= names.length; i++) {
                if (names[i] === lastName) consolidated[consolidated.length - 1].count++;
                else {
                    consolidated.push({ displayName: names[i], count: 1 });
                    lastName = names[i];
                }
            }
    
            const message = { action: "updateAttendance", room, viewers: consolidated, totalViewers: consolidated.length };
            await DeliveryHelper.sendMessages(room, message);
        }
        static deleteConnection = async (connectionId: string) => {
            const rooms = await DBHelper.loadRooms(connectionId);
            const promises: Promise<any>[] = [];
            rooms.forEach(room => { promises.push(DeliveryHelper.deleteRoom(room, connectionId, false)); });
            await Promise.all(promises);
        }
        static deleteRoom = async (room: string, connectionId: string, silent: boolean) => {
            await DBHelper.deleteConnection(room, connectionId);
            if (!silent) DeliveryHelper.sendAttendance(room);
        }
    */
}