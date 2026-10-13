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

// ─── Tiny font ───

// A 3 × 5 pixel font for the few letters and digits the art needs.
const FONT = {
  0: ['xxx', 'x.x', 'x.x', 'x.x', 'xxx'],
  1: ['.x.', 'xx.', '.x.', '.x.', 'xxx'],
  3: ['xxx', '..x', '.xx', '..x', 'xxx'],
  5: ['xxx', 'x..', 'xxx', '..x', 'xxx'],
  6: ['xxx', 'x..', 'xxx', 'x.x', 'xxx'],
  A: ['.x.', 'x.x', 'xxx', 'x.x', 'x.x'],
  C: ['xxx', 'x..', 'x..', 'x..', 'xxx'],
  D: ['xx.', 'x.x', 'x.x', 'x.x', 'xx.'],
  E: ['xxx', 'x..', 'xx.', 'x..', 'xxx'],
  G: ['xxx', 'x..', 'x.x', 'x.x', 'xxx'],
};

// Writes text in the tiny font (4 pixels per character), optionally scaled up.
function write(canvas, text, x, y, colour, scale = 1) {
  [...text].forEach((character, index) => {
    const rows = FONT[character];
    rows.forEach((row, rowIndex) => [...row].forEach((pixel, colIndex) => {
      if (pixel === 'x') canvas.rect(x + (index * 4 + colIndex) * scale, y + rowIndex * scale, scale, scale, colour);
    }));
  });
  return canvas;
}

// ─── Covers: the ear games ───

// Scale degrees: a staircase of seven steps; a dot climbs it, then walks home.
function scaleDegreesCover() {
  const base = createCanvas(32, 32);
  for (let step = 0; step < 7; step++) {
    const top = 26 - step * 3;
    base.rect(2 + step * 4, top, 3, 28 - top, 'l').rect(2 + step * 4, top, 3, 1, 'm');
  }
  base.rect(2, 28, 28, 1, 'm');
  const frames = [];
  for (let step = 0; step < 7; step++) frames.push(base.copy().rect(2 + step * 4, 26 - step * 3 - 3, 2, 2, step === 0 ? 'g' : 'v'));
  frames.push(base.copy().rect(2, 23, 2, 2, 'g'));
  return { width: 32, height: 32, layers: [{ frames, fps: 4 }] };
}

// Play it back: a piece of fretboard; fingers land on three spots, then all three show.
function playBackCover() {
  const base = createCanvas(32, 32);
  base.rect(2, 8, 28, 17, 'k').rect(2, 8, 2, 17, 'b');
  [8, 14, 20, 26].forEach((x) => base.rect(x, 8, 1, 17, 'l'));
  for (let string = 0; string < 6; string++) base.rect(4, 9 + string * 3, 26, 1, 'm');
  const spots = [[10, 17], [16, 11], [22, 20]];
  const frames = spots.map(([x, y]) => base.copy().rect(x, y, 3, 3, 'v'));
  frames.push(spots.reduce((canvas, [x, y]) => canvas.rect(x, y, 3, 3, 'g'), base.copy()));
  return { width: 32, height: 32, layers: [{ frames, fps: 2 }] };
}

// Chord quality: a three-note chord beside a face. Major smiles; minor (middle note a step lower) frowns.
function chordQualityCover() {
  const draw = (minor) => {
    const canvas = createCanvas(32, 32);
    [8, 12, 16, 20, 24].forEach((y) => canvas.rect(2, y, 13, 1, 'l'));
    canvas.glyph(tint(NOTE_HEAD, 'b'), 4, 22).glyph(tint(NOTE_HEAD, 'b'), 4, minor ? 19 : 18).glyph(tint(NOTE_HEAD, 'b'), 4, 14);
    canvas.line(8, 22, 8, 5, 'b');
    canvas.disc(23, 16, 7, minor ? 's' : 'z');
    canvas.rect(20, 13, 2, 2, 'i').rect(25, 13, 2, 2, 'i');
    if (minor) canvas.rect(21, 18, 5, 1, 'i').dot(20, 19, 'i').dot(26, 19, 'i');
    else canvas.rect(21, 19, 5, 1, 'i').dot(20, 18, 'i').dot(26, 18, 'i');
    return canvas;
  };
  return { width: 32, height: 32, layers: [{ frames: [draw(false), draw(true)], fps: 1 }] };
}

// Progression detective: four chord blocks (I V vi IV) with a playhead walking across.
function progressionsCover() {
  const base = createCanvas(32, 32);
  const heights = [14, 11, 8, 10];
  heights.forEach((height, index) => base.rect(3 + index * 7, 24 - height, 5, height, 'l'));
  base.rect(2, 25, 28, 1, 'm');
  const frames = heights.map((height, index) => base.copy()
    .rect(3 + index * 7, 24 - height, 5, height, 'v')
    .rect(5 + index * 7, 5, 1, 21, 'g'));
  return { width: 32, height: 32, layers: [{ frames, fps: 2 }] };
}

