import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { getRoomState } from '../services/api';
import './Lobby.css';
import LobbyHeader from '../components/LobbyHeader/LobbyHeader';
import PlayersInfoBar from '../components/PlayersInfoBar/PlayersInfoBar';
import HostLobbyView from '../components/HostLobbyView/HostLobbyView';
import PlayerLobbyView from '../components/PlayerLobbyView/PlayerLobbyView';

export default function Lobby() {
  const { roomCode: urlRoomCode } = useParams();
  const navigate = useNavigate();
  const { roomCode, token, isHost, setRoomState } = useGame();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(null);

  const { isConnected } = useWebSocket(roomCode || urlRoomCode, token);

  // Fetch initial room state
  useEffect(() => {
    if (!roomCode && !urlRoomCode) {
      navigate('/');
      return;
    }

    // If accessed via URL but no token, redirect to landing with room code
    if (urlRoomCode && !token) {
      navigate(`/?join=${urlRoomCode}`);
      return;
    }

    fetchRoomState();
  }, [roomCode, urlRoomCode, token]);

  const fetchRoomState = async () => {
    try {
      const state = await getRoomState(roomCode || urlRoomCode);
      setRoom(state);
      setRoomState(state);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Listen for WebSocket events
  const ws = useWebSocket(roomCode || urlRoomCode, token);
  
  useEffect(() => {
    if (!ws) return;

    const unsubscribeRoomUpdated = ws.on('room.updated', (data) => {
      setRoom(data);
      setRoomState(data);
      
      // Navigate to game only when it becomes active (not during countdown)
      if (data.status === 'active') {
        navigate(`/game/${data.roomCode}`);
      }
    });

    const unsubscribeGameCountdown = ws.on('game.countdown', (data) => {
      setCountdown(data.seconds);
    });

    const unsubscribePlayerJoined = ws.on('player.joined', () => {
      fetchRoomState();
    });

    return () => {
      unsubscribeRoomUpdated();
      unsubscribeGameCountdown();
      unsubscribePlayerJoined();
    };
  }, [ws]);

  if (loading) {
    return (
      <div className="lobby">
        <div className="loading">Loading lobby...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="lobby">
        <div className="error-message">{error || 'Room not found'}</div>
      </div>
    );
  }

  // Show countdown screen when game is starting
  if (countdown !== null) {
    return (
      <div className="lobby">
        <div className="countdown-screen">
          <h1>Game Starting In</h1>
          <div className="countdown-number">{countdown}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby">
      <div className="lobby-container">
        <LobbyHeader room={room} isConnected={isConnected} />

        {error && <div className="error-message">{error}</div>}   

        {isHost ? (
          <HostLobbyView 
            room={room} 
            roomCode={roomCode} 
            token={token}
            onRoomUpdate={fetchRoomState}
          />
        ) : (
          <PlayerLobbyView room={room} />
        )}
      </div>
    </div>
  );
}
