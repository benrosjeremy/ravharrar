import { t } from '../i18n.js';
import { esc, grid, fmtDate, fmtDuration, categoryChips, hqThumb, fallbackThumb, displayTitle } from '../ui.js';

export function renderHome(root, { lessons, byId, state, watched }) {
  const latest = lessons[0];
  // Offer to resume only a lesson actually under way (at least a minute in).
  const last = state.last?.position >= 60 ? byId.get(state.last.id) : null;
  const count = (series) => lessons.filter((l) => l.series === series).length;
  const pct = last?.durationSec ? Math.min(100, Math.round((state.last.position / last.durationSec) * 100)) : 0;
  const mins = Math.floor((state.last?.position ?? 0) / 60);

  root.innerHTML = `<div class="view wrap">
    ${latest ? `<section class="hero" aria-labelledby="hero-title">
      <button class="hero__media" type="button" data-play="${esc(latest.id)}" aria-label="${esc(t('action.play'))}">
        <img src="${hqThumb(latest.id)}" data-fallback="${fallbackThumb(latest.id)}" alt="" width="1280" height="720" fetchpriority="high">
        <span class="play-badge"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>${esc(t('action.play'))}</span>
      </button>
      <div class="hero__text">
        <p class="eyebrow">${esc(t('hero.latest'))}</p>
        <h1 class="hero__title" id="hero-title" dir="auto">${esc(displayTitle(latest.title))}</h1>
        <div class="hero__meta"><span>${esc(fmtDate(latest))}</span><span>${fmtDuration(latest.durationSec)}</span>${categoryChips(latest)}</div>
        <p class="hero__lead">${esc(t('hero.lead', { n: Math.floor(lessons.length / 100) * 100 }))}</p>
        <div class="hero__actions">
          <button class="btn" type="button" data-play="${esc(latest.id)}">${esc(t('action.play'))}</button>
          <a class="btn btn--ghost" href="#/library">${esc(t('action.allLessons'))}</a>
        </div>
      </div>
    </section>` : ''}

    ${last ? `<section class="section" aria-labelledby="resume-title">
      <h2 class="eyebrow" id="resume-title">${esc(t('continue.title'))}</h2>
      <button class="resume" type="button" data-play="${esc(last.id)}">
        <img src="${esc(last.thumb)}" alt="" width="320" height="180" loading="lazy">
        <span class="resume__text">
          <span class="resume__title" dir="auto">${esc(displayTitle(last.title))}</span>
          <span class="progress" aria-hidden="true"><span style="inline-size:${pct}%"></span></span>
          <small>${esc(t('continue.at', { t: `${mins} min` }))}</small>
        </span>
      </button>
    </section>` : ''}

    <section class="section" aria-labelledby="explore-title">
      <h2 class="eyebrow" id="explore-title">${esc(t('home.explore'))}</h2>
      <div class="explore">
        <a href="#/gemara"><span class="explore__he" lang="he">גמרא</span><span class="explore__name">${esc(t('nav.gemara'))}</span><span class="explore__desc">${esc(t('home.gemaraCard'))}</span><span class="explore__count">${esc(t('lesson.count', { n: count('gemara') }))}</span></a>
        <a href="#/parasha"><span class="explore__he" lang="he">פרשה</span><span class="explore__name">${esc(t('nav.parasha'))}</span><span class="explore__desc">${esc(t('home.parashaCard'))}</span><span class="explore__count">${esc(t('lesson.count', { n: count('parasha') }))}</span></a>
        <a href="#/topics"><span class="explore__he" lang="he">מועדים</span><span class="explore__name">${esc(t('nav.topics'))}</span><span class="explore__desc">${esc(t('home.topicsCard'))}</span><span class="explore__count">${esc(t('lesson.count', { n: count('chag') + count('other') + count('hebrew') }))}</span></a>
      </div>
    </section>

    <section class="section" aria-labelledby="recent-title">
      <div class="section__head"><h2 id="recent-title">${esc(t('home.recent'))}</h2><a class="link-more" href="#/library">${esc(t('action.allLessons'))}</a></div>
      ${grid(lessons.slice(1, 13), watched)}
    </section>
  </div>`;
}
