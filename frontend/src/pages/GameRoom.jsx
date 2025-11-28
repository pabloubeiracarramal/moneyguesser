import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [showTransitionCircle, setShowTransitionCircle] = useState(false);
  const [isFinalRound, setIsFinalRound] = useState(false);
  const [showFinalMessage, setShowFinalMessage] = useState(false);

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
        setShowFinalMessage(true);
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
      setShowTransitionCircle(false);
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
      setShowTransitionCircle(false);
      
      // Check if this is the final round
      const isFinal = room && data.roundNumber >= room.totalRounds;
      setIsFinalRound(isFinal);
      
      // Show transition circle after 10 seconds
      if (!isFinal) {
        setTimeout(() => {
          setShowTransitionCircle(true);
        }, 10000);
      }
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

  // Calculate reveal phase data
  const myResult = revealData?.roundResults?.find(r => r.playerId === playerId);
  let myRank = null;
  if (myResult && revealData) {
    const sortedByTotal = [...(revealData.roundResults || [])].sort((a, b) => b.totalScore - a.totalScore);
    myRank = sortedByTotal.findIndex(r => r.playerId === playerId) + 1;
  }

  // Sort players by total score for leaderboard
  const leaderboardData = revealData?.leaderboard
    ? [...revealData.leaderboard].sort((a, b) => b.score - a.score)
    : [];

  return (
    <div className="game-room">
      <AnimatePresence>
        {showTransitionCircle && !isFinalRound && (
          <>
            <motion.div
              className="reveal-transition-circle"
              initial={{ scale: 0 }}
              animate={{ scale: 3 }}
              exit={{ scale: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.5,
                ease: [0.43, 0.13, 0.23, 0.96]
              }}
            />
            <motion.div
              className="leaderboard-overlay"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{
                duration: 0.4,
                delay: 0.3,
                ease: "easeOut"
              }}
            >
              <h2>Leaderboard</h2>
              <div className="leaderboard-list">
                {leaderboardData.map((player, index) => (
                  <motion.div
                    key={player.playerId}
                    className={`leaderboard-item-gm ${player.playerId === playerId ? 'current-player' : ''}`}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.5 + (index * 0.1)
                    }}
                  >
                    <div className="player-rank">#{index + 1}</div>
                    <div className="player-info">
                      <div className="player-name">{player.displayName}</div>
                    </div>
                    <div className="player-score">{player.score}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!room && (
        <div className="loading">Loading game...</div>
      )}

      {room && countdown !== null && (
        <div className="countdown-screen">
          <h1>Game Starting In</h1>
          <div className="countdown-number">{countdown}</div>
        </div>
      )}

      {room && countdown === null && revealData && (
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
            <>
              <div className="rank-card">
                <div className="rank-badge">#{myRank}</div>
                <div className="rank-text">of {revealData.roundResults.length} players</div>
              </div>
              
              <div className="my-result">
                <div className="result-guess">Your Guess: ${(myResult.guess / 100).toFixed(2)}</div>
                <div className="result-points">Points Earned: {myResult.points}</div>
                <div className="result-total">Total Score: {myResult.totalScore}</div>
              </div>
            </>
          )}
        </div>
      )}

      {room && countdown === null && !revealData && (
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
      )}
    </div>
  );
}
