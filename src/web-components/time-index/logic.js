import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { updateRelativeTimes } from '../../lib/time-relative.js';

/**
 * time-index: Interactive changelog/timeline component
 *
 * Enhances a static changelog with relative dates, an order select, a version
 * filter and an optional "recently updated pages" feed.
 *
 * Entry model:
 * - One `.changelog-entries` container: its `li` / `article` / `section`
 *   children are the entries (sorted and filtered).
 * - Several `.changelog-entries` (one per release): the top-level children of
 *   the host that hold them are the releases. Sorting reverses the releases
 *   and the entries inside each; filtering shows or hides whole releases.
 *
 * An entry's version is its `data-version`, else the text of its own
 * `.version-tag`, else an id of the form `v2-1-0` (read as "v2.1.0").
 *
 * @attr {boolean} versions                 - Add a version filter select
 * @attr {string}  updates-src              - URL of a JSON array of { title, href|url, modified|date } for a "recently updated pages" feed
 * @attr {string}  data-label-controls      - Accessible name of the controls nav (default "Timeline controls")
 * @attr {string}  data-label-order         - Label of the order select (default "Order")
 * @attr {string}  data-label-newest        - Option for the authored order (default "Newest first")
 * @attr {string}  data-label-oldest        - Option for the reversed order (default "Oldest first")
 * @attr {string}  data-label-version       - Visible label of the version select (default "Version")
 * @attr {string}  data-label-filter        - Accessible name of the version select (default "Filter by version")
 * @attr {string}  data-label-all           - "All" option text (default "All versions")
 * @attr {string}  data-label-status        - Filter announcement; {count}, {total}, {version} (default "Showing {count} of {total} entries for {version}")
 * @attr {string}  data-label-status-all    - Unfiltered announcement; {total} (default "Showing all {total} entries")
 * @attr {string}  data-label-recent        - Feed heading (default "Recently updated pages")
 *
 * @example
 * <time-index versions>
 *   <ol class="changelog-entries">
 *     <li><h3><span class="version-tag">v2.1.0</span> …</h3> …</li>
 *   </ol>
 * </time-index>
 */

let timeIndexSeq = 0;

/** Allow only http(s) URLs (relative ones resolve against the page). */
function safeHref(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const url = new URL(raw, document.baseURI);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Absolute, localised date for a datetime attribute. Date-only values are
 * formatted in UTC so they never shift a day in negative-offset zones.
 */
function absoluteDate(dt, lang) {
  const date = new Date(dt);
  if (Number.isNaN(date.getTime())) return '';
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dt);
  try {
    return new Intl.DateTimeFormat(lang || undefined, dateOnly
      ? { dateStyle: 'long', timeZone: 'UTC' }
      : { dateStyle: 'long', timeStyle: 'short' }).format(date);
  } catch {
    return dt;
  }
}

class TimeIndex extends VBElement {
  #uid = `ti${++timeIndexSeq}`;
  /** @type {boolean} */
  #isReversed = false;
  #feedPending = false;

  setup() {
    this.#titleTimes(this);
    updateRelativeTimes(this);
    this.#addControls();

    const updatesSrc = this.getAttribute('updates-src');
    if (updatesSrc && !this.#feedPending && !this.querySelector(':scope > section[data-recent-pages]')) {
      this.#loadRecentUpdates(updatesSrc);
    }
  }

