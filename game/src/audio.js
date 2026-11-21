// audio.js — all sound in Lantern Hunt is synthesized with WebAudio: no
// audio files, no network. Each effect is a short envelope of oscillators.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  tone(freq, start, dur, type = 'sine', vol = 0.16) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  found() {
    this.tone(660, 0, 0.14, 'sine', 0.18);
    this.tone(880, 0.09, 0.18, 'sine', 0.18);
    this.tone(1320, 0.18, 0.22, 'sine', 0.12);
  }

  wrong() {
    this.tone(160, 0, 0.22, 'sawtooth', 0.1);
    this.tone(110, 0.05, 0.25, 'sawtooth', 0.08);
  }

  hint() {
    this.tone(520, 0, 0.12, 'triangle', 0.12);
    this.tone(780, 0.1, 0.16, 'triangle', 0.12);
  }

  levelClear() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.11, 0.22, 'triangle', 0.16));
  }

  gameClear() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, i * 0.12, 0.3, 'triangle', 0.16));
  }

  tick() {
    this.tone(980, 0, 0.06, 'square', 0.05);
  }
}
