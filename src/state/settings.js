// Reads and changes the user's settings (name, handedness, sound, rest days).

import { getState, updateState } from './storage.js';

// ─── Settings ───

// Returns the current settings object.
export function getSettings() {
  return getState().settings;
}

// Changes some settings, e.g. updateSettings({ name: 'Baranay' }), and saves.
export function updateSettings(changes) {
  updateState((state) => {
    state.settings = { ...state.settings, ...changes };
  });
}
