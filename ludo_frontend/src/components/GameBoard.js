import React from "react";
import socket from "../socket";

const GameBoard = ({ roomId, playerId }) => {
  const makeMove = (pawnId) => {
    const diceValue = Math.floor(Math.random() * 6) + 1;

    socket.emit("game:move", {
      roomId,
      playerId,
      pawnId,
      diceValue,
      targetPos: `pos-${diceValue}`, // dummy position
    });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md w-80 mt-4">
      <h2 className="text-xl font-bold text-center mb-2">Game Board</h2>
      <p className="text-center text-gray-600">
        Click below to simulate a pawn move
      </p>
      <div className="flex justify-center gap-2 mt-3">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => makeMove(`${playerId}-p${n}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md shadow-md"
          >
            Move Pawn {n}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
