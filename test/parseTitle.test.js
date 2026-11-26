import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTitle } from '../scripts/lib/parseTitle.js';

test('French gemara title with French and Hebrew dates', () => {
  const r = parseTitle('Guemara Kidouchine 57b   Animal idolâtré   16 novembre 2026   6 Kislev 5787   Rav Yaacov B  Harrar');
  assert.equal(r.series, 'gemara');
  assert.equal(r.masechet, 'kidouchine');
  assert.equal(r.daf, '57b');
  assert.equal(r.dateGregorian, '2026-11-16');
  assert.equal(r.dateHebrew, '6 Kislev 5787');
});

test('English gemara title with English month', () => {
  const r = parseTitle('Gemara Kiddushin 58a: Forbidden Money - November 18, 2026 - 8 Kislev 5787 - Rav Yaacov B. Harrar');
  assert.equal(r.series, 'gemara');
  assert.equal(r.masechet, 'kidouchine');
  assert.equal(r.daf, '58a');
  assert.equal(r.dateGregorian, '2026-11-18');
});

test('a daf beats parasha-like words in the topic', () => {
  const r = parseTitle('Gemara Kiddushin 57a Tsipor Metsora November 15, 2026 5 Kislev 5787 Rav Yaacov B Harrar');
  assert.equal(r.series, 'gemara');
  assert.equal(r.parasha, null);
});

test('parasha named after the word paracha', () => {
  const r = parseTitle("Le prix de l'amour-Cours sur la paracha Vayetse du 26 novembre 2025-6 Kislev 5786-Rav Yaacov Harrar");
  assert.equal(r.series, 'parasha');
  assert.equal(r.parasha, 'vayetse');
  assert.equal(r.dateGregorian, '2025-11-26');
  assert.equal(r.dateHebrew, '6 Kislev 5786');
});

test('parasha named in Hebrew', () => {
  const r = parseTitle("Le Beth HaMikdach dans la vie de l'homme   פרשת ויצא");
  assert.equal(r.series, 'parasha');
  assert.equal(r.parasha, 'vayetse');
});

test('a parasha name without a paracha marker is not trusted', () => {
  assert.equal(parseTitle("Noah et l'arche de la foi").series, 'other');
});

test('holiday title', () => {
  const r = parseTitle('La liberté intérieure - Cours de Pessah 2025');
  assert.equal(r.series, 'chag');
  assert.equal(r.chag, 'pessah');
});

test('numeric short date dd/mm/yy', () => {
  const r = parseTitle('L’âme d’Israël influence les sphères spirituelles les plus hautes - 27/11/25 - Rav Yaacov Harrar');
  assert.equal(r.dateGregorian, '2025-11-27');
  assert.equal(r.series, 'other');
});

test('a daf outside the tractate is a parse error, not a lesson of that tractate', () => {
  const r = parseTitle('Guemara Kidouchine 99a');
  assert.equal(r.series, 'other');
  assert.equal(r.masechet, null);
  assert.equal(r.daf, null);
});

test('no dates and empty titles do not throw', () => {
  const r = parseTitle('La force de l\'amour qui brise les pierres');
  assert.deepEqual(r, { series: 'other', masechet: null, daf: null, parasha: null, chag: null, dateGregorian: null, dateHebrew: null });
  assert.equal(parseTitle('').series, 'other');
  assert.equal(parseTitle(undefined).series, 'other');
});
