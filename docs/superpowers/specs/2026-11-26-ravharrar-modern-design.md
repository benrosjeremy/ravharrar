# ravharrar-modern — Design

Date: 2026-11-26. Status: awaiting approval.

## Intent and why

ravharrar.com is the Torah-lessons site of Rav Yaacov B. Harrar. It is a Wix
site, French primary with a Hebrew version, whose content is a library of
lesson videos that all live on his YouTube channel
(https://www.youtube.com/@ravyaacovb.harrar4468, channel id
`UC3p5ej2DH-8VT2pE24m_UFw`, ~780 subscribers; tabs: Videos, Shorts, Live,
Playlists).

The current site is a flat video wall with a crowded nav (Toutes les videos,
Paracha, Guemara, Fetes, Autres, plus ~54 per-parasha pages), a small
search box, a "Load More" button, and no in-page viewing. The user asked for
the same site, studied and made more modern and interactive, as a new
project. Why: students should find and watch the right lesson faster, and
the site should look like it belongs in 2026.

This is meant to replace the live site, with the Rav's approval (see the
update below). It is a standalone static site that can be hosted anywhere,
with the real channel data.

## Goals

- Real content: every lesson from the YouTube channel, not sample data.
- Instant search and filtering (client side) by series, tractate/daf,
  parasha, holiday, year, and free text. Works on French, English and Hebrew
  titles, ignoring accents and case.
- Watch in page: a player that opens without leaving the site and keeps
  playing while browsing (mini-player). Uses YouTube's privacy-enhanced
  embed (youtube-nocookie.com).
- Hero with the latest lesson and the Rav's name in French and Hebrew.
- Gemara browser that shows progress through a tractate by daf (for example
  Kiddushin 56a, 57a, 57b, 58a ...) so the learner sees what has been
  covered and clicks a daf to its lesson(s).
- Parasha browser: the weekly parasha cycle as a visual grid (Berechit to
  Vezot Haberakha); parashot that have lessons are lit, others dim.
- Continue watching: remember last lesson and position in localStorage.
- Bilingual UI: French default, Hebrew toggle with real RTL layout (logical
  CSS properties, not mirrored hacks). UI strings live in one JSON per
  language. Video titles are shown as published.
- Light and dark theme, follows system, user can override.
- Responsive from 360 px phones up; keyboard accessible; respects
  prefers-reduced-motion; WCAG AA contrast.
