# Tempo: notes for Claude Code

A personal guitar practice website for Baranay (guitarist, illustrator, design student).
Personal use first, possibly published later. The full brief is `TEMPO_PLAN.md` (v2.1: design direction, phase status
and review flow are current). Read it before starting a new phase.

## How to work
- Work **phase by phase** (table below). At the end of each phase: stop, summarize what changed, and wait for approval.
- Ask before deciding anything the brief leaves open.
- Review flow (Baranay's rule, 12 Oct 2026): work on a local branch, run tests + build, then run
  `npm run preview:file` and give Baranay the single-file previews in `preview/` (they open straight from the Finder).
  Only after he approves: merge into `main` and push. Every push to `main` republishes the live site
  (GitHub Actions → Pages). Never push unapproved work.

## Core decisions (plan §1)
- **Look:** analog meets modern (Teenage Engineering / Nothing), sans-serif only, guitar-materials colours; see "Notes from Phase 3" below and plan §3. Placeholder frames until the art exists. Never stock or AI images.
- **Practice model:** no "+10%" buttons and no 100% ceiling. Progress comes from measured attempts, and there is always a next opening (§6).
- **Chords:** generated from theory and validated by Vitest, never typed in by hand (§5).
- **Ear training:** build it (§8). **Theory:** scaffolding now, content later (§9).
- **Microphone:** later, but the data model must allow it.

## Stack and layout (plan §11)
Vite + vanilla JS (ES modules), Chart.js, Vitest. No framework.

```
index.html
src/main.js        app start      src/router.js   tabs and page switching
src/theory/        notes, intervals, scales, chord formulas (one shared engine)
src/chords/        shapes, generator, fingering
src/practice/      items, measures, openings, spacing, session, history
src/audio/         engine, metronome, guitar synth
src/ear/           one file per exercise + scoring
src/state/         storage (schema, migration, backup), settings
src/data/          static lists (chords-v1 is temporary, replaced in Phase 2)
src/pages/         one file per page
src/components/    reusable UI pieces
src/utils/         small helpers (time formatting)
src/styles/        tokens.css, base.css, components.css, pages.css
content/theory/    lecture.md, exercises.json, quiz.json per topic
assets/art/        heroes, characters, covers, textures, stamps, icons
tests/             Vitest tests
```

Commands: `npm run dev`, `npm test`, `npm run build`.

## Code conventions (Baranay's style)
- Every file starts with a comment saying what it does.
- Group functions under section comments: `// ─── Rendering ───`.
- Readable names (`renderChordsPage`, not `rGuitar`).
- A one-line comment above each function explaining its purpose.
- No minified one-liners. Small functions, one job each.
- All copy in plain, human English. Encouraging and specific, no hype words.
- Accessibility: real buttons, visible focus, text ≥ 12px, WCAG AA contrast, respect `prefers-reduced-motion`.
- Works at phone width with large tap targets.

## Phases (plan §12)
| Phase | Work | Done when |
|---|---|---|
| 0. Set up ✅ | Vite, structure, CLAUDE.md, Vitest, v1 code moved into modules with no behaviour change | App runs as before from `npm run dev` |
| 1. Core ✅ | `theory/`, storage v2 + migration + backup, Web Audio engine, lookahead metronome, guitar synth | Metronome stays in time over 5 min; migration test passes |
| 2. Chord engine ✅ | Shapes, generator, fingering, validation tests (§5.4) | All tests pass incl. C and F regressions; every chord has ≥ 5 voicings |
| 3. Design system ✅ | Tokens, fonts, components, art placeholders | One component page shows every component in its states |
| 4. Pages ✅ | Chords → Practice → Today → Progress → Settings | A full session runs: setlist → measured reps → stub; openings change with data |
| 5. Ear training ✅ | §8, linked to the practice model | All 8 exercises play; confusion duels appear |
| 6. Theory scaffold ✅ | §9 folders, renderers, topic 1 sample | Topic 1 works end to end |
| 7. Review fixes | §17.4 items 1–8 in order, updates and fixes only (no redesign); stop after each item | Every 17.4 item ticked; a phone session at 390 px reaches the current block without scrolling |

## Known v1 issues still in the code (fixed in later phases)
Unverified song lists, self-rated mastery
(`src/state/legacy-ratings.js`, still on its v1 key), fake radar values, Mon→Sun weekly labels,
streak showing 0 before today's practice, clickable `div`s and small text. See plan §2.
Fixed in Phase 1: drifting metronome, hard-coded greeting name, minutes-only v1 storage.
Fixed in Phase 2: wrong C and F shapes, G tip/fingering mismatch (shapes now come from the engine).

## Notes from Phase 1
- Storage: `getState()` / `updateState(fn)` in `src/state/storage.js`. v1 keys are migrated once and kept as a safety copy.
  The `chordRatingsDropped` notice is waiting to be shown when Phase 4 removes the +10% UI.
- Metronome: `createMetronome()` is the pure timing core (tested on a fake clock); the app uses `getMetronome()`.
  Clicks are booked on the audio clock from a fixed anchor, with a Web Worker ticker.
- Guitar sound: `playChord(frets)` / `playNote(midi)` in `src/audio/guitar-synth.js` (Karplus-Strong, tuned within 5 cents).
- Backup export/import functions exist (`downloadBackup`, `importBackupFile`); their buttons come with the Settings page in Phase 4.

## Notes from Phase 2
- Chord library entry point: `getVoicings(root, quality)` / `getVoicingsForSymbol('F#m7')` in `src/chords/voicings.js`.
  Returns standard shapes first, then the best "found" shapes, each ordered from the nut up.
  `position` 0 means open position. Results are cached per chord.
- Curated shapes live in `src/chords/shapes.js`; tests/chords.test.js checks every voicing against plan §5.4.
- Found shapes need 4+ strings (triads are standard shapes) and may only use open strings up to fret 7.
- The v1 Guitar page shows each chord's first standard voicing until Phase 4 builds the real Chords page.

## Notes from Phase 3 (design system, revision 2)
- Baranay's direction (12 Oct 2026): sans-serif only; analog meets modern like Teenage Engineering and Nothing
  (refs 5–9 in References/); no copied reference colours and no generic "AI" palettes; the vinyl should be abstract.
  This replaces the stage-poster look in TEMPO_PLAN.md §3 (dark stage, coral, Anton/Limelight).
- Look: light device-body panels (day theme, default) or ebony (night theme); dark inset screens for live data
  (neck, readouts, ticker); keycap buttons; LED dots (green phosphor LED only for "running"); mono spec labels;
  paper pieces: thermal-receipt session stubs, label-maker strips on setlist cards, polaroids for art.
- Colour = guitar CMF: ebony, bone, nickel, phosphor-bronze (Today/Chords/Practice), verdigris (Ear),
  "sonic blue" (Theory), "shell pink" (Progress). Placeholder until Baranay sets a palette.
- Type: Archivo (wide for headings, normal for text), Doto (dot-matrix readouts), Martian Mono (labels/numbers),
  Caveat (stand-in for Baranay's handwriting font).
- Component page: `components.html` (built and published next to the app). Build Phase 4 pages from these parts only.
- New styles only apply inside `.stage`; set `data-theme="day"|"night"` on it. Pages set `--accent-now` and
  `--accent-text` for their section. Text on accent fills and paper is `--ink`. `tests/tokens.test.js` checks contrast in both themes.
- Disc metronome: the playhead is steered by the audio clock (lands exactly on each beat); grooves turn via CSS.

## Notes from Phase 4
- App shell: sticky top bar (`src/components/top-bar.js`) with Today, Practice, Chords (A–G), Ear (overview + each game), Theory, Progress, and ⚙
  quick settings (day/night, left-handed, reduced motion; saved in `settings`). Production is hidden.
- Routing is hash-based (`src/router.js`): `#/today`, `#/chords/C`, `#/chord/Cmaj7` (use `chordLink()`), `#/practice`, `#/progress`, `#/ear`, `#/theory`.
  The router keeps the current page itself and handles `#/` link clicks, because the Claude app viewer blocks address changes.
  Use `navigate()` / `currentRoute()` / `refreshRoute()`, never `location.hash` directly.
- Phone menu: plain pages as links, categories (Chords, Ear) fold out in place; the current category opens by itself.
  The current page is tinted in its section colour with an LED dot; hover stays grey.
- Chords page ✅: A–G categories (`src/chords/library.js`: sharps/flats under their letter), thumbnails show the most common
  shape (open → E/A-form barre → E/A-string root → any full shape), chord view with tones, type switcher, neck, focus panel, strip.
- 6 and m6 chords added (12 roots × 14 types).
- Practice ✅: practice model in `src/practice/` (items, measures, spacing, openings, session; tested in tests/practice.test.js),
  mistake tips in `src/data/mistake-tips.js`, measuring tools in `src/components/measure-tools.js`. Page flow:
  setlist (taped cards, reorder/remove) → blocks with timer + tool (⏎ = clean / tap / clean pass) → receipt.
  Practice layout (Phase 7.3): planning = metronome hero (H1 "Metronome") above the setlist; during a session the block is
  the hero and the metronome folds into `renderMetronomeBar` (LED, BPM, beat lights, − / start / +, Settings opens the panel);
  after finishing the receipt is the hero. Chord pages have "+ Add to practice".
- Today ✅ (ticker, hero with tonight's setlist built on a copy of the state, real tiles, next steps, chord clean rates),
  Progress ✅ (groove disc, receipts, personal bests with sparklines, milestones in `src/practice/milestones.js`,
  mistake patterns, clean rates, heatmap, log), Settings ✅ (`#/settings`: name, handedness, rest days, look, backup).
- Storage falls back to memory when the browser blocks localStorage (locked-down previews); a notice says so.
- The v1 styles and tokens are deleted; every page uses design-system classes only (panel, stat, split, chord-rate, heatmap, session-log ...).

## Notes from Phase 5
- Ear games live in `src/ear/`, one file each. A game is a pure question builder: `makeQuestion(level, random, { pool })` returns
  `{ kind: 'choice'|'self'|'fretboard'|'tap', prompt, options, answer, sound, explain }`. Sounds play through `src/audio/instruments.js`
  (clean guitar, distorted guitar, piano, synth; picked in `settings.earTimbres`).
- Scoring (`src/ear/scoring.js`): stars from the last 10 answers, 4 stars open the next level, 3+ mix-ups of the same pair make a confusion duel.
  Duels lead the daily workout (`src/ear/workout.js`), become ear Fix openings, and the setlist's ear block plays them.
- One quiz player for everything: `mountEarQuiz(container, { drills, compact })` in `src/components/ear-quiz.js` (Ear page, workout, practice ear block).
- Routes: `#/ear`, `#/ear/<game>`, `#/ear/workout`, `#/ear/duel/<game>/<expected>~<heard>`.
- Song anchors for intervals are in `src/ear/common.js` (SONG_ANCHORS): Baranay to check them.

## Notes from Phase 6
- Lessons live in `content/theory/<NN-topic>/`: `lecture.md`, `exercises.json`, `quiz.json`. `content/theory/topics.json` lists all ten
  topics in order; a topic without its three files shows as "Being written". Files are bundled at build time (`import.meta.glob`),
  so lessons work offline and in the single-file preview. Topic 1 (Notes on the fretboard) is written; topics 2–10 are empty folders.
- Engine in `src/lessons/`: `content.js` (load + `findTopicProblems` checks), `markdown.js` (safe subset; `::neck` embed lines),
  `embeds.js`, `exercises.js` (types `name-note`, `find-note`, `octave`, generated from the theory engine), `progress.js`.
- Writing a new topic: add the three files, then `npm test` (tests/theory-lessons.test.js checks every ready topic).
  Lecture embeds: `::neck strings=E,A notes=C,D frets=0-12 caption="..."` or `::neck marks="E:3:G,D:5:G"`.
- Runner: `mountExerciseRun` / `mountQuizRun` in `src/components/lesson-run.js`. Neck answers use `renderNeckMarks(..., { inputStrings })`.
- Progress: `state.theory.results` (lecture read, best runs; 80% is a pass). A topic is done when the lecture, every exercise and the quiz pass.
- Routes: `#/theory`, `#/theory/<topic>`, `.../exercises`, `.../exercises/<id>`, `.../quiz`.

## Pixel-art stand-ins (13 Oct 2026, Baranay's request)
- Art frames show hand-coded pixel sprites until Baranay's own art exists (not stock, not AI): engine `src/art/pixel.js`
  (canvas with rect/disc/ring/line/glyph, flip-book frames, CSS motions), sprites in `src/art/sprites.js` keyed like
  `hero:today`, `cover:ear-<game>`, `cover:theory-<topic>`, `stamp:<milestone id>`.
- Art drop-in (Phase 7.1): `assets/art/manifest.js` lists every art key; filling in `file:` shows Baranay's file
  (bundled via `import.meta.glob`, works in previews). Order: file → pixel sprite → dashed frame (`src/art/resolve.js`).
  tests/art.test.js fails if a frame has no manifest line or a named file is missing. components.html lists every key.
- Today (Phase 7.2, Baranay chose the ticker): one hero (art + setlist, the only CTA), ticker with the top 3 openings,
  one dot-matrix stats strip, "Your shapes" (practised voicings only, clean rate + status label from `src/practice/status.js`, plan 6.7).
  The v1 chord grid, KPI tiles and Next steps are gone. Colours are theme tokens; animation stops with Reduced motion.
- 19 sprites: Today hero, 8 ear covers, theory topic 1 cover, 9 milestone stamps (locked ones show grey).
- Next: write topics 2–10 (content), then the "Later" list in plan §12.
