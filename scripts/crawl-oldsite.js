// One-time: read which YouTube playlist backs each category page of the old Wix site.
// Usage: node --use-system-ca scripts/crawl-oldsite.js   -> writes data/oldsite-playlists.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { CATEGORIES } from './lib/taxonomy.js';
import { crawlOldSitePlaylists } from './lib/oldsite.js';

const out = new URL('../data/oldsite-playlists.json', import.meta.url);
console.log(`Reading ${CATEGORIES.length} old category pages...`);
const bySlug = await crawlOldSitePlaylists(CATEGORIES);
const missing = Object.entries(bySlug).filter(([, p]) => p.length === 0).map(([s]) => s);
mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
writeFileSync(out, `${JSON.stringify(bySlug, null, 1)}\n`);
console.log(`Done. ${CATEGORIES.length - missing.length} categories have a playlist; without: ${missing.join(', ') || 'none'}`);
