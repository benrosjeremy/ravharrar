import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirFor, translate, hebrewNumeral } from '../js/i18n.js';

const load = (lang) => JSON.parse(readFileSync(new URL(`../i18n/${lang}.json`, import.meta.url), 'utf8'));

test('French and Hebrew UI files have the same keys', () => {
  assert.deepEqual(Object.keys(load('he')).sort(), Object.keys(load('fr')).sort());
});

test('Hebrew is right-to-left, French left-to-right', () => {
  assert.equal(dirFor('he'), 'rtl');
  assert.equal(dirFor('fr'), 'ltr');
});

test('translate fills {placeholders} and falls back to the key', () => {
  const dict = { count: '{n} cours' };
  assert.equal(translate(dict, 'count', { n: 12 }), '12 cours');
  assert.equal(translate(dict, 'missing'), 'missing');
});

test('hebrewNumeral writes daf numbers the way a gemara page does', () => {
  assert.equal(hebrewNumeral(2), 'ב');
  assert.equal(hebrewNumeral(15), 'טו');
  assert.equal(hebrewNumeral(16), 'טז');
  assert.equal(hebrewNumeral(58), 'נח');
  assert.equal(hebrewNumeral(105), 'קה');
  assert.equal(hebrewNumeral(112), 'קיב');
});
