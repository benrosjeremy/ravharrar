# ravharrar-modern Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, bilingual (FR/HE) lessons site for Rav Yaacov B. Harrar that lists every lesson from his YouTube channel, keeps the old site's hand-made categories, and plays lessons in page.

**Architecture:** A Node script builds `data/videos.json` from the YouTube channel plus a video-id to category map taken from the old Wix site. The site is plain HTML/CSS/ES modules (no bundler) that loads that file, filters it client side, and plays lessons through a persistent mini-player on a hash-routed single page.

**Tech Stack:** Node 22 (`node --test`, global `fetch`), vanilla ES modules, YouTube IFrame API (loaded on first play, host `www.youtube-nocookie.com`).

**Spec:** `docs/superpowers/specs/2026-11-26-ravharrar-modern-design.md`

## Global Constraints

- Node 22 only; no Python, no yt-dlp, no npm runtime dependencies (dev: none).
- Output is static: HTML, CSS, ES modules, `data/videos.json`; opens from any static host; asset paths relative (works under a subpath).
- Channel id `UC3p5ej2DH-8VT2pE24m_UFw`; RSS `https://www.youtube.com/feeds/videos.xml?channel_id=UC3p5ej2DH-8VT2pE24m_UFw`.
- Lessons = Videos tab + finished live streams. Exclude Shorts and upcoming/in-progress lives.
- `series` is one of `parasha | gemara | chag | other | hebrew`; each lesson has `categories: string[]` of taxonomy slugs; an unsure lesson is `other`, never a guess.
- The old-site category map wins over title parsing; title parsing only fills uncategorised lessons.
- UI languages: French (default) and Hebrew (real RTL via CSS logical properties); video titles shown as published with `dir="auto"`.
- Themes: light and dark, follows system, user override.
- Responsive from 360 px; keyboard accessible; honour `prefers-reduced-motion`; WCAG AA contrast.
- Player host `youtube-nocookie.com`; IFrame API loaded only on first play.
- WhatsApp button hidden until `config.whatsappUrl` is set. Portrait from `assets/rav.jpg` if present, else a monogram. Nothing is downloaded from the old site without the user saying so (the category map is read-only crawling of pages, not downloads of files).
- The data script fails loudly and never overwrites an existing `videos.json` with a smaller or empty result.
- Facebook `https://www.facebook.com/yaacov1`; YouTube `https://www.youtube.com/@ravyaacovb.harrar4468`.
- Do not commit files that contain secrets; `YOUTUBE_API_KEY` is read from the environment only.

## Review Focus

1. A title with no gregorian or Hebrew date, or a daf outside the tractate's range: lesson must land in `other`, not crash and not a wrong tractate (Task 2).
2. Hebrew-only or mixed Hebrew/French title in an RTL page: rendered with `dir="auto"`, not scrambled (Task 6).
3. A lesson in two categories: appears once in "all", and in both category views (Tasks 5, 7).
4. Search with no results or only accents/case differences ("Kidouchine" vs "kidouchine", "Pessah" vs "Pésah"): friendly empty state / still matches (Task 7).
5. `localStorage` unavailable (private mode, blocked): site fully works, only continue-watching is off (Task 8).

## File Structure

```
package.json                 scripts: test, build-data
config.js                    whatsappUrl, channel and social links
scripts/lib/taxonomy.js      the old site's categories (slug, series, fr, he, oldSlug, aliases)
scripts/lib/parseTitle.js    title -> {masechet, daf, parasha, chag, dateGregorian, dateHebrew}
scripts/lib/youtube.js       fetchChannelLessons(), fetchRssLessons()
scripts/lib/oldsite.js       parseOldCategoryHtml(), loads data/oldsite-map.json
scripts/lib/merge.js         mergeLessons(rawLessons, oldMap) -> Lesson[]
scripts/build-data.js        CLI: fetch + merge + write data/videos.json
data/oldsite-map.json        { [videoId]: string[] } category slugs (committed)
data/videos.json             generated Lesson[] (committed)
test/*.test.js               node:test
index.html, css/tokens.css, css/app.css
js/main.js js/router.js js/i18n.js js/store.js js/search.js js/player.js
js/views/{home,library,gemara,parasha}.js
i18n/fr.json, i18n/he.json
assets/                      rav.jpg (optional, user supplied)
README.md                    how to refresh data and host
```