// Call and response: a phrase in one speech bubble, then the answer in the other.
function callResponseCover() {
  const call = createCanvas(32, 32);
  call.rect(2, 4, 17, 10, 'b').dot(5, 14, 'b').dot(4, 15, 'b');
  call.glyph(tint(NOTE, 'i'), 4, 6).glyph(tint(NOTE, 'i'), 11, 6);
  const response = call.copy();
  response.rect(13, 17, 17, 10, 'v').dot(26, 27, 'v').dot(27, 28, 'v');
  response.glyph(tint(NOTE, 'i'), 15, 19).glyph(tint(NOTE, 'i'), 22, 19);
  return { width: 32, height: 32, layers: [{ frames: [call, response, response.copy()], fps: 1.2 }] };
}

// Rhythm tap-back: four pads in a row light up one beat at a time, the first one accented.
function rhythmCover() {
  const base = createCanvas(32, 32);
  for (let pad = 0; pad < 4; pad++) base.rect(3 + pad * 7, 12, 5, 5, 'l').frame(3 + pad * 7, 12, 5, 5, 'm');
  base.rect(3, 21, 26, 1, 'l');
  const frames = [0, 1, 2, 3].map((pad) => base.copy().rect(3 + pad * 7, 12, 5, 5, pad === 0 ? 'z' : 'g').rect(3 + pad * 7, 21, 5, 1, 'b'));
  return { width: 32, height: 32, layers: [{ frames, fps: 2.7 }] };
}

// Producer's ear: six EQ sliders; one band pushes up and settles back.
function producerCover() {
  const levels = [14, 12, 15, 13, 14, 12];
  const draw = (boost) => {
    const canvas = createCanvas(32, 32);
    canvas.rect(2, 16, 28, 1, 'l');
    levels.forEach((level, band) => {
      const x = 4 + band * 4;
      canvas.rect(x + 1, 5, 1, 22, 'l');
      const y = band === 3 ? level - boost : level;
      canvas.rect(x, y, 3, 2, band === 3 && boost ? 'v' : 'b');
    });
    return canvas;
  };
  return { width: 32, height: 32, layers: [{ frames: [draw(0), draw(4), draw(8), draw(4)], fps: 2 }] };
}

// ─── Cover: theory topic 1 ───

// Notes on the fretboard: a dot walks up the low E string through the natural notes.
function fretboardNotesCover() {
  const base = createCanvas(32, 32);
  base.rect(1, 6, 30, 20, 'k').rect(2, 6, 2, 20, 'b');
  [8, 13, 17, 21, 25, 29].forEach((x) => base.rect(x, 6, 1, 20, 'l'));
  for (let string = 0; string < 6; string++) base.rect(4, 8 + string * 3, 27, 1, string === 5 ? 'n' : 'm');
  const spots = [5, 10, 15, 19, 23, 27];
  const frames = spots.map((x, index) => {
    const canvas = base.copy();
    spots.slice(0, index).forEach((earlier) => canvas.rect(earlier - 1, 22, 3, 3, 'm'));
    return canvas.rect(x - 1, 22, 3, 3, 's');
  });
  return { width: 32, height: 32, layers: [{ frames, fps: 2 }] };
}

// ─── Stamps: the milestones ───

// A chord box (six strings, three frets) to draw dots and barres on.
function chordBox() {
  const canvas = createCanvas(24, 24);
  canvas.rect(4, 4, 16, 2, 'b');
  for (let string = 0; string < 6; string++) canvas.rect(4 + string * 3, 6, 1, 15, 'm');
  [10, 15, 20].forEach((y) => canvas.rect(4, y, 16, 1, 'm'));
  return canvas;
}

// Returns the frames for a still picture with a sparkle that twinkles in its corner.
function twinkle(base) {
  return [base.copy().glyph(SPARKLE, 20, 0), base.copy().dot(21, 1, 'b'), base.copy()];
}

// First clean chord: a chord box with three finger dots.
function cleanShapeStamp() {
  const base = chordBox();
  [[7, 7], [13, 12], [16, 17]].forEach(([x, y]) => base.rect(x - 1, y, 3, 3, 'p'));
  return { width: 24, height: 24, layers: [{ frames: twinkle(base), fps: 2 }] };
}

// First clean barre: a chord box with a barre across every string.
function cleanBarreStamp() {
  const base = chordBox();
  base.rect(3, 7, 18, 2, 'p').rect(9, 12, 3, 3, 'p').rect(15, 17, 3, 3, 'p');
  return { width: 24, height: 24, layers: [{ frames: twinkle(base), fps: 2 }] };
}

// Five clean shapes: a big 5 and five lights that fill in.
function fiveShapesStamp() {
  const base = write(createCanvas(24, 24), '5', 6, 2, 'p', 3);
  const frames = [0, 1, 2, 3, 4, 5].map((lit) => {
    const canvas = base.copy();
    for (let light = 0; light < 5; light++) canvas.rect(3 + light * 4, 20, 2, 2, light < lit ? 'g' : 'l');
    return canvas;
  });
  return { width: 24, height: 24, layers: [{ frames, fps: 2 }] };
}

