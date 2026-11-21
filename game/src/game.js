// game.js — Lantern Hunt game state, input, timer, scoring and rendering.
// Two canvases show the same scene: the left panel is the original, the
// right panel has every difference applied. Clicking (or the keyboard
// reticle + Enter) on a difference in either panel marks it on both.
import { LEVELS, PANEL_W, PANEL_H, totalDifferences } from './levels.js';
import { drawScene, allDifferenceIds } from './scenes.js';
import { SoundBank } from './audio.js';
import { applyShotStaging } from './shots.js';

const $ = (id) => document.getElementById(id);

export class Game {
  constructor() {
    this.left = $('panel-left');
    this.right = $('panel-right');
    this.lctx = this.left.getContext('2d');
    this.rctx = this.right.getContext('2d');
    this.sounds = new SoundBank();
    this.screen = 'title'; // title | playing | levelDone | gameDone | timeUp
    this.levelIndex = 0;
    this.found = new Set();
    this.score = 0;
    this.combo = 0;
    this.mistakes = 0;
    this.clicks = 0;
    this.hintsLeft = 3;
    this.hintId = null;
    this.hintUntil = 0;
    this.timeLeft = 0;
    this.paused = false;
    this.frozen = false; // staged screenshots freeze the timer
    this.reticle = { panel: 'left', x: PANEL_W / 2, y: PANEL_H / 2, visible: false };
    this.floaters = [];
    this.misses = [];
    this.lastTick = 0;
    this.lastWholeSecond = -1;
    this.bindInput();
  }

  get level() {
    return LEVELS[this.levelIndex];
  }

  get foundCount() {
    return this.found.size;
  }

  get remaining() {
    return this.level.differences.length - this.found.size;
  }

  startGame() {
    this.score = 0;
    this.mistakes = 0;
    this.clicks = 0;
    this.levelIndex = 0;
    this.startLevel(0);
  }

  startLevel(index) {
    this.levelIndex = index;
    this.found = new Set();
    this.combo = 0;
    this.hintsLeft = 3;
    this.hintId = null;
    this.timeLeft = this.level.timeLimit;
    this.lastWholeSecond = -1;
    this.floaters = [];
    this.misses = [];
    this.paused = false;
    this.screen = 'playing';
    this.showOnly('hud');
    this.updateHud();
  }

