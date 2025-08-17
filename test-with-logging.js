const https = require('https');

// Test connection and then check logs
const connectionData = [
    {
        "churchId": "test-church-789", 
        "conversationId": "test-conversation",
        "personId": "test-person-456",
        "displayName": "LogTestUser",
        "socketId": "log-test-socket-456"
    }
];

console.log('🧪 Testing POST with unique data for log verification...');
console.log(`📤 Sending:`, JSON.stringify(connectionData, null, 2));

const postData = JSON.stringify(connectionData);

const options = {
  hostname: 'ucyofl7jqb.execute-api.us-east-2.amazonaws.com',
  port: 443,
  path: '/Staging/connections',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`📡 Status: ${res.statusCode}`);

  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    const timestamp = new Date().toISOString();
    console.log(`📥 Response (${timestamp}):`, responseData);
    
    if (res.statusCode === 200) {
      try {
        const parsed = JSON.parse(responseData);
        if (parsed[0] && parsed[0].id) {
          console.log(`✅ SUCCESS: Database write confirmed!`);
          console.log(`🆔 Generated ID: ${parsed[0].id}`);
          console.log(`📊 Data written: churchId=${parsed[0].churchId}, displayName=${parsed[0].displayName}`);
          console.log(`⏰ Timestamp: ${timestamp}`);
        }
      } catch (e) {
        console.log('⚠️  Could not parse response');
      }
    } else {
      console.log('❌ POST failed');
    }
    
    console.log('\n🔍 Checking CloudWatch logs...');
    console.log('   Look for entries with LogTestUser and log-test-socket-456');
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error);
});

req.write(postData);
req.end();