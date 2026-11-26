import { CATEGORIES } from '../../scripts/lib/taxonomy.js';
import { t, currentLang } from '../i18n.js';
import { esc } from '../ui.js';

const PARASHOT = CATEGORIES.filter((c) => c.series === 'parasha');
// Index where each of the five books starts in the 48-section cycle.
const BOOKS = [[0, 12], [12, 22], [22, 29], [29, 38], [38, 48]];
const BOOK_HE = ['בראשית', 'שמות', 'ויקרא', 'במדבר', 'דברים'];

const countIn = (lessons, slug) => lessons.reduce((n, l) => n + (l.categories?.includes(slug) ? 1 : 0), 0);

export function renderParasha(root, { lessons }) {
  root.innerHTML = `<div class="view wrap">
    <div class="page-head"><h1>${esc(t('parasha.title'))}</h1><p>${esc(t('parasha.intro'))}</p></div>
    <div class="books">
      ${BOOKS.map(([from, to], b) => `<section class="book" aria-labelledby="book-${b}">
        <h2 id="book-${b}"><span>${esc(t(`parasha.book.${b + 1}`))}</span>${currentLang() === 'he' ? '' : `<span lang="he">${BOOK_HE[b]}</span>`}</h2>
        ${PARASHOT.slice(from, to).map((p) => {
    const n = countIn(lessons, p.slug);
    return `<a class="parasha${n ? '' : ' parasha--empty'}" href="#/library?cat=${p.slug}">
          <span class="parasha__names"><span class="parasha__he" lang="he">${esc(p.he)}</span>${currentLang() === 'he' ? '' : `<span class="parasha__fr">${esc(p.fr)}</span>`}</span>
          <span class="parasha__n">${n}</span></a>`;
  }).join('')}
      </section>`).join('')}
    </div>
  </div>`;
}

export function renderTopics(root, { lessons }) {
  const tiles = (cats) => `<div class="topic-grid">${cats.map((c) => {
    const n = countIn(lessons, c.slug);
    const main = currentLang() === 'he' ? c.he : c.fr;
    const sub = currentLang() === 'he' ? c.fr : c.he;
    return `<a class="topic" href="#/library?cat=${c.slug}"><span><strong>${esc(main)}</strong><small>${esc(sub)}</small></span><span class="parasha__n">${n}</span></a>`;
  }).join('')}</div>`;
  const by = (series, kind) => CATEGORIES.filter((c) => c.series === series && (!kind || c.kind === kind));

  root.innerHTML = `<div class="view wrap">
    <div class="page-head"><h1>${esc(t('topics.title'))}</h1></div>
    <section class="section"><h2>${esc(t('topics.chag'))}</h2>${tiles(by('chag'))}</section>
    <section class="section"><h2>${esc(t('topics.other'))}</h2>${tiles(by('other'))}</section>
    <section class="section"><h2>${esc(t('topics.hebrew'))}</h2>${tiles([...by('hebrew', 'chag'), ...by('hebrew', 'other')])}
      <h3 class="eyebrow">${esc(t('nav.parasha'))}</h3>${tiles(by('hebrew', 'parasha'))}</section>
  </div>`;
}
