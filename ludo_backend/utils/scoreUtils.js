function applyProgress(pawn, diceValue) {
  pawn.score += diceValue;
}

function applyCapture(room, striker, victim) {
  const gained = victim.score;
  striker.score += gained;
  victim.score = 0;
  victim.pos = "BASE";

  // Update scores of players
  room.playerScores[striker.ownerId] += gained;
  room.playerScores[victim.ownerId] -= gained;
}

module.exports = { applyProgress, applyCapture };
