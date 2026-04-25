import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * popularity-index: Aggregated "most-visited" lens.
 *
 * Fetches a JSON document expected to contain `{ pages: [{ url, title, views }] }`
 * from `data-lens-src`. The default endpoint is `/api/analytics/popular` —
 * not yet implemented in VB; the component degrades to a friendly message
 * when the endpoint is unavailable, returns 5xx, or returns an empty list.
 *
 * Order of preference for each entry's metadata: response payload → matching
 * record in `data-meta-src` (typically pages.json) → endpoint URL.
 *
 * @attr {string} data-lens-src   URL to the popularity endpoint
 *                                (default "/api/analytics/popular")
 * @attr {string} data-meta-src   Optional URL to pages.json — used to enrich
 *                                title/topic/provenance when the endpoint
 *                                returns sparse data
 * @attr {number} limit           Max entries shown (default 10)
 * @attr {string} window          Optional time-window query forwarded to
 *                                the endpoint (e.g. "24h", "7d", "30d")
 *
 * @example
 *   <popularity-index limit="10" window="7d"></popularity-index>
 */
class PopularityIndex extends VBElement {
  setup() {
    this.#load().catch(() => { /* error rendered by loader */ });
  }

  async #load() {
    const lensSrc = this.getAttribute('data-lens-src') || '/api/analytics/popular';
    const win = this.getAttribute('window');
    const url = new URL(lensSrc, document.baseURI);
    if (win) url.searchParams.set('window', win);

    let payload = null;
    try {
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) throw new Error(`status ${res.status}`);
      payload = await res.json();
    } catch (err) {
      this.#renderUnavailable(err.message);
      return;
    }

    const pages = Array.isArray(payload?.pages)
      ? payload.pages
      : Array.isArray(payload)
        ? payload
        : [];

    if (!pages.length) {
      this.#renderEmpty();
      return;
    }

    /* Optional metadata enrichment from pages.json */
    const metaSrc = this.getAttribute('data-meta-src');
    let metaIndex = null;
    if (metaSrc) {
      try {
        const res = await fetch(metaSrc, { credentials: 'omit' });
        if (res.ok) {
          const m = await res.json();
          const list = Array.isArray(m) ? m : (m?.pages || []);
          metaIndex = new Map(list.map((p) => [p.url, p]));
        }
      } catch { /* enrichment is optional */ }
    }

    this.#renderList(pages, metaIndex);
  }

  #renderList(pages, metaIndex) {
    const limit = parseInt(this.getAttribute('limit') || '10', 10) || 10;
    const items = pages.slice(0, limit);

    const parts = ['<h2 class="popularity-heading">Most visited</h2>'];
    parts.push('<ol class="popularity-list">');
    for (const p of items) {
      const meta = metaIndex?.get(p.url) || {};
      const title = p.title || meta.title || p.url;
      const views = formatViews(p.views ?? p.count ?? 0);
      const provenance = meta.provenance ? `<span class="popularity-prov" data-provenance="${escapeAttr(meta.provenance)}">${escapeHtml(meta.provenance)}</span>` : '';
      parts.push(`<li><a href="${escapeAttr(p.url)}">${escapeHtml(title)}</a><small>${views} views${provenance ? ` · ${provenance}` : ''}</small></li>`);
    }
    parts.push('</ol>');
    this.innerHTML = parts.join('\n');
  }

  #renderUnavailable(message) {
    this.innerHTML = `
      <h2 class="popularity-heading">Most visited</h2>
      <p class="popularity-empty">Popularity data is unavailable right now${message ? ` (${escapeHtml(message)})` : ''}.</p>
    `;
  }

  #renderEmpty() {
    this.innerHTML = `
      <h2 class="popularity-heading">Most visited</h2>
      <p class="popularity-empty">Not enough data yet to surface most-visited pages.</p>
    `;
  }
}

function formatViews(n) {
  const num = Number(n) || 0;
  if (num >= 10000) return `${Math.round(num / 1000)}k`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
}
function escapeAttr(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

registerComponent('popularity-index', PopularityIndex);

export { PopularityIndex };
