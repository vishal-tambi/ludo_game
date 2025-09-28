import React, { useState, useEffect } from "react";
import socket from "../socket";

const ImprovedLudoBoard = ({ roomId, playerId }) => {
  const [gameState, setGameState] = useState({});
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [diceValue, setDiceValue] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [playerColors, setPlayerColors] = useState({});
  const [myColor, setMyColor] = useState("red");

  // Traditional Ludo colors
  const colors = {
    red: {
      bg: "bg-red-500",
      light: "bg-red-100",
      border: "border-red-600",
      text: "text-red-600",
      home: "bg-red-400",
      name: "Red"
    },
    green: {
      bg: "bg-green-500",
      light: "bg-green-100",
      border: "border-green-600",
      text: "text-green-600",
      home: "bg-green-400",
      name: "Green"
    },
    yellow: {
      bg: "bg-yellow-500",
      light: "bg-yellow-100",
      border: "border-yellow-600",
      text: "text-yellow-600",
      home: "bg-yellow-400",
      name: "Yellow"
    },
    blue: {
      bg: "bg-blue-500",
      light: "bg-blue-100",
      border: "border-blue-600",
      text: "text-blue-600",
      home: "bg-blue-400",
      name: "Blue"
    }
  };

  useEffect(() => {
    socket.on("game:state", (state) => {
      setGameState(state);
      setCurrentPlayer(state.currentPlayer || "");

      // Assign colors to players
      if (state.playerOrder && state.playerOrder.length > 0) {
        const colorKeys = ['red', 'green', 'yellow', 'blue'];
        const newPlayerColors = {};

        state.playerOrder.forEach((player, index) => {
          newPlayerColors[player] = colorKeys[index % 4];
        });

        setPlayerColors(newPlayerColors);
        if (newPlayerColors[playerId]) {
          setMyColor(newPlayerColors[playerId]);
        }
      }
    });

    socket.on("game:dice", (data) => {
      setDiceValue(data.value);
      setIsRolling(false);
    });

    socket.on("game:dice:ack", (result) => {
      if (!result.success) {
        alert(result.reason || "Dice roll failed!");
      }
      setIsRolling(false);
    });

    socket.on("game:move:ack", (result) => {
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
  }, [playerId]);

  const rollDice = () => {
    if (currentPlayer !== playerId || isRolling) return;

    setIsRolling(true);
    const value = Math.floor(Math.random() * 6) + 1;

    socket.emit("game:dice", {
      roomId,
      playerId,
      value
    });

    setTimeout(() => {
      if (isRolling) {
        setDiceValue(value);
        setIsRolling(false);
      }
    }, 3000);
  };

  const movePawn = (pawnIndex) => {
    if (currentPlayer !== playerId || !diceValue) return;

    socket.emit("game:move", {
      roomId,
      playerId,
      pawnId: `${playerId}-${pawnIndex}`,
      diceValue
    });

    setDiceValue(0);
  };

  const renderHomeArea = (color, position) => {
    const colorStyle = colors[color];
    const isMyHome = color === myColor;

    return (
      <div className={`relative ${getHomePositionClasses(position)}`}>
        <div className={`w-full h-full ${colorStyle.home} border-4 ${colorStyle.border} rounded-lg relative`}>
          {/* Home Area Label */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <span className={`${colorStyle.text} font-bold text-sm`}>
              {colorStyle.name}
              {isMyHome && " (YOU)"}
            </span>
          </div>

          {/* 2x2 Grid for pawns */}
          <div className="w-full h-full p-3 grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((pawnIndex) => (
              <div
                key={pawnIndex}
                className={`w-full h-full rounded-full ${colorStyle.bg} border-2 border-white cursor-pointer transition-transform hover:scale-110 flex items-center justify-center shadow-lg ${
                  isMyHome && currentPlayer === playerId && diceValue > 0 ? "animate-pulse" : ""
                }`}
                onClick={() => isMyHome && movePawn(pawnIndex)}
              >
                <div className="w-6 h-6 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-700">{pawnIndex + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getHomePositionClasses = (position) => {
    switch (position) {
      case 'top-left':
        return 'absolute top-0 left-0 w-36 h-36';
      case 'top-right':
        return 'absolute top-0 right-0 w-36 h-36';
      case 'bottom-left':
        return 'absolute bottom-0 left-0 w-36 h-36';
      case 'bottom-right':
        return 'absolute bottom-0 right-0 w-36 h-36';
      default:
        return '';
    }
  };

  const renderPathSquare = (index, isStart = false, isSafe = false, color = null) => {
    let bgClass = "bg-white";
    if (isStart && color) bgClass = colors[color].light;
    if (isSafe) bgClass = "bg-gray-200";

    return (
      <div
        key={index}
        className={`w-8 h-8 border border-gray-400 ${bgClass} relative flex items-center justify-center transition-colors hover:bg-gray-50`}
      >
        {isSafe && <span className="text-xs text-gray-600">★</span>}
        {isStart && color && (
          <div className={`w-6 h-6 ${colors[color].bg} rounded-full border border-white`}></div>
        )}
      </div>
    );
  };

  const renderWinningPath = (color, direction = "horizontal") => {
    const colorStyle = colors[color];

    return (
      <div className={`flex ${direction === "vertical" ? "flex-col" : "flex-row"}`}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={`w-8 h-8 border border-gray-400 ${colorStyle.light} flex items-center justify-center`}
          >
            {index === 5 && <span className="text-lg">🏆</span>}
          </div>
        ))}
      </div>
    );
  };

  const getCurrentPlayerInfo = () => {
    const currentColor = playerColors[currentPlayer];
    return currentColor ? colors[currentColor] : null;
  };

  const isMyTurn = currentPlayer === playerId;
  const currentPlayerInfo = getCurrentPlayerInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex flex-col items-center justify-center p-4">
      {/* Game Header */}
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">🎲 LUDO GAME</h1>

        {/* Current Turn Indicator */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4 border-4 border-gray-200">
          <div className="flex items-center justify-center gap-8">
            {/* Current Player */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Current Turn</p>
              {currentPlayerInfo ? (
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 ${currentPlayerInfo.bg} rounded-full border-2 border-white`}></div>
                  <span className={`text-2xl font-bold ${currentPlayerInfo.text}`}>
                    {currentPlayerInfo.name}
                  </span>
                </div>
              ) : (
                <span className="text-xl text-gray-500">Waiting...</span>
              )}
              {isMyTurn && (
                <p className="text-green-600 font-bold mt-1 animate-pulse">👈 YOUR TURN!</p>
              )}
            </div>

            {/* Dice Section */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={rollDice}
                disabled={!isMyTurn || isRolling}
                className={`w-20 h-20 rounded-2xl border-4 border-gray-800 bg-white flex items-center justify-center text-4xl font-bold transition-all duration-300 shadow-lg ${
                  isRolling ? "animate-bounce bg-yellow-100" : ""
                } ${
                  isMyTurn && !isRolling
                    ? "hover:bg-gray-100 cursor-pointer hover:scale-105 bg-green-50"
                    : "opacity-50 cursor-not-allowed bg-gray-100"
                }`}
              >
                {isRolling ? "🎲" : diceValue || "🎲"}
              </button>

              <div className="text-center">
                {isMyTurn && !isRolling && !diceValue && (
                  <p className="text-green-600 font-bold text-sm">Click to Roll!</p>
                )}
                {isRolling && (
                  <p className="text-blue-600 font-bold text-sm">Rolling...</p>
                )}
                {diceValue > 0 && (
                  <div className="bg-green-100 px-3 py-1 rounded-full">
                    <p className="text-green-700 font-bold text-sm">Rolled: {diceValue}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Your Color */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">You are</p>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 ${colors[myColor]?.bg || 'bg-red-500'} rounded-full border-2 border-white`}></div>
                <span className={`text-xl font-bold ${colors[myColor]?.text || 'text-red-600'}`}>
                  {colors[myColor]?.name || 'Red'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Ludo Board */}
      <div className="relative bg-white rounded-3xl shadow-2xl border-8 border-gray-800 p-8">
        <div className="w-96 h-96 relative">
          {/* Home Areas */}
          {renderHomeArea('red', 'top-left')}
          {renderHomeArea('green', 'top-right')}
          {renderHomeArea('yellow', 'bottom-left')}
          {renderHomeArea('blue', 'bottom-right')}

          {/* Board Paths */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Top Path */}
            <div className="absolute top-36 left-36 right-36 h-24 grid grid-cols-6 gap-0">
              {[0, 1, 2, 3, 4, 5].map((i) =>
                renderPathSquare(i, i === 1, i === 2, i === 1 ? 'green' : null)
              )}
            </div>

            {/* Right Path */}
            <div className="absolute top-36 right-12 bottom-36 w-24 grid grid-rows-6 gap-0">
              {[6, 7, 8, 9, 10, 11].map((i) =>
                renderPathSquare(i, i === 8, i === 9, i === 8 ? 'blue' : null)
              )}
            </div>

            {/* Bottom Path */}
            <div className="absolute bottom-36 left-36 right-36 h-24 grid grid-cols-6 gap-0">
              {[12, 13, 14, 15, 16, 17].map((i) =>
                renderPathSquare(17-i, i === 14, i === 15, i === 14 ? 'yellow' : null)
              )}
            </div>

            {/* Left Path */}
            <div className="absolute top-36 left-12 bottom-36 w-24 grid grid-rows-6 gap-0">
              {[18, 19, 20, 21, 22, 23].map((i) =>
                renderPathSquare(23-i, i === 21, i === 20, i === 21 ? 'red' : null)
              )}
            </div>

            {/* Center Cross - Winning Paths */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Horizontal winning paths */}
              <div className="absolute top-44 left-36 w-24">
                {renderWinningPath('red', 'horizontal')}
              </div>
              <div className="absolute top-44 right-36 w-24">
                {renderWinningPath('blue', 'horizontal')}
              </div>

              {/* Vertical winning paths */}
              <div className="absolute top-36 left-44 h-24">
                {renderWinningPath('green', 'vertical')}
              </div>
              <div className="absolute bottom-36 left-44 h-24">
                {renderWinningPath('yellow', 'vertical')}
              </div>

              {/* Center Home */}
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-200 to-orange-200 border-4 border-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-3xl">🏠</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Info */}
      <div className="mt-6 bg-white rounded-xl shadow-lg p-4 text-center max-w-md">
        <h3 className="font-bold text-lg mb-2">How to Play:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>🎲 Wait for your turn and roll the dice</li>
          <li>🔴 Click your colored pawns to move them</li>
          <li>🏆 Get all 4 pawns to the center to win!</li>
          <li>⭐ Land on star squares for safety</li>
        </ul>
      </div>
    </div>
  );
};

export default ImprovedLudoBoard;