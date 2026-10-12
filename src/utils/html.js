// Helpers for building HTML strings safely.

// ─── Escaping ───

// Makes text safe to put inside HTML (names, notes and anything else the user types).
export function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
