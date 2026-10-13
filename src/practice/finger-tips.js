// Finger-aware fix tips (TEMPO_PLAN.md 17.4, item 4). The chord shape knows which finger
// frets each string, so a buzz or a mute can name the finger and the spot:
//   "Index finger on the B string, fret 1, is buzzing: …"
// A string that is muted by accident is usually touched by the finger on the next thicker
// string, so the mute tip names that finger. All wording lives in TIP_WORDING for Baranay
// to review and change.

import { TAG_STRINGS, parseMistake, tipForMistake } from '../data/mistake-tips.js';

// ─── Wording ───

export const FINGER_NAMES = { 1: 'Index', 2: 'Middle', 3: 'Ring', 4: 'Little' };

// Every sentence the tips are built from. {finger}, {string}, {fret} are filled in.
export const TIP_WORDING = {
  buzzFretted: '{finger} finger on the {string} string, fret {fret}, is buzzing: press just behind the fret on the very tip, and roll it slightly toward the headstock.',
  buzzBarre: 'Your barre on the {string} string, fret {fret}, is buzzing: roll the index finger a little onto its bony edge and keep it right behind the fret.',
  buzzOpen: 'The open {string} string is buzzing: a finger is probably brushing it. Arch the fingers next to it so they stand on their tips.',
  muteOwn: '{finger} finger on the {string} string, fret {fret}, isn\'t sounding: come down on the tip, right behind the fret, so the pad doesn\'t touch the string beside it.',
  muteNeighbour: 'The {string} string is muted: your {finger} finger on the {neighbourString} string, fret {fret}, is probably leaning on it. Arch that finger so only its tip touches its own string.',
  muteOpen: 'The open {string} string is muted: a fretting finger is lying on it. Arch your fingers and keep your palm off the neck.',
};

// Fills the {placeholders} in one sentence.
function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (whole, key) => (values[key] !== undefined ? values[key] : whole));
}

// ─── Reading the shape ───

// Who frets a string in a shape: { fret, finger, barre } (fret 0 = open, null = not played).
export function fingerOnString(voicing, string) {
  const fret = voicing.frets[string];
  if (fret === null || fret === undefined) return { fret: null, finger: null, barre: false };
  if (fret === 0) return { fret: 0, finger: null, barre: false };
  const barre = voicing.barre;
  const inBarre = Boolean(barre && barre.fret === fret && string >= barre.fromString && string <= barre.toString && voicing.fingers[string] === 1);
  return { fret, finger: voicing.fingers[string] || null, barre: inBarre };
}

// The finger most likely muting a string: the one on the next thicker string, else the next thinner.
function neighbourFinger(voicing, string) {
  for (const other of [string - 1, string + 1]) {
    if (other < 0 || other > 5) continue;
    const on = fingerOnString(voicing, other);
    if (on.finger) return { ...on, string: other };
  }
  return null;
}

// ─── Tips ───

// Returns the tip for a mistake tag in a shape, e.g. ("buzz:B", C open) → "Index finger on the B
// string, fret 1, is buzzing: …". Falls back to the general tip without a shape or a string.
export function fingerTip(tag, voicing) {
  const { kind, string: stringName } = parseMistake(tag);
  const string = TAG_STRINGS.indexOf(stringName);
  if (!voicing || string < 0 || (kind !== 'buzz' && kind !== 'mute')) return tipForMistake(tag);
  const on = fingerOnString(voicing, string);
  const base = { string: stringName, fret: on.fret, finger: FINGER_NAMES[on.finger] };

  if (kind === 'buzz') {
    if (on.fret === 0) return fill(TIP_WORDING.buzzOpen, base);
    if (on.barre) return fill(TIP_WORDING.buzzBarre, base);
    if (on.finger) return fill(TIP_WORDING.buzzFretted, base);
    return tipForMistake(tag);
  }
  if (on.finger && on.fret > 0) return fill(TIP_WORDING.muteOwn, base);
  const neighbour = neighbourFinger(voicing, string);
  if (neighbour) {
    return fill(TIP_WORDING.muteNeighbour, { string: stringName, finger: FINGER_NAMES[neighbour.finger].toLowerCase(), neighbourString: TAG_STRINGS[neighbour.string], fret: neighbour.fret });
  }
  if (on.fret === 0) return fill(TIP_WORDING.muteOpen, base);
  return tipForMistake(tag);
}

// Which finger a buzz or mute tag points at in a shape (the finger that should change), or null.
export function fingerForMistake(tag, voicing) {
  const { kind, string: stringName } = parseMistake(tag);
  const string = TAG_STRINGS.indexOf(stringName);
  if (!voicing || string < 0) return null;
  const on = fingerOnString(voicing, string);
  if (kind === 'buzz') return on.finger;
  if (kind === 'mute') return on.finger && on.fret > 0 ? on.finger : (neighbourFinger(voicing, string) || {}).finger || null;
  return null;
}
