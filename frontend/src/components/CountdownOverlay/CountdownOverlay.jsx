import { motion, AnimatePresence } from 'framer-motion';
import './CountdownOverlay.css';

export default function CountdownOverlay({ countdown, onComplete }) {
  return (
    <AnimatePresence>
      {countdown !== null && countdown >= 0 && (
        <>
          {/* Yellow circle that expands and contracts */}
          <motion.div
            className="countdown-overlay-circle"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 10 }}
            transition={{
              duration: 0.8,
              ease: [0.43, 0.13, 0.23, 0.96]
            }}
          />

          {/* Countdown number on top */}
          <motion.div
            className="countdown-overlay-content"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{
              duration: 0.4,
              ease: "easeOut"
            }}
          >
            <motion.div
              className="countdown-overlay-number"
              key={countdown}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.3,
                ease: "easeOut"
              }}
            >
              {countdown > 0 ? countdown : 'GO!'}
            </motion.div>
            <motion.div
              className="countdown-overlay-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2,
                duration: 0.4
              }}
            >
              Get Ready!
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
