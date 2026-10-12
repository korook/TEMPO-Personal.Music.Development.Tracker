// Tests for the Chords page organisation: A–G categories and the thumbnail shapes.

import { describe, it, expect } from 'vitest';
import {
  CATEGORY_LETTERS,
  getCategory,
  categoryOfRoot,
  thumbnailVoicing,
  categoriesCoverEveryRoot,
  prettyAccidentals,
} from '../src/chords/library.js';

// Writes frets as text, e.g. [null, 3, 2, 0, 1, 0] → "x32010" (two-digit frets are joined with dashes).
function fretText(frets) {
  const parts = frets.map((fret) => (fret === null ? 'x' : String(fret)));
  return parts.some((part) => part.length > 1) ? parts.join('-') : parts.join('');
}

describe('categories', () => {
  it('runs A to G and covers every root exactly once', () => {
    expect(CATEGORY_LETTERS).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(categoriesCoverEveryRoot()).toBe(true);
  });

  it('puts sharps and flats with their letter', () => {
    expect(categoryOfRoot('C#')).toBe('C');
    expect(categoryOfRoot('Db')).toBe('C');
    expect(categoryOfRoot('Eb')).toBe('E');
    expect(categoryOfRoot('F#')).toBe('F');
    expect(categoryOfRoot('Ab')).toBe('A');
    expect(categoryOfRoot('G#')).toBe('A');
    expect(categoryOfRoot('Bb')).toBe('B');
  });

  it('lists all 14 chord types for every root, natural row first', () => {
    const rows = getCategory('C');
    expect(rows.map((row) => row.label)).toEqual(['C', 'C♯ / D♭']);
    expect(rows[0].chords).toHaveLength(14);
    expect(rows[0].chords.map((chord) => chord.symbol)).toContain('Cm6');
    expect(rows[1].chords.map((chord) => chord.symbol)).toEqual(expect.arrayContaining(['Db', 'C#m', 'Db7', 'C#m7']));
  });

  it('writes accidentals with proper signs', () => {
    expect(prettyAccidentals('Bb')).toBe('B♭');
    expect(prettyAccidentals('F#m7b5')).toBe('F♯m7♭5');
  });
});

describe('thumbnails', () => {
  it('shows the open shape when there is one', () => {
    expect(fretText(thumbnailVoicing('C', 'major').frets)).toBe('x32010');
    expect(fretText(thumbnailVoicing('A', 'minor').frets)).toBe('x02210');
    expect(fretText(thumbnailVoicing('G', 'dominant7').frets)).toBe('320001');
    expect(fretText(thumbnailVoicing('C', 'major6').frets)).toBe('x32210');
  });

  it('falls back to a full barre shape, not a triad', () => {
    expect(fretText(thumbnailVoicing('F', 'major').frets)).toBe('133211');
    expect(fretText(thumbnailVoicing('Bb', 'major').frets)).toBe('x13331');
    expect(thumbnailVoicing('F#', 'minor').shape).toMatch(/form/);
    expect(fretText(thumbnailVoicing('C', 'minor7').frets)).toBe('x35343');
  });

  it('has a thumbnail for every chord on the page', () => {
    for (const letter of CATEGORY_LETTERS) {
      for (const row of getCategory(letter)) {
        for (const chord of row.chords) {
          expect(thumbnailVoicing(chord.root, chord.quality), chord.symbol).toBeTruthy();
        }
      }
    }
  });
});
