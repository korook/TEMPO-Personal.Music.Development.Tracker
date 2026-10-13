// Decides what an art frame shows (TEMPO_PLAN.md 17.4, item 1): Baranay's file when the
// manifest names one and it exists in assets/art/, otherwise the pixel stand-in, otherwise
// the dashed placeholder. Files are bundled at build time, so they also work in previews.

import { ART_MANIFEST } from '../../assets/art/manifest.js';
import { getSprite } from './sprites.js';

const files = import.meta.glob('../../assets/art/**/*.{png,jpg,jpeg,svg,webp,gif}', { eager: true, query: '?url', import: 'default' });

// ─── Looking up ───

// Returns the URL of the art file for a key, or null when there is none yet.
export function artFileUrl(key) {
  const entry = ART_MANIFEST[key];
  if (!entry || !entry.file) return null;
  return files[`../../assets/art/${entry.file}`] || null;
}

// What a key shows right now: 'file', 'pixel' or 'placeholder'.
export function artSource(key) {
  if (artFileUrl(key)) return 'file';
  if (getSprite(key)) return 'pixel';
  return 'placeholder';
}

// Every key in the manifest with its entry and current source (for the component page).
export function listArt() {
  return Object.entries(ART_MANIFEST).map(([key, entry]) => ({ key, ...entry, source: artSource(key) }));
}

// Lists manifest problems (used by the tests): files named but missing, unknown kinds.
export function findManifestProblems(kinds) {
  const problems = [];
  for (const [key, entry] of Object.entries(ART_MANIFEST)) {
    if (!kinds.includes(entry.kind)) problems.push(`${key}: unknown kind "${entry.kind}"`);
    if (!key.startsWith(`${entry.kind}:`)) problems.push(`${key}: key should start with "${entry.kind}:"`);
    if (entry.file && !files[`../../assets/art/${entry.file}`]) problems.push(`${key}: file assets/art/${entry.file} is missing`);
  }
  return problems;
}
