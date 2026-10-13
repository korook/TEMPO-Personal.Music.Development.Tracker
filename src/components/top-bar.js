// The top bar: a sticky main menu with the page's sections grouped into categories, and a
// ⚙ button in the right corner that opens the settings. A category either opens a small
// menu of its items or, with no items, links straight to its page. On phone width all
// categories sit in one "Menu": plain pages as links, each category as a fold-out list.
// setTopBarCurrent() marks where you are (and opens that category in the phone menu).
// Menus use the browser's popover feature, so Esc and clicking outside close them.

import { escapeHtml } from '../utils/html.js';

// ─── Rendering ───

// Returns the bar. groups = [{ key, label, href } or { key, label, items: [{ label, href }] }];
// settingsHtml = what the ⚙ menu holds (or '' for no ⚙ button); brandHref = where the name links.
export function renderTopBar({ brand, brandHref = '#top', groups, settingsHtml = '' }) {
  const categoryMenus = groups.map((group, index) => (
    group.items ? renderMenu(`top-bar-group-${index}`, group.label, [group], group.key) : renderLink(group)
  )).join('');
  const phoneMenu = renderPhoneMenu(groups);
  const settings = settingsHtml ? renderSettings(settingsHtml) : '';

  return `
    <nav class="top-bar" aria-label="Main menu">
      <a class="top-bar__brand" href="${escapeHtml(brandHref)}">${escapeHtml(brand)}</a>
      <div class="top-bar__groups">${categoryMenus}</div>
      <div class="top-bar__phone">${phoneMenu}</div>
      ${settings}
    </nav>`;
}

// Returns a category that links straight to its page.
function renderLink(group) {
  return `<a class="top-bar__button" href="${escapeHtml(group.href)}" data-top-key="${escapeHtml(group.key || '')}">${escapeHtml(group.label)}</a>`;
}

// The phone menu: pages in menu order, categories as fold-outs that show their items when tapped.
function renderPhoneMenu(groups) {
  const entries = groups.map((group) => (group.items ? `
    <details class="top-bar__fold" data-top-key="${escapeHtml(group.key || '')}">
      <summary class="top-bar__link top-bar__fold-title">${escapeHtml(group.label)}</summary>
      ${renderLinkList(group.items)}
    </details>` : `<a class="top-bar__link" href="${escapeHtml(group.href)}">${escapeHtml(group.label)}</a>`)).join('');
  return `
    <button class="top-bar__button" popovertarget="top-bar-all" aria-haspopup="true">Menu <span aria-hidden="true">▾</span></button>
    <div class="top-bar__menu top-bar__menu--phone" id="top-bar-all" popover>${entries}</div>`;
}

// Returns a list of links.
function renderLinkList(items) {
  return `<ul class="top-bar__list">${items.map((item) => `<li><a class="top-bar__link" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`).join('')}</ul>`;
}

// Returns one menu button and the list it opens.
function renderMenu(id, label, groups, key = '') {
  const showHeadings = groups.length > 1;
  const lists = groups.map((group) => `
    ${showHeadings ? `<span class="top-bar__heading">${escapeHtml(group.label)}</span>` : ''}
    ${renderLinkList(group.items)}`).join('');
  return `
    <button class="top-bar__button" popovertarget="${id}" aria-haspopup="true" data-top-key="${escapeHtml(key)}">${escapeHtml(label)} <span aria-hidden="true">▾</span></button>
    <div class="top-bar__menu" id="${id}" popover>${lists}</div>`;
}

// Returns the ⚙ button and the settings panel it opens.
function renderSettings(settingsHtml) {
  return `
    <button class="top-bar__button top-bar__cog" popovertarget="top-bar-settings" aria-label="Settings">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
    <div class="top-bar__menu top-bar__settings" id="top-bar-settings" popover>
      <span class="top-bar__heading">Settings</span>
      ${settingsHtml}
    </div>`;
}

// ─── Events ───

// Places each menu under its button when it opens, and closes it after a link is chosen.
export function bindTopBar(container) {
  const bar = container.querySelector('.top-bar');
  if (!bar) return;
  bar.querySelectorAll('[popover]').forEach((menu) => {
    menu.addEventListener('toggle', (event) => {
      if (event.newState === 'open') placeUnderButton(bar, menu);
    });
    menu.querySelectorAll('.top-bar__link').forEach((link) => {
      link.addEventListener('click', () => menu.hidePopover());
    });
  });
}

// Marks the current category and link (aria-current) so the bar shows where you are.
export function setTopBarCurrent(container, { key, href }) {
  container.querySelectorAll('[data-top-key]').forEach((element) => {
    const isCurrent = Boolean(element.dataset.topKey) && element.dataset.topKey === key;
    if (element.matches('details')) element.open = isCurrent;
    else if (isCurrent) element.setAttribute('aria-current', 'page');
    else element.removeAttribute('aria-current');
  });
  container.querySelectorAll('.top-bar__link').forEach((link) => {
    if (link.getAttribute('href') === href) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

// Lines a menu up under the button that opened it, keeping it on screen.
function placeUnderButton(bar, menu) {
  const button = bar.querySelector(`[popovertarget="${menu.id}"]`);
  const rect = button.getBoundingClientRect();
  const width = menu.offsetWidth;
  const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
  menu.style.top = `${rect.bottom + 8}px`;
  menu.style.left = `${left}px`;
}
