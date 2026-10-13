// Tests for the theory scaffold (TEMPO_PLAN.md section 9): the ten topics load in order,
// topic 1's files are complete and correct, the Markdown renderer is safe, exercises ask
// questions whose answers really are on the neck, and progress marks a topic done.

import { describe, it, expect } from 'vitest';
import { getTopics, getTopic, findTopicProblems } from '../src/lessons/content.js';
import { renderMarkdown, renderInline, parseEmbed } from '../src/lessons/markdown.js';
import { marksFromNotes, marksFromList } from '../src/lessons/embeds.js';
import { makeExerciseQuestion, isCorrect, noteLabel, pitchClassAt } from '../src/lessons/exercises.js';
import { recordTheoryRun, markLectureRead, topicProgress, bestRun } from '../src/lessons/progress.js';
import { makeRandom } from '../src/ear/common.js';
import { createEmptyState, normalizeState } from '../src/state/storage.js';
import { STANDARD_TUNING } from '../src/theory/notes.js';

// ─── Topics ───

describe('topics', () => {
  it('lists all ten plan topics in order, with topic 1 ready', () => {
    const topics = getTopics();
    expect(topics.map((topic) => topic.title)).toEqual([
      'Notes on the fretboard', 'Intervals', 'Major scale and keys', 'Chord construction',
      'Chords in a key and common progressions', 'Minor scales', 'Pentatonic and blues',
      'Circle of fifths', 'Modes', 'CAGED system',
    ]);
    expect(topics[0].ready).toBe(true);
    expect(topics.slice(1).every((topic) => !topic.ready)).toBe(true);
  });

  it('topic 1 has a lecture, exercises and a quiz with no problems', () => {
    const topic = getTopic('01-fretboard-notes');
    expect(findTopicProblems(topic)).toEqual([]);
    expect(topic.exercises.length).toBeGreaterThanOrEqual(3);
    expect(topic.quiz.length).toBeGreaterThanOrEqual(5);
  });

  it('every embed in the lecture draws', () => {
    const topic = getTopic('01-fretboard-notes');
    const embeds = topic.lecture.split('\n').filter((line) => line.startsWith('::')).map(parseEmbed);
    expect(embeds.length).toBeGreaterThan(0);
    for (const [name, options] of embeds) {
      expect(name).toBe('neck');
      const marks = options.marks ? marksFromList(options.marks) : marksFromNotes(options);
      expect(marks.length).toBeGreaterThan(0);
    }
  });
});

// ─── The lecture's facts ───

describe('lecture facts match the theory engine', () => {
  it('natural notes on the low E string sit at frets 0 1 3 5 7 8 10 12', () => {
    const marks = marksFromNotes({ strings: 'E', notes: 'E,F,G,A,B,C,D', frets: '0-12' });
    expect(marks.map((mark) => `${mark.label}${mark.fret}`)).toEqual(['E0', 'F1', 'G3', 'A5', 'B7', 'C8', 'D10', 'E12']);
  });

  it('octave pairs in the lecture are exactly one octave apart', () => {
    const marks = marksFromList('E:3:G,D:5:G,A:3:C,G:5:C');
    for (let index = 0; index < marks.length; index += 2) {
      const low = STANDARD_TUNING[marks[index].string] + marks[index].fret;
      const high = STANDARD_TUNING[marks[index + 1].string] + marks[index + 1].fret;
      expect(high - low).toBe(12);
    }
  });
});

// ─── Markdown ───

describe('markdown', () => {
  it('renders headings, lists, tips and inline styles', () => {
    const html = renderMarkdown('## Steps\n\n- one **bold**\n- two *soft*\n\n> a tip\n\n1. first\n\nPlain `code` and [a link](https://example.com).');
    expect(html).toContain('<h3 class="lesson__h3">Steps</h3>');
    expect(html).toContain('<li>one <strong>bold</strong></li>');
    expect(html).toContain('<aside class="lesson__tip">a tip</aside>');
    expect(html).toContain('<ol class="lesson__list"><li>first</li></ol>');
    expect(html).toContain('<code>code</code>');
    expect(html).toContain('<a href="https://example.com" target="_blank" rel="noopener">a link</a>');
  });

  it('escapes HTML and refuses non-web links', () => {
    expect(renderInline('<script>x</script>')).not.toContain('<');
    expect(renderInline('[bad](javascript:alert(1))')).not.toContain('href');
  });

  it('reads embed options, quoted or plain', () => {
    expect(parseEmbed('::neck strings=E,A caption="Low strings"')).toEqual(['neck', { strings: 'E,A', caption: 'Low strings' }]);
  });
});

