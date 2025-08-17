const https = require('https');

console.log('🎯 Testing attendance message delivery via DeliveryHelper.sendAws...');

// First, create a connection that will receive the attendance message
const connectionData = [{
    "churchId": "test-church-attendance", 
    "conversationId": "test-conversation-attendance",
    "personId": "test-person-attendance",
    "displayName": "AttendanceTestUser",
    "socketId": "attendance-test-socket-789"
}];

console.log('📤 Step 1: Creating connection for attendance test...');
const postData = JSON.stringify(connectionData);

const createConnectionOptions = {
  hostname: 'ucyofl7jqb.execute-api.us-east-2.amazonaws.com',
  port: 443,
  path: '/Staging/connections',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

// Create connection first
const createConnectionReq = https.request(createConnectionOptions, (res) => {
  console.log(`📡 Connection creation status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const parsed = JSON.parse(responseData);
        console.log(`✅ Connection created with ID: ${parsed[0].id}`);
        
        // Now trigger an attendance message by calling sendAttendance directly
        // This will test the DeliveryHelper.sendAws method
        console.log('📤 Step 2: Triggering attendance message delivery...');
        
        // Trigger attendance via a conversation message (which calls sendAttendance)
        const messageData = {
          churchId: "test-church-attendance",
          conversationId: "test-conversation-attendance", 
          action: "message",
          data: { content: "Test message to trigger attendance" }
        };
        
        const triggerMessageOptions = {
          hostname: 'ucyofl7jqb.execute-api.us-east-2.amazonaws.com',
          port: 443,
          path: '/Staging/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify(messageData))
          }
        };
        
        const triggerReq = https.request(triggerMessageOptions, (triggerRes) => {
          console.log(`📡 Message trigger status: ${triggerRes.statusCode}`);
          
          let triggerResponseData = '';
          triggerRes.on('data', (chunk) => {
            triggerResponseData += chunk;
          });
          
          triggerRes.on('end', () => {
            console.log(`📥 Message response: ${triggerResponseData}`);
            console.log(`⏰ Test completed at: ${new Date().toISOString()}`);
            console.log('\n🔍 Check CloudWatch logs for:');
            console.log('   - "DeliveryHelper: Using API Gateway endpoint for WebSocket delivery"');
            console.log('   - Look for successful WebSocket message delivery');
            console.log('   - No 410 or connection errors in DeliveryHelper.sendAws');
          });
        });
        
        triggerReq.on('error', (error) => {
          console.error('❌ Message trigger error:', error);
        });
        
        triggerReq.write(JSON.stringify(messageData));
        triggerReq.end();
        
      } catch (e) {
        console.log('⚠️ Could not parse connection response');
      }
    } else {
      console.log(`❌ Connection creation failed: ${responseData}`);
    }
  });
});

createConnectionReq.on('error', (error) => {
  console.error('❌ Connection creation error:', error);
});

createConnectionReq.write(postData);
createConnectionReq.end();