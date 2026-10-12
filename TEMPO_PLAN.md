# Tempo — Claude Code Handover Brief

**Repo:** `korook/TEMPO-Personal.Music.Development.Tracker` (currently one `index.html`, 388 lines)
**Owner:** Baranay — Industrial + Communication Design student, guitarist, illustrator
**Purpose:** a personal guitar practice website that looks professional, feels encouraging and carries Baranay's own artwork. Personal use first, possibly published later.
**Version:** 2.0 — rewritten 12 Oct 2026 (replaces v1 of this file)

> **For Claude Code:** read this whole file before writing code. Work phase by phase (section 12). At the end of each phase, stop, summarize what changed and wait for approval. Ask before deciding anything this brief leaves open.

---

## 1. Core decisions

| Topic | Decision |
|---|---|
| Visual direction | **Stage poster × Baranay's multimedia art.** Dark stage base, warm coral, bold display type, collage elements (vinyl, taped cards, polaroids, stubs), with his illustrations as the hero of each page. The visuals themselves should invite the user to practice, not just look high-contrast. |
| Mastery model | **No more "+10%" buttons and no 100% ceiling.** Progress comes from measured attempts. The app always shows the next mistake to fix or the next opening to try, even for skills that are well learned (section 6). |
| Chords | **Rebuild the chord library.** Every chord is correct and validated by automated tests, with all practical voicings across the fretboard (section 5). |
| Ear training | Build now (section 8). |
| Music theory | Folder structure and content format now, content later (section 9). |
| Microphone features | Later (tuner, buzz detection, recordings). Design the data so they can plug in. |
| Audience | Personal now. Keep the code clean enough to publish. |

---

## 2. Audit of the current code

### Wrong chord data (fix first)
Checked by script: every played note against the chord's notes.

| Chord | Stored | Correct | Problem |
|---|---|---|---|
| **C** | `x01023` | `x32010` | String order is reversed after the muted string. It currently sounds A, D#, G, C#, G. |
| **F** | `112331` | `133211` | Reversed. Contains A#, E and D, which are not in F major. |
| C7 | `x32310` | (correct) | Omits the 5th (G). That's normal for this shape, but show it as "5th omitted". |
| G | tip says pinky on high E | fingering array says finger 3 | Tip and data disagree. |

The other 13 shapes are correct. **Song lists are unverified, and some are wrong.** For example, "Smells Like Teen Spirit" is played with power chords, not an open E. Remove all song lists. Only add a song back with a source link (section 5.6).

### Logic and code problems
- **Mastery is self-clicked** (+10% / −10%), so 100% is reached in 10 clicks. Replaced by section 6.
- **Skill radar uses fake data.** "Strumming / Rhythm / Ear" are the open-chord score × 0.8 / 0.6 / 0.4. Remove it.
- **Weekly chart labels are wrong.** They're always Mon→Sun, but the data is the last 7 days ending today.
- **The streak shows 0** if you practiced yesterday but not yet today.
- **The metronome drifts.** It uses `setInterval`, which isn't precise enough for audio timing.
- **Greeting name is hard-coded** ("Uglum").
- **Sessions only store minutes**, so there's no record of what was practiced.
- Clickable `div`s, text as small as 9px, no keyboard support.
- One file with minified one-line functions and short names (`gS`, `rDet`, `bCumul`), and no comments.
- **No backup.** All data is in localStorage and can be lost.

### Keep
- The general tab idea, Chart.js, the 28-day heatmap concept, the finger exercises list, and the transition drill progressions.

---

## 3. Design direction (from the 4 uploaded references)

