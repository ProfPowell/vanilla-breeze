/**
 * page-toc: Auto-generated table of contents with scroll-spy
 *
 * Scans the document for headings and builds a navigable ToC.
 * Uses IntersectionObserver for scroll-spy highlighting.
 *
 * @attr {string} data-levels - Heading levels to include (default: 'h2,h3')
 * @attr {string} data-scope - CSS selector for content scope (default: 'main')
 * @attr {string} data-title - ToC title (default: 'On this page')
 *
 * @example
 * <page-toc data-levels="h2,h3" data-title="Contents"></page-toc>
 */
class PageToc extends HTMLElement {
  #observer;
  #headings = [];
  #links = new Map();

  connectedCallback() {
    // Delay to ensure headings are processed by heading-links
    requestAnimationFrame(() => this.#setup());
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  #setup() {
    this.#buildToc();
    this.#setupScrollSpy();
  }

  #cleanup() {
    this.#observer?.disconnect();
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
    const details = document.createElement('details');
    details.className = 'page-toc-details';

    const summary = document.createElement('summary');
    summary.className = 'page-toc-summary';
    summary.textContent = title;
    details.appendChild(summary);

    const nav = document.createElement('nav');
    nav.className = 'page-toc-nav';
    nav.setAttribute('aria-label', title);

    const list = document.createElement('ul');
    list.className = 'page-toc-list';

    // Group headings by level for nesting
    const levelOrder = levels.split(',').map(l => l.trim().toLowerCase());

    for (const heading of this.#headings) {
      const tagName = heading.tagName.toLowerCase();
      const levelIndex = levelOrder.indexOf(tagName);
      const level = levelIndex >= 0 ? levelIndex : 0;

      // Create list item
      const li = document.createElement('li');
      li.className = 'page-toc-item';
      li.dataset.level = level;

      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      link.className = 'page-toc-link';
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
    // Remove all active states
    for (const link of this.#links.values()) {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }

    // Find first visible heading in document order
    for (const heading of this.#headings) {
      if (visibleHeadings.has(heading.id)) {
        const link = this.#links.get(heading.id);
        if (link) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'true');
        }
        break;
      }
    }
  }

  /**
   * Refresh ToC (e.g., after dynamic content changes)
   */
  refresh() {
    this.innerHTML = '';
    this.#links.clear();
    this.#headings = [];
    this.#observer?.disconnect();
    this.#setup();
  }
}

customElements.define('page-toc', PageToc);

export { PageToc };
