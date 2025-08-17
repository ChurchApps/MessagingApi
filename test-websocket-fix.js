const WebSocket = require('ws');

console.log('Testing WebSocket fix...');

// Test staging production URL
console.log('Testing staging WebSocket (production URL)...');
const stagingWs = new WebSocket('wss://socket.staging.churchapps.org');

stagingWs.on('open', function open() {
  console.log('✓ Connected to staging WebSocket');
  console.log('Sending test message...');
  stagingWs.send('test message');
});

stagingWs.on('message', function message(data) {
  console.log('✓ Received from staging production URL:', data.toString());
  const parsed = JSON.parse(data.toString());
  if (parsed.action === 'socketId' && parsed.data) {
    console.log('✓ SUCCESS: Production staging WebSocket now returns socketId:', parsed.data);
  } else {
    console.log('✗ UNEXPECTED: Received unexpected message format');
  }
  stagingWs.close();
});

stagingWs.on('error', function error(err) {
  console.log('✗ Staging WebSocket error:', err.message);
});

stagingWs.on('close', function close() {
  console.log('✓ Staging WebSocket connection closed');
  
  // Test local (if running)
  console.log('\nTesting local WebSocket...');
  const localWs = new WebSocket('ws://localhost:8087');

  localWs.on('open', function open() {
    console.log('✓ Connected to local WebSocket');
    console.log('Sending test message...');
    localWs.send('test message');
  });

  localWs.on('message', function message(data) {
    console.log('✓ Received from local:', data.toString());
    const parsed = JSON.parse(data.toString());
    if (parsed.action === 'socketId' && parsed.data) {
      console.log('✓ SUCCESS: Local WebSocket returns socketId:', parsed.data);
    } else {
      console.log('✗ UNEXPECTED: Received unexpected message format');
    }
    localWs.close();
  });

  localWs.on('error', function error(err) {
    console.log('✗ Local WebSocket error (expected if not running):', err.message);
  });

  localWs.on('close', function close() {
    console.log('✓ Local WebSocket connection closed');
    console.log('\nTest completed!');
  });
});