import { UniqueIdHelper } from "@churchapps/apihelper";
import WebSocket from "ws";
import { PayloadInterface, SocketConnectionInterface } from "./Interfaces";
import { Repositories } from "../repositories";
import { Connection } from "../models";
import { DeliveryHelper } from "./DeliveryHelper";
import { Environment } from ".";

export class SocketHelper {
  private static wss: WebSocket.Server = null;
  private static connections: SocketConnectionInterface[] = [];

  static init = () => {
    const port = Environment.socketPort;
    console.log(`SocketHelper: Checking port ${port}`);
    if (port > 0) {
      try {
        console.log(`Starting WebSocket server on port ${port}...`);
        SocketHelper.wss = new WebSocket.Server({ port });
        console.log(`✓ Socket server is running on port ${port}`);

        SocketHelper.wss.on("connection", (socket) => {
          const sc: SocketConnectionInterface = { id: UniqueIdHelper.shortId(), socket };
          SocketHelper.connections.push(sc);

          // Handle incoming messages - send socketId for ANY message
          sc.socket.on("message", (message) => {
            console.log(`Received message: ${message.toString()}`);
            const payload: PayloadInterface = { churchId: "", conversationId: "", action: "socketId", data: sc.id };
            sc.socket.send(JSON.stringify(payload));
          });

          sc.socket.on("close", async () => {
            await SocketHelper.handleDisconnect(sc.id);
          });
        });
      } catch (error) {
        console.error(`Failed to start WebSocket server: ${error.message}`);
      }
    } else {
      console.log("Socket port is not configured or is 0, skipping WebSocket server");
    }
  };

  static handleDisconnect = async (socketId: string) => {
    const connections = await Repositories.getCurrent().connection.loadBySocketId(socketId);
    await Repositories.getCurrent().connection.deleteForSocket(socketId);
    connections.forEach((c: Connection) => {
      DeliveryHelper.sendAttendance(c.churchId, c.conversationId);
    });
  };

  static getConnection = (id: string) => {
    let result: SocketConnectionInterface = null;
    SocketHelper.connections.forEach((sc) => {
      if (sc.id === id) result = sc;
    });
    return result;
  };

  static deleteConnection = (id: string) => {
    for (let i = SocketHelper.connections.length - 1; i >= 0; i--) {
      const sc = SocketHelper.connections[i];
      if (sc.id === id) SocketHelper.connections.splice(i, 1);
    }
  };
}