### What each reference contributes
| Ref | Site | Take from it | Don't copy |
|---|---|---|---|
| ref1 | Stemtracks (dark, blue-violet glow) | Painted / surreal artwork used as cover tiles; vinyl discs peeking out behind cards; circular avatars; rounded dark cards; horizontal carousels | Generic marketplace layout, blue as the main colour |
| ref2 | Rechords (coral + black) | Big coral hero with a giant half-visible vinyl; Art Deco display headlines in caps; album-cover collage grid | E-commerce structure |
| ref3 | The Covasettes (illustrated band site) | Illustration as the hero; psychedelic poster frames; dark textured background with small planets and stars; chunky retro nav type | Busy pattern density everywhere |
| ref4 | Bake & Soda (record club) | Condensed bold headlines in several colours; a scrolling **marquee ticker**; **taped, slightly rotated cards**; **polaroid frames**; handwritten script labels; small stat chips; "made by hand" feel | Disco ball and party imagery |

**Common thread:** dark stage, coral heat, vinyl as a motif, art as cover, tactile collage on top of a clean grid.

### Colour tokens (starting point, tune in the browser)
| Token | Role | Starting value |
|---|---|---|
| `--stage` | Page background, with subtle grain | `#0d0c0e` |
| `--stage-2` | Raised surfaces | `#17151a` |
| `--paper` | Poster/polaroid/stub paper | `#f2e8d5` |
| `--coral` | Primary accent, Practice | `#ef6a45` (close to the current `#e85c3a`, which keeps continuity) |
| `--mint` | Ear training | `#7fd6b4` |
| `--mustard` | Theory | `#eabb4e` |
| `--pink` | Progress / milestones | `#f07aa0` |
| `--violet-glow` | "Live" states only: metronome running, timer on, recording | `#5b4bff` at low opacity |

**Flagged departure:** the violet glow (from ref1) is the only cool colour. Use it only for live states so it means "something is running right now". Remove it if it clashes with the art.

Each section owns one accent so the user always knows where they are. Text on coral and mustard must pass WCAG AA (test it).

### Typography
| Role | Use | Candidates (pick by testing) |
|---|---|---|
| Display / poster | Page heroes, big numbers | Condensed bold: **Anton**, **Big Shoulders Display** |
| Deco accent | One word per hero at most (ref2 feel) | **Limelight**, **Poiret One** |
| Text | Body, UI | **Hanken Grotesk**, **Familjen Grotesk** |
| Mono | BPM, timers, frets | **DM Mono** (keep) |
| Handwritten | Labels, setlist, stub notes | **Baranay's own handwriting as a font** (scan → font tool such as Calligraphr) |

Do not use Instrument Serif + Plus Jakarta Sans; that pairing reads as AI-template. The handwriting font is the most distinctive element. Use a temporary script font until it's ready.

### Motifs that do a job (not decoration)
- **Vinyl metronome:** the metronome is a record that spins at a speed tied to the BPM. Beat 1 flashes the label.
- **Groove progress:** weekly practice shown as rings on a record. Each ring is a week, and its thickness is the minutes practiced.
- **Ticket stub per session:** the end of a session prints a stub with the date, minutes, personal bests and next opening. The session log is a stack of stubs.
- **Marquee ticker** (ref4) at the top of the dashboard: today's openings scroll by, e.g. "C→G: 3 changes from your best ✦ B string buzzed in Am ✦ F barre rusty, 9 days".
- **Taped cards** for the session plan ("setlist") and **polaroids** for milestones and artwork.
- **Album-cover tiles** with Baranay's illustrations for chord families, ear games and theory topics.
- **Illustrated empty states:** his characters appear where data is missing.

### Avoid
- A row of four identical KPI tiles with coloured top stripes.
- Coloured dots before every title, emoji as icons, gradient blobs.
- Everything boxed in cards of the same weight. Each page has one hero.

### Copy tone
Plain, specific, encouraging. "You changed C→G 4 more times than last week" beats "Great job!". No hype words.

### Art asset spec
| Asset | Format | Size | Location |
|---|---|---|---|
| Section hero illustrations (6) | PNG transparent or SVG | 1600 × 1200 px | `assets/art/heroes/` |
| Character poses (empty states, milestones) | PNG transparent | 800 × 800 px | `assets/art/characters/` |
| Cover tiles (chord families, ear games, theory topics) | JPG/PNG | 1000 × 1000 px | `assets/art/covers/` |
| Textures (grain, paint, halftone, paper) | JPG/PNG, tileable | 1024 × 1024 px | `assets/art/textures/` |
| Milestone stamps | SVG | 400 × 400 px | `assets/art/stamps/` |
| Hand-drawn icons (optional) | SVG | 64 × 64 artboard | `assets/art/icons/` |

