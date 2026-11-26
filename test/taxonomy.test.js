import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, DAF_COUNTS, categoryBySlug } from '../scripts/lib/taxonomy.js';

const count = (series) => CATEGORIES.filter((c) => c.series === series).length;

test('French categories per series match the old site menus', () => {
  assert.equal(count('parasha'), 48);
  assert.equal(count('gemara'), 11);
  assert.equal(count('chag'), 10);
  assert.equal(count('other'), 14);
});

test('every slug and every oldSlug is unique', () => {
  const slugs = CATEGORIES.map((c) => c.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  const old = CATEGORIES.map((c) => c.oldSlug);
  assert.equal(new Set(old).size, old.length);
});

test('every category has French and Hebrew names', () => {
  for (const c of CATEGORIES) {
    assert.ok(c.fr, `fr missing for ${c.slug}`);
    assert.ok(c.he, `he missing for ${c.slug}`);
  }
});

test('Hebrew-language section has 48 parashot, 10 holidays, 3 other', () => {
  const he = CATEGORIES.filter((c) => c.series === 'hebrew');
  assert.equal(he.filter((c) => c.kind === 'parasha').length, 48);
  assert.equal(he.filter((c) => c.kind === 'chag').length, 10);
  assert.equal(he.filter((c) => c.kind === 'other').length, 3);
});

test('DAF_COUNTS holds the last daf of each tractate on the site', () => {
  assert.deepEqual(DAF_COUNTS, {
    'roch-hachana-gemara': 35, yoma: 88, beitsa: 40, soucca: 56, taanit: 31,
    meguila: 32, 'moed-katane': 29, haguiga: 27, erouvine: 105, ketoubot: 112, kidouchine: 82,
  });
  for (const slug of Object.keys(DAF_COUNTS)) {
    assert.equal(categoryBySlug(slug)?.series, 'gemara', slug);
  }
});

test('aliases cover the English transliteration and Hebrew', () => {
  const k = categoryBySlug('kidouchine');
  assert.ok(k.aliases.includes('kiddushin'));
  assert.ok(k.aliases.includes('קידושין'));
  assert.equal(categoryBySlug('nope'), undefined);
});
