// Vite and Vitest settings. Tests live in tests/ and run in Node (no browser needed yet).
// base './' makes built file links relative, so the site works at
// korook.github.io/TEMPO-Personal.Music.Development.Tracker/ as well as locally.

import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
});