Until the art exists, use clearly marked placeholder frames (dashed border + label such as "HERO — Practice, 1600×1200"). Never use stock or AI images as filler.

---

## 4. Pages

| Page | Accent | Hero | Job |
|---|---|---|---|
| **Today** (dashboard) | coral | Illustration + "Tonight's setlist" | What to practice now and why; ticker of openings; quick start |
| **Chords** | coral | Neck view of the selected chord | Learn any chord in every position |
| **Practice** | coral | Vinyl metronome | Run a session: timed blocks, measurements, mistake logging |
| **Ear** | mint | Cover-tile game grid | Ear training games and daily workout |
| **Theory** | mustard | Topic covers | Lectures, exercises, quizzes (content later) |
| **Progress** | pink | Groove record + stub stack | Personal bests, trends, mistake patterns, milestones |
| Settings | — | — | Name, handedness, sound, backup export/import |

Production is hidden until it's planned.

---

## 5. Chord system rebuild

### 5.1 Principle
Chords are **generated from music theory and validated by tests**, not typed in by hand. This is how the C/F error happened, and it won't happen again.

### 5.2 Chord qualities (formulas in semitones from the root)
| Quality | Symbol | Formula | Required tones |
|---|---|---|---|
| Major | `C` | 0 4 7 | R 3 (5 may be omitted only in 7th+ chords) |
| Minor | `Cm` | 0 3 7 | R b3 |
| Power | `C5` | 0 7 | R 5 |
| Dominant 7 | `C7` | 0 4 7 10 | R 3 b7 |
| Major 7 | `Cmaj7` | 0 4 7 11 | R 3 7 |
| Minor 7 | `Cm7` | 0 3 7 10 | R b3 b7 |
| Sus2 | `Csus2` | 0 2 7 | R 2 5 |
| Sus4 | `Csus4` | 0 5 7 | R 4 5 |
| Add9 | `Cadd9` | 0 4 7 14 | R 3 9 |
| Diminished | `Cdim` | 0 3 6 | R b3 b5 |
| Augmented | `Caug` | 0 4 8 | R 3 #5 |
| Half-diminished | `Cm7b5` | 0 3 6 10 | R b3 b5 b7 |

All 12 roots × all qualities. Spell notes correctly for the key: Bb, not A#, in flat keys. The note spelling table lives in `src/theory/notes.js`.

### 5.3 Where voicings come from
1. **Standard shapes (primary, shown first).** Curated templates with fingerings that move along the neck:
   - Open chords (the classic first-position shapes).
   - **CAGED shapes** (C, A, G, E and D forms) for major, minor, 7, maj7 and m7.
   - E-form and A-form barre chords.
   - Triads on string sets (top 3 strings and middle strings) in root position, 1st and 2nd inversion.
   - Power chords with the root on the E and A strings.
2. **Generated voicings ("more voicings").** A search over frets 0–15 that keeps a shape only if it:
   - contains all required tones and only chord tones;
   - spans at most 4 frets (5 is allowed but flagged "stretch");
   - needs at most 4 fingers, where one finger can barre;
   - has no muted string between sounding strings, unless the template marks it as deliberately damped.

   Rank the results by playability and show the top results per position. Label them "found" so they're not confused with standard shapes.
3. **Inversions and slash chords.** If the lowest note isn't the root, name it as a slash chord (e.g. `C/E`) and label it as an inversion.

### 5.4 Validation tests (must pass before any UI work)
Use Vitest. For every voicing of every chord:
- every sounding note is a chord tone;
- all required tones are present;
- the name matches the bass note (root, or slash name);
- finger count ≤ 4 (barre counts as 1), and the fingering array matches the frets;
- the fret span limit holds.

