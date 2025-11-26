import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Landing from './pages/Landing';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import Results from './pages/Results';
import './App.css';

function App() {
  return (
    <GameProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/lobby/:roomCode" element={<Lobby />} />
            <Route path="/game/:roomCode" element={<GameRoom />} />
            <Route path="/results/:roomCode" element={<Results />} />
          </Routes>
        </div>
      </Router>
    </GameProvider>
  );
}

export default App;
