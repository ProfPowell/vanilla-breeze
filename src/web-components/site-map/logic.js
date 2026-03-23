import { registerComponent } from '../../lib/bundle-registry.js';

/**
 * site-map: Interactive HTML sitemap
 *
 * Enhances a static sitemap with current-page marking, auto-expanding
 * of the current section, and expand/collapse all controls.
 *
 * @attr {string} current - Pathname of the current page
 * @attr {string} src     - URL to load sitemap data from (optional)
 *
 * @example
 * <site-map current="/docs/components/button">
 *   <nav aria-label="Full site map">
 *     <!-- pre-rendered nav HTML -->
 *   </nav>
 * </site-map>
 */
class SiteMap extends HTMLElement {
  connectedCallback() {
    this.#markCurrentPage();
    this.#autoExpandCurrent();
    this.#addControls();

    if (this.getAttribute('src')) {
      this.#loadFromSrc();
    }

    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    this.removeAttribute('data-upgraded');
  }

  #markCurrentPage() {
    const current = this.getAttribute('current') || window.location.pathname;
    const links = this.querySelectorAll('a');

    for (const link of links) {
      const href = new URL(link.href, window.location.origin).pathname;
      if (href === current) {
        link.setAttribute('aria-current', 'page');
      }
    }
  }

  #autoExpandCurrent() {
    const currentLink = this.querySelector('[aria-current="page"]');
    if (!currentLink) return;

    /* Walk up the DOM and open all ancestor <details> */
    let el = currentLink.parentElement;
    while (el && el !== this) {
      if (el.tagName === 'DETAILS') {
        el.open = true;
      }
      el = el.parentElement;
    }
  }

  #addControls() {
    const details = this.querySelectorAll('details');
    if (!details.length) return;

    const controls = document.createElement('nav');
    controls.setAttribute('data-sitemap-controls', '');
    controls.setAttribute('aria-label', 'Sitemap controls');

    const expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.textContent = 'Expand all';
    expandBtn.addEventListener('click', () => {
      for (const d of details) d.open = true;
    });

    const collapseBtn = document.createElement('button');
    collapseBtn.type = 'button';
    collapseBtn.textContent = 'Collapse all';
    collapseBtn.addEventListener('click', () => {
      for (const d of details) d.open = false;
      this.#autoExpandCurrent();
    });

    controls.append(expandBtn, collapseBtn);
    this.prepend(controls);
  }

  async #loadFromSrc() {
    const url = this.getAttribute('src');
    if (!url) return;

    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      this.#renderFromData(data);
    } catch {
      /* Network error — fall back to static HTML */
    }
  }

  #renderFromData(data) {
    if (!data || !Array.isArray(data.children)) return;

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Full site map');
    nav.append(this.#buildTree(data.children));

    const existing = this.querySelector('nav');
    if (existing) {
      existing.replaceWith(nav);
    } else {
      this.append(nav);
    }

    this.#markCurrentPage();
    this.#autoExpandCurrent();
  }

  #buildTree(items) {
    const ul = document.createElement('ul');
    for (const item of items) {
      const li = document.createElement('li');

      if (item.children?.length) {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = item.title;
        details.append(summary);
        details.append(this.#buildTree(item.children));
        li.append(details);
      } else {
        const a = document.createElement('a');
        a.href = item.href || item.path;
        a.textContent = item.title;
        li.append(a);
      }

      ul.append(li);
    }
    return ul;
  }
}

registerComponent('site-map', SiteMap);

export { SiteMap };
