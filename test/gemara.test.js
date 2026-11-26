import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverage } from '../js/coverage.js';

const L = (id, daf, masechet = 'kidouchine') => ({ id, masechet, daf });

test('coverage lists every amud from 2a to the last amud, in order', () => {
  const c = coverage([], 'kidouchine');
  assert.equal(c[0].daf, '2a');
  assert.equal(c[1].daf, '2b');
  assert.equal(c.at(-1).daf, '82b');
  assert.equal(c.length, 81 * 2);
});

test('a daf with two lessons returns both; other tractates are ignored', () => {
  const c = coverage([L('x', '57b'), L('y', '57b'), L('z', '57b', 'yoma')], 'kidouchine');
  assert.deepEqual(c.find((d) => d.daf === '57b').lessons.map((l) => l.id), ['x', 'y']);
});

test('a lesson outside the tractate range is not placed', () => {
  const c = coverage([L('bad', '99a')], 'kidouchine');
  assert.ok(c.every((d) => d.lessons.length === 0));
});

test('unknown tractate gives an empty map', () => {
  assert.deepEqual(coverage([L('x', '2a')], 'nope'), []);
});
