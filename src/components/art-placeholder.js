// Clearly marked frames that hold the place of Baranay's artwork until it exists
// (TEMPO_PLAN.md section 3, "Art asset spec"). Never filled with stock or AI images.
// What a frame shows: Baranay's file from assets/art/manifest.js, else a hand-coded pixel
// stand-in (src/art/sprites.js), else the dashed placeholder.

import { escapeHtml } from '../utils/html.js';
import { getSprite } from '../art/sprites.js';
import { renderSprite } from '../art/pixel.js';
import { artFileUrl } from '../art/resolve.js';

// ─── Asset spec ───

// Size and folder for each kind of artwork.
export const ART_SPECS = {
  hero: { name: 'Hero', width: 1600, height: 1200, folder: 'assets/art/heroes/', format: 'PNG transparent or SVG' },
  character: { name: 'Character', width: 800, height: 800, folder: 'assets/art/characters/', format: 'PNG transparent' },
  cover: { name: 'Cover', width: 1000, height: 1000, folder: 'assets/art/covers/', format: 'JPG/PNG' },
  texture: { name: 'Texture', width: 1024, height: 1024, folder: 'assets/art/textures/', format: 'JPG/PNG, tileable' },
  stamp: { name: 'Stamp', width: 400, height: 400, folder: 'assets/art/stamps/', format: 'SVG' },
  icon: { name: 'Icon', width: 64, height: 64, folder: 'assets/art/icons/', format: 'SVG' },
};

// ─── Rendering ───

// Returns the art for `artKey` (e.g. "cover:ear-intervals"): the file, the pixel stand-in,
// or a dashed frame such as "HERO — Practice · 1600 × 1200 · assets/art/heroes/".
export function renderArtPlaceholder(kind, subject, artKey = null) {
  const spec = ART_SPECS[kind];
  if (!spec) throw new Error(`Unknown art kind "${kind}".`);
  const url = artKey ? artFileUrl(artKey) : null;
  if (url) return renderArtFile(kind, url);
  const sprite = artKey ? getSprite(artKey) : null;
  if (sprite) return renderSprite(sprite, subject);
  const label = `${spec.name} — ${subject}`;
  return `
    <figure class="art-placeholder" style="aspect-ratio:${spec.width} / ${spec.height}" role="img"
      aria-label="Artwork placeholder: ${escapeHtml(label)}, ${spec.width} by ${spec.height}">
      <span class="art-placeholder__label">${escapeHtml(label)}</span>
      <span class="art-placeholder__spec">${spec.width} × ${spec.height} · ${spec.format}</span>
      <span class="art-placeholder__spec">${spec.folder}</span>
    </figure>`;
}

// Shows one of Baranay's drawings in its frame. Art sits beside its title, so the image is
// decorative (empty alt) and doesn't repeat the title to screen readers.
function renderArtFile(kind, url) {
  const spec = ART_SPECS[kind];
  return `
    <figure class="art-file art-file--${kind}" style="aspect-ratio:${spec.width} / ${spec.height}">
      <img src="${escapeHtml(url)}" alt="" loading="lazy" decoding="async">
    </figure>`;
}
