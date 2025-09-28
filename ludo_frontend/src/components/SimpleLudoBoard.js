import React, { useState, useEffect } from "react";
import socket from "../socket";

const SimpleLudoBoard = ({ roomId, playerId }) => {
  const [gameState, setGameState] = useState({});
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [diceValue, setDiceValue] = useState(0);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    console.log("Setting up socket listeners...");

    socket.on("game:state", (state) => {
      console.log("Received game state:", state);
      setGameState(state);
      setCurrentPlayer(state.currentPlayer || "");
    });

    socket.on("game:dice", (data) => {
      console.log("Received dice result:", data);
      setDiceValue(data.value);
      setIsRolling(false);
    });

    socket.on("game:dice:ack", (result) => {
      console.log("Dice acknowledgment:", result);
      if (!result.success) {
        alert(result.reason || "Dice roll failed!");
      }
      setIsRolling(false);
    });

    socket.on("game:move:ack", (result) => {
      console.log("Move acknowledgment:", result);
      if (!result.success) {
        alert(result.reason || "Invalid move!");
      }
    });

    return () => {
      socket.off("game:state");
      socket.off("game:dice");
      socket.off("game:dice:ack");
      socket.off("game:move:ack");
    };
  }, []);

  const rollDice = () => {
    console.log("Roll dice clicked!");
    console.log("Current player:", currentPlayer);
    console.log("Player ID:", playerId);
    console.log("Is rolling:", isRolling);

    if (currentPlayer !== playerId) {
      alert("It's not your turn!");
      return;
    }

    if (isRolling) {
      alert("Already rolling!");
      return;
    }

    setIsRolling(true);
    const value = Math.floor(Math.random() * 6) + 1;

    console.log("Rolling dice with value:", value);

    socket.emit("game:dice", {
      roomId,
      playerId,
      value
    });

    // Fallback timeout in case server doesn't respond
    setTimeout(() => {
      if (isRolling) {
        console.log("Dice roll timeout, setting local value");
        setDiceValue(value);
        setIsRolling(false);
      }
    }, 3000);
  };

  const forceStartGame = () => {
    console.log("Force starting game...");
    socket.emit("game:start", { roomId });
  };

  const movePawn = (pawnIndex) => {
    if (currentPlayer !== playerId) {
      alert("It's not your turn!");
      return;
    }

    if (!diceValue) {
      alert("Roll the dice first!");
      return;
    }

    console.log("Moving pawn:", pawnIndex, "with dice:", diceValue);

    socket.emit("game:move", {
      roomId,
      playerId,
      pawnId: `${playerId}-${pawnIndex}`,
      diceValue
    });

    setDiceValue(0);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
      {/* Debug Info */}
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <h2 className="text-xl font-bold mb-2">🐛 Debug Info</h2>
        <div className="text-sm space-y-1">
          <p><strong>Your ID:</strong> {playerId}</p>
          <p><strong>Current Player:</strong> {currentPlayer || "None"}</p>
          <p><strong>Your Turn:</strong> {currentPlayer === playerId ? "✅ YES" : "❌ NO"}</p>
          <p><strong>Game Started:</strong> {gameState.started ? "✅ YES" : "❌ NO"}</p>
          <p><strong>Players:</strong> {Object.keys(gameState.players || {}).join(", ")}</p>
          <p><strong>Player Count:</strong> {Object.keys(gameState.players || {}).length}</p>
          <p><strong>Dice Value:</strong> {diceValue || "Not rolled"}</p>
          <p><strong>Is Rolling:</strong> {isRolling ? "🎲 Rolling..." : "🔥 Ready"}</p>
        </div>

        {!gameState.started && (
          <button
            onClick={forceStartGame}
            className="mt-3 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            🚀 Force Start Game
          </button>
        )}
      </div>

      {/* Game Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">🎲 Simple Ludo Test</h1>

        {/* Game Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-sm text-gray-600">Current Turn</p>
              <p className="text-2xl font-bold text-blue-600">
                {currentPlayer || "Waiting..."}
              </p>
              {currentPlayer === playerId && (
                <p className="text-green-600 font-bold">👈 YOUR TURN!</p>
              )}
            </div>

            {/* Dice Section */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={rollDice}
                disabled={currentPlayer !== playerId || isRolling}
                className={`w-24 h-24 border-4 border-gray-800 rounded-xl bg-white flex items-center justify-center text-5xl font-bold transition-all duration-300 shadow-lg ${
                  isRolling ? "animate-bounce bg-yellow-100" : ""
                } ${
                  currentPlayer === playerId && !isRolling
                    ? "hover:bg-gray-100 cursor-pointer hover:scale-105 bg-green-50"
                    : "opacity-50 cursor-not-allowed bg-gray-100"
                }`}
              >
                {isRolling ? "🎲" : diceValue || "🎲"}
              </button>

              <div className="text-center">
                {currentPlayer === playerId && !isRolling && (
                  <p className="text-green-600 font-bold text-sm">Click to Roll!</p>
                )}
                {isRolling && (
                  <p className="text-blue-600 font-bold text-sm">Rolling...</p>
                )}
                {diceValue > 0 && (
                  <p className="text-purple-600 font-bold">Rolled: {diceValue}</p>
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">Room ID</p>
              <p className="text-lg font-bold text-purple-600">{roomId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Pawn Controls */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4">Your Pawns</h3>
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((pawnIndex) => (
            <button
              key={pawnIndex}
              onClick={() => movePawn(pawnIndex)}
              disabled={currentPlayer !== playerId || !diceValue}
              className={`w-16 h-16 rounded-full border-4 border-blue-600 bg-blue-500 text-white font-bold text-lg transition-all duration-200 ${
                currentPlayer === playerId && diceValue > 0
                  ? "hover:scale-110 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              {pawnIndex}
            </button>
          ))}
        </div>
        {diceValue > 0 && currentPlayer === playerId && (
          <p className="text-green-600 font-bold text-center mt-2">
            Click a pawn to move it {diceValue} spaces!
          </p>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg p-4 shadow-lg max-w-md text-center">
        <h3 className="font-bold text-lg mb-2">How to Test:</h3>
        <ol className="text-sm text-gray-600 space-y-1 text-left">
          <li>1. Wait for your turn (see "YOUR TURN!" above)</li>
          <li>2. Click the big dice button to roll</li>
          <li>3. Click a pawn number to move it</li>
          <li>4. Check the debug info if something's wrong</li>
        </ol>
      </div>
    </div>
  );
};

export default SimpleLudoBoard;