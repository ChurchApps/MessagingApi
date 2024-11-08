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
  private static blockedIps: Map<string, Set<string>> = new Map();


  static init = () => {
    const port = Environment.socketPort;
    if (port > 0) {
      SocketHelper.wss = new WebSocket.Server({ port });

      SocketHelper.wss.on("connection", (socket) => {
        const sc: SocketConnectionInterface = { id: UniqueIdHelper.shortId(), socket };
        SocketHelper.connections.push(sc);
        const payload: PayloadInterface = { churchId: "", conversationId: "", action: "socketId", data: sc.id };
        sc.socket.send(JSON.stringify(payload));

        // Send current blocked IPs to new connections
        SocketHelper.sendBlockedIpsToNewConnection(sc.socket);

        sc.socket.on("message", (rawData) => {
          try {
            const data = JSON.parse(rawData.toString());
            if (data.action === "updatedBlockedIps") {
              this.updateBlockedIps(data.data.serviceId, Array.from(data.data.blockedIps));
            }
          } catch (e) {
            console.log("Error processing the socket message: ", e);
          }
        })
        sc.socket.on("close", async () => {
          // console.log("DELETING " + sc.id);
          await SocketHelper.handleDisconnect(sc.id);
        });
      });
    }
  };

  static handleDisconnect = async (socketId: string) => {
    // console.log("handleDisconnect");
    // console.log(socketId);
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

  static updateBlockedIps(serviceId: string, ips: string[]) {
    this.blockedIps.set(serviceId, new Set(ips));
    const payload: PayloadInterface = {
      churchId: "",
      conversationId: "",
      action: "updatedBlockedIps",
      data: { serviceId, blockedIps: Array.from(this.blockedIps.get(serviceId)) }
    };

    this.connections.forEach(connection => {
      try {
        if (connection.socket.readyState === WebSocket.OPEN) {
          connection.socket.send(JSON.stringify(payload));
        }
      } catch (e) {
        console.log("Error sending blocked IPs update: ", e);
      }
    })
  }

  static sendBlockedIpsToNewConnection(socket: WebSocket) {
    // Send all services' blocked IPs

    const allBlockedIps = Array.from(this.blockedIps.entries()).map(([serviceId, ips]) => ({
      serviceId,
      blockedIps: Array.from(ips)
    }))

    const payload: PayloadInterface = {
      churchId: "",
      conversationId: "",
      action: "updatedBlockedIps",
      data: allBlockedIps
    }

    try {
      socket.send(JSON.stringify(payload));
    } catch (e) {
      console.log("Error sending initial blocked IPs: ", e);
    }
  }

  static clearBlockedIps(serviceId: string) {
    if (this.blockedIps.has(serviceId)) {
      this.blockedIps.delete(serviceId);
    }
  }
}
