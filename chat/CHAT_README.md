# WebSocket Chat Feature

## Overview
A real-time chat application built with WebSocket that allows multiple users to communicate instantly.

## Features Implemented

### 1. Real-time Messaging
- Instant message delivery to all connected users
- Message history (last 50 messages stored)
- Timestamp for each message
- Visual distinction between own and other users' messages

### 2. User Management
- Automatic username assignment on connection
- Custom username support
- Online user list with live updates
- User join/leave notifications

### 3. Typing Indicators
- Real-time typing status
- Auto-hide after 2 seconds of inactivity
- Shows which user is typing

### 4. UI/UX Features
- Modern, responsive design
- Gradient color scheme matching project theme
- Smooth animations for new messages
- Auto-scroll to latest messages
- Connection status indicator
- Sidebar with user list and username settings

### 5. Data Persistence
- Message history stored in server memory (last 100 messages)
- New users receive last 50 messages on connection
- User list automatically updated

## Files Created/Modified

### New Files:
1. **server/namespaces/chat.js** - Server-side chat handler
   - Manages connected clients
   - Handles message broadcasting
   - User management
   - Message history

2. **chat/index.html** - Chat UI
   - Modern chat interface
   - Responsive design
   - Sidebar with user list
   - Username settings

3. **chat/app.js** - Client-side JavaScript
   - WebSocket connection management
   - Message sending/receiving
   - Typing indicators
   - User list updates

### Modified Files:
1. **index.js** - Added chat namespace
2. **index.html** - Added navigation links to chat
3. **README.md** - Updated documentation

## Usage

### Starting the Server
```bash
npm start
```

### Accessing the Chat
Open `http://localhost:8080/chat/index.html` in your browser (or use a local file server)

### Features to Try:
1. Open multiple browser windows/tabs
2. Send messages and see them appear in all windows
3. Change your username
4. Start typing to show typing indicator to others
5. Watch the online user list update

## WebSocket Connection
```javascript
ws://localhost:8080/chat
```

## Message Protocol

### Client → Server

**Send Message:**
```json
{
    "action": "send_message",
    "payload": {
        "message": "Hello everyone!"
    }
}
```

**Set Username:**
```json
{
    "action": "set_username",
    "payload": {
        "username": "NewUsername"
    }
}
```

**Typing Indicator:**
```json
{
    "action": "typing",
    "payload": {
        "isTyping": true
    }
}
```

### Server → Client

**Connected:**
```json
{
    "action": "connected",
    "payload": {
        "clientId": "unique-id",
        "username": "User1234",
        "messages": [...]
    }
}
```

**New Message:**
```json
{
    "action": "new_message",
    "payload": {
        "id": "msg-123",
        "username": "User1234",
        "message": "Hello!",
        "timestamp": "2025-12-14T10:30:00.000Z"
    }
}
```

**User List:**
```json
{
    "action": "user_list",
    "payload": {
        "users": [
            {
                "username": "User1234",
                "connectedAt": "2025-12-14T10:00:00.000Z"
            }
        ]
    }
}
```

## Security Features
- XSS prevention with HTML escaping
- Message length limits (handled by client)
- Username length limit (20 characters)

## Future Enhancements
- Private messaging
- Message reactions/emojis
- File sharing
- Message search
- User avatars
- Message editing/deletion
- Read receipts
- Persistent storage (database)
- User authentication
