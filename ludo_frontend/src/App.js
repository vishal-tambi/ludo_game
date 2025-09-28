import React, { useEffect, useState } from "react";
import socket from "./socket";
import Scoreboard from "./components/Scoreboard";
import SimpleLudoBoard from "./components/SimpleLudoBoard";

function App() {
  const [scores, setScores] = useState({});
  const [captures, setCaptures] = useState({});
  const [roomId] = useState("room1");
  const [playerId] = useState(() => "Player" + Math.floor(Math.random() * 10000) + "_" + Date.now());
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    socket.emit("game:join", { roomId, playerId, name: playerId });

    socket.on("game:scores", (data) => {
      setScores(data.playerScores);
      setCaptures(data.captures);
      setPlayerCount(Object.keys(data.playerScores).length);
    });

    socket.on("game:state", (state) => {
      setGameStarted(state.started || Object.keys(state.players || {}).length >= 2);
    });

    return () => {
      socket.off("game:scores");
      socket.off("game:state");
    };
  }, [roomId, playerId]);

  const startGame = () => {
    socket.emit("game:start", { roomId });
  };

  if (!gameStarted && playerCount < 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">🎲 Ludo Game</h1>
          <div className="mb-6">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Waiting for Players...</h2>
            <p className="text-gray-600">
              Players in room: <span className="font-bold text-blue-600">{playerCount}</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">Need at least 2 players to start</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Your Player ID:</p>
            <p className="font-mono font-bold text-purple-600">{playerId}</p>
          </div>

          {playerCount >= 2 && (
            <button
              onClick={startGame}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Start Game! 🚀
            </button>
          )}

          <div className="mt-6 text-xs text-gray-500">
            <p>Share this room ID with friends: <span className="font-bold">{roomId}</span></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SimpleLudoBoard roomId={roomId} playerId={playerId} />
      <div className="fixed top-4 right-4">
        <Scoreboard scores={scores} captures={captures} />
      </div>
    </div>
  );
}

export default App;
