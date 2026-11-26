// The old Wix site shows each category as a Wix Video gallery fed by one YouTube playlist.
// We read the playlist id(s) behind every old category page once (data/oldsite-playlists.json),
// and from then on category membership comes straight from those YouTube playlists.
import { readFileSync } from 'node:fs';

export const OLD_SITE = 'https://www.ravharrar.com';

/** @param {string} html an old category page @returns {string[]} playlist ids, in page order */
export function extractPlaylistIds(html) {
  const unescaped = String(html).split('\\/').join('/').split('\\"').join('"');
  const ids = [...unescaped.matchAll(/youtube\.com\/playlist\?list=([\w-]{10,})/g)].map((m) => m[1]);
  return [...new Set(ids)];
}

/**
 * @param {Record<string,string[]>} playlistsBySlug category slug -> playlist ids
 * @param {Record<string,string[]>} idsByPlaylist playlist id -> video ids
 * @returns {Record<string,string[]>} video id -> category slugs (in category order)
 */
export function buildOldMap(playlistsBySlug, idsByPlaylist) {
  const map = {};
  for (const [slug, playlists] of Object.entries(playlistsBySlug)) {
    for (const pl of playlists) {
      for (const id of idsByPlaylist[pl] ?? []) {
        map[id] ??= [];
        if (!map[id].includes(slug)) map[id].push(slug);
      }
    }
  }
  return map;
}

/** @returns {Record<string,string[]>} */
export function loadOldMap(path = new URL('../../data/oldsite-map.json', import.meta.url)) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Fetch every old category page and collect its playlist ids. One-time; 500 ms between pages. */
export async function crawlOldSitePlaylists(categories, { delayMs = 500, log = console.log } = {}) {
  const out = {};
  for (const c of categories) {
    const r = await fetch(`${OLD_SITE}/${encodeURIComponent(c.oldSlug)}`, { headers: { 'user-agent': 'Mozilla/5.0 (ravharrar-modern data refresh)' } });
    if (!r.ok) { log(`  ${c.slug}: HTTP ${r.status}`); out[c.slug] = []; continue; }
    out[c.slug] = extractPlaylistIds(await r.text());
    log(`  ${c.slug}: ${out[c.slug].join(', ') || 'no playlist'}`);
    await new Promise((res) => setTimeout(res, delayMs));
  }
  return out;
}
