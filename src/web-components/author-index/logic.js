import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * author-index: Author-grouped view of site content.
 *
 * Reads pages.json (data-lens-src) and groups by `author`. Renders an
 * accordion of authors with their pages listed underneath. Light-DOM
 * fallback markup is preserved — and still gets the filter — when no source
 * is given or the fetch fails.
 *
 * @attr {string} data-lens-src   URL to pages.json (or compatible)
 * @attr {string} src             Same — accepted alias for ergonomics
 * @attr {string} placeholder     Search placeholder (default "Filter authors…")
 * @attr {string} sort            "alpha" (default) | "count"
 * @attr {number} heading-level   Level of the generated "Authors" heading, 1-6 (default 2)
 *
 * @example
 *   <author-index data-lens-src="/pages.json"></author-index>
 */

/**
 * Pure: fold a string for comparison (NFKD, strip combining marks, lowercase).
 * @param {string} s
 * @returns {string}
 */
function fold(s) {
  return String(s ?? '').normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase();
}

/**
 * Pure: slug for an author name. Keeps letters and digits of any script
 * (so "李" stays meaningful), strips diacritics ("Zoë" → "zoe"), and falls
 * back to "author" when nothing usable is left.
 * @param {string} name
 * @returns {string}
 */
export function slugify(name) {
  return fold(name).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'author';
}

/**
 * Unique slug, suffixing -2, -3, … on collision with `used` or with
 * anything `isTaken` reports (e.g. ids elsewhere in the document).
 * @param {string} name
 * @param {Set<string>} used
 * @param {(slug: string) => boolean} [isTaken]
 * @returns {string}
 */
export function uniqueSlug(name, used, isTaken = () => false) {
  const base = slugify(name);
  let slug = base;
  for (let n = 2; used.has(slug) || isTaken(slug); n++) slug = `${base}-${n}`;
  used.add(slug);
  return slug;
}

/**
 * Pure: return the href if it is http(s) or relative, else null
 * (drops javascript:, data:, vbscript:, …).
 * @param {unknown} raw
 * @returns {string | null}
 */
export function safeHref(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  try {
    const { protocol } = new URL(s, 'https://author-index.invalid/');
    return protocol === 'http:' || protocol === 'https:' ? s : null;
  } catch {
    return null;
  }
}

/** Pure: clamp a heading-level attribute to 1-6 (default 2). @param {string | null} v */
function headingLevel(v) {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isInteger(n) ? Math.min(6, Math.max(1, n)) : 2;
}

/** Text a group is matched against: visible text only, folded. @param {Element} group */
function searchText(group) {
  const clone = /** @type {Element} */ (group.cloneNode(true));
  clone.querySelectorAll('.visually-hidden, [aria-hidden="true"]').forEach((n) => n.remove());
  return fold(clone.textContent || '');
}

class AuthorIndex extends VBElement {
  /** @type {AbortController | null} */
  #abort = null;

  setup() {
    // Already rendered / enhanced (e.g. the element was moved): re-wire the
    // filter without refetching or rebuilding.
    if (this.querySelector(':scope > [data-author-index-search]')) {
      this.#enhance();
      return;
    }
    const src = this.getAttribute('data-lens-src') || this.getAttribute('src');
    if (src) {
      this.#abort = new AbortController();
      this.#loadFromSrc(src, this.#abort.signal);
    } else {
      this.#enhance();
    }
  }

  teardown() {
    this.#abort?.abort();
    this.#abort = null;
  }

