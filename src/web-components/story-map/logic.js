/**
 * story-map: Horizontal user story map with activity columns
 *
 * Light DOM component that creates a horizontal story map with activity
 * columns, each containing a <drag-surface> for cross-column drag-and-drop.
 *
 * @attr {string} src - URL to JSON data
 * @attr {string} title - Optional heading displayed above the map
 * @attr {boolean} compact - Reduced spacing variant
 *
 * Children use:
 * @attr {string} data-activity - Activity column identifier (on <section>)
 * @attr {string} data-activity-label - Display label for the column header (on <section>)
 * @attr {string} data-journey-phase - Optional link to a user-journey phase (on <section>)
 *
 * @fires story-map:reorder - Item reordered within a column
 * @fires story-map:transfer - Item moved between columns
 * @fires story-map:ready - Fired after component initializes
 *
 * @example
 * <story-map>
 *   <section data-activity="discovery" data-activity-label="Discovery">
 *     <article draggable="true" data-id="PROJ-1">Interview users</article>
 *   </section>
 * </story-map>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class StoryMap extends VBElement {
  static get observedAttributes() { return ['src', 'compact', 'title']; }

  static #instanceCount = 0;

  /** @type {HTMLDivElement | null} */
  #scroll = null;
  /** @type {HTMLDivElement | null} */
  #columnsEl = null;
  /** @type {Record<string, HTMLElement>} */
  #surfaces = {};
  /** @type {HTMLDivElement | null} */
  #liveRegion = null;
  /** @type {string} */
  #groupId = '';
  /** @type {Array<{ id: string, label: string, journeyPhase: string | null, children: HTMLElement[] }>} */
  #activities = [];

  setup() {
    this.#groupId = `sm-${++StoryMap.#instanceCount}`;

    // 1. Snapshot <section data-activity> children
    const sections = /** @type {HTMLElement[]} */ ([
      ...this.querySelectorAll(':scope > section[data-activity]')
    ]);

    this.#activities = sections.map(section => {
      const id = section.getAttribute('data-activity') || '';
      const rawLabel = section.getAttribute('data-activity-label') || '';
      const label = rawLabel || this.#titleCase(id);
      const journeyPhase = section.getAttribute('data-journey-phase') || null;
      const children = /** @type {HTMLElement[]} */ ([...section.children]);
      return { id, label, journeyPhase, children };
    });

    // 2. Remove original sections (children already captured)
    for (const section of sections) {
      section.remove();
    }

    // 3. Build scroll container
    this.#scroll = document.createElement('div');
    this.#scroll.className = 'sm-scroll';
    this.#scroll.setAttribute('role', 'region');
    this.#scroll.setAttribute('aria-label', 'Story map');
    this.#scroll.setAttribute('tabindex', '0');

    // 4. Build columns container
    this.#columnsEl = document.createElement('div');
    this.#columnsEl.className = 'sm-columns';

    // 5. Build each activity column
    let totalStories = 0;

    for (const activity of this.#activities) {
      const column = document.createElement('section');
      column.className = 'sm-column';
      column.setAttribute('data-activity-column', activity.id);

      // Header with count badge
      const header = document.createElement('header');
      header.className = 'sm-activity-header';
      const h3 = document.createElement('h3');
      h3.textContent = activity.label;
      const countBadge = document.createElement('span');
      countBadge.className = 'sm-activity-count';
      countBadge.textContent = String(activity.children.length);
      h3.appendChild(countBadge);
      header.appendChild(h3);
      column.appendChild(header);

      // Drag surface
      const surface = document.createElement('drag-surface');
      surface.setAttribute('group', this.#groupId);
      surface.setAttribute('aria-label', `${activity.label} stories`);
      surface.setAttribute('data-layout', 'stack');
      surface.setAttribute('data-layout-gap', 'xs');

      // Move captured children into the drag-surface
      if (activity.children.length > 0) {
        for (const child of activity.children) {
          surface.appendChild(child);
        }
        totalStories += activity.children.length;
      } else {
        const placeholder = document.createElement('p');
        placeholder.className = 'sm-empty';
        placeholder.textContent = 'No stories yet';
        surface.appendChild(placeholder);
      }

      column.appendChild(surface);
      this.#columnsEl.appendChild(column);
      this.#surfaces[activity.id] = surface;
    }

    // 6. Assemble: title + scroll > columns, append to this
    const title = this.getAttribute('title');
    if (title) {
      const heading = document.createElement('h2');
      heading.className = 'sm-title';
      heading.textContent = title;
      this.appendChild(heading);
    }

    this.#scroll.appendChild(this.#columnsEl);
    this.appendChild(this.#scroll);

    // 7. Create live region
    this.#liveRegion = document.createElement('div');
    this.#liveRegion.className = 'sm-live-region';
    this.#liveRegion.setAttribute('role', 'status');
    this.#liveRegion.setAttribute('aria-live', 'polite');
    this.#liveRegion.setAttribute('aria-atomic', 'true');
    this.appendChild(this.#liveRegion);

    // 8. Listen for drag-surface:reorder
    this.listen(this, 'drag-surface:reorder', (e) => {
      const detail = /** @type {CustomEvent} */ (e).detail;
      const surface = /** @type {HTMLElement} */ (e.target).closest('drag-surface');
      const activityId = this.#findActivityForSurface(surface);
      if (!activityId) return;

      this.#updateCount(activityId);

      this.dispatchEvent(new CustomEvent('story-map:reorder', {
        bubbles: true,
        detail: {
          itemId: detail.itemId,
          activity: activityId,
          oldIndex: detail.oldIndex,
          newIndex: detail.newIndex,
        },
      }));
    });

    // 9. Listen for drag-surface:transfer
    this.listen(this, 'drag-surface:transfer', (e) => {
      const detail = /** @type {CustomEvent} */ (e).detail;
      const fromSurface = detail.fromSurface;
      const toSurface = detail.toSurface;
      const fromActivity = this.#findActivityForSurface(fromSurface);
      const toActivity = this.#findActivityForSurface(toSurface);
      if (!fromActivity || !toActivity) return;

      // Update count badges
      this.#updateCount(fromActivity);
      this.#updateCount(toActivity);

      // Remove placeholder from receiving column if it had one
      const toPlaceholder = toSurface.querySelector('.sm-empty');
      if (toPlaceholder) toPlaceholder.remove();

      // Add placeholder to sending column if now empty
      const fromDraggables = fromSurface.querySelectorAll(':scope > [draggable="true"]');
      if (fromDraggables.length === 0 && !fromSurface.querySelector('.sm-empty')) {
        const placeholder = document.createElement('p');
        placeholder.className = 'sm-empty';
        placeholder.textContent = 'No stories yet';
        fromSurface.appendChild(placeholder);
      }

      // Announce via live region
      const itemLabel = this.#itemLabel(detail.item);
      this.#announce(`${itemLabel} moved from ${fromActivity} to ${toActivity}`);

      this.dispatchEvent(new CustomEvent('story-map:transfer', {
        bubbles: true,
        detail: {
          itemId: detail.itemId,
          fromActivity,
          toActivity,
          newIndex: detail.newIndex,
        },
      }));
    });

    // 10. Handle src attribute for data mode
    const src = this.getAttribute('src');
    if (src) {
      this._loadSrc(src);
      return; // ready event fires after src loads
    }

    // 11. Dispatch ready event
    this.dispatchEvent(new CustomEvent('story-map:ready', {
      bubbles: true,
      detail: {
        activityCount: this.#activities.length,
        storyCount: totalStories,
      },
    }));
  }

  teardown() {
    if (this.#scroll) {
      this.#scroll.remove();
      this.#scroll = null;
    }
    if (this.#liveRegion) {
      this.#liveRegion.remove();
      this.#liveRegion = null;
    }
    this.#columnsEl = null;
    this.#surfaces = {};
    this.#activities = [];
  }

  // ── Attribute changes ────────────────────────────────

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.isConnected) return;
    if (name === 'src') this._loadSrc(newValue);
  }

  // ── JSON loading ────────────────────────────────────

  async _loadSrc(url) {
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Clear existing children
      while (this.firstChild) this.firstChild.remove();
      // Create sections from activities
      for (const activity of (data.activities || [])) {
        const section = document.createElement('section');
        section.setAttribute('data-activity', activity.id);
        section.setAttribute('data-activity-label', activity.label || activity.id);
        if (activity.journeyPhase) section.setAttribute('data-journey-phase', activity.journeyPhase);
        for (const story of (activity.stories || [])) {
          const el = document.createElement('user-story');
          el.setAttribute('draggable', 'true');
          el.dataset.id = story.id || story.storyId;
          if (story.storyId || story.id) el.setAttribute('story-id', story.storyId || story.id);
          if (story.title) el.setAttribute('title', story.title);
          if (story.persona) el.setAttribute('persona', story.persona);
          if (story.action) el.setAttribute('action', story.action);
          if (story.benefit) el.setAttribute('benefit', story.benefit);
          if (story.priority) el.setAttribute('priority', story.priority);
          if (story.status) el.setAttribute('status', story.status);
          if (story.points) el.setAttribute('points', String(story.points));
          el.setAttribute('detail', story.detail || 'compact');
          section.appendChild(el);
        }
        this.appendChild(section);
      }
      // Tear down old listeners/state before re-running setup
      this.teardown();
      this.removeAttribute('data-upgraded');
      this.setup();
    } catch (err) {
      console.warn(`[story-map] Failed to load src="${url}":`, err);
    }
  }

  // ── Helpers ──────────────────────────────────────────

  /**
   * Reverse-lookup: find the activity id that owns a given drag-surface.
   * @param {HTMLElement | null} surface
   * @returns {string | null}
   */
  #findActivityForSurface(surface) {
    if (!surface) return null;
    for (const [id, ref] of Object.entries(this.#surfaces)) {
      if (ref === surface) return id;
    }
    return null;
  }

  /**
   * Update the count badge in the column header for a given activity.
   * @param {string} activityId
   */
  #updateCount(activityId) {
    const surface = this.#surfaces[activityId];
    if (!surface) return;
    const count = surface.querySelectorAll(':scope > [draggable="true"]').length;
    const column = surface.closest('[data-activity-column]');
    if (!column) return;
    const badge = column.querySelector('.sm-activity-count');
    if (badge) badge.textContent = String(count);
  }

  /**
   * Announce a message via the live region.
   * @param {string} msg
   */
  #announce(msg) {
    if (!this.#liveRegion) return;
    this.#liveRegion.textContent = '';
    requestAnimationFrame(() => {
      if (this.#liveRegion) this.#liveRegion.textContent = msg;
    });
  }

  /**
   * Get a human-readable label for a story item.
   * @param {HTMLElement} item
   * @returns {string}
   */
  #itemLabel(item) {
    return item.getAttribute('story-id')
      || item.getAttribute('data-id')
      || item.textContent?.trim().slice(0, 40)
      || 'item';
  }

  /**
   * Convert a hyphenated or lowercase id to Title Case.
   * @param {string} str
   * @returns {string}
   */
  #titleCase(str) {
    return str
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}

registerComponent('story-map', StoryMap);
export { StoryMap };
