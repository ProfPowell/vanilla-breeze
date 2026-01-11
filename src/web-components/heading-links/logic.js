/**
 * heading-links: Add anchor links to headings
 *
 * Scans child headings and adds link/copy icons that appear on hover.
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
    // Ensure heading has an ID
    if (!heading.id) {
      heading.id = this.#generateId(heading.textContent);
    }

    // Check if already has anchor links
    if (heading.querySelector('.heading-anchor')) return;

    // Create anchor container
    const anchor = document.createElement('span');
    anchor.className = 'heading-anchor';
    anchor.setAttribute('aria-hidden', 'true');

    // Link icon - navigates to section
    const linkBtn = document.createElement('button');
    linkBtn.type = 'button';
    linkBtn.className = 'heading-anchor-link';
    linkBtn.setAttribute('tabindex', '-1');
    linkBtn.title = 'Link to this section';
    linkBtn.innerHTML = '<icon-wc name="link" size="sm"></icon-wc>';
    linkBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.#navigateToHeading(heading);
    });

    // Copy icon - copies URL to clipboard
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'heading-anchor-copy';
    copyBtn.setAttribute('tabindex', '-1');
    copyBtn.title = 'Copy link to clipboard';
    copyBtn.innerHTML = '<icon-wc name="copy" size="sm"></icon-wc>';
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.#copyHeadingLink(heading, copyBtn);
    });

    anchor.appendChild(linkBtn);
    anchor.appendChild(copyBtn);
    heading.appendChild(anchor);

    // Make heading focusable for keyboard navigation
    if (!heading.hasAttribute('tabindex')) {
      heading.setAttribute('tabindex', '-1');
    }
  }

  #generateId(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-')      // Spaces to hyphens
      .replace(/-+/g, '-')       // Collapse multiple hyphens
      .substring(0, 50);         // Limit length
  }

  #navigateToHeading(heading) {
    const url = new URL(window.location.href);
    url.hash = heading.id;
    window.history.pushState(null, '', url);
    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    heading.focus();

    this.dispatchEvent(new CustomEvent('heading-navigate', {
      bubbles: true,
      detail: { id: heading.id, heading }
    }));
  }

  async #copyHeadingLink(heading, button) {
    const url = new URL(window.location.href);
    url.hash = heading.id;

    try {
      await navigator.clipboard.writeText(url.href);

      // Visual feedback
      const originalIcon = button.innerHTML;
      button.innerHTML = '<icon-wc name="check" size="sm"></icon-wc>';
      button.classList.add('copied');

      // Announce to screen readers
      this.#announce('Link copied to clipboard');

      setTimeout(() => {
        button.innerHTML = originalIcon;
        button.classList.remove('copied');
      }, 2000);

      this.dispatchEvent(new CustomEvent('heading-copy', {
        bubbles: true,
        detail: { id: heading.id, url: url.href }
      }));
    } catch {
      // Fallback for older browsers
      this.#announce('Failed to copy link');
    }
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
