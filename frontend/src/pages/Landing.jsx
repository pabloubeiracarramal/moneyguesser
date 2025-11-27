import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createRoom, joinRoom } from "../services/api";
import { useGame } from "../context/GameContext";
import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    setRoomCode,
    setToken,
    setIsHost,
    displayName,
    setDisplayName,
    setPlayerId,
  } = useGame();

  const [username, setUsername] = useState(displayName || "");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check for join code in URL parameters
  useEffect(() => {
    const joinParam = searchParams.get("join");
    if (joinParam) {
      setJoinCode(joinParam.toUpperCase());
    }
  }, [searchParams]);

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await createRoom(username.trim());

      setRoomCode(response.roomCode);
      setToken(response.hostToken);
      setIsHost(true);
      setDisplayName(username.trim());

      navigate(`/lobby/${response.roomCode}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!joinCode.trim()) {
      setError("Please enter room code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await joinRoom(
        joinCode.toUpperCase().trim(),
        username.trim()
      );

      setRoomCode(joinCode.toUpperCase().trim());
      setToken(response.playerToken);
      setIsHost(false);
      setDisplayName(username.trim());
      setPlayerId(response.player.id);

      navigate(`/lobby/${joinCode.toUpperCase().trim()}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      <div className="landing-container" style={{ maxWidth: "100%", width: "90vw" }}>
        <h1 className="landing-title">
          <pre
            className="ascii-art"
            style={{ fontSize: "1rem", lineHeight: "1.1", margin: "1rem 0", overflow: "auto" }}
          >
            {`
 __    __     ______     __   __     ______     __  __        ______     __  __     ______     ______     ______     ______     ______    
/\\ "-./  \\   /\\  __ \\   /\\ "-.\\ \\   /\\  ___\\   /\\ \\_\\ \\      /\\  ___\\   /\\ \\/\\ \\   /\\  ___\\   /\\  ___\\   /\\  ___\\   /\\  ___\\   /\\  == \\   
\\ \\ \\-./\\ \\  \\ \\ \\/\\ \\  \\ \\ \\-.  \\  \\ \\  __\\   \\ \\____ \\     \\ \\ \\__ \\  \\ \\ \\_\\ \\  \\ \\  __\\   \\ \\___  \\  \\ \\___  \\  \\ \\  __\\   \\ \\  __<   
 \\ \\_\\ \\ \\_\\  \\ \\_____\\  \\ \\_\\\\"\\_\\  \\ \\_____\\  \\/\\_____\\     \\ \\_____\\  \\ \\_____\\  \\ \\_____\\  \\/\\_____\\  \\/\\_____\\  \\ \\_____\\  \\ \\_\\ \\_\\ 
  \\/_/  \\/_/   \\/_____/   \\/_/ \\/_/   \\/_____/   \\/_____/      \\/_____/   \\/_____/   \\/_____/   \\/_____/   \\/_____/   \\/_____/   \\/_/ /_/ 
`}
          </pre>
        </h1>
        <p className="landing-subtitle">Guess the price, win the game!</p>

        <div className="landing-form">
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={24}
            className="input-name"
            disabled={loading}
          />

          {error && <div className="error-message">{error}</div>}

          <button
            className="btn btn-primary"
            onClick={handleCreateRoom}
            disabled={loading || !username.trim()}
          >
            {loading ? "Creating..." : "Create Room"}
          </button>

          <form onSubmit={handleJoinRoom} className="join-form">
            <h3>Join with Code</h3>

            <input
              type="text"
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="input-code"
              disabled={loading}
            />

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !username.trim() || !joinCode.trim()}
            >
              {loading ? "Joining..." : "Join Room"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
