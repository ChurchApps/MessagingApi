const https = require('https');

// Test data to POST
const connectionData = [
    {
        "id": "z2wUg7y7Bd9",
        "churchId": "AOjIt0W-SeY",
        "conversationId": "alerts",
        "personId": "bTrK6d0kvF6",
        "displayName": "Test",
        "socketId": "PbZw-cbAiYcCFPQ="
    }
];

console.log('🚀 Testing POST to /connections endpoint...');
console.log('📤 Data to send:', JSON.stringify(connectionData, null, 2));

// Prepare the request
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
  console.log(`📡 Response Status: ${res.statusCode}`);
  console.log(`📡 Response Headers:`, res.headers);

  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('📥 Response Body:', responseData);
    
    try {
      const parsedResponse = JSON.parse(responseData);
      console.log('✅ Parsed Response:', JSON.stringify(parsedResponse, null, 2));
    } catch (e) {
      console.log('⚠️  Response is not valid JSON');
    }
    
    console.log('\n🔍 Check CloudWatch logs for database write confirmation');
    console.log('   Look for logs with 🔵, ✅, and 🎯 emojis');
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error);
});

// Send the request
req.write(postData);
req.end();

console.log('⏳ Request sent, waiting for response...');