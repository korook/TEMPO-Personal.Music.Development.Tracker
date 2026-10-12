// A "coming soon" card used by pages that are not built yet.

// ─── Rendering ───

// Returns a card with a faint icon, a title and a short description.
export function renderPlaceholder(icon, title, description) {
  return `<div class="card"><div class="placeholder"><div class="ph-icon">${icon}</div><div class="ph-title">${title}</div><div class="ph-sub">${description}</div></div></div>`;
}
