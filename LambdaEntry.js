const serverlessExpress = require("@codegenie/serverless-express");
const { init } = require("./dist/App");
const { Environment } = require("./dist/helpers/Environment");
const { Pool } = require("@churchapps/apihelper");
const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} = require("@aws-sdk/client-apigatewaymanagementapi");
const { Logger } = require("./dist/helpers/Logger");
const { SocketHelper } = require("./dist/helpers/SocketHelper");
const { NotificationHelper } = require("./dist/helpers/NotificationHelper");

let gwManagement = new ApiGatewayManagementApiClient({
  apiVersion: "2020-04-16",
  endpoint: Environment.socketUrl
});

const initEnv = async () => {
  return Environment.init(process.env.APP_ENV).then(() => {
    Pool.initPool();
    gwManagement = new ApiGatewayManagementApiClient({
      apiVersion: "2020-04-16",
      endpoint: Environment.socketUrl
    });
  });
};

initEnv();

async function logMessage(message) {
  const wl = new Logger();
  wl.error(message);
  await wl.flush();
}

const checkPool = async () => {
  if (!Environment.connectionString) {
    await Environment.init(process.env.APP_ENV);
    Pool.initPool();
  }
};

module.exports.timer15Min = async (event, context) => {
  await initEnv();
  return await NotificationHelper.sendEmailNotifications("individual");
};

module.exports.timerMidnight = async (event, context) => {
  await initEnv();
  return await NotificationHelper.sendEmailNotifications("daily");
};

let handler;

const universal = async function universal(event, context) {
  await checkPool();
  
  if (!handler) {
    const app = await init();
    handler = serverlessExpress({ 
      app,
      binarySettings: {
        contentTypes: [
          'application/octet-stream',
          'font/*', 
          'image/*',
          'application/pdf'
        ]
      },
      stripBasePath: false,
      resolutionMode: 'PROMISE'
    });
  }
  
  return handler(event, context);
};

module.exports.universal = universal;
module.exports.handleWeb = universal;

module.exports.handleSocket = async function handleSocket(event) {
  const rc = event.requestContext;
  const eventType = rc.eventType;
  const connectionId = rc.connectionId;

  await checkPool();
  if (eventType == "DISCONNECT") await SocketHelper.handleDisconnect(connectionId);
  else if (eventType == "MESSAGE") {
    const payload = {
      churchId: "",
      conversationId: "",
      action: "socketId",
      data: rc.connectionId
    };
    try {
      const command = new PostToConnectionCommand({
        ConnectionId: rc.connectionId,
        Data: JSON.stringify(payload)
      });
      await gwManagement.send(command);
    } catch (e) {
      await logMessage(e.toString());
    }
  }
  return {
    statusCode: 200,
    body: "success"
  };
};