- Keep what the old site offered: Facebook and YouTube links
  (https://www.facebook.com/yaacov1 and the channel), WhatsApp contact.

## Non-goals

- No backend, accounts, comments, donations, newsletter.
- No migration of the ravharrar.com domain or DNS; no Wix export.
- No audio-only extraction or downloading of videos.
- No automatic rebuild/deploy pipeline in v1 (a documented command is
  enough; scheduled refresh can come later).

## Anti-goals (failure even if it technically works)

- Generic "religious website" clichés or a template look; it should feel
  designed, calm, scholarly, not flashy.
- Mislabeling: a lesson shown under the wrong tractate/parasha is worse than
  one shown under "Autres/אחר". Unsure means unclassified.
- Slow or heavy: no framework bundle, no autoplaying video on load.
- Breaking on Hebrew: broken RTL, mixed-direction titles rendered scrambled.

## Constraints

- Machine has Node 22 only. No Python, no yt-dlp. A slow corporate machine,
  so keep dependencies minimal.
- Static output: HTML, CSS, ES modules, one `data/videos.json`. No build
  step required to view; any static host works.
- YouTube Data API needs a key the project does not have. The full channel
  list therefore comes from a Node script that reads the channel's public
  pages (the same data the YouTube web app uses, including continuation
  paging), merged with the official RSS feed (latest 15) as a check. This is
  unofficial and can break when YouTube changes; the script must fail loudly
  and leave the existing `videos.json` untouched. If a `YOUTUBE_API_KEY`
  environment variable exists, the script may use the official API instead.
- Titles are inconsistent. Known examples:
  - "Guemara Kidouchine 57b Animal idolâtré 16 novembre 2026 6 Kislev 5787 Rav Yaacov B Harrar"
  - "Gemara Kiddushin 58a: Forbidden Money - November 18, 2026 - 8 Kislev 5787 - Rav Yaacov B. Harrar"
  - "Gemara Kiddushin 57a Tsipor Metsora November 15, 2026 5 Kislev 5787 Rav Yaacov B Harrar"
  So the same tractate appears as Kidouchine/Kiddushin and needs alias tables
  (French transliteration, English transliteration, Hebrew).

## Approaches considered

1. Static site + generated `videos.json` (chosen by the user). Fast, free
   hosting, instant filtering; trade-off: new lessons appear after the
   script is rerun.
2. Live YouTube Data API behind a small server. Always fresh; needs an API
   key, quota handling and a server to hide the key.
3. RSS only. Simplest; only the 15 latest lessons, so no real library.

## Decisions (made with the user)

- Static site with generated data file. French primary, Hebrew toggle.

## Builder's calls already made (not user-confirmed)

- Plain HTML/CSS/vanilla ES modules, no framework, no bundler.
- Title parser lives in one module with a table of tractates and parashot
  (French, English, Hebrew aliases) and is tested with `node --test` against
  real titles pulled from the channel.
- Classification result per video: `series` (gemara | parasha | chag |
  other), plus `masechet`, `daf`, `parasha`, `chag`, `dateGregorian`,
  `dateHebrew` when found. Missing fields stay null.
- The Rav's portrait is not copied from the old site (rights unknown);
  hero uses a typographic monogram, and the user can drop in a photo at
  `assets/rav.jpg`. Thumbnails hotlink YouTube's image CDN.
- Visual direction: warm parchment light theme and deep ink-blue dark
  theme, a serif display face with a Hebrew-capable pairing, generous
  whitespace, subtle motion (card lift, mini-player slide, daf grid
  reveals). Final design pass uses the available design skills.
- Project folder: `ravharrar-modern/` in the session workspace, with its
  own git repo initialised inside it.

## Calls made after the builder check (mine, not user-confirmed)

- UPDATE from the user: the Rav asked for this and approved it, so this is
  a real replacement for the live site, not a showcase. The old site's own
  description lists its topics: parasha, Gemara, Halakha, Prophets, Jewish
  holidays, prayer, the Land of Israel, Teshuva, education and more. So
  `series` also gets topic values (halakha, neviim, tefila, eretz-israel,
  teshuva, chinuch) matched by keywords, with `other` as the fallback.
- WhatsApp: the old site uses a widget, not a plain link, so no number was
  found. It is a single config value (`config.js`) that the user supplies;
  until then the button is hidden. Asset paths are relative so any static
  host works, including a subpath such as GitHub Pages. Hosting target is
  not decided yet and does not block the build.
- The Rav's portrait: with the Rav's approval the old portrait may be used.
  I will not download anything from the old site without the user saying
  so; the user can drop a file at `assets/rav.jpg`, or tell me to fetch it.
  Until then the hero shows a monogram.
- Data layer is the first task and a go/no-go spike: prove the channel
  scrape works from this machine before any UI work. If it is blocked, the
  fallback is the RSS feed (15 lessons) plus an optional `YOUTUBE_API_KEY`
  or a manual list of video ids; the UI is built against the same
  `videos.json` shape either way, and the user is told which data they got.
- Scope of lessons: the Videos tab plus past live streams. Shorts and
  upcoming/in-progress lives are excluded. Playlists are read and used as
  a secondary hint for classification, never to override a confident title
  parse.
- FULL TAXONOMY of the old site, read from its dropdown menus on
  2026-11-26. The new site keeps exactly these categories:
  - Paracha (48 entries, Berechit to Vezot Haberakha; double parashot are
    one entry in French: Vayakel/Pekoude, Tazria/Metsora, Ahare Mot/
    Kedochim, Behar/Behoukotay, Matot/Massei, Nitsavim/Vayelekh. The Hebrew
    version has 48 pages, with Behar and Behukotay separate and no
    Vezot Haberakha.)
  - Guemara (11 tractates): Roch Hachana, Yoma, Beitsa, Soucca, Taanit,
    Meguila, Moed Katane, Haguiga, Erouvine, Ketoubot, Kidouchine.
  - Fetes (10): Roch Hachana, Les 10 jours de Techouva et Yom Kippour,
    Souccot, Hanouka, Pourim, Pessah, Yom Haatsmaout, Yom Yerouchalayim,
    Chavouot, 9 Av. The Hebrew version adds Rosh Chodesh and Yom HaShoah.
  - Autres / Nosseim (14): La priere, Chabbat, Halakha, La Techouva, Erets
    Israel, Education, Pour les adolescents, La delivrance finale,
    Actualites, Hiloula, Libre-Arbitre, Likoutey Moharane, OROT du Rav A. I.
    Hakohen Kook, Cours pour les femmes. The Hebrew "other" adds Sefer
    Yehoshua.
  - Hebrew-language lessons form their own set (parasha, holidays, other).
  These replace the invented topic list above; `series` is one of
  parasha | gemara | chag | other | hebrew, and each lesson carries a
  `category` slug from this list.
- Ground truth: the Rav (or his team) curated these categories by hand on
  Wix, so title parsing alone would drift from them. The data script also
  crawls each old category page and maps video id (visible in the YouTube
  thumbnail URLs on those pages) to its categories. That map wins over title
  parsing; title parsing only fills in lessons the old site never
  categorised. A lesson can belong to more than one category.
- Title-based classification (fallback only), precedence gemara, then
  parasha, then chag; unsure means `other`. A title with both a daf and a parasha name
  (e.g. "Kiddushin 57a Tsipor Metsora") is gemara; the parasha-like words
  are the lesson topic. Double parashot (Vayakhel/Pekudei) are one entry
  matching the old site's grouping. The old site's per-parasha pages are
  used as a spot-check of the classifier, not as source data.
- Gemara progress: reference table with daf counts for the tractates that
  appear in the data (more can be added); a daf is "covered" when at least
  one lesson parses to it, with several lessons per daf listed together;
  an amud outside the tractate's range is treated as a parse error and the
  lesson goes to `other`. A separate local "watched" marker is kept in
  localStorage.
- Hebrew mode translates the UI, tractate names and parasha names (from the
  alias tables). Video titles stay as published and are rendered with
  `dir="auto"` so mixed-direction titles do not scramble.
- Single-page app with hash routing so the mini-player survives navigation.
  The YouTube IFrame API (privacy-enhanced host) is loaded only when the
  user first plays a lesson, to read playback position. Continue-watching
  keeps the last lesson and its position; watched lessons are a set.

## Left to the builder

Exact visual details, file layout, search implementation details, daf-grid
layout, animation choices, and the order of implementation.

## How we will know it works

- `node --test` passes on the title parser, including the real-title cases.
- `videos.json` has the full channel list; the count matches the channel
  Videos tab.
- Browser check at phone and desktop widths in both languages and both
  themes: search, filters, in-page playback, daf grid, continue-watching.
