import { DAF_COUNTS } from '../scripts/lib/taxonomy.js';

/**
 * Every amud of a tractate (2a ... last b) with the lessons on it.
 * @returns {Array<{daf:string, n:number, amud:'a'|'b', lessons:object[]}>}
 */
export function coverage(lessons, masechet) {
  const last = DAF_COUNTS[masechet];
  if (!last) return [];
  const byDaf = new Map();
  for (const l of lessons) {
    if (l.masechet !== masechet || !l.daf) continue;
    if (!byDaf.has(l.daf)) byDaf.set(l.daf, []);
    byDaf.get(l.daf).push(l);
  }
  const out = [];
  for (let n = 2; n <= last; n++) {
    for (const amud of ['a', 'b']) out.push({ daf: `${n}${amud}`, n, amud, lessons: byDaf.get(`${n}${amud}`) ?? [] });
  }
  return out;
}
