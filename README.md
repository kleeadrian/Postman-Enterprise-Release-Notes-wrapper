# Postman Enterprise Release Notes — Wrapper

A simple wrapper around the Postman Enterprise release notes JSON feed
(`https://dl.pstmn.io/api/version/notes?channel=enterprise`), rendered as a
readable web page instead of raw JSON.

That's all it is — a lightweight viewer. It does not add, edit, or host any
release-notes content of its own; every version and every note comes straight
from Postman's feed at request time.

## What it does

- Fetches the enterprise release-notes JSON on load.
- Renders each version's markdown into a Postman-style layout: sidebar of
  versions with search, main pane with version, date, and formatted notes.
- Deep-links each version via URL hash (e.g. `#12.28.0`).
- Light and dark theme toggle, following your OS preference by default.

## Hosted version

Deployed on GitHub Pages:
<https://kleeadrian.github.io/Postman-Enterprise-Release-Notes-wrapper/>

The upstream JSON endpoint does not send CORS headers, so a browser can't fetch
it directly. To make it work on Pages (which is static-only), a GitHub Action
fetches the feed every 6 hours and commits it as `notes.json`; the app reads
that file when running on Pages.

## Run it locally

Locally, `app.js` talks to a tiny zero-dependency Node proxy that fetches the
live feed on each request — so you always see the latest data without waiting
for CI.

```
node server.js
# open http://localhost:3000
```

Requires Node.js. No `npm install` step — nothing to install.

## Files

- [`index.html`](index.html) — markup and topbar.
- [`styles.css`](styles.css) — layout, typography, light/dark palettes.
- [`app.js`](app.js) — fetch, markdown render (via `marked` + `DOMPurify` from
  a CDN), sidebar, search, deep links, theme toggle. Chooses `/api/notes` on
  localhost and `./notes.json` in production.
- [`server.js`](server.js) — static file server + `/api/notes` proxy for local
  dev.
- [`notes.json`](notes.json) — snapshot of the upstream feed, refreshed by CI.
- [`.github/workflows/refresh-notes.yml`](.github/workflows/refresh-notes.yml)
  — scheduled workflow that keeps `notes.json` up to date.

## Not affiliated with Postman

This is an unofficial community wrapper for personal readability. All release
content is the property of Postman, Inc. If Postman publishes an official
enterprise release-notes page, use that instead.
