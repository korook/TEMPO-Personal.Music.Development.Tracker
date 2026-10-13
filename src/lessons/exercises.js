// Theory exercises (TEMPO_PLAN.md section 9). A topic's exercises.json only names an exercise
// type and its settings; the questions are generated here from the shared theory engine, so
// every answer is worked out, never typed in by hand. Types:
//   name-note  a note is marked on the neck: which note is it?
//   find-note  tap a named note on a given string
//   octave     a note is marked: tap the same note an octave higher, two strings up
// A question: { type, prompt, marks, inputStrings, maxFret, options?, answer?, targets?, explain }.
// Choice questions are answered with an option value; tap questions with { string, fret }.

import { SHARP_NAMES, STANDARD_TUNING, STRING_NAMES, mod12 } from '../theory/notes.js';
import { pick } from '../ear/common.js';

const NATURAL_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11];
const OPTION_COUNT = 4;

// ─── Note names ───

// Returns how a note is shown: "C", or "C♯ / D♭" for the notes between the letters.
export function noteLabel(pitchClass) {
  const sharp = SHARP_NAMES[mod12(pitchClass)];
  if (sharp.length === 1) return sharp;
  const flat = SHARP_NAMES[mod12(pitchClass + 1)];
  return `${sharp[0]}♯ / ${flat}♭`;
}

// Returns the string index for a name like "E" (low E), "A" or "e" (high e).
export function stringIndex(name) {
  const index = STRING_NAMES.indexOf(name);
  if (index < 0) throw new Error(`Unknown string "${name}". Use one of ${STRING_NAMES.join(', ')}.`);
  return index;
}

// Describes a string for prompts: "low E string", "A string", "high e string".
export function stringLabel(index) {
  if (index === 0) return 'low E string';
  if (index === 5) return 'high e string';
  return `${STRING_NAMES[index]} string`;
}

// The pitch class at a string and fret.
export function pitchClassAt(string, fret) {
  return mod12(STANDARD_TUNING[string] + fret);
}

// ─── Building questions ───

// The exercise types and how they build one question from their settings.
export const EXERCISE_TYPES = {
  'name-note': makeNameNote,
  'find-note': makeFindNote,
  octave: makeOctave,
};

// Builds one question for an exercise from exercises.json.
export function makeExerciseQuestion(exercise, random = Math.random) {
  const build = EXERCISE_TYPES[exercise.type];
  if (!build) throw new Error(`Unknown exercise type "${exercise.type}".`);
  return build(settingsFor(exercise), random);
}

// Fills in the defaults for an exercise's settings.
function settingsFor(exercise) {
  const [lowFret, highFret] = exercise.frets || [0, 12];
  return {
    strings: (exercise.strings || ['E', 'A']).map(stringIndex),
    lowFret,
    highFret,
    naturalOnly: exercise.naturalOnly !== false,
  };
}

// Picks a fret on a string inside the range (only natural notes when asked).
function pickFret(string, { lowFret, highFret, naturalOnly }, random) {
  const frets = [];
  for (let fret = lowFret; fret <= highFret; fret++) {
    if (!naturalOnly || NATURAL_PITCH_CLASSES.includes(pitchClassAt(string, fret))) frets.push(fret);
  }
  return pick(frets, random);
}

// name-note: one marked note, four names to choose from.
function makeNameNote(settings, random) {
  const string = pick(settings.strings, random);
  const fret = pickFret(string, settings, random);
  const answer = pitchClassAt(string, fret);
  const pool = settings.naturalOnly ? NATURAL_PITCH_CLASSES : [...Array(12).keys()];
  const options = [answer];
  while (options.length < OPTION_COUNT) {
    const candidate = pick(pool, random);
    if (!options.includes(candidate)) options.push(candidate);
  }
  options.sort((a, b) => a - b);
  return {
    type: 'name-note',
    prompt: `Which note is marked on the ${stringLabel(string)}?`,
    marks: [{ string, fret, label: '?', kind: 'question' }],
    inputStrings: [],
    maxFret: settings.highFret,
    options: options.map((pitchClass) => ({ value: String(pitchClass), label: noteLabel(pitchClass) })),
    answer: String(answer),
    reveal: [{ string, fret, label: noteLabel(answer).split(' ')[0], kind: 'right' }],
    explain: `${fret === 0 ? 'The open' : `Fret ${fret} on the`} ${stringLabel(string)} is ${noteLabel(answer)}.`,
  };
}

// find-note: a named note, tapped on one string.
function makeFindNote(settings, random) {
  const string = pick(settings.strings, random);
  const answer = pitchClassAt(string, pickFret(string, settings, random));
  const targets = [];
  for (let fret = settings.lowFret; fret <= settings.highFret; fret++) {
    if (pitchClassAt(string, fret) === answer) targets.push({ string, fret });
  }
  const name = noteLabel(answer);
  return {
    type: 'find-note',
    prompt: `Tap ${name} on the ${stringLabel(string)}.`,
    marks: [],
    inputStrings: [string],
    maxFret: settings.highFret,
    targets,
    reveal: targets.map((target) => ({ ...target, label: name.split(' ')[0], kind: 'right' })),
    explain: `${name} is at ${targets.map((target) => (target.fret === 0 ? 'the open string' : `fret ${target.fret}`)).join(' and ')} on the ${stringLabel(string)}.`,
  };
}

// octave: a marked note on the low E or A string; tap its octave two strings up, two frets higher.
function makeOctave(settings, random) {
  const strings = settings.strings.filter((string) => string <= 1);
  const string = pick(strings.length ? strings : [0, 1], random);
  const fret = pickFret(string, { ...settings, highFret: Math.min(settings.highFret, 10) }, random);
  const target = { string: string + 2, fret: fret + 2 };
  const name = noteLabel(pitchClassAt(string, fret)).split(' ')[0];
  return {
    type: 'octave',
    prompt: `Here is ${name}. Tap the ${name} one octave higher on the ${stringLabel(string + 2)}.`,
    marks: [{ string, fret, label: name, kind: 'root' }],
    inputStrings: [string + 2],
    maxFret: Math.max(settings.highFret, target.fret),
    targets: [target],
    reveal: [{ ...target, label: name, kind: 'right' }],
    explain: `Two strings up and two frets higher: fret ${target.fret} on the ${stringLabel(string + 2)}.`,
  };
}

// ─── Checking ───

// True when an answer is right: an option value for name-note, a tapped { string, fret } otherwise.
export function isCorrect(question, answer) {
  if (question.type === 'name-note') return answer === question.answer;
  return question.targets.some((target) => target.string === answer.string && target.fret === answer.fret);
}
