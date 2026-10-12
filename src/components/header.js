// The greeting in the top-right of the header: time-of-day greeting, name and today's date.
// The name comes from Settings (default "Baranay").

import { getSettings } from '../state/settings.js';
import { escapeHtml } from '../utils/html.js';

// ─── Rendering ───

// Fills the greeting box with "Good morning/afternoon/evening, <name>" and the date.
export function renderGreeting() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateText = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('greetBox').innerHTML =
    `<div class="greet-line">${greeting}, <b>${escapeHtml(getSettings().name)}</b></div><div class="greet-date">${dateText}</div>`;
}

