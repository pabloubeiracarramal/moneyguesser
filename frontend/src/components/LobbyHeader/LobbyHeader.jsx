import React from 'react';
import './LobbyHeader.css';

const LobbyHeader = ({ room, isConnected }) => {
    return (
        <div className="lobby-header">
          <h1>Room Code: {room.roomCode}</h1>
          <div className="connection-status">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>
    );
};

export default LobbyHeader;