/**
 * page-toc: Table of contents with scroll-spy
 *
 * Supports two modes:
 * 1. Auto-generated: Scans document for headings and builds ToC (when empty)
 * 2. Manual markup: Enhances existing nav with scroll-spy (progressive enhancement)
 *
 * Uses IntersectionObserver for scroll-spy highlighting.
 *
 * @attr {string} levels - Heading levels to include (default: 'h2,h3')
 * @attr {string} scope - CSS selector for content scope (default: 'main')
 * @attr {string} title - ToC title (default: 'On this page')
 *
 * @example Auto-generated
 * <page-toc levels="h2,h3" title="Contents"></page-toc>
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
  #observer;
  #headings = [];
  #links = new Map();
  #mediaQuery;
  #details;
  #resizeTimer;
  #isManualMode = false;

  setup() {
    // Delay to ensure headings are processed by heading-links
    requestAnimationFrame(() => this.#init());
  }

  // ── Data API (read-only — content is derived from page headings) ──────

  /**
   * Read the current TOC entries as a plain data array. Each entry:
   * `{ id, text, level }`. Auto-derived from page headings by the
   * scope= attribute; there is no setter.
   */
  get entries() {
    return this.#headings.map(h => ({
      id: h.id || undefined,
      text: h.textContent?.trim() || '',
      level: parseInt(h.tagName.slice(1), 10) || 0,
    }));
  }

  teardown() {
    this.#observer?.disconnect();
    clearTimeout(this.#resizeTimer);
  }

  #init() {
    // Check for existing manual markup (progressive enhancement mode)
    this.#isManualMode = this.#detectManualMarkup();

    if (this.#isManualMode) {
      this.#enhanceExisting();
    } else {
      this.#buildToc();
    }

    this.#setupScrollSpy();
    this.#setupResponsive();
    this.#setupHashSync();
  }

  /**
   * Detect if component has manual markup (progressive enhancement mode)
   * @returns {boolean} True if manual content exists
   */
  #detectManualMarkup() {
    // Check for existing nav or details element
    return this.querySelector('nav, details') !== null;
  }

  /**
   * Enhance existing manual markup with scroll-spy
   * Finds existing links and maps them to headings
   */
  #enhanceExisting() {
    // Find existing details element for responsive handling
    this.#details = this.querySelector('details');

    // Find all links with hash hrefs
    const links = this.querySelectorAll('a[href^="#"]');

    for (const link of links) {
      const href = link.getAttribute('href');
      if (!href) continue;
      const id = href.slice(1); // Remove leading #

      if (id) {
        // Find corresponding heading
        const heading = document.getElementById(id);
        if (heading) {
          this.#headings.push(heading);
          this.#links.set(id, link);

          // Add link class if not present (for styling)
          if (!link.classList.contains('link')) {
            link.classList.add('link');
          }

          // Add smooth scroll behavior
          link.addEventListener('click', (e) => {
            e.preventDefault();
            this.#scrollToHeading(heading);
          });
        }
      }
    }
  }

  /**
   * Handle responsive behavior: details open on wide screens, hash sync on resize
   */
  #setupResponsive() {
    this.#mediaQuery = window.matchMedia('(min-width: 64rem)'); /* --bp-lg */
    this.listen(this.#mediaQuery, 'change', this.#handleMediaChange);
    this.listen(window, 'resize', this.#handleResize);
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
    this.#resizeTimer = setTimeout(() => this.#syncFromHash(), 150);
  };

  /**
   * Sync active state with URL hash for reliable state across resizes
   */
  #setupHashSync() {
    this.listen(window, 'hashchange', this.#handleHashChange);
    // Initial sync
    this.#syncFromHash();
  }

  #handleHashChange = () => {
    this.#syncFromHash();
  };

  #syncFromHash() {
    const hash = window.location.hash.slice(1);
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
    const title = this.getAttribute('title') || 'On this page';

    // Find headings within scope
    const container = document.querySelector(scope);
    if (!container) return;

    this.#headings = Array.from(container.querySelectorAll(levels.join(',')))
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
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.#scrollToHeading(node.heading);
        });
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
    this.#details = document.createElement('details');
    this.#details.className = 'details';
    this.#details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'summary';
    summary.textContent = title;
    this.#details.appendChild(summary);

    const nav = document.createElement('nav');
    nav.className = 'nav';
    nav.setAttribute('aria-label', title);
    nav.appendChild(renderList(sentinel.children));
    this.#details.appendChild(nav);

    this.appendChild(this.#details);
  }

  #getHeadingText(heading) {
    // Get text content excluding anchor buttons
    const clone = heading.cloneNode(true);
    const anchors = clone.querySelectorAll('.heading-anchor');
    anchors.forEach(a => a.remove());
    return clone.textContent.trim();
  }

  #scrollToHeading(heading) {
    // Update URL
    const url = new URL(window.location.href);
    url.hash = heading.id;
    window.history.pushState(null, '', url);

    // Smooth scroll
    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Focus heading for accessibility
    heading.focus();

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

  /**
   * Refresh ToC (e.g., after dynamic content changes)
   * In auto-generated mode, rebuilds the entire ToC.
   * In manual mode, re-scans existing links.
   */
  refresh() {
    // Only clear innerHTML in auto-generated mode
    if (!this.#isManualMode) {
      this.innerHTML = '';
    }
    this.#links.clear();
    this.#headings = [];
    this.#observer?.disconnect();
    this.#init();
  }
}

registerComponent('page-toc', PageToc);

export { PageToc };
