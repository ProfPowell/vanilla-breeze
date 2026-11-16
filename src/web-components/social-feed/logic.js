/**
 * social-feed: one stream of posts from the site's Bluesky, Mastodon and
 * GitHub accounts, in a scrolling region.
 *
 * Cook fills an empty <social-feed> at build time: an <activity-feed> of
 * entries (<article data-activity data-id>), a "More on …" line and a state
 * JSON script. Without JavaScript that markup is the whole feature. With it:
 *   - once per page view, each account's first page is fetched from the
 *     service's public API, sending no credentials; posts not yet shown that
 *     fall inside the shown window are inserted in date order, and the
 *     counts on posts already shown are updated;
 *   - on activity-feed:load-more, the next batch comes from the state buffer
 *     first, then from each account that is not done, paged from its cursor
 *     (at most 3 pages per account per load, tag filter applied);
 *   - when every account is done and the buffer is empty, data-infinite is
 *     removed from the activity-feed so no more loads are asked for.
 * Entries are deduped by id across everything shown (a repost of a shown
 * post is the same id). Failures are silent: an account whose request fails
 * is marked done and the shown entries stay.
 *
 * Browser entries are rendered by the same renderEntry Cook uses, so they
 * match the built ones; renderEntry applies safeHttps and escaping, and the
 * buffer from the state JSON is never trusted as markup.
 *
 * @attr {string}  accounts    - Comma list of account keys (service:handle); default every visible feed account. Read by Cook at build time.
 * @attr {string}  tags        - Comma list of hashtags without #, matched case-insensitively. Read by Cook at build time.
 * @attr {number}  items       - First batch size, 1 to 50 (default 12); also the load-more batch size
 * @attr {string}  height      - Height of the scrolling list: a rem, em, px or vh length (default 32rem)
 * @attr {boolean} hide-counts - Present = no reply / repost / like counts
 *
 * CSS custom property: --social-feed-height, the max height of the scrolling
 * list (default 32rem, from this component's CSS). A valid `height` sets it
 * inline: Cook writes it at build and the element applies it when connected
 * or when the attribute changes. With no valid `height` nothing is written
 * inline, so a site stylesheet can set it.
 *
 * @example
 * <social-feed accounts="bluesky:alice.example.com" items="6"></social-feed>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import '../activity-feed/logic.js';
import { mergeItems, renderEntry } from './core.js';
import { fetchAccountPage, collectItems } from './fetch.js';

const SERVICE_NAMES = { bluesky: 'Bluesky', mastodon: 'Mastodon', github: 'GitHub' };
const HEIGHT = /^\d+(\.\d+)?(rem|em|px|vh)$/;
const DEFAULT_ITEMS = 12;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
/** @param {unknown} iso @returns {number} */
const timeOf = (iso) => (typeof iso === 'string' ? Date.parse(iso) || 0 : 0);
/** Newest first by parsed date (state dates are not guaranteed to be uniform ISO strings). */
const byDate = (a, b) => timeOf(b.date) - timeOf(a.date);
const doFetch = (url, opts) => globalThis.fetch(url, opts);

/**
 * @typedef {{ key: string, service: string, handle: string, did?: string, cursor?: string, done: boolean }} FeedAccount
 * @typedef {{ accounts: FeedAccount[], tags: string[], buffer: object[] }} FeedState
 */

/**
 * Read and check the state JSON Cook wrote. Anything malformed is dropped.
 * @param {Element} host
 * @returns {FeedState | null}
 */
function readState(host) {
  const script = host.querySelector(':scope > script.social-feed-state');
  if (!script) return null;
  let raw;
  try {
    raw = JSON.parse(script.textContent || '');
  } catch {
    return null;
  }
  if (!isObj(raw)) return null;
  const accounts = (Array.isArray(raw.accounts) ? raw.accounts : [])
    .filter((a) => isObj(a) && typeof a.key === 'string' && typeof a.service === 'string' && typeof a.handle === 'string')
    .map((a) => {
      /** @type {FeedAccount} */
      const out = { key: a.key, service: a.service, handle: a.handle, done: a.done === true };
      if (typeof a.did === 'string' && a.did) out.did = a.did;
      if (typeof a.cursor === 'string' && a.cursor) out.cursor = a.cursor;
      return out;
    });
  const tags = (Array.isArray(raw.tags) ? raw.tags : []).filter((t) => typeof t === 'string');
  const buffer = (Array.isArray(raw.buffer) ? raw.buffer : []).filter((i) => isObj(i) && typeof i.id === 'string');
  return { accounts, tags, buffer };
}

