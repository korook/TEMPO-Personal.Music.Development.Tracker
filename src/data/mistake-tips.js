// The mistakes a rep can be tagged with (TEMPO_PLAN.md 6.4), each with a short, practical fix.
// Baranay should read these through and adjust them to how he teaches himself.

// ─── Mistakes ───

// Each mistake: a label for buttons and a plain-language tip for the "Fix" opening.
// Per-string mistakes are stored as "buzz:B" or "mute:G".
export const MISTAKES = {
  buzz: { label: 'Buzzed', tip: 'Press just behind the fret, not on top of it, and come down on your fingertip.' },
  mute: { label: 'Muted by accident', tip: 'Arch the finger next to it so it only touches its own string.' },
  'strum-range': { label: 'Wrong strings strummed', tip: 'Aim the strum at the lowest string the chord uses and stop before the muted ones.' },
  'late-change': { label: 'Change was late', tip: 'Start moving on the last beat before the change, not on the new beat.' },
  timing: { label: 'Lost the beat', tip: 'Drop the metronome by 10 BPM and count out loud for a few bars.' },
  'finger-order': { label: 'Fingers landed one at a time', tip: 'Hover all fingers just above their spots first, then put them down together.' },
  tension: { label: 'Too much pressure', tip: 'Squeeze until the note is clean, then ease off a little. Let arm weight do the work.' },
};

// The string names used in tags, low E to high e.
export const TAG_STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];

// ─── Reading tags ───

// Splits a tag such as "buzz:B" into { kind: 'buzz', string: 'B' } (string is null for other tags).
export function parseMistake(tag) {
  const [kind, string = null] = tag.split(':');
  return { kind, string };
}

// Describes a tag in words, e.g. "buzz:B" → "B string buzzed".
export function describeMistake(tag) {
  const { kind, string } = parseMistake(tag);
  if (kind === 'buzz' && string) return `${string} string buzzed`;
  if (kind === 'mute' && string) return `${string} string muted`;
  return (MISTAKES[kind] && MISTAKES[kind].label) || tag;
}

// Returns the fix tip for a tag.
export function tipForMistake(tag) {
  const { kind } = parseMistake(tag);
  return MISTAKES[kind] ? MISTAKES[kind].tip : '';
}
