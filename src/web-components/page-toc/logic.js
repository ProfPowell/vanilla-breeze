/**
 * page-toc: Table of contents with scroll-spy
 *
 * Supports two modes:
 * 1. Auto-generated: Scans document for headings and builds ToC (when empty)
 * 2. Manual markup: Enhances existing nav with scroll-spy (progressive enhancement)
 *
 * Uses IntersectionObserver for scroll-spy highlighting.
 *
 * @attr {string} levels      - Heading levels to include (default: 'h2,h3')
 * @attr {string} scope       - CSS selector for content scope (default: 'main')
 * @attr {string} data-title  - ToC title / nav label (default: 'On this page')
 * @attr {string} orientation - 'horizontal' renders an inline scrollable bar
 *
 * Fires `page-toc:navigate` with detail `{ id }` when a ToC link is activated.
 *
 * @example Auto-generated
 * <page-toc levels="h2,h3" data-title="Contents"></page-toc>
 *
 * @example Manual markup (progressive enhancement)
 * <page-toc>
 *   <details class="details" open>
 *     <summary class="summary">On this page</summary>
 *     <nav class="nav" aria-label="On this page">
 *       <ul class="list">
 *         <li class="item"><a href="#usage" class="link">Usage</a></li>
 *         <li class="item"><a href="#examples" class="link">Examples</a></li>
 *       </ul>
 *     </nav>
 *   </details>
 * </page-toc>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class PageToc extends VBElement {
  /** @type {IntersectionObserver | undefined} */
  #observer;
  /** @type {HTMLElement[]} */
  #headings = [];
  /** @type {Map<string, HTMLAnchorElement>} */
  #links = new Map();
  /** @type {MediaQueryList | undefined} */
  #mediaQuery;
  /** @type {HTMLDetailsElement | null} */
  #details = null;
  #resizeTimer = 0;
  #raf = 0;
  #isManualMode = false;

  setup() {
    this.#mediaQuery = window.matchMedia('(min-width: 64rem)'); /* --bp-l */
    this.listen(this.#mediaQuery, 'change', this.#handleMediaChange);
    this.listen(window, 'resize', this.#handleResize);
    this.listen(window, 'hashchange', this.#handleHashChange);
    /* One delegated handler for every ToC link (generated or authored),
       so rebuilds and reconnects never stack per-link listeners. */
    this.listen(this, 'click', this.#handleClick);

    // Delay to ensure headings are processed by heading-links
    this.#raf = requestAnimationFrame(() => {
      this.#raf = 0;
      this.#init();
    });
  }

  teardown() {
    cancelAnimationFrame(this.#raf);
    this.#raf = 0;
    clearTimeout(this.#resizeTimer);
    this.#reset();
  }

  // ── Data API (read-only — content is derived from page headings) ──────

  /**
   * Read the current TOC entries as a plain data array. Each entry:
   * `{ id, text, level }`. Auto-derived from page headings by the
   * scope= attribute; there is no setter.
   *
   * @returns {Array<{ id?: string, text: string, level: number }>} TOC entry records.
   */
  get entries() {
    return this.#headings.map(h => ({
      id: h.id || undefined,
      text: h.textContent?.trim() || '',
      level: parseInt(h.tagName.slice(1), 10) || 0,
    }));
  }

  /**
   * Refresh ToC (e.g., after dynamic content changes)
   * In auto-generated mode, rebuilds the entire ToC.
   * In manual mode, re-scans existing links.
   */
  refresh() {
    if (!this.isConnected) return;
    cancelAnimationFrame(this.#raf);
    this.#raf = 0;
    this.#init();
  }

  /** Drop observers, generated markup and cached heading/link state. */
  #reset() {
    this.#observer?.disconnect();
    this.#observer = undefined;
    for (const el of this.querySelectorAll(':scope > [data-page-toc-generated]')) el.remove();
    this.#headings = [];
    this.#links.clear();
    this.#details = null;
    this.#isManualMode = false;
  }

  #init() {
    this.#reset();

    // Check for existing manual markup (progressive enhancement mode)
    this.#isManualMode = this.#detectManualMarkup();

    if (this.#isManualMode) {
      this.#enhanceExisting();
    } else {
      this.#buildToc();
    }

    // Wide screens show the ToC permanently
    if (this.#details && this.#isWide()) this.#details.open = true;

    this.#setupScrollSpy();
    this.#syncFromHash();
  }

  /**
   * Detect authored (manual) markup. Markup this component generated is
   * marked with data-page-toc-generated and never counts as manual.
   * @returns {boolean} True if manual content exists
   */
  #detectManualMarkup() {
    return Array.from(this.querySelectorAll('nav, details'))
      .some(el => !el.closest('[data-page-toc-generated]'));
  }

  /**
   * Enhance existing manual markup with scroll-spy
   * Finds existing links and maps them to headings
   */
  #enhanceExisting() {
    this.#details = this.querySelector('details');

    for (const link of this.querySelectorAll('a[href^="#"]')) {
      const id = decodeHash(link.getAttribute('href')?.slice(1) || '');
      if (!id) continue;
      const heading = document.getElementById(id);
      if (!heading || this.#links.has(id)) continue;
      this.#headings.push(heading);
      this.#links.set(id, /** @type {HTMLAnchorElement} */ (link));
      link.classList.add('link');
    }
  }

  #isWide() {
    return this.#mediaQuery?.matches ?? false;
  }

  #handleMediaChange = (e) => {
    // On wide screens, always ensure details is open
    if (e.matches && this.#details) {
      this.#details.open = true;
    }
  };

  #handleResize = () => {
    // Debounce: restore hash-based active state after resize settles
    clearTimeout(this.#resizeTimer);
    this.#resizeTimer = window.setTimeout(() => this.#syncFromHash(), 150);
  };

  #handleHashChange = () => {
    this.#syncFromHash();
  };

  /** @param {MouseEvent} e */
  #handleClick = (e) => {
    const target = /** @type {Element | null} */ (e.target instanceof Element ? e.target : null);
    if (!target) return;

    // Wide screens: the ToC is always visible — the summary is a heading, not a toggle
    const summary = target.closest('summary');
    if (summary && this.#details && summary.parentElement === this.#details && this.#isWide()) {
      e.preventDefault();
      return;
    }

    const link = target.closest('a[href^="#"]');
    if (!link || !this.contains(link)) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const id = decodeHash(link.getAttribute('href')?.slice(1) || '');
    if (this.#links.get(id) !== link) return;
    const heading = document.getElementById(id);
    if (!heading) return;
    e.preventDefault();
    this.#scrollToHeading(heading);
  };

  #syncFromHash() {
    const hash = decodeHash(window.location.hash.slice(1));
    if (hash && this.#links.has(hash)) {
      this.#setActiveLink(hash);
    }
  }

  #setActiveLink(id) {
    // Remove all active states
    for (const link of this.#links.values()) {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
    // Set new active
    const link = this.#links.get(id);
    if (link) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'true');
    }
  }

  #buildToc() {
    const levels = (this.getAttribute('levels') || 'h2,h3')
      .split(',')
      .map(l => l.trim().toLowerCase());
    const scope = this.getAttribute('scope') || 'main';
    const title = this.dataset.title || 'On this page';

    // Find headings within scope
    const container = document.querySelector(scope);
    if (!container) return;

    this.#headings = /** @type {HTMLElement[]} */ (Array.from(container.querySelectorAll(levels.join(','))))
      .filter(h => h.id)
      .filter(h => !h.hasAttribute('data-toc-ignore') && !h.closest('[data-toc-ignore]'));

    if (this.#headings.length === 0) return;

    // Build a hierarchical tree from the flat heading list so sub-trees
    // can collapse when their parent section isn't active. Scroll-spy
    // adds `.active` to the current link; CSS :has() rules in styles.css
    // expand the ancestor branch automatically.
    /** @typedef {{depth: number, heading?: any, children: TocNode[]}} TocNode */
    /** @type {TocNode} */
    const sentinel = { depth: -1, children: [] };
    /** @type {TocNode[]} */
    const stack = [sentinel];
    for (const heading of this.#headings) {
      const depth = levels.indexOf(heading.tagName.toLowerCase());
      while (stack[stack.length - 1].depth >= depth) stack.pop();
      /** @type {TocNode} */
      const node = { heading, depth, children: [] };
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    }

    const renderList = (nodes) => {
      const ul = document.createElement('ul');
      ul.className = 'list';
      for (const node of nodes) {
        const li = document.createElement('li');
        li.className = 'item';
        li.dataset.level = String(node.depth);

        const link = document.createElement('a');
        link.href = `#${node.heading.id}`;
        link.className = 'link';
        link.textContent = this.#getHeadingText(node.heading);
        li.appendChild(link);

        if (node.children.length) {
          li.appendChild(renderList(node.children));
        }

        ul.appendChild(li);
        this.#links.set(node.heading.id, link);
      }
      return ul;
    };

    // Mobile disclosure wrapper — the whole TOC collapses behind a
    // summary on narrow screens. Per-section collapse (above) is
    // orthogonal and works at every width.
    const details = document.createElement('details');
    details.className = 'details';
    details.setAttribute('data-page-toc-generated', '');
    details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'summary';
    summary.textContent = title;
    details.appendChild(summary);

    const nav = document.createElement('nav');
    nav.className = 'nav';
    nav.setAttribute('aria-label', title);
    nav.appendChild(renderList(sentinel.children));
    details.appendChild(nav);

    this.#details = details;
    this.appendChild(details);
  }

  #getHeadingText(heading) {
    // Get text content excluding anchor buttons
    const clone = heading.cloneNode(true);
    const anchors = clone.querySelectorAll('.heading-anchor');
    anchors.forEach(a => a.remove());
    return clone.textContent.trim();
  }

  /** @param {HTMLElement} heading */
  #scrollToHeading(heading) {
    // Update URL
    const url = new URL(window.location.href);
    url.hash = heading.id;
    window.history.pushState(null, '', url);

    // An explicit `behavior` overrides CSS scroll-behavior, so honour reduced motion here
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    heading.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });

    // Move focus to the heading so keyboard / AT users continue from there
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });

    this.#setActiveLink(heading.id);

    this.dispatchEvent(new CustomEvent('page-toc:navigate', {
      bubbles: true,
      detail: { id: heading.id }
    }));
  }

  #setupScrollSpy() {
    if (this.#headings.length === 0) return;

    // Track which headings are visible
    const visibleHeadings = new Set();

    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleHeadings.add(entry.target.id);
          } else {
            visibleHeadings.delete(entry.target.id);
          }
        }

        // Highlight the first visible heading
        this.#updateActiveLink(visibleHeadings);
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0
      }
    );

    for (const heading of this.#headings) {
      this.#observer.observe(heading);
    }
  }

  #updateActiveLink(visibleHeadings) {
    // Find first visible heading in document order
    for (const heading of this.#headings) {
      if (visibleHeadings.has(heading.id)) {
        this.#setActiveLink(heading.id);
        return;
      }
    }
    // No visible headings - fall back to URL hash
    this.#syncFromHash();
  }
}

/**
 * Decode a URL fragment so it can be compared with an element id
 * (`#caf%C3%A9` → `café`). Malformed sequences fall back to the raw value.
 * @param {string} hash
 * @returns {string}
 */
function decodeHash(hash) {
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
}

registerComponent('page-toc', PageToc);

export { PageToc };
