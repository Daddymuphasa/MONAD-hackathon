import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAutoMode } from '../src/visualizers/auto-mode.js';

test('auto mode waits for a hit, avoids recent packs, and falls back after silence', () => {
  const packs = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }));
  const auto = createAutoMode(packs, () => 0);
  auto.start(0, 'a');

  assert.equal(auto.maybeNext(11999, 1, 'a'), null);
  assert.equal(auto.maybeNext(12000, 0, 'a'), null);
  assert.equal(auto.maybeNext(12000, 1, 'a'), 'b');
  assert.equal(auto.maybeNext(24000, 1, 'b'), 'c');
  assert.equal(auto.maybeNext(36000, 1, 'c'), 'd');
  assert.equal(auto.maybeNext(48000, 0, 'd'), null);
  assert.equal(auto.maybeNext(54000, 0, 'd'), 'a');
});
