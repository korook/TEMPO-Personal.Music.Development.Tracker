// Vite and Vitest settings. Tests live in tests/ and run in Node (no browser needed yet).

import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
});
