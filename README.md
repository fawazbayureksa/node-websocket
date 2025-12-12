# WebSocket Multi-Project Server

A clean and efficient WebSocket server supporting multiple namespaces for different real-time applications.

## Features

- **Namespace-based Architecture**: Clean separation of different projects
- **Live Scoring**: Real-time score tracking for Team A vs Team B
- **Polling System**: Create, vote, and manage live polls
- **Auto-reconnection**: Clients automatically reconnect on disconnection
- **Broadcasting**: Real-time updates to all connected clients

## Project Structure

```
setup-project/
├── index.js                    # Main server with namespace routing
├── package.json
├── server/
│   └── namespaces/
│       ├── liveScoring.js     # Live scoring handler
│       └── pooling.js         # Polling handler
├── live-scoring/
│   ├── index.html             # Live scoring UI
│   └── app.js                 # Live scoring client
└── pooling/
    ├── index.html             # Polling UI
    └── app.js                 # Polling client
```

## Getting Started

### Installation

```bash
npm install
```

### Running the Server

```bash
npm start
```

The server will run on `ws://localhost:8080` with the following namespaces:
- `ws://localhost:8080/live-scoring`
- `ws://localhost:8080/pooling`

### Accessing the Applications

1. **Live Scoring**: Open `live-scoring/index.html` in your browser
2. **Polling System**: Open `pooling/index.html` in your browser

## Namespaces

### Live Scoring (`/live-scoring`)

Real-time score tracking system for two teams.

**Client Actions:**
- `update_score` - Increment team score
- `get_scores` - Request current scores
- `reset_scores` - Reset all scores to 0

**Server Events:**
- `update_score` - Score updated for a team
- `sync_scores` - Full score synchronization

### Polling (`/pooling`)

Create and vote on live polls with real-time results.

**Client Actions:**
- `create_poll` - Create a new poll with question and options
- `vote` - Vote on a poll option
- `get_polls` - Request all polls
- `delete_poll` - Delete a poll

**Server Events:**
- `poll_created` - New poll created
- `poll_updated` - Poll votes updated
- `poll_deleted` - Poll removed
- `sync_polls` - Full polls synchronization

## Adding New Namespaces

1. Create a new handler in `server/namespaces/yourNamespace.js`:

```javascript
class YourNamespaceHandler {
    constructor() {
        this.clients = new Set();
    }

    handleConnection(ws) {
        this.clients.add(ws);
        // Handle messages, close, error events
    }

    broadcast(message) {
        const messageString = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(messageString);
            }
        });
    }
}

module.exports = YourNamespaceHandler;
```

2. Register it in `index.js`:

```javascript
const YourNamespaceHandler = require('./server/namespaces/yourNamespace');

const namespaces = {
    '/live-scoring': new LiveScoringHandler(),
    '/pooling': new PoolingHandler(),
    '/your-namespace': new YourNamespaceHandler()
};
```

3. Create your client application in a new folder

## Message Format

All messages use JSON format:

```javascript
{
    "action": "action_name",
    "payload": {
        // action-specific data
    }
}
```

## Technologies

- **Server**: Node.js with `ws` library
- **Client**: Vanilla JavaScript with WebSocket API
- **UI**: HTML5 & CSS3

## License

ISC