Regression tests: C open = `x32010`, F barre = `133211`, G = `320003`, Am = `x02210`, D = `xx0232`, E = `022100`.

### 5.5 Chords page UI
- **Pick:** root (12 buttons) × quality (chips).
- **Neck view (hero):** the full fretboard (0–15) showing every chord tone, roots highlighted and other tones labelled by interval (R, 3, 5, b7...). This shows that the chord lives all over the neck.
- **Voicing strip:** voicing cards ordered from the nut up the neck. Use arrow keys (← →) to step through them; the neck view highlights the current voicing.
- **Voicing card:**
  - name (e.g. "C — A-form barre, fret 3"), starting fret, diagram with a drawn barre bar, finger numbers;
  - intervals per string, difficulty, "standard / found / stretch" tag;
  - ▶ play (synth strum), "+ add to practice".
- Optional left-handed toggle that mirrors all diagrams.

### 5.6 Song examples
Removed for now. If added later, each song needs a source link to a chord sheet, and the chord must actually appear in the song.

---

## 6. Practice system rebuild — "there is always a next step"

### 6.1 Principle
Self-rating (+10%) doesn't measure anything and caps at 100%. The new model:
1. **Measure attempts**, don't ask "did you practice it?".
2. **No percentage and no "mastered" state.** Show personal bests, recent form and trends.
3. **Always produce openings:** a specific next mistake to fix or a harder version to try, even for skills that are well learned.

### 6.2 What is practiced (practice items)
| Item type | Example | Measurements |
|---|---|---|
| Voicing | C open, F E-form barre | Clean rate, form time, recall without diagram |
| Change pair | C ↔ G | Changes per minute (1-minute test), highest clean BPM |
| Progression | Am–F–C–G | Highest clean BPM, strum pattern, consistency |
| Exercise | Spider walk | Highest clean BPM, minutes |
| Ear drill | Intervals level 3 | Accuracy, response time, confusion pairs (section 8) |

### 6.3 Measurements
- **Clean rate:** after each rep, a 6-string strip appears. Tap any string that buzzed (B) or was accidentally muted (M), or tap "all clean". Clean rate = clean reps / reps over the last 10.
- **Form time:** press Space, form the chord, strum, press Space again. Recent median in seconds.
- **Recall:** the diagram is hidden. Form the chord from memory, then reveal and compare. Result: yes / no.
- **One-minute changes:** 60-second timer; tap (or press Space) for each clean change. The score is the count.
- **Clean BPM:** the metronome changes chord every N beats. After a passage, mark "clean" or "not clean". Three clean passes in a row at a tempo sets a new personal best.

Measurements are still entered by the user, but they are counts, times and specific mistakes rather than a feeling. The data model stores raw reps so the microphone can fill them in later.

### 6.4 Mistake log
Each rep can be tagged with one or more mistakes:

| Mistake | Tag |
|---|---|
| String buzzes | `buzz:<string>` |
| String accidentally muted | `mute:<string>` |
| Wrong strings strummed | `strum-range` |
| Change was late | `late-change` |
| Lost the beat | `timing` |
| Fingers landed one at a time | `finger-order` |
| Too much pressure / tension | `tension` |

Each tag has a short, practical fix tip written in plain language, e.g. buzz → "Press just behind the fret, not on top of it." The tips live in `src/data/mistake-tips.js` and should be reviewed by Baranay.

The app counts tags over recent reps and turns repeated ones into openings ("B string buzzed in 4 of the last 10 Am reps").

### 6.5 Openings generator
`src/practice/openings.js` produces a ranked list of specific next steps from the data. Types:

| Opening | Trigger | Example text |
|---|---|---|
| Fix | A mistake tag repeats in recent reps | "Am: B string buzzed 4/10 times. Arch your ring finger." |
| Push | Recent form is near the personal best | "C↔G: best 34 changes/min. Try 36." |
| Review | Not practiced for a while (spacing interval passed) | "F barre: 9 days since last practice." |
| Expand | Item is consistently clean | "C is clean in open position. Learn the A-form barre at fret 3." |
| Context | A voicing is clean on its own | "Use C in the Am–F–C–G progression at 80 BPM." |
| Recall | Only practiced with the diagram visible | "Try C from memory." |
| Ear | Chord known by hand but not by ear | "Can you recognize C7 vs Cmaj7 by sound?" |

