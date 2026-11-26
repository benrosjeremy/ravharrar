// Accessibility: the reader's display preferences (toolbar) and the focus trap for the full player.
// Our own small toolbar, no third-party script: nothing is loaded or tracked.

const KEY = 'rh.a11y';
export const SCALES = [1, 1.15, 1.3, 1.5];
export const FEATURES = ['contrast', 'links', 'still', 'readable'];
export const DEFAULT_PREFS = Object.freeze({ size: 0, contrast: false, links: false, still: false, readable: false });

/** Index to move focus to when Tab would leave a dialog of `count` controls, or null to let the browser move it. */
export function trapTarget(count, index, shift) {
  if (!count) return null;
  if (index < 0) return shift ? count - 1 : 0;
  if (!shift && index === count - 1) return 0;
  if (shift && index === 0) return count - 1;
  return null;
}

export function normalizePrefs(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const size = Number.isInteger(r.size) ? Math.min(SCALES.length - 1, Math.max(0, r.size)) : 0;
  const out = { ...DEFAULT_PREFS, size };
  for (const f of FEATURES) out[f] = r[f] === true;
  return out;
}

export const prefsClasses = (p) => FEATURES.filter((f) => p[f]).map((f) => `a11y-${f}`);

export function loadPrefs(storage = globalThis.localStorage) {
  try { return normalizePrefs(JSON.parse(storage.getItem(KEY))); } catch { return { ...DEFAULT_PREFS }; }
}

export function savePrefs(prefs, storage = globalThis.localStorage) {
  try { storage.setItem(KEY, JSON.stringify(prefs)); } catch { /* not remembered */ }
}

export function applyPrefs(p, root = document.documentElement) {
  for (const f of FEATURES) root.classList.toggle(`a11y-${f}`, p[f]);
  root.style.fontSize = p.size ? `${SCALES[p.size] * 100}%` : '';
}

/** Wire the toolbar in the masthead. */
export function initA11y() {
  const toggle = document.getElementById('a11y-toggle');
  const panel = document.getElementById('a11y-panel');
  let prefs = loadPrefs();

  const sync = () => {
    applyPrefs(prefs);
    savePrefs(prefs);
    panel.querySelectorAll('[data-a11y]').forEach((b) => b.setAttribute('aria-pressed', String(prefs[b.dataset.a11y])));
    document.getElementById('a11y-size').textContent = `${Math.round(SCALES[prefs.size] * 100)}%`;
    panel.querySelector('[data-size="-1"]').disabled = prefs.size === 0;
    panel.querySelector('[data-size="1"]').disabled = prefs.size === SCALES.length - 1;
  };
  const open = (on, { focus = true } = {}) => {
    panel.hidden = !on;
    toggle.setAttribute('aria-expanded', String(on));
    if (on && focus) panel.querySelector('button')?.focus();
    else if (!on && focus) toggle.focus();
  };

  toggle.addEventListener('click', () => open(panel.hidden));
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button, a');
    if (!b) return;
    if (b.dataset.a11y) prefs = { ...prefs, [b.dataset.a11y]: !prefs[b.dataset.a11y] };
    else if (b.dataset.size) prefs = normalizePrefs({ ...prefs, size: prefs.size + Number(b.dataset.size) });
    else if (b.dataset.reset !== undefined) prefs = { ...DEFAULT_PREFS };
    else if (b.tagName === 'A') { open(false, { focus: false }); return; }
    sync();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) { e.stopPropagation(); open(false); }
  }, true);
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)) open(false, { focus: false });
  });
  sync();
}
