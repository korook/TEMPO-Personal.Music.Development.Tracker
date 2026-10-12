// The fretboard neck (TEMPO_PLAN.md 5.5, the Chords page hero): frets 0–15 with every
// tone of a chord marked, roots in coral and other tones labelled by interval
// (R, 3, 5, b7 ...). When a voicing is given, its notes stand out and the rest fade,
// showing that the chord lives all over the neck. Can be mirrored for left-handed players.

import { STANDARD_TUNING, mod12 } from '../theory/notes.js';
import { chordTones, chordSymbol } from '../theory/chords.js';
import { displayLabel } from '../theory/intervals.js';
import { escapeHtml } from '../utils/html.js';

const LAST_FRET = 15;
const INLAY_FRETS = [3, 5, 7, 9, 15];
const DOUBLE_INLAY_FRET = 12;
const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

// ─── Rendering ───

// Returns the neck SVG for a chord. options: { voicing, leftHanded }.
export function renderNeck(root, quality, { voicing = null, leftHanded = false } = {}) {
  const layout = getLayout(leftHanded);
  const tones = chordTones(root, quality);
  const parts = [
    renderBoard(layout),
    renderInlays(layout),
    renderFrets(layout),
    renderStrings(layout),
    renderNotes(layout, tones, voicing),
    renderFretNumbers(layout),
  ];
  const label = describe(root, quality, voicing, leftHanded);
  return `
    <div class="neck">
      <svg viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-label="${escapeHtml(label)}" xmlns="http://www.w3.org/2000/svg">
        ${parts.join('')}
      </svg>
    </div>`;
}

// ─── Layout ───

// Works out where every fret wire and string sits. Frets get slightly narrower up the
// neck like a real guitar, but stay wide enough to read.
function getLayout(leftHanded) {
  const nameColumn = 26;
  const openColumn = nameColumn + 40;
  const firstFretWidth = 72;
  const top = 22;
  const stringGap = 30;
  const wires = [openColumn];
  for (let fret = 1; fret <= LAST_FRET; fret++) {
    wires.push(wires[fret - 1] + firstFretWidth * 0.965 ** (fret - 1));
  }
  const width = wires[LAST_FRET] + 16;
  return { leftHanded, wires, top, stringGap, width, height: top + stringGap * 5 + 46, openColumn, nameColumn };
}

// Mirrors an x position for left-handed players (nut on the right).
function mirror(layout, x) {
  return layout.leftHanded ? layout.width - x : x;
}

// Returns the x position of the middle of a fret space (fret 0 = left of the nut).
function noteX(layout, fret) {
  if (fret === 0) return mirror(layout, (layout.nameColumn + layout.openColumn) / 2);
  return mirror(layout, (layout.wires[fret - 1] + layout.wires[fret]) / 2);
}

// Returns the y position of a string: high e at the top, low E at the bottom (like tab).
function stringY(layout, string) {
  return layout.top + (5 - string) * layout.stringGap;
}

// ─── Parts of the neck ───

// Draws the wooden board behind the frets.
function renderBoard(layout) {
  const left = Math.min(mirror(layout, layout.openColumn), mirror(layout, layout.wires[LAST_FRET]));
  const width = layout.wires[LAST_FRET] - layout.openColumn;
  return `<rect class="neck-board" x="${left}" y="${layout.top - 10}" width="${width}" height="${layout.stringGap * 5 + 20}" rx="4"/>`;
}

// Draws the position dots at frets 3, 5, 7, 9, 12 (double) and 15.
function renderInlays(layout) {
  const middle = layout.top + layout.stringGap * 2.5;
  let svg = '';
  for (const fret of INLAY_FRETS) {
    svg += `<circle class="neck-inlay" cx="${noteX(layout, fret)}" cy="${middle}" r="6"/>`;
  }
  const x = noteX(layout, DOUBLE_INLAY_FRET);
  svg += `<circle class="neck-inlay" cx="${x}" cy="${middle - layout.stringGap}" r="6"/>`;
  svg += `<circle class="neck-inlay" cx="${x}" cy="${middle + layout.stringGap}" r="6"/>`;
  return svg;
}

// Draws the nut and the fret wires.
function renderFrets(layout) {
  const y1 = layout.top - 10;
  const y2 = layout.top + layout.stringGap * 5 + 10;
  return layout.wires.map((wire, fret) => {
    const x = mirror(layout, wire);
    const className = fret === 0 ? 'neck-nut' : 'neck-fret';
    return `<line class="${className}" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>`;
  }).join('');
}

// Draws the six strings, thicker for the low ones, with their names at the nut end.
function renderStrings(layout) {
  const x1 = mirror(layout, layout.nameColumn);
  const x2 = mirror(layout, layout.wires[LAST_FRET]);
  const nameX = mirror(layout, layout.nameColumn / 2);
  let svg = '';
  for (let string = 0; string < 6; string++) {
    const y = stringY(layout, string);
    svg += `<line class="neck-string" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke-width="${2.6 - string * 0.35}"/>`;
    svg += `<text class="neck-string-name" x="${nameX}" y="${y}" text-anchor="middle" dominant-baseline="central">${STRING_NAMES[string]}</text>`;
  }
  return svg;
}

// Marks every chord tone on frets 0–15. With a voicing, its notes are emphasised.
function renderNotes(layout, tones, voicing) {
  let svg = '';
  for (let string = 0; string < 6; string++) {
    for (let fret = 0; fret <= LAST_FRET; fret++) {
      const tone = tones.find((candidate) => candidate.pitchClass === mod12(STANDARD_TUNING[string] + fret));
      if (!tone) continue;
      const inVoicing = voicing ? voicing.frets[string] === fret : null;
      svg += renderNote(layout, string, fret, displayLabel(tone.label), inVoicing);
    }
  }
  return svg;
}

// Draws one note marker. `inVoicing` is true / false with a voicing, or null without one.
function renderNote(layout, string, fret, label, inVoicing) {
  const classes = ['neck-note'];
  if (label === 'R') classes.push('neck-note--root');
  if (inVoicing === true) classes.push('neck-note--active');
  if (inVoicing === false) classes.push('neck-note--dim');
  const x = noteX(layout, fret);
  const y = stringY(layout, string);
  const radius = inVoicing ? 13 : 11;
  return `<g class="${classes.join(' ')}"><circle cx="${x}" cy="${y}" r="${radius}"/><text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${label}</text></g>`;
}

// Writes the fret numbers under the neck.
function renderFretNumbers(layout) {
  const y = layout.top + layout.stringGap * 5 + 32;
  let svg = '';
  for (let fret = 0; fret <= LAST_FRET; fret++) {
    const isMarked = INLAY_FRETS.includes(fret) || fret === DOUBLE_INLAY_FRET;
    svg += `<text class="neck-fret-number${isMarked ? ' neck-fret-number--marked' : ''}" x="${noteX(layout, fret)}" y="${y}" text-anchor="middle">${fret}</text>`;
  }
  return svg;
}

// ─── Accessibility ───

// Describes the neck for screen readers.
function describe(root, quality, voicing, leftHanded) {
  const notes = chordTones(root, quality).map((tone) => tone.note).join(', ');
  let text = `${chordSymbol(root, quality)} chord tones (${notes}) on frets 0 to ${LAST_FRET}`;
  if (voicing) text += `. Highlighted shape: ${voicing.name}`;
  if (leftHanded) text += '. Drawn left-handed';
  return text;
}