class SocialFeed extends VBElement {
  static observedAttributes = ['accounts', 'tags', 'items', 'height', 'hide-counts'];

  /** @type {FeedState | null} */
  #state = null;
  /** Serialises refresh and load-more so they never interleave. */
  #queue = Promise.resolve();
  /** @type {Promise<void> | null} */
  #refresh = null;

  setup() {
    if (document.readyState === 'loading' && !this.querySelector(':scope > script.social-feed-state')) {
      // Upgraded before the parser reached the children: try again once they exist.
      this.listen(document, 'DOMContentLoaded', () => this.#start(), { once: true });
    } else {
      this.#start();
    }
    this.listen(this, 'activity-feed:load-more', this.#onLoadMore);
    return true;
  }

  teardown() {}

  /**
   * @param {string} name
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'height' && oldValue !== newValue) this.#applyHeight();
  }

  /**
   * Settles when this page view's refresh has finished (or at once when there is none).
   * @returns {Promise<void>}
   */
  get refreshed() {
    return this.#refresh || Promise.resolve();
  }

  #start() {
    this.#applyHeight();
    const feed = this.#feed();
    // The scrolling list is a keyboard-reachable region.
    if (feed && !feed.hasAttribute('tabindex')) feed.setAttribute('tabindex', '0');
    if (!this.#state) this.#state = readState(this);
    if (this.#state && feed && !this.#refresh) {
      this.#refresh = this.#enqueue(() => this.#doRefresh());
    }
  }

  #applyHeight() {
    const h = (this.getAttribute('height') || '').trim();
    if (HEIGHT.test(h)) this.style.setProperty('--social-feed-height', h);
  }

  /** @returns {HTMLElement | null} */
  #feed() {
    return this.querySelector(':scope > activity-feed');
  }

