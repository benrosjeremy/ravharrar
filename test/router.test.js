import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, leaveLessonAction } from '../js/router.js';

test('closing a lesson opened from a page goes back instead of adding history', () => {
  assert.equal(leaveLessonAction(true), 'back');
  assert.equal(leaveLessonAction(false), 'replace');
});

test('a malformed escape in the hash does not crash routing', () => {
  assert.deepEqual(parseHash('#/lesson/%E0'), { name: 'lesson', parts: ['%E0'], params: {} });
});
