import { categoryBySlug } from '../scripts/lib/taxonomy.js';

/** Lowercase, no accents or niqqud, single spaces. */
export function normalize(s) {
  return String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

const haystacks = new WeakMap();
function haystack(lesson) {
  let h = haystacks.get(lesson);
  if (!h) {
    const names = (lesson.categories ?? []).map(categoryBySlug).filter(Boolean).flatMap((c) => [c.fr, c.he]);
    h = normalize([lesson.title, ...names, lesson.daf ?? ''].join(' '));
    haystacks.set(lesson, h);
  }
  return h;
}

/**
 * @param {Array<object>} lessons
 * @param {{text?:string, series?:string, category?:string, year?:number}} q
 */
export function filterLessons(lessons, q = {}) {
  const words = normalize(q.text).split(' ').filter(Boolean);
  const year = q.year ? String(q.year) : null;
  return lessons.filter((l) =>
    (!q.series || l.series === q.series)
    && (!q.category || l.categories?.includes(q.category))
    && (!year || l.publishedAt?.startsWith(year))
    && (words.length === 0 || words.every((w) => haystack(l).includes(w))));
}

/** Years with at least one lesson, newest first. */
export function yearsOf(lessons) {
  return [...new Set(lessons.map((l) => Number(l.publishedAt?.slice(0, 4))).filter(Boolean))].sort((a, b) => b - a);
}
