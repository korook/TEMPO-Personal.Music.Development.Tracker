# Tempo — Claude Code Handover Brief

**Repo:** `korook/TEMPO-Personal.Music.Development.Tracker` (currently one `index.html`, 388 lines)
**Owner:** Baranay — Industrial + Communication Design student, guitarist, illustrator
**Purpose:** a personal guitar practice website that looks professional, feels encouraging and carries Baranay's own artwork. Personal use first, possibly published later.
**Live site:** https://korook.github.io/TEMPO-Personal.Music.Development.Tracker/ (design system: `/components.html`)
**Version:** 2.1, revised 12 Oct 2026 after Phases 0–3 and Baranay's feedback (see the change log at the end). Replaces 2.0.

> **For Claude Code:** read this whole file before writing code. Work phase by phase (section 12). Show every change as a preview file first and push to `main` only after approval (section 12, "Review flow"). At the end of each phase, stop, summarize what changed and wait for approval. Ask before deciding anything this brief leaves open.

---

## 1. Core decisions

| Topic | Decision |
|---|---|
| Visual direction | **Analog meets modern, like Teenage Engineering and Nothing hardware.** A light instrument body with dark inset screens for live data, keycap buttons, LED dots and small spec-sheet labels, plus paper pieces for the human side (receipts, label-maker strips, polaroids), with Baranay's illustrations as the hero of each page. Sans-serif type only. Colours come from the guitar itself, not from the references (section 3). *Revised 12 Oct 2026; replaces the "stage poster" direction.* |
| Mastery model | **No more "+10%" buttons and no 100% ceiling.** Progress comes from measured attempts. The app always shows the next mistake to fix or the next opening to try, even for skills that are well learned (section 6). |
| Chords | **Rebuild the chord library.** Every chord is correct and validated by automated tests, with all practical voicings across the fretboard (section 5). |
| Ear training | Build now (section 8). |
| Music theory | Folder structure and content format now, content later (section 9). |
| Microphone features | Later (tuner, buzz detection, recordings). Design the data so they can plug in. |
| Audience | Personal now. Keep the code clean enough to publish. |
| Review flow | Every change is shown as a single-file HTML preview first; it goes to `main` (and the live site) only after Baranay approves (section 12). |

---

## 2. Audit of the current code

### Wrong chord data (fix first) ✅ fixed in Phase 2
Checked by script: every played note against the chord's notes. All shapes now come from the chord engine.

| Chord | Stored | Correct | Problem |
|---|---|---|---|
| **C** | `x01023` | `x32010` | String order is reversed after the muted string. It currently sounds A, D#, G, C#, G. |
| **F** | `112331` | `133211` | Reversed. Contains A#, E and D, which are not in F major. |
| C7 | `x32310` | (correct) | Omits the 5th (G). That's normal for this shape, but show it as "5th omitted". |
| G | tip says pinky on high E | fingering array says finger 3 | Tip and data disagree. |

The other 13 shapes are correct. **Song lists are unverified, and some are wrong.** For example, "Smells Like Teen Spirit" is played with power chords, not an open E. Remove all song lists. Only add a song back with a source link (section 5.6).

### Logic and code problems
Status: ✅ = fixed, ⏳ = fixed in Phase 4.
- ⏳ **Mastery is self-clicked** (+10% / −10%), so 100% is reached in 10 clicks. Replaced by section 6.
- ⏳ **Skill radar uses fake data.** "Strumming / Rhythm / Ear" are the open-chord score × 0.8 / 0.6 / 0.4. Remove it.
- ⏳ **Weekly chart labels are wrong.** They're always Mon→Sun, but the data is the last 7 days ending today.
- ⏳ **The streak shows 0** if you practiced yesterday but not yet today.
- ✅ **The metronome drifts.** It used `setInterval`. Fixed in Phase 1: Web Audio lookahead scheduling, tested over 5 minutes.
- ✅ **Greeting name is hard-coded** ("Uglum"). Now read from settings (Phase 1).
- ✅ **Sessions only store minutes.** Storage v2 has reps, bests and sessions (Phase 1); Phase 4 fills them.
- ⏳ Clickable `div`s, text as small as 9px, no keyboard support (the new components already use real buttons and ≥ 12px text).
- ✅ One file with minified one-line functions and short names. Split into commented modules in Phase 0.
- ✅ **No backup.** Export/import functions exist (Phase 1); the buttons arrive with the Settings page in Phase 4.

