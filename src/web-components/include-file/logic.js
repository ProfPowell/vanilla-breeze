/**
 * include-file: Load same-origin HTML fragments from URLs
 *
 * Fetches remote HTML and injects it into the element. Progressive enhancement:
 * any existing content is shown as a fallback until the fetch completes.
 *
 * Security model (safe by default):
 * - Same-origin only. `src` is resolved against document.baseURI; only
 *   http(s) URLs on the page's origin load. blob:, data:, javascript:, file:
 *   and other schemes are always refused. Other origins need the explicit
 *   `allow-cross-origin` attribute (and that server's CORS consent). A
 *   same-origin URL that redirects off-origin is refused the same way.
 * - Fetched HTML is sanitized (src/lib/sanitize-html.js) unless the author
 *   sets `trusted`. Nested <include-file>s keep their `src` but lose any
 *   trust attributes, so they stay same-origin + sanitized.
 * - Scripts in the fragment only run with BOTH `trusted` and `allow-scripts`.
 *   `allow-scripts` alone is ignored (with a console warning).
 * - Nesting: an include whose URL already appears in its ancestor
 *   <include-file> chain (A→B→A, or self) is refused, as is nesting deeper
 *   than MAX_DEPTH. Both surface as the normal error state.
 * - Relative URLs inside a fragment resolve against the host page, not the
 *   fragment's URL (the markup is parsed into the host document).
 *
 * @attr {string} src - URL to fetch HTML from (same-origin unless allow-cross-origin)
 * @attr {string} mode - "replace" (default) replaces children, "append" appends, "prepend" prepends. Unknown values act as replace (with a warning)
 * @attr {boolean} lazy - If present, defers loading until element is in viewport (honored on src changes too)
 * @attr {boolean} trusted - Author vouches for the source: skip sanitizing the fetched HTML
 * @attr {boolean} allow-scripts - Re-execute scripts in loaded content. Requires `trusted`
 * @attr {boolean} allow-cross-origin - Permit fetching from another origin (still sanitized unless trusted)
 * @attr {string} data-label-error - Override the error message text (default "Failed to load content")
 *
 * State attributes (set by component):
 * @attr {boolean} data-loading - Present while fetching
 * @attr {boolean} data-loaded - Present after successful load
 * @attr {boolean} data-error - Present if the load fails or is refused
 * aria-busy="true" is set while fetching.
 *
 * @fires include-file:loaded - After successful load. Detail: { src, url, html } (html as inserted — sanitized unless trusted)
 * @fires include-file:error - If the load fails or is refused. Detail: { src, error }
 * @fires include-file:src-changed - When `.src` is set from script. Detail: { src, source: 'property' }
 *
 * @example
 * <include-file src="/partials/header.html">
 *   <p>Loading...</p>
 * </include-file>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { sanitizeToFragment } from '../../lib/sanitize-html.js';

/** Maximum include-file nesting depth before a load is refused. */
const MAX_DEPTH = 10;
const MODES = new Set(['replace', 'append', 'prepend']);
const DEFAULT_ERROR_LABEL = 'Failed to load content';

class IncludeFile extends VBElement {
  #observer;
  #abortController;
  /** @type {string | null} Saved original fallback content (captured once) */
  #fallbackHTML = null;
  #hasLoaded = false;
  /** @type {string | null} `src` attribute value whose content is currently shown */
  #loadedSrc = null;
  /** Resolved absolute URL of the current/last load (used for cycle checks) */
  #url = '';
  /** True between setup() and teardown(); attributeChangedCallback only acts then */
  #active = false;
  /** @type {HTMLElement | null} */
  #errorEl = null;

