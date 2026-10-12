// The marquee ticker at the top of Today: openings scroll by like a sign outside a venue
// (TEMPO_PLAN.md section 3). It pauses on hover or keyboard focus, and turns into a
// still, wrapped list when reduced motion is on.

import { escapeHtml } from '../utils/html.js';

// ─── Rendering ───

// Returns the ticker for a list of short texts. The list is drawn twice so the loop is
// seamless; the copy is hidden from screen readers so each item is read once.
export function renderTicker(items, { label = "Today's openings", secondsPerItem = 6 } = {}) {
  const list = items.map((item) => `<li class="ticker__item">${escapeHtml(item)}</li>`).join('');
  return `
    <section class="ticker" aria-label="${escapeHtml(label)}" tabindex="0" style="--ticker-seconds:${Math.max(20, items.length * secondsPerItem)}s">
      <div class="ticker__track">
        <ul class="ticker__list">${list}</ul>
        <ul class="ticker__list" aria-hidden="true">${list}</ul>
      </div>
    </section>`;
}
