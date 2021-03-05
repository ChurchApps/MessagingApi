const { createServer, proxy } = require('aws-serverless-express');
const { init } = require('./dist/app');
const { Pool } = require('./dist/apiBase/pool');
const AWS = require('aws-sdk');

Pool.initPool();

module.exports.handleWeb = function handleWeb(event, context) {
    AWS.config.update({ region: 'us-east-2' });
    init().then(app => {
        const server = createServer(app);
        return proxy(server, event, context);
    });

}

module.exports.handleSocket = async function handleSocket(event) {
    const rc = event.requestContext;
    const connectionId = rc.connectionId;
    if (eventType == "DISCONNECT") await Repositories.getCurrent().connection.deleteForSocket(connectionId);
    return { statusCode: 200, body: 'success' }
}