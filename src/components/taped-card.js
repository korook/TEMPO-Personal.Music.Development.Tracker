// Taped cards (the session "setlist") and polaroids (milestones and artwork):
// paper pieces stuck on the stage, each slightly rotated (TEMPO_PLAN.md section 3).

import { escapeHtml } from '../utils/html.js';

// Small rotations, picked in turn so a row of cards looks hand-placed rather than random.
const TILTS = ['-1.4deg', '1deg', '-0.6deg', '1.6deg', '-1deg'];

// ─── Taped card ───

// Returns a taped card. Options:
//   kicker, title, body, meta (e.g. "3 min"), note (handwritten), actions (HTML),
//   colour: 'paper' | 'coral' | 'mint' | 'mustard' | 'pink',
//   state: 'default' | 'current' | 'done', index (picks the tilt).
export function renderTapedCard({
  kicker = '',
  title,
  body = '',
  meta = '',
  note = '',
  actions = '',
  colour = 'paper',
  state = 'default',
  index = 0,
}) {
  const classes = ['taped-card'];
  if (colour !== 'paper') classes.push(`taped-card--${colour}`);
  if (state !== 'default') classes.push(`taped-card--${state}`);
  const stateText = { current: 'Now playing', done: 'Done' }[state];

  return `
    <article class="${classes.join(' ')}" style="--tilt:${TILTS[index % TILTS.length]}">
      ${kicker ? `<div class="taped-card__kicker">${escapeHtml(kicker)}</div>` : ''}
      <h3 class="taped-card__title">${escapeHtml(title)}</h3>
      ${stateText ? `<span class="visually-hidden">${stateText}</span>` : ''}
      ${body ? `<p class="taped-card__body">${escapeHtml(body)}</p>` : ''}
      <div class="taped-card__footer">
        ${note ? `<span class="taped-card__note">${escapeHtml(note)}</span>` : '<span></span>'}
        ${meta ? `<span class="taped-card__meta">${escapeHtml(meta)}</span>` : ''}
      </div>
      ${actions ? `<div class="taped-card__footer">${actions}</div>` : ''}
    </article>`;
}

// ─── Polaroid ───

// Returns a polaroid frame around `pictureHtml` (usually an art placeholder for now),
// with a handwritten caption and an optional date.
export function renderPolaroid({ pictureHtml, caption, date = '', index = 0 }) {
  return `
    <figure class="polaroid" style="--tilt:${TILTS[(index + 2) % TILTS.length]}">
      ${pictureHtml}
      <figcaption class="polaroid__caption">
        ${escapeHtml(caption)}
        ${date ? `<span class="polaroid__date">${escapeHtml(date)}</span>` : ''}
      </figcaption>
    </figure>`;
}
