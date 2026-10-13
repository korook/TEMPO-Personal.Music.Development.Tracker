// A tiny pixel-art engine. Stand-in artwork is drawn in code on a small grid (rectangles,
// circles, lines and hand-typed glyphs), then turned into a crisp SVG of square pixels that
// sits on a dark "screen", like a pixel display on a piece of hardware. Colours are theme
// tokens, so the art follows the palette. Placeholder art only, until Baranay's own exists.
//
// A sprite: { width, height, layers: [{ frames: [canvas, ...], fps, motion, delay }] }
//   frames  drawn one after another (a flip-book); one frame = no flip-book
//   motion  an extra CSS movement for the whole layer: 'float' | 'bob' | 'pulse' | 'blink'

import { escapeHtml } from '../utils/html.js';

// ─── Palette ───

// One letter per colour, each a theme token.
export const PALETTE = {
  i: 'var(--screen)',        // deepest shadow
  k: 'var(--screen-2)',      // dark shapes
  l: 'var(--screen-line)',   // outlines on the screen
  m: 'var(--screen-muted)',  // dim details
  n: 'var(--nickel)',        // metal
  b: 'var(--screen-text)',   // bone, the brightest
  z: 'var(--bronze)',
  v: 'var(--verdigris)',
  s: 'var(--sonic)',
  p: 'var(--shell)',
  g: 'var(--phosphor)',      // LED green, for things that are "on"
};

// ─── Drawing ───

// A blank grid to draw on. Pixels are palette letters; '.' is empty.
export function createCanvas(width, height) {
  const pixels = Array.from({ length: height }, () => Array(width).fill('.'));

  // Sets one pixel (ignores anything off the grid).
  const set = (x, y, colour) => {
    if (x >= 0 && y >= 0 && x < width && y < height) pixels[y][x] = colour;
  };

  return {
    width,
    height,
    pixels,
    set,
    // Sets one pixel and returns the canvas, so calls can be chained.
    dot(x, y, colour) {
      set(x, y, colour);
      return this;
    },
    // Fills a rectangle.
    rect(x, y, w, h, colour) {
      for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) set(col, row, colour);
      return this;
    },
    // Draws a rectangle's outline.
    frame(x, y, w, h, colour) {
      this.rect(x, y, w, 1, colour).rect(x, y + h - 1, w, 1, colour);
      return this.rect(x, y, 1, h, colour).rect(x + w - 1, y, 1, h, colour);
    },
    // Fills a circle.
    disc(cx, cy, r, colour) {
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) set(cx + x, cy + y, colour);
      return this;
    },
    // Draws a circle's outline.
    ring(cx, cy, r, colour) {
      for (let y = -r - 1; y <= r + 1; y++) {
        for (let x = -r - 1; x <= r + 1; x++) {
          const distance = Math.sqrt(x * x + y * y);
          if (Math.abs(distance - r) < 0.5) set(cx + x, cy + y, colour);
        }
      }
      return this;
    },
    // Draws a straight line (Bresenham).
    line(x0, y0, x1, y1, colour) {
      const dx = Math.abs(x1 - x0);
      const dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let error = dx + dy;
      for (;;) {
        set(x0, y0, colour);
        if (x0 === x1 && y0 === y1) break;
        const double = 2 * error;
        if (double >= dy) { error += dy; x0 += sx; }
        if (double <= dx) { error += dx; y0 += sy; }
      }
      return this;
    },
    // Copies a hand-typed glyph (rows of palette letters, '.' = skip) to x, y.
    glyph(rows, x, y) {
      rows.forEach((row, rowIndex) => [...row].forEach((colour, colIndex) => {
        if (colour !== '.') set(x + colIndex, y + rowIndex, colour);
      }));
      return this;
    },
    // Returns a copy to draw a variation on (for the next frame).
    copy() {
      const twin = createCanvas(width, height);
      pixels.forEach((row, y) => row.forEach((colour, x) => twin.set(x, y, colour)));
      return twin;
    },
  };
}

// ─── Rendering ───

// Returns a sprite as an SVG on a screen. `label` describes it for screen readers.
export function renderSprite(sprite, label) {
  const { width, height, layers } = sprite;
  const body = layers.map((layer) => renderLayer(layer, width)).join('');
  return `
    <figure class="pixel-art" role="img" aria-label="${escapeHtml(label)}" style="aspect-ratio:${width} / ${height}">
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" shape-rendering="crispEdges" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        ${body}
      </svg>
    </figure>`;
}

// One layer: its frames side by side in a strip that steps sideways (a flip-book).
function renderLayer({ frames, fps = 2, motion = null, delay = 0 }, width) {
  const strip = frames.map((canvas, frame) => `<g transform="translate(${frame * width} 0)">${pixelsToRects(canvas)}</g>`).join('');
  const flip = frames.length > 1
    ? ` class="pixel-art__strip" style="--frames:${frames.length};--width:${width}px;animation-duration:${frames.length / fps}s"`
    : '';
  // Frames past the first sit outside the picture; the SVG hides them until the strip steps.
  return `
    <g${motion ? ` class="pixel-art__motion pixel-art__motion--${motion}" style="animation-delay:${delay}s"` : ''}>
      <g${flip}>${strip}</g>
    </g>`;
}

// Turns a canvas into <rect>s, joining runs of the same colour on each row.
export function pixelsToRects(canvas) {
  let svg = '';
  canvas.pixels.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const colour = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === colour) run++;
      if (colour !== '.') svg += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${PALETTE[colour] || colour}"/>`;
      x += run;
    }
  });
  return svg;
}