// A stopwatch with a number on its face and a sweeping hand.
function stopwatchStamp(number, colour) {
  const base = createCanvas(24, 24);
  base.rect(10, 1, 4, 2, 'b').disc(12, 13, 9, colour).disc(12, 13, 7, 'k');
  write(base, number, 6, 15, 'b');
  const ends = [[12, 7], [15, 8], [17, 11], [7, 11], [9, 8]];
  const frames = ends.map(([x, y]) => base.copy().line(12, 12, x, y, 'b').dot(12, 12, colour));
  return { width: 24, height: 24, layers: [{ frames, fps: 3 }] };
}

// All five CAGED shapes: the letters C A G E D light up one by one.
function cagedStamp() {
  const letters = 'CAGED';
  const frames = [0, 1, 2, 3, 4, 5].map((lit) => {
    const canvas = createCanvas(24, 24);
    canvas.rect(1, 7, 22, 11, 'k');
    [...letters].forEach((letter, index) => write(canvas, letter, 2 + index * 4, 10, index < lit || lit === 5 ? 'p' : 'l'));
    return canvas;
  });
  return { width: 24, height: 24, layers: [{ frames, fps: 2 }] };
}

// Seven-day streak: a calendar whose seven days tick off one by one.
function streakStamp() {
  const base = createCanvas(24, 24);
  base.rect(3, 3, 18, 18, 'b').rect(3, 3, 18, 4, 'p').rect(7, 1, 1, 3, 'b').rect(16, 1, 1, 3, 'b');
  const days = [[5, 9], [9, 9], [13, 9], [17, 9], [5, 15], [9, 15], [13, 15]];
  days.forEach(([x, y]) => base.rect(x, y, 3, 3, 'm'));
  const frames = [0, 1, 2, 3, 4, 5, 6, 7].map((ticked) => {
    const canvas = base.copy();
    days.slice(0, ticked).forEach(([x, y]) => canvas.rect(x, y, 3, 3, 'v'));
    return canvas;
  });
  return { width: 24, height: 24, layers: [{ frames, fps: 2.5 }] };
}

// Ten hours played: an hourglass with the sand running through.
function hourglassStamp() {
  const glass = createCanvas(24, 24);
  glass.rect(5, 2, 14, 2, 'b').rect(5, 20, 14, 2, 'b');
  glass.line(6, 4, 11, 11, 'n').line(17, 4, 12, 11, 'n').line(11, 12, 6, 19, 'n').line(12, 12, 17, 19, 'n');
  const sand = (top, bottom) => {
    const canvas = glass.copy();
    // Sand left in the top bulb sits just above the neck, wider as it goes up.
    for (let row = 0; row < top; row++) canvas.rect(11 - row, 10 - row, 2 + row * 2, 1, 'z');
    // The pile in the bottom bulb, widest at the floor.
    for (let row = 0; row < bottom; row++) canvas.rect(7 + row, 19 - row, 10 - row * 2, 1, 'z');
    if (top > 0) canvas.rect(11, 12, 2, 6, 'z');
    return canvas;
  };
  return { width: 24, height: 24, layers: [{ frames: [sand(4, 1), sand(3, 2), sand(2, 3), sand(1, 4), sand(0, 4)], fps: 1.5 }] };
}

// ─── Lookup ───

const BUILDERS = {
  'hero:today': todayHero,
  'cover:ear-scale-degrees': scaleDegreesCover,
  'cover:ear-intervals': intervalsCover,
  'cover:ear-play-back': playBackCover,
  'cover:ear-chord-quality': chordQualityCover,
  'cover:ear-progressions': progressionsCover,
  'cover:ear-call-response': callResponseCover,
  'cover:ear-rhythm': rhythmCover,
  'cover:ear-producer': producerCover,
  'cover:theory-01-fretboard-notes': fretboardNotesCover,
  'stamp:first-session': firstSessionStamp,
  'stamp:first-clean-shape': cleanShapeStamp,
  'stamp:first-clean-barre': cleanBarreStamp,
  'stamp:five-clean-shapes': fiveShapesStamp,
  'stamp:changes-30': () => stopwatchStamp('30', 'p'),
  'stamp:changes-60': () => stopwatchStamp('60', 'z'),
  'stamp:all-caged': cagedStamp,
  'stamp:streak-7': streakStamp,
  'stamp:ten-hours': hourglassStamp,
};

// The keys that have a pixel stand-in.
export const SPRITE_KEYS = Object.keys(BUILDERS);

const cache = new Map();

// Returns the sprite for a key such as "cover:ear-intervals" (null if none is drawn yet).
export function getSprite(key) {
  if (!BUILDERS[key]) return null;
  if (!cache.has(key)) cache.set(key, BUILDERS[key]());
  return cache.get(key);
}
