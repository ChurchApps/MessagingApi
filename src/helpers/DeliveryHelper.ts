import { PayloadInterface } from "../helpers/Interfaces";
import WebSocket from "ws";
import { Repositories } from "../repositories";
import { Connection } from "../models";
import { AttendanceInterface } from "../helpers/Interfaces";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { SocketHelper } from "./SocketHelper";
import { LoggingHelper } from "@churchapps/apihelper";
import { Environment } from "../helpers";

export class DeliveryHelper {
  static sendConversationMessages = async (payload: PayloadInterface) => {
    const repos = Repositories.getCurrent();
    const connections = repos.connection.convertAllToModel(
      await repos.connection.loadForConversation(payload.churchId, payload.conversationId)
    );
    const deliveryCount = await this.sendMessages(connections, payload);
    if (deliveryCount !== connections.length) DeliveryHelper.sendAttendance(payload.churchId, payload.conversationId);
  };

  static sendMessages = async (connections: Connection[], payload: PayloadInterface) => {
    const promises: Promise<boolean>[] = [];
    connections.forEach((connection) => {
      promises.push(DeliveryHelper.sendMessage(connection, payload));
    });
    const results = await Promise.all(promises);
    let deliveryCount = 0;
    results.forEach((r) => {
      if (r) deliveryCount++;
    });
    return deliveryCount;
  };

  static sendMessage = async (connection: Connection, payload: PayloadInterface) => {
    let success = true;
    if (Environment.deliveryProvider === "aws") success = await DeliveryHelper.sendAws(connection, payload);
    else success = await DeliveryHelper.sendLocal(connection, payload);
    if (!success) await Repositories.getCurrent().connection.delete(connection.churchId, connection.id);
    return success;
  };

  static sendAttendance = async (churchId: string, conversationId: string) => {
    const viewers = await Repositories.getCurrent().connection.loadAttendance(churchId, conversationId);
    const totalViewers = viewers.length;
    const data: AttendanceInterface = { conversationId, viewers, totalViewers };
    await DeliveryHelper.sendConversationMessages({
      churchId,
      conversationId,
      action: "attendance",
      data
    });
  };

  static sendBlockedIps = async (churchId: string, conversationId: string) => {
    const blockedIps = await Repositories.getCurrent().blockedIp.loadByConversationId(churchId, conversationId);
    const data = { conversationId, ipAddresses: blockedIps };
    await DeliveryHelper.sendConversationMessages({
      churchId,
      conversationId,
      action: "blockedIp",
      data
    });
  };

  private static sendAws = async (connection: Connection, payload: PayloadInterface) => {
    const client = new ApiGatewayManagementApiClient({ endpoint: Environment.socketUrl });
    let success = true;
    try {
      const input = {
        ConnectionId: connection.socketId,
        Data: Buffer.from(JSON.stringify(payload))
      };
      await client.send(new PostToConnectionCommand(input) as any);
    } catch (ex) {
      success = false;
      if (ex.toString() !== "410") LoggingHelper.getCurrent().error("'" + ex + "'");
    }
    return success;
  };

  private static sendLocal = async (connection: Connection, payload: PayloadInterface) => {
    let success = true;
    try {
      const sc = SocketHelper.getConnection(connection.socketId);
      if (sc !== null && sc.socket.readyState === WebSocket.OPEN) sc.socket.send(JSON.stringify(payload));
      else success = false;
    } catch (_e) {
      success = false;
    }
    if (!success) SocketHelper.deleteConnection(connection.socketId);
    return success;
  };
}
