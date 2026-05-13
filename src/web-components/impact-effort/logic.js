/**
 * impact-effort: 2x2 prioritization matrix with drag-and-drop
 *
 * Coordinates four <drag-surface> elements in a Quick Wins / Big Bets /
 * Fill-Ins / Money Pit grid. Items move between quadrants via native
 * drag-and-drop or keyboard reorder (provided by drag-surface).
 *
 * Light DOM component — does NOT import drag-surface; expects it to be
 * registered by the main bundle or pack entry.
 *
 * @attr {string} src - URL to JSON data for items
 * @attr {boolean} compact - Reduced spacing variant
 *
 * Children use:
 * @attr {string} data-quadrant - Target quadrant: quick-wins | big-bets | fill-ins | money-pit
 * @attr {boolean} draggable="true" - Required for drag capability
 * @attr {string} data-id - Stable identifier for the item
 *
 * @fires impact-effort:move - When an item is dragged between quadrants
 * @fires impact-effort:ready - After component initializes with quadrant counts
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { viewTransitionSwap } from '../../lib/vb-view-transition.js';
import { diffByKey } from '../../lib/diff-by-key.js';

class ImpactEffort extends VBElement {
  static QUADRANTS = ['quick-wins', 'big-bets', 'fill-ins', 'money-pit'];

  static LABELS = {
    'quick-wins': 'Quick Wins',
    'big-bets':   'Big Bets',
    'fill-ins':   'Fill-Ins',
    'money-pit':  'Money Pit',
  };

  static DESCRIPTIONS = {
    'quick-wins': 'High impact \u00b7 Low effort',
    'big-bets':   'High impact \u00b7 High effort',
    'fill-ins':   'Low impact \u00b7 Low effort',
    'money-pit':  'Low impact \u00b7 High effort',
  };

  static #instanceCount = 0;

  static get observedAttributes() {
    return ['src', 'compact', 'title'];
  }

  /** @type {HTMLElement | null} */
  #grid = null;
  /** @type {Record<string, HTMLElement>} */
  #surfaces = {};
  /** @type {HTMLElement | null} */
  #liveRegion = null;
  /** @type {string} */
  #groupId = '';
  /** @type {HTMLElement | null} */
  #wrapper = null;

  setup() {
    this.#groupId = `ie-${++ImpactEffort.#instanceCount}`;

    // 1. Snapshot children that belong in quadrants
    const children = [...this.querySelectorAll(':scope > [data-quadrant], :scope > [draggable]')];

    // 2. Build wrapper: .ie-wrapper > .ie-y-label + column-div > .ie-grid + .ie-x-label
    const wrapper = document.createElement('div');
    wrapper.className = 'ie-wrapper';

    const yLabel = document.createElement('div');
    yLabel.className = 'ie-y-label';
    yLabel.setAttribute('aria-hidden', 'true');
    yLabel.textContent = 'Impact \u2191';

    const column = document.createElement('div');
    column.style.cssText = 'display:flex;flex-direction:column;flex:1;min-width:0;';

    const grid = document.createElement('div');
    grid.className = 'ie-grid';
    grid.setAttribute('role', 'region');
    grid.setAttribute('aria-label', 'Impact-Effort prioritization matrix');

    const xLabel = document.createElement('div');
    xLabel.className = 'ie-x-label';
    xLabel.setAttribute('aria-hidden', 'true');
    xLabel.textContent = 'Effort \u2192';

    // 3. Build quadrant sections
    for (const q of ImpactEffort.QUADRANTS) {
      const section = document.createElement('section');
      section.className = 'ie-quadrant';
      section.dataset.quadrantZone = q;
      section.setAttribute('aria-label', `${ImpactEffort.LABELS[q]}: ${ImpactEffort.DESCRIPTIONS[q]}`);

      const header = document.createElement('header');
      header.className = 'ie-quadrant-label';
      header.innerHTML =
        `${ImpactEffort.LABELS[q]}<br><span class="ie-quadrant-desc">${ImpactEffort.DESCRIPTIONS[q]}</span>`;

      const surface = document.createElement('drag-surface');
      surface.setAttribute('group', this.#groupId);
      surface.setAttribute('aria-label', ImpactEffort.LABELS[q]);
      surface.setAttribute('data-layout', 'stack');
      surface.setAttribute('data-layout-gap', 'xs');

      section.appendChild(header);
      section.appendChild(surface);
      grid.appendChild(section);

      this.#surfaces[q] = surface;
    }

    // 4. Distribute captured children into matching surfaces
    children.forEach((child, i) => {
      const quadrant = child.getAttribute('data-quadrant') || 'quick-wins';
      const target = this.#surfaces[quadrant] || this.#surfaces['quick-wins'];

      // Ensure draggable and data-id
      if (!child.hasAttribute('draggable')) {
        child.setAttribute('draggable', 'true');
      }
      if (!child.hasAttribute('data-id')) {
        child.dataset.id = `ie-item-${i}`;
      }

      target.appendChild(child);
    });

    // 5. Create live region
    const liveRegion = document.createElement('div');
    liveRegion.className = 'ie-live-region';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');

    // 6. Assemble DOM
    const title = this.getAttribute('title');
    if (title) {
      const heading = document.createElement('h3');
      heading.className = 'ie-title';
      heading.textContent = title;
      this.prepend(heading);
    }

    column.appendChild(grid);
    column.appendChild(xLabel);
    wrapper.appendChild(yLabel);
    wrapper.appendChild(column);
    this.appendChild(wrapper);
    this.appendChild(liveRegion);

    this.#grid = grid;
    this.#liveRegion = liveRegion;
    this.#wrapper = wrapper;

    // 7. Listen for cross-surface transfers
    this.listen(this, 'drag-surface:transfer', (/** @type {CustomEvent} */ e) => {
      const { item, fromSurface, toSurface } = e.detail;
      const fromQuadrant = this.#findQuadrantForSurface(fromSurface);
      const toQuadrant = this.#findQuadrantForSurface(toSurface);

      if (!fromQuadrant || !toQuadrant) return;

      // Update the item's quadrant attribute
      item.setAttribute('data-quadrant', toQuadrant);

      // Announce the move
      this.#announce(`Moved ${this.#itemLabel(item)} to ${ImpactEffort.LABELS[toQuadrant]}`);

      // Dispatch component-level event
      this.dispatchEvent(new CustomEvent('impact-effort:move', {
        bubbles: true,
        detail: {
          itemId: item.dataset.id,
          from: fromQuadrant,
          to: toQuadrant,
          item,
        },
      }));
    });

    // 8. Handle src attribute for data mode
    const src = this.getAttribute('src');
    if (src) {
      this.#loadFromSrc(src);
    }

    // 9. Dispatch ready event with counts
    this.#dispatchReady();
  }

  teardown() {
    if (this.#wrapper) {
      this.#wrapper.remove();
      this.#wrapper = null;
    }
    if (this.#liveRegion) {
      this.#liveRegion.remove();
      this.#liveRegion = null;
    }
    this.#grid = null;
    this.#surfaces = {};
    this.#nodes.clear();
    this.#items = [];
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /** @type {any[]} */
  #items = [];
  /** @type {Map<unknown, Element>} */
  #nodes = new Map();

  /**
   * Read the matrix items as a plain array. Each entry:
   * `{ id, quadrant: 'quick-wins'|'big-bets'|'fill-ins'|'money-pit', text? }`.
   * After upgrade reflects the parsed children; after assignment reflects
   * what was passed in.
   */
  get items() {
    if (this.#items.length) return this.#items;
    const result = [];
    for (const [q, surface] of Object.entries(this.#surfaces)) {
      for (const el of surface.querySelectorAll(':scope > [draggable="true"]')) {
        result.push({
          id: el.getAttribute('data-id') || undefined,
          quadrant: q,
          text: el.textContent?.trim() || undefined,
        });
      }
    }
    return result;
  }

  /**
   * Replace the matrix items and route each into its quadrant surface.
   * Runs a keyed diff so existing nodes whose id persists are preserved
   * across re-assignment (in-flight drag state, focus, animations survive).
   * New ids render as <article class="ie-card"> by default; override via
   * `.renderItem`.
   *
   * Emits impact-effort:items-changed { items, source: 'property' }.
   */
  set items(value) {
    if (!this.#grid) return;
    const next = Array.isArray(value) ? value : [];
    diffByKey({
      newItems: next,
      nodes: this.#nodes,
      keyOf: (it) => it.id ?? `${it.quadrant}:${it.text}`,
      renderItem: (it) => {
        if (typeof this.renderItem === 'function') {
          const out = this.renderItem(it);
          if (out instanceof Element) {
            if (!out.hasAttribute('draggable')) out.setAttribute('draggable', 'true');
            if (!out.hasAttribute('data-id')) out.setAttribute('data-id', String(it.id ?? ''));
            return out;
          }
        }
        const article = document.createElement('article');
        article.className = 'ie-card';
        article.setAttribute('draggable', 'true');
        if (it.id) article.setAttribute('data-id', String(it.id));
        article.textContent = it.text || it.id || '';
        return article;
      },
      containerFor: (it) => this.#surfaces[it.quadrant] || this.#surfaces['quick-wins'],
    });
    this.#items = next;
    this.dispatchEvent(new CustomEvent('impact-effort:items-changed', {
      detail: { items: next, source: 'property' },
      bubbles: true,
    }));
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.hasAttribute('data-upgraded')) return;

    if (name === 'src' && newVal && newVal !== oldVal) {
      this.#loadFromSrc(newVal);
    }
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  async #loadFromSrc(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (!Array.isArray(data)) return;

      const swap = () => {
        // Clear existing items from all surfaces
        for (const q of ImpactEffort.QUADRANTS) {
          const surface = this.#surfaces[q];
          if (!surface) continue;
          for (const child of [...surface.querySelectorAll('[draggable]')]) {
            child.remove();
          }
        }

        // Create and distribute items — use <user-story> when story data present
        data.forEach((entry, i) => {
          const quadrant = entry.quadrant || 'quick-wins';
          const id = entry.id || `ie-item-${i}`;
          let el;

          if (entry.persona || entry.action || entry.storyId) {
            el = document.createElement('user-story');
            el.setAttribute('detail', 'minimal');
            if (entry.storyId)  el.setAttribute('story-id', entry.storyId);
            if (entry.persona)  el.setAttribute('persona', entry.persona);
            if (entry.action)   el.setAttribute('action', entry.action);
            if (entry.benefit)  el.setAttribute('benefit', entry.benefit);
            if (entry.priority) el.setAttribute('priority', entry.priority);
            if (entry.status)   el.setAttribute('status', entry.status);
            if (entry.points)   el.setAttribute('points', String(entry.points));
          } else {
            el = document.createElement('article');
            el.textContent = entry.label || entry.text || '';
          }

          el.setAttribute('draggable', 'true');
          el.dataset.id = id;
          el.dataset.quadrant = quadrant;

          const target = this.#surfaces[quadrant] || this.#surfaces['quick-wins'];
          target.appendChild(el);
        });
      };

      if (this.hasAttribute('data-upgraded') && this.#grid) {
        viewTransitionSwap(this, swap, 'ie-vt');
      } else {
        swap();
      }

      this.#dispatchReady();
    } catch (err) {
      console.warn(`[impact-effort] Failed to load src="${url}":`, err);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Reverse lookup: find which quadrant name owns a given drag-surface element */
  #findQuadrantForSurface(surface) {
    for (const [q, s] of Object.entries(this.#surfaces)) {
      if (s === surface) return q;
    }
    return null;
  }

  /** Set live region text content (with clear-and-set for re-announcement) */
  #announce(msg) {
    const region = this.#liveRegion;
    if (!region) return;
    region.textContent = '';
    requestAnimationFrame(() => {
      region.textContent = msg;
    });
  }

  /** Derive a label for an item from data-id or textContent */
  #itemLabel(item) {
    return item.dataset.id || item.textContent.trim().slice(0, 40);
  }

  /** Dispatch the ready event with counts per quadrant */
  #dispatchReady() {
    const quadrantCounts = {};
    for (const q of ImpactEffort.QUADRANTS) {
      const surface = this.#surfaces[q];
      quadrantCounts[q] = surface
        ? surface.querySelectorAll('[draggable="true"]').length
        : 0;
    }
    this.dispatchEvent(new CustomEvent('impact-effort:ready', {
      bubbles: true,
      detail: { quadrantCounts },
    }));
  }
}

registerComponent('impact-effort', ImpactEffort);
export { ImpactEffort };
