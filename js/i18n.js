// UI language: French (default) or Hebrew (RTL). Pure helpers are exported for tests.

export const LANGS = ['fr', 'he'];
export const dirFor = (lang) => (lang === 'he' ? 'rtl' : 'ltr');

/** @param {Record<string,string>} dict */
export function translate(dict, key, vars = {}) {
  const s = dict?.[key];
  if (s == null) return key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת'];

/** 58 -> "נח" (daf numbering as printed on a gemara page). */
export function hebrewNumeral(n) {
  let out = HUNDREDS[Math.floor(n / 100)] ?? '';
  const rest = n % 100;
  if (rest === 15) return `${out}טו`;
  if (rest === 16) return `${out}טז`;
  out += TENS[Math.floor(rest / 10)] + ONES[rest % 10];
  return out;
}

let lang = 'fr';
let dict = {};
const listeners = new Set();

export const currentLang = () => lang;
export const t = (key, vars) => translate(dict, key, vars);
export const onLangChange = (fn) => listeners.add(fn);

/** Load a language file, set <html lang dir>, notify views. */
export async function setLang(next) {
  lang = LANGS.includes(next) ? next : 'fr';
  const res = await fetch(`i18n/${lang}.json`);
  dict = await res.json();
  document.documentElement.lang = lang;
  document.documentElement.dir = dirFor(lang);
  try { localStorage.setItem('rh.lang', lang); } catch { /* storage blocked: language is not remembered */ }
  listeners.forEach((fn) => fn(lang));
}

export function initialLang() {
  try { const saved = localStorage.getItem('rh.lang'); if (LANGS.includes(saved)) return saved; } catch { /* ignore */ }
  return (navigator.language || '').startsWith('he') ? 'he' : 'fr';
}

/** Name of a category in the current UI language. */
export const catName = (cat) => (cat ? (lang === 'he' ? cat.he : cat.fr) : '');
