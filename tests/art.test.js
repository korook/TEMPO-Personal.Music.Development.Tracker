// Tests for the art drop-in pipeline (TEMPO_PLAN.md 17.4, item 1): the manifest has a line
// for every art frame the app shows, every pixel stand-in matches a manifest key, and any
// file the manifest names really exists.

import { describe, it, expect } from 'vitest';
import { ART_MANIFEST } from '../assets/art/manifest.js';
import { findManifestProblems, artSource, artFileUrl, listArt } from '../src/art/resolve.js';
import { SPRITE_KEYS, getSprite } from '../src/art/sprites.js';
import { ART_SPECS } from '../src/components/art-placeholder.js';
import { EAR_EXERCISES } from '../src/ear/index.js';
import { MILESTONES } from '../src/practice/milestones.js';
import { getTopics } from '../src/lessons/content.js';

describe('art manifest', () => {
  it('has no problems (known kinds, matching key prefixes, files that exist)', () => {
    expect(findManifestProblems(Object.keys(ART_SPECS))).toEqual([]);
  });

  it('lists every frame the app shows', () => {
    const used = [
      'hero:today',
      ...EAR_EXERCISES.map((exercise) => `cover:ear-${exercise.id}`),
      ...getTopics().map((topic) => `cover:theory-${topic.id}`),
      ...MILESTONES.map((milestone) => `stamp:${milestone.id}`),
    ];
    expect(used.filter((key) => !ART_MANIFEST[key])).toEqual([]);
  });

  it('every pixel stand-in belongs to a manifest key', () => {
    expect(SPRITE_KEYS.filter((key) => !ART_MANIFEST[key])).toEqual([]);
  });

  it('falls back from file to pixel stand-in to placeholder', () => {
    expect(artFileUrl('cover:ear-intervals')).toBeNull();
    expect(artSource('cover:ear-intervals')).toBe('pixel');
    expect(getSprite('cover:theory-02-intervals')).toBeNull();
    expect(artSource('cover:theory-02-intervals')).toBe('placeholder');
    expect(listArt()).toHaveLength(Object.keys(ART_MANIFEST).length);
  });
});
