// The Settings page (TEMPO_PLAN.md section 4): your name, how you play, the look, and
// backups. Backups export everything as one JSON file and import it back; Today reminds
// you when the last backup is more than 30 days old.

import { getState, downloadBackup, importBackupFile, isUsingMemoryStorage } from '../state/storage.js';
import { getSettings, updateSettings } from '../state/settings.js';
import { escapeHtml } from '../utils/html.js';

let message = '';

// ─── Rendering ───

// Draws the page from the current settings.
export function renderSettingsPage() {
  const settings = getSettings();
  const state = getState();
  const pressed = (on) => `aria-pressed="${on}"`;
  const lastExport = state.meta.lastExportAt
    ? new Date(state.meta.lastExportAt).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'never';

  document.getElementById('pg-settings').innerHTML = `
    <header class="page-head">
      <div class="section-head">
        <span class="section-head__kicker">Settings</span>
        <h1 class="section-head__title section-head__title--hero">Settings</h1>
        <p class="section-head__lead">Everything is saved in this browser only. Export a backup now and then so nothing gets lost.</p>
      </div>
    </header>

    <section class="panel settings-group" aria-labelledby="set-you">
      <h2 class="root-row__title" id="set-you">You</h2>
      <label class="settings-field">
        <span class="label">Name for the greeting</span>
        <input class="settings-input" type="text" maxlength="40" value="${escapeHtml(settings.name)}" data-name>
      </label>
    </section>

    <section class="panel settings-group" aria-labelledby="set-play">
      <h2 class="root-row__title" id="set-play">Playing</h2>
      <div class="settings-row">
        <span>Diagrams and the fretboard</span>
        <div class="chip-row">
          <button class="chip" data-set="leftHanded" data-value="false" ${pressed(!settings.leftHanded)}>Right-handed</button>
          <button class="chip" data-set="leftHanded" data-value="true" ${pressed(settings.leftHanded)}>Left-handed</button>
        </div>
      </div>
      <div class="settings-row">
        <span>Rest days a week that don't break your streak</span>
        <div class="chip-row">
          ${[0, 1, 2].map((days) => `<button class="chip" data-set="restDaysPerWeek" data-value="${days}" ${pressed(settings.restDaysPerWeek === days)}>${days}</button>`).join('')}
        </div>
      </div>
    </section>

    <section class="panel settings-group" aria-labelledby="set-look">
      <h2 class="root-row__title" id="set-look">Look</h2>
      <div class="settings-row">
        <span>Body</span>
        <div class="chip-row">
          <button class="chip" data-set="theme" data-value="day" ${pressed(settings.theme !== 'night')}>Day</button>
          <button class="chip" data-set="theme" data-value="night" ${pressed(settings.theme === 'night')}>Night</button>
        </div>
      </div>
      <div class="settings-row">
        <span>Movement (the disc and the ticker)</span>
        <div class="chip-row">
          <button class="chip" data-set="reduceMotion" data-value="false" ${pressed(!settings.reduceMotion)}>On</button>
          <button class="chip" data-set="reduceMotion" data-value="true" ${pressed(settings.reduceMotion)}>Reduced</button>
        </div>
      </div>
    </section>

    <section class="panel settings-group" aria-labelledby="set-backup">
      <h2 class="root-row__title" id="set-backup">Backup</h2>
      <p class="progress-empty">Last backup: <strong>${lastExport}</strong>. ${state.sessions.length} sessions, ${state.reps.length} reps saved.</p>
      ${isUsingMemoryStorage() ? '<p class="progress-empty">This window can\'t save, so export a backup before you close it.</p>' : ''}
      <div class="measure__row">
        <button class="button button--primary" data-export>Export backup</button>
        <label class="button settings-import">Import a backup<input type="file" accept="application/json,.json" data-import hidden></label>
      </div>
      ${message ? `<p class="settings-message" role="status">${escapeHtml(message)}</p>` : ''}
    </section>`;

  bindEvents(document.getElementById('pg-settings'));
}

// ─── Events ───

// Saves each change straight away and redraws.
function bindEvents(page) {
  page.querySelector('[data-name]').addEventListener('change', (event) => {
    updateSettings({ name: event.target.value.trim() || 'Baranay' });
    showMessage('Name saved.');
  });
  page.querySelectorAll('[data-set]').forEach((chip) => {
    chip.addEventListener('click', () => {
      updateSettings({ [chip.dataset.set]: readValue(chip.dataset.value) });
      applyLook();
      window.dispatchEvent(new Event('tempo-settings-changed'));
      message = '';
      renderSettingsPage();
    });
  });
  page.querySelector('[data-export]').addEventListener('click', () => {
    downloadBackup();
    showMessage('Backup downloaded. Keep the file somewhere safe.');
  });
  page.querySelector('[data-import]').addEventListener('change', (event) => importFile(event.target.files[0]));
}

// Turns "true", "false" and numbers from data attributes into real values.
function readValue(text) {
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (/^\d+$/.test(text)) return Number(text);
  return text;
}

// Applies the theme and motion choice to the page right away.
function applyLook() {
  const settings = getSettings();
  document.body.dataset.theme = settings.theme === 'night' ? 'night' : 'day';
  document.body.classList.toggle('motion-off', Boolean(settings.reduceMotion));
}

// Replaces all data with a backup file, after a clear warning.
async function importFile(file) {
  if (!file) return;
  if (!confirm('Replace everything in Tempo with this backup? Your current data will be overwritten.')) return;
  try {
    const state = await importBackupFile(file);
    applyLook();
    showMessage(`Backup imported: ${state.sessions.length} sessions, ${state.reps.length} reps.`);
  } catch (error) {
    showMessage(`That file couldn't be imported. ${error.message}`);
  }
}

// Shows a short message under the backup keys.
function showMessage(text) {
  message = text;
  renderSettingsPage();
}
