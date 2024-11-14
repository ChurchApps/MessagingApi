import { controller, httpGet, httpPost, requestParam } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { Connection } from "../models";
import { DeliveryHelper } from "../helpers/DeliveryHelper";


@controller("/connections")
export class ConnectionController extends MessagingBaseController {

    @httpGet("/:churchId/:conversationId")
    public async load(@requestParam("churchId") churchId: string, @requestParam("conversationId") conversationId: string, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
        return this.actionWrapperAnon(req, res, async () => {
            const data = await this.repositories.connection.loadForConversation(churchId, conversationId);
            const connections = this.repositories.connection.convertAllToModel(data);
            return connections;
        });
    }

    @httpPost("/tmpSendAlert")
    public async sendAlert(req: express.Request<{}, {}, any>, res: express.Response): Promise<any> {
        return this.actionWrapperAnon(req, res, async () => {
          const connections = await this.repositories.connection.loadForNotification(req.body.churchId, req.body.personId);
          const deliveryCount = await DeliveryHelper.sendMessages(connections, { churchId: req.body.churchId, conversationId: "alert", action: "notification", data: {} });
          return { deliveryCount }
        });
    }

    @httpPost("/")
    public async save(req: express.Request<{}, {}, Connection[]>, res: express.Response): Promise<any> {
        return this.actionWrapperAnon(req, res, async () => {
            const promises: Promise<Connection>[] = [];
            for (const connection of req.body) {
                if (connection.personId === undefined) connection.personId = null;
                if (connection.displayName === "Anonymous ") {
                    const connections: Connection[] = await this.repositories.connection.loadForConversation(connection.churchId, connection.conversationId);
                    const anonConnections = connections.filter(c => c.displayName.includes("Anonymous"));
                    if (anonConnections.length > 0) {
                        const filteredConn = anonConnections.filter((c) => c.displayName.includes("Anonymous"));
                        const displayNames = filteredConn.map(c => c.displayName);
                        const numbers: number[] = [];
                        displayNames.forEach(name => {
                            const splitName = name.split('_');
                            numbers.push(Number(splitName[1]))
                        });
                        const maxNumber = Math.max(...numbers);
                        connection.displayName = `Anonymous_${maxNumber + 1}`
                    } else {
                        connection.displayName = "Anonymous_1";
                    }
                }
                promises.push(this.repositories.connection.save(connection).then(async c => {
                    await DeliveryHelper.sendAttendance(c.churchId, c.conversationId);
                    await DeliveryHelper.sendBlockedIps(c.churchId, c.conversationId);
                    return c;
                }));
            };
            return this.repositories.connection.convertAllToModel(await Promise.all(promises));
        });
    }

    @httpPost("/setName")
    public async setName(req: express.Request<{}, {}, { socketId: string, name: string }>, res: express.Response): Promise<any> {
        return this.actionWrapperAnon(req, res, async () => {
            const connections = await this.repositories.connection.loadBySocketId(req.body.socketId);
            const promises: Promise<Connection>[] = [];
            connections.forEach((connection: Connection) => {
                connection.displayName = req.body.name;
                promises.push(this.repositories.connection.save(connection).then(async c => {
                    await DeliveryHelper.sendAttendance(c.churchId, c.conversationId);
                    return c;
                }));
            });
            return this.repositories.connection.convertAllToModel(await Promise.all(promises));
        });
    }


}
