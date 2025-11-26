import { useEffect, useRef, useState } from 'react';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

/**
 * Custom hook for WebSocket connection
 */
export function useWebSocket(roomCode, token) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const listenersRef = useRef({});

  useEffect(() => {
    if (!roomCode || !token) return;

    const ws = new WebSocket(`${WS_BASE_URL}/ws/rooms/${roomCode}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message:', message);
        setLastMessage(message);

        // Call registered listeners for this event
        const listeners = listenersRef.current[message.event] || [];
        listeners.forEach(listener => listener(message.data));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    // Ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [roomCode, token]);

  /**
   * Register an event listener
   */
  const on = (event, callback) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }
    listenersRef.current[event].push(callback);

    // Return cleanup function
    return () => {
      listenersRef.current[event] = listenersRef.current[event].filter(
        cb => cb !== callback
      );
    };
  };

  /**
   * Send a message through WebSocket
   */
  const send = (action, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, payload }));
    }
  };

  return {
    isConnected,
    lastMessage,
    on,
    send,
  };
}