### Keep
- The general tab idea, Chart.js, the 28-day heatmap concept, the finger exercises list, and the transition drill progressions.

---

## 3. Design direction (revised 12 Oct 2026)

> Rev. 2 of the design system. Rev. 1 (dark "stage poster", coral, Anton + Limelight, a literal spinning vinyl) was built in Phase 3 and then replaced after Baranay's feedback: *sans-serif only; take Teenage Engineering and Nothing's analog-meets-modern language; make the vinyl abstract; don't copy the references' colours and don't use the colours AI uses for everyone.* The component page `components.html` is the source of truth for every part and state.

### References (`References/`)
| Ref | What | Take from it |
|---|---|---|
| ref1–ref4 | Stemtracks, Rechords, The Covasettes, Bake & Soda | Art as cover tiles, vinyl as a motif, a scrolling ticker, handmade paper pieces (tape, polaroids, stubs). **Not** their colours or their serif/display type. |
| ref5–ref7 | Teenage Engineering K.O. II, K.O. Sidekick, OP-1 | Device body with an inset screen, keycaps, small LED dots, tiny spec-sheet labels, line-art screen graphics (tape reels), analog + modern together. |
| ref8–ref9 | Nothing Phone and Ear | Dot-matrix type, transparent "see the mechanism" details, clean white surfaces with a single red accent dot. |

### Look
- **Body and screens:** light device-body panels (day theme, the default) or ebony (night theme). Live data sits on dark inset **screens**: the neck, readouts, the ticker.
- **Hardware details:** keycap buttons that press down; LED dots for state (a green phosphor LED only while something is running: metronome, timer, recording); mono spec labels; a fine dot-grid texture like perforated speaker metal.
- **Paper for the human side:** session **receipts** (thermal paper, torn edges, barcode), **label-maker strips** on setlist cards, **polaroids** for milestones and artwork, handwritten notes.
- **Main menu:** a sticky top bar with sections grouped into categories (each opens a small menu; one "Menu" on phones) and a **⚙ settings menu** in the right corner.

### Colour (guitar colour-material-finish palette; a placeholder until Baranay sets his own)
| Token | Source | Role |
|---|---|---|
| `--body` / `--body-2` / `--body-3` | bone-grey powder coat (day) / ebony (night) | Background, raised panels and keys, wells |
| `--screen` | ebony | Inset screens in both themes |
| `--paper`, `--ink` | bone, ebony | Receipts, polaroids; text on paper and on every accent fill |
| `--bronze` | phosphor-bronze strings | Today, Chords, Practice |
| `--verdigris` | oxidised copper | Ear training |
| `--sonic` | "sonic blue" guitar finish | Theory |
| `--shell` | "shell pink" guitar finish | Progress, milestones |
| `--phosphor` | LED | "Live" only |

Each accent has a `-text` variant that passes WCAG AA on the body. Pages set `--accent-now` / `--accent-text` for their section. `tests/tokens.test.js` checks contrast for every text/surface pair in both themes (55 pairs).

### Typography (sans-serif and mono only, Google Fonts)
| Role | Font |
|---|---|
| Headings | **Archivo**, wide (width 112–125) |
| Text, UI | **Archivo**, normal width |
| Readouts (BPM, timers, big numbers) | **Doto** (dot matrix) |
| Labels, frets, small numbers | **Martian Mono** |
| Handwritten notes | **Baranay's own handwriting as a font** (scan → Calligraphr); **Caveat** stands in until then |

No serif or display-deco fonts. Minimum text size 12px.

### Motifs that do a job (not decoration)
- **Disc metronome:** an abstract record, not a literal one. A fixed ring of beat segments lights up beat by beat (beat 1 brightest); line-art grooves with a cut-away onto a dot grid turn slowly; a playhead sweeps once per bar, steered by the audio clock so it crosses each segment exactly on the click; the BPM sits in dot-matrix figures on a dark label.
- **Groove progress:** weekly practice as rings on a disc (Progress page).
- **Session receipt:** printed at the end of a session with minutes, personal bests, the most frequent mistake and the next opening; the session log is a pile of receipts.
- **Ticker:** today's openings scroll by in dot-matrix type on a screen strip; it pauses on hover/focus and becomes a still list with reduced motion.
- **Setlist cards** with an index number, an LED for the block being played and a label-maker strip for the block type; **polaroids** for milestones and artwork; **cover tiles** with Baranay's illustrations for chord families, ear games and theory topics; **illustrated empty states**.

