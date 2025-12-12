// Live Scoring Namespace Handler
class LiveScoringHandler {
    constructor() {
        this.clients = new Set();
        this.scores = {
            A: 0,
            B: 0
        };
    }

    handleConnection(ws) {
        this.clients.add(ws);
        console.log(`[Live-Scoring] Client connected. Total clients: ${this.clients.size}`);

        // Send initial scores to new client
        ws.send(JSON.stringify({
            action: 'sync_scores',
            payload: this.scores
        }));

        ws.on('message', (message) => {
            this.handleMessage(ws, message);
        });

        ws.on('close', () => {
            this.clients.delete(ws);
            console.log(`[Live-Scoring] Client disconnected. Total clients: ${this.clients.size}`);
        });

        ws.on('error', (err) => {
            console.error('[Live-Scoring] WebSocket error:', err);
        });
    }

    handleMessage(ws, message) {
        try {
            const messageString = message.toString();
            const data = JSON.parse(messageString);
            console.log('[Live-Scoring] Message received:', data);

            switch (data.action) {
                case 'update_score':
                    this.updateScore(data.payload);
                    break;
                case 'reset_scores':
                    this.resetScores();
                    break;
                case 'get_scores':
                    ws.send(JSON.stringify({
                        action: 'sync_scores',
                        payload: this.scores
                    }));
                    break;
                default:
                    console.log('[Live-Scoring] Unknown action:', data.action);
            }
        } catch (error) {
            console.error('[Live-Scoring] Error parsing message:', error);
        }
    }

    updateScore(payload) {
        if (payload && payload.team) {
            const team = payload.team;
            if (this.scores.hasOwnProperty(team)) {
                this.scores[team]++;
                console.log(`[Live-Scoring] Score updated for Team ${team}: ${this.scores[team]}`);
                
                // Broadcast to all connected clients
                this.broadcast({
                    action: 'update_score',
                    payload: {
                        team: team,
                        score: this.scores[team]
                    }
                });
            }
        }
    }

    resetScores() {
        this.scores = { A: 0, B: 0 };
        console.log('[Live-Scoring] Scores reset');
        
        this.broadcast({
            action: 'sync_scores',
            payload: this.scores
        });
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

module.exports = LiveScoringHandler;
