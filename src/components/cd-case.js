// The CD case (TEMPO_UPDATE_REPERTOIRE.md 7.1–7.2): a clear jewel case with a hinge strip
// and the cover behind the plastic, a label-maker spine (title, artist, level, state LED), and
// a printed disc that slides out on hover or keyboard focus. Around the disc's edge, one
// segment per song part: lit = "got it", half-lit = "learning", like the beat ring on the
// disc metronome. Touch: the first tap shows the disc, the second opens the song.

import { renderCoverArt } from '../repertoire/covers.js';
import { partState, songState, SONG_LABELS } from '../repertoire/state.js';
import { escapeHtml } from '../utils/html.js';

export const LEVEL_LABELS = { 1: 'Basics', 2: 'Next step', 3: 'Challenge' };

// ─── Rendering ───

// Returns one case. options: { entry (repertoire data or null for a suggestion), href,
// size: 'shelf' | 'hero', note (a strip line such as "Missing: Bm"), running (LED green) }.
export function renderCdCase(song, { entry = null, href = null, size = 'shelf', note = '', running = false } = {}) {
  const state = entry ? songState(song, entry) : 'suggestion';
  const stateLabel = entry ? SONG_LABELS[state] : 'Suggestion';
  const tag = href ? 'a' : 'div';
  const link = href ? ` href="${escapeHtml(href)}"` : '';
  return `
    <${tag} class="cd cd--${size}" data-cd-state="${running ? 'running' : state}"${link} aria-label="${escapeHtml(`${song.title}, ${song.artist || 'unknown artist'}. Level ${song.level}. ${stateLabel}.${note ? ` ${note}` : ''}`)}">
      <span class="cd__stage">
        ${renderDisc(song, entry)}
        <span class="cd__case">
          <span class="cd__art">${renderCoverArt(song)}</span>
          <span class="cd__hinge" aria-hidden="true"></span>
          <span class="cd__shine" aria-hidden="true"></span>
        </span>
      </span>
      <span class="cd__spine">
        <span class="cd__led" aria-hidden="true"></span>
        <span class="cd__title">${escapeHtml(song.title)}</span>
        <span class="cd__artist">${escapeHtml(song.artist || 'Artist?')}</span>
        <span class="cd__level">LV·${song.level} ${LEVEL_LABELS[song.level] || ''}</span>
        ${note ? `<span class="cd__note">${escapeHtml(note)}</span>` : ''}
      </span>
    </${tag}>`;
}

// The printed disc: a dot-grid print, the title, a small dot-matrix tempo, and the ring of parts.
export function renderDisc(song, entry) {
  const parts = song.parts || [];
  const gap = parts.length > 1 ? 4 : 0;
  const sweep = 360 / Math.max(parts.length, 1);
  const segments = parts.map((part, index) => {
    const status = entry ? partState(entry, part.id) : 'not-yet';
    const from = index * sweep + gap / 2;
    const to = (index + 1) * sweep - gap / 2;
    return `<path class="cd-disc__part" data-part="${status}" d="${arc(46, from, to)}"><title>${escapeHtml(`${part.name}: ${status.replace('-', ' ')}`)}</title></path>`;
  }).join('');
  return `
    <span class="cd__disc">
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle class="cd-disc__face" cx="50" cy="50" r="49"/>
        <circle class="cd-disc__print" cx="50" cy="50" r="40"/>
        ${segments}
        <circle class="cd-disc__hole-ring" cx="50" cy="50" r="12"/>
        <circle class="cd-disc__hole" cx="50" cy="50" r="5"/>
        <text class="cd-disc__title" x="50" y="31" text-anchor="middle">${escapeHtml(shortTitle(song.title))}</text>
        <text class="cd-disc__bpm" x="50" y="75" text-anchor="middle">${song.bpm ? `${song.bpm} BPM` : 'BPM ?'}</text>
      </svg>
    </span>`;
}

// Shortens a long title so it fits on the disc label.
function shortTitle(title) {
  return title.length > 18 ? `${title.slice(0, 17)}…` : title;
}

// An SVG arc path on a circle of `radius` around the middle, from one angle to another (degrees, 0 = top).
function arc(radius, fromDegrees, toDegrees) {
  const point = (degrees) => {
    const radians = ((degrees - 90) * Math.PI) / 180;
    return `${(50 + radius * Math.cos(radians)).toFixed(2)} ${(50 + radius * Math.sin(radians)).toFixed(2)}`;
  };
  const large = toDegrees - fromDegrees > 180 ? 1 : 0;
  return `M ${point(fromDegrees)} A ${radius} ${radius} 0 ${large} 1 ${point(toDegrees)}`;
}

// ─── Touch ───

// On touch screens, the first tap on a case shows its disc and the second follows the link.
export function bindCdCases(container) {
  container.querySelectorAll('a.cd').forEach((cd) => {
    cd.addEventListener('pointerup', (event) => {
      if (event.pointerType !== 'touch') return;
      if (!cd.classList.contains('cd--peek')) {
        container.querySelectorAll('.cd--peek').forEach((other) => other.classList.remove('cd--peek'));
        cd.classList.add('cd--peek');
        cd.dataset.blockClick = 'true';
      }
    });
    cd.addEventListener('click', (event) => {
      if (cd.dataset.blockClick === 'true') {
        event.preventDefault();
        event.stopImmediatePropagation();
        delete cd.dataset.blockClick;
      }
    }, true);
  });
}
