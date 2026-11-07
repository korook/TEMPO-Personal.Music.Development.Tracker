// Cover art for songs (TEMPO_UPDATE_REPERTOIRE.md 6), in this order:
//   1. Baranay's own file in assets/art/covers/songs/ (via the art manifest, key cover:song:<id>)
//   2. the original artwork found by `npm run covers` (src/data/songs/covers.json)
//   3. for songs added in the app: the address found online and saved with the song
//   4. a generated sleeve: the title in big type on a palette colour, never an imitation
// Images load from Apple's / the Cover Art Archive's servers; nothing is copied into the repo.

import COVERS from '../data/songs/covers.json';
import { artFileUrl } from '../art/resolve.js';
import { escapeHtml } from '../utils/html.js';

// The palette colours a generated sleeve can use (all carry --ink text at AA).
const SLEEVE_COLOURS = ['bronze', 'verdigris', 'sonic', 'shell', 'oxblood', 'amber'];

// ─── Finding the cover ───

// Returns { kind: 'image', url, alt } or { kind: 'sleeve' } for a song.
export function coverFor(song) {
  const ownFile = artFileUrl(`cover:song:${song.id}`);
  const found = COVERS[song.id];
  const url = ownFile || (found && found.url) || song.coverUrl || null;
  if (!url) return { kind: 'sleeve' };
  const album = (found && found.album) || song.album || song.title;
  return { kind: 'image', url, alt: `Cover of ${album}, ${song.artist}` };
}

// Picks a stable sleeve colour from the song id, so a song always gets the same one.
export function sleeveColour(songId) {
  let hash = 0;
  for (const character of songId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return SLEEVE_COLOURS[hash % SLEEVE_COLOURS.length];
}

// ─── Rendering ───

// Returns the art inside a case, in a fixed 1:1 frame so nothing jumps while it loads. The
// generated sleeve always sits underneath: if the cover can't load (offline, or a viewer that
// blocks outside images), the image hides itself and the sleeve shows instead of an empty frame.
export function renderCoverArt(song) {
  const cover = coverFor(song);
  if (cover.kind !== 'image') return renderSleeve(song);
  return `${renderSleeve(song)}<img class="cd__img" src="${escapeHtml(cover.url)}" alt="${escapeHtml(cover.alt)}" width="600" height="600" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.hidden=true">`;
}

// A generated inlay: title in wide type, artist in mono, a dot grid on a palette colour.
export function renderSleeve(song) {
  return `
    <div class="sleeve" style="--sleeve:var(--${sleeveColour(song.id)})" role="img" aria-label="${escapeHtml(`${song.title} by ${song.artist || 'unknown artist'}`)}">
      <span class="sleeve__title">${escapeHtml(song.title)}</span>
      <span class="sleeve__artist">${escapeHtml(song.artist || 'Artist?')}</span>
    </div>`;
}

// ─── Looking up a cover in the browser (songs added in the app) ───

// Asks iTunes for a song's artwork. Uses fetch, and falls back to JSONP when the browser
// blocks the request (CORS). Resolves to { url, album } or null.
export async function lookupCoverOnline(song) {
  const term = encodeURIComponent(`${song.artist || ''} ${song.title}`.trim());
  const address = `https://itunes.apple.com/search?term=${term}&entity=song&limit=5`;
  let data = null;
  try {
    const response = await fetch(address);
    if (response.ok) data = await response.json();
  } catch {
    data = await jsonp(address).catch(() => null);
  }
  const match = data && (data.results || []).find((result) => result.artworkUrl100 && result.trackName && result.trackName.toLowerCase().includes(song.title.toLowerCase()));
  return match ? { url: match.artworkUrl100.replace('100x100', '600x600'), album: match.collectionName } : null;
}

// Loads a JSONP response by adding a script tag with a one-time callback (gives up after 6 s).
function jsonp(address) {
  return new Promise((resolve, reject) => {
    const name = `tempoCover${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const script = document.createElement('script');
    const timer = setTimeout(() => finish(reject, new Error('timed out')), 6000);
    // Cleans up the script tag and the callback, then settles the promise.
    function finish(settle, value) {
      clearTimeout(timer);
      delete window[name];
      script.remove();
      settle(value);
    }
    window[name] = (data) => finish(resolve, data);
    script.onerror = () => finish(reject, new Error('blocked'));
    script.src = `${address}&callback=${name}`;
    document.head.appendChild(script);
  });
}
