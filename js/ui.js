import { categoryBySlug } from '../scripts/lib/taxonomy.js';
import { t, currentLang, catName } from './i18n.js';
import { displayTitle } from './title.js';

export { displayTitle };

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export function fmtDuration(sec) {
  if (!sec) return '';
  const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60); const s = Math.floor(sec % 60);
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

export function fmtDate(lesson) {
  if (!lesson.publishedAt) return '';
  const d = new Date(`${lesson.publishedAt}T12:00:00Z`);
  const locale = currentLang() === 'he' ? 'he-IL' : 'fr-FR';
  if (lesson.dateApprox) {
    return `${t('lesson.approx')} ${new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d)}`;
  }
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

export const hqThumb = (id) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
export const fallbackThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export function categoryChips(lesson, max = 2) {
  return (lesson.categories ?? []).slice(0, max).map((slug) => {
    const c = categoryBySlug(slug);
    if (!c) return '';
    const label = lesson.daf && c.series === 'gemara' ? `${catName(c)} ${lesson.daf}` : catName(c);
    return `<a class="chip" href="#/library?cat=${encodeURIComponent(slug)}">${esc(label)}</a>`;
  }).join('');
}

/** One lesson card. Titles keep their own direction (dir="auto") inside either UI language. */
export function card(lesson, watched = new Set()) {
  const title = esc(displayTitle(lesson.title));
  return `<article class="card">
    <button class="card__thumb" type="button" data-play="${esc(lesson.id)}" aria-label="${esc(t('action.play'))} : ${title}">
      <img loading="lazy" decoding="async" src="${esc(lesson.thumb)}" alt="" width="320" height="180">
      ${lesson.durationSec ? `<span class="card__duration">${fmtDuration(lesson.durationSec)}</span>` : ''}
      ${watched.has(lesson.id) ? `<span class="card__watched">${esc(t('lesson.watched'))}</span>` : ''}
    </button>
    <h3 class="card__title"><button type="button" data-play="${esc(lesson.id)}" dir="auto" title="${esc(lesson.title)}">${title}</button></h3>
    <div class="card__meta"><span>${esc(fmtDate(lesson))}</span>${categoryChips(lesson)}</div>
  </article>`;
}

export const grid = (lessons, watched) => `<div class="grid">${lessons.map((l) => card(l, watched)).join('')}</div>`;
