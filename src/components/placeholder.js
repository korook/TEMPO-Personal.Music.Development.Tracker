// A "coming soon" panel for pages that are not built yet (Ear training, Theory),
// with a frame where one of Baranay's characters will stand.

import { renderArtPlaceholder } from './art-placeholder.js';
import { escapeHtml } from '../utils/html.js';

// ─── Rendering ───

// Returns the page head and an empty state saying what is coming and when.
export function renderPlaceholder(kicker, title, description) {
  return `
    <header class="page-head">
      <div class="section-head">
        <span class="section-head__kicker">${escapeHtml(kicker)}</span>
        <h1 class="section-head__title section-head__title--hero">${escapeHtml(title)}</h1>
      </div>
    </header>
    <section class="panel empty-state">
      ${renderArtPlaceholder('character', 'Waiting backstage')}
      <div>
        <h2 class="empty-state__title">Coming soon</h2>
        <p class="empty-state__text">${escapeHtml(description)}</p>
      </div>
    </section>`;
}
