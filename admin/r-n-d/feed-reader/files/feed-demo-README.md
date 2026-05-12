# Feed Render Demo

Progressive enhancement of Atom XML feeds into styled HTML pages,
without XSLT. Works today and survives the Chrome XSLT removal
(November 2026).

## How it works

1. `feed.xml` — A standard Atom feed with one addition: an
   XHTML-namespaced `<script>` and `<link>` tag embedded in the feed.
2. `feed-render.js` — Reads the XML DOM, extracts feed data, builds
   an HTML page, and swaps it in.
3. `feed.css` — Styles the rendered page with VB-style custom
   properties and automatic dark mode.

Feed readers ignore the script and stylesheet entirely — they only
parse the standard Atom elements. Browsers execute the script and
render a styled, human-readable page.

## Testing locally

The script must be served from the same origin as the XML file
(browsers enforce this). Use any static server:

```bash
# Python (built-in)
python3 -m http.server 8080

# Node (npx, no install)
npx serve .

# PHP (built-in)
php -S localhost:8080
```

Then open `http://localhost:8080/feed.xml` in your browser.

**Important:** The XML file must be served with a content type of
`application/xml` or `text/xml`. Most static servers do this
automatically for `.xml` files. If you see a download prompt, check
your server's MIME type configuration.

## Atom vs RSS

This demo uses Atom because it has a cleaner namespace model and the
XHTML content type works more predictably. The same technique works
with RSS 2.0 — just adjust the element names in `feed-render.js`
(e.g. `channel` instead of `feed`, `item` instead of `entry`).

## Integration with 11ty

In an Eleventy build, you would:

1. Generate `feed.xml` from a Nunjucks/Liquid template per collection
2. Copy `feed-render.js` and `feed.css` to the output directory
3. Add `<link rel="alternate">` to HTML pages for feed discovery

The 11ty RSS plugin already supports XSL stylesheet references —
the same `stylesheet` config option could point to a JS-based
renderer instead when XSLT is removed.

## What happens without JavaScript?

Raw Atom XML is displayed. This is the same experience feed readers
provide (they parse the XML directly). The JS enhancement is purely
for the "someone clicked a feed link in a browser" use case.
