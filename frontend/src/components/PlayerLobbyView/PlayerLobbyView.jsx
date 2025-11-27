import { motion } from 'framer-motion';
import './PlayerLobbyView.css';

export default function PlayerLobbyView({ room }) {
  return (
    <div className="player-lobby-view">
      <div className="player-waiting">
        <h2>Waiting for host...</h2>
        <p>The game will start soon!</p>
        <div className="money-animation">
          <svg width="120" height="130" viewBox="0 0 24 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path
              d="M12 22.9199C17.5228 22.9199 22 18.4428 22 12.9199C22 7.39707 17.5228 2.91992 12 2.91992C6.47715 2.91992 2 7.39707 2 12.9199C2 18.4428 6.47715 22.9199 12 22.9199Z"
              stroke="#efbc31"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: { duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
                opacity: { duration: 0.3 }
              }}
            />
            {/* Vertical line through the dollar sign */}
            <motion.path
              d="M12.0302 6.95996V18.8799"
              stroke="#efbc31"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: { duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 0.3 },
                opacity: { duration: 0.3, delay: 0.3 }
              }}
            />
            {/* S shape of the dollar sign - fully symmetrical */}
            <motion.path
              d="M 14.5 9.5 C 14 9 13 8.5 12 8.5 C 11 8.5 10 9 9.5 9.5 C 9 10 9 10.8 9.5 11.3 C 10 11.8 11 12.3 12 12.9 C 13 13.5 14 14 14.5 14.5 C 15 15 15 15.8 14.5 16.3 C 14 16.8 13 17.5 12 17.5 C 11 17.5 10 17 9.5 16.5"
              stroke="#efbc31"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: { duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 0.5 },
                opacity: { duration: 0.3, delay: 0.5 }
              }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