**Lesson shape** (produced by Task 5, consumed by all UI tasks):
`{ id: string, title: string, durationSec: number, publishedAt: string /*ISO*/, thumb: string, series: 'parasha'|'gemara'|'chag'|'other'|'hebrew', categories: string[], masechet: string|null /*slug*/, daf: string|null /*"58a"*/, parasha: string|null /*slug*/, chag: string|null /*slug*/, dateGregorian: string|null /*YYYY-MM-DD*/, dateHebrew: string|null, source: 'map'|'title'|'none' }`

---

### Task 1: Project skeleton and taxonomy

**Files:**
- Create: `package.json`, `.gitignore`, `scripts/lib/taxonomy.js`, `test/taxonomy.test.js`

**Interfaces:**
- Produces: `export const CATEGORIES: Array<{slug: string, series: 'parasha'|'gemara'|'chag'|'other'|'hebrew', fr: string, he: string, oldSlug: string, aliases: string[]}>`, `export const DAF_COUNTS: Record<string, number>` (masechet slug to last daf), `export function categoryBySlug(slug: string)`.

- [ ] **Step 1: Write failing tests** in `test/taxonomy.test.js`: counts per series for French categories: parasha 48, gemara 11, chag 10, other 14 (Hebrew-language entries have `series: 'hebrew'`); every slug unique; `DAF_COUNTS` equals `{roch-hachana-gemara:35, yoma:88, beitsa:40, soucca:56, taanit:31, meguila:32, moed-katane:29, haguiga:27, erouvine:105, ketoubot:112, kidouchine:82}` (dafim start at 2a); `categoryBySlug('kidouchine').aliases` contains `'kiddushin'`.
- [ ] **Step 2: Run** `node --test test/taxonomy.test.js`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement `taxonomy.js`.** `oldSlug` is the old site's path. French entries (exact `oldSlug`): parashot `berechit noah lekh-lekha vayera haye-sarah toldot vayetse vayichlah vayechev mikets vayigach vayehi chemot vaera bo bechalah michpatim yitro terouma tetsave ki-tissa vayakel-pekoude vayikra tsav chemini tazria-metsora ahare-mot-kedochim emor behar-behoukotay bamidbar nasso beaalotekha chelah-lekha korah houkat balak pinhas matot-massei devarim vaethanane ekev reeh choftim ki-tetse ki-tavo nitsavim-vayelekh haazinou vezothaberakha`; gemara `roch-hachana-1` (Roch Hachana tractate; give it the slug `roch-hachana-gemara` so it does not collide with the holiday slug `roch-hachana`), `yoma beitsa guemara-soucca guemara-taanit meguila moedkatane haguiga erouvine ketoubot kidouchine`; chag `roch-hachana yom-kippour souccot hanouka pourim pessah yom-haatsmaout yom-yerouchalayim chavouot 9-av`; other `la-priere chabbat halakha la-techouva erets-israel education cours-pour-les-jeunes gueoula actualites hiloula libre-arbitre likoutey-moharane orot cours-pour-les-femmes`. Hebrew entries (`series: 'hebrew'`) use the old Hebrew page paths: `הילולות likoutey-moharan ספר-יהושע`, chag-like `4db1ce7dbdf8e 4db1ce8dba9a9a 9dbhn9dbhf1bv 9dbarw2c 8dbbfrx 9dbimzv cebti 5dbia5c6ak 8db1aud4dbbb 9dbhn4dbhbc3h` (Rosh Chodesh, Rosh Hashana, Yom Kippur, Sukkot, Hanukkah, Purim, Pesach, Shavuot, Tisha B'Av, Yom HaShoah), and 48 parasha pages (Behar and Behukotay are separate; no Vezot Haberakha) `berechit-hebrew noah-hebrew lekhlekha-hebrew vayera-hebrew hayesarah-hebrew toldot-hebrew vayetse-hebrew vayishlah-hebrew vayeshev-hebrew mikets-hebrew vayigash-hebrew vayehi-hebrew chemot-hebrew vaera-hebrew bo-hebrew beshalah-hebrew yitro-hebrew michpatim-hebrew terouma-hebrew tetsave-hebrew kitissa-hebrew vayakhelpekoude-hebrew vayikra-hebrew tsav-hebrew shemini-hebrew tazriametsorah-hebrew aharemotkedochim-hebrew emor-hebrew behar-hebrew behukotay-hebrew bamidbar-hebrew nasso-hebrew beaalotekha-hebrew chelahlekha-hebrew korah-hebrew hukat-hebrew balak-hebrew pinhas-hebrew matotmassei-hebrew` plus six whose paths are `pebide5dbdtq7c` (Devarim) `pebide4dbjh6ae2d` (Vaethanan) `pebide5db7ap` (Ekev) `pebide4dbi2d` (Reeh) `pebide9dbgdq6a2a` (Shoftim) `pebideeebd4db7bl` (Ki Tetse) `pebideeebd4dbbm6f` (Ki Tavo) `9dbh6aqfi5dbqmj4a9dbidh` (Nitsavim Vayelekh) `pebide4dbhedp6b` (Haazinu). Give each entry a French and Hebrew display name and transliteration aliases (e.g. kidouchine: kiddushin, kidushin, קידושין). Hebrew-series test counts: assert only that every `hebrew` entry has `he` set.
- [ ] **Step 4: Run tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: project skeleton and old-site taxonomy`.

### Task 2: Title parser

**Files:**
- Create: `scripts/lib/parseTitle.js`, `test/parseTitle.test.js`

**Interfaces:**
- Consumes: `CATEGORIES`, `DAF_COUNTS` from Task 1.
- Produces: `export function parseTitle(title: string): { series: 'gemara'|'parasha'|'chag'|'other', masechet: string|null, daf: string|null, parasha: string|null, chag: string|null, dateGregorian: string|null, dateHebrew: string|null }`.

- [ ] **Step 1: Write failing tests** with these real titles:
  - `"Guemara Kidouchine 57b   Animal idolâtré   16 novembre 2026   6 Kislev 5787   Rav Yaacov B  Harrar"` → series gemara, masechet `kidouchine`, daf `57b`, dateGregorian `2026-11-16`, dateHebrew `6 Kislev 5787`.
  - `"Gemara Kiddushin 58a: Forbidden Money - November 18, 2026 - 8 Kislev 5787 - Rav Yaacov B. Harrar"` → gemara, `kidouchine`, `58a`, `2026-11-18`.
  - `"Gemara Kiddushin 57a Tsipor Metsora November 15, 2026 5 Kislev 5787 Rav Yaacov B Harrar"` → gemara (daf beats parasha-like words), parasha null.
  - Review Focus 1: a daf outside range (`"Guemara Kidouchine 99a"`) → series `other`, masechet null; a title with no date → dates null, no throw; empty string → series `other`.
  - A French parasha title and a holiday title (write them from a real fetch in Task 3; until then use `"Paracha Vayetse ..."` and `"Pessah ..."` shaped cases).
- [ ] **Step 2: Run** `node --test test/parseTitle.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement `parseTitle`.** Normalise accents/case/multiple spaces, match masechet aliases then daf `\d{1,3}[ab]` validated against `DAF_COUNTS` (daf number 2..max), then parasha aliases, then chag aliases; French months (`novembre`) and English months both supported for `dateGregorian`; Hebrew date is `\d{1,2} <month> 5\d{3}`.
- [ ] **Step 4: Run tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: title parser`.

### Task 3: YouTube channel fetch (go/no-go spike)

**Files:**
- Create: `scripts/lib/youtube.js`, `test/youtube.test.js`, `test/fixtures/` (saved response snippets)

**Interfaces:**
- Produces: `export async function fetchChannelLessons(opts?: {apiKey?: string}): Promise<RawLesson[]>`, `export async function fetchRssLessons(): Promise<RawLesson[]>`, `export function parseRssXml(xml: string): RawLesson[]`, `export function parseInitialData(html: string): {lessons: RawLesson[], continuation: string|null}`, where `RawLesson = {id, title, durationSec, publishedAt, thumb}`. `publishedAt` is the ISO date when known (RSS, API) or null (web scrape gives only relative text; such lessons are completed from the RSS entry or from `dateGregorian` in the title).

- [ ] **Step 1: Write failing tests** for `parseRssXml` against a saved real RSS fixture (15 entries, ids and titles asserted) and `parseInitialData` against a saved fixture of the channel `/videos` page (video ids, titles, duration `50:42` → 3042 s, continuation token present).
- [ ] **Step 2: Run** `node --test test/youtube.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement.** `fetchChannelLessons` pages through the `/videos` page's initial data and its continuation requests (same public web endpoints the site uses), then repeats for finished live streams (`/streams`); excludes Shorts. If `YOUTUBE_API_KEY` is set use the official uploads-playlist API instead. Send `Accept-Language: en` and a consent cookie if a consent wall appears.
- [ ] **Step 4: Live run** `node -e "import('./scripts/lib/youtube.js').then(async m=>console.log((await m.fetchChannelLessons()).length))"`. **Go/no-go gate:** expected a count near the channel's Videos tab total. If it is blocked or returns about 15, stop and tell the user which fallback applies (RSS only, API key, or manual id list) before starting any UI task.
- [ ] **Step 5: Run tests, commit** `feat: youtube channel fetch`.

