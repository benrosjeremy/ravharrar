# ravharrar-modern

The new site for the Torah lessons of Rav Yaacov B. Harrar. It's static, bilingual (French / Hebrew) and has no server: plain HTML, CSS and JavaScript plus one data file, `data/videos.json`.

## Running it locally

```
npm run serve        # http://localhost:5173
npm test             # 60 tests, Node 22
```

## Refreshing the lessons from YouTube

```
npm run build-data
```

The script does four things:
1. Reads every lesson on the channel (videos plus finished live streams; Shorts are excluded).
2. Reads the RSS feed for exact dates.
3. Reads the category playlists (the same playlists that fed the old site, listed in `data/oldsite-playlists.json`).
4. Merges everything and writes `data/videos.json`.

If YouTube blocks the script or returns a list that's too short, it stops with an error and doesn't touch the existing file.

A new lesson appears on the site after `build-data` runs and the site is uploaded again. If the lesson was also added to a category playlist on YouTube, it lands in the right category automatically.

If a category is added on the old site, refresh the playlist list once:

```
npm run crawl-oldsite
```

On a corporate network that intercepts TLS, the scripts already run with `--use-system-ca`.

## Settings

- `config.js`: the WhatsApp link (`whatsappUrl`). The button stays hidden until it is set.
- `assets/rav.jpg`: the Rav's photo. Without it, a monogram is shown.

## Hosting

Upload the whole folder to any static host (GitHub Pages, Netlify, Cloudflare Pages). All paths are relative, so the site also works under a subfolder.

## Structure

| Path | Contents |
|---|---|
| `scripts/lib/taxonomy.js` | The old site's categories (48 parashot, 11 tractates, 10 holidays, 14 topics, the Hebrew section) |
| `scripts/lib/parseTitle.js` | Classification from the title, for lessons outside the playlists |
| `scripts/lib/youtube.js` | Channel, playlists and RSS |
| `scripts/lib/merge.js` | Merging and choosing the date (the date the lesson was given comes first) |
| `js/` | The site: routing, search, player, views |
| `i18n/` | UI strings in French and Hebrew |
