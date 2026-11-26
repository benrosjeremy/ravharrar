import { categoryBySlug } from './taxonomy.js';
import { parseTitle } from './parseTitle.js';

/**
 * @typedef {{id:string, title:string, durationSec:number, publishedAt:string|null, dateApprox:boolean, thumb:string,
 *   series:'parasha'|'gemara'|'chag'|'other'|'hebrew', categories:string[], masechet:string|null, daf:string|null,
 *   parasha:string|null, chag:string|null, dateGregorian:string|null, dateHebrew:string|null, source:'map'|'title'|'none'}} Lesson
 */

const firstOf = (cats, series) => cats.map(categoryBySlug).find((c) => c?.series === series)?.slug ?? null;

function classify(title, mapped) {
  const p = parseTitle(title);
  const dates = { dateGregorian: p.dateGregorian, dateHebrew: p.dateHebrew };
  if (mapped?.length) {
    const categories = mapped.filter((s) => categoryBySlug(s));
    if (categories.length) {
      // A confident daf in the title is never overridden: a gemara lesson filed in a parasha
      // playlist also joins its tractate, so it shows on the daf map.
      if (p.masechet && !firstOf(categories, 'gemara')) categories.push(p.masechet);
      const masechet = firstOf(categories, 'gemara');
      return {
        series: categoryBySlug(categories[0]).series,
        categories,
        masechet,
        daf: masechet && p.masechet === masechet ? p.daf : null,
        parasha: firstOf(categories, 'parasha'),
        chag: firstOf(categories, 'chag'),
        ...dates,
        source: 'map',
      };
    }
  }
  const slug = p.masechet ?? p.parasha ?? p.chag;
  return {
    series: p.series,
    categories: slug ? [slug] : [],
    masechet: p.masechet, daf: p.daf, parasha: p.parasha, chag: p.chag,
    ...dates,
    source: p.series === 'other' ? 'none' : 'title',
  };
}

/**
 * @param {import('./youtube.js').RawLesson[]} raw channel lessons, newest first
 * @param {Record<string,string[]>} oldMap video id -> old-site category slugs
 * @param {{id:string, publishedAt:string}[]} rss exact dates for the latest lessons
 * @returns {Lesson[]} newest first
 */
export function mergeLessons(raw, oldMap, rss = []) {
  const exact = new Map(rss.filter((r) => r.publishedAt).map((r) => [r.id, r.publishedAt.slice(0, 10)]));
  const seen = new Set();
  const out = [];
  raw.forEach((r, index) => {
    if (seen.has(r.id)) return;
    seen.add(r.id);
    const c = classify(r.title, oldMap[r.id]);
    let publishedAt = r.publishedAt ? r.publishedAt.slice(0, 10) : null;
    let dateApprox = Boolean(r.publishedApprox);
    // The day the lesson was taught (in its title) is what people look for; the upload day comes next.
    if (c.dateGregorian) { publishedAt = c.dateGregorian; dateApprox = false; } else if (exact.has(r.id)) { publishedAt = exact.get(r.id); dateApprox = false; }
    out.push({ index, lesson: { id: r.id, title: r.title, durationSec: r.durationSec, publishedAt, dateApprox, thumb: r.thumb, ...c } });
  });
  out.sort((a, b) => {
    const x = a.lesson.publishedAt; const y = b.lesson.publishedAt;
    if (x !== y) { if (!x) return 1; if (!y) return -1; return x < y ? 1 : -1; }
    return a.index - b.index;
  });
  return out.map((o) => o.lesson);
}

/** Never replace a good data file with an empty or clearly truncated one. */
export function shouldWrite(newCount, oldCount) {
  return newCount > 0 && newCount >= oldCount - 5;
}

/**
 * Why this refresh must not be written, or null when it is safe.
 * Blocks: unreadable category playlists, lost lessons, or a drop in categorised lessons.
 */
export function refreshProblem({ lessons, previous = [], failedPlaylists = [] }) {
  if (failedPlaylists.length) return `${failedPlaylists.length} category playlist(s) could not be read: ${failedPlaylists.join(', ')}`;
  if (!shouldWrite(lessons.length, previous.length)) return `got ${lessons.length} lessons, the current file has ${previous.length}`;
  const mapped = (list) => list.filter((l) => l.source === 'map').length;
  if (previous.length && mapped(lessons) < mapped(previous) * 0.98) {
    return `categorised lessons dropped from ${mapped(previous)} to ${mapped(lessons)}`;
  }
  return null;
}
