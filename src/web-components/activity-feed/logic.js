/**
 * activity-feed: WAI-ARIA Feed timeline of user actions.
 *
 * Author renders entries as `<article data-activity>` children, each carrying
 * its timestamp either as `data-time="ISO"` or as an authored
 * `<time datetime="ISO">` direct child (which also gives a no-JS time).
 * Component:
 *   - Decorates each entry with a relative-time badge (upgrading an authored
 *     `<time>` in place, or creating one from data-time)
 *   - Optionally groups entries under day / week date headings (data-group)
 *   - Optionally renders a left-rail avatar / icon (data-activity-avatar /
 *     data-activity-icon)
 *   - Wires the WAI-ARIA Feed pattern: role="feed", aria-labelledby /
 *     aria-describedby per article, aria-posinset / aria-setsize (-1 while
 *     more may load), aria-busy around load-more, keyboard nav
 *     (PageDown / PageUp, Ctrl+Home / Ctrl+End; Arrow / Home / End when the
 *     article itself has focus)
 *   - Optionally arms an IntersectionObserver sentinel for infinite scroll
 *     (data-infinite → activity-feed:load-more event with a done() callback)
 *   - Watches for new direct children via MutationObserver and decorates them
 *
 * Accessibility tree: date headings, the sentinel and the empty-state text are
 * DOM children of the host, but only <article>s are feed children. Headings
 * and the sentinel are aria-hidden (a heading's text is attached to the first
 * article of its group via aria-describedby); while the feed is empty the host
 * role is "group" so the empty-state paragraph is a legitimate child.
 *
 * Read-only / immutable per entry — distinct from `<comment-thread>`
 * (mutable + threaded) and `<chat-thread>` (real-time, sender-grouped).
 *
 * @attr {string}  aria-label       - Region label (default "Recent activity")
 * @attr {string}  data-group       - none (default) | day | week
 * @attr {boolean} data-infinite    - Enable IntersectionObserver sentinel.
 *                                    Remove it to end the feed.
 * @attr {string}  data-empty-text  - Empty-state text (default "No recent activity")
 *
 * Per-entry attributes / children (on `<article data-activity>`):
 *   data-time (ISO-8601) or a direct-child <time datetime="ISO">
 *   data-activity-avatar (optional URL)
 *   data-activity-icon (optional icon-wc name)
 *
 * @fires activity-feed:load-more  - Sentinel reached. detail.done() ends the
 *   busy state (also cleared automatically when new entries arrive).
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

/** Elements that can take sequential focus (for Ctrl+Home / Ctrl+End). */
const FOCUSABLE = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, iframe, [contenteditable=""], [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

let uid = 0;

class ActivityFeed extends VBElement {
  static observedAttributes = ['data-infinite'];

  /** @type {MutationObserver | null} */
  #observer = null;     // MutationObserver on direct children
  /** @type {HTMLElement | null} */
  #ioSentinel = null;   // element at the end for IntersectionObserver
  /** @type {IntersectionObserver | null} */
  #io = null;           // IntersectionObserver
  /** @type {ReturnType<typeof setInterval> | null} */
  #refreshTimer = null;
  /** @type {HTMLElement | null} */
  #emptyEl = null;
  /** Stable per-instance id prefix for generated ids. */
  #uid = `activity-feed-${++uid}`;
  #entrySeq = 0;
  /** True while a load-more is outstanding (aria-busy="true"). */
  #loading = false;
  /** Incremented per load-more so a stale done() cannot end a newer one. */
  #requestSeq = 0;
  /** Whether the component manages the host role (feed ⇄ group when empty). */
  #ownsRole = true;

  setup() {
    const role = this.getAttribute('role');
    this.#ownsRole = role === null || role === 'feed' || role === 'group';
    if (!this.hasAttribute('aria-label') && !this.hasAttribute('aria-labelledby')) {
      this.setAttribute('aria-label', 'Recent activity');
    }
    this.#loading = false;
    this.setAttribute('aria-busy', 'false');

    this.#scanEntries().forEach((e) => this.#decorateEntry(e));
    if (this.hasAttribute('data-infinite')) this.#armInfiniteScroll();
    this.#regroupAndRenumber();
    this.#updateEmptyState();

    // Watch for added / removed entries (server-rendered append, addEntry,
    // removeEntry, clear, ...). Only `article[data-activity]` mutations count:
    // #regroupAndRenumber itself removes and re-inserts the date headings and
    // moves the sentinel, and reacting to those would regroup forever.
    this.#observer = new MutationObserver((mutations) => {
      let changed = false;
      let added = false;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (isEntry(node)) {
            this.#decorateEntry(/** @type {HTMLElement} */ (node));
            changed = true;
            added = true;
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
      // New entries arriving after a load-more end the busy state even if the
      // author never calls done().
      if (added && this.#loading) this.#finishLoading();
    });
    this.#observer.observe(this, { childList: true });

    // Periodic relative-time refresh (own ticker so we don't depend on
    // time-relative auto-init seeing these articles before our setup).
    this.#refreshTimer = setInterval(() => this.#refreshTimes(), 60_000);

    this.listen(this, 'keydown', this.#onKeydown);
    this.listen(this, 'focusin', this.#onFocusin);
    return true;
  }

  teardown() {
    if (this.#refreshTimer !== null) clearInterval(this.#refreshTimer);
    this.#refreshTimer = null;
    this.#observer?.disconnect();
    this.#observer = null;
    this.#disarmInfiniteScroll();
    this.#loading = false;
    this.setAttribute('aria-busy', 'false');
  }

  /**
   * @param {string} name
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    // Parsed attributes fire before connect; setup() handles those.
    if (!this.hasAttribute('data-upgraded') || (oldValue === null) === (newValue === null)) return;
    if (name === 'data-infinite') {
      if (newValue !== null) this.#armInfiniteScroll();
      else {
        this.#disarmInfiniteScroll();
        if (this.#loading) this.#finishLoading();
      }
      this.#regroupAndRenumber();
    }
  }

  // ── Entry decoration ───────────────────────────────────────────────

  /** @returns {HTMLElement[]} */
  #scanEntries() {
    return /** @type {HTMLElement[]} */ ([...this.querySelectorAll(':scope > article[data-activity]')]);
  }

  /** @param {HTMLElement} entry */
  #decorateEntry(entry) {
    if (entry.dataset.decorated === '') return;
    entry.dataset.decorated = '';
    entry.setAttribute('tabindex', '-1');
    const base = `${this.#uid}-e${++this.#entrySeq}`;

    // An authored <time datetime> direct child is the entry's timestamp (and
    // its no-JS rendering). Pull it out before wrapping so it lands in the
    // time column; data-time, when also present, wins as the value.
    const authoredTime = /** @type {HTMLTimeElement | null} */ (
      entry.querySelector(':scope > time[datetime]'));
    authoredTime?.remove();
    const time = entry.dataset.time || authoredTime?.getAttribute('datetime') || '';
    if (time && !entry.dataset.time) entry.dataset.time = time;

    // Wrap author-provided content into a body element so all of it lives in
    // ONE grid cell (otherwise each inline child auto-places into its own
    // grid track, breaking the rail / body / time layout). It doubles as the
    // article's accessible name.
    const body = document.createElement('div');
    body.className = 'activity-body';
    body.id = `${base}-body`;
    while (entry.firstChild) body.appendChild(entry.firstChild);
    entry.appendChild(body);
    if (!entry.hasAttribute('aria-label') && !entry.hasAttribute('aria-labelledby')) {
      entry.setAttribute('aria-labelledby', body.id);
    }

    // Optional left-rail (avatar or icon) — prepended.
    const avatar = entry.dataset.activityAvatar;
    const icon = entry.dataset.activityIcon;
    if (avatar || icon) {
      const rail = document.createElement('div');
      rail.className = 'activity-rail';
      rail.setAttribute('aria-hidden', 'true');
      if (avatar) {
        // <user-avatar> is a CSS-only element: the picture is a child <img>
        // (decorative here — the rail is aria-hidden and the actor is named
        // in the entry text).
        const av = document.createElement('user-avatar');
        const actor = body.querySelector('[data-activity-actor]')?.textContent?.trim() || '';
        if (actor) av.setAttribute('name', actor);
        const img = document.createElement('img');
        img.src = avatar;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        av.appendChild(img);
        rail.appendChild(av);
      } else {
        const ic = document.createElement('icon-wc');
        ic.setAttribute('name', icon || '');
        rail.appendChild(ic);
      }
      entry.prepend(rail);
    }

    // Time badge — appended (the authored <time> upgraded, or a new one).
    if (time) {
      const t = authoredTime || document.createElement('time');
      t.classList.add('activity-time');
      t.setAttribute('datetime', time);
      if (!t.id) t.id = `${base}-time`;
      t.setAttribute('title', this.#formatAbsolute(time));
      t.textContent = formatRelative(new Date(time)) || t.textContent || time;
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
    // More may load while the feed is infinite: the APG says -1 (unknown).
    const setsize = this.#ioSentinel ? '-1' : String(entries.length);

    const group = this.getAttribute('data-group') || 'none';
    let lastKey = null;
    entries.forEach((entry, idx) => {
      entry.setAttribute('aria-posinset', String(idx + 1));
      entry.setAttribute('aria-setsize', setsize);

      const describedBy = [];
      if (group !== 'none' && entry.dataset.time) {
        const key = group === 'week' ? weekKey(entry.dataset.time) : dayKey(entry.dataset.time);
        if (key !== lastKey) {
          // Visual-only heading: the feed's children must all be articles,
          // so the heading is hidden from AT and its text instead describes
          // the first article of the group.
          const heading = document.createElement('h3');
          heading.setAttribute('data-activity-heading', '');
          heading.setAttribute('aria-hidden', 'true');
          heading.id = `${this.#uid}-g-${key}`;
          heading.className = 'activity-heading';
          heading.textContent = group === 'week' ? weekHeading(key) : dayHeading(key);
          this.insertBefore(heading, entry);
          describedBy.push(heading.id);
          lastKey = key;
        }
      }
      const time = entry.querySelector(':scope > time.activity-time');
      if (time?.id) describedBy.push(time.id);
      if (describedBy.length) entry.setAttribute('aria-describedby', describedBy.join(' '));
      else entry.removeAttribute('aria-describedby');
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
    // A feed may only own articles; while empty the host is a labelled group
    // so the empty-state paragraph is a valid, readable child.
    if (this.#ownsRole) this.setAttribute('role', total === 0 ? 'group' : 'feed');
  }

  // ── Keyboard nav (WAI-ARIA Feed pattern) ───────────────────────────

  /** @type {(e: KeyboardEvent) => void} */
  #onKeydown = (e) => {
    // Don't steal keys from text fields inside an entry.
    const t = /** @type {HTMLElement} */ (e.target);
    if (t.isContentEditable || t.matches?.('input, textarea, select')) return;
    const entries = this.#scanEntries();
    // Focus may be on the entry itself or on a link / button inside it.
    const current = this.#entryFor(e.target);
    const i = current ? entries.indexOf(current) : -1;
    if (i === -1) return;
    const onArticle = t === current;

    // APG feed keys: work from anywhere inside an article.
    if (e.ctrlKey && (e.key === 'Home' || e.key === 'End')) {
      const out = this.#focusableOutside(e.key === 'Home' ? 'before' : 'after');
      if (out) { e.preventDefault(); out.focus(); }
      return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey) return;

    let next = i;
    switch (e.key) {
      case 'PageDown': next = Math.min(entries.length - 1, i + 1); break;
      case 'PageUp':   next = Math.max(0, i - 1); break;
      // Convenience keys, only while the article itself has focus: on inner
      // links they would hijack scrolling / SR browse-mode reading.
      case 'ArrowDown': if (!onArticle) return; next = Math.min(entries.length - 1, i + 1); break;
      case 'ArrowUp':   if (!onArticle) return; next = Math.max(0, i - 1); break;
      case 'Home':      if (!onArticle) return; next = 0; break;
      case 'End':       if (!onArticle) return; next = entries.length - 1; break;
      default: return;
    }
    e.preventDefault();
    const target = entries[next];
    if (!target) return;
    this.#makeCurrent(target);
    target.focus();
  };

  /**
   * First focusable element after the feed, or the last one before it.
   * @param {'before' | 'after'} where
   * @returns {HTMLElement | null}
   */
  #focusableOutside(where) {
    const all = /** @type {HTMLElement[]} */ ([...document.querySelectorAll(FOCUSABLE)])
      .filter((el) => !this.contains(el) && (el.checkVisibility?.() ?? true));
    if (where === 'after') {
      return all.find((el) => this.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) || null;
    }
    const before = all.filter((el) => this.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING);
    return before.at(-1) || null;
  }

  // ── Infinite-scroll sentinel + aria-busy ───────────────────────────

  #armInfiniteScroll() {
    if (this.#ioSentinel || !('IntersectionObserver' in window)) return;
    // Guard against a stray sentinel (e.g. left from a previous upgrade).
    this.querySelectorAll(':scope > .activity-sentinel').forEach((n) => n.remove());
    this.#ioSentinel = document.createElement('div');
    this.#ioSentinel.className = 'activity-sentinel';
    this.#ioSentinel.setAttribute('aria-hidden', 'true');
    this.appendChild(this.#ioSentinel);
    this.#io = new IntersectionObserver((records) => {
      if (records.some((r) => r.isIntersecting)) this.#requestMore();
    }, { rootMargin: '200px' });
    this.#io.observe(this.#ioSentinel);
  }

  #disarmInfiniteScroll() {
    this.#io?.disconnect();
    this.#io = null;
    // Drop the sentinel too: setup() re-arms a fresh one on reconnect, so
    // leaving it here would stack one extra sentinel per move.
    this.#ioSentinel?.remove();
    this.#ioSentinel = null;
  }

  #requestMore() {
    if (this.#loading) return;
    this.#loading = true;
    this.setAttribute('aria-busy', 'true');
    const request = ++this.#requestSeq;
    const done = () => {
      if (this.#loading && request === this.#requestSeq) this.#finishLoading();
    };
    this.dispatchEvent(new CustomEvent('activity-feed:load-more', { bubbles: true, detail: { done } }));
  }

  #finishLoading() {
    this.#loading = false;
    this.setAttribute('aria-busy', 'false');
    // Re-arm: if the sentinel is still in view (the batch did not fill the
    // viewport), re-observing delivers a fresh intersection record.
    if (this.#io && this.#ioSentinel) {
      this.#io.unobserve(this.#ioSentinel);
      this.#io.observe(this.#ioSentinel);
    }
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
   * Snapshot of the current entries (a new array each read; not live).
   *
   * @returns {HTMLElement[]} Current entry <article> elements.
   */
  get entries() { return this.#scanEntries(); }

  /**
   * Read-only loading flag.
   *
   * @returns {boolean} True while a load-more is outstanding (mirrors aria-busy).
   */
  get loading() { return this.#loading; }
}

registerComponent('activity-feed', ActivityFeed);

export { ActivityFeed };
