// Refresh data/videos.json from the YouTube channel.
// Usage: npm run build-data   (needs data/oldsite-playlists.json; create it once with npm run crawl-oldsite)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fetchChannelLessons, fetchRssLessons, fetchPlaylistVideoIds } from './lib/youtube.js';
import { buildOldMap } from './lib/oldsite.js';
import { mergeLessons, shouldWrite } from './lib/merge.js';

const file = (p) => new URL(`../data/${p}`, import.meta.url);
const fail = (msg) => { console.error(`\nERROR: ${msg}\ndata/videos.json was not changed.`); process.exit(1); };

try {
  if (!existsSync(file('oldsite-playlists.json'))) fail('data/oldsite-playlists.json is missing. Run: npm run crawl-oldsite');
  const playlistsBySlug = JSON.parse(readFileSync(file('oldsite-playlists.json'), 'utf8'));

  console.log('1/4 Channel lessons (Videos + finished lives)...');
  const raw = await fetchChannelLessons();
  console.log(`    ${raw.length} lessons`);

  console.log('2/4 RSS (exact dates of the latest lessons)...');
  const rss = await fetchRssLessons().catch((e) => { console.warn(`    RSS skipped: ${e.message}`); return []; });
  const missingFromScrape = rss.filter((r) => !raw.some((l) => l.id === r.id));
  if (missingFromScrape.length) console.warn(`    warning: ${missingFromScrape.length} RSS lessons not in the scrape`);

  console.log('3/4 Category playlists...');
  const unique = [...new Set(Object.values(playlistsBySlug).flat())];
  const idsByPlaylist = {};
  for (let i = 0; i < unique.length; i += 4) {
    await Promise.all(unique.slice(i, i + 4).map(async (pl) => {
      try { idsByPlaylist[pl] = await fetchPlaylistVideoIds(pl); } catch (e) { console.warn(`    ${pl}: ${e.message}`); }
    }));
  }
  const oldMap = buildOldMap(playlistsBySlug, idsByPlaylist);
  console.log(`    ${unique.length} playlists, ${Object.keys(oldMap).length} lessons categorised`);

  console.log('4/4 Merge...');
  const lessons = mergeLessons([...raw, ...missingFromScrape], oldMap, rss);
  const oldCount = existsSync(file('videos.json')) ? JSON.parse(readFileSync(file('videos.json'), 'utf8')).length : 0;
  if (!shouldWrite(lessons.length, oldCount)) fail(`got ${lessons.length} lessons, the current file has ${oldCount}. YouTube may have blocked or changed its pages.`);

  writeFileSync(file('oldsite-map.json'), `${JSON.stringify(oldMap)}\n`);
  writeFileSync(file('videos.json'), `${JSON.stringify(lessons)}\n`);
  const by = (k) => lessons.reduce((a, l) => ({ ...a, [l[k]]: (a[l[k]] ?? 0) + 1 }), {});
  console.log(`\nWrote ${lessons.length} lessons (was ${oldCount}).`);
  console.log('  by source:', by('source'));
  console.log('  by series:', by('series'));
} catch (e) {
  fail(e.stack ?? e.message);
}
