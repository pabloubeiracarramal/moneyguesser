import { WebSocketServer } from 'ws';
import { parse } from 'url';
import { roomManager } from '../managers/RoomManager.js';

/**
 * Initialize WebSocket server
 */
export function initWebSocketServer(server) {
  const wss = new WebSocketServer({ 
    noServer: true
  });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url, true);
    
    // Check if path starts with /ws/rooms/
    if (pathname.startsWith('/ws/rooms/')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws, req) => {
    const { pathname, query } = parse(req.url, true);
    
    // Extract room code from path: /ws/rooms/{roomCode}
    const pathParts = pathname.split('/');
    const roomCode = pathParts[pathParts.length - 1];
    
    // Get token from query params
    const token = query.token;

    if (!roomCode || !token || roomCode === 'rooms') {
      ws.send(JSON.stringify({
        event: 'error',
        data: { code: 'INVALID_CONNECTION', message: 'Missing roomCode or token' }
      }));
      ws.close();
      return;
    }

    const room = roomManager.getRoom(roomCode);
    if (!room) {
      ws.send(JSON.stringify({
        event: 'error',
        data: { code: 'ROOM_NOT_FOUND', message: 'Room not found' }
      }));
      ws.close();
      return;
    }

    // Authenticate connection
    let isHost = false;
    let playerId = null;

    if (room.verifyHostToken(token)) {
      isHost = true;
    } else {
      const player = room.getPlayerByToken(token);
      if (player) {
        playerId = player.id;
      } else {
        ws.send(JSON.stringify({
          event: 'error',
          data: { code: 'INVALID_TOKEN', message: 'Invalid authentication token' }
        }));
        ws.close();
        return;
      }
    }

    // Add connection to room
    roomManager.addConnection(roomCode, ws, playerId, isHost);

    console.log(`WebSocket connected: ${roomCode} - ${isHost ? 'Host' : `Player ${playerId}`}`);

    // Send initial room state
    ws.send(JSON.stringify({
      event: 'room.updated',
      data: room.toJSON(room.status === 'reveal' || room.status === 'finished')
    }));

    // Handle messages from client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        handleClientMessage(ws, roomCode, data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        ws.send(JSON.stringify({
          event: 'error',
          data: { code: 'INVALID_MESSAGE', message: 'Invalid message format' }
        }));
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log(`WebSocket disconnected: ${roomCode} - ${isHost ? 'Host' : `Player ${playerId}`}`);
      roomManager.removeConnection(ws);

      // If player disconnected, notify others
      if (playerId && room) {
        const player = room.players.get(playerId);
        if (player) {
          roomManager.broadcast(roomCode, 'player.left', {
            playerId: player.id,
            displayName: player.displayName
          });
        }
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}

/**
 * Handle messages from client
 */
function handleClientMessage(ws, roomCode, data) {
  const { action, payload } = data;

  // Handle ping/pong for connection health
  if (action === 'ping') {
    ws.send(JSON.stringify({ event: 'pong', data: {} }));
    return;
  }

  // Add additional client-initiated actions here if needed
  console.log(`Received action from client: ${action}`, payload);
}
