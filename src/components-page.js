// The design system's component page (components.html): every Phase 3 component in
// each of its states, with the colour tokens and the font candidates side by side.
// It is the "done when" for Phase 3 and the reference while building pages in Phase 4.

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';

import { getVoicings } from './chords/voicings.js';
import { renderChordDiagram } from './components/chord-diagram.js';
import { renderNeck } from './components/neck.js';
import { renderVinylMetronome, bindVinylMetronome } from './components/vinyl-metronome.js';
import { renderStub, renderStubStack } from './components/stub.js';
import { renderTicker } from './components/ticker.js';
import { renderTapedCard, renderPolaroid } from './components/taped-card.js';
import { renderArtPlaceholder, ART_SPECS } from './components/art-placeholder.js';
import { getMetronome } from './audio/metronome.js';

// Page options the visitor can change at the top.
const view = {
  leftHanded: false,
  motionOff: false,
  accent: 'coral',
};

// ─── Sample data ───

// Openings for the ticker, written the way the real ones will read.
const SAMPLE_OPENINGS = [
  'C→G: 3 changes from your best',
  'B string buzzed in Am',
  'F barre rusty, 9 days',
  'Try C from memory',
  'Am–F–C–G at 80 BPM',
  'Can you hear C7 vs Cmaj7?',
];

// A proposed session, as taped setlist cards.
const SAMPLE_SETLIST = [
  { kicker: 'Warm-up · 3 min', title: 'Spider walk', body: 'One finger per fret, slow and even.', note: 'loosen up', meta: '72 BPM', colour: 'paper', state: 'done' },
  { kicker: 'Fix', title: 'Am buzz', body: 'B string buzzed 4 of the last 10 reps.', note: 'arch the ring finger', meta: '10 reps', colour: 'coral', state: 'current' },
  { kicker: 'Push', title: 'C ↔ G', body: 'Best is 34 changes in a minute.', note: 'try 36', meta: '1 min', colour: 'mustard', state: 'default' },
  { kicker: 'Review', title: 'F barre', body: '9 days since you last played it.', note: 'rusty', meta: '5 min', colour: 'paper', state: 'default' },
  { kicker: 'Ear · 2 min', title: 'Intervals', body: 'Level 3: m3 vs M3.', note: 'eyes closed', meta: '12 Qs', colour: 'mint', state: 'default' },
  { kicker: 'Free play', title: 'Anything', body: 'No timer. Play what you like.', note: 'for fun', meta: '∞', colour: 'pink', state: 'default' },
];

// Example stubs, newest first.
const SAMPLE_STUBS = [
  { number: 42, date: '2026-10-12T19:40:00', minutes: 34, title: 'Setlist: 5 blocks', bests: ['C↔G 36/min', 'Am clean 9/10'], mistake: 'B string buzz in Am (3×)', nextOpening: 'F barre at 70 BPM' },
  { number: 41, date: '2026-10-11T20:05:00', minutes: 18, title: 'Short one', bests: [], mistake: 'Late change G→C', nextOpening: 'C↔G one-minute test' },
  { number: 40, date: '2026-10-09T18:30:00', minutes: 25, title: 'Free play', bests: [], mistake: null, nextOpening: null },
];

// The colour tokens shown as swatches: name, role, and the text colour that sits on it.
const SWATCHES = [
  ['stage', 'Page background', 'text'],
  ['stage-2', 'Raised surfaces', 'text'],
  ['stage-3', 'Hover, wells', 'text'],
  ['paper', 'Posters, stubs, polaroids', 'ink'],
  ['coral', 'Practice · Today · Chords', 'ink'],
  ['mint', 'Ear training', 'ink'],
  ['mustard', 'Theory', 'ink'],
  ['pink', 'Progress · milestones', 'ink'],
  ['violet-line', 'Live only (glow)', 'ink'],
];

