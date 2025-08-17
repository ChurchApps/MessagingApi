const WebSocket = require('ws');

console.log('Testing custom domain with detailed logging...');

const ws = new WebSocket('wss://socket.staging.churchapps.org');

ws.on('open', function open() {
  console.log('✓ Connected to wss://socket.staging.churchapps.org');
  console.log('Connection state:', ws.readyState);
  
  // Try sending a simple message
  console.log('Sending simple message...');
  ws.send('hello');
  
  // Set up timeout
  setTimeout(() => {
    console.log('⏱️  5 second timeout - closing connection');
    ws.close();
  }, 5000);
});

ws.on('message', function message(data) {
  console.log('📥 RECEIVED:', data.toString());
});

ws.on('error', function error(err) {
  console.log('❌ ERROR:', err.message);
  console.log('Error details:', err);
});

ws.on('close', function close(code, reason) {
  console.log('🔌 CLOSED:', code, reason ? reason.toString() : 'No reason provided');
});

// Also test direct connection for comparison
setTimeout(() => {
  console.log('\n--- Testing direct API Gateway URL for comparison ---');
  const directWs = new WebSocket('wss://vqu18129j0.execute-api.us-east-2.amazonaws.com/Staging');
  
  directWs.on('open', function open() {
    console.log('✓ Connected to direct URL');
    console.log('Sending message to direct URL...');
    directWs.send('hello');
  });
  
  directWs.on('message', function message(data) {
    console.log('📥 DIRECT RECEIVED:', data.toString());
    directWs.close();
  });
  
  directWs.on('error', function error(err) {
    console.log('❌ DIRECT ERROR:', err.message);
  });
  
  directWs.on('close', function close(code, reason) {
    console.log('🔌 DIRECT CLOSED:', code, reason ? reason.toString() : 'No reason provided');
  });
}, 6000);