// Chat Namespace Handler
class ChatHandler {
    constructor() {
        this.clients = new Map(); // Map to store clients with their metadata
        this.messages = []; // Store message history
        this.maxMessages = 100; // Maximum messages to keep in history
    }

    handleConnection(ws) {
        const clientId = this.generateClientId();
        const clientData = {
            id: clientId,
            username: `User${clientId.substring(0, 4)}`,
            ws: ws,
            connectedAt: new Date()
        };

        this.clients.set(ws, clientData);
        console.log(`[Chat] Client connected: ${clientData.username}. Total clients: ${this.clients.size}`);

        // Send connection success and message history
        ws.send(JSON.stringify({
            action: 'connected',
            payload: {
                clientId: clientId,
                username: clientData.username,
                messages: this.messages.slice(-50) // Send last 50 messages
            }
        }));

        // Broadcast new user joined
        this.broadcast({
            action: 'user_joined',
            payload: {
                username: clientData.username,
                timestamp: new Date().toISOString()
            }
        }, ws);

        // Update user list
        this.broadcastUserList();

        ws.on('message', (message) => {
            this.handleMessage(ws, message);
        });

        ws.on('close', () => {
            const client = this.clients.get(ws);
            if (client) {
                console.log(`[Chat] Client disconnected: ${client.username}. Total clients: ${this.clients.size - 1}`);
                
                // Broadcast user left
                this.broadcast({
                    action: 'user_left',
                    payload: {
                        username: client.username,
                        timestamp: new Date().toISOString()
                    }
                });

                this.clients.delete(ws);
                this.broadcastUserList();
            }
        });

        ws.on('error', (err) => {
            console.error('[Chat] WebSocket error:', err);
        });
    }

    handleMessage(ws, message) {
        try {
            const messageString = message.toString();
            const data = JSON.parse(messageString);
            const client = this.clients.get(ws);

            if (!client) {
                console.error('[Chat] Client not found');
                return;
            }

            console.log(`[Chat] Message from ${client.username}:`, data);

            switch (data.action) {
                case 'send_message':
                    this.handleChatMessage(client, data.payload);
                    break;
                case 'set_username':
                    this.handleSetUsername(client, data.payload);
                    break;
                case 'typing':
                    this.handleTyping(client, data.payload);
                    break;
                case 'get_users':
                    this.sendUserList(ws);
                    break;
                default:
                    console.log('[Chat] Unknown action:', data.action);
            }
        } catch (error) {
            console.error('[Chat] Error parsing message:', error);
        }
    }

    handleChatMessage(client, payload) {
        if (!payload || !payload.message) {
            return;
        }

        const messageObj = {
            id: this.generateMessageId(),
            username: client.username,
            message: payload.message.trim(),
            timestamp: new Date().toISOString()
        };

        // Store message in history
        this.messages.push(messageObj);
        if (this.messages.length > this.maxMessages) {
            this.messages.shift(); // Remove oldest message
        }

        console.log(`[Chat] Broadcasting message from ${client.username}`);

        // Broadcast to all clients
        this.broadcast({
            action: 'new_message',
            payload: messageObj
        });
    }

    handleSetUsername(client, payload) {
        if (!payload || !payload.username) {
            return;
        }

        const oldUsername = client.username;
        const newUsername = payload.username.trim().substring(0, 20); // Limit to 20 chars

        if (newUsername && newUsername !== oldUsername) {
            client.username = newUsername;
            console.log(`[Chat] Username changed: ${oldUsername} -> ${newUsername}`);

            // Notify user of successful change
            client.ws.send(JSON.stringify({
                action: 'username_changed',
                payload: {
                    username: newUsername
                }
            }));

            // Broadcast username change
            this.broadcast({
                action: 'username_changed_broadcast',
                payload: {
                    oldUsername: oldUsername,
                    newUsername: newUsername,
                    timestamp: new Date().toISOString()
                }
            });

            this.broadcastUserList();
        }
    }

    handleTyping(client, payload) {
        // Broadcast typing indicator to other users
        this.broadcast({
            action: 'user_typing',
            payload: {
                username: client.username,
                isTyping: payload.isTyping
            }
        }, client.ws);
    }

    sendUserList(ws) {
        const users = Array.from(this.clients.values()).map(client => ({
            username: client.username,
            connectedAt: client.connectedAt
        }));

        ws.send(JSON.stringify({
            action: 'user_list',
            payload: { users }
        }));
    }

    broadcastUserList() {
        const users = Array.from(this.clients.values()).map(client => ({
            username: client.username,
            connectedAt: client.connectedAt
        }));

        this.broadcast({
            action: 'user_list',
            payload: { users }
        });
    }

    broadcast(message, exclude = null) {
        const messageString = JSON.stringify(message);
        this.clients.forEach((client) => {
            if (client.ws !== exclude && client.ws.readyState === 1) { // WebSocket.OPEN
                client.ws.send(messageString);
            }
        });
    }

    generateClientId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    generateMessageId() {
        return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
}

module.exports = ChatHandler;
