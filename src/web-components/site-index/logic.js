import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * site-index: Interactive site keyword index
 *
 * Enhances a static keyword index with search filtering, A-Z jump
 * navigation, entry counts, display limits, and sort options.
 *
 * @attr {string}  placeholder - Search input placeholder (default "Filter index…")
 * @attr {string}  letters     - Jump nav mode: "entries" (default) | "all" | "none"
 * @attr {string}  filter      - Search scope: "topic" (default) | "all"
 * @attr {string}  sort        - Sort mode: "alpha" (default) | "count"
 * @attr {number}  limit       - Max entries per letter before "Show more" toggle
 * @attr {string}  src         - URL to load index data from (optional)
 *
 * @example
 * <site-index letters="all" limit="5">
 *   <nav aria-label="Site index">
 *     <section id="index-a"><h2>A</h2><ul>...</ul></section>
 *   </nav>
 * </site-index>
 */
class SiteIndex extends VBElement {
  /** @type {IntersectionObserver|null} */
  #observer = null;
  /** @type {Element[]} */
  #originalSectionOrder = [];
  /** @type {HTMLSelectElement|null} */
  #scopeSelect = null;

  setup() {
    const src = this.getAttribute('src');
    if (src) {
      this.#loadFromSrc(src).then(() => this.#enhance());
    } else {
      this.#enhance();
    }
  }

  teardown() {
    this.#observer?.disconnect();
  }

  #enhance() {
    this.#cacheSectionOrder();
    this.#addCounts();
    this.#buildControls();

    const letters = this.getAttribute('letters') || 'entries';
    if (letters !== 'none') {
      this.#buildJumpNav(letters === 'all');
    }

