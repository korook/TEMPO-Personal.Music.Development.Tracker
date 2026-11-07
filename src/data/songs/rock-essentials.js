// Suggestion pool: must-know rock songs for guitar players (TEMPO_UPDATE_REPERTOIRE.md 4.3).
// Every song was checked against the chord sheet or lesson in `source` on 7 Nov 2026.
// Only chord names per part are stored: no lyrics, no tabs. Parts without `bars` are riffs or
// picked lines; the source link covers them. `bpm: null` = no reliable tempo found yet (the
// app asks you to tap it in). Stairway to Heaven was left out: sources name its intro chords
// in three different ways.

export const ROCK_ESSENTIALS = [
  // ─── Level 1 · Basics ───
  {
    id: 'dylan-knockin-on-heavens-door', title: "Knockin' on Heaven's Door", artist: 'Bob Dylan', year: 1973,
    level: 1, key: 'G', bpm: 69, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['strumming'],
    parts: [
      { id: 'verse', name: 'Verse', bars: 'G | D | Am | Am | G | D | C | C' },
      { id: 'chorus', name: 'Chorus', bars: 'G | D | Am | Am | G | D | C | C' },
    ],
    source: 'https://goodguitarist.com/knockin-on-heavens-door-bob-dylan/', verified: true,
    cover: { query: "Bob Dylan Knockin' on Heaven's Door" },
  },
  {
    id: 'america-a-horse-with-no-name', title: 'A Horse with No Name', artist: 'America', year: 1971,
    level: 1, key: 'Em', bpm: 123, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['strumming'],
    parts: [
      { id: 'verse', name: 'Verse', bars: 'Em | D6add9 | Em | D6add9' },
      { id: 'chorus', name: 'Chorus', bars: 'Em | D6add9 | Em | D6add9' },
    ],
    source: 'https://richterguitar.com/a-horse-with-no-name-america/', verified: true,
    cover: { query: 'America A Horse with No Name' },
  },
  {
    id: 'cranberries-zombie', title: 'Zombie', artist: 'The Cranberries', year: 1994,
    level: 1, key: 'Em', bpm: 83, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['strumming'],
    parts: [
      { id: 'verse', name: 'Verse', bars: 'Em | C | G | D/F#' },
      { id: 'chorus', name: 'Chorus', bars: 'Em | C | G | D/F#' },
    ],
    source: 'https://richterguitar.com/zombie-the-cranberries/', verified: true,
    cover: { query: 'The Cranberries Zombie' },
  },
  {
    id: 'green-day-boulevard-of-broken-dreams', title: 'Boulevard of Broken Dreams', artist: 'Green Day', year: 2004,
    level: 1, key: 'Em', bpm: 84, timeSignature: '4/4', tuning: 'standard', capo: 1, techniques: ['strumming', 'power-chords'],
    parts: [
      { id: 'verse', name: 'Intro and verse', bars: 'Em | G | D | A' },
      { id: 'chorus', name: 'Chorus', bars: 'C5 | G5 | D5 | E5 | C5 | G5 | D5 | E5 | C5 | G5 | B5' },
    ],
    source: 'https://www.heartwoodguitar.com/chords/green-day-boulevard-of-broken-dreams/', verified: true,
    cover: { query: 'Green Day Boulevard of Broken Dreams' },
  },
  {
    id: 'ccr-bad-moon-rising', title: 'Bad Moon Rising', artist: 'Creedence Clearwater Revival', year: 1969,
    level: 1, key: 'D', bpm: 90, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['strumming'],
    parts: [
      { id: 'verse', name: 'Intro and verse', bars: 'D A | G | D | D' },
      { id: 'chorus', name: 'Chorus', bars: 'G | D | A G | D' },
    ],
    source: 'https://www.guitartabs.cc/tabs/c/creedence_clearwater_revival/bad_moon_rising_crd_ver_5.html', verified: true,
    cover: { query: 'Creedence Clearwater Revival Bad Moon Rising' },
  },
  {
    id: 'skynyrd-sweet-home-alabama', title: 'Sweet Home Alabama', artist: 'Lynyrd Skynyrd', year: 1974,
    level: 1, key: 'D', bpm: 99, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['strumming', 'riff'],
    parts: [
      { id: 'verse', name: 'Verse', bars: 'D | C | G | G' },
      { id: 'chorus', name: 'Chorus', bars: 'D | C | G | G' },
    ],
    source: 'https://musictonic.com/songs/sweet-home-alabama/', verified: true,
    cover: { query: 'Lynyrd Skynyrd Sweet Home Alabama' },
  },
  {
    id: 'white-stripes-seven-nation-army', title: 'Seven Nation Army', artist: 'The White Stripes', year: 2003,
    level: 1, key: 'Em', bpm: 124, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['riff'],
    parts: [
      { id: 'riff', name: 'Main riff', type: 'riff' },
      { id: 'verse', name: 'Verse (riff, one octave down)', type: 'riff' },
    ],
    source: 'https://www.jonmaclennan.com/blog/seven-nation-army-guitar', verified: true,
    cover: { query: 'The White Stripes Seven Nation Army' },
  },
  {
    id: 'deep-purple-smoke-on-the-water', title: 'Smoke on the Water', artist: 'Deep Purple', year: 1972,
    level: 1, key: 'Gm', bpm: 112, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['riff', 'power-chords'],
    parts: [
      { id: 'riff', name: 'Main riff (in 4ths)', type: 'riff' },
      { id: 'verse', name: 'Verse rhythm', type: 'riff' },
    ],
    source: 'https://goodguitarist.com/youtube-post/smoke-on-the-water-deep-purple-guitar-tutorial', verified: true,
    cover: { query: 'Deep Purple Smoke on the Water' },
  },
  {
    id: 'pink-floyd-wish-you-were-here', title: 'Wish You Were Here', artist: 'Pink Floyd', year: 1975,
    level: 1, key: 'G', bpm: 61, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['strumming', 'riff'],
    parts: [
      { id: 'intro', name: 'Intro', bars: 'Em7 | G | Em7 | A7sus4' },
      { id: 'interlude', name: 'Riff interlude', bars: 'G | Em | G | Em | G | Em | A | Em | A | G' },
      { id: 'verse', name: 'Verse', bars: 'C | D | Am | G | D | C | Am | G' },
    ],
    source: 'https://richterguitar.com/wish-you-were-here-pink-floyd/', verified: true,
    cover: { query: 'Pink Floyd Wish You Were Here' },
  },

  // ─── Level 2 · Next step ───
  {
    id: 'oasis-wonderwall', title: 'Wonderwall', artist: 'Oasis', year: 1995,
    level: 2, key: 'Em', bpm: 87, timeSignature: '4/4', tuning: 'standard', capo: 2, techniques: ['strumming'],
    parts: [
      { id: 'verse', name: 'Intro and verse', bars: 'Em7 | G | Dsus4 | A7sus4' },
      { id: 'pre-chorus', name: 'Pre-chorus', bars: 'Cadd9 | Dsus4 | Em7 | Em7' },
      { id: 'chorus', name: 'Chorus', bars: 'Cadd9 | Em7 | G | Em7' },
    ],
    source: 'https://guitartabs.cc/tabs/o/oasis/wonderwall_crd_ver_8.html', verified: true,
    cover: { query: 'Oasis Wonderwall' },
  },
  {
    id: 'animals-house-of-the-rising-sun', title: 'House of the Rising Sun', artist: 'The Animals', year: 1964,
    level: 2, key: 'Am', bpm: 117, timeSignature: '6/8', tuning: 'standard', capo: 0, techniques: ['arpeggio', 'barre'],
    parts: [
      { id: 'verse', name: 'Verse (arpeggio)', bars: 'Am | C | D | F | Am | C | E | E | Am | C | D | F | Am | E | Am | E' },
    ],
    source: 'https://richterguitar.com/house-of-the-rising-sun-the-animals/', verified: true,
    cover: { query: 'The Animals House of the Rising Sun' },
  },
  {
    id: 'nirvana-smells-like-teen-spirit', title: 'Smells Like Teen Spirit', artist: 'Nirvana', year: 1991,
    level: 2, key: 'Fm', bpm: 117, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['power-chords'],
    parts: [
      { id: 'intro', name: 'Intro and chorus riff', bars: 'F5 Bb5 | Ab5 Db5' },
      { id: 'verse', name: 'Verse', bars: 'F5 | Bb5 | F5 | Bb5' },
    ],
    source: 'https://www.licklibrary.com/learn/lessons/nirvana/smells-like-teen-spirit', verified: true,
    cover: { query: 'Nirvana Smells Like Teen Spirit' },
  },
  {
    id: 'acdc-highway-to-hell', title: 'Highway to Hell', artist: 'AC/DC', year: 1979,
    level: 2, key: 'A', bpm: null, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['riff'],
    parts: [
      { id: 'riff', name: 'Main riff', bars: 'A | D/F# G' },
      { id: 'verse', name: 'Verse', bars: 'A | D/F# G | A | D/F# G' },
    ],
    source: 'https://www.guitar-pro.com/blog/p/10343-riff-highway-to-hell-acdc', verified: true,
    cover: { query: 'AC/DC Highway to Hell' },
  },
  {
    id: 'acdc-back-in-black', title: 'Back in Black', artist: 'AC/DC', year: 1980,
    level: 2, key: 'E', bpm: 96, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['riff', 'power-chords'],
    parts: [
      { id: 'riff', name: 'Main riff', bars: 'E5 | D5 | A5 | A5' },
      { id: 'fill', name: 'Pentatonic fill', type: 'riff' },
    ],
    source: 'https://www.guitarworld.com/lessons/how-to-play-back-in-black-on-guitar', verified: true,
    cover: { query: 'AC/DC Back in Black' },
  },
  {
    id: 'black-sabbath-paranoid', title: 'Paranoid', artist: 'Black Sabbath', year: 1970,
    level: 2, key: 'Em', bpm: 163, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['riff', 'power-chords'],
    parts: [
      { id: 'riff', name: 'Main riff (E5 D5 G5 C5 power chords)', type: 'riff' },
      { id: 'verse', name: 'Verse riff', type: 'riff' },
    ],
    source: 'https://www.jonmaclennan.com/blog/paranoid-chords', verified: true,
    cover: { query: 'Black Sabbath Paranoid' },
  },
  {
    id: 'radiohead-creep', title: 'Creep', artist: 'Radiohead', year: 1992,
    level: 2, key: 'G', bpm: 92, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['barre', 'arpeggio'],
    parts: [
      { id: 'verse', name: 'Verse (picked)', bars: 'G | B | C | Cm' },
      { id: 'chorus', name: 'Chorus (strummed)', bars: 'G | B | C | Cm' },
    ],
    source: 'https://hooktheory.com/theorytab/view/radiohead/creep', verified: true,
    cover: { query: 'Radiohead Creep' },
  },
  {
    id: 'metallica-nothing-else-matters', title: 'Nothing Else Matters', artist: 'Metallica', year: 1991,
    level: 2, key: 'Em', bpm: 71, timeSignature: '6/8', tuning: 'standard', capo: 0, techniques: ['arpeggio', 'fingerpicking'],
    parts: [
      { id: 'intro', name: 'Intro (open-string arpeggio)', type: 'riff' },
      { id: 'verse', name: 'Verse', bars: 'Em D C | Em D C | Em D C | G B7 Em' },
      { id: 'chorus', name: 'Chorus', bars: 'D C A | D C A | D Em' },
    ],
    source: 'https://richterguitar.com/nothing-else-matters-metallica/', verified: true,
    cover: { query: 'Metallica Nothing Else Matters' },
  },
  {
    id: 'cream-sunshine-of-your-love', title: 'Sunshine of Your Love', artist: 'Cream', year: 1967,
    level: 2, key: 'D', bpm: 115, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['riff'],
    parts: [
      { id: 'riff', name: 'Main riff (D blues)', type: 'riff' },
      { id: 'turnaround', name: 'Power-chord turnaround', type: 'riff' },
    ],
    source: 'https://www.jonmaclennan.com/blog/sunshine-of-your-love-guitar-lesson', verified: true,
    cover: { query: 'Cream Sunshine of Your Love' },
  },

  // ─── Level 3 · Challenge ───
  {
    id: 'eagles-hotel-california', title: 'Hotel California', artist: 'Eagles', year: 1976,
    level: 3, key: 'Bm', bpm: 74, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['barre', 'fingerpicking'],
    parts: [
      { id: 'verse', name: 'Intro and verse', bars: 'Bm | F# | A | E | G | D | Em | F#' },
      { id: 'chorus', name: 'Chorus', bars: 'G | D | F# | Bm | G | D | Em | F#' },
    ],
    source: 'https://laurenbateman.com/?p=4036', verified: true,
    cover: { query: 'Eagles Hotel California' },
  },
  {
    id: 'rhcp-under-the-bridge', title: 'Under the Bridge', artist: 'Red Hot Chili Peppers', year: 1991,
    level: 3, key: 'E', bpm: null, timeSignature: '4/4', tuning: 'half-step-down', capo: 0, techniques: ['embellished-chords', 'riff'],
    parts: [
      { id: 'intro', name: 'Intro (embellished chords)', type: 'riff' },
      { id: 'verse', name: 'Verse', bars: 'E | B | C#m | G#m | A | A | E | B | C#m | A' },
      { id: 'chorus', name: 'Chorus', bars: 'F#m | E | B | F#m' },
      { id: 'interlude', name: 'Interlude', bars: 'A | Am7 | G6 | Fmaj7' },
    ],
    source: 'https://guitartabs.cc/tabs/r/red_hot_chili_peppers/under_the_bridge_crd.html', verified: true,
    cover: { query: 'Red Hot Chili Peppers Under the Bridge' },
  },
  {
    id: 'gnr-sweet-child-o-mine', title: "Sweet Child O' Mine", artist: "Guns N' Roses", year: 1987,
    level: 3, key: 'D', bpm: 125, timeSignature: '4/4', tuning: 'half-step-down', capo: 0, techniques: ['riff', 'solo'],
    parts: [
      { id: 'intro', name: 'Intro riff', type: 'riff' },
      { id: 'verse', name: 'Verse', bars: 'D | C | G | D' },
      { id: 'chorus', name: 'Chorus', bars: 'A | C | D | D' },
    ],
    source: 'https://pickuptheguitar.com/sweet-child-o-mine-chords', verified: true,
    cover: { query: "Guns N' Roses Sweet Child O' Mine" },
  },
  {
    id: 'hendrix-little-wing', title: 'Little Wing', artist: 'The Jimi Hendrix Experience', year: 1967,
    level: 3, key: 'Em', bpm: 60, timeSignature: '4/4', tuning: 'half-step-down', capo: 0, techniques: ['embellished-chords'],
    parts: [
      { id: 'verse', name: 'Verse (embellished chords)', bars: 'Em | G | Am | Em | Bm Bb | Am | C | G F | C | D' },
    ],
    source: 'https://www.jonmaclennan.com/blog/little-wing-guitar-lesson', verified: true,
    cover: { query: 'Jimi Hendrix Little Wing' },
  },
];
