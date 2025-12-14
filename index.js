// Main WebSocket Server with Namespace Support

const WebSocket = require('ws');
const url = require('url');
const LiveScoringHandler = require('./server/namespaces/liveScoring');
const PoolingHandler = require('./server/namespaces/pooling');
const ChatHandler = require('./server/namespaces/chat');

// Initialize WebSocket Server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

// Initialize namespace handlers
const namespaces = {
    '/live-scoring': new LiveScoringHandler(),
    '/pooling': new PoolingHandler(),
    '/chat': new ChatHandler()
};

console.log('======================================');
console.log('WebSocket Server running on ws://localhost:8080');
console.log('Available namespaces:');
console.log('  - ws://localhost:8080/live-scoring');
console.log('  - ws://localhost:8080/pooling');
console.log('  - ws://localhost:8080/chat');
console.log('======================================\n');

// Handle incoming connections
wss.on('connection', (ws, req) => {
    const pathname = url.parse(req.url).pathname;
    
    console.log(`New connection attempt to: ${pathname}`);
    
    // Route to appropriate namespace handler
    const handler = namespaces[pathname];
    
    if (handler) {
        handler.handleConnection(ws);
    } else {
        console.log(`Unknown namespace: ${pathname}. Connection rejected.`);
        ws.close(1008, `Unknown namespace: ${pathname}`);
    }
});

wss.on('error', (error) => {
    console.error('Server error:', error);
});

console.log('Server ready and waiting for connections...\n');