### Task 4: Old-site category map (go/no-go spike)

**Files:**
- Create: `scripts/lib/oldsite.js`, `scripts/crawl-oldsite-browser.js`, `test/oldsite.test.js`, `data/oldsite-map.json`

**Interfaces:**
- Consumes: `CATEGORIES[].oldSlug` (Task 1).
- Produces: `export function parseOldCategoryHtml(html: string): string[]` (video ids found as `i.ytimg.com/vi/<id>/`), `export function loadOldMap(path?: string): Record<string, string[]>`; file shape `{ "<videoId>": ["kidouchine", ...] }`.

- [ ] **Step 1: Write failing tests**: `parseOldCategoryHtml` on a small saved snippet returns unique ids in order; `loadOldMap` on a fixture returns the object and throws on invalid JSON.
- [ ] **Step 2: Run** `node --test test/oldsite.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement `oldsite.js`.**
- [ ] **Step 4: Prove the source.** Fetch `https://www.ravharrar.com/kidouchine` with `fetch` and check whether the HTML contains `i.ytimg.com/vi/`. If yes, the crawl is a Node loop over every `oldSlug` (no downloads, politeness delay 500 ms). If not (Wix renders the gallery with JS), write `scripts/crawl-oldsite-browser.js` as a snippet to paste into the page in the in-app browser: it clicks "Load More" until gone, reads the thumbnail ids, and prints `{slug: ids[]}`; run it for each `oldSlug` and combine.
- [ ] **Step 5: Produce `data/oldsite-map.json`** (inverse of the above: id to slugs). Check: Kidouchine category lists the lessons seen on the live site (e.g. `rbKqMCAes8k`, `VdZIBO705D4`, `BRETqQz3-TM`).
- [ ] **Step 6: Run tests, commit** `feat: old site category map`.

