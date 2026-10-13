// The stand-in pixel artwork, drawn with the engine in pixel.js. Each entry builds one
// sprite: a hero (64 × 48, the 4:3 hero frame), covers (32 × 32) and stamps (24 × 24).
// Baranay's own art replaces these later; the frame sizes match the art spec.

import { createCanvas } from './pixel.js';

// ─── Shared glyphs ───

// An eighth note, 5 × 6.
const NOTE = [
  '..bbb',
  '..b.b',
  '..b..',
  '..b..',
  'bbb..',
  'bbb..',
];

// Returns a glyph with every coloured pixel set to one colour.
function tint(rows, colour) {
  return rows.map((row) => row.replace(/[^.]/g, colour));
}

// A slanted note head, 5 × 3 (the stem goes up from its right edge).
const NOTE_HEAD = ['..xxx', 'xxxxx', 'xxx..'];

// A four-point sparkle, 3 × 3.
const SPARKLE = ['.b.', 'bbb', '.b.'];

// ─── Hero: Today ───

// An amp with a pulsing speaker, a guitar on a stand, and notes drifting up.
function todayHero() {
  const base = createCanvas(64, 48);
  base.rect(0, 44, 64, 1, 'l').rect(0, 45, 64, 3, 'k');

  // Amp: handle, cabinet, control strip with knobs and a green LED, grille.
  base.rect(12, 13, 12, 1, 'n').rect(12, 13, 1, 3, 'n').rect(23, 13, 1, 3, 'n');
  base.rect(5, 16, 26, 28, 'k').frame(5, 16, 26, 28, 'n');
  base.rect(6, 17, 24, 5, 'l');
  [9, 13, 17, 21].forEach((x) => base.rect(x, 18, 2, 2, 'b').dot(x, 18, 'm'));
  base.rect(26, 18, 2, 2, 'g');
  base.rect(7, 23, 22, 19, 'i');
  [[5, 16], [30, 16], [5, 43], [30, 43]].forEach(([x, y]) => base.set(x, y, 'b'));

  // Cable from the amp to the guitar.
  base.line(31, 40, 35, 42, 'm').line(35, 42, 41, 42, 'm');

  // Guitar: headstock with tuners, neck with frets, sonic blue body, sound hole, bridge, stand.
  base.rect(45, 2, 5, 5, 'z');
  [[44, 3], [44, 5], [50, 3], [50, 5]].forEach(([x, y]) => base.set(x, y, 'b'));
  base.rect(46, 7, 3, 16, 'b');
  for (let y = 9; y < 23; y += 3) base.rect(46, y, 3, 1, 'm');
  base.disc(47, 27, 6, 's').disc(47, 36, 8, 's');
  base.disc(47, 30, 2, 'i');
  base.line(47, 7, 47, 38, 'n');
  base.rect(44, 38, 7, 1, 'k');
  base.line(41, 44, 44, 41, 'm').line(53, 44, 50, 41, 'm');

  // The speaker, resting and pushed out (two frames).
  const rest = base.copy();
  rest.ring(18, 32, 8, 'm').disc(18, 32, 5, 'l').disc(18, 32, 2, 'n');
  const push = base.copy();
  push.ring(18, 32, 9, 'm').ring(18, 32, 8, 'l').disc(18, 32, 6, 'l').disc(18, 32, 3, 'b');

  const notes = createCanvas(64, 48).glyph(tint(NOTE, 'z'), 9, 6);
  const notesLate = createCanvas(64, 48).glyph(tint(NOTE, 'v'), 23, 8);

  return {
    width: 64,
    height: 48,
    layers: [
      { frames: [rest, push], fps: 2.5 },
      { frames: [notes], motion: 'float' },
      { frames: [notesLate], motion: 'float', delay: 1.4 },
    ],
  };
}

// ─── Cover: Intervals ───

// Two notes on a staff, the second higher, with a dot hopping from one to the other.
function intervalsCover() {
  const base = createCanvas(32, 32);
  [8, 12, 16, 20, 24].forEach((y) => base.rect(3, y, 26, 1, 'l'));
  base.glyph(tint(NOTE_HEAD, 'b'), 7, 19).line(11, 19, 11, 10, 'b');
  base.glyph(tint(NOTE_HEAD, 'v'), 19, 11).line(23, 11, 23, 2, 'v');

  const path = [[13, 18], [15, 16], [17, 14], [19, 13]];
  const frames = path.map(([x, y]) => base.copy().rect(x, y, 2, 2, 'g'));
  return { width: 32, height: 32, layers: [{ frames: [...frames, base.copy()], fps: 4 }] };
}

// ─── Stamp: first session ───

// A guitar pick with a "1" on it, and two sparkles that twinkle.
function firstSessionStamp() {
  const base = createCanvas(24, 24);
  base.glyph(tint([
    '..xxxxxxxxxx..',
    '.xxxxxxxxxxxx.',
    'xxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxx',
    '.xxxxxxxxxxxx.',
    '.xxxxxxxxxxxx.',
    '..xxxxxxxxxx..',
    '..xxxxxxxxxx..',
    '...xxxxxxxx...',
    '...xxxxxxxx...',
    '....xxxxxx....',
    '.....xxxx.....',
    '......xx......',
  ], 'p'), 5, 5);
  base.glyph(['.i.', 'ii.', '.i.', '.i.', 'iii'], 11, 7);

  const bright = base.copy().glyph(SPARKLE, 19, 2).dot(3, 18, 'b');
  const dim = base.copy().dot(20, 3, 'b').glyph(SPARKLE, 2, 17);
  return { width: 24, height: 24, layers: [{ frames: [bright, dim, base.copy()], fps: 2 }] };
}

// ─── Lookup ───

const BUILDERS = {
  'hero:today': todayHero,
  'cover:intervals': intervalsCover,
  'stamp:first-session': firstSessionStamp,
};

const cache = new Map();

// Returns the sprite for a key such as "cover:intervals" (null if none is drawn yet).
export function getSprite(key) {
  if (!BUILDERS[key]) return null;
  if (!cache.has(key)) cache.set(key, BUILDERS[key]());
  return cache.get(key);
}
