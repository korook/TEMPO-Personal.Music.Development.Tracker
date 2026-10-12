// The Ear training page: a "coming soon" placeholder until Phase 5.

import { renderGreeting } from '../components/header.js';
import { renderPlaceholder } from '../components/placeholder.js';

// ─── Rendering ───

// Draws the Ear training placeholder.
export function renderEarPage() {
  renderGreeting();
  document.getElementById('pg-ear').innerHTML = renderPlaceholder(
    '◎',
    'Ear training',
    'Interval recognition, chord identification, relative pitch exercises — coming soon. Interactive drills to sharpen your musical ear.',
  );
}