  #batchSize() {
    const s = (this.getAttribute('items') || '').trim();
    const n = /^\d+$/.test(s) ? Number(s) : NaN;
    return n >= 1 && n <= 50 ? n : DEFAULT_ITEMS;
  }

  /** @param {() => Promise<void>} task */
  #enqueue(task) {
    const run = this.#queue.then(task).catch(() => {});
    this.#queue = run;
    return run;
  }

  /** @returns {Map<string, HTMLElement>} entries shown, by data-id */
  #shown() {
    const map = new Map();
    const feed = this.#feed();
    if (!feed) return map;
    for (const el of feed.querySelectorAll(':scope > article[data-activity][data-id]')) {
      map.set(el.getAttribute('data-id'), /** @type {HTMLElement} */ (el));
    }
    return map;
  }

  /** @param {Element} article */
  #dateOf(article) {
    return timeOf(article.querySelector('time[datetime]')?.getAttribute('datetime'));
  }

  /**
   * @param {object} item
   * @param {boolean} hideCounts
   * @returns {HTMLElement | null}
   */
  #render(item, hideCounts) {
    const html = renderEntry(item, {
      hideCounts,
      serviceName: SERVICE_NAMES[/** @type {any} */ (item).service] || /** @type {any} */ (item).service,
    });
    if (!html) return null;
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    return /** @type {HTMLElement | null} */ (tpl.content.firstElementChild);
  }

  /** Insert one item where its date puts it, keeping the list newest first. */
  #insert(item) {
    const feed = this.#feed();
    const el = feed && this.#render(item, this.hasAttribute('hide-counts'));
    if (!feed || !el) return false;
    const t = timeOf(item.date);
    const articles = [...feed.querySelectorAll(':scope > article[data-activity]')];
    const next = articles.find((a) => this.#dateOf(a) < t);
    if (next) feed.insertBefore(el, next);
    else if (articles.length) articles[articles.length - 1].after(el);
    else feed.prepend(el);
    return true;
  }

  /** Replace the counts of a shown entry with the item's fresh ones. */
  #updateCounts(article, item) {
    if (this.hasAttribute('hide-counts') || !isObj(item.counts)) return;
    const fresh = this.#render(item, false)?.querySelector('.social-feed-counts');
    if (!fresh) return;
    const old = article.querySelector('.social-feed-counts');
    if (old) old.replaceWith(fresh);
    else (article.querySelector(':scope > .activity-body') || article).append(fresh);
  }

  /**
   * Items not shown, filtered by the block's tags, deduped and newest first.
   * @param {object[][]} lists
   * @param {Map<string, HTMLElement>} shown
   */
  #unseen(lists, shown) {
    const tags = this.#state?.tags || [];
    return mergeItems(lists, { tags })
      .filter((i) => typeof i.id === 'string' && !shown.has(i.id))
      .sort(byDate);
  }

  /** End the feed when nothing more can come; start it when entries arrived. */
  #syncEnd() {
    const feed = this.#feed();
    const state = this.#state;
    if (!feed || !state) return;
    const hasEntries = !!feed.querySelector(':scope > article[data-activity]');
    if (hasEntries) this.querySelector(':scope > .social-feed-empty')?.remove();
    const more = state.buffer.length > 0 || state.accounts.some((a) => !a.done);
    if (!more || !hasEntries) feed.removeAttribute('data-infinite');
    else if (!feed.hasAttribute('data-infinite')) feed.setAttribute('data-infinite', '');
  }

  async #doRefresh() {
    const state = this.#state;
    if (!state) return;
    const pages = await Promise.all(state.accounts.map(async (account) => {
      try {
        const page = await fetchAccountPage(account, { fetch: doFetch, mode: 'browser' });
        // An account the build could not read has no cursor yet: page on from here.
        if (!account.cursor && !account.done) {
          if (page.cursor) account.cursor = page.cursor;
          account.done = page.done;
        }
        return page.items;
      } catch {
        account.done = true;
        return [];
      }
    }));

    const shown = this.#shown();
    for (const list of pages) {
      for (const item of list) {
        const article = shown.get(item.id);
        if (article) this.#updateCounts(article, item);
      }
    }

    const fresh = this.#unseen(pages, shown);
    const dates = [...shown.values()].map((a) => this.#dateOf(a));
    const oldest = dates.length ? Math.min(...dates) : null;
    // New posts inside the shown window go in; older ones wait in the buffer.
    const insert = oldest === null ? fresh.slice(0, this.#batchSize()) : fresh.filter((i) => timeOf(i.date) > oldest);
    const ids = new Set(insert.map((i) => i.id));
    for (const item of insert) this.#insert(item);
    state.buffer = this.#unseen([fresh.filter((i) => !ids.has(i.id)), state.buffer], this.#shown());
    this.#syncEnd();
  }

  /** @type {(e: Event) => void} */
  #onLoadMore = (e) => {
    const done = /** @type {CustomEvent} */ (e).detail?.done;
    this.#enqueue(() => this.#doLoadMore()).finally(() => {
      if (typeof done === 'function') done();
    });
  };

  async #doLoadMore() {
    const state = this.#state;
    if (!state) {
      this.#feed()?.removeAttribute('data-infinite');
      return;
    }
    const batch = this.#batchSize();
    let buffer = this.#unseen([state.buffer], this.#shown());
    const take = buffer.slice(0, batch);
    buffer = buffer.slice(batch);
    const need = batch - take.length;

    if (need > 0) {
      const tags = state.tags;
      const pages = await Promise.all(state.accounts.filter((a) => !a.done).map(async (account) => {
        try {
          const res = await collectItems(account, {
            fetch: doFetch, tags, want: need, mode: 'browser', cursor: account.cursor || null,
          });
          if (res.cursor) account.cursor = res.cursor;
          else delete account.cursor;
          account.done = res.done;
          return res.items;
        } catch {
          account.done = true;
          return [];
        }
      }));
      const taken = new Set(take.map((i) => i.id));
      const fetched = this.#unseen([...pages, buffer], this.#shown()).filter((i) => !taken.has(i.id));
      take.push(...fetched.slice(0, need));
      buffer = fetched.slice(need);
    }

    for (const item of take) this.#insert(item);
    state.buffer = buffer;
    this.#syncEnd();
  }
}

registerComponent('social-feed', /** @type {typeof HTMLElement} */ (/** @type {unknown} */ (SocialFeed)));

export { SocialFeed };
