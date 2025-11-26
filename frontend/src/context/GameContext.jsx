import { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export function GameProvider({ children }) {
  const [roomCode, setRoomCode] = useState('');
  const [token, setToken] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [roomState, setRoomState] = useState(null);

  const value = {
    roomCode,
    setRoomCode,
    token,
    setToken,
    isHost,
    setIsHost,
    displayName,
    setDisplayName,
    playerId,
    setPlayerId,
    roomState,
    setRoomState,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
