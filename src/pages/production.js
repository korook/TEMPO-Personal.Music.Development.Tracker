// The Production page: a "coming soon" placeholder.
// TEMPO_PLAN.md section 4 hides this tab until Production is planned (done in Phase 4).

import { renderGreeting } from '../components/header.js';
import { renderPlaceholder } from '../components/placeholder.js';

// ─── Rendering ───

// Draws the Production placeholder.
export function renderProductionPage() {
  renderGreeting();
  document.getElementById('pg-production').innerHTML = renderPlaceholder(
    '⌬',
    'Production',
    'Logic Pro, GarageBand, mixing, effects, automation — coming soon. This section will track your DAW skills, project completions, and production techniques.',
  );
}
