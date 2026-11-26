import { CATEGORIES, categoryBySlug } from '../../scripts/lib/taxonomy.js';
import { t, catName, currentLang } from '../i18n.js';
import { esc, card, fmtDate, fmtDuration, categoryChips, hqThumb, fallbackThumb, displayTitle } from '../ui.js';
import { coverage } from '../coverage.js';

const PLAY_ICON = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg>';

function rail(id, title, href, lessons, watched) {
  if (!lessons.length) return '';
  return `<section class="rail" aria-labelledby="rail-${id}">
    <div class="rail__head">
      <h2 id="rail-${id}">${esc(title)}</h2>
      <a class="link-more" href="${href}">${esc(t('home.seeAll'))}</a>
      <div class="rail__nav">
        <button type="button" class="rail__btn" data-rail="${id}" data-step="-1" aria-label="${esc(t('action.prev'))}">${ARROW}</button>
        <button type="button" class="rail__btn rail__btn--next" data-rail="${id}" data-step="1" aria-label="${esc(t('action.next'))}">${ARROW}</button>
      </div>
    </div>
    <div class="rail__track" id="track-${id}">${lessons.map((l) => card(l, watched)).join('')}</div>
  </section>`;
}

function ring(pct) {
  const r = 52; const c = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="10"/>
    <circle class="ring__value" cx="60" cy="60" r="${r}" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - pct / 100)).toFixed(1)}" transform="rotate(-90 60 60)" style="--c:${c.toFixed(1)}"/>
    <text x="60" y="60" text-anchor="middle" dominant-baseline="central" fill="var(--ink)" font-size="24" font-weight="700" font-family="var(--font-display)">${pct}%</text>
  </svg>`;
}

export function renderHome(root, { lessons, byId, state, watched }) {
  const latest = lessons[0];
  const last = state.last?.position >= 60 ? byId.get(state.last.id) : null;
  const of = (series) => lessons.filter((l) => l.series === series);
  const years = lessons.map((l) => Number(l.publishedAt?.slice(0, 4))).filter(Boolean);
  const since = years.length ? Math.min(...years) : '';

  // Tractate being taught now: the one of the latest gemara lesson.
  const nowMasechet = lessons.find((l) => l.masechet)?.masechet;
  const tractate = categoryBySlug(nowMasechet);
  const amudim = tractate ? coverage(lessons, nowMasechet) : [];
  const covered = amudim.filter((a) => a.lessons.length).length;
  const pct = amudim.length ? Math.round((covered / amudim.length) * 100) : 0;
  const tractateLatest = lessons.filter((l) => l.masechet === nowMasechet && l.daf).slice(0, 3);

  // Most-taught topics and holidays, as a quick-pick cloud.
  const topics = CATEGORIES.filter((c) => c.series === 'other' || c.series === 'chag')
    .map((c) => ({ c, n: lessons.reduce((k, l) => k + (l.categories?.includes(c.slug) ? 1 : 0), 0) }))
    .filter((x) => x.n).sort((a, b) => b.n - a.n).slice(0, 12);

  const resumePct = last?.durationSec ? Math.min(100, Math.round((state.last.position / last.durationSec) * 100)) : 0;

  root.innerHTML = `<div class="home">
    ${latest ? `<section class="hero-band" aria-labelledby="hero-title">
      <div class="hero-band__inner">
        <div class="hero-band__text">
          <p class="hero-band__eyebrow"><span class="live-dot" aria-hidden="true"></span>${esc(t('hero.latest'))} · ${esc(fmtDate(latest))}</p>
          <h1 class="hero-band__title" id="hero-title" dir="auto">${esc(displayTitle(latest.title))}</h1>
          <div class="hero-band__meta"><span>${fmtDuration(latest.durationSec)}</span>${categoryChips(latest)}</div>
          <div class="hero-band__actions">
            <button class="btn btn--light" type="button" data-play="${esc(latest.id)}">${PLAY_ICON.replace('28', '20').replace('28', '20')}${esc(t('action.play'))}</button>
            <a class="btn btn--glass" href="#/library">${esc(t('action.allLessons'))}</a>
          </div>
        </div>
        <button class="hero-band__media" type="button" data-play="${esc(latest.id)}" aria-label="${esc(t('action.play'))}">
          <img src="${hqThumb(esc(latest.id))}" data-fallback="${fallbackThumb(esc(latest.id))}" alt="" width="1280" height="720" fetchpriority="high">
          <span class="play-orb">${PLAY_ICON}</span>
        </button>
      </div>
      <dl class="stats">
        <div><dt>${esc(t('home.statLessons'))}</dt><dd data-count="${lessons.length}">${lessons.length.toLocaleString()}</dd></div>
        <div><dt>${esc(t('home.statGemara'))}</dt><dd data-count="${of('gemara').length}">${of('gemara').length.toLocaleString()}</dd></div>
        <div><dt>${esc(t('home.statParasha'))}</dt><dd data-count="${of('parasha').length}">${of('parasha').length.toLocaleString()}</dd></div>
        <div><dt>${esc(t('home.statSince'))}</dt><dd>${since}</dd></div>
      </dl>
    </section>` : ''}

    <div class="view wrap home__body">
      ${last ? `<button class="resume" type="button" data-play="${esc(last.id)}">
        <img src="${esc(last.thumb)}" alt="" width="320" height="180" loading="lazy">
        <span class="resume__text">
          <span class="eyebrow">${esc(t('continue.title'))}</span>
          <span class="resume__title" dir="auto">${esc(displayTitle(last.title))}</span>
          <span class="progress" aria-hidden="true"><span style="inline-size:${resumePct}%"></span></span>
        </span>
        <span class="resume__go">${PLAY_ICON.replace('28', '22').replace('28', '22')}</span>
      </button>` : ''}

      ${tractate ? `<section class="inprogress" aria-labelledby="inprogress-title">
        <a class="inprogress__ring" href="#/gemara/${tractate.slug}" aria-label="${esc(t('home.openBoard'))}">${ring(pct)}</a>
        <div class="inprogress__text">
          <p class="eyebrow">${esc(t('home.inProgress'))}</p>
          <h2 id="inprogress-title"><span lang="he">${esc(tractate.he)}</span>${currentLang() === 'he' ? '' : ` <span class="inprogress__fr">${esc(tractate.fr)}</span>`}</h2>
          <p class="inprogress__lead">${esc(t('home.inProgressLead', { covered, total: amudim.length }))}</p>
          <a class="btn btn--ghost" href="#/gemara/${tractate.slug}">${esc(t('home.openBoard'))}</a>
        </div>
        <ol class="inprogress__list">
          ${tractateLatest.map((l) => `<li><button type="button" data-play="${esc(l.id)}">
            <span class="inprogress__daf">${esc(l.daf)}</span>
            <span class="inprogress__lt" dir="auto">${esc(displayTitle(l.title).replace(/^(guemara|gemara)\s+\S+\s+\S+\s*·?\s*/i, ''))}</span>
            <span class="inprogress__dur">${fmtDuration(l.durationSec)}</span></button></li>`).join('')}
        </ol>
      </section>` : ''}

      ${rail('recent', t('home.recent'), '#/library', lessons.slice(1, 13), watched)}
      ${rail('gemara', t('nav.gemara'), '#/library?series=gemara', of('gemara').slice(0, 12), watched)}
      ${rail('parasha', t('nav.parasha'), '#/parasha', of('parasha').slice(0, 12), watched)}

      ${topics.length ? `<section class="section" aria-labelledby="topics-title">
        <div class="section__head"><h2 id="topics-title">${esc(t('home.topics'))}</h2><a class="link-more" href="#/topics">${esc(t('home.seeAll'))}</a></div>
        <div class="cloud">${topics.map(({ c, n }) => `<a class="cloud__item" href="#/library?cat=${c.slug}">${esc(catName(c))}<span>${n}</span></a>`).join('')}</div>
      </section>` : ''}

      ${rail('hebrew', t('topics.hebrew'), '#/library?series=hebrew', of('hebrew').slice(0, 12), watched)}
    </div>
  </div>`;

  // Rail arrows scroll one screenful, in reading direction.
  root.querySelectorAll('[data-rail]').forEach((b) => b.addEventListener('click', () => {
    const track = root.querySelector(`#track-${b.dataset.rail}`);
    const dir = document.documentElement.dir === 'rtl' ? -1 : 1;
    track.scrollBy({ left: Number(b.dataset.step) * dir * track.clientWidth * 0.9, behavior: 'smooth' });
  }));

  // Count-up on the stats; the final numbers are already in the page for no-motion and thumbnails.
  if (matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    root.querySelectorAll('[data-count]').forEach((dd) => {
      const end = Number(dd.dataset.count); const t0 = performance.now(); const dur = 1100;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur); const eased = 1 - (1 - p) ** 3;
        dd.textContent = Math.round(end * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
}