Even a fully clean item always has Expand, Context, Recall or Ear openings, so there's never a "done" state.

### 6.6 Staying fresh (spacing)
Each item has a review interval:
- A clean session makes the interval longer (e.g. ×2).
- A session with mistakes makes it shorter (e.g. back to 1 day).
- When the interval passes, the item shows as "rusty" and creates a Review opening.

This is a simple version of spaced repetition (Leitner-style). Keep the numbers in one config file so they can be tuned.

### 6.7 Status labels (optional, never a ceiling)
New → Learning → Steady → Fluent → In the fingers.

Labels come from the evidence (clean rate, recall, spacing interval). Every label shows what the next one needs. "In the fingers" still lists openings.

### 6.8 Session flow
1. **Setlist:** the app proposes a session as taped cards, which the user can edit, reorder or remove:
   - Warm-up (finger exercise, 3 min)
   - Fix (top Fix opening)
   - Push (top Push opening)
   - Review (one rusty item)
   - Ear (2 min drill)
   - Free play (untimed)
2. **Play:** each block has a timer and its own measurement tool. The metronome is available everywhere.
3. **Stub:** at the end a ticket stub summarizes the minutes, new personal bests, the most frequent mistake and tomorrow's top opening.

### 6.9 Progress page
- **Personal bests over time** per item, shown as a line with dates.
- **Mistake patterns:** most frequent tags this week compared with last week.
- **Fretboard heatmap of buzzes and mutes** by string and position.
- **Groove record** of weekly minutes, a **28-day heatmap** and the **stub stack**.
- **Milestones:** event-based stamps (first clean F barre, first 60 changes/min, first chord in all 5 CAGED shapes). These are achievements, not a level cap.

### 6.10 Encouragement rules
- Always compare against your own past, never against an "ideal".
- Show improvement first, then the opening.
- Streak: count from yesterday if today is empty ("2-day streak — play today to keep it"). Allow 1 rest day per week without breaking the streak.

---

## 7. Metronome and audio

- **Scheduler:** Web Audio lookahead scheduling (schedule clicks on `audioCtx.currentTime` slightly ahead), never `setInterval` timing.
- **Settings:** 30–240 BPM, tap tempo, time signatures (2/4, 3/4, 4/4, 6/8), subdivisions, accent on/off, sound choice.
- **Speed trainer:** +N BPM every N bars, up to a target.
- **Chord change mode:** shows the next chord every N beats for change-pair and progression drills.
- **Guitar synth:** Karplus-Strong plucked strings for chord playback, with a strum direction and speed. No sample files needed.
- **Keyboard shortcuts (Mac):**
  - Space: start / stop
  - ↑ / ↓: BPM ±1
  - ⇧↑ / ⇧↓: BPM ±5
  - T: tap tempo
  - Return: log a clean rep
  - B: log a buzz (then choose the string)
  - ← / →: previous / next voicing

---

## 8. Ear training

### Exercises
| # | Exercise | How it works | Inspired by |
|---|---|---|---|
| 1 | Scale degrees in context | Cadence sets the key, then one note. Name the degree (1–7). The note then resolves to the tonic. | Functional Ear Trainer |
| 2 | Intervals | Levels start with 2 very different intervals. 1–5 stars per level. | Complete Ear Trainer |
| 3 | Play it back | After each answer, the interval or chord is shown on the fretboard to play on the guitar. | Perfect Ear |
| 4 | Chord quality | Major / minor / 7 / maj7 / m7 from the chord engine, with an optional timer. | Theta "Flash Chords" |
| 5 | Progression detective | Identify common progressions; uses the same progressions as the practice drills. | ToneGym "Route VI", Theta "Speaker Chords" |
| 6 | Call and response | Hear a 3–4 note phrase, play it on an on-screen fretboard. Phrases get longer and faster. | Theta "Parrot Phrases" |
| 7 | Rhythm tap-back | Tap a rhythm back with Space. Feedback per hit: early / on time / late. | EarMaster |
| 8 | Producer's ear | Guess which frequency band is boosted on a loop. | SoundGym, TrainYourEars |

