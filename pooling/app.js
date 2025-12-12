// WebSocket connection for Pooling
let ws;
let reconnectInterval = 3000;

// DOM elements
const statusElement = document.getElementById('status');
const pollsContainer = document.getElementById('pollsContainer');
const createPollForm = document.getElementById('createPollForm');
const questionInput = document.getElementById('questionInput');
const optionsContainer = document.getElementById('optionsContainer');
const addOptionBtn = document.getElementById('addOptionBtn');

// Local polls state
let polls = [];

// Connect to WebSocket server with pooling namespace
function connectWebSocket() {
    ws = new WebSocket('ws://localhost:8080/pooling');

    ws.onopen = () => {
        console.log('WebSocket connected to pooling namespace');
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
        setTimeout(connectWebSocket, reconnectInterval);
    };
}

// Handle incoming messages
function handleMessage(data) {
    try {
        const message = JSON.parse(data);
        console.log('Message received:', message);
        
        switch (message.action) {
            case 'sync_polls':
                polls = message.payload || [];
                renderPolls();
                break;
            case 'poll_created':
                polls.push(message.payload);
                renderPolls();
                break;
            case 'poll_updated':
                const updatedIndex = polls.findIndex(p => p.id === message.payload.id);
                if (updatedIndex !== -1) {
                    polls[updatedIndex] = message.payload;
                    renderPolls();
                }
                break;
            case 'poll_deleted':
                polls = polls.filter(p => p.id !== message.payload.pollId);
                renderPolls();
                break;
        }
    } catch (error) {
        console.error('Error parsing message:', error);
    }
}

// Create a new poll
function createPoll(event) {
    event.preventDefault();
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        const question = questionInput.value.trim();
        const optionInputs = document.querySelectorAll('.option-input');
        const options = Array.from(optionInputs)
            .map(input => input.value.trim())
            .filter(option => option !== '');
        
        if (question && options.length >= 2) {
            const message = {
                action: 'create_poll',
                payload: {
                    question: question,
                    options: options
                }
            };
            ws.send(JSON.stringify(message));
            
            // Reset form
            questionInput.value = '';
            optionsContainer.innerHTML = '';
            addOption(); // Add default two options
            addOption();
        } else {
            alert('Please provide a question and at least 2 options');
        }
    } else {
        console.error('WebSocket is not connected');
    }
}

// Vote on a poll
function vote(pollId, optionIndex) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            action: 'vote',
            payload: {
                pollId: pollId,
                optionIndex: optionIndex
            }
        };
        ws.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not connected');
    }
}

// Delete a poll
function deletePoll(pollId) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            action: 'delete_poll',
            payload: {
                pollId: pollId
            }
        };
        ws.send(JSON.stringify(message));
    }
}

// Add option input field
function addOption() {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-input-group';
    optionDiv.innerHTML = `
        <input type="text" class="option-input" placeholder="Option" required>
        <button type="button" onclick="this.parentElement.remove()">×</button>
    `;
    optionsContainer.appendChild(optionDiv);
}

// Render all polls
function renderPolls() {
    if (polls.length === 0) {
        pollsContainer.innerHTML = '<div class="no-polls">No polls yet. Create one above!</div>';
        return;
    }
    
    pollsContainer.innerHTML = polls.map(poll => {
        const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
        
        return `
            <div class="poll-card">
                <div class="poll-header">
                    <h3>${poll.question}</h3>
                    <button class="delete-btn" onclick="deletePoll(${poll.id})">Delete</button>
                </div>
                <div class="poll-options">
                    ${poll.options.map((option, index) => {
                        const percentage = totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0;
                        return `
                            <div class="poll-option" onclick="vote(${poll.id}, ${index})">
                                <div class="option-bar" style="width: ${percentage}%"></div>
                                <div class="option-content">
                                    <span class="option-text">${option.text}</span>
                                    <span class="option-votes">${option.votes} votes (${percentage}%)</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="poll-footer">
                    <small>Total votes: ${totalVotes}</small>
                </div>
            </div>
        `;
    }).join('');
}

// Update connection status
function updateConnectionStatus(connected) {
    if (connected) {
        statusElement.textContent = 'Connected';
        statusElement.className = 'connection-status connected';
    } else {
        statusElement.textContent = 'Disconnected';
        statusElement.className = 'connection-status disconnected';
    }
}

// Initialize
createPollForm.addEventListener('submit', createPoll);
addOptionBtn.addEventListener('click', addOption);

// Add default two option inputs
addOption();
addOption();

connectWebSocket();
