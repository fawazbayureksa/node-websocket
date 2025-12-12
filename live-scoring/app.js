// WebSocket connection
let ws;
let reconnectInterval = 3000;

// DOM elements
const scoreAElement = document.getElementById('scoreA');
const scoreBElement = document.getElementById('scoreB');
const statusElement = document.getElementById('status');
const btnA = document.getElementById('btnA');
const btnB = document.getElementById('btnB');

// Local score state
let scores = {
    A: 0,
    B: 0
};

// Connect to WebSocket server with live-scoring namespace
function connectWebSocket() {
    ws = new WebSocket('ws://localhost:8080/live-scoring');

    ws.onopen = () => {
        console.log('WebSocket connected to live-scoring namespace');
        updateConnectionStatus(true);
    };

    ws.onmessage = (event) => {
        handleMessage(event.data);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        updateConnectionStatus(false);
        // Attempt to reconnect
        setTimeout(connectWebSocket, reconnectInterval);
    };
}

// Handle incoming messages
function handleMessage(data) {
    try {
        const message = JSON.parse(data);
        
        // Handle score updates
        if (message.action === 'update_score' && message.payload) {
            const { team, score } = message.payload;
            if (team === 'A' || team === 'B') {
                scores[team] = score;
                renderScores();
            }
        }
        
        // Handle full score sync
        if (message.action === 'sync_scores' && message.payload) {
            scores.A = message.payload.A || 0;
            scores.B = message.payload.B || 0;
            renderScores();
        }
        
    } catch (error) {
        console.error('Error parsing message:', error);
    }
}

// Update score on button click
function updateScore(team) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            action: 'update_score',
            payload: {
                team: team
            }
        };
        ws.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not connected');
    }
}

// Render scores to DOM
function renderScores() {
    scoreAElement.textContent = scores.A;
    scoreBElement.textContent = scores.B;
}

// Update connection status
function updateConnectionStatus(connected) {
    if (connected) {
        statusElement.textContent = 'Connected';
        statusElement.className = 'connection-status connected';
        btnA.disabled = false;
        btnB.disabled = false;
    } else {
        statusElement.textContent = 'Disconnected';
        statusElement.className = 'connection-status disconnected';
        btnA.disabled = true;
        btnB.disabled = true;
    }
}

// Initialize
connectWebSocket();
renderScores();