  bindInput() {
    const clickAt = (canvas, ev) => {
      if (this.screen !== 'playing' || this.paused) return;
      this.sounds.ensure();
      const rect = canvas.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * PANEL_W;
      const y = ((ev.clientY - rect.top) / rect.height) * PANEL_H;
      this.trySpot(x, y);
    };
    this.left.addEventListener('click', (ev) => clickAt(this.left, ev));
    this.right.addEventListener('click', (ev) => clickAt(this.right, ev));
    document.addEventListener('keydown', (ev) => {
      if (this.screen === 'title' && (ev.key === 'Enter' || ev.key === ' ')) {
        ev.preventDefault();
        this.sounds.ensure();
        this.startGame();
        return;
      }
      if (ev.key === 'm' || ev.key === 'M') {
        this.toggleMute();
        return;
      }
      if (this.screen !== 'playing') {
        if ((ev.key === 'r' || ev.key === 'R') && this.screen !== 'title') this.startGame();
        if (ev.key === 'Enter' && this.screen === 'levelDone') this.nextLevel();
        if (ev.key === 'Enter' && (this.screen === 'gameDone' || this.screen === 'timeUp')) this.startGame();
        return;
      }
      if (ev.key === 'p' || ev.key === 'P' || ev.key === 'Escape') {
        this.togglePause();
        return;
      }
      if (this.paused) return;
      if (ev.key === 'h' || ev.key === 'H') {
        this.useHint();
        return;
      }
      const step = ev.shiftKey ? 24 : 10;
      const r = this.reticle;
      if (ev.key.startsWith('Arrow')) {
        ev.preventDefault();
        r.visible = true;
        if (ev.key === 'ArrowLeft') r.x -= step;
        if (ev.key === 'ArrowRight') r.x += step;
        if (ev.key === 'ArrowUp') r.y -= step;
        if (ev.key === 'ArrowDown') r.y += step;
        if (r.x < 0) {
          r.x = PANEL_W - 10;
          r.panel = r.panel === 'left' ? 'right' : 'left';
        }
        if (r.x > PANEL_W) {
          r.x = 10;
          r.panel = r.panel === 'left' ? 'right' : 'left';
        }
        r.y = Math.max(8, Math.min(PANEL_H - 8, r.y));
      }
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        r.visible = true;
        this.sounds.ensure();
        this.trySpot(r.x, r.y);
      }
    });
    $('btn-start').addEventListener('click', () => {
      this.sounds.ensure();
      this.startGame();
    });
    $('btn-next').addEventListener('click', () => this.nextLevel());
    $('btn-again').addEventListener('click', () => this.startGame());
    $('btn-retry').addEventListener('click', () => this.startGame());
    $('btn-hint').addEventListener('click', () => this.useHint());
    $('btn-pause').addEventListener('click', () => this.togglePause());
    $('btn-mute').addEventListener('click', () => this.toggleMute());
    $('btn-how').addEventListener('click', () => {
      $('howto').classList.toggle('open');
    });
  }

  toggleMute() {
    this.sounds.muted = !this.sounds.muted;
    $('btn-mute').textContent = this.sounds.muted ? '🔇 Muted' : '🔊 Sound';
  }

  togglePause() {
    if (this.screen !== 'playing') return;
    this.paused = !this.paused;
    $('btn-pause').textContent = this.paused ? '▶ Resume' : '⏸ Pause';
    $('pause-note').style.display = this.paused ? 'block' : 'none';
  }

  trySpot(x, y) {
    if (this.screen !== 'playing' || this.paused) return;
    this.clicks += 1;
    const diff = this.level.differences.find(
      (d) => !this.found.has(d.id) && Math.hypot(d.x - x, d.y - y) <= d.r + 6,
    );
    if (diff) {
      this.found.add(diff.id);
      this.combo += 1;
      const gained = 100 + (this.combo - 1) * 25 + Math.ceil(this.timeLeft / 10);
      this.score += gained;
      this.floaters.push({ x: diff.x, y: diff.y - 30, text: `+${gained} · ${diff.label}`, until: performance.now() + 1400 });
      if (this.hintId === diff.id) this.hintId = null;
      this.sounds.found();
      if (this.found.size === this.level.differences.length) {
        const bonus = Math.ceil(this.timeLeft) * 5;
        this.score += bonus;
        this.sounds.levelClear();
        if (this.levelIndex === LEVELS.length - 1) this.finishGame(bonus);
        else this.finishLevel(bonus);
      }
    } else {
      this.combo = 0;
      this.mistakes += 1;
      this.score = Math.max(0, this.score - 50);
      this.timeLeft = Math.max(0, this.timeLeft - 5);
      this.misses.push({ x, y, until: performance.now() + 900 });
      this.sounds.wrong();
      if (this.timeLeft <= 0) this.timeUp();
    }
    this.updateHud();
  }

  useHint() {
    if (this.screen !== 'playing' || this.paused || this.hintsLeft <= 0) return;
    const left = this.level.differences.filter((d) => !this.found.has(d.id));
    if (left.length === 0) return;
    this.hintsLeft -= 1;
    this.score = Math.max(0, this.score - 100);
    this.hintId = left[Math.floor(Math.random() * left.length)].id;
    this.hintUntil = performance.now() + 3000;
    this.sounds.hint();
    this.updateHud();
  }

  nextLevel() {
    this.startLevel(this.levelIndex + 1);
  }

  finishLevel(bonus) {
    this.screen = 'levelDone';
    $('leveldone-title').textContent = `${this.level.name} — complete!`;
    $('leveldone-detail').textContent =
      `You found all ${this.level.differences.length} differences · time bonus +${bonus} · ${this.mistakes} wrong clicks so far`;
    this.showOnly('leveldone');
    this.updateHud();
  }

  finishGame(bonus) {
    this.screen = 'gameDone';
    const accuracy = this.clicks === 0 ? 100 : Math.round(((this.clicks - this.mistakes) / this.clicks) * 100);
    $('final-score').textContent = this.score;
    $('final-detail').textContent =
      `${totalDifferences()} differences across 3 scenes · ${this.mistakes} wrong clicks · ${accuracy}% accuracy · time bonus +${bonus}`;
    this.sounds.gameClear();
    this.showOnly('gamedone');
    this.updateHud();
  }

  timeUp() {
    this.screen = 'timeUp';
    $('timeup-detail').textContent =
      `Time ran out on ${this.level.name} — you had found ${this.foundCount} of ${this.level.differences.length}.`;
    this.showOnly('timeup');
    this.updateHud();
  }

  showOnly(id) {
    for (const panel of ['title', 'hud', 'leveldone', 'gamedone', 'timeup']) {
      $(`screen-${panel}`).classList.toggle('hidden', panel !== id);
    }
    $('pause-note').style.display = 'none';
    if (id !== 'hud') $('btn-pause').textContent = '⏸ Pause';
  }

  updateHud() {
    $('hud-level').textContent = `Level ${this.levelIndex + 1}/3 · ${this.level.name}`;
    $('hud-counter').textContent = `Found ${this.foundCount}/${this.level.differences.length} · ${this.remaining} left`;
    $('hud-score').textContent = `Score ${this.score}`;
    $('hud-time').textContent = `⏱ ${Math.max(0, Math.ceil(this.timeLeft))}s`;
    $('hud-time').classList.toggle('urgent', this.timeLeft <= 20 && this.screen === 'playing');
    $('hud-hints').textContent = `💡 ${this.hintsLeft}`;
    $('hud-combo').textContent = this.combo >= 2 ? `🔥 Combo x${this.combo}` : '';
    $('hud-found-list').textContent = this.level.differences
      .map((d) => (this.found.has(d.id) ? `✓ ${d.label}` : `· ${d.label}`))
      .join('   ');
  }

  drawMarkers(ctx, now) {
    for (const d of this.level.differences) {
      if (!this.found.has(d.id)) continue;
      const pulse = 1 + Math.sin(now / 300) * 0.06;
      ctx.strokeStyle = '#ffd23e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 210, 62, 0.45)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(d.x, d.y, (d.r + 7) * pulse, 0, Math.PI * 2);
      ctx.stroke();
      const idx = this.level.differences.indexOf(d) + 1;
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath();
      ctx.arc(d.x, d.y - d.r - 10, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#241a33';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(idx), d.x, d.y - d.r - 10);
    }
    if (this.hintId && now < this.hintUntil) {
      const d = this.level.differences.find((x) => x.id === this.hintId);
      if (d) {
        const pulse = 1 + Math.sin(now / 150) * 0.18;
        ctx.strokeStyle = '#7ee0ff';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * pulse + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    for (const m of this.misses) {
      if (now > m.until) continue;
      ctx.strokeStyle = '#ff5a5a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(m.x - 12, m.y - 12);
      ctx.lineTo(m.x + 12, m.y + 12);
      ctx.moveTo(m.x + 12, m.y - 12);
      ctx.lineTo(m.x - 12, m.y + 12);
      ctx.stroke();
    }
    this.floaters = this.floaters.filter((f) => now < f.until);
    for (const f of this.floaters) {
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 17px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.text, f.x, f.y);
    }
    if (this.reticle.visible && this.screen === 'playing') {
      const ctxFor = this.reticle.panel === 'left' ? this.lctx : this.rctx;
      if (ctx === ctxFor) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.reticle.x, this.reticle.y, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.reticle.x - 20, this.reticle.y);
        ctx.lineTo(this.reticle.x - 8, this.reticle.y);
        ctx.moveTo(this.reticle.x + 8, this.reticle.y);
        ctx.lineTo(this.reticle.x + 20, this.reticle.y);
        ctx.moveTo(this.reticle.x, this.reticle.y - 20);
        ctx.lineTo(this.reticle.x, this.reticle.y - 8);
        ctx.moveTo(this.reticle.x, this.reticle.y + 8);
        ctx.lineTo(this.reticle.x, this.reticle.y + 20);
        ctx.stroke();
      }
    }
  }

  frame(now) {
    const dt = this.lastTick ? Math.min(0.25, (now - this.lastTick) / 1000) : 0;
    this.lastTick = now;
    if (this.screen === 'playing' && !this.paused && !this.frozen) {
      this.timeLeft -= dt;
      const whole = Math.ceil(this.timeLeft);
      if (whole !== this.lastWholeSecond) {
        this.lastWholeSecond = whole;
        if (whole <= 10 && whole > 0) this.sounds.tick();
        this.updateHud();
      }
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.timeUp();
      }
    }
    const changed = allDifferenceIds(this.level);
    const empty = new Set();
    drawScene(this.lctx, this.level, empty);
    drawScene(this.rctx, this.level, changed);
    this.drawMarkers(this.lctx, now);
    this.drawMarkers(this.rctx, now);
    requestAnimationFrame((t) => this.frame(t));
  }

  // Test/staging hook: mark differences as found without a click.
  debugMarkFound(ids) {
    for (const id of ids) this.found.add(id);
    this.updateHud();
  }
}

export function bootGame() {
  const game = new Game();
  window.__lanternHunt = game;
  applyShotStaging(game);
  requestAnimationFrame((t) => game.frame(t));
  return game;
}
