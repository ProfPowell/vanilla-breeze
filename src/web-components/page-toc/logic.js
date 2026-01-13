/**
 * page-toc: Table of contents with scroll-spy
 *
 * Supports two modes:
 * 1. Auto-generated: Scans document for headings and builds ToC (when empty)
 * 2. Manual markup: Enhances existing nav with scroll-spy (progressive enhancement)
 *
 * Uses IntersectionObserver for scroll-spy highlighting.
 *
 * @attr {string} data-levels - Heading levels to include (default: 'h2,h3')
 * @attr {string} data-scope - CSS selector for content scope (default: 'main')
 * @attr {string} data-title - ToC title (default: 'On this page')
 *
 * @example Auto-generated
 * <page-toc data-levels="h2,h3" data-title="Contents"></page-toc>
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
class PageToc extends HTMLElement {
  #observer;
  #headings = [];
  #links = new Map();
  #mediaQuery;
  #details;
  #resizeTimer;
  #isManualMode = false;

  connectedCallback() {
    // Delay to ensure headings are processed by heading-links
    requestAnimationFrame(() => this.#setup());
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  #setup() {
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

  #cleanup() {
    this.#observer?.disconnect();
    this.#mediaQuery?.removeEventListener('change', this.#handleMediaChange);
    window.removeEventListener('resize', this.#handleResize);
    window.removeEventListener('hashchange', this.#handleHashChange);
    clearTimeout(this.#resizeTimer);
  }

  /**
   * Handle responsive behavior: details open on wide screens, hash sync on resize
   */
  #setupResponsive() {
    this.#mediaQuery = window.matchMedia('(min-width: 1024px)');
    this.#handleMediaChange = this.#handleMediaChange.bind(this);
    this.#handleResize = this.#handleResize.bind(this);
    this.#mediaQuery.addEventListener('change', this.#handleMediaChange);
    window.addEventListener('resize', this.#handleResize);
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
    this.#handleHashChange = this.#handleHashChange.bind(this);
    window.addEventListener('hashchange', this.#handleHashChange);
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
    const levels = this.dataset.levels || 'h2,h3';
    const scope = this.dataset.scope || 'main';
    const title = this.dataset.title || 'On this page';

    // Find headings within scope
    const container = document.querySelector(scope);
    if (!container) return;

    const selector = levels.split(',').map(l => l.trim()).join(',');
    this.#headings = Array.from(container.querySelectorAll(selector))
      .filter(h => h.id); // Only headings with IDs

    if (this.#headings.length === 0) return;

    // Build ToC structure with details/summary for mobile disclosure
    this.#details = document.createElement('details');
    this.#details.className = 'details';
    this.#details.open = true; // Start open; CSS controls visibility on narrow screens
    const details = this.#details;

    const summary = document.createElement('summary');
    summary.className = 'summary';
    summary.textContent = title;
    details.appendChild(summary);

    const nav = document.createElement('nav');
    nav.className = 'nav';
    nav.setAttribute('aria-label', title);

    const list = document.createElement('ul');
    list.className = 'list';

    // Group headings by level for nesting
    const levelOrder = levels.split(',').map(l => l.trim().toLowerCase());

    for (const heading of this.#headings) {
      const tagName = heading.tagName.toLowerCase();
      const levelIndex = levelOrder.indexOf(tagName);
      const level = levelIndex >= 0 ? levelIndex : 0;

      // Create list item
      const li = document.createElement('li');
      li.className = 'item';
      li.dataset.level = level;

      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      link.className = 'link';
      link.textContent = this.#getHeadingText(heading);

      // Smooth scroll on click
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.#scrollToHeading(heading);
      });

      li.appendChild(link);
      list.appendChild(li);

      // Track for scroll-spy
      this.#links.set(heading.id, link);
    }

    nav.appendChild(list);
    details.appendChild(nav);
    this.appendChild(details);
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

    this.dispatchEvent(new CustomEvent('toc-navigate', {
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
    this.#setup();
  }
}

customElements.define('page-toc', PageToc);

export { PageToc };
