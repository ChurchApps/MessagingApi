import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { LoggingHelper } from "@churchapps/apihelper";
import WebSocket from "ws";
import { Environment } from "../helpers";
import { AttendanceInterface, PayloadInterface } from "../helpers/Interfaces";
import { Connection } from "../models";
import { Repositories } from "../repositories";
import { SocketHelper } from "./SocketHelper";

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

    //TODO: temporary.  Need to bring this back.
    //if (!success) await Repositories.getCurrent().connection.delete(connection.churchId, connection.id);
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

  private static getApiGatewayEndpoint(): string {
    // For AWS WebSocket message delivery, we need the actual API Gateway endpoint,
    // not the custom domain. This matches the pattern used in LambdaEntry.js

    // Extract environment and construct the proper API Gateway endpoint
    const env = process.env.APP_ENV || "staging";
    const region = "us-east-2"; // From serverless.yml

    // Map environment to API Gateway ID
    // These are the actual API Gateway IDs for each environment
    const apiGatewayIds: { [key: string]: string } = {
      staging: "vqu18129j0", // From the working URL we identified
      prod: "e3dpltbpr1", // Production API Gateway ID from serverless info
      dev: "vqu18129j0" // Update this when you have dev API ID
    };

    const apiId = apiGatewayIds[env] || apiGatewayIds["staging"];
    const stage = env.charAt(0).toUpperCase() + env.slice(1); // "staging" -> "Staging"

    const endpoint = `https://${apiId}.execute-api.${region}.amazonaws.com/${stage}`;

    console.log(`DeliveryHelper: Using API Gateway endpoint for WebSocket delivery: ${endpoint}`);
    return endpoint;
  }

  private static sendAws = async (connection: Connection, payload: PayloadInterface) => {
    // Use the correct API Gateway endpoint instead of the custom domain
    const endpoint = DeliveryHelper.getApiGatewayEndpoint();
    const client = new ApiGatewayManagementApiClient({
      apiVersion: "2020-04-16",
      endpoint: endpoint
    });

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
