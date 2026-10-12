// The greeting in the top-right of the header: time-of-day greeting, name and today's date.
// The name comes from Settings (default "Baranay").

import { getSettings } from '../state/settings.js';
import { escapeHtml } from '../utils/html.js';

// ─── Rendering ───

// Fills the greeting box (if the page has one) with "Good morning/afternoon/evening, <name>" and the date.
export function renderGreeting() {
  const box = document.getElementById('greetBox');
  if (!box) return;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateText = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
  box.innerHTML =
    `<p class="greeting__line">${greeting}, <b>${escapeHtml(getSettings().name)}</b></p><p class="greeting__date label">${dateText}</p>`;
}