**Daily workout:** 5 short drills mixed across exercises.

### Distinctive features
- **Ear map:** mistakes shown on the fretboard and as a confusion grid ("you hear m3 as M3 40% of the time").
- **Confusion duels:** a 2-option drill built automatically for answers that keep getting mixed up.
- **Timbre rotation:** clean guitar, distorted guitar, piano and synth tones for the same questions.
- **Fading song anchors:** song hints for intervals that disappear as accuracy grows.

Ear results feed the same practice model: accuracy and speed as measurements, confusion pairs as Fix openings.

---

## 9. Music theory (scaffolding only)

Each topic folder contains `lecture.md`, `exercises.json` and `quiz.json` (quiz answers include an explanation).

Topic order:
1. Notes on the fretboard
2. Intervals
3. Major scale and keys
4. Chord construction
5. Chords in a key and common progressions
6. Minor scales
7. Pentatonic and blues
8. Circle of fifths
9. Modes
10. CAGED system

The theory helpers in `src/theory/` (notes, intervals, scales, chord formulas) are shared with the chord engine and ear training. Build one theory engine, not three.

Starting resources for writing content: Open Music Theory (free online textbook), musictheory.net and teoria.com. Check links before use.

---

## 10. Data model (localStorage, versioned)

```js
// Stored under one key: "tempo"
{
  schemaVersion: 2,
  settings: { name: "Baranay", leftHanded: false, sound: "clean", restDaysPerWeek: 1 },
  items: {                       // practice items, keyed by id
    "voicing:C:open": { type: "voicing", chord: "C", voicingId: "open", createdAt, reviewIntervalDays: 1, lastPracticedAt }
  },
  reps: [                        // raw measured attempts, newest last
    { id, itemId, sessionId, at, kind: "clean-check", clean: false, mistakes: ["buzz:B"], bpm: 80 }
  ],
  bests: { "pair:C-G": { changesPerMin: 34, cleanBpm: 92, at } },
  sessions: [ { id, start, end, minutes, blocks: [...], stub: {...} } ],
  milestones: [ { id, at } ],
  ear: { results: [ { exercise, question, answer, correct, ms, timbre, at } ] }
}
```

- **Migration from v1:** read `tempo_sess` (minutes per session) into `sessions`. Discard `tempo_cprog` (self-rated %, not meaningful), but tell the user once in a dismissible note.
- **Backup:** export / import the whole object as JSON in Settings, plus an "export reminder" every 30 days.

---

## 11. Architecture and conventions

**Stack:** Vite + vanilla JavaScript (ES modules), Chart.js, Vitest for tests. No framework.

```
tempo/
├── CLAUDE.md                 # short version of sections 1, 11 and 12 for future sessions
├── index.html
├── src/
│   ├── main.js               # app start, router
│   ├── theory/               # notes.js, intervals.js, scales.js, chords.js (formulas)
│   ├── chords/
│   │   ├── shapes.js         # curated templates (open, CAGED, barre, triads, power)
│   │   ├── generator.js      # voicing search
│   │   └── fingering.js      # finger assignment + barre detection
│   ├── practice/
│   │   ├── items.js          # practice item helpers
│   │   ├── measures.js       # clean rate, form time, changes/min, clean BPM
│   │   ├── openings.js       # openings generator
│   │   ├── spacing.js        # review intervals
│   │   └── session.js        # setlist builder + stub
│   ├── audio/                # engine.js, metronome.js, guitar-synth.js
│   ├── ear/                  # one file per exercise + scoring.js
│   ├── state/                # storage.js (schema, migration, backup), settings.js
│   ├── data/                 # mistake-tips.js, progressions.js, exercises.js
│   ├── pages/                # today.js, chords.js, practice.js, ear.js, theory.js, progress.js, settings.js
│   ├── components/           # neck.js, chord-diagram.js, vinyl-metronome.js, stub.js, ticker.js, taped-card.js, charts.js
│   └── styles/               # tokens.css, base.css, components.css, pages.css
├── content/theory/01-fretboard-notes/  # lecture.md, exercises.json, quiz.json
├── assets/art/               # heroes/, characters/, covers/, textures/, stamps/, icons/
└── tests/                    # chords.test.js, measures.test.js, openings.test.js, storage.test.js
```

