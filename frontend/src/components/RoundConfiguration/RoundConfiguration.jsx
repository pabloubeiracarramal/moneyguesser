import './RoundConfiguration.css';

export default function RoundConfiguration({ 
  roundDuration, 
  onRoundDurationChange, 
  totalRounds, 
  playersCount,
  localItemsCount,
  onStartGame,
  loading,
  error 
}) {
  return (
    <div className="round-configuration">
      <div className="config-row">
        <div className="config-item">
          <label htmlFor="roundDuration">Round Duration</label>
          <div className="input-with-unit">
            <input
              id="roundDuration"
              type="number"
              min="10"
              max="120"
              value={roundDuration}
              onChange={(e) => onRoundDurationChange(Number(e.target.value))}
              disabled={loading}
            />
            <span className="unit">seconds</span>
          </div>
        </div>

        <div className="config-item game-info">
          <div className="info-label">Total Rounds</div>
          <div className="info-value">{(totalRounds || 0) + (localItemsCount || 0)}</div>
        </div>

        <div className="config-item game-info">
          <div className="info-label">Players</div>
          <div className="info-value">{playersCount || 0}</div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        className="btn btn-start-game"
        onClick={onStartGame}
        disabled={loading || (totalRounds === 0 && localItemsCount === 0)}
      >
        {loading ? '🔄 Starting...' : '🚀 Start Game'}
      </button>
    </div>
  );
}