### Task 5: Merge and build data

**Files:**
- Create: `scripts/lib/merge.js`, `scripts/build-data.js`, `test/merge.test.js`, `data/videos.json`

**Interfaces:**
- Consumes: `fetchChannelLessons`, `fetchRssLessons` (Task 3), `loadOldMap` (Task 4), `parseTitle` (Task 2), `categoryBySlug` (Task 1).
- Produces: `export function mergeLessons(raw: RawLesson[], oldMap: Record<string,string[]>): Lesson[]` (Lesson shape in File Structure), `npm run build-data` writing `data/videos.json` sorted newest first.

- [ ] **Step 1: Write failing tests**: a lesson in the map gets `source:'map'`, `categories` from the map, `series` from the first category's series; a lesson not in the map gets `source:'title'` and categories from `parseTitle` (masechet → that gemara slug); an unparseable lesson gets `series:'other'`, `source:'none'`, empty categories; a lesson in two map categories keeps both (Review Focus 3); `dateGregorian` fills a missing `publishedAt`.
- [ ] **Step 2: Run** `node --test test/merge.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement `mergeLessons` and `build-data.js`.** The script refuses to write when the new list is empty or smaller than the existing file's list minus 5 (exit code 1, existing file untouched).
- [ ] **Step 4: Run tests, then `npm run build-data`.** Expected: `videos.json` count printed and matches the Task 3 count; print counts per `source`.
- [ ] **Step 5: Commit** `feat: build videos.json`.

### Task 6: Site shell, themes, i18n, routing

**Files:**
- Create: `index.html`, `config.js`, `css/tokens.css`, `css/app.css`, `js/main.js`, `js/router.js`, `js/i18n.js`, `i18n/fr.json`, `i18n/he.json`, `test/i18n.test.js`

**Interfaces:**
- Produces: `export function t(key: string): string`, `export function setLang(lang: 'fr'|'he'): Promise<void>` (sets `document.documentElement.lang` and `dir`), `export function onRoute(handler: (route: {name: string, params: Record<string,string>}) => void): void` with routes `#/`, `#/library?...`, `#/gemara/<masechet>`, `#/parasha`, `#/lesson/<id>`.

