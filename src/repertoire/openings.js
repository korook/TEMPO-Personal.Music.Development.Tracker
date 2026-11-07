// Song openings (TEMPO_UPDATE_REPERTOIRE.md 8.2), merged into the main openings list:
//   song-fix   a part's reps keep repeating a mistake     "Californication · chorus: late change 3/5. Part loop at 70%."
//   song-push  a clean run at a ladder step below 100%     "Californication: clean at 85%. Try 100%."
//   encore     a Stage-ready song past its interval        "Encore: 12 days since Californication."
//   unlock     a missing chord opens up 2+ suggestions     "Learn Bm → unlocks 3 songs."
//   next-song  nothing in Learning                         "Try Zombie: you already play every chord."
// Each opening says which song (and part) it is about, so the setlist can make a Songs block.

import { repertoireSongs, isEncoreDue, daysSincePlayed, bestCleanTempo, nextLadderStep, partState, songState } from './state.js';
import { rankSuggestions, unlockLines } from './suggestions.js';
import { songItem, songPartItem, songItemId } from '../practice/items.js';
import { mistakeCounts } from '../practice/measures.js';
import { describeMistake } from '../data/mistake-tips.js';

const FIX_MIN_COUNT = 3;

// ─── Openings ───

// Every song opening for the current data, highest priority first within each type.
export function songOpenings(state, now = new Date()) {
  const openings = [];
  const rows = repertoireSongs(state);
  for (const { song, entry, state: songStatus } of rows) {
    openings.push(...partFixes(state, song, entry));
    const push = runPush(song, entry);
    if (push) openings.push(push);
    if (isEncoreDue(song, entry, now)) openings.push(encore(song, entry, now));
    if (songStatus === 'learning') openings.push(...learnPart(song, entry));
  }
  openings.push(...unlocks(state));
  if (!rows.some((row) => row.state === 'learning')) {
    const next = nextSong(state);
    if (next) openings.push(next);
  }
  // Every opening needs an item id for de-duplication; ones without a practice item get a stand-in.
  return openings.map((opening) => ({ ...opening, itemId: opening.create ? opening.create.id : `song-opening:${opening.type}:${opening.song || opening.chord}` }));
}

// Song fix: the most repeated mistake in a part's recent reps.
function partFixes(state, song, entry) {
  return song.parts.flatMap((part) => {
    const [top] = mistakeCounts(state.reps, songItemId(song.id, part.id));
    if (!top || top.count < FIX_MIN_COUNT) return [];
    const step = Math.min(nextLadderStep(entry), 85);
    return [{
      type: 'song-fix',
      song: song.id,
      create: songPartItem(song, part),
      text: `${song.title} · ${part.name.toLowerCase()}: ${describeMistake(top.tag).toLowerCase()} ${top.count}/${top.of}. Part loop at ${step === 85 ? 70 : step}%.`,
      short: `${song.title} · ${part.name}: ${describeMistake(top.tag).toLowerCase()} ${top.count}/${top.of}`,
      priority: 105 + top.count * 5,
    }];
  });
}

// Learning: the part you're on (learning first, then the first not-yet part).
function learnPart(song, entry) {
  const part = song.parts.find((candidate) => partState(entry, candidate.id) === 'learning')
    || song.parts.find((candidate) => partState(entry, candidate.id) === 'not-yet');
  if (!part) return [];
  return [{
    type: 'song-learn',
    song: song.id,
    create: songPartItem(song, part),
    text: `${song.title}: loop the ${part.name.toLowerCase()} at 70% until it's clean, then mark it "got it".`,
    short: `${song.title} · ${part.name}: part loop`,
    priority: 70,
  }];
}

// Song push: clean at a ladder step below 100%, so try the next one. A song with every part
// down but no clean run yet starts the ladder at 70%.
function runPush(song, entry) {
  const best = bestCleanTempo(entry);
  if (best === null && songState(song, entry) === 'played-through') {
    return {
      type: 'song-push',
      song: song.id,
      create: songItem(song),
      text: `${song.title}: every part down. Try a run-through at 70%.`,
      short: `${song.title}: first run-through`,
      priority: 60,
    };
  }
  if (best === null || best >= 100) return null;
  const next = nextLadderStep(entry);
  return {
    type: 'song-push',
    song: song.id,
    create: songItem(song),
    text: `${song.title}: clean at ${best}%. Try ${next}%.`,
    short: `${song.title}: clean at ${best}%, try ${next}%`,
    priority: 80,
  };
}

// Encore: a Stage-ready song that hasn't been played for a while.
function encore(song, entry, now) {
  const days = daysSincePlayed(entry, now);
  return {
    type: 'encore',
    song: song.id,
    create: songItem(song),
    text: `Encore: ${days} day${days === 1 ? '' : 's'} since ${song.title}. One full run at 100%.`,
    short: `Encore: ${song.title}`,
    priority: 75 + Math.min(days, 20),
  };
}

// Unlock: the missing chord that opens up the most suggestions (2 or more).
function unlocks(state) {
  return unlockLines(rankSuggestions(state)).filter((line) => line.count >= 2).map((line) => ({
    type: 'unlock',
    chord: line.chord,
    text: `Learn ${line.chord} → unlocks ${line.count} songs.`,
    short: `Learn ${line.chord} → ${line.count} songs`,
    priority: 40 + line.count,
  }));
}

// Next song: nothing is being learned, so suggest one you can already play.
function nextSong(state) {
  const [ready] = rankSuggestions(state).filter((suggestion) => suggestion.status === 'ready');
  if (!ready) return null;
  return {
    type: 'next-song',
    song: ready.song.id,
    text: `Try ${ready.song.title}: you already play every chord.`,
    short: `Try ${ready.song.title}`,
    priority: 35,
  };
}
