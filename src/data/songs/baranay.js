// Baranay's own songs (TEMPO_UPDATE_REPERTOIRE.md 4.2). They start in his repertoire as
// "I already know this" (every part "got it" = Played through); run-throughs raise them to
// Stage-ready. Checked on 7 Nov 2026 against the sources below; only chord names are stored.

export const BARANAY_SONGS = [
  {
    id: 'rhcp-californication', title: 'Californication', artist: 'Red Hot Chili Peppers', year: 1999,
    level: 2, key: 'Am', bpm: 96, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['riff', 'strumming'],
    parts: [
      { id: 'intro', name: 'Intro riff (arpeggio)', bars: 'Am | F' },
      { id: 'verse', name: 'Verse', bars: 'Am | F | Am | F' },
      { id: 'pre-chorus', name: 'Pre-chorus', bars: 'C | G | F | Dm | Am | Fmaj7' },
      { id: 'chorus', name: 'Chorus', bars: 'C | G | Dm | Am' },
      { id: 'bridge', name: 'Bridge', bars: 'F#m | Dmaj7 | Bm | D | A | E' },
    ],
    source: 'https://www.jonmaclennan.com/blog/californication-chords', verified: true,
    cover: { query: 'Red Hot Chili Peppers Californication' },
  },
  {
    id: 'adamlar-koca-yasli-sisko-dunya', title: 'Koca Yaşlı Şişko Dünya', artist: 'Adamlar', year: 2014,
    level: 2, key: 'Em', bpm: null, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['strumming'],
    parts: [
      { id: 'verse', name: 'Giriş ve kıta', bars: 'Em Am | Em Am | Em D | C B Em' },
      { id: 'chorus', name: 'Nakarat', bars: 'D C Em | D C Em | D C Em | D C Em' },
    ],
    source: 'https://akorculuk.com/en/chords/405/adamlar/koca-yasli-sisko-dunya-chord', verified: true,
    cover: { query: 'Adamlar Koca Yaşlı Şişko Dünya' },
  },
  {
    id: 'son-feci-bisiklet-pazar-ve-ertesi', title: 'Pazar ve Ertesi', artist: 'Son Feci Bisiklet', year: null,
    level: 2, key: 'Dm', bpm: 100, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['strumming', 'barre'],
    parts: [
      { id: 'verse', name: 'Giriş ve kıta', bars: 'Dm | Gm | A | A' },
      { id: 'chorus', name: 'Nakarat', bars: 'Dm Gm | A Dm | Gm A | Dm' },
    ],
    source: 'https://akorculuk.com/akorlar/6548/son-feci-bisiklet/pazar-ve-ertesi-akor', verified: true,
    cover: { query: 'Son Feci Bisiklet Pazar ve Ertesi' },
  },
];
