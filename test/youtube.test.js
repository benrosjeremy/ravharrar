import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseRssXml, parseInitialData, parseContinuation, lessonFromLockup, relativeToDate, withRetry } from '../scripts/lib/youtube.js';

const fx = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

test('parseRssXml reads the 15 latest lessons with decoded titles', () => {
  const lessons = parseRssXml(fx('rss.xml'));
  assert.equal(lessons.length, 15);
  assert.equal(lessons[0].id, 'rbKqMCAes8k');
  assert.match(lessons[0].title, /^Guemara Kidouchine 58a/);
  assert.match(lessons[0].publishedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.ok(lessons.every((l) => !/&amp;|&#39;|&quot;/.test(l.title)));
  assert.equal(lessons[0].thumb, 'https://i.ytimg.com/vi/rbKqMCAes8k/mqdefault.jpg');
});

test('parseInitialData reads lessons, durations and the continuation token', () => {
  const { lessons, continuation, clientVersion } = parseInitialData(fx('channel-videos.html'));
  assert.equal(lessons.length, 3);
  assert.equal(lessons[0].id, 'rbKqMCAes8k');
  assert.equal(lessons[0].durationSec, 50 * 60 + 42);
  assert.ok(lessons[0].title.length > 10);
  assert.ok(typeof continuation === 'string' && continuation.length > 20);
  assert.match(clientVersion, /^2\.\d{8}/);
});

test('parseContinuation reads the next page', () => {
  const { lessons, continuation } = parseContinuation(JSON.parse(fx('channel-continuation.json')));
  assert.equal(lessons.length, 2);
  assert.equal(lessons[0].id, 'w-JI_fJoUBk');
  assert.ok(continuation);
});

test('items without a duration (upcoming or live now) are skipped', () => {
  const lockup = {
    contentId: 'abc12345678', contentType: 'LOCKUP_CONTENT_TYPE_VIDEO',
    contentImage: { thumbnailViewModel: { overlays: [{ thumbnailBottomOverlayViewModel: { badges: [{ thumbnailBadgeViewModel: { text: 'LIVE' } }] } }] } },
    metadata: { lockupMetadataViewModel: { title: { content: 'En direct' } } },
  };
  assert.equal(lessonFromLockup(lockup, new Date('2026-11-26')), null);
});

test('invisible zero-width characters are stripped from titles', () => {
  const lockup = {
    contentId: 'abc12345678', contentType: 'LOCKUP_CONTENT_TYPE_VIDEO',
    contentImage: { thumbnailViewModel: { overlays: [{ thumbnailBottomOverlayViewModel: { badges: [{ thumbnailBadgeViewModel: { text: '12:05' } }] } }] } },
    metadata: { lockupMetadataViewModel: { title: { content: '​"Entre la direction d\'Avraham‎' } } },
  };
  const l = lessonFromLockup(lockup, new Date('2026-11-26'));
  assert.equal(l.title, '"Entre la direction d\'Avraham');
  assert.equal(l.durationSec, 725);
});

test('withRetry retries a flaky call and gives up after the last try', async () => {
  let calls = 0;
  const flaky = async () => { calls++; if (calls < 3) throw new Error('blip'); return 'ok'; };
  assert.equal(await withRetry(flaky, { tries: 3, delayMs: 1 }), 'ok');
  assert.equal(calls, 3);
  await assert.rejects(withRetry(async () => { throw new Error('down'); }, { tries: 2, delayMs: 1 }), /down/);
});

test('relativeToDate turns English and French relative text into an approximate date', () => {
  const now = new Date('2026-11-26T12:00:00Z');
  assert.equal(relativeToDate('3 days ago', now), '2026-11-23');
  assert.equal(relativeToDate('Streamed 2 years ago', now), '2024-11-26');
  assert.equal(relativeToDate('il y a 3 semaines', now), '2026-11-05');
  assert.equal(relativeToDate('il y a 1 mois', now), '2026-10-26');
  assert.equal(relativeToDate('nonsense', now), null);
});
