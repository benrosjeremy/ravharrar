import config from '../config.js';
import { setLang, initialLang, currentLang, onLangChange, t } from './i18n.js';
import { onRoute, parseHash, leaveLessonAction } from './router.js';
import { loadState } from './store.js';
import { initPlayer, play, setMode, isOpen } from './player.js';
import { renderHome } from './views/home.js';
import { renderLibrary } from './views/library.js';
import { renderGemara } from './views/gemara.js';
import { renderParasha, renderTopics } from './views/parasha.js';
import { renderAccessibility } from './views/accessibility.js';
import { initA11y } from './a11y.js';

const VIEWS = { home: renderHome, library: renderLibrary, gemara: renderGemara, parasha: renderParasha, topics: renderTopics, accessibility: renderAccessibility };
const main = document.getElementById('main');
let lessons = [];
let byId = new Map();
let backgroundHash = '#/';   // the page under the player overlay
let renderedHash = null;
let openedInApp = false;     // lesson overlay opened from a page of this site (vs. a shared link)

function applyStaticText() {
  document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
  document.querySelectorAll('[data-i18n-label]').forEach((n) => { n.setAttribute('aria-label', t(n.dataset.i18nLabel)); });
  document.title = `${t('site.title')} · ${t('site.rav')}`;
  const langBtn = document.getElementById('lang-toggle');
  langBtn.textContent = t('lang.switch');
  langBtn.lang = currentLang() === 'he' ? 'fr' : 'he';
  langBtn.setAttribute('aria-label', t('lang.switchLabel'));
  document.getElementById('theme-toggle').setAttribute('aria-label', t('theme.toggle'));
  document.querySelector('.skip').textContent = currentLang() === 'he' ? 'דילוג לתוכן' : 'Aller au contenu';
}

function renderView(hash) {
  const route = parseHash(hash);
  const view = VIEWS[route.name] ?? renderHome;
  const state = loadState();
  // A view that rewrites its own URL (library search) reports it, so language switches and
  // closing the player come back to the same filtered page.
  const onUrlChange = (h) => { backgroundHash = h; renderedHash = h; };
  view(main, { lessons, byId, parts: route.parts, params: route.params, state, watched: new Set(state.watched), onUrlChange });
  renderedHash = hash;
  document.querySelectorAll('.nav a').forEach((a) => {
    if (a.dataset.route === (VIEWS[route.name] ? route.name : 'home')) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function handleRoute(route) {
  if (!lessons.length) return;
  if (route.name === 'lesson') {
    const lesson = byId.get(route.parts[0]);
    openedInApp = renderedHash !== null;
    if (renderedHash === null) renderView(backgroundHash);
    if (lesson) play(lesson, { mode: 'full' });
    else location.replace('#/');
    return;
  }
  backgroundHash = location.hash || '#/';
  if (isOpen()) setMode('mini');
  if (renderedHash !== backgroundHash) {
    renderView(backgroundHash);
    if (route.name !== 'gemara' || !route.parts[1]) window.scrollTo({ top: 0 });
    main.focus({ preventScroll: true });
  }
}

function minimize() {
  // Leave the lesson route without adding history, so Back never reopens a closed lesson.
  if (parseHash(location.hash).name !== 'lesson') return;
  if (leaveLessonAction(openedInApp) === 'back') history.back();
  else location.replace(backgroundHash);
  openedInApp = false;
}

function initTheme() {
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('rh.theme', root.dataset.theme); } catch { /* not remembered */ }
  });
}

function initLinks() {
  document.getElementById('link-youtube').href = config.youtubeUrl;
  document.getElementById('link-facebook').href = config.facebookUrl;
  if (config.whatsappUrl) {
    document.getElementById('link-whatsapp').href = config.whatsappUrl;
    document.getElementById('whatsapp-item').hidden = false;
  }
}

function measureMasthead() {
  const h = document.querySelector('.masthead').offsetHeight;
  document.documentElement.style.setProperty('--masthead-h', `${h}px`);
}

async function start() {
  initTheme();
  initA11y();
  initLinks();
  initPlayer({ minimize });
  // Any element with data-play opens that lesson.
  document.addEventListener('click', (e) => {
    const id = e.target.closest('[data-play]')?.dataset.play;
    if (id) { e.preventDefault(); location.hash = `#/lesson/${id}`; }
  });
  // High-res thumbnail missing on YouTube: fall back to the standard one.
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName === 'IMG' && img.dataset.fallback && img.src !== img.dataset.fallback) img.src = img.dataset.fallback;
  }, true);
  // YouTube answers a missing high-res thumbnail with a 120px grey placeholder instead of an error.
  document.addEventListener('load', (e) => {
    const img = e.target;
    if (img.tagName === 'IMG' && img.dataset.fallback && img.naturalWidth <= 120 && img.src !== img.dataset.fallback) img.src = img.dataset.fallback;
  }, true);
  document.getElementById('lang-toggle').addEventListener('click', () => setLang(currentLang() === 'he' ? 'fr' : 'he'));
  onLangChange(() => {
    applyStaticText();
    measureMasthead();
    if (lessons.length) { renderedHash = null; renderView(backgroundHash); }
  });

  await setLang(initialLang());
  measureMasthead();
  addEventListener('resize', measureMasthead);

  try {
    const res = await fetch('data/videos.json');
    if (!res.ok) throw new Error(String(res.status));
    lessons = await res.json();
    byId = new Map(lessons.map((l) => [l.id, l]));
  } catch {
    main.innerHTML = `<div class="view wrap"><p class="error" role="alert">${t('error.data')}</p></div>`;
    return;
  }
  onRoute(handleRoute);
}

start();