### Avoid
- Serif or decorative display fonts; colours copied from the references; generic "AI" palettes (indigo/violet glows, neon lime, coral + cream).
- A literal, photo-real vinyl.
- A row of four identical KPI tiles with coloured top stripes; coloured dots before every title; emoji as icons; gradient blobs.
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

Until the art exists, use the placeholder frames from the component page (dashed frame, crop marks, "HERO — Practice · 1600 × 1200 · folder"). Never use stock or AI images as filler.

---

## 4. Pages

| Page | Accent | Hero | Job |
|---|---|---|---|
| **Today** (dashboard) | bronze | Illustration + "Tonight's setlist" | What to practice now and why; ticker of openings; quick start |
| **Chords** | bronze | Neck view of the selected chord | Learn any chord in every position |
| **Practice** | bronze | Disc metronome | Run a session: timed blocks, measurements, mistake logging |
| **Ear** | verdigris | Cover-tile game grid | Ear training games and daily workout |
| **Theory** | sonic | Topic covers | Lectures, exercises, quizzes (content later) |
| **Progress** | shell | Groove disc + receipt pile | Personal bests, trends, mistake patterns, milestones |
| Settings | — | — | Name, handedness, sound, day/night theme, backup export/import (also reachable from the ⚙ menu) |

Navigation: the sticky top bar from the component page. Pages grouped into categories, ⚙ settings in the right corner.

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
| Major 6 | `C6` | 0 4 7 9 | R 3 6 |
| Minor 6 | `Cm6` | 0 3 7 9 | R b3 6 |
| Add9 | `Cadd9` | 0 4 7 14 | R 3 9 |
| Diminished | `Cdim` | 0 3 6 | R b3 b5 |
| Augmented | `Caug` | 0 4 8 | R 3 #5 |
| Half-diminished | `Cm7b5` | 0 3 6 10 | R b3 b5 b7 |

All 12 roots × all qualities. Spell notes correctly for the key: Bb, not A#, in flat keys. The note spelling table lives in `src/theory/notes.js`.

6 and m6 were added in Phase 4 at Baranay's request (they appear in his "chords chart.jpg"), so the library has 12 roots × 14 types.

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
*(Built in Phase 4 with the rev. 2 components: neck on a screen, chord diagrams with a drawn barre and intervals.)*