- [ ] **Step 1: Write failing test** in `test/i18n.test.js`: `fr.json` and `he.json` have identical key sets; `setLang` is covered by a pure function `dirFor(lang)` returning `'rtl'` for `he`.
- [ ] **Step 2: Run** `node --test test/i18n.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement shell.** Invoke the `artifact-design` skill for visual direction before writing CSS: warm parchment light theme and deep ink-blue dark theme as CSS tokens, a serif display face with a Hebrew-capable pairing, logical properties only (`margin-inline`, `inset-inline-start`), theme toggle, language toggle, top nav (Home, Library, Gemara, Parasha), footer with YouTube, Facebook, WhatsApp (hidden when `config.whatsappUrl` is empty). Lesson titles are always rendered with `dir="auto"`.
- [ ] **Step 4: Run tests; open in the browser at 360 px and 1280 px, FR and HE, light and dark.** Expected: no horizontal scroll, nav usable by keyboard.
- [ ] **Step 5: Commit** `feat: site shell, themes, i18n`.

### Task 7: Library view with search and filters

**Files:**
- Create: `js/search.js`, `js/views/library.js`, `js/views/home.js`, `test/search.test.js`

**Interfaces:**
- Consumes: `Lesson[]` from `data/videos.json`; `t()`.
- Produces: `export function normalize(s: string): string` (lowercase, strip accents/diacritics, collapse spaces), `export function filterLessons(lessons: Lesson[], q: {text?: string, series?: string, category?: string, year?: number}): Lesson[]`.

- [ ] **Step 1: Write failing tests**: `filterLessons(l,{text:'kidouchine'})` matches title `Guemara Kidouchine 57b`; `normalize('Pésah')==='pesah'`; `text:'פרשת'` matches a Hebrew title; empty result returns `[]`; a lesson with two categories is returned once for `series` filter and for each `category` filter (Review Focus 3, 4).
- [ ] **Step 2: Run** `node --test test/search.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement `search.js`**, then the library view (cards with thumbnail, title, duration, date, category chips; series tabs matching the old nav; year filter; incremental "show more"; friendly empty state) and the home view (hero with latest lesson and the Rav's name in French and Hebrew, portrait or monogram, latest 6 lessons).
- [ ] **Step 4: Run tests; verify in browser**: typing "kidouchine" filters instantly; no-result state shows.
- [ ] **Step 5: Commit** `feat: library and home views`.

### Task 8: Player, mini-player, continue watching

**Files:**
- Create: `js/player.js`, `js/store.js`, `test/store.test.js`

**Interfaces:**
- Produces: `export function loadState(storage?: Storage): {last: {id: string, position: number}|null, watched: string[]}`, `export function saveProgress(id: string, position: number, storage?: Storage): void`, `export function markWatched(id: string, storage?: Storage): void`, `export function play(lesson: Lesson, startAt?: number): Promise<void>`.

- [ ] **Step 1: Write failing tests** with an in-memory fake storage: save then load returns position; `markWatched` is idempotent; a storage whose methods throw makes `loadState` return `{last:null, watched:[]}` and the setters not throw (Review Focus 5).
- [ ] **Step 2: Run** `node --test test/store.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement.** `play` loads the IFrame API on first call, opens a large player on `#/lesson/<id>`, and keeps playing in a bottom mini-player when the route changes; position saved every 5 s and on pause; a lesson counts as watched at 90 %. Home shows a "continue watching" card from `loadState`.
- [ ] **Step 4: Run tests; verify in browser**: play a lesson, navigate, mini-player keeps playing, reload and resume offer appears.
- [ ] **Step 5: Commit** `feat: player and continue watching`.

### Task 9: Gemara daf map

**Files:**
- Create: `js/views/gemara.js`, `test/gemara.test.js`

**Interfaces:**
- Consumes: `DAF_COUNTS`, `Lesson[]`.
- Produces: `export function coverage(lessons: Lesson[], masechet: string): Array<{daf: string, lessons: Lesson[]}>` covering `2a` to the tractate's last amud, in order (`a` then `b`), with an empty `lessons` array where nothing exists.

- [ ] **Step 1: Write failing tests**: for `kidouchine` the result starts at `2a`, ends at `82b`; a daf with two lessons returns both; a lesson with daf `99a` is not placed anywhere.
- [ ] **Step 2: Run** `node --test test/gemara.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement `coverage` and the view**: tractate picker (11), grid of dafim, covered dafim lit, click opens the lesson(s), watched marker from the store, reveal animation honouring reduced motion.
- [ ] **Step 4: Run tests; verify in browser** for Kidouchine.
- [ ] **Step 5: Commit** `feat: gemara daf map`.

### Task 10: Parasha, holidays and other categories

**Files:**
- Create: `js/views/parasha.js`

**Interfaces:**
- Consumes: `CATEGORIES`, `Lesson[]`, `t()`.

- [ ] **Step 1: Implement** the parasha grid (48 French entries in order, lit when lessons exist, name in UI language), and holiday and other-topic category pages reusing the library filter with `category` preset; Hebrew-series categories appear under a "Hebrew lessons / שיעורים בעברית" group.
- [ ] **Step 2: Verify in browser**: each of the 48 parasha tiles and a holiday link resolve; counts match `data/videos.json` (script check printed in the console: sum of tile counts equals lessons with a parasha category).
- [ ] **Step 3: Commit** `feat: parasha, holiday and topic views`.

### Task 11: Verify, document, finish

**Files:**
- Create: `README.md`

- [ ] **Step 1: Run** `node --test`. Expected: all pass.
- [ ] **Step 2: Browser check** at 360 px and 1280 px, FR and HE, light and dark: search, filters, player, mini-player, daf map, continue watching, keyboard-only navigation, `prefers-reduced-motion`, no console errors.
- [ ] **Step 3: Write `README.md`**: `npm run build-data` to refresh, how to set `whatsappUrl`, where to drop `assets/rav.jpg`, how to host (any static host; Netlify and GitHub Pages notes), known fragility of the channel scrape.
- [ ] **Step 4: Use superpowers:verification-before-completion**, then commit `docs: readme and final checks`.
- [ ] **Step 5: Tell the user** the project folder lives in a session workspace and offer to move it to a folder of their choice (the long path also needed `git config core.longpaths true`).
