// Draws a chord box diagram for one voicing from the chord engine (TEMPO_PLAN.md 5.5):
// nut or starting fret, a drawn barre bar, finger numbers in the dots, open / muted
// markers above, and each string's interval (R, 3, 5, b7 ...) underneath.
// Root notes are coral. Can be mirrored for left-handed players.

import { escapeHtml } from '../utils/html.js';

const FRETS_SHOWN = 5;
const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

// ─── Rendering ───

// Returns the SVG for a voicing ({ frets, fingers, barre, intervals, damped, startFret, name }).
// `options` may be a number (the width in px) or { size, leftHanded, showIntervals }.
export function renderChordDiagram(voicing, options = {}) {
  if (!voicing) return '';
  const settings = typeof options === 'number' ? { size: options } : options;
  const layout = getLayout(settings.size || 180, Boolean(settings.leftHanded), voicing);
  const showIntervals = settings.showIntervals !== false;

  const parts = [
    renderGrid(layout),
    renderMarkers(voicing, layout),
    renderBarre(voicing, layout),
    renderDots(voicing, layout),
    showIntervals ? renderIntervals(voicing, layout) : renderStringNames(layout),
  ];

  return `<svg class="chord-diagram" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}"
    role="img" aria-label="${escapeHtml(describe(voicing))}" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
}

// ─── Layout ───

// Works out sizes and positions for a diagram `size` pixels wide.
function getLayout(size, leftHanded, voicing) {
  // Room on the left for a starting-fret label such as "12fr" (on the right when left-handed).
  const padLeft = leftHanded ? size * 0.1 : size * 0.26;
  const padRight = leftHanded ? size * 0.26 : size * 0.1;
  const top = size * 0.2;
  const stringGap = (size - padLeft - padRight) / 5;
  const fretGap = stringGap * 1.25;
  return {
    width: size,
    height: top + fretGap * FRETS_SHOWN + size * 0.2,
    padLeft,
    top,
    stringGap,
    fretGap,
    startFret: voicing.startFret || 1,
    leftHanded,
    dotRadius: Math.min(stringGap, fretGap) * 0.36,
    fontSize: Math.max(12, size * 0.075),
  };
}

// Returns the x position of a string (0 = low E), mirrored for left-handed players.
function stringX(layout, string) {
  const column = layout.leftHanded ? 5 - string : string;
  return layout.padLeft + column * layout.stringGap;
}

// Returns the y position of the middle of a fret row.
function fretY(layout, fret) {
  return layout.top + (fret - layout.startFret + 0.5) * layout.fretGap;
}

// ─── Parts of the diagram ───

// Draws the nut (or a starting-fret label), the fret lines and the strings.
function renderGrid(layout) {
  const { padLeft, top, stringGap, fretGap, startFret, fontSize } = layout;
  const right = padLeft + 5 * stringGap;
  const bottom = top + FRETS_SHOWN * fretGap;
  let svg = '';

  if (startFret === 1) {
    svg += `<rect class="cd-nut" x="${padLeft - 1}" y="${top - 5}" width="${5 * stringGap + 2}" height="6" rx="1.5"/>`;
  } else {
    // Sit clear of the dots and any barre end, which reach one dot radius past the outer strings.
    const gap = layout.dotRadius + 4;
    const labelX = layout.leftHanded ? right + gap : padLeft - gap;
    const anchor = layout.leftHanded ? 'start' : 'end';
    svg += `<text class="cd-start-fret" x="${labelX}" y="${top + fretGap / 2}" text-anchor="${anchor}" dominant-baseline="central" font-size="${fontSize}">${startFret}fr</text>`;
  }
  for (let row = 0; row <= FRETS_SHOWN; row++) {
    const y = top + row * fretGap;
    svg += `<line class="cd-fret" x1="${padLeft}" y1="${y}" x2="${right}" y2="${y}"/>`;
  }
  for (let string = 0; string < 6; string++) {
    const x = stringX(layout, string);
    svg += `<line class="cd-string" x1="${x}" y1="${top}" x2="${x}" y2="${bottom}" stroke-width="${2.2 - string * 0.25}"/>`;
  }
  return svg;
}

// Draws ○ above open strings and × above strings that are not played.
function renderMarkers(voicing, layout) {
  const y = layout.top - layout.fretGap * 0.45;
  const radius = layout.dotRadius * 0.55;
  let svg = '';
  voicing.frets.forEach((fret, string) => {
    const x = stringX(layout, string);
    if (fret === 0) {
      svg += `<circle class="cd-open" cx="${x}" cy="${y}" r="${radius}"/>`;
    } else if (fret === null) {
      const damped = voicing.damped && voicing.damped.includes(string);
      svg += `<text class="cd-muted${damped ? ' cd-muted--damped' : ''}" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${layout.fontSize * 1.6}">×</text>`;
    }
  });
  return svg;
}

