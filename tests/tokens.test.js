// Checks the design tokens against WCAG AA contrast (TEMPO_PLAN.md sections 3 and 11):
// every text colour must reach 4.5:1 on the surfaces it is used on, in both themes.
// Reads the real values from src/styles/tokens.css, so a tweak there is re-checked.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)), 'utf8');
const designSystem = css.slice(css.indexOf('Tempo design system ═'));
const nightBlock = blockAfter(designSystem, ':root {');
const dayBlock = blockAfter(designSystem, ".stage:not([data-theme='night']) {");

// Returns the text between `opener` and its closing brace.
function blockAfter(text, opener) {
  const start = text.indexOf(opener);
  if (start < 0) throw new Error(`Block "${opener}" not found in tokens.css.`);
  return text.slice(start, text.indexOf('\n}', start));
}

// Returns a token's hex value for a theme: the day block overrides the night (:root) block.
function token(name, theme) {
  const pattern = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`);
  const fromDay = theme === 'day' ? pattern.exec(dayBlock) : null;
  const match = fromDay || pattern.exec(nightBlock);
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

// Text colour → the surfaces it appears on. Checked in both themes.
const BODY_PAIRS = [
  ['text', ['body', 'body-2', 'body-3']],
  ['text-muted', ['body', 'body-2', 'body-3']],
  ['text-faint', ['body', 'body-2', 'body-3']],
  ['bronze-text', ['body', 'body-2']],
  ['verdigris-text', ['body', 'body-2']],
  ['sonic-text', ['body', 'body-2']],
  ['shell-text', ['body', 'body-2']],
];

// Pairs that look the same in both themes (screens, paper, accent fills).
const FIXED_PAIRS = [
  ['screen-text', ['screen', 'screen-2']],
  ['screen-muted', ['screen', 'screen-2']],
  ['bronze', ['screen', 'screen-2']],
  ['verdigris', ['screen', 'screen-2']],
  ['sonic', ['screen', 'screen-2']],
  ['shell', ['screen', 'screen-2']],
  ['phosphor', ['screen', 'screen-2']],
  ['ink', ['paper', 'bronze', 'verdigris', 'sonic', 'shell', 'phosphor']],
  ['ink-muted', ['paper']],
];

describe('design token contrast (WCAG AA, 4.5:1 for text)', () => {
  for (const theme of ['day', 'night']) {
    for (const [text, surfaces] of BODY_PAIRS) {
      for (const surface of surfaces) {
        it(`${theme}: --${text} on --${surface}`, () => {
          expect(contrast(token(text, theme), token(surface, theme))).toBeGreaterThanOrEqual(4.5);
        });
      }
    }
  }

  for (const [text, surfaces] of FIXED_PAIRS) {
    for (const surface of surfaces) {
      it(`--${text} on --${surface}`, () => {
        expect(contrast(token(text, 'night'), token(surface, 'night'))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