**Library layout (Baranay, 12 Oct 2026):**
- **Seven categories, A to G.** Each letter is a category, reachable from the top-bar menu and an A–G picker, so any chord is one or two clicks away. Sharps and flats sit in the category of their letter: Ab and A in A, Bb and B in B, C# and C in C, and so on, using the root spelling from `notes.js`.
- **Every variation inside a category:** each root shows all its chord types as a grid of thumbnails (rows by root, columns by type, like Baranay's "chords chart.jpg").
- **Thumbnails show only the most common shape:** the open-string version when one exists, otherwise the first standard shape (usually the E- or A-form barre).
- **Opening a thumbnail shows all variations:** the neck view, then every voicing in the strip from the nut up (standard shapes first, then "found" ones).
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
1. **Setlist:** the app proposes a session as setlist cards, which the user can edit, reorder or remove:
   - Warm-up (finger exercise, 3 min)
   - Fix (top Fix opening)
   - Push (top Push opening)
   - Review (one rusty item)
   - Ear (2 min drill)
   - Free play (untimed)
2. **Play:** each block has a timer and its own measurement tool. The metronome is available everywhere.
3. **Receipt:** at the end a session receipt summarizes the minutes, new personal bests, the most frequent mistake and tomorrow's top opening.

### 6.9 Progress page
- **Personal bests over time** per item, shown as a line with dates.
- **Mistake patterns:** most frequent tags this week compared with last week.
- **Fretboard heatmap of buzzes and mutes** by string and position.
- **Groove disc** of weekly minutes, a **28-day heatmap** and the **receipt pile** (session log).
- **Milestones:** event-based stamps (first clean F barre, first 60 changes/min, first chord in all 5 CAGED shapes). These are achievements, not a level cap.

### 6.10 Encouragement rules
- Always compare against your own past, never against an "ideal".
- Show improvement first, then the opening.
- Streak: count from yesterday if today is empty ("2-day streak — play today to keep it"). Allow 1 rest day per week without breaking the streak.

---

## 7. Metronome and audio

- **Scheduler:** Web Audio lookahead scheduling (schedule clicks on `audioCtx.currentTime` slightly ahead), never `setInterval` timing. ✅ Built in Phase 1: click times come from a fixed anchor, a Web Worker ticks every 25 ms (built from inline code, with a page-timer fallback so previews opened from a file still work). Verified: 632 clicks over 5 min 15 s, all exactly on the grid.
- **Visual:** the disc metronome (section 3).
- **Settings:** 30–240 BPM, tap tempo, time signatures (2/4, 3/4, 4/4, 6/8), subdivisions, accent on/off, sound choice.
- **Speed trainer:** +N BPM every N bars, up to a target.
- **Chord change mode:** shows the next chord every N beats for change-pair and progression drills.
- **Guitar synth:** Karplus-Strong plucked strings for chord playback, with a strum direction and speed. No sample files needed. ✅ Built in Phase 1, in tune within 5 cents across the neck.
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
  settings: { name: "Baranay", leftHanded: false, sound: "clean", restDaysPerWeek: 1 },  // + theme: "day" | "night" (Phase 4)
  items: {                       // practice items, keyed by id
    "voicing:C:open": { type: "voicing", chord: "C", voicingId: "open", createdAt, reviewIntervalDays: 1, lastPracticedAt }
  },
  reps: [                        // raw measured attempts, newest last
    { id, itemId, sessionId, at, kind: "clean-check", clean: false, mistakes: ["buzz:B"], bpm: 80 }
  ],
  bests: { "pair:C-G": { changesPerMin: 34, cleanBpm: 92, at } },
  sessions: [ { id, start, end, minutes, blocks: [...], stub: {...} } ],
  milestones: [ { id, at } ],
  ear: { results: [ { exercise, question, answer, correct, ms, timbre, at } ] },
  meta: { createdAt, lastExportAt, migratedFromV1At, notices: { chordRatingsDropped, unreadableData } }
}
```

- **Migration from v1:** read `tempo_sess` (minutes per session) into `sessions`. Discard `tempo_cprog` (self-rated %, not meaningful), but tell the user once in a dismissible note. ✅ Built in Phase 1; the v1 keys are kept as a safety copy, and unreadable data is put aside instead of overwritten. The +10% buttons still read `tempo_cprog` until Phase 4 removes them; the note appears then.
- **Backup:** export / import the whole object as JSON in Settings, plus an "export reminder" every 30 days.

---

## 11. Architecture and conventions

**Stack:** Vite + vanilla JavaScript (ES modules), Chart.js, Vitest for tests. No framework.

```
tempo/
├── CLAUDE.md                 # short version of sections 1, 3, 11 and 12 for future sessions
├── TEMPO_PLAN.md             # this file
├── index.html                # the app
├── components.html           # the design system: every component in every state
├── scripts/build-preview.mjs # npm run preview:file → single-file previews in preview/ (git-ignored)
├── .github/workflows/deploy.yml  # tests + build + publish to GitHub Pages on every push to main
├── src/
│   ├── main.js, router.js    # app start, page switching
│   ├── components-page.js    # the component page
│   ├── theory/               # notes.js, intervals.js, scales.js, chords.js (formulas)
│   ├── chords/
│   │   ├── shapes.js         # curated shapes (open, CAGED, barre, triads, power)
│   │   ├── generator.js      # standard placements + voicing search
│   │   ├── fingering.js      # finger assignment + barre detection + checker
│   │   └── voicings.js       # public API: getVoicings(root, quality)
│   ├── practice/             # history.js now; items, measures, openings, spacing, session in Phase 4
│   ├── audio/                # engine.js, metronome.js, guitar-synth.js
│   ├── ear/                  # one file per exercise + scoring.js (Phase 5)
│   ├── state/                # storage.js (schema, migration, backup), settings.js, legacy-ratings.js (temporary)
│   ├── data/                 # chords-v1.js (temporary), progressions.js, exercises.js; mistake-tips.js in Phase 4
│   ├── pages/                # one file per page
│   ├── components/           # top-bar, neck, chord-diagram, vinyl-metronome (disc), stub (receipt),
│   │                         # ticker, taped-card (setlist card + polaroid), art-placeholder, charts, header
│   ├── utils/                # time.js, html.js
│   └── styles/               # tokens.css, base.css, components.css, pages.css
├── content/theory/01-fretboard-notes/  # lecture.md, exercises.json, quiz.json
├── assets/art/               # heroes/, characters/, covers/, textures/, stamps/, icons/
└── tests/                    # theory, chords, storage, metronome, guitar-synth, history, tokens
```

### Code conventions (Baranay's style)
- Every file starts with a comment saying what it does.
- Functions are grouped under section comments (`// ─── Rendering ───`).
- Readable names (`renderChordsPage`, not `rGuitar`).
- A one-line comment above each function explaining its purpose.
- No minified one-liners. Small functions, one job each.
- All copy in plain, human English.