// Font roles with the candidates from the plan; the first one is the pick.
const FONT_ROLES = [
  { role: 'Display / poster', sample: 'TONIGHT’S SETLIST 128', candidates: ["'Anton'", "'Big Shoulders Display'"], weights: [400, 900], size: '2.6rem', upper: true },
  { role: 'Deco accent (one word per hero)', sample: 'Backstage', candidates: ["'Limelight'", "'Poiret One'"], weight: 400, size: '2.4rem' },
  { role: 'Text / UI', sample: 'Press just behind the fret, not on top of it. You changed C→G 4 more times than last week.', candidates: ["'Hanken Grotesk'", "'Familjen Grotesk'"], weight: 400, size: '1.05rem' },
  { role: 'Mono (BPM, timers, frets)', sample: '092 BPM · 03:45 · x32010', candidates: ["'DM Mono'"], weight: 500, size: '1.3rem' },
  { role: 'Handwritten (stand-in for your own font)', sample: 'arch the ring finger!', candidates: ["'Caveat'"], weight: 500, size: '1.8rem' },
];

// ─── Page ───

// Draws the whole page and connects its controls.
function renderPage() {
  const kit = document.getElementById('kit');
  document.body.classList.toggle('motion-off', view.motionOff);
  document.body.style.setProperty('--accent-now', `var(--${view.accent})`);

  kit.innerHTML = [
    renderIntro(),
    renderSection('colour', 'Tokens', 'Colour', renderSwatches()),
    renderSection('type', 'Pick by testing', 'Type', renderFontRoles()),
    renderSection('controls', 'Real buttons, big targets', 'Buttons & chips', renderControls()),
    renderSection('ticker', "Today's openings", 'Marquee ticker', renderTickerStates()),
    renderSection('setlist', "Tonight's setlist", 'Taped cards', renderSetlist()),
    renderSection('polaroids', 'Milestones & artwork', 'Polaroids', renderPolaroids()),
    renderSection('stubs', 'One per session', 'Ticket stubs', renderStubs()),
    renderSection('diagrams', 'Every shape, drawn the same way', 'Chord diagrams', renderDiagrams()),
    renderSection('neck', 'The chord lives all over the neck', 'Fretboard', renderNecks()),
    renderSection('vinyl', 'One turn per bar', 'Vinyl metronome', renderVinylMetronome()),
    renderSection('art', 'Until your artwork exists', 'Art placeholders', renderArtFrames()),
    renderSection('empty', 'Where data is missing', 'Empty state', renderEmptyState()),
  ].join('');

  bindControls(kit);
  bindVinylMetronome(kit);
}

// The page header: title and the view options (handedness, motion, accent).
function renderIntro() {
  const accents = ['coral', 'mint', 'mustard', 'pink']
    .map((accent) => `<button class="chip" data-accent="${accent}" aria-pressed="${view.accent === accent}">${accent}</button>`)
    .join('');
  return `
    <header class="kit__intro">
      <div class="section-head">
        <span class="section-head__kicker">Tempo · Phase 3</span>
        <h1 class="section-head__title section-head__title--hero">The kit <span class="section-head__deco">backstage</span></h1>
        <p class="section-head__lead">Every piece of the stage-poster design system, in each of its states. Pages in Phase 4 are built only from these.</p>
      </div>
      <div class="kit__options" role="group" aria-label="View options">
        <button class="chip" data-option="leftHanded" aria-pressed="${view.leftHanded}">Left-handed</button>
        <button class="chip" data-option="motionOff" aria-pressed="${view.motionOff}">Reduced motion</button>
        <span class="kit__options-label">Section accent</span>
        ${accents}
      </div>
    </header>`;
}

// Wraps one showcase section with its kicker and title.
function renderSection(id, kicker, title, body) {
  return `
    <section class="kit__section" id="${id}" aria-labelledby="${id}-title">
      <div class="section-head">
        <span class="section-head__kicker">${kicker}</span>
        <h2 class="section-head__title" id="${id}-title">${title}</h2>
      </div>
      ${body}
    </section>`;
}

// ─── Showcase blocks ───

// Colour swatches with their role and the text colour used on them.
function renderSwatches() {
  return `<div class="kit__swatches">${SWATCHES.map(([name, role, textToken]) => `
    <div class="kit__swatch" style="background:var(--${name});color:var(--${textToken})">
      <strong>--${name}</strong><span>${role}</span><span class="kit__swatch-note">text: --${textToken}</span>
    </div>`).join('')}</div>
    <p class="kit__note">Every text colour reaches WCAG AA (4.5:1) on the surfaces it is used on; tests/tokens.test.js checks this. Text on coral and mustard is dark ink: white on coral is only 3.1:1.</p>`;
}

