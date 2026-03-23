import { registerComponent } from '../../lib/bundle-registry.js';

/**
 * glossary-index: Interactive glossary with search and scroll-spy
 *
 * Wraps a static glossary page to add live filtering, active letter
 * tracking in the jump nav, and deep-link copy on term click.
 *
 * @attr {string} placeholder - Placeholder text for the search input
 *
 * @example
 * <glossary-index placeholder="Filter terms...">
 *   <main>
 *     <nav class="glossary-jump" aria-label="Jump to letter">
 *       <ol class="inline">
 *         <li><a href="#glossary-a">A</a></li>
 *         <!-- ... -->
 *       </ol>
 *     </nav>
 *     <section class="glossary-section" id="glossary-a">
 *       <h2>A</h2>
 *       <dl>
 *         <dt id="term-api"><dfn>API</dfn></dt>
 *         <dd>A defined interface...</dd>
 *       </dl>
 *     </section>
 *   </main>
 * </glossary-index>
 */
class GlossaryIndex extends HTMLElement {
  /** @type {HTMLInputElement|null} */
  #searchInput = null;
  /** @type {IntersectionObserver|null} */
  #observer = null;

  connectedCallback() {
    this.#addSearch();
    this.#initScrollSpy();
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.removeAttribute('data-upgraded');
  }

  #addSearch() {
    const label = this.getAttribute('placeholder') || 'Filter terms\u2026';
    const input = document.createElement('input');
    input.type = 'search';
    input.placeholder = label;
    input.setAttribute('aria-label', label);
    input.setAttribute('data-glossary-search', '');

    input.addEventListener('input', () => this.#filter(input.value));

    const main = this.querySelector('main');
    if (main) {
      main.prepend(input);
    } else {
      this.prepend(input);
    }
    this.#searchInput = input;
  }

  #filter(query) {
    const q = query.toLowerCase().trim();
    const sections = this.querySelectorAll('.glossary-section, section[id^="glossary-"]');

    for (const section of sections) {
      const terms = section.querySelectorAll('dt');
      let hasMatch = false;

      for (const dt of terms) {
        const text = dt.textContent?.toLowerCase() || '';
        const matches = !q || text.includes(q);
        const dd = dt.nextElementSibling;

        dt.hidden = !matches;
        if (dd?.tagName === 'DD') dd.hidden = !matches;
        if (matches) hasMatch = true;
      }

      section.hidden = !hasMatch;
    }
  }

  #initScrollSpy() {
    const jumpLinks = this.querySelectorAll('.glossary-jump a');
    if (!jumpLinks.length) return;

    const sections = this.querySelectorAll('.glossary-section, section[id^="glossary-"]');
    if (!sections.length) return;

    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            for (const link of jumpLinks) {
              const isActive = link.getAttribute('href') === `#${id}`;
              link.setAttribute('aria-current', isActive ? 'true' : 'false');
            }
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    for (const section of sections) {
      this.#observer.observe(section);
    }
  }
}

registerComponent('glossary-index', GlossaryIndex);

export { GlossaryIndex };
