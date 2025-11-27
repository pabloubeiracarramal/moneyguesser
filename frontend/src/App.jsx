import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { GameProvider } from './context/GameContext';
import PageTransition from './components/PageTransition/PageTransition';
import Landing from './pages/Landing';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import Results from './pages/Results';
import './App.css';
import { useEffect } from 'react';

function AnimatedRoutes() {
  const location = useLocation();
  const controls = useAnimationControls();

  useEffect(() => {
    const animateTransition = async () => {
      // Expand circle to cover screen
      await controls.start({
        scale: 3,
        transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }
      });
      // Contract circle to reveal new page
      await controls.start({
        scale: 0,
        transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }
      });
    };
    
    animateTransition();
  }, [location.pathname, controls]);

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes key={location.pathname} location={location}>
          <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
          <Route path="/lobby/:roomCode" element={<PageTransition><Lobby /></PageTransition>} />
          <Route path="/game/:roomCode" element={<PageTransition><GameRoom /></PageTransition>} />
          <Route path="/results/:roomCode" element={<PageTransition><Results /></PageTransition>} />
        </Routes>
      </AnimatePresence>

      {/* Animated circle overlay - persistent */}
      <motion.div
        className="page-transition-circle"
        initial={{ scale: 0 }}
        animate={controls}
      />
    </>
  );
}

function App() {
  return (
    <GameProvider>
      <Router>
        <div className="app">
          <AnimatedRoutes />
        </div>
      </Router>
    </GameProvider>
  );
}

export default App;