    this.#applyDisplayLimit();
  }

  /* ── Section order cache for sort restore ── */

  #cacheSectionOrder() {
    const nav = this.querySelector('nav[aria-label="Site index"]');
    if (!nav) return;
    this.#originalSectionOrder = [...nav.querySelectorAll(':scope > section')];
  }

  /* ── Entry counts ── */

  #addCounts() {
    const sections = this.querySelectorAll('nav[aria-label="Site index"] > section');

    for (const section of sections) {
      const items = section.querySelectorAll(':scope > ul > li');
      let sectionTotal = 0;

      for (const item of items) {
        const refs = item.querySelectorAll('.index-refs > li');
        const count = refs.length;
        sectionTotal += count;

        const term = item.querySelector('.index-term');
        if (term && count > 0 && !term.querySelector('.index-count')) {
          const badge = document.createElement('span');
          badge.className = 'index-count';
          badge.textContent = `(${count})`;
          term.after(badge);
        }
      }

      const h2 = section.querySelector('h2');
      if (h2 && sectionTotal > 0 && !h2.querySelector('.index-count')) {
        const badge = document.createElement('span');
        badge.className = 'index-count';
        badge.textContent = `(${sectionTotal})`;
        h2.append(badge);
      }
    }
  }

  /* ── Controls bar ── */

  #buildControls() {
    const controls = document.createElement('nav');
    controls.setAttribute('data-index-controls', '');
    controls.setAttribute('aria-label', 'Index controls');

    /* Search input */
    const label = this.getAttribute('placeholder') || 'Filter index\u2026';
    const input = document.createElement('input');
    input.type = 'search';
    input.placeholder = label;
    input.setAttribute('aria-label', label);
    input.setAttribute('data-index-search', '');
    input.addEventListener('input', () => this.#filter(input.value));
    controls.append(input);

    /* Scope dropdown */
    const scope = document.createElement('select');
    scope.setAttribute('aria-label', 'Search scope');
    scope.innerHTML = `
      <option value="topic">By Topic</option>
      <option value="all">All</option>
    `;
    const filterAttr = this.getAttribute('filter');
    if (filterAttr === 'all') scope.value = 'all';
    scope.addEventListener('change', () => this.#filter(input.value));
    this.#scopeSelect = scope;
    controls.append(scope);

    /* Sort dropdown */
    const sort = document.createElement('select');
    sort.setAttribute('aria-label', 'Sort order');
    sort.innerHTML = `
      <option value="alpha">Alphabetical</option>
      <option value="count">Most entries</option>
    `;
    const sortAttr = this.getAttribute('sort');
    if (sortAttr === 'count') sort.value = 'count';
    sort.addEventListener('change', () => this.#sort(sort.value));
    controls.append(sort);

    /* Insert before the index nav */
    const nav = this.querySelector('nav[aria-label="Site index"]');
    if (nav) {
      nav.before(controls);
    } else {
      this.prepend(controls);
    }

    /* Apply initial sort if set */
    if (sortAttr === 'count') this.#sort('count');
  }

  /* ── Jump nav ── */

  #buildJumpNav(showAll) {
    const existing = this.querySelector('.index-jump');
    if (existing) existing.remove();

    const sections = this.querySelectorAll('nav[aria-label="Site index"] > section');
    const presentLetters = new Set();
    for (const s of sections) {
      const letter = s.id?.replace('index-', '').toUpperCase();
      if (letter) presentLetters.add(letter);
    }

    if (presentLetters.size === 0) return;

    const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const letters = showAll ? allLetters : [...presentLetters].sort();

    const jumpNav = document.createElement('nav');
    jumpNav.className = 'index-jump';
    jumpNav.setAttribute('aria-label', 'Jump to letter');

    const ol = document.createElement('ol');
    ol.className = 'inline';

    for (const letter of letters) {
      const li = document.createElement('li');
      const hasEntries = presentLetters.has(letter);

      if (hasEntries) {
        const a = document.createElement('a');
        a.href = `#index-${letter.toLowerCase()}`;
        a.textContent = letter;
        li.append(a);
      } else {
        const span = document.createElement('span');
        span.textContent = letter;
        span.setAttribute('aria-disabled', 'true');
        li.append(span);
      }

      ol.append(li);
    }

    jumpNav.append(ol);

    const controls = this.querySelector('[data-index-controls]');
    const indexNav = this.querySelector('nav[aria-label="Site index"]');
    if (controls) {
      controls.after(jumpNav);
    } else if (indexNav) {
      indexNav.before(jumpNav);
    } else {
      this.prepend(jumpNav);
    }

    this.#initScrollSpy(jumpNav);
  }

  /* ── Scroll-spy ── */

  #initScrollSpy(jumpNav) {
    const links = jumpNav.querySelectorAll('a');
    if (!links.length) return;

    const sections = this.querySelectorAll('nav[aria-label="Site index"] > section');
    if (!sections.length) return;

    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            for (const link of links) {
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

  /* ── Display limit / expand-collapse ── */

  #applyDisplayLimit() {
    const limitStr = this.getAttribute('limit');
    if (!limitStr) return;

    const limit = parseInt(limitStr, 10);
    if (!limit || limit < 1) return;

    const sections = this.querySelectorAll('nav[aria-label="Site index"] > section');

    for (const section of sections) {
      const items = [...section.querySelectorAll(':scope > ul > li')];
      if (items.length <= limit) continue;

      const overflow = items.slice(limit);
      for (const item of overflow) {
        item.hidden = true;
        item.setAttribute('data-index-overflow', '');
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-index-expand', '');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = `Show ${overflow.length} more`;

      btn.addEventListener('click', () => {
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';

        for (const item of overflow) {
          item.hidden = isExpanded;
        }

        btn.setAttribute('aria-expanded', !isExpanded);
        btn.textContent = isExpanded
          ? `Show ${overflow.length} more`
          : 'Show less';
      });

      const ul = section.querySelector(':scope > ul');
      if (ul) ul.after(btn);
    }
  }

  /* ── Search / filter ── */

  #filter(query) {
    const q = query.toLowerCase().trim();
    const scope = this.#scopeSelect?.value || 'topic';
    const sections = this.querySelectorAll('nav[aria-label="Site index"] > section');

    for (const section of sections) {
      const items = section.querySelectorAll(':scope > ul > li');
      let hasMatch = false;

      for (const item of items) {
        const term = item.querySelector('.index-term');
        const termText = term?.textContent?.toLowerCase() || '';
        let matches = !q || termText.includes(q);

        if (!matches && scope === 'all') {
          const refs = item.querySelectorAll('.index-refs a');
          for (const ref of refs) {
            if (ref.textContent.toLowerCase().includes(q)) {
              matches = true;
              break;
            }
          }
        }

        item.hidden = !matches;
        if (matches) hasMatch = true;
      }

      section.hidden = !hasMatch;
    }

    this.#updateJumpNavState();
  }

  #updateJumpNavState() {
    const jumpNav = this.querySelector('.index-jump');
    if (!jumpNav) return;

    const sections = this.querySelectorAll('nav[aria-label="Site index"] > section');
    for (const section of sections) {
      const letter = section.id?.replace('index-', '').toUpperCase();
      if (!letter) continue;

      const link = jumpNav.querySelector(`a[href="#index-${letter.toLowerCase()}"]`);
      if (link) {
        link.style.opacity = section.hidden ? '0.3' : '';
      }
    }
  }

  /* ── Sort ── */

  #sort(mode) {
    const nav = this.querySelector('nav[aria-label="Site index"]');
    if (!nav) return;

    if (mode === 'alpha') {
      for (const section of this.#originalSectionOrder) {
        nav.append(section);
      }
    } else if (mode === 'count') {
      const sections = [...nav.querySelectorAll(':scope > section')];
      sections.sort((a, b) => {
        const countA = a.querySelectorAll('.index-refs > li').length;
        const countB = b.querySelectorAll('.index-refs > li').length;
        return countB - countA;
      });
      for (const section of sections) {
        nav.append(section);
      }
    }
  }

  /* ── Data-driven rendering ── */

  async #loadFromSrc(url) {
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
    if (!Array.isArray(data)) return;

    const grouped = {};
    for (const entry of data) {
      const letter = (entry.term || '')[0]?.toUpperCase() || '#';
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(entry);
    }

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Site index');

    for (const [letter, entries] of Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))) {
      const section = document.createElement('section');
      section.id = `index-${letter.toLowerCase()}`;
      section.innerHTML = `<h2>${letter}</h2>`;

      const ul = document.createElement('ul');
      for (const entry of entries) {
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="index-term">${entry.term}</span>
          ${entry.refs ? `<ul class="index-refs">${
            entry.refs.map(r => `<li><a href="${r.href}">${r.label}</a>${r.type ? ` <small>${r.type}</small>` : ''}</li>`).join('')
          }</ul>` : ''}
        `;
        ul.append(li);
      }
      section.append(ul);
      nav.append(section);
    }

    const existing = this.querySelector('nav[aria-label="Site index"]');
    if (existing) {
      existing.replaceWith(nav);
    } else {
      this.append(nav);
    }
  }
}

registerComponent('site-index', SiteIndex);

export { SiteIndex };
