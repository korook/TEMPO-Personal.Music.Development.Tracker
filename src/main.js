// App start: loads the styles, applies the saved settings, draws the top bar and
// registers every page with the router.

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';

import { registerRoute, startRouter } from './router.js';
import { renderTopBar, bindTopBar, setTopBarCurrent } from './components/top-bar.js';
import { getSettings, updateSettings } from './state/settings.js';
import { isUsingMemoryStorage } from './state/storage.js';
import { CATEGORY_LETTERS } from './chords/library.js';
import { renderTodayPage } from './pages/today.js';
import { renderChordsPage, renderChordPage } from './pages/chords.js';
import { renderPracticePage } from './pages/practice.js';
import { renderProgressPage } from './pages/progress.js';
import { renderEarPage } from './pages/ear.js';
import { renderTheoryPage } from './pages/theory.js';

// ─── Main menu ───

// The top bar's categories. Production stays hidden until it's planned (plan section 4).
const MENU_GROUPS = [
  { key: 'today', label: 'Today', href: '#/today' },
  { key: 'practice', label: 'Practice', href: '#/practice' },
  { key: 'chords', label: 'Chords', items: CATEGORY_LETTERS.map((letter) => ({ label: `${letter} chords`, href: `#/chords/${letter}` })) },
  { key: 'learn', label: 'Ear & theory', items: [{ label: 'Ear training', href: '#/ear' }, { label: 'Theory', href: '#/theory' }] },
  { key: 'progress', label: 'Progress', href: '#/progress' },
];

// ─── Settings in the ⚙ menu ───

// The quick settings: body theme, handedness and motion.
function renderQuickSettings() {
  const settings = getSettings();
  const pressed = (on) => `aria-pressed="${on}"`;
  return `
    <span class="top-bar__heading">Body</span>
    <div class="chip-row">
      <button class="chip" data-setting="theme" data-value="day" ${pressed(settings.theme !== 'night')}>Day</button>
      <button class="chip" data-setting="theme" data-value="night" ${pressed(settings.theme === 'night')}>Night</button>
    </div>
    <span class="top-bar__heading">Playing</span>
    <div class="chip-row">
      <button class="chip" data-setting="leftHanded" ${pressed(settings.leftHanded)}>Left-handed</button>
      <button class="chip" data-setting="reduceMotion" ${pressed(settings.reduceMotion)}>Reduced motion</button>
    </div>`;
}

// Saves a quick-setting change, applies it and redraws the current page.
function bindQuickSettings(container) {
  container.querySelectorAll('[data-setting]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const name = chip.dataset.setting;
      const value = chip.dataset.value !== undefined ? chip.dataset.value : !getSettings()[name];
      updateSettings({ [name]: value });
      applySettings();
      container.querySelectorAll(`[data-setting="${name}"]`).forEach((other) => {
        const on = other.dataset.value !== undefined ? other.dataset.value === getSettings()[name] : getSettings()[name];
        other.setAttribute('aria-pressed', String(on));
      });
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
  });
}

// Puts the saved theme and motion choice on <body>.
function applySettings() {
  const settings = getSettings();
  document.body.dataset.theme = settings.theme === 'night' ? 'night' : 'day';
  document.body.classList.toggle('motion-off', Boolean(settings.reduceMotion));
}

// ─── Storage notice ───

// Warns, once at the top of the page, when the browser won't let Tempo save anything.
function showStorageNotice() {
  if (!isUsingMemoryStorage()) return;
  const notice = document.createElement('p');
  notice.className = 'storage-notice';
  notice.setAttribute('role', 'status');
  notice.textContent = "This window isn't letting Tempo save, so anything you log will be gone when you close it. Open the file straight from the Finder in Chrome, or use the GitHub link, to keep your progress.";
  document.querySelector('.app').prepend(notice);
}

// ─── Start ───

// Applies settings, draws the top bar, connects every route and shows the current page.
function startApp() {
  applySettings();
  const topBar = document.getElementById('top-bar');
  topBar.innerHTML = renderTopBar({ brand: 'Tempo', brandHref: '#/today', groups: MENU_GROUPS, settingsHtml: renderQuickSettings() });
  bindTopBar(topBar);
  bindQuickSettings(topBar);
  showStorageNotice();

  registerRoute({ pattern: /^#\/today$/, pageId: 'dashboard', render: renderTodayPage, menuKey: 'today' });
  registerRoute({ pattern: /^#\/chords(?:\/([A-G]))?$/, pageId: 'chords', render: renderChordsPage, menuKey: 'chords' });
  registerRoute({ pattern: /^#\/chord\/(.+)$/, pageId: 'chords', render: renderChordPage, menuKey: 'chords' });
  registerRoute({ pattern: /^#\/practice$/, pageId: 'practice', render: renderPracticePage, menuKey: 'practice' });
  registerRoute({ pattern: /^#\/progress$/, pageId: 'progress', render: renderProgressPage, menuKey: 'progress', accent: 'shell' });
  registerRoute({ pattern: /^#\/ear$/, pageId: 'ear', render: renderEarPage, menuKey: 'learn', accent: 'verdigris' });
  registerRoute({ pattern: /^#\/theory$/, pageId: 'theory', render: renderTheoryPage, menuKey: 'learn', accent: 'sonic' });

  startRouter(({ menuKey, hash }) => setTopBarCurrent(topBar, { key: menuKey, href: hash }));
}

startApp();
