import WebSocket from "ws";
import { SocketResponse } from "../helpers/Interfaces";
import { Connection } from "../models";

export interface DeliveryProviderInterface {
    sendMessage(connection: Connection, data: SocketResponse, socket?: WebSocket): Promise<boolean>,
}