### Quality bar
- Accessibility: real `button`s, visible focus, minimum 12px text, WCAG AA contrast in both themes (tested), `prefers-reduced-motion` respected (the disc and the ticker stop; beat lights still work).
- Works at phone width: large tap targets for practicing with a guitar in hand.

---

## 12. Build phases (with "done when")

| Phase | Work | Done when | Status |
|---|---|---|---|
| **0. Set up** | Vite project, file structure, CLAUDE.md, Vitest. Move existing code into modules with no behaviour change. | The app runs exactly as before from `npm run dev`. | ✅ |
| **1. Core** | `theory/`, storage v2 + migration + backup, Web Audio engine, lookahead metronome, guitar synth. | Metronome stays in time over 5 minutes; migration test passes. | ✅ |
| **2. Chord engine** | Shapes, generator, fingering, validation tests (5.4). | All tests pass, including C and F regressions; every chord has ≥ 5 voicings across the neck. | ✅ (≥ 13 each) |
| **3. Design system** | Tokens, fonts, components, placeholders for art; rev. 2 after feedback (section 3), sticky menu + ⚙ settings. | One component page shows every component in its states. | ✅ (`components.html`) |
| **4. Pages** | Top bar + ⚙ menu, then Chords → Practice (section 6) → Today → Progress → Settings, built from the component page parts only. Remove the v1 styles, tokens, chord list and +10% ratings. | A full session runs: setlist → measured reps → receipt, and openings change with the data. | next |
| **5. Ear training** | Section 8, linked to the practice model. | All 8 exercises play; confusion duels appear after repeated mix-ups. | |
| **6. Theory scaffold** | Section 9 folders, renderers for lecture / exercise / quiz, topic 1 as a sample. | Topic 1 lecture, exercise and quiz work end to end. | |
| **Later** | Microphone (tuner, buzz detection, weekly recordings), Production tab, Baranay's own palette and handwriting font. | — | |

### Review flow (Baranay's rule, 12 Oct 2026)
1. Work on a local branch; commit each meaningful step with a clear message.
2. Run the tests and the build, then `npm run preview:file`.
3. Give Baranay the single-file previews from `preview/` ("Tempo app.html", "Tempo design system.html"). They open straight from the Finder, with no server.
4. Only after he approves: merge into `main` and push. GitHub Actions runs the tests, builds and publishes, so the GitHub Pages link shows the new version about a minute later (⌘⇧R if the browser shows a cached copy).
5. Never push unapproved work. Still stop at the end of each phase for approval before the next one.

## 13. Assumptions (correct me if wrong)
- **Day theme** (light device body) is the default; a **night theme** is available from ⚙. *(Revised: v2.0 assumed a dark stage.)*
- **Greeting name:** "Baranay" by default, editable in Settings.
- **Production tab** hidden until it's planned (done in Phase 4).
- Fonts are free web fonts (Google Fonts).
- The guitar CMF palette is a placeholder until Baranay supplies his own palette.

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

> Read `TEMPO_PLAN.md` and `CLAUDE.md` fully. Phases 0–3 are done. Continue with Phase 4 in section 12, following the design direction in section 3 and the code conventions in section 11. Use the review flow: show each change as a preview file and push to `main` only after approval. Stop at the end of the phase, summarize what changed, and wait for approval before Phase 5.

---

## 16. Change log
- **2.1 (12 Oct 2026):** Phases 0–3 marked done with results. Design direction rewritten after Baranay's feedback: Teenage Engineering / Nothing analog-modern language, sans-serif only (Archivo, Doto, Martian Mono; Caveat as handwriting stand-in), guitar-materials colours instead of coral/mint/mustard/pink, day theme default plus night, abstract disc metronome, receipts and label-maker strips, sticky categorized menu with ⚙ settings. Review flow added (preview file → approval → push). Audit items marked fixed. Architecture tree updated. Open question added about the chord chart and 6/m6 chords.
- **2.0 (12 Oct 2026):** rewrite of v1 (audit, chord engine, practice model, ear training, phases).
