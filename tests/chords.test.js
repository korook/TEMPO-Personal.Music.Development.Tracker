// Validation tests for the chord engine (TEMPO_PLAN.md section 5.4).
// Every voicing of every chord (12 roots × 12 qualities) must:
//   - sound only chord tones, and every required tone;
//   - be named after its bass note (root, or a slash chord such as C/E);
//   - use at most 4 fingers (a barre counts as one) with a fingering that fits the frets;
//   - span at most 5 frets, and be tagged "stretch" when it spans exactly 5;
//   - have no muted string between sounding strings unless it is marked as damped.
// Plus regression tests for the shapes v1 got wrong, and neck coverage for every chord.

import { describe, it, expect } from 'vitest';
import { allChords, chordSymbol, chordTones } from '../src/theory/chords.js';
import { getVoicings, findVoicing, requiredLabels } from '../src/chords/voicings.js';
import { checkFingering, computeFingering, countFingers } from '../src/chords/fingering.js';
import { pitchClassAt } from '../src/chords/generator.js';
import { OPEN_SHAPES, MOVABLE_SHAPES } from '../src/chords/shapes.js';

const CHORDS = allChords();

// Writes frets as text for readable failure messages, e.g. "x-3-2-0-1-0".
function show(voicing) {
  return `${voicing.symbol} [${voicing.frets.map((fret) => (fret === null ? 'x' : fret)).join('-')}]`;
}

// Runs `check(voicing, chord)` on every voicing of every chord and returns the failures.
function failuresOf(check) {
  const failures = [];
  for (const chord of CHORDS) {
    for (const voicing of getVoicings(chord.root, chord.quality)) {
      const problem = check(voicing, chord);
      if (problem) failures.push(`${show(voicing)}: ${problem}`);
    }
  }
  return failures;
}

// ─── Section 5.4 rules ───

describe('every voicing of every chord', () => {
  it('sounds only chord tones', () => {
    const failures = failuresOf((voicing, chord) => {
      const allowed = new Set(chordTones(chord.root, chord.quality).map((tone) => tone.pitchClass));
      const wrong = voicing.frets.findIndex((fret, string) => fret !== null && !allowed.has(pitchClassAt(string, fret)));
      return wrong >= 0 ? `string ${wrong} is not a chord tone` : null;
    });
    expect(failures).toEqual([]);
  });

  it('contains every required tone', () => {
    const failures = failuresOf((voicing, chord) => {
      const present = new Set(voicing.intervals.filter(Boolean).map((label) => (label === 'R' ? '1' : label)));
      const missing = requiredLabels(chord.quality).filter((label) => !present.has(label));
      return missing.length ? `missing ${missing.join(', ')}` : null;
    });
    expect(failures).toEqual([]);
  });

  it('is named after its bass note', () => {
    const failures = failuresOf((voicing, chord) => {
      const bassString = voicing.frets.findIndex((fret) => fret !== null);
      const bassPitchClass = pitchClassAt(bassString, voicing.frets[bassString]);
      const bassTone = chordTones(chord.root, chord.quality).find((tone) => tone.pitchClass === bassPitchClass);
      const expected = chordSymbol(chord.root, chord.quality, bassTone.label === '1' ? null : bassTone.note);
      if (voicing.symbol !== expected) return `named ${voicing.symbol}, expected ${expected}`;
      if (!voicing.name.startsWith(`${expected} — `)) return `display name "${voicing.name}" doesn't start with ${expected}`;
      const isInversion = bassTone.label !== '1';
      if (isInversion === (voicing.inversion === 'root position')) return `inversion label "${voicing.inversion}" is wrong`;
      return null;
    });
    expect(failures).toEqual([]);
  });

  it('uses at most 4 fingers with a fingering that fits the frets', () => {
    const failures = failuresOf((voicing) => {
      const problems = checkFingering(voicing.frets, voicing.fingers);
      if (problems.length) return problems.join('; ');
      if (countFingers(voicing.fingers) > 4) return 'more than 4 fingers';
      if (voicing.fingerCount !== countFingers(voicing.fingers)) return 'finger count is wrong';
      return null;
    });
    expect(failures).toEqual([]);
  });

  it('keeps within the fret span limit and tags 5-fret shapes as a stretch', () => {
    const failures = failuresOf((voicing) => {
      if (voicing.span > 5) return `spans ${voicing.span} frets`;
      if (voicing.stretch !== (voicing.span === 5)) return 'stretch tag is wrong';
      if (voicing.frets.some((fret) => fret !== null && (fret < 0 || fret > 15))) return 'fret off the 0–15 range';
      return null;
    });
    expect(failures).toEqual([]);
  });

  it('has no muted string between sounding strings unless marked damped', () => {
    const failures = failuresOf((voicing) => {
      const sounding = voicing.frets.map((fret, string) => (fret === null ? -1 : string)).filter((string) => string >= 0);
      for (let string = sounding[0]; string <= sounding[sounding.length - 1]; string++) {
        if (voicing.frets[string] === null && !voicing.damped.includes(string)) return `string ${string} is muted in the middle`;
      }
      return null;
    });
    expect(failures).toEqual([]);
  });

  it('has a unique id within its chord', () => {
    for (const chord of CHORDS) {
      const ids = getVoicings(chord.root, chord.quality).map((voicing) => voicing.id);
      expect(new Set(ids).size, chord.symbol).toBe(ids.length);
    }
  });
});

// ─── Curated shapes ───

