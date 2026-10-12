// Switches between pages using the address after "#", so every page and every chord has
// its own link and the browser's back button works: #/today, #/chords/C, #/chord/Cmaj7 ...
// Pages register a route; the router shows one page at a time, sets the section accent
// and tells the top bar where you are.

const routes = [];
let onRouteChange = () => {};

// Old page ids from v1 links and buttons, and the routes they now point to.
const LEGACY_IDS = { dashboard: 'today', guitar: 'chords' };

// ─── Registration ───

// Adds a route. pattern: a RegExp matched against the hash; pageId: the element "pg-<id>"
// that shows; render(params): draws it; menuKey: the top-bar category; accent: the section colour.
export function registerRoute({ pattern, pageId, render, menuKey, accent = 'bronze' }) {
  routes.push({ pattern, pageId, render, menuKey, accent });
}

// Starts listening for address changes and shows the current page.
// `listener({ menuKey, hash })` is told about every page change (used by the top bar).
export function startRouter(listener) {
  onRouteChange = listener;
  window.addEventListener('hashchange', showCurrentRoute);
  showCurrentRoute();
}

// ─── Navigation ───

// Goes to a page: navigate('#/chords/C'), or by old page id: navigate('practice').
export function navigate(target) {
  const hash = target.startsWith('#') ? target : `#/${LEGACY_IDS[target] || target}`;
  if (location.hash === hash) showCurrentRoute();
  else location.hash = hash;
}

// Returns the link to one chord, e.g. chordLink('C#m7') → "#/chord/C%23m7".
export function chordLink(symbol) {
  return `#/chord/${encodeURIComponent(symbol)}`;
}

// ─── Showing a page ───

// Finds the route for the current address and draws its page (Today if nothing matches).
function showCurrentRoute() {
  const hash = location.hash && location.hash !== '#' ? location.hash : '#/today';
  let match = null;
  const route = routes.find((candidate) => (match = candidate.pattern.exec(hash))) || routes[0];
  const params = match ? match.slice(1).map((value) => (value === undefined ? undefined : decodeURIComponent(value))) : [];

  document.querySelectorAll('.page').forEach((page) => page.classList.remove('on'));
  document.getElementById(`pg-${route.pageId}`).classList.add('on');
  document.body.style.setProperty('--accent-now', `var(--${route.accent})`);
  document.body.style.setProperty('--accent-text', `var(--${route.accent}-text)`);
  window.scrollTo(0, 0);

  route.render(...params);
  onRouteChange({ menuKey: route.menuKey, hash });
}
