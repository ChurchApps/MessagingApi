const serverlessExpress = require("@codegenie/serverless-express");
const { init } = require("./dist/app");
const { Environment } = require("./dist/helpers/Environment");
const { Pool } = require("@churchapps/apihelper");
const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} = require("@aws-sdk/client-apigatewaymanagementapi");
const { Logger } = require("./dist/helpers/Logger");
const { SocketHelper } = require("./dist/helpers/SocketHelper");
const { NotificationHelper } = require("./dist/helpers/NotificationHelper");

let gwManagement = null;

const initEnv = async () => {
  return Environment.init(process.env.APP_ENV).then(() => {
    Pool.initPool();
    gwManagement = new ApiGatewayManagementApiClient({
      apiVersion: "2020-04-16",
      endpoint: Environment.socketUrl || "ws://localhost:8087"
    });
  });
};

const getApiGatewayManagementClient = (event) => {
  // For AWS Lambda WebSocket, construct the correct API Gateway endpoint from event context
  if (event && event.requestContext && event.requestContext.domainName) {
    const { domainName, stage, apiId } = event.requestContext;
    
    let endpoint;
    // If using custom domain, we need to use the actual API Gateway endpoint
    if (domainName.includes('churchapps.org')) {
      // For custom domains, use the API Gateway's regional endpoint
      endpoint = `https://${apiId}.execute-api.us-east-2.amazonaws.com/${stage}`;
      console.log(`Using API Gateway endpoint for custom domain: ${endpoint}`);
    } else {
      // For direct API Gateway connections
      endpoint = `https://${domainName}/${stage}`;
      console.log(`Using direct API Gateway endpoint: ${endpoint}`);
    }
    
    return new ApiGatewayManagementApiClient({
      apiVersion: "2020-04-16",
      endpoint: endpoint
    });
  }
  // Fallback to the global client (for local/non-AWS environments)
  console.log(`Using fallback client with endpoint: ${Environment.socketUrl}`);
  return gwManagement || new ApiGatewayManagementApiClient({
    apiVersion: "2020-04-16",
    endpoint: Environment.socketUrl || "ws://localhost:8087"
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
  try {
    console.log(`Lambda function started`);
    console.log(`Full event:`, JSON.stringify(event, null, 2));

    const rc = event.requestContext;
    const eventType = rc.eventType;
    const connectionId = rc.connectionId;

    console.log(`WebSocket ${eventType} for connection ${connectionId}`);

    await checkPool();
    
    if (eventType == "DISCONNECT") {
      await SocketHelper.handleDisconnect(connectionId);
    } else if (eventType == "MESSAGE") {
      const payload = {
        churchId: "",
        conversationId: "",
        action: "socketId",
        data: rc.connectionId
      };
      
      try {
        // Use the correct API Gateway Management client with proper endpoint
        const apiGwClient = getApiGatewayManagementClient(event);
        console.log(`Using API Gateway endpoint from event context`);
        
        const command = new PostToConnectionCommand({
          ConnectionId: rc.connectionId,
          Data: JSON.stringify(payload)
        });
        
        await apiGwClient.send(command);
        console.log(`Successfully sent socketId response to connection ${rc.connectionId}`);
      } catch (e) {
        console.error(`Failed to send socketId response to connection ${rc.connectionId}:`, e);
        console.error(`Error details:`, e.stack);
        await logMessage(`WebSocket send error: ${e.toString()}`);
        // Don't throw here - return success even if send fails
      }
    }
    
    console.log(`Lambda function completed successfully`);
    return {
      statusCode: 200,
      body: "success"
    };
  } catch (error) {
    console.error(`Lambda function error:`, error);
    console.error(`Error stack:`, error.stack);
    await logMessage(`Lambda function error: ${error.toString()}`);
    return {
      statusCode: 500,
      body: "Internal server error"
    };
  }
};
