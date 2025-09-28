import React, { useState, useEffect } from "react";
import socket from "../socket";

const CompleteLudoBoard = ({ roomId, playerId }) => {
  const [gameState, setGameState] = useState({});
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [diceValue, setDiceValue] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedPawn, setSelectedPawn] = useState(null);

  const playerColors = {
    red: { bg: "bg-red-500", light: "bg-red-200", border: "border-red-600", text: "text-red-600" },
    blue: { bg: "bg-blue-500", light: "bg-blue-200", border: "border-blue-600", text: "text-blue-600" },
    green: { bg: "bg-green-500", light: "bg-green-200", border: "border-green-600", text: "text-green-600" },
    yellow: { bg: "bg-yellow-500", light: "bg-yellow-200", border: "border-yellow-600", text: "text-yellow-600" }
  };

  useEffect(() => {
    socket.on("game:state", (state) => {
      setGameState(state);
      setCurrentPlayer(state.currentPlayer || "");
    });

    socket.on("game:dice", (data) => {
      setDiceValue(data.value);
      setIsRolling(false);
    });

    socket.on("game:move:ack", (result) => {
      if (!result.success) {
        alert(result.message || "Invalid move!");
      }
      setSelectedPawn(null);
    });

    return () => {
      socket.off("game:state");
      socket.off("game:dice");
      socket.off("game:move:ack");
    };
  }, []);

  const rollDice = () => {
    if (currentPlayer !== playerId || isRolling) return;

    setIsRolling(true);
    const value = Math.floor(Math.random() * 6) + 1;
    setDiceValue(value);

    socket.emit("game:dice", {
      roomId,
      playerId,
      value
    });

    setTimeout(() => setIsRolling(false), 1000);
  };

  const movePawn = (pawnId) => {
    if (currentPlayer !== playerId || !diceValue) return;

    socket.emit("game:move", {
      roomId,
      playerId,
      pawnId,
      diceValue
    });

    setDiceValue(0);
    setSelectedPawn(null);
  };

  const renderHomeArea = (color) => {
    const colorStyle = playerColors[color];
    const pawns = gameState.players?.[color]?.pawns || [
      { position: "home" },
      { position: "home" },
      { position: "home" },
      { position: "home" }
    ];

    return (
      <div className={`w-36 h-36 ${colorStyle.bg} border-4 ${colorStyle.border} relative flex items-center justify-center`}>
        <div className="w-28 h-28 bg-white rounded-lg grid grid-cols-2 gap-2 p-2">
          {pawns.map((pawn, index) => {
            const isHome = pawn.position === "home";
            const pawnId = `${color}-${index}`;
            const isSelected = selectedPawn === pawnId;

            return (
              <div
                key={index}
                className={`w-full h-full rounded-full border-2 ${colorStyle.border} cursor-pointer transition-all duration-200 flex items-center justify-center ${
                  isHome ? `${colorStyle.bg} hover:scale-110` : "bg-gray-100"
                } ${isSelected ? "ring-4 ring-purple-400" : ""}`}
                onClick={() => isHome && movePawn(pawnId)}
              >
                {isHome && (
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPathSquare = (position, isStarSquare = false, isSafeSquare = false, color = null) => {
    const pawnsHere = [];

    // Find pawns at this position
    Object.entries(gameState.players || {}).forEach(([playerColor, player]) => {
      player.pawns?.forEach((pawn, pawnIndex) => {
        if (pawn.position === position) {
          pawnsHere.push({
            color: playerColor,
            id: `${playerColor}-${pawnIndex}`,
            pawnIndex
          });
        }
      });
    });

    let bgColor = "bg-white";
    if (color) bgColor = playerColors[color]?.light || "bg-white";
    if (isSafeSquare) bgColor = "bg-gray-200";
    if (isStarSquare) bgColor = "bg-yellow-200";

    return (
      <div
        className={`w-8 h-8 border border-gray-600 ${bgColor} relative flex items-center justify-center hover:bg-gray-50`}
      >
        {isStarSquare && <span className="text-yellow-600 text-xs">★</span>}
        {pawnsHere.map((pawn, idx) => {
          const pawnColor = playerColors[pawn.color];
          const isSelected = selectedPawn === pawn.id;

          return (
            <div
              key={pawn.id}
              className={`absolute w-6 h-6 rounded-full ${pawnColor.bg} border-2 ${pawnColor.border} cursor-pointer transition-all duration-200 hover:scale-110 ${
                isSelected ? "ring-2 ring-purple-400" : ""
              } flex items-center justify-center`}
              style={{
                left: `${1 + idx * 2}px`,
                top: `${1 + idx * 2}px`,
                zIndex: 10 + idx
              }}
              onClick={() => movePawn(pawn.id)}
            >
              <span className="text-white text-xs font-bold">{pawn.pawnIndex + 1}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWinningPath = (color, direction = "horizontal") => {
    const colorStyle = playerColors[color];
    const squares = [0, 1, 2, 3, 4, 5];

    return (
      <div className={`flex ${direction === "vertical" ? "flex-col" : "flex-row"}`}>
        {squares.map((index) => (
          <div
            key={index}
            className={`w-8 h-8 border border-gray-600 ${colorStyle.light} flex items-center justify-center`}
          >
            {index === 5 && <span className="text-lg">🏆</span>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
      {/* Game Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">🎲 Ludo Game</h1>

        {/* Game Status */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Current Turn</p>
              <p className="text-xl font-bold text-blue-600">{currentPlayer || "Waiting..."}</p>
            </div>

            {/* Dice Section */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={rollDice}
                disabled={currentPlayer !== playerId || isRolling}
                className={`w-20 h-20 border-4 border-gray-800 rounded-xl bg-white flex items-center justify-center text-4xl font-bold transition-all duration-300 shadow-lg ${
                  isRolling ? "animate-bounce bg-yellow-100" : ""
                } ${
                  currentPlayer === playerId && !isRolling
                    ? "hover:bg-gray-100 cursor-pointer hover:scale-105"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                {isRolling ? "🎲" : diceValue || "🎲"}
              </button>
              {diceValue > 0 && (
                <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                  Rolled: {diceValue}
                </span>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">Your ID</p>
              <p className="text-lg font-bold text-purple-600">{playerId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ludo Board */}
      <div className="bg-white p-8 rounded-2xl shadow-2xl border-4 border-gray-800">
        <div className="grid grid-cols-15 gap-0">
          {/* Top Section */}
          <div className="col-span-6 grid grid-cols-6 gap-0">
            {[0, 1, 2, 3, 4, 5].map((i) =>
              renderPathSquare(i, i === 1 || i === 8 || i === 13, i === 8, i === 0 ? "red" : null)
            )}
          </div>

          <div className="col-span-3 flex justify-center items-center">
            {renderWinningPath("blue", "horizontal")}
          </div>

          <div className="col-span-6 grid grid-cols-6 gap-0">
            {[6, 7, 8, 9, 10, 11].map((i) =>
              renderPathSquare(i, i === 9 || i === 14 || i === 22, i === 14, i === 11 ? "green" : null)
            )}
          </div>

          {/* Red Home Area */}
          <div className="col-span-6 flex justify-center items-center">
            {renderPathSquare(51, false, true)}
          </div>
          <div className="col-span-3 flex justify-center items-center">
            {renderHomeArea("red")}
          </div>
          <div className="col-span-6 flex justify-center items-center">
            {renderPathSquare(12)}
          </div>

          {/* Middle Row with Blue and Green paths */}
          <div className="col-span-6 flex justify-center items-center">
            {renderWinningPath("yellow", "vertical")}
          </div>
          <div className="col-span-3 bg-yellow-200 border-4 border-yellow-500 flex items-center justify-center">
            <div className="text-6xl">🏠</div>
          </div>
          <div className="col-span-6 flex justify-center items-center">
            {renderWinningPath("green", "vertical")}
          </div>

          {/* Yellow Home Area */}
          <div className="col-span-6 flex justify-center items-center">
            {renderPathSquare(25)}
          </div>
          <div className="col-span-3 flex justify-center items-center">
            {renderHomeArea("yellow")}
          </div>
          <div className="col-span-6 flex justify-center items-center">
            {renderPathSquare(38, false, true)}
          </div>

          {/* Bottom Section */}
          <div className="col-span-6 grid grid-cols-6 gap-0">
            {[24, 23, 22, 21, 20, 19].map((i) =>
              renderPathSquare(i, i === 22 || i === 27 || i === 35, i === 27, i === 19 ? "blue" : null)
            )}
          </div>

          <div className="col-span-3 flex justify-center items-center">
            {renderWinningPath("yellow", "horizontal")}
          </div>

          <div className="col-span-6 grid grid-cols-6 gap-0">
            {[18, 17, 16, 15, 14, 13].map((i) =>
              renderPathSquare(i, i === 14 || i === 35 || i === 40, i === 35, i === 13 ? "yellow" : null)
            )}
          </div>
        </div>
      </div>

      {/* Player Areas */}
      <div className="grid grid-cols-2 gap-8 mt-4">
        <div className="flex flex-col items-center gap-2">
          {renderHomeArea("blue")}
          <span className="text-lg font-bold text-blue-600">Blue Player</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          {renderHomeArea("green")}
          <span className="text-lg font-bold text-green-600">Green Player</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg p-4 shadow-lg max-w-md text-center">
        <h3 className="font-bold text-lg mb-2">How to Play:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Wait for your turn and roll the dice</li>
          <li>• Click on your pieces to move them</li>
          <li>• Get all 4 pieces to the center to win!</li>
          <li>• Roll 6 to get pieces out of home</li>
        </ul>
      </div>
    </div>
  );
};

export default CompleteLudoBoard;