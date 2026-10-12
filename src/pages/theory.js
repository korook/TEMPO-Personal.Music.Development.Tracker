// The Theory page: a "coming soon" placeholder until Phase 6.

import { renderGreeting } from '../components/header.js';
import { renderPlaceholder } from '../components/placeholder.js';

// ─── Rendering ───

// Draws the Music theory placeholder.
export function renderTheoryPage() {
  renderGreeting();
  document.getElementById('pg-theory').innerHTML = renderPlaceholder(
    'Music theory',
    'Theory',
    'Short lessons with exercises and quizzes, starting with the notes on the fretboard, then intervals, the major scale, chord building and chords in a key.',
  );
}
