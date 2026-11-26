import { CATEGORIES, DAF_COUNTS } from './taxonomy.js';

/** Lowercase, strip accents/niqqud, unify quotes, collapse whitespace. */
export function normalizeTitle(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[’‘`´]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
// Word boundary that also works for Hebrew letters.
const word = (alias) => `(?<![\\p{L}\\p{N}])${esc(normalizeTitle(alias))}(?![\\p{L}])`;

const byLongestAlias = (series) =>
  CATEGORIES.filter((c) => c.series === series)
    .flatMap((c) => c.aliases.map((a) => ({ slug: c.slug, alias: normalizeTitle(a) })))
    .sort((x, y) => y.alias.length - x.alias.length);

const GEMARA_ALIASES = byLongestAlias('gemara');
const PARASHA_ALIASES = byLongestAlias('parasha');
const CHAG_ALIASES = byLongestAlias('chag');

const PARASHA_MARKER = /(?<![\p{L}])(?:paracha|parasha|parashat|parachat|parashah|parachah|פרשת|פרשיות|פרשה)(?:\s+(?:de|du|de la|:|-))?\s+/gu;

function findGemara(t) {
  for (const { slug, alias } of GEMARA_ALIASES) {
    const m = t.match(new RegExp(`${word(alias)}\\s*(?:daf\\s*)?(\\d{1,3})\\s?([ab])(?![\\p{L}])`, 'u'));
    if (!m) continue;
    const n = Number(m[1]);
    if (n >= 2 && n <= DAF_COUNTS[slug]) return { masechet: slug, daf: `${n}${m[2]}` };
    return { invalid: true };
  }
  return null;
}

function findParasha(t) {
  for (const marker of t.matchAll(PARASHA_MARKER)) {
    const rest = t.slice(marker.index + marker[0].length);
    for (const { slug, alias } of PARASHA_ALIASES) {
      if (new RegExp(`^${word(alias)}`, 'u').test(rest)) return slug;
    }
  }
  return null;
}

function findChag(t) {
  for (const { slug, alias } of CHAG_ALIASES) {
    if (new RegExp(word(alias), 'u').test(t)) return slug;
  }
  return null;
}

const MONTHS = {
  janvier: 1, january: 1, fevrier: 2, february: 2, mars: 3, march: 3, avril: 4, april: 4,
  mai: 5, may: 5, juin: 6, june: 6, juillet: 7, july: 7, aout: 8, august: 8,
  septembre: 9, september: 9, octobre: 10, october: 10, novembre: 11, november: 11, decembre: 12, december: 12,
};
const MONTH_RE = Object.keys(MONTHS).join('|');

function iso(y, m, d) {
  if (y < 100) y += 2000;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function findGregorian(t) {
  let m = t.match(new RegExp(`(?<!\\d)(\\d{1,2})(?:er)?\\s+(${MONTH_RE})\\s+(\\d{4})`));
  if (m) return iso(+m[3], MONTHS[m[2]], +m[1]);
  m = t.match(new RegExp(`(${MONTH_RE})\\s+(\\d{1,2}),?\\s+(\\d{4})`));
  if (m) return iso(+m[3], MONTHS[m[1]], +m[2]);
  m = t.match(/(?<!\d)(\d{1,2})[/.](\d{1,2})[/.](\d{2}|\d{4})(?!\d)/);
  if (m) return iso(+m[3], +m[2], +m[1]);
  return null;
}

const HEBREW_MONTHS = 'tichri|tishri|tishrei|marcheshvan|hechvan|heshvan|cheshvan|kislev|tevet|teveth|chevat|shevat|adar(?:\\s+(?:i{1,2}|1|2|alef|bet|beth))?|nissan|nisan|iyar|iyyar|sivan|tamouz|tammuz|tamuz|av|eloul|elul';

function findHebrewDate(title) {
  const m = String(title ?? '').match(new RegExp(`(?<!\\d)(\\d{1,2})\\s+(${HEBREW_MONTHS})\\s+(5\\d{3})`, 'i'));
  return m ? `${m[1]} ${m[2].replace(/\s+/g, ' ')} ${m[3]}` : null;
}

/**
 * @param {string} title
 * @returns {{series:'gemara'|'parasha'|'chag'|'other', masechet:string|null, daf:string|null, parasha:string|null, chag:string|null, dateGregorian:string|null, dateHebrew:string|null}}
 */
export function parseTitle(title) {
  const t = normalizeTitle(title);
  const out = { series: 'other', masechet: null, daf: null, parasha: null, chag: null, dateGregorian: findGregorian(t), dateHebrew: findHebrewDate(title) };
  if (!t) return out;

  const g = findGemara(t);
  if (g?.invalid) return out; // a daf outside the tractate: unsure, so unclassified
  if (g) return { ...out, series: 'gemara', ...g };

  const p = findParasha(t);
  if (p) return { ...out, series: 'parasha', parasha: p };

  const c = findChag(t);
  if (c) return { ...out, series: 'chag', chag: c };

  return out;
}
