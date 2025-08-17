const WebSocket = require('ws');

console.log('Testing both WebSocket URLs...');

// Test direct API Gateway URL first
console.log('\n1. Testing direct API Gateway URL...');
const directWs = new WebSocket('wss://vqu18129j0.execute-api.us-east-2.amazonaws.com/Staging');

directWs.on('open', function open() {
  console.log('✓ Connected to direct API Gateway WebSocket');
  console.log('Sending test message...');
  directWs.send('test message');
});

directWs.on('message', function message(data) {
  console.log('✓ Received from direct URL:', data.toString());
  const parsed = JSON.parse(data.toString());
  if (parsed.action === 'socketId' && parsed.data) {
    console.log('✓ SUCCESS: Direct URL returns socketId:', parsed.data);
  }
  directWs.close();
  
  // Now test the production URL
  testProductionUrl();
});

directWs.on('error', function error(err) {
  console.log('✗ Direct URL error:', err.message);
  testProductionUrl();
});

function testProductionUrl() {
  console.log('\n2. Testing production URL...');
  const prodWs = new WebSocket('wss://socket.staging.churchapps.org');
  
  let responseReceived = false;
  
  // Set a timeout to detect if no response comes
  const timeout = setTimeout(() => {
    if (!responseReceived) {
      console.log('✗ No response received from production URL within 10 seconds');
      prodWs.close();
    }
  }, 10000);

  prodWs.on('open', function open() {
    console.log('✓ Connected to production WebSocket URL');
    console.log('Sending test message...');
    prodWs.send('test message');
  });

  prodWs.on('message', function message(data) {
    responseReceived = true;
    clearTimeout(timeout);
    console.log('✓ Received from production URL:', data.toString());
    const parsed = JSON.parse(data.toString());
    if (parsed.action === 'socketId' && parsed.data) {
      console.log('✓ SUCCESS: Production URL returns socketId:', parsed.data);
    } else {
      console.log('✗ UNEXPECTED: Received unexpected message format');
    }
    prodWs.close();
    console.log('\nTest completed!');
  });

  prodWs.on('error', function error(err) {
    responseReceived = true;
    clearTimeout(timeout);
    console.log('✗ Production URL error:', err.message);
    console.log('\nTest completed!');
  });

  prodWs.on('close', function close() {
    if (!responseReceived) {
      responseReceived = true;
      clearTimeout(timeout);
      console.log('✗ Production URL connection closed without response');
      console.log('\nTest completed!');
    }
  });
}