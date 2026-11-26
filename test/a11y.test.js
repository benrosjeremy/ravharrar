import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trapTarget, normalizePrefs, prefsClasses, loadPrefs, savePrefs, DEFAULT_PREFS, SCALES } from '../js/a11y.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };

test('Tab on the last control of the dialog wraps to the first', () => {
  assert.equal(trapTarget(4, 3, false), 0);
});

test('Shift+Tab on the first control wraps to the last', () => {
  assert.equal(trapTarget(4, 0, true), 3);
});

test('focus outside the dialog is pulled back in', () => {
  assert.equal(trapTarget(4, -1, false), 0);
  assert.equal(trapTarget(4, -1, true), 3);
});

test('Tab inside the dialog away from the edges is left to the browser', () => {
  assert.equal(trapTarget(4, 1, false), null);
  assert.equal(trapTarget(4, 2, true), null);
});

test('prefs default to everything off at normal text size', () => {
  assert.deepEqual(normalizePrefs(undefined), DEFAULT_PREFS);
  assert.equal(DEFAULT_PREFS.size, 0);
});

test('text size steps are clamped to the available scales', () => {
  assert.equal(normalizePrefs({ size: 99 }).size, SCALES.length - 1);
  assert.equal(normalizePrefs({ size: -3 }).size, 0);
  assert.equal(normalizePrefs({ size: 'x' }).size, 0);
});

test('only real booleans switch a feature on', () => {
  const p = normalizePrefs({ contrast: true, links: 'yes', still: 1, readable: true });
  assert.equal(p.contrast, true);
  assert.equal(p.links, false);
  assert.equal(p.still, false);
  assert.equal(p.readable, true);
});

test('prefsClasses lists one class per active feature', () => {
  assert.deepEqual(prefsClasses({ ...DEFAULT_PREFS, contrast: true, still: true }), ['a11y-contrast', 'a11y-still']);
  assert.deepEqual(prefsClasses(DEFAULT_PREFS), []);
});

test('prefs round-trip through storage', () => {
  const s = memoryStorage();
  savePrefs({ ...DEFAULT_PREFS, size: 2, links: true }, s);
  assert.deepEqual(loadPrefs(s), { ...DEFAULT_PREFS, size: 2, links: true });
});

test('blocked or corrupt storage reads as defaults and never throws', () => {
  assert.deepEqual(loadPrefs(broken), DEFAULT_PREFS);
  assert.doesNotThrow(() => savePrefs(DEFAULT_PREFS, broken));
  const s = memoryStorage();
  s.setItem('rh.a11y', '{oops');
  assert.deepEqual(loadPrefs(s), DEFAULT_PREFS);
});
