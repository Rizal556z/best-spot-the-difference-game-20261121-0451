// shots.js — deterministic screenshot staging for Lantern Hunt.
// With ?shot=cover|play|level3 the game opens straight into a level with a
// few differences already found (marked by the game's own marker code), the
// rest still unfound, and the timer frozen — so a screenshot shows a real
// mid-game state: two pictures side by side, found markers, unfound
// differences, and the counter of how many remain. Without ?shot the game
// starts on its title screen as normal.
const SHOTS = {
  cover: { level: 0, found: ['lantern-color', 'stall-sign'], timeLeft: 118, score: 265 },
  play: { level: 1, found: ['koi-extra', 'lotus', 'bridge-lantern'], timeLeft: 96, score: 410 },
  level3: { level: 2, found: ['clock-hands', 'candle'], timeLeft: 74, score: 640 },
};

export function applyShotStaging(game) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot || !SHOTS[shot]) return;
  const stage = SHOTS[shot];
  game.startGame();
  game.startLevel(stage.level);
  game.debugMarkFound(stage.found);
  game.timeLeft = stage.timeLeft;
  game.score = stage.score;
  game.combo = stage.found.length;
  game.frozen = true;
  game.updateHud();
}