// Each font role with its candidates rendered on the same sample text.
function renderFontRoles() {
  return FONT_ROLES.map((role) => `
    <div class="kit__font-role">
      <h3 class="kit__label">${role.role}</h3>
      <div class="kit__font-candidates">
        ${role.candidates.map((family, index) => `
          <figure class="kit__font">
            <div style="font-family:${family};font-weight:${role.weights ? role.weights[index] : role.weight};font-size:${role.size};line-height:1.1;${role.upper ? 'text-transform:uppercase;' : ''}">${role.sample}</div>
            <figcaption>${family.replaceAll("'", '')} ${index === 0 ? '<span class="chip chip--standard">picked</span>' : '<span class="chip">candidate</span>'}</figcaption>
          </figure>`).join('')}
      </div>
    </div>`).join('');
}

// Buttons in every state, tag chips, toggle chips and stat chips.
function renderControls() {
  const roots = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  return `
    <div class="kit__row">
      <button class="button button--primary">Start session</button>
      <button class="button button--ghost">Edit setlist</button>
      <button class="button button--live">Stop · live</button>
      <button class="button button--ghost button--icon" aria-label="Play chord">▶</button>
      <button class="button button--primary" disabled>Disabled</button>
    </div>
    <p class="kit__note">Press Tab to see the focus ring. Every button is at least 44 px tall for playing with a guitar in hand.</p>
    <h3 class="kit__label">Tags</h3>
    <div class="kit__row">
      <span class="chip chip--standard">standard</span><span class="chip chip--found">found</span><span class="chip chip--stretch">stretch</span>
      <span class="chip chip--easy">easy</span><span class="chip chip--medium">medium</span><span class="chip chip--hard">hard</span>
    </div>
    <h3 class="kit__label">Picker (root)</h3>
    <div class="kit__row" role="group" aria-label="Root note">
      ${roots.map((root) => `<button class="chip" data-root="${root}" aria-pressed="${root === 'C'}">${root}</button>`).join('')}
    </div>
    <h3 class="kit__label">Stat chips</h3>
    <div class="kit__row">
      <div class="stat-chip"><span class="stat-chip__value">36</span><span class="stat-chip__label">C↔G per min</span></div>
      <div class="stat-chip"><span class="stat-chip__value">92</span><span class="stat-chip__label">clean BPM</span></div>
      <div class="stat-chip"><span class="stat-chip__value">9/10</span><span class="stat-chip__label">Am clean</span></div>
    </div>`;
}

// The ticker scrolling, and its still version for reduced motion.
function renderTickerStates() {
  return `
    <h3 class="kit__label">Scrolling (pauses on hover or focus)</h3>
    ${renderTicker(SAMPLE_OPENINGS)}
    <h3 class="kit__label">Reduced motion: a still list</h3>
    <div class="motion-off">${renderTicker(SAMPLE_OPENINGS, { label: "Today's openings (still)" })}</div>`;
}

// A proposed session as taped cards: done, current and coming up.
function renderSetlist() {
  const cards = SAMPLE_SETLIST.map((block, index) => renderTapedCard({
    ...block,
    index,
    actions: block.state === 'current' ? '<button class="button button--ghost">Log rep</button>' : '',
  }));
  return `<div class="kit__grid kit__grid--cards">${cards.join('')}</div>
    <p class="kit__note">States: done (crossed out), current (outlined, "Now playing" for screen readers), coming up.</p>`;
}

// Milestone polaroids holding art placeholders.
function renderPolaroids() {
  const milestones = [
    ['First clean F barre', 'Oct 2026'],
    ['60 changes a minute', 'not yet'],
    ['C in all 5 CAGED shapes', 'not yet'],
  ];
  return `<div class="kit__grid kit__grid--polaroids">${milestones.map(([caption, date], index) => renderPolaroid({
    pictureHtml: renderArtPlaceholder('stamp', caption),
    caption,
    date,
    index,
  })).join('')}</div>`;
}

// One full stub, one with nothing special, and the stub stack.
function renderStubs() {
  return `
    <div class="kit__grid kit__grid--two">
      <div><h3 class="kit__label">Full</h3>${renderStub(SAMPLE_STUBS[0])}</div>
      <div><h3 class="kit__label">Nothing to report</h3>${renderStub(SAMPLE_STUBS[2])}</div>
    </div>
    <h3 class="kit__label">Session log: the stub stack</h3>
    ${renderStubStack(SAMPLE_STUBS)}`;
}

