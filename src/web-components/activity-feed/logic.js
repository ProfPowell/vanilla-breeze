/**
 * activity-feed: WAI-ARIA Feed timeline of user actions.
 *
 * Author renders entries as `<article data-activity data-time=ISO>` children.
 * Component:
 *   - Decorates each entry with a relative-time badge (`time-relative`)
 *   - Optionally groups entries under day / week date headings (data-group)
 *   - Optionally renders a left-rail avatar / icon (data-activity-avatar /
 *     data-activity-icon)
 *   - Wires WAI-ARIA Feed pattern: role="feed", aria-posinset / aria-setsize,
 *     keyboard nav (Arrow / Page / Home / End)
 *   - Optionally arms an IntersectionObserver sentinel for infinite scroll
 *     (data-infinite → activity-feed:load-more event)
 *   - Watches for new direct children via MutationObserver and decorates them
 *
 * Read-only / immutable per entry — distinct from `<comment-thread>`
 * (mutable + threaded) and `<chat-thread>` (real-time, sender-grouped).
 *
 * @attr {string}  aria-label       - Region label (default "Recent activity")
 * @attr {string}  data-group       - none (default) | day | week
 * @attr {boolean} data-infinite    - Enable IntersectionObserver sentinel
 * @attr {string}  data-empty-text  - Empty-state text (default "No recent activity")
 *
 * Per-entry attributes (on `<article data-activity>`):
 *   data-time (required, ISO-8601)
 *   data-activity-avatar (optional URL)
 *   data-activity-icon (optional icon-wc name)
 *
 * @fires activity-feed:load-more  - Sentinel reached; author appends new entries
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { formatRelative } from '../../lib/time-relative.js';

/** Day key for grouping ("2026-05-14"). */
function dayKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/** ISO week key ("2026-W20") — Mon-start, ISO 8601. */
function weekKey(d) {
  const dt = new Date(d);
  const day = (dt.getDay() + 6) % 7; // Mon=0..Sun=6
  const monday = new Date(dt);
  monday.setDate(dt.getDate() - day);
  // ISO week: Thursday in current week decides the year.
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${thursday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function dayHeading(key) {
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  if (key === today) return 'Today';
  if (key === yesterday) return 'Yesterday';
  // Parse "YYYY-MM-DD" as a LOCAL date — `new Date("2026-05-12")` parses as
  // UTC midnight which shifts a day backward in negative timezones.
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

/** @param {Node} node */
function isEntry(node) {
  return node.nodeType === 1 && /** @type {Element} */ (node).matches('article[data-activity]');
}

function weekHeading(key) {
  return `Week of ${key.replace('-W', ', week ')}`;
}

class ActivityFeed extends VBElement {
  /** @type {MutationObserver | null} */
  #observer = null;     // MutationObserver on direct children
  /** @type {HTMLElement | null} */
  #ioSentinel = null;   // <div> at the end for IntersectionObserver
  /** @type {IntersectionObserver | null} */
  #io = null;           // IntersectionObserver
  /** @type {ReturnType<typeof setInterval> | null} */
  #refreshTimer = null;
  /** @type {HTMLElement | null} */
  #emptyEl = null;

  setup() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'feed');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Recent activity');
    this.setAttribute('aria-busy', 'false');

    this.#scanEntries().forEach((e) => this.#decorateEntry(e));
    this.#regroupAndRenumber();
    this.#updateEmptyState();

    // Watch for added / removed entries (server-rendered append, addEntry,
    // removeEntry, clear, ...). Only `article[data-activity]` mutations count:
    // #regroupAndRenumber itself removes and re-inserts the date headings and
    // moves the sentinel, and reacting to those would regroup forever.
    this.#observer = new MutationObserver((mutations) => {
      let changed = false;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (isEntry(node)) {
            this.#decorateEntry(/** @type {HTMLElement} */ (node));
            changed = true;
          }
        }
        for (const node of m.removedNodes) {
          if (isEntry(node)) changed = true;
        }
      }
      if (changed) {
        this.#regroupAndRenumber();
        this.#updateEmptyState();
      }
    });
    this.#observer.observe(this, { childList: true });

    // Periodic relative-time refresh (own ticker so we don't depend on
    // time-relative auto-init seeing these articles before our setup).
    this.#refreshTimer = setInterval(() => this.#refreshTimes(), 60_000);

    if (this.hasAttribute('data-infinite')) this.#armInfiniteScroll();

    this.listen(this, 'keydown', this.#onKeydown);
    this.listen(this, 'focusin', this.#onFocusin);
    return true;
  }

  teardown() {
    if (this.#refreshTimer !== null) clearInterval(this.#refreshTimer);
    this.#refreshTimer = null;
    this.#observer?.disconnect();
    this.#observer = null;
    this.#io?.disconnect();
    this.#io = null;
    // Drop the sentinel too: setup() re-arms a fresh one on reconnect, so
    // leaving it here would stack one extra sentinel per move.
    this.#ioSentinel?.remove();
    this.#ioSentinel = null;
  }

  // ── Entry decoration ───────────────────────────────────────────────

  /** @returns {HTMLElement[]} */
  #scanEntries() {
    return /** @type {HTMLElement[]} */ ([...this.querySelectorAll(':scope > article[data-activity]')]);
  }

  #decorateEntry(entry) {
    if (entry.dataset.decorated === '') return;
    entry.dataset.decorated = '';
    entry.setAttribute('tabindex', '-1');

    // Wrap author-provided content into a body span so all of it lives in
    // ONE grid cell (otherwise each inline child auto-places into its own
    // grid track, breaking the rail / body / time layout).
    const body = document.createElement('div');
    body.className = 'activity-body';
    while (entry.firstChild) body.appendChild(entry.firstChild);
    entry.appendChild(body);

    // Optional left-rail (avatar or icon) — prepended.
    const avatar = entry.dataset.activityAvatar;
    const icon = entry.dataset.activityIcon;
    if (avatar || icon) {
      const rail = document.createElement('div');
      rail.className = 'activity-rail';
      rail.setAttribute('aria-hidden', 'true');
      if (avatar) {
        const av = document.createElement('user-avatar');
        av.setAttribute('src', avatar);
        const actor = body.querySelector('[data-activity-actor]')?.textContent || '';
        if (actor) av.setAttribute('name', actor);
        rail.appendChild(av);
      } else {
        const ic = document.createElement('icon-wc');
        ic.setAttribute('name', icon);
        rail.appendChild(ic);
      }
      entry.prepend(rail);
    }

    // Time badge — appended.
    const time = entry.dataset.time;
    if (time) {
      const t = document.createElement('time');
      t.className = 'activity-time';
      t.setAttribute('datetime', time);
      t.setAttribute('title', this.#formatAbsolute(time));
      t.textContent = formatRelative(new Date(time)) || time;
      entry.appendChild(t);
    }
  }

  #refreshTimes() {
    for (const t of this.querySelectorAll(':scope > article[data-activity] > time.activity-time')) {
      const dt = t.getAttribute('datetime');
      if (!dt) continue;
      const rel = formatRelative(new Date(dt));
      if (rel) t.textContent = rel;
    }
  }

  #formatAbsolute(iso) {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  }

  // ── Grouping + WAI-ARIA Feed numbering ─────────────────────────────

  #regroupAndRenumber() {
    // Drop existing component-rendered headings so we don't duplicate.
    this.querySelectorAll(':scope > [data-activity-heading]').forEach((h) => h.remove());

    const entries = this.#scanEntries();
    const total = entries.length;

    const group = this.getAttribute('data-group') || 'none';
    let lastKey = null;
    entries.forEach((entry, idx) => {
      entry.setAttribute('aria-posinset', String(idx + 1));
      entry.setAttribute('aria-setsize', String(total));

      if (group !== 'none' && entry.dataset.time) {
        const key = group === 'week' ? weekKey(entry.dataset.time) : dayKey(entry.dataset.time);
        if (key !== lastKey) {
          const heading = document.createElement('h3');
          heading.setAttribute('data-activity-heading', '');
          heading.setAttribute('role', 'heading');
          heading.setAttribute('aria-level', '3');
          heading.className = 'activity-heading';
          heading.textContent = group === 'week' ? weekHeading(key) : dayHeading(key);
          this.insertBefore(heading, entry);
          lastKey = key;
        }
      }
    });

    this.#syncRovingTabindex();
    this.#keepSentinelLast();
  }

  /** Keep the infinite-scroll sentinel as the last child (entries appended
   *  directly with appendChild would otherwise land after it). */
  #keepSentinelLast() {
    const s = this.#ioSentinel;
    if (s && s.parentNode === this && this.lastElementChild !== s) this.appendChild(s);
  }

  // ── Roving tabindex ────────────────────────────────────────────────

  /** Exactly one entry is in the tab order: the current one if it is still
   *  present, else the first. */
  #syncRovingTabindex() {
    const entries = this.#scanEntries();
    const current = entries.find((e) => e.getAttribute('tabindex') === '0') || entries[0];
    for (const e of entries) e.setAttribute('tabindex', e === current ? '0' : '-1');
  }

  /** @param {HTMLElement} entry */
  #makeCurrent(entry) {
    for (const e of this.#scanEntries()) e.setAttribute('tabindex', e === entry ? '0' : '-1');
  }

  /** @param {EventTarget | null} target @returns {HTMLElement | null} */
  #entryFor(target) {
    const el = /** @type {Element | null} */ (target instanceof Element ? target : null);
    const entry = /** @type {HTMLElement | null} */ (el?.closest('article[data-activity]') ?? null);
    return entry && entry.parentElement === this ? entry : null;
  }

  /** @type {(e: FocusEvent) => void} */
  #onFocusin = (e) => {
    const entry = this.#entryFor(e.target);
    if (entry && entry.getAttribute('tabindex') !== '0') this.#makeCurrent(entry);
  };

  // ── Empty state ────────────────────────────────────────────────────

  #updateEmptyState() {
    const total = this.#scanEntries().length;
    if (total === 0) {
      if (!this.#emptyEl) {
        this.#emptyEl = document.createElement('p');
        this.#emptyEl.className = 'activity-empty';
        this.#emptyEl.textContent = this.getAttribute('data-empty-text') || 'No recent activity';
        this.appendChild(this.#emptyEl);
        this.#keepSentinelLast();
      }
    } else {
      this.#emptyEl?.remove();
      this.#emptyEl = null;
    }
  }

  // ── Keyboard nav (WAI-ARIA Feed pattern) ───────────────────────────

  /** @type {(e: KeyboardEvent) => void} */
  #onKeydown = (e) => {
    // Don't steal arrow keys from text fields inside an entry.
    const t = /** @type {HTMLElement} */ (e.target);
    if (t.isContentEditable || t.matches?.('input, textarea, select')) return;
    const entries = this.#scanEntries();
    // Focus may be on the entry itself or on a link / button inside it.
    const current = this.#entryFor(e.target);
    const i = current ? entries.indexOf(current) : -1;
    if (i === -1) return;
    let next = i;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); next = Math.min(entries.length - 1, i + 1); break;
      case 'ArrowUp':   e.preventDefault(); next = Math.max(0, i - 1); break;
      case 'PageDown':  e.preventDefault(); next = Math.min(entries.length - 1, i + 5); break;
      case 'PageUp':    e.preventDefault(); next = Math.max(0, i - 5); break;
      case 'Home':      e.preventDefault(); next = 0; break;
      case 'End':       e.preventDefault(); next = entries.length - 1; break;
      default: return;
    }
    const target = entries[next];
    if (!target) return;
    this.#makeCurrent(target);
    target.focus();
  };

  // ── Infinite-scroll sentinel ───────────────────────────────────────

  #armInfiniteScroll() {
    if (!('IntersectionObserver' in window)) return;
    // Guard against a stray sentinel (e.g. left from a previous upgrade).
    this.querySelectorAll(':scope > .activity-sentinel').forEach((n) => n.remove());
    this.#ioSentinel = document.createElement('div');
    this.#ioSentinel.className = 'activity-sentinel';
    this.#ioSentinel.setAttribute('aria-hidden', 'true');
    this.appendChild(this.#ioSentinel);
    this.#io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          this.dispatchEvent(new CustomEvent('activity-feed:load-more', { bubbles: true }));
        }
      }
    }, { rootMargin: '200px' });
    this.#io.observe(this.#ioSentinel);
  }

  // ── Public API ─────────────────────────────────────────────────────

  /**
   * Append (or prepend) a new entry from data.
   *
   * @param {{ time: string, html: string, avatar?: string, icon?: string }} data
   * @param {{ prepend?: boolean }} [opts]
   * @returns {HTMLElement} The created entry <article>.
   */
  addEntry(data, opts = {}) {
    const article = document.createElement('article');
    article.setAttribute('data-activity', '');
    article.dataset.time = data.time;
    if (data.avatar) article.dataset.activityAvatar = data.avatar;
    if (data.icon) article.dataset.activityIcon = data.icon;
    article.innerHTML = data.html;

    if (opts.prepend) {
      const first = this.#scanEntries()[0];
      if (first) this.insertBefore(article, first);
      else this.appendChild(article);
    } else {
      // Insert before the sentinel if present, else append.
      if (this.#ioSentinel) this.insertBefore(article, this.#ioSentinel);
      else this.appendChild(article);
    }
    // MutationObserver picks up the rest (decorate + regroup + renumber).
    return article;
  }

  /** Remove a single entry element. */
  removeEntry(entry) {
    if (entry?.matches?.('article[data-activity]')) entry.remove();
  }

  /** Remove every entry (keeps the empty-state). */
  clear() {
    this.#scanEntries().forEach((e) => e.remove());
  }

  /**
   * Convenience getter.
   *
   * @returns {HTMLElement[]} Current entry <article> elements.
   */
  get entries() { return this.#scanEntries(); }
}

registerComponent('activity-feed', ActivityFeed);

export { ActivityFeed };
