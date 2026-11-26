// Hash routes: #/  #/library?q=&series=&cat=&year=  #/gemara/<masechet>/<daf>  #/parasha  #/topics  #/lesson/<id>

/** @returns {{name:string, parts:string[], params:Record<string,string>}} */
export function parseHash(hash) {
  const raw = String(hash ?? '').replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const safeDecode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
  const parts = path.split('/').filter(Boolean).map(safeDecode);
  const params = Object.fromEntries(new URLSearchParams(query));
  return { name: parts[0] || 'home', parts: parts.slice(1), params };
}

export function buildHash(name, parts = [], params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
  const p = [name, ...parts.map(encodeURIComponent)].join('/');
  return `#/${name === 'home' ? '' : p}${q ? `?${q}` : ''}`;
}

/** Leaving the lesson overlay: step back if it was opened from a page here, else replace (deep link). */
export const leaveLessonAction = (openedInApp) => (openedInApp ? 'back' : 'replace');

export function onRoute(handler) {
  const run = () => handler(parseHash(location.hash));
  window.addEventListener('hashchange', run);
  run();
}
