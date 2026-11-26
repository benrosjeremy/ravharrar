import { categoryBySlug } from '../../scripts/lib/taxonomy.js';
import { t, catName } from '../i18n.js';
import { esc, card } from '../ui.js';
import { filterLessons, yearsOf } from '../search.js';
import { buildHash } from '../router.js';

const PAGE = 48;
const SERIES = ['parasha', 'gemara', 'chag', 'other', 'hebrew'];

export function renderLibrary(root, { lessons, params, watched, onUrlChange = () => {} }) {
  const q = { text: params.q ?? '', series: params.series ?? '', category: params.cat ?? '', year: params.year ? Number(params.year) : 0 };
  let shown = PAGE;
  const cat = categoryBySlug(q.category);
  const years = yearsOf(lessons);

  root.innerHTML = `<div class="view wrap">
    <div class="page-head">
      ${cat ? `<p class="eyebrow">${esc(t(`series.${cat.series}`))}</p><h1>${esc(catName(cat))}</h1>` : `<h1>${esc(t('nav.library'))}</h1>`}
    </div>
    <div class="filters" role="search">
      <div class="search">
        <label class="sr" for="q" hidden>${esc(t('search.label'))}</label>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M10 4a6 6 0 1 0 3.7 10.7l4.8 4.8 1.4-1.4-4.8-4.8A6 6 0 0 0 10 4Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"/></svg>
        <input id="q" type="search" dir="auto" autocomplete="off" enterkeyhint="search" aria-label="${esc(t('search.label'))}" placeholder="${esc(t('search.placeholder'))}" value="${esc(q.text)}">
      </div>
      <div class="filter-row">
        <button type="button" class="seg" data-series="" aria-pressed="${!q.series}">${esc(t('filter.all'))}</button>
        ${SERIES.map((s) => `<button type="button" class="seg" data-series="${s}" aria-pressed="${q.series === s}">${esc(t(`series.${s}`))}</button>`).join('')}
        <select class="select" id="year" aria-label="${esc(t('filter.year'))}">
          <option value="">${esc(t('filter.anyYear'))}</option>
          ${years.map((y) => `<option value="${y}" ${q.year === y ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
        ${cat ? `<span class="chip active-cat">${esc(catName(cat))}<button type="button" id="clear-cat" aria-label="${esc(t('action.close'))}">×</button></span>` : ''}
        <span class="count" id="count" aria-live="polite"></span>
      </div>
    </div>
    <div id="results"></div>
  </div>`;

  const results = root.querySelector('#results');
  const countEl = root.querySelector('#count');

  const sync = () => {
    const h = buildHash('library', [], { q: q.text, series: q.series, cat: q.category, year: q.year || '' });
    history.replaceState(null, '', h);
    onUrlChange(h);
  };

  const draw = () => {
    const list = filterLessons(lessons, q);
    countEl.textContent = t('search.count', { n: list.length.toLocaleString() });
    if (!list.length) {
      results.innerHTML = `<p class="empty">${esc(t('search.empty', { q: q.text || '…' }))}</p>`;
      return;
    }
    results.innerHTML = `<div class="grid">${list.slice(0, shown).map((l) => card(l, watched)).join('')}</div>
      ${list.length > shown ? `<button type="button" class="btn btn--ghost more" id="more">${esc(t('action.more'))}</button>` : ''}`;
  };

  let debounce;
  root.querySelector('#q').addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { q.text = e.target.value; shown = PAGE; draw(); sync(); }, 120);
  });
  root.querySelectorAll('[data-series]').forEach((b) => b.addEventListener('click', () => {
    q.series = b.dataset.series; shown = PAGE;
    root.querySelectorAll('[data-series]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    draw(); sync();
  }));
  root.querySelector('#year').addEventListener('change', (e) => { q.year = Number(e.target.value) || 0; shown = PAGE; draw(); sync(); });
  root.querySelector('#clear-cat')?.addEventListener('click', () => { location.hash = buildHash('library', [], { q: q.text, series: q.series, year: q.year || '' }); });
  results.addEventListener('click', (e) => {
    if (e.target.id !== 'more') return;
    shown += PAGE; draw();
  });
  draw();
}