  /**
   * Author-overridable UI string from a data-label-* attribute.
   * @param {string} key dataset key suffix, e.g. 'Sort' for data-label-sort
   * @param {string} fallback
   */
  #label(key, fallback) {
    return this.dataset[`label${key}`] || fallback;
  }

  /** Keep the absolute date reachable once relative text replaces it. */
  #titleTimes(root) {
    for (const el of root.querySelectorAll('time[data-relative][datetime]')) {
      if (el.hasAttribute('title') || el.closest('page-info')) continue;
      const lang = el.closest('[lang]')?.getAttribute('lang') || '';
      const abs = absoluteDate(el.getAttribute('datetime'), lang);
      if (abs) el.setAttribute('title', abs);
    }
  }

  /** @returns {HTMLElement[]} every .changelog-entries container */
  #containers() {
    return /** @type {HTMLElement[]} */ ([...this.querySelectorAll('.changelog-entries')]);
  }

  /** Entries of one container: its li / article / section children. */
  #entriesOf(container) {
    return /** @type {HTMLElement[]} */ ([...container.children]
      .filter(el => /^(LI|ARTICLE|SECTION)$/.test(el.tagName)));
  }

  /** The units the filter acts on (see the entry model above). */
  #units() {
    const containers = this.#containers();
    if (containers.length === 1) return this.#entriesOf(containers[0]);
    const units = new Set();
    for (const c of containers) {
      let top = c;
      while (top.parentElement && top.parentElement !== this) top = top.parentElement;
      if (top.parentElement === this) units.add(top);
    }
    return /** @type {HTMLElement[]} */ ([...units]);
  }

  /** @param {HTMLElement} el */
  #versionOf(el) {
    if (el.dataset.version) return el.dataset.version.trim();
    const tag = el.querySelector('.version-tag')?.textContent?.trim();
    if (tag) return tag;
    const m = /^v(\d+(?:-[0-9a-z]+)*)$/i.exec(el.id);
    return m ? `v${m[1].replace(/-/g, '.')}` : '';
  }

  #addControls() {
    // Reconnect guard: VBElement re-runs setup() on every reconnect, which
    // would prepend a second controls <nav>. Skip if ours is already in place.
    // The listeners below are plain addEventListener on persisted nodes, so
    // they survive the reconnect.
    if (this.querySelector(':scope > [data-timeline-controls]')) return;

    const controls = document.createElement('nav');
    controls.setAttribute('data-timeline-controls', '');
    controls.setAttribute('aria-label', this.#label('Controls', 'Timeline controls'));

    /* Order: a select that names the order in force. (A lone "Oldest
       first" toggle read as the current state, not as the action.) The
       authored order is taken to be newest first. */
    const order = document.createElement('select');
    order.setAttribute('data-timeline-order', '');
    order.append(
      new Option(this.#label('Newest', 'Newest first'), 'newest'),
      new Option(this.#label('Oldest', 'Oldest first'), 'oldest'),
    );
    order.value = this.#isReversed ? 'oldest' : 'newest';
    order.addEventListener('change', () => {
      if ((order.value === 'oldest') !== this.#isReversed) this.#toggleSort();
    });
    controls.append(this.#labelled(this.#label('Order', 'Order'), order));

    /* Version filter */
    if (this.hasAttribute('versions')) {
      const versions = [...new Set(this.#units().map(u => this.#versionOf(u)).filter(Boolean))];
      if (versions.length > 0) {
        const select = document.createElement('select');
        select.setAttribute('data-timeline-version', '');
        select.setAttribute('aria-label', this.#label('Filter', 'Filter by version'));
        select.append(new Option(this.#label('All', 'All versions'), ''));
        for (const v of versions) select.append(new Option(v, v));

        const status = document.createElement('output');
        status.className = 'visually-hidden';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.setAttribute('data-timeline-status', '');

        select.addEventListener('change', () => {
          status.textContent = this.#filterByVersion(select.value);
        });
        controls.append(this.#labelled(this.#label('Version', 'Version'), select), status);
      }
    }

    // Sit above the entries they act on: before the top-level child that
    // holds the first .changelog-entries (the container itself, or the first
    // release section when each release has its own). Fall back to the top.
    let anchor = this.querySelector('.changelog-entries');
    while (anchor && anchor.parentElement !== this) anchor = anchor.parentElement;
    if (anchor) anchor.before(controls);
    else this.prepend(controls);
  }

  /** Wrap a control in a <label> with visible text. */
  #labelled(text, control) {
    const label = document.createElement('label');
    const span = document.createElement('span');
    span.textContent = text;
    label.append(span, control);
    return label;
  }

  /** Move nodes into each other's slots in reverse order (gaps preserved). */
  #reverseInPlace(nodes) {
    if (nodes.length < 2) return;
    const slots = nodes.map(n => {
      const mark = document.createComment('');
      n.before(mark);
      return mark;
    });
    const reversed = [...nodes].reverse();
    slots.forEach((mark, i) => mark.replaceWith(reversed[i]));
  }

  #toggleSort() {
    this.#isReversed = !this.#isReversed;
    const containers = this.#containers();
    if (containers.length !== 1) this.#reverseInPlace(this.#units());
    for (const c of containers) this.#reverseInPlace(this.#entriesOf(c));
  }

  /**
   * Show only the units whose version matches; '' shows all.
   * @returns {string} announcement for the live region
   */
  #filterByVersion(version) {
    const units = this.#units();
    let shown = 0;
    for (const unit of units) {
      unit.hidden = !!version && this.#versionOf(unit) !== version;
      if (!unit.hidden) shown++;
    }
    const total = String(units.length);
    if (!version) {
      return this.#label('StatusAll', 'Showing all {total} entries').replaceAll('{total}', total);
    }
    return this.#label('Status', 'Showing {count} of {total} entries for {version}')
      .replaceAll('{count}', String(shown))
      .replaceAll('{total}', total)
      .replaceAll('{version}', version);
  }

  async #loadRecentUpdates(url) {
    this.#feedPending = true;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const pages = await res.json();
      if (!Array.isArray(pages) || !pages.length) return;
      // A reconnect while the fetch was in flight must not add a second feed.
      if (this.querySelector(':scope > section[data-recent-pages]')) return;

      const headingId = `${this.#uid}-recent-heading`;
      const section = document.createElement('section');
      section.setAttribute('data-recent-pages', '');
      section.setAttribute('aria-labelledby', headingId);

      const heading = document.createElement('h2');
      heading.id = headingId;
      heading.textContent = this.#label('Recent', 'Recently updated pages');

      const list = document.createElement('ul');
      list.className = 'recent-pages';
      for (const p of pages.slice(0, 10)) {
        if (!p || typeof p !== 'object') continue;
        const href = safeHref(p.href ?? p.url);
        const title = typeof p.title === 'string' ? p.title.trim() : '';
        if (!href || !title) continue;

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = href;
        a.textContent = title;
        li.append(a);

        const when = p.modified ?? p.date;
        if (typeof when === 'string' && !Number.isNaN(new Date(when).getTime())) {
          const time = document.createElement('time');
          time.dateTime = when;
          time.setAttribute('data-relative', '');
          time.textContent = when;
          li.append(time);
        }
        list.append(li);
      }
      if (!list.children.length) return;

      section.append(heading, list);
      this.append(section);
      this.#titleTimes(section);
      updateRelativeTimes(section);
    } catch {
      /* Network or JSON error — skip the feed */
    } finally {
      this.#feedPending = false;
    }
  }
}

registerComponent('time-index', TimeIndex);

export { TimeIndex };
