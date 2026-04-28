import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * author-index: Author-grouped view of site content.
 *
 * Reads pages.json (data-lens-src) and groups by `author`. Renders an
 * accordion of authors with their pages listed underneath. Light-DOM
 * fallback markup is preserved if no source is provided (or fetch fails).
 *
 * @attr {string} data-lens-src   URL to pages.json (or compatible)
 * @attr {string} src             Same — accepted alias for ergonomics
 * @attr {string} placeholder     Search placeholder (default "Filter authors…")
 * @attr {string} sort            "alpha" (default) | "count"
 *
 * @example
 *   <author-index data-lens-src="/pages.json"></author-index>
 */
class AuthorIndex extends VBElement {
  setup() {
    const src = this.getAttribute('data-lens-src') || this.getAttribute('src');
    if (src) {
      this.#loadFromSrc(src).catch(() => { /* keep light-DOM fallback */ });
    } else {
      this.#enhance();
    }
  }

  async #loadFromSrc(src) {
    let payload;
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`status ${res.status}`);
      payload = await res.json();
    } catch (err) {
      this.#renderError(`Could not load ${src}: ${err.message}`);
      return;
    }

    const pages = Array.isArray(payload) ? payload : (payload.pages || []);
    this.#renderFromData(pages);
    this.#enhance();
  }

  #renderFromData(pages) {
    const groups = new Map();
    for (const p of pages) {
      const author = p.author?.trim() || 'Unknown';
      if (!groups.has(author)) groups.set(author, []);
      groups.get(author).push(p);
    }

    const sortMode = this.getAttribute('sort') || 'alpha';
    const entries = [...groups.entries()].sort(([a, ap], [b, bp]) => {
      if (sortMode === 'count') return bp.length - ap.length;
      return a.localeCompare(b);
    });

    const html = [`<h2 class="author-index-heading">Authors <small>(${entries.length})</small></h2>`];
    for (const [author, items] of entries) {
      const sample = items[0];
      const slug = author.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      html.push(`<details data-author-group id="author-${slug}">`);
      html.push(`<summary><span class="author-name">${escapeHtml(author)}</span><span class="author-count" aria-label="${items.length} ${items.length === 1 ? 'page' : 'pages'}">(${items.length})</span></summary>`);
      if (sample.authorUrl) {
        html.push(`<p class="author-link"><a href="${escapeAttr(sample.authorUrl)}" rel="author">View ${escapeHtml(author)}'s profile</a></p>`);
      }
      html.push(`<ul class="author-pages">`);
      for (const it of items) {
        const sub = [
          it.modified ? `<time datetime="${escapeAttr(it.modified)}">${escapeHtml(it.modified)}</time>` : '',
          it.provenance ? `<span class="author-prov" data-provenance="${escapeAttr(it.provenance)}">${escapeHtml(it.provenance)}</span>` : '',
          it.signed ? `<span class="author-signed" title="Cryptographically signed">signed</span>` : ''
        ].filter(Boolean).join(' · ');
        html.push(`<li><a href="${escapeAttr(it.url)}">${escapeHtml(it.title || it.url)}</a>${sub ? `<small>${sub}</small>` : ''}</li>`);
      }
      html.push(`</ul></details>`);
    }
    this.innerHTML = html.join('\n');
  }

  #renderError(message) {
    /* Don't blow away light-DOM fallback if it exists */
    if (this.children.length > 0) return;
    const p = document.createElement('p');
    p.setAttribute('data-author-index-error', '');
    p.textContent = message;
    this.append(p);
  }

  #enhance() {
    /* Search filter */
    if (!this.querySelector('[data-author-index-search]')) {
      const placeholder = this.getAttribute('placeholder') || 'Filter authors…';
      const input = document.createElement('input');
      input.type = 'search';
      input.placeholder = placeholder;
      input.setAttribute('data-author-index-search', '');
      input.setAttribute('aria-label', placeholder);
      input.addEventListener('input', () => this.#filter(input.value));
      this.prepend(input);
    }
  }

  #filter(query) {
    const q = query.trim().toLowerCase();
    for (const group of this.querySelectorAll('[data-author-group]')) {
      const haystack = group.textContent.toLowerCase();
      group.hidden = q && !haystack.includes(q);
    }
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
}
function escapeAttr(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

registerComponent('author-index', AuthorIndex);

export { AuthorIndex };
