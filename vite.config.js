// Vite and Vitest settings. Tests live in tests/ and run in Node (no browser needed yet).
// base './' makes built file links relative, so the site works at
// korook.github.io/TEMPO-Personal.Music.Development.Tracker/ as well as locally.
// Two pages are built: the app (index.html) and the design system's component page.

import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        components: fileURLToPath(new URL('./components.html', import.meta.url)),
      },
    },
  },
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
});
