// One persistent YouTube player. "full" = overlay on #/lesson/<id>; "mini" = docked card while browsing.
// The IFrame API is loaded only on the first play, from the privacy-enhanced host.
import { saveProgress, markWatched, loadState } from './store.js';
import { t } from './i18n.js';
import { categoryBySlug } from '../scripts/lib/taxonomy.js';
import { catName } from './i18n.js';
import { displayTitle } from './title.js';
import { trapTarget } from './a11y.js';

const el = (id) => document.getElementById(id);
let yt = null;            // YT.Player
let apiReady = null;      // Promise
let current = null;       // lesson
let timer = null;
let onMinimize = () => {};

let playerReady = null;   // Promise<YT.Player>, resolved on the player's onReady

function loadApi() {
  if (apiReady) return apiReady;
  apiReady = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { apiReady = null; reject(new Error('YouTube player timed out')); }, 15000);
    window.onYouTubeIframeAPIReady = () => { clearTimeout(timeout); resolve(window.YT); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => { clearTimeout(timeout); apiReady = null; reject(new Error('YouTube player could not load')); };
    document.head.append(s);
  });
  return apiReady;
}

/** Create the one player (first call) and resolve once it can take commands. */
function ensurePlayer(YT, videoId, start) {
  if (playerReady) return { ready: playerReady, created: false };
  playerReady = new Promise((resolve) => {
    yt = new YT.Player('yt-player', {
      host: 'https://www.youtube-nocookie.com',
      videoId,
      playerVars: { start, autoplay: 1, rel: 0, playsinline: 1, modestbranding: 1 },
      events: {
        onReady: () => resolve(yt),
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.ENDED && current) markWatched(current.id);
          if (e.data === YT.PlayerState.PAUSED) tick();
        },
      },
    });
  });
  return { ready: playerReady, created: true };
}

function showFallback(lesson) {
  el('yt-player').outerHTML = `<div id="yt-player" class="player__fallback"><a class="btn" href="https://www.youtube.com/watch?v=${encodeURIComponent(lesson.id)}" target="_blank" rel="noopener">${t('action.openYoutube')}</a></div>`;
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

// The full player is a modal dialog: the page behind it is inert, focus stays inside,
// and focus goes back where it was when the dialog closes.
const BEHIND = () => document.querySelectorAll('body > .skip, body > .masthead, body > main, body > .footer');
let returnFocus = null;

function setModal(on) {
  const p = el('player');
  const was = p.getAttribute('aria-modal') === 'true';
  if (on) { p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); }
  else { p.removeAttribute('role'); p.removeAttribute('aria-modal'); }
  BEHIND().forEach((n) => { n.inert = on; });
  if (on && !was) {
    const a = document.activeElement;
    returnFocus = a && a !== document.body && !p.contains(a) ? a : null;
  }
  if (!on && was) {
    const target = returnFocus?.isConnected ? returnFocus : document.getElementById('main');
    returnFocus = null;
    target?.focus({ preventScroll: true });
  }
}

export function setMode(mode) {
  const p = el('player');
  p.dataset.mode = mode;
  document.body.classList.toggle('has-mini', mode === 'mini' && !p.hidden);
  el('player-toggle').setAttribute('aria-label', t(mode === 'mini' ? 'action.expand' : 'action.close'));
  setModal(mode === 'full' && !p.hidden);
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
  let YT;
  try {
    YT = await loadApi();
  } catch {
    // Player script blocked (offline, extension): send people to YouTube instead.
    if (!yt) showFallback(lesson);
    return;
  }
  const { ready, created } = ensurePlayer(YT, lesson.id, start);
  await ready;
  if (current?.id !== lesson.id) return; // a newer play() took over while we waited
  if (!created) yt.loadVideoById({ videoId: lesson.id, startSeconds: start });
  clearInterval(timer);
  timer = setInterval(tick, 5000);
}

export function close() {
  tick();
  clearInterval(timer);
  try { yt?.stopVideo(); } catch { /* ignore */ }
  el('player').hidden = true;
  document.body.classList.remove('has-mini');
  setModal(false);
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
    const full = isOpen() && el('player').dataset.mode === 'full';
    if (e.key === 'Escape' && full) onMinimize();
    if (e.key === 'Tab' && full) {
      const items = [...el('player').querySelectorAll('.player__box iframe, .player__box a[href], .player__box button')]
        .filter((n) => !n.disabled && n.getClientRects().length);
      const i = trapTarget(items.length, items.indexOf(document.activeElement), e.shiftKey);
      if (i !== null) { e.preventDefault(); items[i].focus(); }
    }
  });
  window.addEventListener('pagehide', tick);
}