### Code conventions (Baranay's style)
- Every file starts with a comment saying what it does.
- Functions are grouped under section comments (`// ─── Rendering ───`).
- Readable names (`renderChordsPage`, not `rGuitar`).
- A one-line comment above each function explaining its purpose.
- No minified one-liners. Small functions, one job each.
- All copy in plain, human English.

### Quality bar
- Accessibility: real `button`s, visible focus, minimum 12px text, WCAG AA contrast, `prefers-reduced-motion` respected (vinyl stops spinning).
- Works at phone width: large tap targets for practicing with a guitar in hand.

---

## 12. Build phases (with "done when")

| Phase | Work | Done when |
|---|---|---|
| **0. Set up** | Vite project, file structure, CLAUDE.md, Vitest. Move existing code into modules with no behaviour change. | The app runs exactly as before from `npm run dev`. |
| **1. Core** | `theory/`, storage v2 + migration + backup, Web Audio engine, lookahead metronome, guitar synth. | Metronome stays in time over 5 minutes; migration test passes. |
| **2. Chord engine** | Shapes, generator, fingering, validation tests (5.4). | All tests pass, including C and F regressions; every chord has ≥ 5 voicings across the neck. |
| **3. Design system** | Tokens, fonts, components (neck, diagram, vinyl, stub, ticker, taped card, placeholders for art). | One component page shows every component in its states. |
| **4. Pages** | Chords → Practice (section 6) → Today → Progress → Settings, built in the new design. | A full session runs: setlist → measured reps → stub, and openings change with the data. |
| **5. Ear training** | Section 8, linked to the practice model. | All 8 exercises play; confusion duels appear after repeated mix-ups. |
| **6. Theory scaffold** | Section 9 folders, renderers for lecture / exercise / quiz, topic 1 as a sample. | Topic 1 lecture, exercise and quiz work end to end. |
| **Later** | Microphone (tuner, buzz detection, weekly recordings), Production tab, publishing on GitHub Pages. | — |

Commit after each meaningful step, with clear messages.

---

## 13. Assumptions (correct me if wrong)
- **Dark stage base** chosen, since all four references are dark with coral.
- **Greeting name:** "Baranay" by default, editable in Settings.
- **Production tab** hidden until it's planned.
- Fonts are free web fonts (Google Fonts) unless Adobe Fonts is preferred.

---

## 14. Research sources
- [3 Best Ear Training Apps for Guitarists — Guitar Gear Finder](https://guitargearfinder.com/guides/best-ear-training-apps/)
- [Guitar Games — Theta Music Trainer](https://trainer.thetamusic.com/en/node/5)
- [ToneGym review — Jade Bultitude](https://jadebultitude.com/ear-training/tonegym/) (affiliate review)
- [Best Ear Training Tools for Music Producers — Lost Stories Academy](https://www.loststoriesacademy.com/blogs-and-tutorials/best-ear-training-tools-for-music-producers-in-2025-that-actually-work) (course provider blog)
- [Functional Ear Trainer — App Store](https://apps.apple.com/app/id1088761926)
- [Ear training — Wikipedia](https://en.wikipedia.org/wiki/Ear_training)

---

## 15. Starter prompt for Claude Code

> Clone `korook/TEMPO-Personal.Music.Development.Tracker` and read `TEMPO_PLAN.md` fully. Start with Phase 0 in section 12. Follow the code conventions in section 11. Stop at the end of the phase, summarize what changed, and wait for my approval before Phase 1.
