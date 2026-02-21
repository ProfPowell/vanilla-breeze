/**
 * heading-links: Add anchor links to headings
 *
 * Scans child headings and adds a link icon that appears on hover.
 * Click navigates to the section and copies the URL to clipboard.
 * Uses existing IDs or auto-generates from heading text.
 *
 * @attr {string} data-levels - Heading levels to process (default: 'h2,h3')
 *
 * @example
 * <heading-links>
 *   <h2 id="usage">Usage</h2>
 *   <p>Content...</p>
 *   <h3>Example</h3>
 * </heading-links>
 */
class HeadingLinks extends HTMLElement {
  #observer;
  #processedHeadings = new WeakSet();

  connectedCallback() {
    this.#setup();
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  #setup() {
    // Process existing headings
    this.#processHeadings();

    // Watch for dynamic heading additions
    this.#observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          this.#processHeadings();
        }
      }
    });

    this.#observer.observe(this, { childList: true, subtree: true });
  }

  #cleanup() {
    this.#observer?.disconnect();
  }

  #processHeadings() {
    const levels = this.dataset.levels || 'h2,h3';
    const selector = levels.split(',').map(l => l.trim()).join(',');
    const headings = this.querySelectorAll(selector);

    for (const heading of headings) {
      if (this.#processedHeadings.has(heading)) continue;
      this.#enhanceHeading(heading);
      this.#processedHeadings.add(heading);
    }
  }

  #enhanceHeading(heading) {
    // Skip headings that are opted out or inside non-document contexts
    if (heading.closest('dialog, [data-toc-ignore]') || heading.hasAttribute('data-toc-ignore')) return;

    // Ensure heading has an ID
    if (!heading.id) {
      heading.id = this.#generateId(heading.textContent);
    }

    // Check if already has anchor links
    if (heading.querySelector('.heading-anchor')) return;

    // Create anchor link
    const anchor = document.createElement('a');
    anchor.className = 'heading-anchor';
    anchor.href = `#${heading.id}`;
    anchor.setAttribute('aria-label', `Link to ${heading.textContent.trim()}`);
    anchor.innerHTML = '<icon-wc name="link" size="sm"></icon-wc>';
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      this.#activateLink(heading, anchor);
    });

    heading.appendChild(anchor);

    // Make heading focusable for keyboard navigation
    if (!heading.hasAttribute('tabindex')) {
      heading.setAttribute('tabindex', '-1');
    }
  }

  #generateId(text) {
    const baseId = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-')      // Spaces to hyphens
      .replace(/-+/g, '-')       // Collapse multiple hyphens
      .substring(0, 50);         // Limit length

    // Ensure unique ID - check if already exists in document
    let id = baseId;
    let counter = 1;
    while (document.getElementById(id)) {
      id = `${baseId}-${counter}`;
      counter++;
    }
    return id;
  }

  async #activateLink(heading, anchor) {
    const url = new URL(window.location.href);
    url.hash = heading.id;

    // Update URL and scroll
    window.history.pushState(null, '', url);
    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    heading.focus();

    // Copy to clipboard silently
    try {
      await navigator.clipboard.writeText(url.href);

      // Brief visual feedback
      const originalIcon = anchor.innerHTML;
      anchor.innerHTML = '<icon-wc name="check" size="sm"></icon-wc>';
      anchor.classList.add('copied');

      setTimeout(() => {
        anchor.innerHTML = originalIcon;
        anchor.classList.remove('copied');
      }, 1500);

      this.#announce('Link copied to clipboard');
    } catch {
      // Clipboard failed, but navigation still works
    }

    this.dispatchEvent(new CustomEvent('heading-navigate', {
      bubbles: true,
      detail: { id: heading.id, url: url.href }
    }));
  }

  #announce(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    this.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }
}

customElements.define('heading-links', HeadingLinks);

export { HeadingLinks };
