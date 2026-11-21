// levels.js — the three spot-the-difference levels of Lantern Hunt.
// Each level names its scene, its time limit and its differences. A difference
// is a spot on the picture (x, y, radius in the 560x420 panel space) plus a
// short label shown when it is found. The right-hand picture applies every
// difference; the left-hand picture applies none. scenes.js draws both.
export const PANEL_W = 560;
export const PANEL_H = 420;

export const LEVELS = [
  {
    id: 'market',
    name: 'Lantern Night Market',
    subtitle: 'Level 1 · a busy little market lane after dark',
    timeLimit: 150,
    differences: [
      { id: 'lantern-color', x: 118, y: 92, r: 30, label: 'Lantern colour' },
      { id: 'market-cat', x: 452, y: 330, r: 30, label: 'Sleeping cat' },
      { id: 'stall-sign', x: 285, y: 150, r: 34, label: 'Stall sign' },
      { id: 'moon', x: 478, y: 58, r: 28, label: 'Moon phase' },
      { id: 'awning-stripe', x: 210, y: 205, r: 30, label: 'Awning stripe' },
    ],
  },
  {
    id: 'garden',
    name: 'Koi Garden at Dusk',
    subtitle: 'Level 2 · a quiet pond garden as the light fades',
    timeLimit: 135,
    differences: [
      { id: 'koi-extra', x: 300, y: 300, r: 30, label: 'Extra koi' },
      { id: 'bridge-lantern', x: 120, y: 185, r: 28, label: 'Bridge lantern' },
      { id: 'lotus', x: 430, y: 265, r: 30, label: 'Pink lotus' },
      { id: 'stepping-stone', x: 190, y: 355, r: 30, label: 'Stepping stone' },
      { id: 'garden-bird', x: 480, y: 110, r: 28, label: 'Bird on the branch' },
      { id: 'pagoda-window', x: 88, y: 120, r: 28, label: 'Pagoda window' },
    ],
  },
  {
    id: 'workshop',
    name: "Clockmaker's Workshop",
    subtitle: 'Level 3 · gears, clocks and candlelight',
    timeLimit: 120,
    differences: [
      { id: 'clock-hands', x: 280, y: 105, r: 34, label: 'Clock hands' },
      { id: 'wall-gear', x: 120, y: 210, r: 30, label: 'Brass gear' },
      { id: 'candle', x: 470, y: 300, r: 28, label: 'Candle flame' },
      { id: 'cuckoo', x: 405, y: 120, r: 28, label: 'Cuckoo bird' },
      { id: 'bench-tool', x: 200, y: 330, r: 30, label: 'Bench tool' },
      { id: 'poster', x: 75, y: 300, r: 30, label: 'Wall poster' },
      { id: 'window-rain', x: 490, y: 95, r: 30, label: 'Window rain' },
    ],
  },
];

export function totalDifferences() {
  return LEVELS.reduce((sum, level) => sum + level.differences.length, 0);
}
