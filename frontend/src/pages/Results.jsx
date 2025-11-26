import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useGame } from '../context/GameContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { getLeaderboard } from '../services/api';
import './Results.css';

export default function Results() {
  const { roomCode: urlRoomCode } = useParams();
  const navigate = useNavigate();
  const { roomCode, token, playerId } = useGame();
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [showConfetti, setShowConfetti] = useState(true);

  const ws = useWebSocket(roomCode || urlRoomCode, token);

  useEffect(() => {
    if (!roomCode && !urlRoomCode) {
      navigate('/');
      return;
    }

    fetchLeaderboard();
  }, [roomCode, urlRoomCode]);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 35000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ws) return;

    const unsubscribeGameFinished = ws.on('game.finished', (data) => {
      if (data.finalLeaderboard) {
        setLeaderboard(data.finalLeaderboard);
      }
    });

    return () => {
      unsubscribeGameFinished();
    };
  }, [ws]);

  const fetchLeaderboard = async () => {
    try {
      const data = await getLeaderboard(roomCode || urlRoomCode);
      setLeaderboard(data.leaderboard);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePlayAgain = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="results">
        <div className="loading">Loading results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const winner = leaderboard[0];
  const isWinner = winner && winner.playerId === playerId;
  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="results">
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={300}
        />
      )}
      <div className="results-container">
        <h1 className="results-title">🏆 Game Over!</h1>

        {/* Podium for top 3 */}
        <div className="podium">
          {top3.length >= 2 && (
            <div className="podium-place second">
              <div className="podium-rank">🥈</div>
              <div className="podium-name">{top3[1].displayName}</div>
              <div className="podium-score">{top3[1].score} pts</div>
              <div className="podium-box podium-box-2">2nd</div>
            </div>
          )}

          {top3.length >= 1 && (
            <div className="podium-place first">
              <div className="podium-rank">🥇</div>
              <div className="podium-name">{top3[0].displayName}</div>
              <div className="podium-score">{top3[0].score} pts</div>
              <div className="podium-box podium-box-1">1st</div>
            </div>
          )}

          {top3.length >= 3 && (
            <div className="podium-place third">
              <div className="podium-rank">🥉</div>
              <div className="podium-name">{top3[2].displayName}</div>
              <div className="podium-score">{top3[2].score} pts</div>
              <div className="podium-box podium-box-3">3rd</div>
            </div>
          )}
        </div>

        {/* Full leaderboard */}
        <div className="full-leaderboard">
          <h2>Final Standings</h2>
          <div className="leaderboard-list">
            {leaderboard.map((entry) => (
              <div
                key={entry.playerId}
                className={`leaderboard-item ${entry.playerId === playerId ? 'highlight' : ''}`}
              >
                <div className="leaderboard-rank">
                  {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                </div>
                <div className="leaderboard-name">
                  {entry.displayName}
                  {entry.playerId === playerId && ' (You)'}
                </div>
                <div className="leaderboard-score">{entry.score} pts</div>
              </div>
            ))}
          </div>
        </div>

        {isWinner && (
          <div className="winner-message">
            🎉 Congratulations! You won! 🎉
          </div>
        )}

        <button className="btn btn-primary btn-play-again" onClick={handlePlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
