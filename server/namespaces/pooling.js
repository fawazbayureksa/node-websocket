// Pooling Namespace Handler
class PoolingHandler {
    constructor() {
        this.clients = new Set();
        this.polls = new Map();
        this.pollIdCounter = 1;
    }

    handleConnection(ws) {
        this.clients.add(ws);
        console.log(`[Pooling] Client connected. Total clients: ${this.clients.size}`);

        // Send current polls to new client
        ws.send(JSON.stringify({
            action: 'sync_polls',
            payload: Array.from(this.polls.values())
        }));

        ws.on('message', (message) => {
            this.handleMessage(ws, message);
        });

        ws.on('close', () => {
            this.clients.delete(ws);
            console.log(`[Pooling] Client disconnected. Total clients: ${this.clients.size}`);
        });

        ws.on('error', (err) => {
            console.error('[Pooling] WebSocket error:', err);
        });
    }

    handleMessage(ws, message) {
        try {
            const messageString = message.toString();
            const data = JSON.parse(messageString);
            console.log('[Pooling] Message received:', data);

            switch (data.action) {
                case 'create_poll':
                    this.createPoll(data.payload);
                    break;
                case 'vote':
                    this.vote(data.payload);
                    break;
                case 'get_polls':
                    ws.send(JSON.stringify({
                        action: 'sync_polls',
                        payload: Array.from(this.polls.values())
                    }));
                    break;
                case 'delete_poll':
                    this.deletePoll(data.payload);
                    break;
                default:
                    console.log('[Pooling] Unknown action:', data.action);
            }
        } catch (error) {
            console.error('[Pooling] Error parsing message:', error);
        }
    }

    createPoll(payload) {
        if (payload && payload.question && payload.options) {
            const pollId = this.pollIdCounter++;
            const poll = {
                id: pollId,
                question: payload.question,
                options: payload.options.map(option => ({
                    text: option,
                    votes: 0
                })),
                createdAt: new Date().toISOString()
            };
            
            this.polls.set(pollId, poll);
            console.log(`[Pooling] Poll created: ${poll.question}`);
            
            this.broadcast({
                action: 'poll_created',
                payload: poll
            });
        }
    }

    vote(payload) {
        if (payload && payload.pollId !== undefined && payload.optionIndex !== undefined) {
            const poll = this.polls.get(payload.pollId);
            if (poll && poll.options[payload.optionIndex]) {
                poll.options[payload.optionIndex].votes++;
                console.log(`[Pooling] Vote recorded for poll ${payload.pollId}, option ${payload.optionIndex}`);
                
                this.broadcast({
                    action: 'poll_updated',
                    payload: poll
                });
            }
        }
    }

    deletePoll(payload) {
        if (payload && payload.pollId !== undefined) {
            if (this.polls.delete(payload.pollId)) {
                console.log(`[Pooling] Poll deleted: ${payload.pollId}`);
                
                this.broadcast({
                    action: 'poll_deleted',
                    payload: { pollId: payload.pollId }
                });
            }
        }
    }

    broadcast(message) {
        const messageString = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(messageString);
            }
        });
    }
}

module.exports = PoolingHandler;
