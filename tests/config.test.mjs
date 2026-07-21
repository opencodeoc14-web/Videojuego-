import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  CHARACTERS,
  DIFFICULTIES,
  ITEM_ICONS,
  ITEM_NAMES,
  TRACKS,
  formatTime,
  getCharacter,
  getDifficulty,
  getTrack,
  progressPassed,
} from '../web/characters.js';
import { Kart } from '../web/kart.js';
import { RaceTrack } from '../web/track.js';

const REQUIRED_CHARACTER_STATS = [
  'maxSpeed',
  'acceleration',
  'handling',
  'weight',
  'drift',
  'offRoad',
  'luck',
];

test('all selectable content has stable unique identifiers', () => {
  for (const collection of [CHARACTERS, TRACKS, DIFFICULTIES]) {
    const ids = collection.map((entry) => entry.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.every((id) => /^[a-z][a-z0-9-]*$/.test(id)));
  }
});

test('the roster exposes complete and balanced gameplay statistics', () => {
  assert.equal(CHARACTERS.length, 8);
  for (const character of CHARACTERS) {
    assert.ok(character.name.length > 0);
    assert.ok(character.emoji.length > 0);
    assert.match(character.accent, /^#[0-9a-f]{6}$/i);
    for (const stat of REQUIRED_CHARACTER_STATS) {
      assert.equal(typeof character[stat], 'number');
      assert.ok(character[stat] >= 0.78 && character[stat] <= 1.22, `${character.id}.${stat}`);
    }
  }
});

test('character, track and difficulty fallbacks are valid', () => {
  assert.ok(CHARACTERS.includes(getCharacter('unknown')));
  assert.ok(DIFFICULTIES.includes(getDifficulty('unknown')));
  assert.ok(TRACKS.includes(getTrack('unknown')));
});

test('every track builds a complete circuit with coins, boosts and jumps', () => {
  assert.equal(TRACKS.length, 3);
  for (const definition of TRACKS) {
    assert.ok(definition.points.length >= 10);
    assert.ok(definition.width > 12);
    assert.ok(definition.coinLines.length >= 6);
    assert.ok(definition.boostPads.length >= 3);
    assert.ok(definition.jumpPads.length >= 2);
    for (const collection of [definition.coinLines]) {
      assert.ok(collection.every((progress) => progress > 0 && progress < 1));
    }
    for (const pad of [...definition.boostPads, ...definition.jumpPads]) {
      assert.ok(pad.progress > 0 && pad.progress < 1);
      assert.ok(Number.isFinite(pad.lateral));
    }

    const track = new RaceTrack(definition);
    assert.ok(track.length > 150);
    assert.equal(track.points.length, track.sampleCount);
    assert.ok(track.getMapPoints().length >= 100);
    const sample = track.sample(0.25, 2);
    assert.ok(Number.isFinite(sample.position.x));
    assert.ok(Number.isFinite(sample.position.z));
    assert.ok(Math.abs(sample.tangent.length() - 1) < 0.001);
    track.dispose();
  }
});

test('kart progression supports coins, jumps and checkpoint-safe laps', () => {
  const track = new RaceTrack(TRACKS[0]);
  const kart = new Kart('test-player', CHARACTERS[3], true);
  kart.place(track, 0.05, 0);
  assert.equal(kart.addCoin(20), true);
  assert.equal(kart.coins, 10);
  assert.equal(kart.addCoin(1), false);
  assert.equal(kart.launch(8), true);
  assert.equal(kart.airborne, true);
  kart.update({ steer: 0, throttle: 1, brake: 0, drift: false, useItem: false }, track, 1 / 60, true);
  assert.ok(kart.group.position.y > kart.groundY);
  kart.dispose();
  track.dispose();
});

test('item catalogue and difficulty presets are complete', () => {
  assert.equal(DIFFICULTIES.length, 3);
  for (const item of ['nitro', 'rocket', 'shield', 'trap', 'pulse']) {
    assert.equal(typeof ITEM_ICONS[item], 'string');
    assert.ok(ITEM_ICONS[item].length > 0);
    assert.equal(typeof ITEM_NAMES[item], 'string');
    assert.ok(ITEM_NAMES[item].length > 0);
  }
});

test('checkpoint progress handles normal movement and finish-line wrapping', () => {
  assert.equal(progressPassed(0.1, 0.3, 0.22), true);
  assert.equal(progressPassed(0.1, 0.18, 0.22), false);
  assert.equal(progressPassed(0.96, 0.04, 0.99), true);
  assert.equal(progressPassed(0.96, 0.04, 0.5), false);
  assert.equal(progressPassed(0.1, 0.9, 0.22), false, 'rejects implausible backwards/teleport movement');
});

test('time formatting is stable', () => {
  assert.equal(formatTime(0), '0:00.00');
  assert.equal(formatTime(61.234), '1:01.23');
  assert.equal(formatTime(Infinity), '—');
});

test('browser entry point references the production modules and installable app metadata', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /\.\/web\/game\.js/);
  assert.match(html, /\.\/src\/styles\.css/);
  assert.match(html, /three@0\.185\.1/);
  assert.match(html, /manifest\.webmanifest/);
  assert.doesNotMatch(html, /src="\/|href="\//, 'all production URLs remain repository-relative');
});
