// The greeting in the top-right of the header: time-of-day greeting, name and today's date.
// The name is still hard-coded as in v1; Phase 4 reads it from Settings.

const GREETING_NAME = 'Uglum';

// ─── Rendering ───

// Fills the greeting box with "Good morning/afternoon/evening, <name>" and the date.
export function renderGreeting() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateText = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('greetBox').innerHTML =
    `<div class="greet-line">${greeting}, <b>${GREETING_NAME}</b></div><div class="greet-date">${dateText}</div>`;
}
