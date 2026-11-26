// Reads the Rav's YouTube channel. Two sources:
//  - the public channel pages (/videos, /streams) and their continuation pages — the same
//    data the YouTube web app uses. Unofficial: it can break when YouTube changes.
//  - the official RSS feed (latest 15), used to cross-check and to give exact dates.
// If YOUTUBE_API_KEY is set, the official Data API is used instead of the pages.
// Run Node with --use-system-ca on networks that intercept TLS.

export const CHANNEL_ID = 'UC3p5ej2DH-8VT2pE24m_UFw';
const BASE = 'https://www.youtube.com';
// French: the channel's own language, so titles come back as published, not auto-translated.
const HL = 'fr';
const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36',
  'accept-language': HL,
  cookie: 'CONSENT=YES+1; SOCS=CAI',
};

/** @typedef {{id:string, title:string, durationSec:number, publishedAt:string|null, publishedApprox:boolean, thumb:string}} RawLesson */

export const thumbFor = (id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

const decode = (s) => s
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** @param {string} xml @returns {RawLesson[]} */
export function parseRssXml(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => {
    const id = e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)[1];
    return {
      id,
      title: cleanTitle(decode(e.match(/<title>([^<]*)<\/title>/)[1])),
      durationSec: 0,
      publishedAt: e.match(/<published>([^<]+)<\/published>/)?.[1] ?? null,
      publishedApprox: false,
      thumb: thumbFor(id),
    };
  });
}

const UNITS = {
  second: 's', seconde: 's', minute: 'mi', hour: 'h', heure: 'h', day: 'd', jour: 'd',
  week: 'w', semaine: 'w', month: 'mo', mois: 'mo', year: 'y', an: 'y', annee: 'y',
};

/** "3 days ago" / "il y a 3 semaines" -> approximate YYYY-MM-DD, or null. */
export function relativeToDate(text, now = new Date()) {
  const t = String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const m = t.match(/(\d+)\s+(second|seconde|minute|hour|heure|day|jour|week|semaine|month|mois|year|annee|an)s?\b/);
  if (!m) return null;
  const n = Number(m[1]);
  const d = new Date(now.getTime());
  switch (UNITS[m[2]]) {
    case 'd': d.setUTCDate(d.getUTCDate() - n); break;
    case 'w': d.setUTCDate(d.getUTCDate() - 7 * n); break;
    case 'mo': d.setUTCMonth(d.getUTCMonth() - n); break;
    case 'y': d.setUTCFullYear(d.getUTCFullYear() - n); break;
    default: break; // seconds/minutes/hours: today
  }
  return d.toISOString().slice(0, 10);
}

/** Remove zero-width/direction marks and trim. */
export const cleanTitle = (s) => String(s ?? '').replace(/[​-‏‪-‮⁦-⁩﻿]/g, '').trim();

const toSeconds =(s) => s.split(':').map(Number).reduce((acc, n) => acc * 60 + n, 0);

/** Depth-first search for every value under a given key. */
function* findKey(node, key) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { for (const n of node) yield* findKey(n, key); return; }
  for (const [k, v] of Object.entries(node)) {
    if (k === key) yield v;
    yield* findKey(v, key);
  }
}

/** One grid item (new lockupViewModel shape) -> RawLesson, or null for live/upcoming/non-video. */
export function lessonFromLockup(lockup, now = new Date()) {
  if (!lockup?.contentId || (lockup.contentType && lockup.contentType !== 'LOCKUP_CONTENT_TYPE_VIDEO')) return null;
  const badge = [...findKey(lockup.contentImage, 'thumbnailBadgeViewModel')]
    .map((b) => b?.text).find((t) => /^\d+(:\d{2}){1,2}$/.test(t ?? ''));
  if (!badge) return null; // no duration: live now, upcoming, or premiere
  const parts = [...findKey(lockup.metadata, 'metadataParts')].flat().map((p) => p?.text?.content ?? '');
  const rel = parts.map((p) => relativeToDate(p, now)).find(Boolean) ?? null;
  return {
    id: lockup.contentId,
    title: cleanTitle(lockup.metadata?.lockupMetadataViewModel?.title?.content),
    durationSec: toSeconds(badge),
    publishedAt: rel,
    publishedApprox: true,
    thumb: thumbFor(lockup.contentId),
  };
}

