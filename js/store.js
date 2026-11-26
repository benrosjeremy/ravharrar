// Per-visitor memory: last lesson + position, and watched lessons. Lives only in this browser.
// Every access is guarded: with storage blocked the site works, it just does not remember.

const KEY = 'rh.state';
const defaultStorage = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };
const empty = () => ({ last: null, watched: [] });

/** @returns {{last:{id:string, position:number}|null, watched:string[]}} */
export function loadState(storage = defaultStorage()) {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return empty();
    const s = JSON.parse(raw);
    return {
      last: s.last && typeof s.last.id === 'string' ? { id: s.last.id, position: Number(s.last.position) || 0 } : null,
      watched: Array.isArray(s.watched) ? s.watched.filter((x) => typeof x === 'string') : [],
    };
  } catch {
    return empty();
  }
}

function write(state, storage) {
  try { storage?.setItem(KEY, JSON.stringify(state)); } catch { /* blocked or full: forget silently */ }
}

export function saveProgress(id, position, storage = defaultStorage()) {
  const s = loadState(storage);
  write({ ...s, last: { id, position: Math.floor(position) } }, storage);
}

export function markWatched(id, storage = defaultStorage()) {
  const s = loadState(storage);
  if (!s.watched.includes(id)) write({ ...s, watched: [...s.watched, id] }, storage);
}
