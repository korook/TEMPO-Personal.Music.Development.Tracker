// The 16 chords shown on the v1 Guitar page, with their names, tips and songs.
// TEMPORARY: Phase 4 replaces this page with the full chord library.
// Shapes (frets and fingers) are no longer typed in here: they come from the chord
// engine (src/chords/), which fixed the reversed C and F shapes and the G fingering.
// Song lists are unverified and will be removed (TEMPO_PLAN.md section 5.6).

// ─── Chord list ───

// Each chord, keyed by its symbol (which the chord engine reads).
export const CHORDS_V1 = {
  'C': {
    name: 'C', type: 'Major', notes: 'C E G',
    difficulty: 'easy',
    tip: 'Ring finger on A string fret 3, middle on D fret 2, index on B fret 1. Strum from A string down — skip low E. Arch your fingers so open G and high E ring clearly.',
    songs: ['Let It Be', 'No Woman No Cry', 'Wonderful Tonight'],
  },
  'Am': {
    name: 'Am', type: 'Minor', notes: 'A C E',
    difficulty: 'easy',
    tip: 'Index on B fret 1, middle on D fret 2, ring on G fret 2. Strum from open A. Very similar to C — practice switching between them.',
    songs: ['Stairway to Heaven', 'Nothing Else Matters', 'Hotel California'],
  },
  'G': {
    name: 'G', type: 'Major', notes: 'G B D',
    difficulty: 'easy',
    tip: 'Middle on low E fret 3, index on A fret 2, pinky on high E fret 3. All 6 strings. Big full sound — foundation of rock and folk.',
    songs: ['Sweet Home Alabama', 'Knockin\' on Heaven\'s Door', 'Wonderwall'],
  },
  'Em': {
    name: 'Em', type: 'Minor', notes: 'E G B',
    difficulty: 'easy',
    tip: 'Easiest guitar chord. Middle on A fret 2, ring on D fret 2. All 6 strings ring. Perfect first chord for beginners.',
    songs: ['Wish You Were Here', 'Hey Joe', 'Losing My Religion'],
  },
  'D': {
    name: 'D', type: 'Major', notes: 'D F# A',
    difficulty: 'easy',
    tip: 'Index on G fret 2, ring on B fret 3, middle on high E fret 2. Only strum top 4 strings (D through high E). Bright happy tone.',
    songs: ['Brown Eyed Girl', 'Summer of \'69', 'Horse With No Name'],
  },
  'Dm': {
    name: 'Dm', type: 'Minor', notes: 'D F A',
    difficulty: 'easy',
    tip: 'Index on high E fret 1, middle on G fret 2, ring on B fret 3. Strum from D string. Melancholic sound great for blues and ballads.',
    songs: ['Dust in the Wind', 'House of the Rising Sun', 'Hurt'],
  },
  'A': {
    name: 'A', type: 'Major', notes: 'A C# E',
    difficulty: 'easy',
    tip: 'Three fingers on fret 2: index on D, middle on G, ring on B. Strum from open A. Keep fingers compact so high E rings open.',
    songs: ['Yellow', 'Free Fallin\'', 'Take Me Home Country Roads'],
  },
  'E': {
    name: 'E', type: 'Major', notes: 'E G# B',
    difficulty: 'easy',
    tip: 'Index on G fret 1, middle on A fret 2, ring on D fret 2. All 6 strings. Powerful full sound — foundation of countless rock songs.',
    songs: ['Back in Black', 'Smells Like Teen Spirit', 'Purple Haze'],
  },
  'F': {
    name: 'F', type: 'Major (barre)', notes: 'F A C',
    difficulty: 'hard',
    tip: 'Index bars ALL strings at fret 1. Middle on G fret 2, ring on A fret 3, pinky on D fret 3. Use arm weight not just finger pressure. Takes weeks of practice.',
    songs: ['Hey Jude', 'Let It Be', 'Redemption Song'],
  },
  'B7': {
    name: 'B7', type: 'Dominant 7th', notes: 'B D# F# A',
    difficulty: 'med',
    tip: 'Index on D fret 1, middle on A fret 2, ring on G fret 2, pinky on high E fret 2. Open B string. Common in blues and jazz.',
    songs: ['Folsom Prison Blues', 'Norwegian Wood', 'Sultans of Swing'],
  },
  'E7': {
    name: 'E7', type: 'Dominant 7th', notes: 'E G# B D',
    difficulty: 'easy',
    tip: 'Like E major but lift ring finger off D string. Index on G fret 1, middle on A fret 2. Bluesy unresolved feel.',
    songs: ['Red House', 'Pride and Joy', 'Crossroads'],
  },
  'A7': {
    name: 'A7', type: 'Dominant 7th', notes: 'A C# E G',
    difficulty: 'easy',
    tip: 'Index on D fret 2, ring on B fret 2. G and high E open. Very open funky chord. Essential for 12-bar blues.',
    songs: ['Midnight Special', 'Tulsa Time', 'Guitar Boogie'],
  },
  'C7': {
    name: 'C7', type: 'Dominant 7th', notes: 'C E G Bb',
    difficulty: 'med',
    tip: 'Ring on A fret 3, middle on D fret 2, pinky on G fret 3, index on B fret 1. Movable shape for 12-bar blues.',
    songs: ['Born Under a Bad Sign', 'I Got You', 'Thrill Is Gone'],
  },
  'G7': {
    name: 'G7', type: 'Dominant 7th', notes: 'G B D F',
    difficulty: 'easy',
    tip: 'Like G but index on high E fret 1 instead of pinky on fret 3. Great blues turnaround chord.',
    songs: ['Glory Days', 'Cocaine', 'I Shot the Sheriff'],
  },
  'D7': {
    name: 'D7', type: 'Dominant 7th', notes: 'D F# A C',
    difficulty: 'easy',
    tip: 'Index on B fret 1, middle on G fret 2, ring on high E fret 2. D string open. Bright bluesy character.',
    songs: ['Margaritaville', 'Ring of Fire', 'This Land Is Your Land'],
  },
  'Am7': {
    name: 'Am7', type: 'Minor 7th', notes: 'A C E G',
    difficulty: 'easy',
    tip: 'Like Am but lift ring finger off G so it rings open. Index on B fret 1, middle on D fret 2. Jazzy mellow dreamy tone.',
    songs: ['Oye Como Va', 'Fly Me to the Moon', 'Autumn Leaves'],
  },
};

// ─── String labels and colours ───

// String names from low E to high e.
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

// One dot colour per string, low E to high e (design-system accents).
export const STRING_COLOURS = ['var(--bronze)', 'var(--sonic)', 'var(--verdigris)', 'var(--shell)', 'var(--bronze)', 'var(--sonic)'];

// ─── Chord groups used by the v1 charts ───

// Open major chords, for the radar chart's "Open chords" axis.
export const OPEN_CHORD_KEYS = ['C', 'Am', 'G', 'Em', 'D', 'A', 'E'];

// Seventh chords, for the radar and doughnut charts.
export const SEVENTH_CHORD_KEYS = ['B7', 'E7', 'A7', 'C7', 'G7', 'D7', 'Am7'];

// Major chords, for the doughnut chart.
export const MAJOR_CHORD_KEYS = ['C', 'G', 'D', 'A', 'E'];

// Minor chords, for the doughnut chart.
export const MINOR_CHORD_KEYS = ['Am', 'Em', 'Dm'];
