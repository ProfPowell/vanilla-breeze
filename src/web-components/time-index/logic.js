import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { updateRelativeTimes } from '../../lib/time-relative.js';

/**
 * time-index: Interactive changelog/timeline component
 *
 * Enhances a static changelog with relative dates, filtering by
 * year/month/version, sort toggle, and a "recently updated pages" feed.
 *
 * @attr {string}  group       - 'month' (default) or 'version'
 * @attr {string}  view        - 'date' or 'version' — grouping view
 * @attr {boolean} versions    - Enable version jump select
 * @attr {string}  updates-src - URL for recently updated pages JSON
 *
 * @example
 * <time-index group="month" versions>
 *   <!-- static changelog entries -->
 * </time-index>
 */
class TimeIndex extends VBElement {
  setup() {
    updateRelativeTimes(this);
    this.#addControls();

    const updatesSrc = this.getAttribute('updates-src');
    if (updatesSrc) {
      this.#loadRecentUpdates(updatesSrc);
    }
  }

  #addControls() {
    const controls = document.createElement('nav');
    controls.setAttribute('data-timeline-controls', '');
    controls.setAttribute('aria-label', 'Timeline controls');

    /* Sort toggle */
    const sortBtn = document.createElement('button');
    sortBtn.type = 'button';
    sortBtn.textContent = 'Oldest first';
    sortBtn.addEventListener('click', () => {
      this.#toggleSort();
      sortBtn.textContent = this.#isReversed ? 'Latest first' : 'Oldest first';
    });
    controls.append(sortBtn);

    /* Version filter */
    if (this.hasAttribute('versions')) {
      const versions = this.#collectVersions();
      if (versions.length > 0) {
        const select = document.createElement('select');
        select.setAttribute('aria-label', 'Filter by version');
        select.innerHTML = `<option value="">All versions</option>` +
          versions.map(v => `<option value="${v}">${v}</option>`).join('');
        select.addEventListener('change', () => this.#filterByVersion(select.value));
        controls.append(select);
      }
    }

    this.prepend(controls);
  }

  /** @type {boolean} */
  #isReversed = false;

  #toggleSort() {
    this.#isReversed = !this.#isReversed;
    const container = this.querySelector('.changelog-entries') || this;
    const sections = [...container.children].filter(el => el.tagName === 'SECTION' || el.tagName === 'ARTICLE');
    sections.reverse();
    for (const section of sections) {
      container.append(section);
    }
  }

  #collectVersions() {
    const tags = this.querySelectorAll('.version-tag');
    const versions = new Set();
    for (const tag of tags) {
      const v = tag.textContent.trim();
      if (v) versions.add(v);
    }
    return [...versions];
  }

  #filterByVersion(version) {
    const sections = this.querySelectorAll('section[id^="v"]');
    for (const section of sections) {
      section.hidden = version && section.id !== version.replace(/\./g, '-').replace(/^v/, 'v');
    }

    if (!sections.length) {
      const articles = this.querySelectorAll('.changelog-entries article');
      for (const article of articles) {
        const tag = article.querySelector('.version-tag');
        article.hidden = version && tag?.textContent.trim() !== version;
      }
    }
  }

  async #loadRecentUpdates(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const pages = await res.json();
      if (!Array.isArray(pages) || !pages.length) return;

      const section = document.createElement('section');
      section.setAttribute('aria-labelledby', 'recent-pages-heading');
      section.innerHTML = `
        <h2 id="recent-pages-heading">Recently Updated Pages</h2>
        <ul class="recent-pages">
          ${pages.slice(0, 10).map(p => `
            <li>
              <a href="${p.href || p.url}">${p.title}</a>
              <time datetime="${p.modified || p.date}" data-relative>${p.modified || p.date}</time>
            </li>
          `).join('')}
        </ul>
      `;

      const entries = this.querySelector('.changelog-entries') || this.querySelector('[data-timeline-controls]');
      if (entries) {
        entries.after(section);
      } else {
        this.append(section);
      }

      updateRelativeTimes(section);
    } catch {
      /* Network error — skip */
    }
  }
}

registerComponent('time-index', TimeIndex);

export { TimeIndex };
