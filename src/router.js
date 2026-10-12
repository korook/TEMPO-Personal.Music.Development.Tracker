// Switches between pages and draws the tab bar.
// Pages register a render function here; the router shows one page at a time.

// ─── Page list ───

// Page ids in tab order, with the label shown on each tab.
const PAGE_ORDER = ['dashboard', 'guitar', 'practice', 'progress', 'production', 'ear', 'theory'];
const PAGE_LABELS = {
  dashboard: 'Dashboard',
  guitar: 'Guitar',
  practice: 'Practice',
  progress: 'Progress',
  production: 'Production',
  ear: 'Ear training',
  theory: 'Theory',
};

const pageRenderers = {};
let currentPage = 'dashboard';

// ─── Registration ───

// Tells the router which function draws the page with id `pageId`.
export function registerPage(pageId, render) {
  pageRenderers[pageId] = render;
}

// ─── Navigation ───

// Shows the page `pageId`, highlights its tab and draws its content.
export function navigate(pageId) {
  currentPage = pageId;
  document.querySelectorAll('.page').forEach((page) => page.classList.remove('on'));
  document.getElementById(`pg-${pageId}`).classList.add('on');
  renderTabs();
  pageRenderers[pageId]();
}

// ─── Rendering ───

// Draws the tab bar with the current page highlighted.
export function renderTabs() {
  const tabBar = document.getElementById('tabBar');
  tabBar.innerHTML = PAGE_ORDER
    .map((pageId) => `<div class="tab${currentPage === pageId ? ' on' : ''}" data-page="${pageId}">${PAGE_LABELS[pageId]}</div>`)
    .join('');
  tabBar.querySelectorAll('[data-page]').forEach((tab) => {
    tab.addEventListener('click', () => navigate(tab.dataset.page));
  });
}
