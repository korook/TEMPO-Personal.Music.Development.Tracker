// The Ear training page: a "coming soon" placeholder until Phase 5.

import { renderGreeting } from '../components/header.js';
import { renderPlaceholder } from '../components/placeholder.js';

// ─── Rendering ───

// Draws the Ear training placeholder.
export function renderEarPage() {
  renderGreeting();
  document.getElementById('pg-ear').innerHTML = renderPlaceholder(
    'Ear training',
    'Ear',
    'Eight listening games are next: scale degrees, intervals, chord types, progressions, call and response, rhythm tap-back and more, with a short daily workout. They use the same practice model, so mix-ups become Fix openings.',
  );
}
