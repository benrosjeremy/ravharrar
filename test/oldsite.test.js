import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extractPlaylistIds, buildOldMap, loadOldMap } from '../scripts/lib/oldsite.js';
import { parsePlaylistPage, parsePlaylistContinuation } from '../scripts/lib/youtube.js';

const fxPath = (name) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const fx = (name) => readFileSync(fxPath(name), 'utf8');

test('extractPlaylistIds finds the YouTube playlist behind an old category page', () => {
  assert.deepEqual(extractPlaylistIds(fx('oldsite-vayetse-snippet.html')), ['PLuFRhQbTUAR8jLjGFVC28aogql8pKFBBC']);
  assert.deepEqual(extractPlaylistIds('<html>no gallery</html>'), []);
});

test('parsePlaylistPage reads video ids in order and the continuation token', () => {
  const { ids, continuation } = parsePlaylistPage(fx('playlist.html'));
  assert.equal(ids.length, 3);
  assert.equal(ids[0], 'ji5e9DRa5L4');
  assert.match(continuation, /^4qmFsg/);
});

test('parsePlaylistContinuation reads the next page', () => {
  const json = { onResponseReceivedActions: [{ appendContinuationItemsAction: { continuationItems: [
    { lockupViewModel: { contentId: 'aaaaaaaaaaa', contentType: 'LOCKUP_CONTENT_TYPE_VIDEO' } },
    { playlistVideoRenderer: { videoId: 'bbbbbbbbbbb' } },
  ] } }] };
  assert.deepEqual(parsePlaylistContinuation(json), { ids: ['aaaaaaaaaaa', 'bbbbbbbbbbb'], continuation: null });
});

test('buildOldMap inverts category playlists into video -> categories, keeping several', () => {
  const map = buildOldMap({ vayetse: ['PL1'], 'la-priere': ['PL2'] }, { PL1: ['a', 'b'], PL2: ['b'] });
  assert.deepEqual(map, { a: ['vayetse'], b: ['vayetse', 'la-priere'] });
});

test('loadOldMap reads the committed map and rejects broken JSON', () => {
  assert.deepEqual(loadOldMap(fxPath('oldsite-map.json')).ji5e9DRa5L4, ['vayetse', 'la-priere']);
  assert.throws(() => loadOldMap(fxPath('bad.json')));
});
