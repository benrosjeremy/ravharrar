// One persistent YouTube player. "full" = overlay on #/lesson/<id>; "mini" = docked card while browsing.
// The IFrame API is loaded only on the first play, from the privacy-enhanced host.
import { saveProgress, markWatched, loadState } from './store.js';
import { t } from './i18n.js';
import { categoryBySlug } from '../scripts/lib/taxonomy.js';
import { catName } from './i18n.js';
import { displayTitle } from './title.js';

const el = (id) => document.getElementById(id);
let yt = null;            // YT.Player
let apiReady = null;      // Promise
let current = null;       // lesson
let timer = null;
let onMinimize = () => {};

function loadApi() {
  if (apiReady) return apiReady;
  apiReady = new Promise((resolve, reject) => {
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => { apiReady = null; reject(new Error('YouTube player could not load')); };
    document.head.append(s);
  });
  return apiReady;
}

function tick() {
  if (!yt || !current || typeof yt.getCurrentTime !== 'function') return;
  const pos = yt.getCurrentTime();
  const dur = yt.getDuration() || current.durationSec || 0;
  if (pos > 5) saveProgress(current.id, pos);
  if (dur && pos / dur >= 0.9) markWatched(current.id);
}

function setMeta(lesson) {
  const cat = categoryBySlug(lesson.categories?.[0]);
  el('player-kicker').textContent = cat ? `${catName(cat)}${lesson.daf && cat.series === 'gemara' ? ` ${lesson.daf}` : ''}` : t('site.rav');
  el('player-title').textContent = displayTitle(lesson.title);
  el('player-title').title = lesson.title;
  el('player-youtube').href = `https://www.youtube.com/watch?v=${lesson.id}`;
  el('player-youtube').setAttribute('aria-label', t('action.openYoutube'));
  el('player-close').setAttribute('aria-label', t('action.close'));
}

export function setMode(mode) {
  const p = el('player');
  p.dataset.mode = mode;
  document.body.classList.toggle('has-mini', mode === 'mini' && !p.hidden);
  el('player-toggle').setAttribute('aria-label', t(mode === 'mini' ? 'action.expand' : 'action.close'));
  if (mode === 'full') el('player-close').focus({ preventScroll: true });
}

/** Open a lesson. startAt: seconds; when omitted, resume from saved position for that lesson. */
export async function play(lesson, { mode = 'full', startAt } = {}) {
  const p = el('player');
  p.hidden = false;
  setMode(mode);
  if (current?.id === lesson.id && yt) return;
  current = lesson;
  setMeta(lesson);
  const saved = loadState().last;
  const start = Math.floor(startAt ?? (saved?.id === lesson.id ? saved.position : 0));
  try {
    const YT = await loadApi();
    if (yt) {
      yt.loadVideoById({ videoId: lesson.id, startSeconds: start });
    } else {
      yt = new YT.Player('yt-player', {
        host: 'https://www.youtube-nocookie.com',
        videoId: lesson.id,
        playerVars: { start, autoplay: 1, rel: 0, playsinline: 1, modestbranding: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED && current) markWatched(current.id);
            if (e.data === YT.PlayerState.PAUSED) tick();
          },
        },
      });
    }
    clearInterval(timer);
    timer = setInterval(tick, 5000);
  } catch {
    // Player blocked (offline, extension): send people to YouTube instead.
    el('yt-player').outerHTML = `<div id="yt-player" class="player__fallback"><a class="btn" href="https://www.youtube.com/watch?v=${lesson.id}" target="_blank" rel="noopener">${t('action.openYoutube')}</a></div>`;
  }
}

export function close() {
  tick();
  clearInterval(timer);
  try { yt?.stopVideo(); } catch { /* ignore */ }
  el('player').hidden = true;
  document.body.classList.remove('has-mini');
  current = null;
}

export const currentLesson = () => current;
export const isOpen = () => !el('player').hidden;

/** Wire the buttons once. minimize(): called when the overlay should become the mini player. */
export function initPlayer({ minimize }) {
  onMinimize = minimize;
  el('player').addEventListener('click', (e) => {
    const action = e.target.closest('[data-player]')?.dataset.player;
    if (!action) return;
    if (action === 'close') { if (el('player').dataset.mode === 'full') onMinimize(); close(); }
    if (action === 'minimize') onMinimize();
    if (action === 'toggle') {
      if (el('player').dataset.mode === 'full') onMinimize();
      else if (current) location.hash = `#/lesson/${current.id}`;
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen() && el('player').dataset.mode === 'full') onMinimize();
  });
  window.addEventListener('pagehide', tick);
}
