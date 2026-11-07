// The art manifest (TEMPO_PLAN.md 17.4, item 1): every art frame in the app, by key.
//
// To add a drawing:
//   1. Put the file in its folder, e.g. assets/art/covers/ear-intervals.png
//      (song covers: assets/art/covers/songs/<song-id>.jpg)
//   2. Fill in its line below:  'cover:ear-intervals': { ..., file: 'covers/ear-intervals.png' },
// That's all: the app shows your file. With `file: null` it shows the pixel stand-in, or the
// dashed placeholder if there is no stand-in. Sizes and formats: TEMPO_PLAN.md section 3.
// The component page (components.html → Art) lists every key and what it shows right now.

export const ART_MANIFEST = {
  // ─── Heroes (1600 × 1200, PNG transparent or SVG, assets/art/heroes/) ───
  'hero:today': { kind: 'hero', subject: 'Today', file: null },

  // ─── Ear game covers (1000 × 1000, JPG/PNG, assets/art/covers/) ───
  'cover:ear-scale-degrees': { kind: 'cover', subject: 'Scale degrees', file: null },
  'cover:ear-intervals': { kind: 'cover', subject: 'Intervals', file: null },
  'cover:ear-play-back': { kind: 'cover', subject: 'Play it back', file: null },
  'cover:ear-chord-quality': { kind: 'cover', subject: 'Chord quality', file: null },
  'cover:ear-progressions': { kind: 'cover', subject: 'Progression detective', file: null },
  'cover:ear-call-response': { kind: 'cover', subject: 'Call and response', file: null },
  'cover:ear-rhythm': { kind: 'cover', subject: 'Rhythm tap-back', file: null },
  'cover:ear-producer': { kind: 'cover', subject: "Producer's ear", file: null },

  // ─── Theory topic covers (1000 × 1000, JPG/PNG, assets/art/covers/) ───
  'cover:theory-01-fretboard-notes': { kind: 'cover', subject: 'Notes on the fretboard', file: null },
  'cover:theory-02-intervals': { kind: 'cover', subject: 'Intervals', file: null },
  'cover:theory-03-major-scale-and-keys': { kind: 'cover', subject: 'Major scale and keys', file: null },
  'cover:theory-04-chord-construction': { kind: 'cover', subject: 'Chord construction', file: null },
  'cover:theory-05-chords-in-a-key': { kind: 'cover', subject: 'Chords in a key', file: null },
  'cover:theory-06-minor-scales': { kind: 'cover', subject: 'Minor scales', file: null },
  'cover:theory-07-pentatonic-and-blues': { kind: 'cover', subject: 'Pentatonic and blues', file: null },
  'cover:theory-08-circle-of-fifths': { kind: 'cover', subject: 'Circle of fifths', file: null },
  'cover:theory-09-modes': { kind: 'cover', subject: 'Modes', file: null },
  'cover:theory-10-caged-system': { kind: 'cover', subject: 'CAGED system', file: null },

  // ─── Song covers (Repertoire). Original artwork is looked up online (npm run covers);
  //     a file here, e.g. covers/songs/<song-id>.jpg, wins over it. 600 × 600, JPG/PNG. ───
  'cover:song:rhcp-californication': { kind: 'cover', subject: "Californication — Red Hot Chili Peppers", file: null },
  'cover:song:adamlar-koca-yasli-sisko-dunya': { kind: 'cover', subject: "Koca Yaşlı Şişko Dünya — Adamlar", file: null },
  'cover:song:son-feci-bisiklet-pazar-ve-ertesi': { kind: 'cover', subject: "Pazar ve Ertesi — Son Feci Bisiklet", file: null },
  'cover:song:dylan-knockin-on-heavens-door': { kind: 'cover', subject: "Knockin' on Heaven's Door — Bob Dylan", file: null },
  'cover:song:america-a-horse-with-no-name': { kind: 'cover', subject: "A Horse with No Name — America", file: null },
  'cover:song:cranberries-zombie': { kind: 'cover', subject: "Zombie — The Cranberries", file: null },
  'cover:song:green-day-boulevard-of-broken-dreams': { kind: 'cover', subject: "Boulevard of Broken Dreams — Green Day", file: null },
  'cover:song:ccr-bad-moon-rising': { kind: 'cover', subject: "Bad Moon Rising — Creedence Clearwater Revival", file: null },
  'cover:song:skynyrd-sweet-home-alabama': { kind: 'cover', subject: "Sweet Home Alabama — Lynyrd Skynyrd", file: null },
  'cover:song:white-stripes-seven-nation-army': { kind: 'cover', subject: "Seven Nation Army — The White Stripes", file: null },
  'cover:song:deep-purple-smoke-on-the-water': { kind: 'cover', subject: "Smoke on the Water — Deep Purple", file: null },
  'cover:song:pink-floyd-wish-you-were-here': { kind: 'cover', subject: "Wish You Were Here — Pink Floyd", file: null },
  'cover:song:oasis-wonderwall': { kind: 'cover', subject: "Wonderwall — Oasis", file: null },
  'cover:song:animals-house-of-the-rising-sun': { kind: 'cover', subject: "House of the Rising Sun — The Animals", file: null },
  'cover:song:nirvana-smells-like-teen-spirit': { kind: 'cover', subject: "Smells Like Teen Spirit — Nirvana", file: null },
  'cover:song:acdc-highway-to-hell': { kind: 'cover', subject: "Highway to Hell — AC/DC", file: null },
  'cover:song:acdc-back-in-black': { kind: 'cover', subject: "Back in Black — AC/DC", file: null },
  'cover:song:black-sabbath-paranoid': { kind: 'cover', subject: "Paranoid — Black Sabbath", file: null },
  'cover:song:radiohead-creep': { kind: 'cover', subject: "Creep — Radiohead", file: null },
  'cover:song:metallica-nothing-else-matters': { kind: 'cover', subject: "Nothing Else Matters — Metallica", file: null },
  'cover:song:cream-sunshine-of-your-love': { kind: 'cover', subject: "Sunshine of Your Love — Cream", file: null },
  'cover:song:eagles-hotel-california': { kind: 'cover', subject: "Hotel California — Eagles", file: null },
  'cover:song:rhcp-under-the-bridge': { kind: 'cover', subject: "Under the Bridge — Red Hot Chili Peppers", file: null },
  'cover:song:gnr-sweet-child-o-mine': { kind: 'cover', subject: "Sweet Child O' Mine — Guns N' Roses", file: null },
  'cover:song:hendrix-little-wing': { kind: 'cover', subject: "Little Wing — The Jimi Hendrix Experience", file: null },
  'cover:song:duman-bekle-dedi-gitti': { kind: 'cover', subject: "Bekle Dedi Gitti — Duman", file: null },
  'cover:song:duman-bu-aksam': { kind: 'cover', subject: "Bu Akşam — Duman", file: null },
  'cover:song:mor-ve-otesi-bir-derdim-var': { kind: 'cover', subject: "Bir Derdim Var — Mor ve Ötesi", file: null },
  'cover:song:erkin-koray-saskin': { kind: 'cover', subject: "Şaşkın — Erkin Koray", file: null },

  // ─── Characters for empty states (800 × 800, PNG transparent, assets/art/characters/) ───
  'character:empty-receipts': { kind: 'character', subject: 'No receipts yet', file: null },

  // ─── Milestone stamps (400 × 400, SVG, assets/art/stamps/) ───
  'stamp:first-session': { kind: 'stamp', subject: 'First session', file: null },
  'stamp:first-clean-shape': { kind: 'stamp', subject: 'First clean chord', file: null },
  'stamp:first-clean-barre': { kind: 'stamp', subject: 'First clean barre', file: null },
  'stamp:five-clean-shapes': { kind: 'stamp', subject: 'Five clean shapes', file: null },
  'stamp:changes-30': { kind: 'stamp', subject: '30 changes a minute', file: null },
  'stamp:changes-60': { kind: 'stamp', subject: '60 changes a minute', file: null },
  'stamp:all-caged': { kind: 'stamp', subject: 'One chord, all five CAGED shapes', file: null },
  'stamp:streak-7': { kind: 'stamp', subject: 'Seven-day streak', file: null },
  'stamp:ten-hours': { kind: 'stamp', subject: 'Ten hours played', file: null },
};
