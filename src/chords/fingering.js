// Finger assignment for chord shapes: works out which finger plays each fretted note,
// finds the barre, and checks that a given fingering actually fits the frets.
//
// Frets are given per string, low E (0) to high e (5): null = not played, 0 = open, n = fret.
// Fingers use the same order: 0 = no finger, 1 = index, 2 = middle, 3 = ring, 4 = pinky.

const MAX_FINGERS = 4;

// ─── Assigning fingers ───

// Returns { fingers, barre } for a shape, or null if it can't be played with 4 fingers
// and at most one barre. Tries without a barre first, then with an index-finger barre.
export function computeFingering(frets) {
  const fretted = frettedNotes(frets);
  if (fretted.length === 0) return { fingers: frets.map(() => 0), barre: null };
  return fingerWithoutBarre(frets, fretted) || fingerWithBarre(frets, fretted);
}

// Gives every fretted note its own finger, if four are enough.
function fingerWithoutBarre(frets, fretted) {
  if (fretted.length > MAX_FINGERS) return null;
  const fingers = frets.map(() => 0);
  if (!assignInFretOrder(fingers, fretted, lowestFret(fretted), 1)) return null;
  return { fingers, barre: null };
}

// Lays the index finger across every string at the lowest fret, then fingers the rest.
function fingerWithBarre(frets, fretted) {
  const barreFret = lowestFret(fretted);
  const onBarreFret = fretted.filter((note) => note.fret === barreFret).map((note) => note.string);
  const fromString = Math.min(...onBarreFret);
  const toString = Math.max(...onBarreFret);
  if (fromString === toString) return null;
  if (!barreCanCover(frets, fromString, toString, barreFret)) return null;

  const fingers = frets.map(() => 0);
  for (let string = fromString; string <= toString; string++) {
    if (frets[string] === barreFret) fingers[string] = 1;
  }
  const rest = fretted.filter((note) => fingers[note.string] === 0);
  if (!assignInFretOrder(fingers, rest, barreFret, 2)) return null;
  return { fingers, barre: { finger: 1, fret: barreFret, fromString, toString } };
}

// Gives fingers to notes from the lowest fret up, one finger per fret where possible
// (e.g. frets 1-2-3 get fingers 1-2-3). Returns false if it needs more than 4 fingers.
function assignInFretOrder(fingers, notes, baseFret, firstFinger) {
  const ordered = [...notes].sort((a, b) => a.fret - b.fret || a.string - b.string);
  let previousFinger = firstFinger - 1;
  for (const note of ordered) {
    const finger = Math.max(previousFinger + 1, firstFinger, 1 + note.fret - baseFret);
    if (finger > MAX_FINGERS) return false;
    fingers[note.string] = finger;
    previousFinger = finger;
  }
  return true;
}

// ─── Checking a fingering ───

// Checks that `fingers` can really play `frets`. Returns a list of problems (empty = fine).
// Rules: fretted notes need a finger and open/muted strings don't; one finger can't be on
// two frets; a finger on several strings is a barre (only one allowed), and every string
// under the barre must sound at or above the barre fret.
export function checkFingering(frets, fingers) {
  const problems = [];
  frets.forEach((fret, string) => {
    const needsFinger = Number.isInteger(fret) && fret > 0;
    if (needsFinger && !(fingers[string] >= 1 && fingers[string] <= MAX_FINGERS)) {
      problems.push(`string ${string} at fret ${fret} has no finger`);
    }
    if (!needsFinger && fingers[string] !== 0) {
      problems.push(`string ${string} is open or muted but has finger ${fingers[string]}`);
    }
  });

  let barreCount = 0;
  for (let finger = 1; finger <= MAX_FINGERS; finger++) {
    const strings = fingers.map((value, string) => (value === finger ? string : -1)).filter((string) => string >= 0);
    if (strings.length === 0) continue;
    const usedFrets = new Set(strings.map((string) => frets[string]));
    if (usedFrets.size > 1) problems.push(`finger ${finger} is on more than one fret`);
    if (strings.length > 1) {
      barreCount++;
      const fret = frets[strings[0]];
      if (!barreCanCover(frets, Math.min(...strings), Math.max(...strings), fret)) {
        problems.push(`finger ${finger} barre at fret ${fret} covers a string that is open, muted or lower`);
      }
    }
  }
  if (barreCount > 1) problems.push('more than one barre');
  return problems;
}

// Returns the barre in a fingering ({ finger, fret, fromString, toString }), or null.
export function findBarre(frets, fingers) {
  for (let finger = 1; finger <= MAX_FINGERS; finger++) {
    const strings = fingers.map((value, string) => (value === finger ? string : -1)).filter((string) => string >= 0);
    if (strings.length > 1) {
      return { finger, fret: frets[strings[0]], fromString: Math.min(...strings), toString: Math.max(...strings) };
    }
  }
  return null;
}

// Counts the fingers a fingering uses (a barre counts as one).
export function countFingers(fingers) {
  return new Set(fingers.filter((finger) => finger > 0)).size;
}

// ─── Helpers ───

// Returns the fretted notes of a shape as [{ string, fret }].
function frettedNotes(frets) {
  return frets
    .map((fret, string) => ({ string, fret }))
    .filter(({ fret }) => Number.isInteger(fret) && fret > 0);
}

// Returns the lowest fret among fretted notes.
function lowestFret(notes) {
  return Math.min(...notes.map((note) => note.fret));
}

// True if every string from `fromString` to `toString` is fretted at or above `fret`
// (a barre pressing an open or muted string would make it sound the barre note).
function barreCanCover(frets, fromString, toString, fret) {
  for (let string = fromString; string <= toString; string++) {
    if (!Number.isInteger(frets[string]) || frets[string] < fret) return false;
  }
  return true;
}
