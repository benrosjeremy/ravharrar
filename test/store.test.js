import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadState, saveProgress, markWatched } from '../js/store.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };

test('empty storage gives no last lesson and nothing watched', () => {
  assert.deepEqual(loadState(memoryStorage()), { last: null, watched: [] });
});

test('saveProgress remembers the last lesson and its position', () => {
  const s = memoryStorage();
  saveProgress('abc', 125.7, s);
  saveProgress('xyz', 30, s);
  assert.deepEqual(loadState(s).last, { id: 'xyz', position: 30 });
});

test('markWatched is idempotent', () => {
  const s = memoryStorage();
  markWatched('abc', s);
  markWatched('abc', s);
  assert.deepEqual(loadState(s).watched, ['abc']);
});

test('blocked storage never throws and reads as empty', () => {
  assert.deepEqual(loadState(broken), { last: null, watched: [] });
  assert.doesNotThrow(() => saveProgress('abc', 10, broken));
  assert.doesNotThrow(() => markWatched('abc', broken));
});

test('corrupt stored JSON reads as empty', () => {
  const s = memoryStorage();
  s.setItem('rh.state', '{oops');
  assert.deepEqual(loadState(s), { last: null, watched: [] });
});