  setup() {
    const src = this.getAttribute('src');
    if (!src) return false;
    this.#active = true;

    // Capture fallback content once before first load
    if (this.#fallbackHTML === null) {
      this.#fallbackHTML = this.innerHTML;
    }

    // Already showing this src (reconnect / move): don't re-fetch
    if (this.#hasLoaded && this.#loadedSrc === src) return true;

    this.#scheduleLoad(src);
    return true;
  }

  teardown() {
    this.#active = false;
    this.#observer?.disconnect();
    if (this.hasAttribute('data-loading')) {
      this.#abortController?.abort();
      this.removeAttribute('data-loading');
      this.removeAttribute('aria-busy');
    }
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * The current src URL (mirror of the `src` attribute).
   *
   * @returns {string} The src URL, or ''.
   */
  get src() { return this.getAttribute('src') || ''; }

  /**
   * Idempotent .src setter. Triggers a fetch via the attributeChangedCallback
   * path (or on the next connect). Emits include-file:src-changed with
   * source: 'property' so reactive consumers can filter loops.
   */
  set src(value) {
    const next = value == null ? '' : String(value);
    if (this.src === next) return;
    if (next) this.setAttribute('src', next);
    else this.removeAttribute('src');
    this.dispatchEvent(new CustomEvent('include-file:src-changed', {
      detail: { src: next, source: 'property' },
      bubbles: true,
    }));
  }

  static get observedAttributes() {
    return ['src'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name !== 'src' || !newVal || oldVal === newVal) return;
    // Before setup() has run (upgrade, or detached) setup() owns the load
    if (!this.#active) {
      // A connected element that had no src (setup() bailed) gets its first
      // src: run the lifecycle. Deferred a microtask so that during an
      // upgrade — where this callback precedes connectedCallback — the
      // regular connect wins and there is exactly one fetch.
      queueMicrotask(() => {
        if (!this.#active && this.isConnected && this.getAttribute('src')) this._reinit();
      });
      return;
    }
    this.#scheduleLoad(newVal);
  }

  /** @param {string} src */
  #scheduleLoad(src) {
    // Honor lazy on src changes too — not just initial connect
    if (this.hasAttribute('lazy') && !this.#isInViewport()) {
      this.#observeIntersection();
    } else {
      this.#load(src);
    }
  }

  #isInViewport() {
    const rect = this.getBoundingClientRect();
    return rect.top < window.innerHeight + 200 && rect.bottom > -200;
  }

  #observeIntersection() {
    this.#observer?.disconnect();
    this.#observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this.#observer.disconnect();
          const src = this.getAttribute('src');
          if (src) this.#load(src);
        }
      }
    }, { rootMargin: '200px' });

    this.#observer.observe(this);
  }

  // ── Policy ───────────────────────────────────────────────────────

  /**
   * Resolve `src` against the document and apply the origin policy.
   * @param {string} src
   * @returns {string} absolute URL
   */
  #resolve(src) {
    let url;
    try {
      url = new URL(src, document.baseURI);
    } catch {
      throw new Error(`Invalid URL: ${src}`);
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error(`Refused ${url.protocol} URL: only http(s) is allowed`);
    }
    this.#checkOrigin(url.href);
    return url.href;
  }

  /** @param {string} href */
  #checkOrigin(href) {
    if (this.hasAttribute('allow-cross-origin')) return;
    if (new URL(href).origin !== location.origin) {
      throw new Error(`Refused cross-origin URL ${href} (add allow-cross-origin to permit)`);
    }
  }

  /**
   * Refuse cycles (URL already in the ancestor include chain) and runaway depth.
   * @param {string} url
   */
  #checkNesting(url) {
    let depth = 0;
    let anc = this.parentElement?.closest('include-file');
    while (anc) {
      if (#url in anc) {
        depth++;
        if (anc.#url === url) throw new Error(`Refused include cycle: ${url} is already included by an ancestor`);
      }
      anc = anc.parentElement?.closest('include-file');
    }
    if (depth >= MAX_DEPTH) throw new Error(`Refused include: nesting deeper than ${MAX_DEPTH}`);
  }

  #mode() {
    const mode = this.getAttribute('mode') || 'replace';
    if (MODES.has(mode)) return mode;
    console.warn(`<include-file>: unknown mode "${mode}", using "replace"`);
    return 'replace';
  }

  // ── Load ─────────────────────────────────────────────────────────

  /** @param {string} src */
  async #load(src) {
    // Abort any previous request
    this.#abortController?.abort();
    const controller = new AbortController();
    this.#abortController = controller;

    this.#clearError();
    this.setAttribute('data-loading', '');
    this.setAttribute('aria-busy', 'true');
    this.removeAttribute('data-loaded');
    this.removeAttribute('data-error');

    try {
      const url = this.#resolve(src);
      this.#checkNesting(url);
      this.#url = url;

      const response = await fetch(url, { signal: controller.signal });
      // A same-origin URL may redirect elsewhere — apply the policy again
      if (response.url) this.#checkOrigin(response.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const raw = await response.text();
      if (controller.signal.aborted) return;

      const trusted = this.hasAttribute('trusted');
      if (this.hasAttribute('allow-scripts') && !trusted) {
        console.warn('<include-file>: allow-scripts is ignored without trusted');
      }
      const runScripts = trusted && this.hasAttribute('allow-scripts');
      // Parse into an inert fragment so only THIS fragment's nodes are
      // processed — author content and earlier appends are never touched.
      // Sanitized nodes are inserted as-is (never serialised + re-parsed:
      // that round trip is the mXSS vector). Fragment profile: ids, names
      // and safe style attributes are kept for same-origin partials.
      let fragment;
      if (trusted) {
        const tpl = document.createElement('template');
        tpl.innerHTML = raw;
        fragment = tpl.content;
      } else {
        fragment = sanitizeToFragment(raw, { allowIncludeFile: true, keepIds: true, keepStyle: true });
      }
      const holder = document.createElement('template');
      holder.content.append(fragment.cloneNode(true));
      const html = holder.innerHTML;
      const scripts = [...fragment.querySelectorAll('script')];
      if (!runScripts) scripts.forEach((s) => s.remove());

      const mode = this.#mode();
      if (mode === 'replace') this.replaceChildren(fragment);
      else if (mode === 'append') this.append(fragment);
      else this.prepend(fragment);

      // Scripts parsed via innerHTML are inert: swap in fresh copies of
      // this fragment's scripts (only) so they run once
      for (const old of runScripts ? scripts : []) {
        const fresh = document.createElement('script');
        for (const attr of old.attributes) fresh.setAttribute(attr.name, attr.value);
        fresh.textContent = old.textContent;
        old.replaceWith(fresh);
      }

      this.removeAttribute('data-loading');
      this.removeAttribute('aria-busy');
      this.setAttribute('data-loaded', '');
      this.#hasLoaded = true;
      this.#loadedSrc = src;

      this.dispatchEvent(new CustomEvent('include-file:loaded', {
        bubbles: true,
        detail: { src, url, html }
      }));
    } catch (err) {
      if (err.name === 'AbortError' || controller.signal.aborted) return;
      this.#fail(src, err);
    }
  }

  /**
   * @param {string} src
   * @param {Error} err
   */
  #fail(src, err) {
    this.removeAttribute('data-loading');
    this.removeAttribute('aria-busy');
    this.setAttribute('data-error', '');

    // Restore original fallback on a first-load failure in replace mode
    if (this.#mode() === 'replace' && this.#fallbackHTML !== null && !this.#hasLoaded) {
      this.innerHTML = this.#fallbackHTML;
    }

    // Visible, announced error only when nothing else is shown
    if (!this.textContent.trim() && !this.children.length) {
      const p = document.createElement('p');
      p.setAttribute('role', 'alert');
      p.setAttribute('data-include-error', '');
      p.textContent = this.getAttribute('data-label-error') || DEFAULT_ERROR_LABEL;
      this.append(p);
      this.#errorEl = p;
    }

    this.dispatchEvent(new CustomEvent('include-file:error', {
      bubbles: true,
      detail: { src, error: err.message }
    }));
  }

  #clearError() {
    if (this.#errorEl?.parentNode === this) this.#errorEl.remove();
    this.#errorEl = null;
  }

  /** Reload the content from the current src */
  reload() {
    const src = this.getAttribute('src');
    if (src) this.#load(src);
  }
}

registerComponent('include-file', IncludeFile);

export { IncludeFile };
