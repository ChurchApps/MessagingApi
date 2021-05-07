const { createServer, proxy } = require('aws-serverless-express');
const { init } = require('./dist/App');
const { Pool } = require('./dist/apiBase/pool');
const AWS = require('aws-sdk');
const { Logger } = require('./dist/helpers/Logger');
const { Repositories } = require('./dist/repositories/Repositories');
const { SocketHelper } = require('./dist/helpers/SocketHelper');
const { ApiGatewayManagementApi } = require('aws-sdk');

const gwManagement = new ApiGatewayManagementApi({ apiVersion: '2020-04-16', endpoint: process.env.SOCKET_URL });
Pool.initPool();



async function logMessage(message) {
    const wl = new Logger();
    wl.error(message);
    await wl.flush();
}

module.exports.handleWeb = function handleWeb(event, context) {
    AWS.config.update({ region: 'us-east-2' });
    init().then(app => {
        const server = createServer(app);
        return proxy(server, event, context);
    });

}

module.exports.handleSocket = async function handleSocket(event) {
    const rc = event.requestContext;
    const eventType = rc.eventType;
    const connectionId = rc.connectionId;
    //console.log(eventType);
    if (eventType == "DISCONNECT") await SocketHelper.handleDisconnect(connectionId) //; Repositories.getCurrent().connection.deleteForSocket(connectionId);
    else if (eventType == "MESSAGE") {
        const payload = { churchId: "", conversationId: "", action: "socketId", data: rc.connectionId }
        //try {
        await gwManagement.postToConnection({ ConnectionId: rc.connectionId, Data: JSON.stringify(payload) }).promise();
        //} catch (e) { logMessage(e.toString()); }


    }
    return { statusCode: 200, body: 'success' }
}