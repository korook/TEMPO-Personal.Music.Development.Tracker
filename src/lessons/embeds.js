// The pictures a lecture can embed with a "::name" line (see markdown.js). For now one kind:
//   ::neck strings=E,A notes=C,D,E frets=0-12 caption="..."   every C, D and E on those strings
//   ::neck marks="E:3:G,D:5:G" caption="..."                   exact spots (string:fret:label)
// Unknown embeds show a small note instead of failing, so a typo in a lesson is easy to spot.

import { renderNeckMarks } from '../components/neck.js';
import { noteNameToPitchClass } from '../theory/notes.js';
import { escapeHtml } from '../utils/html.js';
import { stringIndex, pitchClassAt } from './exercises.js';

// ─── Rendering ───

// Returns the HTML for one embed. `leftHanded` mirrors the neck.
export function renderLessonEmbed(name, options, { leftHanded = false } = {}) {
  if (name !== 'neck') return `<p class="lesson__missing">Unknown picture "::${escapeHtml(name || '')}".</p>`;
  const marks = options.marks ? marksFromList(options.marks) : marksFromNotes(options);
  const caption = options.caption || '';
  return `
    <figure class="lesson__figure">
      ${renderNeckMarks(marks, { leftHanded, description: caption || 'Fretboard' })}
      ${caption ? `<figcaption class="lesson__caption">${escapeHtml(caption)}</figcaption>` : ''}
    </figure>`;
}

// Turns "E:3:G,D:5:G" into marks, read in pairs: a starting note (drawn as the root) and its partner.
export function marksFromList(list) {
  return list.split(',').map((entry, index) => {
    const [stringName, fret, label] = entry.trim().split(':');
    return { string: stringIndex(stringName), fret: Number(fret), label, kind: index % 2 === 0 ? 'root' : 'active' };
  });
}

// Marks every listed note on the listed strings within the fret range.
export function marksFromNotes({ strings = 'E', notes = '', frets = '0-12' }) {
  const [lowFret, highFret] = frets.split('-').map(Number);
  const wanted = notes.split(',').filter(Boolean).map((note) => ({ name: note.trim(), pitchClass: noteNameToPitchClass(note.trim()) }));
  const marks = [];
  for (const string of strings.split(',').map((name) => stringIndex(name.trim()))) {
    for (let fret = lowFret; fret <= highFret; fret++) {
      const note = wanted.find((candidate) => candidate.pitchClass === pitchClassAt(string, fret));
      if (note) marks.push({ string, fret, label: note.name, kind: note === wanted[0] ? 'root' : 'active' });
    }
  }
  return marks;
}