// Draws the barre as one rounded bar across the strings it covers.
function renderBarre(voicing, layout) {
  if (!voicing.barre) return '';
  const { fret, fromString, toString } = voicing.barre;
  const xs = [stringX(layout, fromString), stringX(layout, toString)];
  const left = Math.min(...xs) - layout.dotRadius;
  const width = Math.abs(xs[1] - xs[0]) + layout.dotRadius * 2;
  const y = fretY(layout, fret);
  const middle = left + width / 2;
  return `<rect class="cd-barre" x="${left}" y="${y - layout.dotRadius}" width="${width}" height="${layout.dotRadius * 2}" rx="${layout.dotRadius}"/>`
    + `<text class="cd-finger" x="${middle}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${layout.fontSize}">${voicing.barre.finger}</text>`;
}

// True if this note is pressed by the barre (it is drawn as part of the bar).
function isUnderBarre(voicing, string, fret) {
  const barre = voicing.barre;
  return Boolean(barre) && fret === barre.fret && string >= barre.fromString && string <= barre.toString
    && voicing.fingers[string] === barre.finger;
}

// Draws a dot for each fretted note with its finger number; roots are coral.
// Notes under the barre only get a small coral marker when they are the root.
function renderDots(voicing, layout) {
  let svg = '';
  voicing.frets.forEach((fret, string) => {
    if (!Number.isInteger(fret) || fret === 0) return;
    const x = stringX(layout, string);
    const y = fretY(layout, fret);
    const isRoot = voicing.intervals && voicing.intervals[string] === 'R';
    if (isUnderBarre(voicing, string, fret)) {
      if (isRoot) svg += `<circle class="cd-dot cd-dot--root" cx="${x}" cy="${y}" r="${layout.dotRadius * 0.55}"/>`;
      return;
    }
    svg += `<circle class="cd-dot${isRoot ? ' cd-dot--root' : ''}" cx="${x}" cy="${y}" r="${layout.dotRadius}"/>`;
    if (voicing.fingers && voicing.fingers[string]) {
      svg += `<text class="cd-finger" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${layout.fontSize}">${voicing.fingers[string]}</text>`;
    }
  });
  return svg;
}

// Writes each sounding string's interval (R, 3, 5 ...) under the diagram.
function renderIntervals(voicing, layout) {
  const y = layout.top + FRETS_SHOWN * layout.fretGap + layout.fontSize * 1.4;
  return voicing.frets.map((fret, string) => {
    const label = voicing.intervals ? voicing.intervals[string] : null;
    if (fret === null || !label) return '';
    return `<text class="cd-interval${label === 'R' ? ' cd-interval--root' : ''}" x="${stringX(layout, string)}" y="${y}" text-anchor="middle" font-size="${layout.fontSize}">${label}</text>`;
  }).join('');
}

// Writes the string names (E A D G B e) under the diagram.
function renderStringNames(layout) {
  const y = layout.top + FRETS_SHOWN * layout.fretGap + layout.fontSize * 1.4;
  return STRING_NAMES.map((_, string) => {
    const name = STRING_NAMES[string];
    return `<text class="cd-string-name" x="${stringX(layout, string)}" y="${y}" text-anchor="middle" font-size="${layout.fontSize}">${name}</text>`;
  }).join('');
}

// ─── Accessibility ───

// Describes the shape in words for screen readers, e.g. "C — open: frets x 3 2 0 1 0 ...".
function describe(voicing) {
  const frets = voicing.frets.map((fret) => (fret === null ? 'x' : fret)).join(' ');
  const barre = voicing.barre ? `, barre at fret ${voicing.barre.fret}` : '';
  return `${voicing.name || 'Chord'}: frets ${frets} from low E to high E${barre}`;
}
