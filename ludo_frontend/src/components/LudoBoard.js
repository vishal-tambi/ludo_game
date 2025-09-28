import React, { useState, useEffect } from "react";
import socket from "../socket";

const LudoBoard = ({ roomId, playerId }) => {
  const [gameState, setGameState] = useState({});
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [diceValue, setDiceValue] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedPawn, setSelectedPawn] = useState(null);

  const playerColors = {
    red: { bg: "bg-red-500", light: "bg-red-200", border: "border-red-600" },
    blue: { bg: "bg-blue-500", light: "bg-blue-200", border: "border-blue-600" },
    green: { bg: "bg-green-500", light: "bg-green-200", border: "border-green-600" },
    yellow: { bg: "bg-yellow-500", light: "bg-yellow-200", border: "border-yellow-600" }
  };

  useEffect(() => {
    socket.on("game:state", (state) => {
      setGameState(state);
      setCurrentPlayer(state.currentPlayer);
    });

    socket.on("game:dice", (value) => {
      setDiceValue(value);
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
    if (currentPlayer !== playerId || !diceValue || selectedPawn !== pawnId) {
      setSelectedPawn(pawnId);
      return;
    }

    socket.emit("game:move", {
      roomId,
      playerId,
      pawnId,
      diceValue
    });

    setDiceValue(0);
    setSelectedPawn(null);
  };

  const renderHomeArea = (color, position) => {
    const colorStyle = playerColors[color];
    const pawns = gameState.players?.[color]?.pawns || [];

    return (
      <div className={`w-24 h-24 ${colorStyle.bg} border-2 ${colorStyle.border} relative`}>
        <div className="absolute inset-1 bg-white rounded grid grid-cols-2 gap-1 p-1">
          {[0, 1, 2, 3].map((index) => {
            const pawn = pawns[index];
            const isHome = pawn?.position === "home";
            const isSelected = selectedPawn === `${color}-${index}`;

            return (
              <div
                key={index}
                className={`w-full h-full rounded-full border-2 ${colorStyle.border} cursor-pointer transition-all duration-200 ${
                  isHome
                    ? `${colorStyle.bg} hover:scale-110`
                    : "bg-gray-100"
                } ${isSelected ? "ring-4 ring-purple-400" : ""}`}
                onClick={() => isHome && movePawn(`${color}-${index}`)}
              >
                {isHome && (
                  <div className="w-full h-full rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-bold">
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

  const renderPathSquare = (index, isStarSquare = false, isSafeSquare = false, color = null) => {
    const pawnsHere = [];

    // Find pawns at this position
    Object.entries(gameState.players || {}).forEach(([playerColor, player]) => {
      player.pawns?.forEach((pawn, pawnIndex) => {
        if (pawn.position === index) {
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
        className={`w-8 h-8 border border-gray-400 ${bgColor} relative flex items-center justify-center`}
        key={index}
      >
        {isStarSquare && <span className="text-yellow-600 text-lg">★</span>}
        {pawnsHere.map((pawn, idx) => {
          const pawnColor = playerColors[pawn.color];
          const isSelected = selectedPawn === pawn.id;

          return (
            <div
              key={pawn.id}
              className={`absolute w-6 h-6 rounded-full ${pawnColor.bg} border-2 ${pawnColor.border} cursor-pointer transition-all duration-200 hover:scale-110 ${
                isSelected ? "ring-2 ring-purple-400" : ""
              }`}
              style={{
                left: `${2 + idx * 4}px`,
                top: `${2 + idx * 4}px`,
                zIndex: 10 + idx
              }}
              onClick={() => movePawn(pawn.id)}
            >
              <div className="w-full h-full rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-bold">
                {pawn.pawnIndex + 1}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWinningPath = (color) => {
    const colorStyle = playerColors[color];
    return (
      <div className="flex">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={`w-8 h-8 border border-gray-400 ${colorStyle.light} flex items-center justify-center`}
          >
            {index === 5 && <span className="text-2xl">🏆</span>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Game Status */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-2">🎲 Ludo Game</h2>
        <div className="flex items-center gap-4 justify-center">
          <p className="text-lg">
            Current Player: <span className="font-bold text-blue-600">{currentPlayer}</span>
          </p>

          {/* Dice */}
          <div className="flex items-center gap-2">
            <button
              onClick={rollDice}
              disabled={currentPlayer !== playerId || isRolling}
              className={`w-16 h-16 border-2 border-gray-800 rounded-lg bg-white flex items-center justify-center text-3xl font-bold transition-all duration-200 ${
                isRolling ? "animate-bounce" : ""
              } ${
                currentPlayer === playerId && !isRolling
                  ? "hover:bg-gray-100 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              {diceValue || "🎲"}
            </button>
            {diceValue > 0 && (
              <span className="text-sm text-gray-600">
                Roll: {diceValue}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ludo Board */}
      <div className="grid grid-cols-15 gap-0 border-4 border-gray-800 bg-white">
        {/* Top Row */}
        <div className="col-span-6 grid grid-cols-6">
          {[...Array(6)].map((_, i) => renderPathSquare(i, i === 1, false, i === 0 ? "red" : null))}
        </div>
        {renderHomeArea("red", "top-left")}
        <div className="col-span-3 grid grid-cols-3">
          {renderWinningPath("red")}
        </div>

        {/* Second Row */}
        <div className="col-span-6 grid grid-cols-6">
          {[...Array(6)].map((_, i) => renderPathSquare(6 + i, false, i === 0 || i === 5))}
        </div>
        <div className="w-24 h-8 bg-red-200 border border-gray-400"></div>
        <div className="col-span-3 grid grid-cols-3">
          {[...Array(3)].map((_, i) => renderPathSquare(12 + i, false, false, "red"))}
        </div>

        {/* Continue building the board... This is a simplified version */}
        {/* Middle sections would continue here with proper Ludo board layout */}

        {/* For now, let's show the other home areas */}
        <div className="col-span-15 grid grid-cols-3 gap-4 p-4">
          <div className="flex flex-col items-center gap-2">
            {renderHomeArea("blue", "bottom-left")}
            <span className="text-sm font-bold text-blue-600">Blue</span>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center text-2xl">
              🏠
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            {renderHomeArea("green", "bottom-right")}
            <span className="text-sm font-bold text-green-600">Green</span>
          </div>
        </div>
      </div>

      {/* Player Info */}
      <div className="text-center text-sm text-gray-600">
        Your ID: {playerId}
      </div>
    </div>
  );
};

export default LudoBoard;