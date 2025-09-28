import React, { useEffect, useState } from "react";
import socket from "./socket";
import Scoreboard from "./components/Scoreboard";
import ImprovedLudoBoard from "./components/ImprovedLudoBoard";

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-lg border-4 border-gray-200">
          <h1 className="text-6xl font-bold text-gray-800 mb-8">🎲 LUDO GAME</h1>

          <div className="mb-8">
            <div className="text-8xl mb-6 animate-bounce">⏳</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Waiting for Players...</h2>

            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 mb-4">
              <p className="text-lg text-gray-700">
                Players in room: <span className="font-bold text-blue-600 text-2xl">{playerCount}/4</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">Need at least 2 players to start</p>
            </div>

            {/* Color indicators for traditional Ludo */}
            <div className="flex justify-center gap-3 mb-6">
              <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
              <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
              <div className="w-8 h-8 bg-yellow-500 rounded-full border-2 border-white shadow-lg"></div>
              <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-gray-100">
            <p className="text-sm text-gray-600 mb-3">🎮 Your Player Info:</p>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="font-mono text-sm text-purple-600 break-all">{playerId}</p>
            </div>
          </div>

          {playerCount >= 2 && (
            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
            >
              🚀 START GAME!
            </button>
          )}

          <div className="mt-8 bg-amber-50 rounded-xl p-4 border border-amber-200">
            <p className="text-sm text-amber-700 mb-2">📤 Invite Friends:</p>
            <p className="text-sm font-bold text-amber-800">Room ID: <span className="bg-white px-2 py-1 rounded border">{roomId}</span></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ImprovedLudoBoard roomId={roomId} playerId={playerId} />
      <div className="fixed top-4 right-4 z-10">
        <Scoreboard scores={scores} captures={captures} />
      </div>
    </div>
  );
}

export default App;
