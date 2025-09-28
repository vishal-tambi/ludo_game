import React from "react";

const Scoreboard = ({ scores, captures }) => {
  return (
    <div className="bg-gray-800 text-white p-4 rounded-xl shadow-lg w-80">
      <h2 className="text-xl font-bold mb-2 text-center">Live Scoreboard</h2>
      {Object.keys(scores).length === 0 && (
        <p className="text-gray-400 text-center">Waiting for players...</p>
      )}
      <ul>
        {Object.entries(scores).map(([playerId, score]) => (
          <li
            key={playerId}
            className="flex justify-between border-b border-gray-700 py-1"
          >
            <span>
              {playerId} <span className="text-sm text-gray-400">(Captures: {captures[playerId] || 0})</span>
            </span>
            <span className="font-bold">{score} pts</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Scoreboard;
