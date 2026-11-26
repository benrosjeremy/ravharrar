import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, filterLessons, yearsOf } from '../js/search.js';

const L = (id, title, extra = {}) => ({ id, title, series: 'other', categories: [], publishedAt: '2025-03-01', ...extra });
const lessons = [
  L('a', 'Guemara Kidouchine 57b Animal idolâtré', { series: 'gemara', categories: ['kidouchine'], publishedAt: '2026-11-16' }),
  L('b', 'Cours de Pésah : la liberté', { series: 'chag', categories: ['pessah'] }),
  L('c', 'Le Beth HaMikdach פרשת ויצא', { series: 'parasha', categories: ['vayetse', 'la-priere'], publishedAt: '2024-11-20' }),
  L('d', 'Sans date', { publishedAt: null }),
];

test('normalize ignores case and accents', () => {
  assert.equal(normalize('Pésah'), 'pesah');
  assert.equal(normalize('  IDOLÂTRÉ  '), 'idolatre');
});

test('text search ignores accents and case, and finds Hebrew', () => {
  assert.deepEqual(filterLessons(lessons, { text: 'kidouchine' }).map((l) => l.id), ['a']);
  assert.deepEqual(filterLessons(lessons, { text: 'pesah' }).map((l) => l.id), ['b']);
  assert.deepEqual(filterLessons(lessons, { text: 'פרשת' }).map((l) => l.id), ['c']);
});

test('text search matches category names in either language', () => {
  assert.deepEqual(filterLessons(lessons, { text: 'קידושין' }).map((l) => l.id), ['a']);
  assert.deepEqual(filterLessons(lessons, { text: 'priere' }).map((l) => l.id), ['c']);
});

test('several words must all match', () => {
  assert.deepEqual(filterLessons(lessons, { text: 'kidouchine 57b' }).map((l) => l.id), ['a']);
  assert.deepEqual(filterLessons(lessons, { text: 'kidouchine 58a' }), []);
});

test('series, category and year filters; a lesson in two categories is found under each, once', () => {
  assert.deepEqual(filterLessons(lessons, { series: 'gemara' }).map((l) => l.id), ['a']);
  assert.deepEqual(filterLessons(lessons, { category: 'vayetse' }).map((l) => l.id), ['c']);
  assert.deepEqual(filterLessons(lessons, { category: 'la-priere' }).map((l) => l.id), ['c']);
  assert.deepEqual(filterLessons(lessons, { year: 2026 }).map((l) => l.id), ['a']);
  assert.equal(filterLessons(lessons, {}).length, 4);
});

test('no match gives an empty list', () => {
  assert.deepEqual(filterLessons(lessons, { text: 'zzzz' }), []);
});

test('yearsOf lists the years that have lessons, newest first', () => {
  assert.deepEqual(yearsOf(lessons), [2026, 2025, 2024]);
});

test('straight and curly apostrophes, and Hebrew geresh/gershayim, search the same', () => {
  const ls = [L('x', 'La vie de l’homme'), L('y', "La vie de l'homme"), L('z', 'קידושין נז ע״ב')];
  assert.deepEqual(filterLessons(ls, { text: "l'homme" }).map((l) => l.id), ['x', 'y']);
  assert.deepEqual(filterLessons(ls, { text: 'l’homme' }).map((l) => l.id), ['x', 'y']);
  assert.deepEqual(filterLessons(ls, { text: 'ע"ב' }).map((l) => l.id), ['z']);
});