/** Older videoRenderer shape, still served on some pages. */
function lessonFromVideoRenderer(v, now) {
  const len = v.lengthText?.simpleText;
  if (!v.videoId || !len) return null;
  return {
    id: v.videoId,
    title: cleanTitle(v.title?.runs?.map((r) => r.text).join('') ?? v.title?.simpleText),
    durationSec: toSeconds(len),
    publishedAt: relativeToDate(v.publishedTimeText?.simpleText, now),
    publishedApprox: true,
    thumb: thumbFor(v.videoId),
  };
}

function readItems(items, now) {
  const lessons = [];
  let continuation = null;
  for (const it of items ?? []) {
    const c = it.richItemRenderer?.content;
    const l = c?.lockupViewModel ? lessonFromLockup(c.lockupViewModel, now)
      : c?.videoRenderer ? lessonFromVideoRenderer(c.videoRenderer, now) : null;
    if (l) lessons.push(l);
    const tok = it.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
    if (tok) continuation = tok;
  }
  return { lessons, continuation };
}

/** @param {string} html channel tab page @returns {{lessons:RawLesson[], continuation:string|null, clientVersion:string|null}} */
export function parseInitialData(html, now = new Date()) {
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!m) throw new Error('ytInitialData not found: YouTube page layout changed or a consent/bot wall was served');
  const data = JSON.parse(m[1]);
  const tab = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.find((t) => t.tabRenderer?.selected)?.tabRenderer;
  const items = tab?.content?.richGridRenderer?.contents;
  if (!items) throw new Error('richGridRenderer not found in the selected channel tab');
  return { ...readItems(items, now), clientVersion: html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1] ?? null };
}

/** @param {object} json browse continuation response */
export function parseContinuation(json, now = new Date()) {
  const items = (json.onResponseReceivedActions ?? [])
    .flatMap((a) => a.appendContinuationItemsAction?.continuationItems ?? a.reloadContinuationItemsCommand?.continuationItems ?? []);
  return readItems(items, now);
}

async function getText(url) {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
  return r.text();
}

async function fetchTab(tab, now) {
  const first = parseInitialData(await getText(`${BASE}/channel/${CHANNEL_ID}/${tab}?hl=${HL}`), now);
  const lessons = [...first.lessons];
  let token = first.continuation;
  for (let page = 0; token && page < 500; page++) {
    const r = await fetch(`${BASE}/youtubei/v1/browse?prettyPrint=false`, {
      method: 'POST',
      headers: { ...HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: first.clientVersion, hl: HL } }, continuation: token }),
    });
    if (!r.ok) throw new Error(`continuation page ${page} of ${tab} -> HTTP ${r.status}`);
    const next = parseContinuation(await r.json(), now);
    lessons.push(...next.lessons);
    token = next.continuation;
  }
  return lessons;
}

const isoDurationToSec = (d) => {
  const m = d?.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) ?? [];
  return ((+m[1] || 0) * 86400) + ((+m[2] || 0) * 3600) + ((+m[3] || 0) * 60) + (+m[4] || 0);
};

