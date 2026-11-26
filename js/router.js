// Hash routes: #/  #/library?q=&series=&cat=&year=  #/gemara/<masechet>/<daf>  #/parasha  #/topics  #/lesson/<id>

/** @returns {{name:string, parts:string[], params:Record<string,string>}} */
export function parseHash(hash) {
  const raw = String(hash ?? '').replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const params = Object.fromEntries(new URLSearchParams(query));
  return { name: parts[0] || 'home', parts: parts.slice(1), params };
}

export function buildHash(name, parts = [], params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
  const p = [name, ...parts.map(encodeURIComponent)].join('/');
  return `#/${name === 'home' ? '' : p}${q ? `?${q}` : ''}`;
}

export function onRoute(handler) {
  const run = () => handler(parseHash(location.hash));
  window.addEventListener('hashchange', run);
  run();
}
