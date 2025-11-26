import React from 'react';
import './PlayersInfoBar.css';

const PlayersInfoBar = ({ room }) => {
    return (
        <div className="players-info-bar">
          <span className="players-count">
            👥 {room.players.length} {room.players.length === 1 ? 'Player' : 'Players'} ({room.maxPlayers} max)
          </span>
          {room.players.length > 0 && (
            <span className="players-names">
              {room.players.map(p => p.displayName).join(', ')}
            </span>
          )}
        </div>
    );
};

export default PlayersInfoBar;