async function fetchWithApi(apiKey) {
  const api = (path) => fetch(`https://www.googleapis.com/youtube/v3/${path}&key=${apiKey}`).then(async (r) => {
    if (!r.ok) throw new Error(`YouTube API ${path.split('?')[0]} -> HTTP ${r.status}`);
    return r.json();
  });
  const uploads = (await api(`channels?part=contentDetails&id=${CHANNEL_ID}`)).items[0].contentDetails.relatedPlaylists.uploads;
  const ids = [];
  let pageToken = '';
  do {
    const p = await api(`playlistItems?part=contentDetails&maxResults=50&playlistId=${uploads}${pageToken ? `&pageToken=${pageToken}` : ''}`);
    ids.push(...p.items.map((i) => i.contentDetails.videoId));
    pageToken = p.nextPageToken ?? '';
  } while (pageToken);
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const v = await api(`videos?part=snippet,contentDetails,liveStreamingDetails&id=${ids.slice(i, i + 50).join(',')}`);
    for (const it of v.items) {
      const durationSec = isoDurationToSec(it.contentDetails.duration);
      if (it.snippet.liveBroadcastContent !== 'none' || durationSec <= 60) continue; // live/upcoming/Shorts
      out.push({ id: it.id, title: it.snippet.title, durationSec, publishedAt: it.snippet.publishedAt, publishedApprox: false, thumb: thumbFor(it.id) });
    }
  }
  return out;
}

function playlistItems(node) {
  const ids = [];
  for (const l of findKey(node, 'lockupViewModel')) {
    if (l?.contentId && (!l.contentType || l.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO')) ids.push(l.contentId);
  }
  for (const v of findKey(node, 'playlistVideoRenderer')) if (v?.videoId) ids.push(v.videoId);
  const token = [...findKey(node, 'continuationCommand')].map((c) => c?.token).find((t) => typeof t === 'string') ?? null;
  return { ids: [...new Set(ids)], continuation: token };
}

/** @param {string} html playlist page @returns {{ids:string[], continuation:string|null, clientVersion:string|null}} */
export function parsePlaylistPage(html) {
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!m) throw new Error('ytInitialData not found on playlist page');
  const data = JSON.parse(m[1]);
  return { ...playlistItems(data.contents), clientVersion: html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1] ?? null };
}

/** @param {object} json browse continuation response for a playlist */
export function parsePlaylistContinuation(json) {
  return playlistItems(json.onResponseReceivedActions ?? []);
}

/** Run fn up to `tries` times, waiting a little longer each time. */
export async function withRetry(fn, { tries = 3, delayMs = 1500 } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) { last = e; if (i < tries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1))); }
  }
  throw last;
}

/** All video ids of a playlist, in order. YouTube sometimes serves a page without data: retried. */
export async function fetchPlaylistVideoIds(playlistId) {
  const first = await withRetry(async () => {
    const page = parsePlaylistPage(await getText(`${BASE}/playlist?list=${playlistId}&hl=${HL}`));
    if (!page.ids.length) throw new Error('playlist page came back empty');
    return page;
  });
  const ids = [...first.ids];
  let token = first.continuation;
  for (let page = 0; token && page < 200; page++) {
    const r = await fetch(`${BASE}/youtubei/v1/browse?prettyPrint=false`, {
      method: 'POST',
      headers: { ...HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: first.clientVersion, hl: HL } }, continuation: token }),
    });
    if (!r.ok) throw new Error(`playlist ${playlistId} page ${page} -> HTTP ${r.status}`);
    const next = parsePlaylistContinuation(await r.json());
    const before = ids.length;
    for (const id of next.ids) if (!ids.includes(id)) ids.push(id);
    if (ids.length === before) break; // nothing new: stop
    token = next.continuation;
  }
  return ids;
}

/** Every lesson: Videos tab + finished live streams. Shorts are never requested. */
export async function fetchChannelLessons({ apiKey = process.env.YOUTUBE_API_KEY, now = new Date() } = {}) {
  if (apiKey) return fetchWithApi(apiKey);
  const videos = await fetchTab('videos', now);
  let streams = [];
  try { streams = await fetchTab('streams', now); } catch (e) { console.warn(`streams tab skipped: ${e.message}`); }
  const seen = new Set();
  return [...videos, ...streams].filter((l) => !seen.has(l.id) && seen.add(l.id));
}

/** @returns {Promise<RawLesson[]>} */
export async function fetchRssLessons() {
  return parseRssXml(await getText(`${BASE}/feeds/videos.xml?channel_id=${CHANNEL_ID}`));
}
