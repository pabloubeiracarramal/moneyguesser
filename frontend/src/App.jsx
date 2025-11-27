import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { GameProvider } from './context/GameContext';
import PageTransition from './components/PageTransition/PageTransition';
import Landing from './pages/Landing';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import Results from './pages/Results';
import './App.css';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/lobby/:roomCode" element={<PageTransition><Lobby /></PageTransition>} />
        <Route path="/game/:roomCode" element={<PageTransition><GameRoom /></PageTransition>} />
        <Route path="/results/:roomCode" element={<PageTransition><Results /></PageTransition>} />
      </Routes>
    </AnimatePresence>
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
