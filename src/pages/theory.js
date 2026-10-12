// The Theory page: a "coming soon" placeholder until Phase 6.

import { renderGreeting } from '../components/header.js';
import { renderPlaceholder } from '../components/placeholder.js';

// ─── Rendering ───

// Draws the Music theory placeholder.
export function renderTheoryPage() {
  renderGreeting();
  document.getElementById('pg-theory').innerHTML = renderPlaceholder(
    '♮',
    'Music theory',
    'Scales, modes, keys, chord construction, the circle of fifths — coming soon. Visual lessons to build your theoretical foundation.',
  );
}
