import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeLessons, shouldWrite } from '../scripts/lib/merge.js';

const raw = (id, title, publishedAt = '2023-01-01', approx = true) =>
  ({ id, title, durationSec: 600, publishedAt, publishedApprox: approx, thumb: `t/${id}` });

test('a lesson in the old-site map takes its categories from the map', () => {
  const [l] = mergeLessons([raw('a', 'La force de l\'amour')], { a: ['vayetse'] });
  assert.equal(l.source, 'map');
  assert.deepEqual(l.categories, ['vayetse']);
  assert.equal(l.series, 'parasha');
  assert.equal(l.parasha, 'vayetse');
});

test('the map wins over the title', () => {
  const [l] = mergeLessons([raw('a', 'Cours de Pessah')], { a: ['la-priere'] });
  assert.equal(l.series, 'other');
  assert.deepEqual(l.categories, ['la-priere']);
  assert.equal(l.chag, null);
});

test('a gemara lesson in the map keeps the daf parsed from its title', () => {
  const [l] = mergeLessons([raw('a', 'Guemara Kidouchine 57b Animal idolâtré')], { a: ['kidouchine'] });
  assert.equal(l.masechet, 'kidouchine');
  assert.equal(l.daf, '57b');
});

test('a lesson not in the map is classified from its title', () => {
  const [l] = mergeLessons([raw('b', 'Gemara Kiddushin 58a: Forbidden Money')], {});
  assert.equal(l.source, 'title');
  assert.equal(l.series, 'gemara');
  assert.deepEqual(l.categories, ['kidouchine']);
});

test('an unclassifiable lesson is other with no categories', () => {
  const [l] = mergeLessons([raw('c', 'Une pensée')], {});
  assert.equal(l.source, 'none');
  assert.equal(l.series, 'other');
  assert.deepEqual(l.categories, []);
});

test('a lesson in two categories appears once and keeps both', () => {
  const out = mergeLessons([raw('d', 'x'), raw('d', 'x')], { d: ['vayetse', 'la-priere'] });
  assert.equal(out.length, 1);
  assert.deepEqual(out[0].categories, ['vayetse', 'la-priere']);
});

test('dates: the day taught (title) beats the upload day (RSS), which beats the approximate scrape date', () => {
  const out = mergeLessons(
    [raw('e', 'Cours 16 novembre 2026', '2026-11-20', true), raw('f', 'Cours 16 novembre 2026', '2026-11-20', true),
      raw('h', 'Sans date', '2026-11-20', true), raw('g', 'Sans date', null, true)],
    {},
    [{ id: 'f', publishedAt: '2026-11-19T08:00:00+00:00' }, { id: 'h', publishedAt: '2026-11-18T08:00:00+00:00' }],
  );
  const by = Object.fromEntries(out.map((l) => [l.id, l]));
  assert.equal(by.e.publishedAt, '2026-11-16');
  assert.equal(by.e.dateApprox, false);
  assert.equal(by.f.publishedAt, '2026-11-16');
  assert.equal(by.h.publishedAt, '2026-11-18');
  assert.equal(by.h.dateApprox, false);
  assert.equal(by.g.publishedAt, null);
});

test('sorted newest first, ties keep channel order, undated last', () => {
  const out = mergeLessons([raw('old', 'x', '2020-01-01'), raw('n1', 'x', '2024-01-01'), raw('n2', 'x', '2024-01-01'), raw('u', 'x', null)], {});
  assert.deepEqual(out.map((l) => l.id), ['n1', 'n2', 'old', 'u']);
});

test('shouldWrite refuses an empty or clearly shrunken result', () => {
  assert.equal(shouldWrite(0, 0), false);
  assert.equal(shouldWrite(4700, 4791), false);
  assert.equal(shouldWrite(4787, 4791), true);
  assert.equal(shouldWrite(15, 0), true);
});
