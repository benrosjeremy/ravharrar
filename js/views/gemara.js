import { CATEGORIES, DAF_COUNTS, categoryBySlug } from '../../scripts/lib/taxonomy.js';
import { t, catName, hebrewNumeral } from '../i18n.js';
import { esc, grid } from '../ui.js';
import { coverage } from '../coverage.js';

const TRACTATES = CATEGORIES.filter((c) => c.series === 'gemara');

export function renderGemara(root, { lessons, parts, watched }) {
  const inTractate = (slug) => lessons.filter((l) => l.categories?.includes(slug) || l.masechet === slug);
  const latestGemara = lessons.find((l) => l.masechet);
  const slug = DAF_COUNTS[parts[0]] ? parts[0] : (latestGemara?.masechet ?? 'kidouchine');
  const cat = categoryBySlug(slug);
  const all = inTractate(slug);
  const amudim = coverage(all, slug);
  const covered = amudim.filter((a) => a.lessons.length).length;
  const selected = parts[1] && amudim.find((a) => a.daf === parts[1]);
  const withoutDaf = all.filter((l) => !l.daf);

  const dafim = [];
  for (let i = 0; i < amudim.length; i += 2) dafim.push([amudim[i], amudim[i + 1]]);

  const amudBtn = (a) => {
    if (!a.lessons.length) return `<span class="amud" title="${a.daf}">${a.amud === 'a' ? '.' : ':'}</span>`;
    const seen = a.lessons.every((l) => watched.has(l.id));
    return `<a class="amud amud--has${seen ? ' amud--watched' : ''}" href="#/gemara/${slug}/${a.daf}"${selected?.daf === a.daf ? ' aria-current="true"' : ''}
      title="${esc(`${cat.fr} ${a.daf} · ${a.lessons.length}`)}" aria-label="${esc(`${catName(cat)} ${a.daf}`)}">${a.amud === 'a' ? '.' : ':'}</a>`;
  };

  root.innerHTML = `<div class="view wrap">
    <div class="page-head">
      <h1>${esc(t('gemara.title'))}</h1>
      <p>${esc(t('gemara.intro'))}</p>
    </div>
    <nav class="tabs" aria-label="${esc(t('gemara.title'))}">
      ${TRACTATES.map((c) => `<a class="tab" href="#/gemara/${c.slug}" ${c.slug === slug ? 'aria-current="page"' : ''}>
        <span class="tab__he" lang="he">${esc(c.he)}</span><span class="tab__fr">${esc(c.fr)}</span>
        <span class="tab__n">${inTractate(c.slug).length}</span></a>`).join('')}
    </nav>
    <section class="section" aria-labelledby="board-title">
      <div class="board-head">
        <h2 id="board-title"><span lang="he">${esc(cat.he)}</span> · ${esc(cat.fr)}</h2>
        <div class="meter"><span class="progress"><span style="inline-size:${Math.round((covered / amudim.length) * 100)}%"></span></span>${esc(t('gemara.covered', { covered, total: amudim.length }))}</div>
      </div>
      <div class="board" lang="he">
        ${dafim.map(([a, b], i) => `<div class="daf" style="--i:${i}"><span class="daf__n">${hebrewNumeral(a.n)}</span>
          <span class="daf__sides">${amudBtn(a)}${amudBtn(b)}</span></div>`).join('')}
      </div>
      <div class="legend"><span><i style="background:var(--accent)"></i>${esc(t('lesson.count', { n: '1+' }))}</span><span><i style="background:var(--gold)"></i>${esc(t('lesson.watched'))}</span><span><i style="background:var(--surface-2)"></i>—</span></div>
    </section>
    <section class="section" id="daf-lessons" aria-live="polite">
      ${selected
    ? `<h2>${esc(t('gemara.lessonsFor', { name: catName(cat), daf: selected.daf }))}</h2>${grid(selected.lessons, watched)}`
    : `<p class="empty">${esc(t('gemara.pickDaf'))}</p>`}
    </section>
    ${withoutDaf.length ? `<section class="section"><h2>${esc(catName(cat))} · ${esc(t('series.other'))}</h2>${grid(withoutDaf.slice(0, 24), watched)}</section>` : ''}
  </div>`;

  if (selected) root.querySelector('#daf-lessons').scrollIntoView({ block: 'nearest' });
}
