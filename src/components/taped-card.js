// Setlist cards and polaroids. A setlist card is a small module: an index number, an LED
// that lights for the block being played, a label-maker strip for the block type, the
// title and a handwritten note. Polaroids hold milestones and artwork.

import { escapeHtml } from '../utils/html.js';

// Small rotations for label strips and polaroids, picked in turn so they look hand-placed.
const TILTS = ['-1.4deg', '1deg', '-0.6deg', '1.6deg', '-1deg'];

// ─── Setlist card ───

// Returns a setlist card. Options:
//   kicker (label strip), title, body, meta (e.g. "3 min"), note (handwritten), actions (HTML),
//   colour of the label strip: 'screen' | 'bronze' | 'verdigris' | 'sonic' | 'shell',
//   state: 'default' | 'current' | 'done', index (position in the setlist, from 0).
export function renderTapedCard({
  kicker = '',
  title,
  body = '',
  meta = '',
  note = '',
  actions = '',
  colour = 'screen',
  state = 'default',
  index = 0,
}) {
  const classes = ['taped-card'];
  if (colour !== 'screen') classes.push(`taped-card--${colour}`);
  if (state !== 'default') classes.push(`taped-card--${state}`);
  const stateText = { current: 'Now playing', done: 'Done' }[state];

  return `
    <article class="${classes.join(' ')}">
      <div class="taped-card__top">
        <span class="taped-card__index">${String(index + 1).padStart(2, '0')}</span>
        <span class="taped-card__led" aria-hidden="true"></span>
      </div>
      ${kicker ? `<span class="taped-card__kicker" style="--tilt:${TILTS[index % TILTS.length]}">${escapeHtml(kicker)}</span>` : ''}
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
