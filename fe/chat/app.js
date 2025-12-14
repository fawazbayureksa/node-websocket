// WebSocket Chat Client
let ws;
let reconnectInterval = 3000;
let currentUsername = '';
let typingTimeout;
let isTyping = false;
let typingUsers = new Set();

// DOM elements
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const connectionStatus = document.getElementById('connectionStatus');
const usernameInput = document.getElementById('usernameInput');
const setUsernameButton = document.getElementById('setUsernameButton');
const onlineUsers = document.getElementById('onlineUsers');
const userCount = document.getElementById('userCount');
const typingIndicator = document.getElementById('typingIndicator');

// Connect to WebSocket server
function connectWebSocket() {
    console.log('Attempting to connect to WebSocket server...');
    ws = new WebSocket('ws://localhost:8080/chat');

    ws.onopen = () => {
        console.log('✅ Connected to chat server');
        updateConnectionStatus(true);
    };

    ws.onmessage = (event) => {
        handleMessage(event.data);
    };

    ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('🔌 Disconnected from chat server');
        updateConnectionStatus(false);
        setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connectWebSocket();
        }, reconnectInterval);
    };
}

// Handle incoming messages
function handleMessage(data) {
    try {
        const message = JSON.parse(data);
        console.log('📨 Received:', message);

        switch (message.action) {
            case 'connected':
                handleConnected(message.payload);
                break;
            case 'new_message':
                displayMessage(message.payload);
                break;
            case 'user_joined':
                displaySystemMessage(`✨ ${message.payload.username} joined the chat`);
                break;
            case 'user_left':
                displaySystemMessage(`👋 ${message.payload.username} left the chat`);
                break;
            case 'username_changed':
                currentUsername = message.payload.username;
                usernameInput.value = currentUsername;
                displaySystemMessage(`✅ Your username is now: ${currentUsername}`);
                break;
            case 'username_changed_broadcast':
                displaySystemMessage(
                    `🔄 ${message.payload.oldUsername} changed their name to ${message.payload.newUsername}`
                );
                break;
            case 'user_list':
                updateUserList(message.payload.users);
                break;
            case 'user_typing':
                handleTypingIndicator(message.payload);
                break;
        }
    } catch (error) {
        console.error('❌ Error parsing message:', error);
    }
}

// Handle initial connection
function handleConnected(payload) {
    currentUsername = payload.username;
    usernameInput.value = currentUsername;
    
    console.log(`👤 Connected as: ${currentUsername}`);
    
    // Display message history
    if (payload.messages && payload.messages.length > 0) {
        console.log(`📜 Loading ${payload.messages.length} previous messages`);
        payload.messages.forEach(msg => displayMessage(msg, false));
    }
    
    displaySystemMessage('🎉 Welcome to the chat room! Start chatting below.');
}

// Display a chat message
function displayMessage(messageData, shouldScroll = true) {
    const messageDiv = document.createElement('div');
    const isOwnMessage = messageData.username === currentUsername;
    messageDiv.className = `message ${isOwnMessage ? 'own' : 'other'}`;

    const timestamp = new Date(messageData.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username">${escapeHtml(messageData.username)}</span>
            <span class="message-timestamp">${timestamp}</span>
        </div>
        <div class="message-content">${escapeHtml(messageData.message)}</div>
    `;

    chatMessages.appendChild(messageDiv);
    
    if (shouldScroll) {
        scrollToBottom();
    }
}

// Display system message
function displaySystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Send a message
function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message || !ws || ws.readyState !== WebSocket.OPEN) {
        return;
    }

    console.log('📤 Sending message:', message);

    ws.send(JSON.stringify({
        action: 'send_message',
        payload: { message }
    }));

    messageInput.value = '';
    stopTyping();
}

// Set username
function setUsername() {
    const username = usernameInput.value.trim();
    
    if (!username || username === currentUsername) {
        return;
    }

    if (!ws || ws.readyState !== WebSocket.OPEN) {
        displaySystemMessage('❌ Cannot change username: Not connected to server');
        return;
    }

    console.log('👤 Changing username to:', username);

    ws.send(JSON.stringify({
        action: 'set_username',
        payload: { username }
    }));
}

// Handle typing indicator
function handleTyping() {
    if (!isTyping && messageInput.value.trim()) {
        isTyping = true;
        sendTypingStatus(true);
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        stopTyping();
    }, 2000);
}

function stopTyping() {
    if (isTyping) {
        isTyping = false;
        sendTypingStatus(false);
    }
}

function sendTypingStatus(status) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            action: 'typing',
            payload: { isTyping: status }
        }));
    }
}

function handleTypingIndicator(payload) {
    if (payload.isTyping) {
        typingUsers.add(payload.username);
    } else {
        typingUsers.delete(payload.username);
    }

    updateTypingIndicator();
}

function updateTypingIndicator() {
    if (typingUsers.size === 0) {
        typingIndicator.innerHTML = '';
        return;
    }

    const usernames = Array.from(typingUsers);
    let text = '';

    if (usernames.length === 1) {
        text = `${usernames[0]} is typing`;
    } else if (usernames.length === 2) {
        text = `${usernames[0]} and ${usernames[1]} are typing`;
    } else {
        text = `${usernames.length} people are typing`;
    }

    typingIndicator.innerHTML = `
        ${text}
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
    `;
}

// Update online users list
function updateUserList(users) {
    onlineUsers.innerHTML = '';
    const count = users.length;
    userCount.textContent = `${count} user${count !== 1 ? 's' : ''} online`;

    console.log(`👥 Online users: ${count}`);

    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.title = `Connected at ${new Date(user.connectedAt).toLocaleTimeString()}`;
        userDiv.innerHTML = `
            <div class="user-status"></div>
            <div class="user-name">${escapeHtml(user.username)}</div>
        `;
        onlineUsers.appendChild(userDiv);
    });
}

// Update connection status
function updateConnectionStatus(connected) {
    if (connected) {
        connectionStatus.textContent = 'Connected';
        connectionStatus.className = 'connection-badge connected';
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    } else {
        connectionStatus.textContent = 'Disconnected';
        connectionStatus.className = 'connection-badge disconnected';
        messageInput.disabled = true;
        sendButton.disabled = true;
        typingUsers.clear();
        updateTypingIndicator();
    }
}

// Scroll to bottom of messages
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

messageInput.addEventListener('input', handleTyping);

setUsernameButton.addEventListener('click', setUsername);

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        setUsername();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to send message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        sendMessage();
    }
});

// Page visibility handling - stop typing when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopTyping();
    }
});

// Initialize connection
console.log('🚀 Starting chat client...');
connectWebSocket();

// Scroll to bottom on initial load after a short delay
setTimeout(() => {
    scrollToBottom();
}, 100);
