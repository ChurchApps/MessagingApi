const https = require('https');

// Test with a simple connection first
const connectionData = [
    {
        "churchId": "AOjIt0W-SeY", 
        "conversationId": "alerts",
        "personId": "bTrK6d0kvF6",
        "displayName": "TestUser123",
        "socketId": "test-socket-123"
    }
];

console.log('🧪 Testing POST to connections with simple data...');

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
    console.log('📥 Response:', responseData);
    
    if (res.statusCode === 200) {
      console.log('✅ POST successful - Check logs for database write confirmation');
      console.log('🔍 Look for logs with: 🔵 ConnectionController.save');
    } else {
      console.log('❌ POST failed');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error);
});

req.write(postData);
req.end();