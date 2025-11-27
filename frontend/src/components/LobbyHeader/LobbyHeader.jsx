import React from "react";
import "./LobbyHeader.css";

const LobbyHeader = ({ room, handleLeaveRoom }) => {
  return (
    <div className="lobby-header">
      <button className="btn-back" onClick={handleLeaveRoom}>
        Leave Room
      </button>
      <p>Code: {room.roomCode}</p>
    </div>
  );
};

export default LobbyHeader;
