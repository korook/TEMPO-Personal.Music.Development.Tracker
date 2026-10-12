// Draws a v1 chord box diagram as an SVG string: nut, 5 frets, 6 strings,
// open/muted markers above the nut and coloured finger dots.
// Phase 3 replaces this with the new diagram (barre bar, intervals, left-handed mirror).

import { CHORDS_V1, STRING_NAMES, STRING_COLOURS } from '../data/chords-v1.js';

// ─── Rendering ───

// Returns the SVG markup for the chord `chordKey`, `size` pixels wide.
export function renderChordDiagram(chordKey, size = 180) {
  const chord = CHORDS_V1[chordKey];
  if (!chord) return '';

  const layout = getDiagramLayout(size);
  let svg = `<svg width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += renderGrid(layout);
  svg += renderOpenAndMutedMarkers(chord, layout);
  svg += renderFingerDots(chord, layout);
  svg += renderStringLabels(layout);
  return svg + '</svg>';
}

// ─── Layout ───

// Works out the drawing size, padding and the spacing between strings and frets.
function getDiagramLayout(size) {
  const width = size;
  const height = size * 1.15;
  const padX = 24;
  const padY = 32;
  return {
    width,
    height,
    padX,
    padY,
    stringGap: (width - 2 * padX) / 5,
    fretGap: (height - padY - 20) / 5,
  };
}

// Returns the x position of a string (0 = low E).
function stringX(layout, stringIndex) {
  return layout.padX + stringIndex * layout.stringGap;
}

// ─── Parts of the diagram ───

// Draws the nut, the 5 fret lines and the 6 strings (thicker for lower strings).
function renderGrid(layout) {
  const { width, padX, padY, fretGap } = layout;
  let svg = `<rect x="${padX - 1}" y="${padY - 2}" width="${(width - 2 * padX) + 2}" height="4" rx="1" fill="#888"/>`;
  for (let fret = 1; fret <= 5; fret++) {
    const y = padY + fret * fretGap;
    svg += `<line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" stroke="#444" stroke-width="0.5"/>`;
  }
  for (let string = 0; string < 6; string++) {
    const x = stringX(layout, string);
    svg += `<line x1="${x}" y1="${padY}" x2="${x}" y2="${padY + 5 * fretGap}" stroke="#666" stroke-width="${1.6 - string * 0.18}"/>`;
  }
  return svg;
}

// Draws ✕ above muted strings and ○ above open strings.
function renderOpenAndMutedMarkers(chord, layout) {
  let svg = '';
  for (let string = 0; string < 6; string++) {
    const x = stringX(layout, string);
    if (chord.muted[string]) {
      svg += `<text x="${x}" y="${layout.padY - 10}" text-anchor="middle" font-size="12" font-weight="500" fill="#777" font-family="Plus Jakarta Sans,sans-serif">✕</text>`;
    } else if (chord.frets[string] === 0) {
      svg += `<circle cx="${x}" cy="${layout.padY - 12}" r="5" fill="none" stroke="#aaa" stroke-width="1.5"/>`;
    }
  }
  return svg;
}

// Draws a coloured dot on each fretted string, with the finger number inside.
function renderFingerDots(chord, layout) {
  let svg = '';
  for (let string = 0; string < 6; string++) {
    const fret = chord.frets[string];
    if (fret === 0 || fret === 'x') continue;
    const x = stringX(layout, string);
    const y = layout.padY + (fret - 0.5) * layout.fretGap;
    const radius = Math.min(layout.stringGap, layout.fretGap) * 0.3;
    svg += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${STRING_COLOURS[string]}"/>`;
    if (chord.fingers[string]) {
      svg += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="10" font-weight="600" fill="#fff" font-family="DM Mono,monospace">${chord.fingers[string]}</text>`;
    }
  }
  return svg;
}

// Writes the string names (E A D G B e) under the diagram.
function renderStringLabels(layout) {
  let svg = '';
  for (let string = 0; string < 6; string++) {
    svg += `<text x="${stringX(layout, string)}" y="${layout.height - 2}" text-anchor="middle" font-size="9" fill="#666" font-family="DM Mono,monospace">${STRING_NAMES[string]}</text>`;
  }
  return svg;
}
