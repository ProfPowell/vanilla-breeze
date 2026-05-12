/**
 * feed-render.js
 *
 * Progressively enhances an Atom feed XML document into a styled
 * HTML page when viewed in a browser. Feed readers ignore this
 * script entirely — they parse the raw XML as normal.
 *
 * Technique: embed an XHTML-namespaced <script> in the Atom feed.
 * The browser executes it; the script reads the XML DOM, builds
 * an HTML document, and swaps it in.
 *
 * Based on Jake Archibald's approach:
 * https://jakearchibald.com/2025/making-xml-human-readable-without-xslt/
 *
 * @license MIT
 */

(function () {
  'use strict';

  const XHTML_NS = 'http://www.w3.org/1999/xhtml';
  const ATOM_NS  = 'http://www.w3.org/2005/Atom';

  /* ── Helpers ────────────────────────────────────────── */

  /** Read text content from an Atom-namespaced child element. */
  const atomText = (parent, tag) =>
    parent.getElementsByTagNameNS(ATOM_NS, tag)[0]?.textContent?.trim() ?? '';

  /** Read href from an Atom <link> with a given rel (default: "alternate"). */
  const atomLink = (parent, rel = 'alternate') => {
    const links = parent.getElementsByTagNameNS(ATOM_NS, 'link');
    for (const link of links) {
      if ((link.getAttribute('rel') || 'alternate') === rel) {
        return link.getAttribute('href') ?? '';
      }
    }
    return '';
  };

  /** Format an ISO date string for humans. */
  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  /** Safely escape text for insertion into HTML. */
  const esc = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;');

  /** Tagged template for HTML — escapes interpolated values. */
  const html = (strings, ...values) =>
    strings.reduce((out, str, i) =>
      out + str + (i < values.length ? esc(String(values[i])) : ''), '');

  /* ── Data extraction ───────────────────────────────── */

  const feed = document.documentElement;

  const feedData = {
    title:    atomText(feed, 'title'),
    subtitle: atomText(feed, 'subtitle'),
    siteUrl:  atomLink(feed),
    feedUrl:  atomLink(feed, 'self'),
    updated:  atomText(feed, 'updated'),
    icon:     atomText(feed, 'icon'),
    author:   atomText(feed.getElementsByTagNameNS(ATOM_NS, 'author')[0] || feed, 'name'),
  };

  const entries = [...feed.getElementsByTagNameNS(ATOM_NS, 'entry')].map(entry => {
    const contentEl = entry.getElementsByTagNameNS(ATOM_NS, 'content')[0];
    const contentType = contentEl?.getAttribute('type') ?? 'text';
    const rawContent  = contentEl?.textContent?.trim() ?? '';

    return {
      title:     atomText(entry, 'title'),
      link:      atomLink(entry),
      id:        atomText(entry, 'id'),
      published: atomText(entry, 'published'),
      updated:   atomText(entry, 'updated'),
      summary:   atomText(entry, 'summary'),
      category:  entry.getElementsByTagNameNS(ATOM_NS, 'category')[0]?.getAttribute('label') ?? '',
      content:   contentType === 'html' ? rawContent : esc(rawContent),
    };
  });

  /* ── Render ────────────────────────────────────────── */

  const entryHTML = (entry) => `
    <article class="feed-entry">
      <header>
        ${entry.category ? `<span class="feed-badge">${esc(entry.category)}</span>` : ''}
        <h2><a href="${esc(entry.link)}">${esc(entry.title)}</a></h2>
        <time datetime="${esc(entry.published)}">${formatDate(entry.published)}</time>
      </header>
      ${entry.summary ? `<p class="feed-summary">${esc(entry.summary)}</p>` : ''}
      ${entry.content ? `<div class="feed-content">${entry.content}</div>` : ''}
    </article>`;

  const pageHTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(feedData.title)}</title>
  <link rel="stylesheet" href="feed.css" />
</head>
<body>
  <main class="feed-page">
    <header class="feed-header">
      <div class="feed-notice">
        <strong>This is a web feed</strong> (also known as an RSS/Atom feed).
        <strong>Subscribe</strong> by copying the URL into your feed reader.
        <a href="https://aboutfeeds.com/" target="_blank" rel="noopener">Learn about feeds</a>
      </div>
      <h1>${esc(feedData.title)}</h1>
      ${feedData.subtitle ? `<p class="feed-subtitle">${esc(feedData.subtitle)}</p>` : ''}
      <nav class="feed-meta">
        ${feedData.siteUrl ? `<a href="${esc(feedData.siteUrl)}">Visit site →</a>` : ''}
        <span class="feed-updated">Updated ${formatDate(feedData.updated)}</span>
      </nav>
    </header>

    <div class="feed-entries">
      ${entries.map(entryHTML).join('\n')}
    </div>

    <footer class="feed-footer">
      <p>
        Feed URL:
        <code class="feed-url">${esc(feedData.feedUrl || location.href)}</code>
      </p>
    </footer>
  </main>
</body>
</html>`;

  /* ── Swap XML → HTML ───────────────────────────────── */

  const htmlDoc = new DOMParser().parseFromString(pageHTML, 'text/html');
  const newRoot = document.importNode(htmlDoc.documentElement, true);

  // Replace the XML root with the HTML root
  document.replaceChild(newRoot, document.documentElement);

  // Fix the document type if possible
  if (!document.doctype) {
    const doctype = document.implementation.createDocumentType('html', '', '');
    document.insertBefore(doctype, document.documentElement);
  }
})();
