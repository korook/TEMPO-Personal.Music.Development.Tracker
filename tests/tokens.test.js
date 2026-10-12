// Checks the design tokens against WCAG AA contrast (TEMPO_PLAN.md sections 3 and 11):
// every text colour must reach 4.5:1 on the surfaces it is used on.
// Reads the real values from src/styles/tokens.css, so a tweak there is re-checked.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)), 'utf8');

// Returns the hex value of a token, e.g. token('coral') → "#ef6a45".
function token(name) {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!match) throw new Error(`Token --${name} not found or not a hex colour.`);
  return match[1];
}

// Returns the relative luminance of a hex colour (WCAG 2 formula).
function luminance(hex) {
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

// Returns the contrast ratio between two hex colours (1 to 21).
function contrast(first, second) {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

// Text colour → the surfaces it appears on.
const TEXT_PAIRS = [
  ['text', ['stage', 'stage-2', 'stage-3']],
  ['text-muted', ['stage', 'stage-2', 'stage-3']],
  ['text-faint', ['stage', 'stage-2', 'stage-3']],
  ['coral', ['stage', 'stage-2']],
  ['mint', ['stage', 'stage-2']],
  ['mustard', ['stage', 'stage-2']],
  ['pink', ['stage', 'stage-2']],
  ['violet-line', ['stage', 'stage-2']],
  ['ink', ['coral', 'mint', 'mustard', 'pink', 'paper', 'paper-2']],
  ['ink-muted', ['paper']],
  ['coral-deep', ['paper']],
];

describe('design token contrast (WCAG AA, 4.5:1 for text)', () => {
  for (const [text, surfaces] of TEXT_PAIRS) {
    for (const surface of surfaces) {
      it(`--${text} on --${surface}`, () => {
        expect(contrast(token(text), token(surface))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('white text on coral would fail, which is why buttons use --ink', () => {
    expect(contrast('#ffffff', token('coral'))).toBeLessThan(4.5);
  });
});