// ─── Exercises ───

describe('exercises', () => {
  const random = makeRandom(5);
  const topic = getTopic('01-fretboard-notes');

  it('name-note: the answer is the note at the marked spot and is one of the options', () => {
    const exercise = topic.exercises.find((candidate) => candidate.type === 'name-note');
    for (let round = 0; round < 100; round++) {
      const question = makeExerciseQuestion(exercise, random);
      const [mark] = question.marks;
      expect(question.answer).toBe(String(pitchClassAt(mark.string, mark.fret)));
      expect(question.options.map((option) => option.value)).toContain(question.answer);
      expect(new Set(question.options.map((option) => option.value)).size).toBe(4);
      expect(isCorrect(question, question.answer)).toBe(true);
    }
  });

  it('find-note: every target is that note, on the asked string', () => {
    const exercise = topic.exercises.find((candidate) => candidate.type === 'find-note');
    for (let round = 0; round < 100; round++) {
      const question = makeExerciseQuestion(exercise, random);
      const [string] = question.inputStrings;
      const names = new Set(question.targets.map((target) => noteLabel(pitchClassAt(target.string, target.fret))));
      expect(names.size).toBe(1);
      expect(question.prompt).toContain([...names][0]);
      expect(question.targets.every((target) => target.string === string)).toBe(true);
      expect(question.targets.every((target) => target.fret <= question.maxFret)).toBe(true);
      expect(isCorrect(question, question.targets[0])).toBe(true);
      expect(isCorrect(question, { string, fret: (question.targets[0].fret + 1) % 13 })).toBe(false);
    }
  });

  it('octave: the target is 12 semitones above the marked note', () => {
    const exercise = topic.exercises.find((candidate) => candidate.type === 'octave');
    for (let round = 0; round < 100; round++) {
      const question = makeExerciseQuestion(exercise, random);
      const [mark] = question.marks;
      const [target] = question.targets;
      expect(STANDARD_TUNING[target.string] + target.fret - (STANDARD_TUNING[mark.string] + mark.fret)).toBe(12);
      expect(noteLabel(pitchClassAt(mark.string, mark.fret))).toHaveLength(1);
      expect(target.fret).toBeLessThanOrEqual(question.maxFret);
    }
  });

  it('names notes between letters with both spellings', () => {
    expect(noteLabel(0)).toBe('C');
    expect(noteLabel(6)).toBe('F♯ / G♭');
  });
});

// ─── Progress ───

describe('theory progress', () => {
  it('a topic is done after the lesson, a pass on every exercise and a quiz pass', () => {
    const state = createEmptyState();
    const topic = getTopic('01-fretboard-notes');
    expect(topicProgress(state.theory.results, topic)).toMatchObject({ stepsDone: 0, done: false });

    markLectureRead(state, topic.id);
    markLectureRead(state, topic.id);
    for (const exercise of topic.exercises) recordTheoryRun(state, { topic: topic.id, part: 'exercise', id: exercise.id, score: 7, total: 8 });
    recordTheoryRun(state, { topic: topic.id, part: 'quiz', id: 'quiz', score: 5, total: 9 });
    expect(topicProgress(state.theory.results, topic)).toMatchObject({ lectureRead: true, exercisesPassed: topic.exercises.length, quizPassed: false, done: false });

    recordTheoryRun(state, { topic: topic.id, part: 'quiz', id: 'quiz', score: 8, total: 9 });
    expect(bestRun(state.theory.results, topic.id, 'quiz', 'quiz')).toMatchObject({ score: 8, total: 9 });
    expect(topicProgress(state.theory.results, topic).done).toBe(true);
    expect(state.theory.results.filter((result) => result.part === 'lecture')).toHaveLength(1);
  });

  it('older saved data without theory results still loads', () => {
    const old = createEmptyState();
    delete old.theory;
    expect(normalizeState(old).theory).toEqual({ results: [] });
  });
});
