// WebSocket connection
let ws;
let reconnectInterval = 3000;

// DOM elements
const scoreAElement = document.getElementById('scoreA');
const scoreBElement = document.getElementById('scoreB');
const statusElement = document.getElementById('status');

const btnSetTeam = document.getElementById('setNamesBtn');
const teamAInput = document.getElementById('teamAName');
const teamBInput = document.getElementById('teamBName');
const teamANameElement = document.getElementById('teamA');
const teamBNameElement = document.getElementById('teamB');
const clearAllBtn = document.getElementById('clearAllBtn');

const btnA = document.getElementById('btnA');
const btnB = document.getElementById('btnB');

// Local score state
let scores = {
    A: 0,
    B: 0
};

// Store for dynamic scoreboards
let dynamicScoreboards = [];

// Load saved data on page load
function loadSavedData() {
    const savedScoreboards = localStorage.getItem('dynamicScoreboards');
    if (savedScoreboards) {
        dynamicScoreboards = JSON.parse(savedScoreboards);
        // Recreate all saved scoreboards
        dynamicScoreboards.forEach(scoreboard => {
            addNewTeamScoreboard(scoreboard.teamAName, scoreboard.teamBName, scoreboard.timestamp, scoreboard.scores);
        });
    }
}

// Save dynamic scoreboards to localStorage
function saveDynamicScoreboards() {
    localStorage.setItem('dynamicScoreboards', JSON.stringify(dynamicScoreboards));
}

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

btnSetTeam.addEventListener('click', setTeamNames);
clearAllBtn.addEventListener('click', clearAllScoreboards);

function setTeamNames() {
    if (!teamAInput.value.trim() && !teamBInput.value.trim()) {
        alert('Name cannot be empty.');
        return;
    }
    const teamAName = teamAInput.value.trim() || 'Team A';
    const teamBName = teamBInput.value.trim() || 'Team B';
    console.log('Setting team names:', teamAName, teamBName);
    
    // Generate new scoreboard HTML
    addNewTeamScoreboard(teamAName, teamBName);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            action: 'set_team_names',
            payload: {
                teamA: teamAName,
                teamB: teamBName
            }
        };
        ws.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not connected');
    }
    
    // Clear input fields
    teamAInput.value = '';
    teamBInput.value = '';
}

function addNewTeamScoreboard(teamAName, teamBName, existingTimestamp = null, existingScores = null) {
    const listTeamContainer = document.getElementById('listTeam');
    
    // Use existing timestamp if provided, otherwise create new one
    const timestamp = existingTimestamp || Date.now();
    const scoreIdA = `scoreA_${timestamp}`;
    const scoreIdB = `scoreB_${timestamp}`;
    const btnIdA = `btnA_${timestamp}`;
    const btnIdB = `btnB_${timestamp}`;
    
    // Use existing scores if provided, otherwise start at 0
    const scoreA = existingScores ? existingScores.A : 0;
    const scoreB = existingScores ? existingScores.B : 0;
    
    // Create the scoreboard HTML
    const scoreboardHTML = `
        <div class="scoreboard mb" data-timestamp="${timestamp}">
            <div class="scores">
                <div class="team">
                    <div class="team-name">${teamAName}</div>
                    <div class="score" id="${scoreIdA}">${scoreA}</div>
                    <div class="controls">
                        <button onclick="updateScore('A', '${timestamp}')" id="${btnIdA}">+1</button>
                    </div>
                </div>
                <div class="team">
                    <div class="team-name">${teamBName}</div>
                    <div class="score" id="${scoreIdB}">${scoreB}</div>
                    <div class="controls">
                        <button onclick="updateScore('B', '${timestamp}')" id="${btnIdB}">+1</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Append to the container
    listTeamContainer.insertAdjacentHTML('beforeend', scoreboardHTML);
    
    // Store scoreboard data (only if not restoring existing data)
    if (!existingTimestamp) {
        const scoreboardData = {
            timestamp: timestamp,
            teamAName: teamAName,
            teamBName: teamBName,
            scores: { A: scoreA, B: scoreB }
        };
        dynamicScoreboards.push(scoreboardData);
        saveDynamicScoreboards();
    }
}

function clearAllScoreboards() {
    // Clear the DOM
    const listTeamContainer = document.getElementById('listTeam');
    listTeamContainer.innerHTML = '';
    
    // Clear the stored data
    dynamicScoreboards = [];
    localStorage.removeItem('dynamicScoreboards');
    
    console.log('All dynamic scoreboards cleared');
}


function handleAddNewTeam(data) {
    try {
        const message = JSON.parse(data);
        if (message.action === 'set_team_names' && message.payload) {
            const { teamA, teamB } = message.payload;
            teamANameElement.textContent = teamA;
            teamBNameElement.textContent = teamB;
        }
    } catch (error) {
        console.error('Error parsing message:', error);
    }
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
function updateScore(team, timestamp) {
    if (timestamp) {
        // Handle score update for dynamically created scoreboards
        const scoreElement = document.getElementById(`score${team}_${timestamp}`);
        if (scoreElement) {
            let currentScore = parseInt(scoreElement.textContent) || 0;
            currentScore += 1;
            scoreElement.textContent = currentScore;
            
            // Update score in dynamicScoreboards array
            const scoreboardIndex = dynamicScoreboards.findIndex(sb => sb.timestamp == timestamp);
            if (scoreboardIndex !== -1) {
                dynamicScoreboards[scoreboardIndex].scores[team] = currentScore;
                saveDynamicScoreboards();
            }
        }
    } else {
        // Handle score update for the original scoreboard via WebSocket
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
loadSavedData();
