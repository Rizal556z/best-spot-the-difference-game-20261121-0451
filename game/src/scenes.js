// scenes.js — procedural art for Lantern Hunt. Every picture is drawn with
// canvas 2D shapes coded here: no image files, no copied art. drawScene draws
// one panel of a level; `changed` is the set of difference ids applied to
// that panel (empty for the left picture, all of them for the right one).
import { PANEL_W, PANEL_H } from './levels.js';

function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function poly(ctx, points, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function text(ctx, s, x, y, size, fill, font = 'bold') {
  ctx.fillStyle = fill;
  ctx.font = `${font} ${size}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function stars(ctx, seed) {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < 40; i++) {
    const x = rnd() * PANEL_W;
    const y = rnd() * 170;
    const r = 0.8 + rnd() * 1.6;
    ctx.globalAlpha = 0.35 + rnd() * 0.6;
    circle(ctx, x, y, r, '#fff7d6');
  }
  ctx.globalAlpha = 1;
}

function paperLantern(ctx, x, y, color, glow) {
  if (glow) {
    const g = ctx.createRadialGradient(x, y, 4, x, y, 46);
    g.addColorStop(0, 'rgba(255, 214, 120, 0.55)');
    g.addColorStop(1, 'rgba(255, 214, 120, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 46, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 34);
  ctx.lineTo(x, y - 22);
  ctx.stroke();
  ellipse(ctx, x, y, 20, 26, color);
  ctx.strokeStyle = 'rgba(90, 58, 26, 0.7)';
  ctx.lineWidth = 1.5;
  for (const dy of [-14, 0, 14]) {
    ctx.beginPath();
    ctx.ellipse(x, y + dy, 19, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  rect(ctx, x - 8, y + 24, 16, 6, '#c98a2e');
}

function drawMarket(ctx, changed) {
  const sky = ctx.createLinearGradient(0, 0, 0, PANEL_H);
  sky.addColorStop(0, '#1b2340');
  sky.addColorStop(0.55, '#3a2b52');
  sky.addColorStop(1, '#241a33');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);
  stars(ctx, 7);
  // Moon: crescent on the left picture, full on the right.
  if (changed.has('moon')) {
    circle(ctx, 478, 58, 24, '#ffeec2');
    circle(ctx, 478, 58, 20, 'rgba(255, 238, 194, 0.35)');
  } else {
    circle(ctx, 478, 58, 24, '#ffeec2');
    circle(ctx, 490, 52, 21, '#2c2650');
  }
  // Rooftops and string lights.
  rect(ctx, 0, 150, PANEL_W, 270, '#2a1e3f');
  poly(ctx, [[0, 150], [130, 96], [260, 150]], '#33264d');
  poly(ctx, [[300, 150], [430, 100], [560, 150]], '#33264d');
  ctx.strokeStyle = '#ffd67a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 132);
  ctx.quadraticCurveTo(280, 168, 560, 128);
  ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const x = 30 + i * 58;
    const y = 132 + Math.sin((i / 8) * Math.PI) * 22;
    circle(ctx, x, y + 8, 5, i % 2 ? '#ff9d5c' : '#ffd67a');
  }
  // Hanging lanterns across the lane.
  paperLantern(ctx, 118, 92, changed.has('lantern-color') ? '#2fa8a0' : '#e2483d', true);
  paperLantern(ctx, 300, 76, '#f2a541', true);
  paperLantern(ctx, 452, 88, '#e2483d', true);
  // Market stall with striped awning.
  rect(ctx, 150, 240, 260, 90, '#6b4a2f');
  rect(ctx, 150, 240, 260, 10, '#8a6238');
  for (let i = 0; i < 5; i++) {
    const stripe = i === 2 && changed.has('awning-stripe') ? '#2fa8a0' : i % 2 ? '#f6ead2' : '#c94f43';
    rect(ctx, 150 + i * 52, 190, 52, 52, stripe);
  }
  poly(ctx, [[150, 190], [410, 190], [396, 242], [164, 242]], 'rgba(0,0,0,0.12)');
  // Stall sign: TEH on the left, KOPI on the right.
  rect(ctx, 245, 128, 80, 40, '#f6ead2');
  ctx.strokeStyle = '#6b4a2f';
  ctx.lineWidth = 3;
  ctx.strokeRect(245, 128, 80, 40);
  text(ctx, changed.has('stall-sign') ? 'KOPI' : 'TEH', 285, 150, 22, '#6b4a2f');
  // Goods on the stall: fruit, jars, baskets.
  circle(ctx, 185, 300, 13, '#e2483d');
  circle(ctx, 210, 302, 13, '#f2a541');
  circle(ctx, 235, 300, 13, '#7fb069');
  ellipse(ctx, 330, 305, 22, 15, '#c98a2e');
  ellipse(ctx, 370, 305, 18, 13, '#8a6238');
  rect(ctx, 160, 330, 240, 14, '#54371f');
  // Cobblestones.
  rect(ctx, 0, 344, PANEL_W, 76, '#3d2c50');
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      ctx.strokeRect(8 + c * 70 + (r % 2) * 20, 352 + r * 22, 62, 18);
    }
  }
  // Sleeping cat on a crate — only on the left picture.
  if (!changed.has('market-cat')) {
    rect(ctx, 428, 330, 52, 30, '#8a6238');
    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = 2;
    ctx.strokeRect(428, 330, 52, 30);
    ellipse(ctx, 454, 322, 22, 11, '#e8a34c');
    circle(ctx, 472, 312, 9, '#e8a34c');
    poly(ctx, [[466, 305], [469, 297], [474, 304]], '#e8a34c');
    poly(ctx, [[474, 304], [479, 296], [481, 304]], '#e8a34c');
  }
  // A passer-by with a basket, far down the lane.
  circle(ctx, 90, 300, 14, '#f2c9a0');
  poly(ctx, [[76, 314], [104, 314], [110, 360], [70, 360]], '#4a6fa5');
  ellipse(ctx, 118, 330, 12, 9, '#c98a2e');
}

function koi(ctx, x, y, flip, color) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ellipse(ctx, 0, 0, 26, 10, color);
  poly(ctx, [[-24, 0], [-38, -12], [-38, 12]], '#f6ead2');
  circle(ctx, 18, -3, 3, '#1d1d2b');
  ctx.restore();
}

function drawGarden(ctx, changed) {
  const sky = ctx.createLinearGradient(0, 0, 0, PANEL_H);
  sky.addColorStop(0, '#2c3a5e');
  sky.addColorStop(0.5, '#7a5a7d');
  sky.addColorStop(1, '#3d3350');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);
  stars(ctx, 21);
  circle(ctx, 470, 60, 26, '#ffd9a0');
  // Pagoda on the hill.
  rect(ctx, 40, 150, 110, 80, '#4a2f45');
  poly(ctx, [[30, 152], [95, 108], [160, 152]], '#7a3a52');
  rect(ctx, 58, 118, 74, 34, '#5a3a52');
  poly(ctx, [[50, 120], [95, 84], [140, 120]], '#8a4a62');
  // Pagoda window: dark on the left, warm-lit on the right.
  rect(ctx, 78, 128, 20, 26, changed.has('pagoda-window') ? '#ffd67a' : '#241a33');
  rect(ctx, 112, 128, 20, 26, changed.has('pagoda-window') ? '#ffd67a' : '#241a33');
  // Pine branch with a bird — only on the right picture.
  ctx.strokeStyle = '#2c2438';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(440, 90);
  ctx.quadraticCurveTo(480, 110, 520, 96);
  ctx.stroke();
  ellipse(ctx, 470, 92, 26, 7, '#2f4a2f');
  ellipse(ctx, 505, 100, 22, 6, '#37573a');
  if (changed.has('garden-bird')) {
    ellipse(ctx, 482, 106, 12, 8, '#e8e4d8');
    circle(ctx, 492, 100, 5, '#e8e4d8');
    poly(ctx, [[496, 100], [502, 102], [496, 104]], '#e2a63d');
  }
  // Pond.
  ellipse(ctx, 280, 300, 250, 95, '#274b63');
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(180 + i * 55, 285 + (i % 2) * 30, 34, 7, 0, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  // Koi fish; the extra orange one only swims on the right.
  koi(ctx, 210, 295, false, '#f2f2f2');
  koi(ctx, 340, 325, true, '#e2483d');
  koi(ctx, 250, 340, false, '#f2a541');
  if (changed.has('koi-extra')) koi(ctx, 300, 300, true, '#e2703a');
  // Lotus leaves and flower.
  ellipse(ctx, 420, 268, 26, 9, '#3f7a4a');
  ellipse(ctx, 448, 282, 20, 7, '#4a8a55');
  if (!changed.has('lotus')) {
    for (let p = 0; p < 5; p++) {
      const a = -Math.PI / 2 + (p - 2) * 0.5;
      ellipse(ctx, 430 + Math.cos(a) * 10, 258 + Math.sin(a) * 9, 6, 11, '#f2a0c0');
    }
    circle(ctx, 430, 260, 5, '#ffd67a');
  }
  // Arched bridge.
  ctx.strokeStyle = '#8a4a3a';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(60, 250);
  ctx.quadraticCurveTo(160, 165, 260, 250);
  ctx.stroke();
  ctx.strokeStyle = '#a85f4a';
  ctx.lineWidth = 4;
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const x = 60 + t * 200;
    const y = 250 - Math.sin(t * Math.PI) * 62;
    ctx.beginPath();
    ctx.moveTo(x, y - 16);
    ctx.lineTo(x, y + 4);
    ctx.stroke();
  }
  // Bridge lantern: unlit on the left, glowing on the right.
  if (changed.has('bridge-lantern')) {
    paperLantern(ctx, 120, 185, '#e2483d', true);
  } else {
    paperLantern(ctx, 120, 185, '#6b5a6e', false);
  }
  // Stepping stones across the grass — one missing on the right.
  const stones = changed.has('stepping-stone') ? [0, 1, 3] : [0, 1, 2, 3];
  for (const i of stones) {
    ellipse(ctx, 150 + i * 46, 352 + (i % 2) * 12, 24, 10, '#8a8a96');
  }
  rect(ctx, 0, 380, PANEL_W, 40, '#2f4a2f');
}

function drawWorkshop(ctx, changed) {
  rect(ctx, 0, 0, PANEL_W, PANEL_H, '#4a3626');
  // Window with night sky; rain only on the right picture.
  rect(ctx, 440, 40, 100, 110, '#1b2340');
  ctx.strokeStyle = '#6b4a2f';
  ctx.lineWidth = 6;
  ctx.strokeRect(440, 40, 100, 110);
  ctx.beginPath();
  ctx.moveTo(490, 40);
  ctx.lineTo(490, 150);
  ctx.moveTo(440, 95);
  ctx.lineTo(540, 95);
  ctx.stroke();
  circle(ctx, 465, 62, 10, '#ffeec2');
  if (changed.has('window-rain')) {
    ctx.strokeStyle = 'rgba(180, 210, 255, 0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const x = 448 + i * 11;
      const y = 48 + (i % 3) * 30;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + 12);
      ctx.stroke();
    }
  }
  // Big wall clock — hands differ between pictures.
  circle(ctx, 280, 105, 62, '#f6ead2');
  ctx.strokeStyle = '#6b4a2f';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(280, 105, 62, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    circle(ctx, 280 + Math.sin(a) * 50, 105 - Math.cos(a) * 50, 3, '#6b4a2f');
  }
  ctx.strokeStyle = '#2b2b33';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(280, 105);
  if (changed.has('clock-hands')) {
    ctx.lineTo(280, 68);
    ctx.moveTo(280, 105);
    ctx.lineTo(312, 105);
  } else {
    ctx.lineTo(280, 68);
    ctx.moveTo(280, 105);
    ctx.lineTo(248, 105);
  }
  ctx.stroke();
  circle(ctx, 280, 105, 5, '#c94f43');
  // Cuckoo clock: bird out on the right, hidden on the left.
  rect(ctx, 375, 95, 60, 55, '#7a4a2f');
  poly(ctx, [[370, 96], [405, 66], [440, 96]], '#8a5a3a');
  circle(ctx, 405, 122, 12, '#2b2b33');
  if (changed.has('cuckoo')) {
    ellipse(ctx, 405, 108, 10, 13, '#e2a63d');
    circle(ctx, 405, 96, 6, '#e2a63d');
    poly(ctx, [[410, 96], [417, 98], [410, 100]], '#c94f43');
  }
  // Spare brass gear on the wall — only on the right picture.
  if (changed.has('wall-gear')) {
    circle(ctx, 120, 210, 26, '#c98a2e');
    circle(ctx, 120, 210, 12, '#4a3626');
    ctx.strokeStyle = '#c98a2e';
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(120 + Math.cos(a) * 24, 210 + Math.sin(a) * 24);
      ctx.lineTo(120 + Math.cos(a) * 33, 210 + Math.sin(a) * 33);
      ctx.stroke();
    }
  }
  // Wall poster: star on the left, crescent moon on the right.
  rect(ctx, 45, 270, 62, 66, '#f6ead2');
  ctx.strokeStyle = '#6b4a2f';
  ctx.lineWidth = 3;
  ctx.strokeRect(45, 270, 62, 66);
  if (changed.has('poster')) {
    circle(ctx, 76, 303, 16, '#ffd67a');
    circle(ctx, 84, 298, 14, '#f6ead2');
  } else {
    ctx.fillStyle = '#e2a63d';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 7 : 16;
      const x = 76 + Math.cos(a) * r;
      const y = 303 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
  // Workbench with tools.
  rect(ctx, 120, 320, 320, 26, '#6b4a2f');
  rect(ctx, 130, 346, 14, 60, '#54371f');
  rect(ctx, 416, 346, 14, 60, '#54371f');
  // Bench tool: wrench on the left, hammer on the right.
  if (changed.has('bench-tool')) {
    rect(ctx, 190, 306, 34, 8, '#8a5a3a');
    rect(ctx, 196, 292, 22, 16, '#5a5a66');
  } else {
    ctx.strokeStyle = '#8a8a96';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(196, 316);
    ctx.lineTo(226, 296);
    ctx.stroke();
    circle(ctx, 228, 294, 9, '#8a8a96');
    circle(ctx, 228, 294, 4, '#4a3626');
  }
  // Gears and springs scattered on the bench.
  circle(ctx, 300, 312, 12, '#c98a2e');
  circle(ctx, 340, 314, 9, '#8a8a96');
  ellipse(ctx, 260, 314, 16, 6, '#7a5a3a');
  // Candle: lit on the left, unlit on the right.
  rect(ctx, 462, 300, 16, 30, '#f6ead2');
  if (!changed.has('candle')) {
    const g = ctx.createRadialGradient(470, 288, 2, 470, 288, 30);
    g.addColorStop(0, 'rgba(255, 200, 90, 0.7)');
    g.addColorStop(1, 'rgba(255, 200, 90, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(470, 288, 30, 0, Math.PI * 2);
    ctx.fill();
    ellipse(ctx, 470, 288, 6, 11, '#ffb347');
    ellipse(ctx, 470, 290, 3, 6, '#fff3c4');
  } else {
    ctx.strokeStyle = '#8a8a96';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(470, 300);
    ctx.quadraticCurveTo(474, 292, 470, 286);
    ctx.stroke();
  }
  // Shelves with jars and clocks.
  rect(ctx, 40, 190, 200, 10, '#6b4a2f');
  circle(ctx, 70, 172, 14, '#7fb069');
  circle(ctx, 110, 174, 12, '#4a6fa5');
  rect(ctx, 150, 162, 26, 28, '#c98a2e');
  // Floor.
  rect(ctx, 0, 380, PANEL_W, 40, '#33241a');
}

const DRAWERS = { market: drawMarket, garden: drawGarden, workshop: drawWorkshop };

export function drawScene(ctx, level, changed) {
  ctx.save();
  ctx.clearRect(0, 0, PANEL_W, PANEL_H);
  DRAWERS[level.id](ctx, changed);
  ctx.restore();
}

export function allDifferenceIds(level) {
  return new Set(level.differences.map((d) => d.id));
}
