// Tests for finger-aware fix tips (TEMPO_PLAN.md 17.4, item 4): a buzz or mute names the
// finger and the spot from the shape's fingering.

import { describe, it, expect } from 'vitest';
import { fingerTip, fingerForMistake, fingerOnString } from '../src/practice/finger-tips.js';
import { getVoicingsForSymbol } from '../src/chords/voicings.js';

const shape = (symbol, frets) => getVoicingsForSymbol(symbol).find((voicing) => voicing.frets.map((fret) => (fret === null ? 'x' : fret)).join('') === frets);

describe('finger-aware tips', () => {
  const cOpen = shape('C', 'x32010');
  const fBarre = shape('F', '133211');

  it('reads who frets each string', () => {
    expect(fingerOnString(cOpen, 1)).toEqual({ fret: 3, finger: 3, barre: false });
    expect(fingerOnString(cOpen, 3)).toEqual({ fret: 0, finger: null, barre: false });
    expect(fingerOnString(fBarre, 4)).toEqual({ fret: 1, finger: 1, barre: true });
  });

  it('names the finger and fret for a buzz', () => {
    expect(fingerTip('buzz:B', cOpen)).toBe('Index finger on the B string, fret 1, is buzzing: press just behind the fret on the very tip, and roll it slightly toward the headstock.');
    expect(fingerTip('buzz:B', fBarre)).toMatch(/^Your barre on the B string, fret 1, is buzzing/);
    expect(fingerTip('buzz:G', cOpen)).toMatch(/^The open G string is buzzing/);
    expect(fingerForMistake('buzz:A', cOpen)).toBe(3);
  });

  it('blames the neighbouring finger for a muted open string', () => {
    expect(fingerTip('mute:G', cOpen)).toBe('The G string is muted: your middle finger on the D string, fret 2, is probably leaning on it. Arch that finger so only its tip touches its own string.');
    expect(fingerForMistake('mute:G', cOpen)).toBe(2);
    expect(fingerTip('mute:D', cOpen)).toMatch(/^Middle finger on the D string, fret 2, isn't sounding/);
  });

  it('falls back to the general tip without a shape', () => {
    expect(fingerTip('buzz:B', null)).toBe('Press just behind the fret, not on top of it, and come down on your fingertip.');
    expect(fingerTip('timing', cOpen)).toMatch(/metronome/);
  });
});
