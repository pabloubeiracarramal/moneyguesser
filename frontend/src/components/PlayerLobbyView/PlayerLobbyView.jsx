import './PlayerLobbyView.css';

export default function PlayerLobbyView({ room }) {
  return (
    <div className="player-lobby-view">
      <div className="player-waiting">
        <h2>Waiting for host...</h2>
        <p>The game will start soon!</p>
        <div className="waiting-animation">⏳</div>
      </div>
    </div>
  );
}
