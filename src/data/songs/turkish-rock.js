// Suggestion pool: Türkçe rock (TEMPO_UPDATE_REPERTOIRE.md 4.3). Same rule as the rock
// essentials: each song checked on 7 Nov 2026 against the chord sheet in `source`; only chord
// names per part are stored. Duman's "Senden Daha Güzel" was left out: its only sheet
// contradicts its own key. Tempos weren't published for these, so `bpm` is null (tap it in).

export const TURKISH_ROCK = [
  {
    id: 'duman-bekle-dedi-gitti', title: 'Bekle Dedi Gitti', artist: 'Duman', year: 2009,
    level: 1, key: 'Em', bpm: null, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['strumming'],
    parts: [
      { id: 'chorus', name: 'Nakarat', bars: 'Em | Am7 | B7 | Em' },
      { id: 'verse', name: 'Kıta', bars: 'Em | Am7 | B7 | Em' },
    ],
    source: 'https://akorculuk.com/en/chords/17585/duman/bekle-dedi-gitti-chord', verified: true,
    cover: { query: 'Duman Bekle Dedi Gitti' },
  },
  {
    id: 'duman-bu-aksam', title: 'Bu Akşam', artist: 'Duman', year: 2003,
    level: 2, key: 'Bm', bpm: null, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['strumming', 'barre'],
    parts: [
      { id: 'verse', name: 'Giriş ve kıta', bars: 'Bm G | A E | Bm G | A A' },
      { id: 'chorus', name: 'Nakarat', bars: 'Bm G | E F# | Bm G | E F#' },
    ],
    source: 'https://akorculuk.com/en/chords/38/duman/bu-aksam-chord', verified: true,
    cover: { query: 'Duman Bu Akşam' },
  },
  {
    id: 'mor-ve-otesi-bir-derdim-var', title: 'Bir Derdim Var', artist: 'Mor ve Ötesi', year: 2004,
    level: 2, key: 'Bm', bpm: null, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['strumming', 'barre'],
    parts: [
      { id: 'verse', name: 'Kıta', bars: 'Bm | A | Em | G A' },
      { id: 'interlude', name: 'Ara', bars: 'Bm | G | Bm | G' },
      { id: 'chorus', name: 'Nakarat', bars: 'Bm | A | Em | Bm' },
    ],
    source: 'https://akorculuk.com/en/chords/268/mor-ve-otesi/bir-derdim-var-chord', verified: true,
    cover: { query: 'Mor ve Ötesi Bir Derdim Var' },
  },
  {
    id: 'erkin-koray-saskin', title: 'Şaşkın', artist: 'Erkin Koray', year: 1976,
    level: 2, key: 'Dm', bpm: null, timeSignature: '4/4', tuning: 'standard', capo: 0, techniques: ['strumming', 'barre'],
    parts: [
      { id: 'verse', name: 'A bölümü', bars: 'Am Dm | Bb | Dm Bb | Am' },
    ],
    source: 'https://akorculuk.com/en/chords/703/erkin-koray/saskin-chord', verified: true,
    cover: { query: 'Erkin Koray Şaşkın' },
  },
];
