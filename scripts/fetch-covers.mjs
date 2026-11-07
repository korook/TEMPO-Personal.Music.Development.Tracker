// Finds the original cover art for every built-in song (TEMPO_UPDATE_REPERTOIRE.md 6) and
// stores only the artwork address in src/data/songs/covers.json. No image files are copied
// into the repo; the app loads them from Apple's (or the Cover Art Archive's) servers.
//
// Usage: npm run covers
//   1. iTunes Search API with the song's cover.query; picks the result whose artist and title
//      match, and asks for the 600 × 600 version.
//   2. If iTunes has no match: MusicBrainz recording search + Cover Art Archive front cover.
//   3. Songs with no match are left out of covers.json and get the generated sleeve.

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILT_IN_SONGS } from '../src/repertoire/songs.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(root, 'src/data/songs/covers.json');
const USER_AGENT = 'TempoPracticeApp/1.0 (personal guitar practice site)';

// ─── Matching ───

// Lower-cases and strips accents and punctuation, so "Şaşkın" matches "Saskin".
function simplify(text) {
  return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i')
    .toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// True when one simplified text contains the other.
function looselyEqual(a, b) {
  const left = simplify(a);
  const right = simplify(b);
  return Boolean(left && right) && (left.includes(right) || right.includes(left));
}

// ─── Sources ───

// Searches iTunes and returns { url, album, source } for a matching song, or null.
async function fromItunes(song) {
  const term = encodeURIComponent(song.cover.query);
  const response = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=5`);
  if (!response.ok) return null;
  const { results = [] } = await response.json();
  const match = results.find((result) => looselyEqual(result.artistName, song.artist) && looselyEqual(result.trackName, song.title));
  if (!match || !match.artworkUrl100) return null;
  return { url: match.artworkUrl100.replace('100x100', '600x600'), album: match.collectionName, source: 'itunes' };
}

// Searches MusicBrainz + Cover Art Archive and returns { url, album, source }, or null.
async function fromMusicBrainz(song) {
  const query = encodeURIComponent(`recording:"${song.title}" AND artist:"${song.artist}"`);
  const response = await fetch(`https://musicbrainz.org/ws/2/recording?query=${query}&fmt=json&limit=5`, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) return null;
  const { recordings = [] } = await response.json();
  for (const recording of recordings) {
    for (const release of recording.releases || []) {
      const art = await fetch(`https://coverartarchive.org/release/${release.id}/front-500`, { method: 'HEAD', redirect: 'manual' });
      if (art.status === 307 || art.status === 302 || art.ok) {
        return { url: `https://coverartarchive.org/release/${release.id}/front-500`, album: release.title, source: 'coverartarchive' };
      }
    }
  }
  return null;
}

// ─── Running ───

// Looks up every song one after another (gently, to respect the services' rate limits).
async function main() {
  const covers = {};
  const missing = [];
  for (const song of BUILT_IN_SONGS) {
    let found = null;
    try {
      found = (await fromItunes(song)) || (await fromMusicBrainz(song));
    } catch (error) {
      console.warn(`  ${song.id}: lookup failed (${error.message})`);
    }
    if (found) {
      covers[song.id] = found;
      console.log(`✓ ${song.title} — ${found.album} (${found.source})`);
    } else {
      missing.push(song.title);
      console.log(`· ${song.title} — no cover found, the generated sleeve will show`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }
  writeFileSync(OUTPUT, `${JSON.stringify(covers, null, 2)}\n`);
  console.log(`\nSaved ${Object.keys(covers).length} covers to src/data/songs/covers.json. No cover: ${missing.length ? missing.join(', ') : 'none'}.`);
}

main();
