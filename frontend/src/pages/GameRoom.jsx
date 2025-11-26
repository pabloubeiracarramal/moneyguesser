import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { submitGuess, getRoomState } from '../services/api';
import './GameRoom.css';

export default function GameRoom() {
  const { roomCode: urlRoomCode } = useParams();
  const navigate = useNavigate();
  const { roomCode, token, isHost, playerId } = useGame();
  
  const [room, setRoom] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [roundCountdown, setRoundCountdown] = useState(null);
  const [guess, setGuess] = useState('');
  const [hasGuessed, setHasGuessed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [revealData, setRevealData] = useState(null);

  const ws = useWebSocket(roomCode || urlRoomCode, token);

  // Fetch initial room state
  useEffect(() => {
    if (!roomCode && !urlRoomCode) {
      navigate('/');
      return;
    }

    fetchRoomState();
  }, [roomCode, urlRoomCode]);

  const fetchRoomState = async () => {
    try {
      const state = await getRoomState(roomCode || urlRoomCode);
      setRoom(state);
    } catch (err) {
      setError(err.message);
    }
  };

  // Listen for WebSocket events
  useEffect(() => {
    if (!ws) return;

    const unsubscribeRoomUpdated = ws.on('room.updated', (data) => {
      setRoom(data);
      
      // Reset guess when new round starts
      if (data.status === 'active') {
        setHasGuessed(false);
        setGuess('');
        setRevealData(null);
      }

      // Navigate to results when game finishes
      if (data.status === 'finished') {
        navigate(`/results/${data.roomCode}`);
      }
    });

    const unsubscribeGameCountdown = ws.on('game.countdown', (data) => {
      setCountdown(data.seconds);
    });

    const unsubscribeRoundStarted = ws.on('round.started', (data) => {
      console.log('Round started:', data);
      setCountdown(null);
      setRoundCountdown(data.durationSeconds);
      setHasGuessed(false);
      setGuess('');
      setRevealData(null);
    });

    const unsubscribeRoundCountdown = ws.on('round.countdown', (data) => {
      setRoundCountdown(data.remainingSeconds);
    });

    const unsubscribeGuessAck = ws.on('guess.ack', () => {
      setHasGuessed(true);
    });

    const unsubscribeRoundReveal = ws.on('round.reveal', (data) => {
      setRevealData(data);
      setRoundCountdown(null);
    });

    return () => {
      unsubscribeRoomUpdated();
      unsubscribeGameCountdown();
      unsubscribeRoundStarted();
      unsubscribeRoundCountdown();
      unsubscribeGuessAck();
      unsubscribeRoundReveal();
    };
  }, [ws]);

  const handleSubmitGuess = async (e) => {
    e.preventDefault();
    
    if (isHost) return;

    if (!guess || parseFloat(guess) < 0) {
      setError('Please enter a valid price');
      return;
    }

    const priceCents = Math.round(parseFloat(guess) * 100);

    setSubmitting(true);
    setError('');

    try {
      await submitGuess(roomCode, room.roundNumber, token, priceCents);
      setHasGuessed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!room) {
    return (
      <div className="game-room">
        <div className="loading">Loading game...</div>
      </div>
    );
  }

  // Show game countdown
  if (countdown !== null) {
    return (
      <div className="game-room">
        <div className="countdown-screen">
          <h1>Game Starting In</h1>
          <div className="countdown-number">{countdown}</div>
        </div>
      </div>
    );
  }

  // Show reveal phase
  if (revealData) {
    const myResult = revealData.roundResults?.find(r => r.playerId === playerId);
    
    return (
      <div className="game-room">
        <div className="reveal-screen">
          <h2>Round {revealData.roundNumber} Results</h2>
          
          {room.currentItem && (
            <div className="reveal-item">
              <img src={room.currentItem.imageUrl} alt={room.currentItem.label} />
              <h3>{room.currentItem.label}</h3>
              <div className="correct-price">
                Correct Price: ${(revealData.correctPriceCents / 100).toFixed(2)}
              </div>
            </div>
          )}

          {!isHost && myResult && (
            <div className="my-result">
              <div className="result-guess">Your Guess: ${(myResult.guess / 100).toFixed(2)}</div>
              <div className="result-points">Points Earned: {myResult.points}</div>
              <div className="result-total">Total Score: {myResult.totalScore}</div>
            </div>
          )}

          <div className="mini-leaderboard">
            <h3>Current Standings</h3>
            {revealData.leaderboard?.slice(0, 3).map((entry, index) => (
              <div key={entry.playerId} className="leaderboard-entry">
                <span className="rank">#{index + 1}</span>
                <span className="name">{entry.displayName}</span>
                <span className="score">{entry.score} pts</span>
              </div>
            ))}
          </div>

          <div className="next-round-message">
            {room.roundNumber < room.totalRounds ? 'Next round starting soon...' : 'Final results coming up!'}
          </div>
        </div>
      </div>
    );
  }

  // Show active round
  return (
    <div className="game-room">
      <div className="game-container">
        <div className="game-header">
          <div className="round-info">
            Round {room.roundNumber} / {room.totalRounds}
          </div>
          {roundCountdown !== null && (
            <div className="timer">
              ⏱️ {roundCountdown}s
            </div>
          )}
        </div>

        {room.currentItem && (
          <div className="item-display">
            <img
              src={room.currentItem.imageUrl}
              alt={room.currentItem.label}
              className="item-image"
            />
            <h2 className="item-label">{room.currentItem.label}</h2>
          </div>
        )}

        {isHost ? (
          <div className="host-message">
            <p>👀 You are the host - players are guessing!</p>
            <p>Players: {room.players.length}</p>
          </div>
        ) : (
          <div className="guess-section">
            {hasGuessed ? (
              <div className="guess-submitted">
                <h3>✅ Guess Submitted!</h3>
                <p>Your guess: ${(parseFloat(guess)).toFixed(2)}</p>
                <p>Waiting for round to end...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitGuess} className="guess-form">
                <h3>What's your guess?</h3>
                
                <div className="price-input-wrapper">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    disabled={submitting}
                    className="price-input"
                    autoFocus
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !guess}
                >
                  {submitting ? 'Submitting...' : 'Submit Guess'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
