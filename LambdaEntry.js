const { createServer, proxy } = require('aws-serverless-express');
const { init } = require('./dist/App');
const { Environment } = require('./dist/helpers/Environment');
const { Pool } = require('@churchapps/apihelper');
const AWS = require('aws-sdk');
const { Logger } = require('./dist/helpers/Logger');
const { SocketHelper } = require('./dist/helpers/SocketHelper');
const { ApiGatewayManagementApi } = require('aws-sdk');
const { NotificationHelper } = require('./dist/helpers/NotificationHelper');


let gwManagement = new ApiGatewayManagementApi({ apiVersion: '2020-04-16', endpoint: Environment.socketUrl });

Environment.init(process.env.APP_ENV).then(() => {
  Pool.initPool();
  gwManagement = new ApiGatewayManagementApi({ apiVersion: '2020-04-16', endpoint: Environment.socketUrl });
});


async function logMessage(message) {
  const wl = new Logger();
  wl.error(message);
  await wl.flush();
}

const checkPool = async () => {
  if (!Environment.connectionString) {
    await Environment.init(process.env.APP_ENV)
    Pool.initPool();
  }
}

module.exports.timer15Min = async (event, context) => {
  return await NotificationHelper.sendEmailNotifications("individual");
}

module.exports.timerMidnight = async (event, context) => {
  return await NotificationHelper.sendEmailNotifications("daily");
}

module.exports.universal = function universal(event, context) {
  checkPool().then(() => {
    init().then(app => {
      const server = createServer(app);
      return proxy(server, event, context);
    });
  });
}

module.exports.handleWeb = function handleWeb(event, context) {
  AWS.config.update({ region: 'us-east-2' });
  checkPool().then(() => {
    init().then(app => {
      const server = createServer(app);
      return proxy(server, event, context);
    });
  });

}

module.exports.handleSocket = async function handleSocket(event) {
  const rc = event.requestContext;
  const eventType = rc.eventType;
  const connectionId = rc.connectionId;

  await checkPool();
  if (eventType == "DISCONNECT") await SocketHelper.handleDisconnect(connectionId) //; Repositories.getCurrent().connection.deleteForSocket(connectionId);
  else if (eventType == "MESSAGE") {
    const payload = { churchId: "", conversationId: "", action: "socketId", data: rc.connectionId }
    //try {
    await gwManagement.postToConnection({ ConnectionId: rc.connectionId, Data: JSON.stringify(payload) }).promise();
    //} catch (e) { logMessage(e.toString()); }


  }
  return { statusCode: 200, body: 'success' }
}