describe('curated shapes', () => {
  it('every open shape is a real chord with a valid fingering', () => {
    for (const shape of OPEN_SHAPES) {
      const voicing = findVoicing(shape.root, shape.quality, shape.frets);
      expect(voicing, `${shape.root} ${shape.quality} ${shape.frets}`).not.toBeNull();
      expect(voicing.source).toBe('standard');
      expect(voicing.shape).toBe('open');
    }
  });

  it('every movable template is used somewhere on the neck', () => {
    for (const [quality, templates] of Object.entries(MOVABLE_SHAPES)) {
      for (const template of templates) {
        const used = CHORDS.filter((chord) => chord.quality === quality).some((chord) => (
          getVoicings(chord.root, quality, { found: false }).some((voicing) => voicing.form === template.form)
        ));
        expect(used, `${quality} ${template.form}`).toBe(true);
      }
    }
  });
});

// ─── Regressions (the v1 bugs) ───

describe('regression shapes', () => {
  const cases = [
    ['C', 'major', 'x32010'],
    ['G', 'major', '320003'],
    ['A', 'minor', 'x02210'],
    ['D', 'major', 'xx0232'],
    ['E', 'major', '022100'],
  ];
  for (const [root, quality, frets] of cases) {
    it(`${chordSymbol(root, quality)} open is ${frets}`, () => {
      const voicing = findVoicing(root, quality, frets);
      expect(voicing).not.toBeNull();
      expect(voicing.symbol).toBe(chordSymbol(root, quality));
      expect(getVoicings(root, quality)[0].frets).toEqual(voicing.frets);
    });
  }

  it('F barre is 133211 (E-form at fret 1), not the reversed v1 shape', () => {
    const voicing = getVoicings('F', 'major').find((candidate) => candidate.shape === 'E-form barre' && candidate.position === 1);
    expect(voicing.frets).toEqual([1, 3, 3, 2, 1, 1]);
    expect(voicing.barre).toEqual({ finger: 1, fret: 1, fromString: 0, toString: 5 });
    expect(voicing.name).toBe('F — E-form barre, fret 1');
    expect(findVoicing('F', 'major', '112331')).toBeNull();
  });

  it('C is not the reversed v1 shape x01023', () => {
    expect(getVoicings('C', 'major').some((voicing) => voicing.frets.join() === [null, 0, 1, 0, 2, 3].join())).toBe(false);
  });

  it('C7 open is x32310 and shows the 5th as omitted', () => {
    const voicing = findVoicing('C', 'dominant7', 'x32310');
    expect(voicing.omitted).toEqual(['5']);
    expect(voicing.intervals).toEqual([null, 'R', '3', 'b7', 'R', '3']);
  });

  it('G open fingering matches its tip: pinky on the high E', () => {
    expect(findVoicing('G', 'major', '320003').fingers).toEqual([2, 1, 0, 0, 0, 4]);
  });

  it('names a C-major triad with E in the bass as C/E, 1st inversion', () => {
    const voicing = getVoicings('C', 'major').find((candidate) => candidate.symbol === 'C/E' && candidate.shape.startsWith('triad'));
    expect(voicing.inversion).toBe('1st inversion');
    expect(voicing.name).toMatch(/^C\/E — triad on .+, 1st inversion, (fret \d+|open position)$/);
  });

  it('spells flat-key chords with flats', () => {
    expect(new Set(getVoicings('Bb', 'major')[0].notes.filter(Boolean))).toEqual(new Set(['Bb', 'D', 'F']));
  });
});

// ─── Coverage ───

describe('coverage across the neck', () => {
  it('gives every chord at least 5 voicings spread over the neck', () => {
    const thin = [];
    for (const chord of CHORDS) {
      const voicings = getVoicings(chord.root, chord.quality);
      const positions = new Set(voicings.map((voicing) => voicing.position));
      const highest = Math.max(...voicings.map((voicing) => voicing.position));
      if (voicings.length < 5 || positions.size < 3 || highest < 7) {
        thin.push(`${chord.symbol}: ${voicings.length} voicings at frets ${[...positions].sort((a, b) => a - b).join(',')}`);
      }
    }
    expect(thin).toEqual([]);
  });

  it('lists standard shapes before found ones, each ordered from the nut up', () => {
    for (const chord of CHORDS) {
      const voicings = getVoicings(chord.root, chord.quality);
      const firstFound = voicings.findIndex((voicing) => voicing.source === 'found');
      const standard = firstFound < 0 ? voicings : voicings.slice(0, firstFound);
      const found = firstFound < 0 ? [] : voicings.slice(firstFound);
      expect(found.every((voicing) => voicing.source === 'found'), chord.symbol).toBe(true);
      for (const list of [standard, found]) {
        for (let index = 1; index < list.length; index++) {
          expect(list[index].position, chord.symbol).toBeGreaterThanOrEqual(list[index - 1].position);
        }
      }
    }
  });
});

// ─── Fingering helper ───

describe('computeFingering', () => {
  it('fingers open C as 3-2-1 from the A string', () => {
    expect(computeFingering([null, 3, 2, 0, 1, 0]).fingers).toEqual([0, 3, 2, 0, 1, 0]);
  });

  it('uses a barre for F and finds it', () => {
    const result = computeFingering([1, 3, 3, 2, 1, 1]);
    expect(result.barre).toEqual({ finger: 1, fret: 1, fromString: 0, toString: 5 });
    expect(result.fingers).toEqual([1, 3, 4, 2, 1, 1]);
  });

  it('refuses shapes that need five fingers and no barre', () => {
    expect(computeFingering([1, 3, 3, 2, 4, 1])).toBeNull();
  });

  it('rejects a barre across an open string', () => {
    expect(checkFingering([1, 3, 0, 2, 1, 1], [1, 3, 0, 2, 1, 1]).length).toBeGreaterThan(0);
  });
});
