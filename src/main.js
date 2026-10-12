// App start: loads the styles, registers every page with the router and opens the Dashboard.

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';

import { registerPage, navigate } from './router.js';
import { renderTodayPage } from './pages/today.js';
import { renderChordsPage } from './pages/chords.js';
import { renderPracticePage } from './pages/practice.js';
import { renderProgressPage } from './pages/progress.js';
import { renderProductionPage } from './pages/production.js';
import { renderEarPage } from './pages/ear.js';
import { renderTheoryPage } from './pages/theory.js';

// ─── Start ───

// Connects each page id to the function that draws it, then shows the Dashboard.
function startApp() {
  registerPage('dashboard', renderTodayPage);
  registerPage('guitar', renderChordsPage);
  registerPage('practice', renderPracticePage);
  registerPage('progress', renderProgressPage);
  registerPage('production', renderProductionPage);
  registerPage('ear', renderEarPage);
  registerPage('theory', renderTheoryPage);
  navigate('dashboard');
}

startApp();