// Diagrams for the main kinds of shape: open, barre, triad inversion, damped, stretch, high up.
function renderDiagrams() {
  const pick = (root, quality, test) => getVoicings(root, quality).find(test);
  const examples = [
    ['Open', pick('C', 'major', (voicing) => voicing.shape === 'open')],
    ['Barre', pick('F', 'major', (voicing) => voicing.shape === 'E-form barre')],
    ['Triad, 1st inversion', pick('C', 'major', (voicing) => voicing.symbol === 'C/E' && voicing.position > 0)],
    ['Damped string', pick('G', 'major7', (voicing) => voicing.damped.length > 0)],
    ['Stretch', pick('A', 'add9', (voicing) => voicing.stretch)],
    ['High up the neck', pick('C', 'minor7', (voicing) => voicing.position >= 8)],
  ];
  return `
    <div class="kit__grid kit__grid--diagrams">${examples.map(([label, voicing]) => `
      <figure class="kit__diagram">
        ${renderChordDiagram(voicing, { size: 160, leftHanded: view.leftHanded })}
        <figcaption><strong>${voicing.symbol}</strong> · ${label}<br><span class="chip chip--${voicing.source === 'found' ? 'found' : 'standard'}">${voicing.source}</span> <span class="chip chip--${voicing.difficulty}">${voicing.difficulty}</span>${voicing.stretch ? ' <span class="chip chip--stretch">stretch</span>' : ''}</figcaption>
      </figure>`).join('')}
    </div>
    <p class="kit__note">Roots are coral. Numbers are fingers; the row underneath shows each string's interval. Toggle "Left-handed" at the top to mirror.</p>`;
}

// The neck with all chord tones, with one shape highlighted, and another chord.
function renderNecks() {
  const barre = getVoicings('C', 'major').find((voicing) => voicing.shape === 'A-form barre');
  const am7 = getVoicings('A', 'minor7').find((voicing) => voicing.shape === 'open');
  return `
    <h3 class="kit__label">C major: every chord tone</h3>
    ${renderNeck('C', 'major', { leftHanded: view.leftHanded })}
    <h3 class="kit__label">C major with ${barre.name} highlighted</h3>
    ${renderNeck('C', 'major', { voicing: barre, leftHanded: view.leftHanded })}
    <h3 class="kit__label">Am7 with the open shape highlighted</h3>
    ${renderNeck('A', 'minor7', { voicing: am7, leftHanded: view.leftHanded })}
    <p class="kit__note">On a phone the neck scrolls sideways inside its frame; the page itself never does.</p>`;
}

// One placeholder of each artwork kind, with the size and folder it needs.
function renderArtFrames() {
  const subjects = { hero: 'Practice', character: 'Waving', cover: 'Open chords', texture: 'Paper grain', stamp: 'First barre', icon: 'Metronome' };
  return `<div class="kit__grid kit__grid--art">${Object.keys(ART_SPECS).map((kind) => `<div>${renderArtPlaceholder(kind, subjects[kind])}</div>`).join('')}</div>
    <p class="kit__note">Never filled with stock or AI images. Drop real art into the folder shown and it replaces the frame.</p>`;
}

// A character stands in where there's no data yet.
function renderEmptyState() {
  return `
    <div class="empty-state">
      ${renderArtPlaceholder('character', 'Shrugging')}
      <div>
        <h3 class="empty-state__title">No stubs yet</h3>
        <p class="empty-state__text">Your first session prints a ticket here: minutes, new bests and what to try next.</p>
        <button class="button button--primary">Start a session</button>
      </div>
    </div>`;
}

// ─── Events ───

// Connects the view options and the demo pickers.
function bindControls(kit) {
  kit.querySelectorAll('[data-option]').forEach((button) => {
    button.addEventListener('click', () => {
      view[button.dataset.option] = !view[button.dataset.option];
      renderPage();
    });
  });
  kit.querySelectorAll('[data-accent]').forEach((button) => {
    button.addEventListener('click', () => {
      view.accent = button.dataset.accent;
      renderPage();
    });
  });
  kit.querySelectorAll('[data-root]').forEach((button) => {
    button.addEventListener('click', () => {
      kit.querySelectorAll('[data-root]').forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
    });
  });
}

// ─── Start ───

getMetronome().setBpm(92);
renderPage();