  /**
   * @param {string} src
   * @param {AbortSignal} signal
   */
  async #loadFromSrc(src, signal) {
    let pages;
    try {
      const res = await fetch(src, { signal });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const payload = await res.json();
      pages = Array.isArray(payload) ? payload : (payload?.pages || []);
      if (!Array.isArray(pages)) throw new Error('no pages array');
    } catch (err) {
      if (signal.aborted) return; // torn down mid-flight; the next setup() refetches
      // Authored fallback markup stays and still gets the filter.
      if (this.children.length > 0) this.#enhance();
      else this.#renderError(`Could not load ${src}: ${err instanceof Error ? err.message : err}`);
      return;
    }
    if (signal.aborted) return;
    this.#renderFromData(pages);
    this.#enhance();
  }

  /** @param {any[]} pages */
  #renderFromData(pages) {
    const groups = new Map();
    for (const p of pages) {
      if (!p || typeof p !== 'object') continue;
      const author = (typeof p.author === 'string' && p.author.trim()) || 'Unknown';
      if (!groups.has(author)) groups.set(author, []);
      groups.get(author).push(p);
    }

    const sortMode = this.getAttribute('sort') === 'count' ? 'count' : 'alpha';
    const entries = [...groups.entries()].sort(([a, ap], [b, bp]) => {
      if (sortMode === 'count' && bp.length !== ap.length) return bp.length - ap.length;
      return a.localeCompare(b);
    });

    const level = headingLevel(this.getAttribute('heading-level'));
    const used = new Set();
    // Another author-index (or anything else) on the page may already use
    // the id; our own soon-replaced children don't count.
    const isTaken = (slug) => {
      const el = document.getElementById(`author-${slug}`);
      return !!el && !this.contains(el);
    };
    const html = [`<h${level} class="author-index-heading">Authors <small>(${entries.length})</small></h${level}>`];
    for (const [author, items] of entries) {
      const sample = items[0];
      const slug = uniqueSlug(author, used, isTaken);
      const countText = `${items.length} ${items.length === 1 ? 'page' : 'pages'}`;
      html.push(`<details data-author-group id="author-${escapeAttr(slug)}">`);
      html.push(`<summary><span class="author-name">${escapeHtml(author)}</span><span class="author-count"><span aria-hidden="true">(${items.length})</span><span class="visually-hidden">, ${countText}</span></span></summary>`);
      const profile = safeHref(sample.authorUrl);
      if (profile) {
        html.push(`<p class="author-link"><a href="${escapeAttr(profile)}" rel="author">View ${escapeHtml(author)}'s profile</a></p>`);
      }
      html.push(`<ul class="author-pages">`);
      for (const it of items) {
        const sub = [
          it.modified ? `<time datetime="${escapeAttr(it.modified)}">${escapeHtml(it.modified)}</time>` : '',
          it.provenance ? `<span class="author-prov" data-provenance="${escapeAttr(it.provenance)}">${escapeHtml(it.provenance)}</span>` : '',
          it.signed ? `<span class="author-signed" title="Cryptographically signed">signed</span>` : ''
        ].filter(Boolean).join(' · ');
        const href = safeHref(it.url);
        const label = escapeHtml(it.title || it.url || 'Untitled');
        const link = href ? `<a href="${escapeAttr(href)}">${label}</a>` : `<span>${label}</span>`;
        html.push(`<li>${link}${sub ? `<small>${sub}</small>` : ''}</li>`);
      }
      html.push(`</ul></details>`);
    }
    this.innerHTML = html.join('\n');
  }

  /** @param {string} message */
  #renderError(message) {
    const p = document.createElement('p');
    p.setAttribute('data-author-index-error', '');
    p.textContent = message;
    this.append(p);
  }

  #enhance() {
    let input = /** @type {HTMLInputElement | null} */ (this.querySelector(':scope > [data-author-index-search]'));
    if (!input) {
      const placeholder = this.getAttribute('placeholder') || 'Filter authors…';
      input = document.createElement('input');
      input.type = 'search';
      input.placeholder = placeholder;
      input.setAttribute('data-author-index-search', '');
      input.setAttribute('aria-label', placeholder);
      this.prepend(input);
    }
    let status = this.querySelector(':scope > [data-author-index-status]');
    if (!status) {
      // Polite live region: result counts are announced; it is only visible
      // when nothing matches.
      status = document.createElement('p');
      status.setAttribute('data-author-index-status', '');
      status.setAttribute('role', 'status');
      status.className = 'visually-hidden';
      input.after(status);
    }
    const field = input;
    this.listen(field, 'input', () => this.#filter(field.value));
  }

  /** @param {string} query */
  #filter(query) {
    const q = fold(query.trim());
    const groups = /** @type {HTMLElement[]} */ ([...this.querySelectorAll('[data-author-group]')]);
    let shown = 0;
    for (const group of groups) {
      group.hidden = !!q && !searchText(group).includes(q);
      if (!group.hidden) shown++;
    }
    const status = this.querySelector(':scope > [data-author-index-status]');
    if (!status) return;
    const total = groups.length;
    const noun = (n) => (n === 1 ? 'author' : 'authors');
    if (!q) status.textContent = `Showing all ${total} ${noun(total)}`;
    else if (shown === 0) status.textContent = `No authors match “${query.trim()}”`;
    else status.textContent = `${shown} of ${total} ${noun(total)} match “${query.trim()}”`;
    status.classList.toggle('visually-hidden', !(q && shown === 0));
    status.toggleAttribute('data-empty', !!q && shown === 0);
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
