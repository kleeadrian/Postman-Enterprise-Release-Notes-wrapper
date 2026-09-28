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

## Run it locally

The upstream JSON endpoint does not send CORS headers, so the browser can't
fetch it directly from a `file://` page. A tiny zero-dependency Node proxy
handles that.

```
node server.js
# open http://localhost:3000
```

Requires Node.js. No `npm install` step — nothing to install.

## Files

- [`index.html`](index.html) — markup and topbar.
- [`styles.css`](styles.css) — layout, typography, light/dark palettes.
- [`app.js`](app.js) — fetch, markdown render (via `marked` + `DOMPurify` from
  a CDN), sidebar, search, deep links, theme toggle.
- [`server.js`](server.js) — static file server + `/api/notes` proxy to the
  upstream JSON feed.

## Not affiliated with Postman

This is an unofficial community wrapper for personal readability. All release
content is the property of Postman, Inc. If Postman publishes an official
enterprise release-notes page, use that instead.
