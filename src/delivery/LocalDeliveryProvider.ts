import WebSocket from "ws";
import { DeliveryProviderInterface } from "./DeliveryProviderInterface";
import { SocketResponse } from "../helpers/Interfaces";
import { Connection } from "../models";


export class LocalDeliveryProvider implements DeliveryProviderInterface {

    static getSocket = () => {
        var result: WebSocket = null;
        return result;
    }

    public sendMessage = async (connection: Connection, data: SocketResponse) => {
        var success = true;
        try {
            const socket = LocalDeliveryProvider.getSocket();
            if (socket !== null && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
            else success = false;
        } catch (e) {
            success = false;
        }
        return success;
    }

}