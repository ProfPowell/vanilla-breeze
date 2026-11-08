/**
 * page-watch: Bookmark + watch a page for content changes.
 *
 * Saves a page reference (URL, title, content hash) under VBStore namespace
 * `watches`. On the next visit, recomputes the content hash; if it differs
 * from the stored hash, fires a `notification-wc:new` event so the
 * notification panel can surface the change. Inspired by Medium's bookmark
 * — but actively monitors for updates instead of passively saving.
 *
 * Distinct from GoodURL: GoodURL watches *outbound* link health; page-watch
 * monitors *internal* page content drift.
 *
 * @example Inside <page-tools>
 *   <page-tools>
 *     <button data-watch-page>Watch for updates</button>
 *   </page-tools>
 *
 * Labels: a plain button's text node and title come from data-label-watch,
 * data-label-watching, data-label-action and data-label-stop on the button
 * (English defaults). Buttons marked data-watch-label-locked (watch-wc's
 * own button) keep their text and title; the owner repaints them from
 * aria-pressed.
 *
 * The module runs its side effects (initial enhancement, change check,
 * MutationObserver, document listeners) once per document even when two
 * copies are loaded (the autoload bundle and watch-wc's per-component chunk
 * both carry it): a global sentinel makes the second copy inert.
 *
 * Spec: admin/plans/april13-plan/page-watch.md
 */

import { VBStore } from '../lib/vb-store.js';
import { VBService, VBServiceError } from '../lib/vb-service.js';
import { fnv1a } from './highlights-init.js';

const SELECTOR = '[data-watch-page]';
const NS = 'watches';

/**
 * Server-side subscribe is opt-in via either a meta tag or a global flag,
 * to avoid every page-watch user spamming requests at a /go/notify endpoint
 * they have not stood up. Set one of:
 *
 *   <meta name="vb-page-watch-server" content="true">
 *   window.vbPageWatch = { serverSync: true };
 */
function serverSyncEnabled() {
  if (typeof window !== 'undefined' && /** @type {*} */ (window).vbPageWatch?.serverSync === true) {
    return true;
  }
  const meta = document.querySelector('meta[name="vb-page-watch-server"]');
  return meta?.getAttribute('content') === 'true';
}

/** Try to register a server-side subscription. Returns the id or null on failure. */
async function serverSubscribe(entry) {
  if (!serverSyncEnabled()) return null;
  try {
    const notify = new VBService('notify');
    const body = {
      url: entry.url,
      type: 'page-watch',
      notify: ['panel'],
    };
    const response = /** @type {{id?: string}|null} */ (await notify.post('/subscribe', body));
    return typeof response?.id === 'string' ? response.id : null;
  } catch (err) {
    const label = err instanceof VBServiceError ? `${err.status}` : String(err);
    console.warn('[page-watch] server subscribe failed; client-only watch in effect.', label);
    return null;
  }
}

/** Mirror the unsubscribe to the server if we have an id. Best-effort. */
async function serverUnsubscribe(subscriptionId) {
  if (!subscriptionId || !serverSyncEnabled()) return;
  try {
    await new VBService('notify').delete(`/subscribe/${encodeURIComponent(subscriptionId)}`);
  } catch (err) {
    const label = err instanceof VBServiceError ? `${err.status}` : String(err);
    console.warn('[page-watch] server unsubscribe failed; local state already cleared.', label);
  }
}

/** Pick the element whose content represents the "page". */
function findContentRoot() {
  return /** @type {HTMLElement|null} */ (
    document.querySelector('main') || document.querySelector('article') || document.body
  );
}

/**
 * Normalise a path so `/x`, `/x/` and `/x/index.html` share one key:
 * strip a trailing index.html/index.htm, then a trailing slash (root stays `/`).
 * @param {string} path
 * @returns {string}
 */
function normalisePath(path) {
  let p = (path || '/').replace(/\/index\.html?$/i, '/');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}

/**
 * Return the page identity used as VBStore key.
 * @returns {string}
 */
function pageKey() {
  return normalisePath(location.pathname);
}

/**
 * Move an entry stored under a pre-normalisation key (raw pathname,
 * with or without the trailing slash or index.html) to the normalised key.
 * Only the current page's variants are checked, so this costs at most
 * three store reads per page load.
 */
async function migrateLegacyKey() {
  const key = pageKey();
  const raw = location.pathname || '/';
  const base = key === '/' ? '' : key;
  const variants = new Set([raw, `${base}/`, `${base}/index.html`]);
  variants.delete(key);
  if (await VBStore.get(NS, key)) {
    for (const v of variants) await VBStore.remove(NS, v);
    return;
  }
  for (const v of variants) {
    const legacy = await VBStore.get(NS, v);
    if (!legacy) continue;
    await VBStore.set(NS, key, legacy);
    await VBStore.remove(NS, v);
    return;
  }
}

/**
 * Hash the current content root's text.
 * @returns {string} Content hash, or '' when no content root exists.
 */
function currentHash() {
  const root = findContentRoot();
  return root ? fnv1a(root.textContent || '') : '';
}

/** Read the page title for display in the watch list. */
function pageTitle() {
  return document.title || pageKey();
}

/**
 * @typedef {object} WatchEntry
 * @property {string} url
 * @property {string} title
 * @property {string} contentHash
 * @property {string} watchedAt
 * @property {string} lastChecked
 * @property {string|null} lastChanged
 * @property {string|null} subscriptionId  Server-side subscription ID, if any
 */

/** @type {Promise<void>|null} */
let migration = null;

/** @returns {Promise<WatchEntry|null>} */
async function readWatch() {
  migration ??= migrateLegacyKey().catch(() => {});
  await migration;
  return /** @type {WatchEntry|null} */ (await VBStore.get(NS, pageKey()));
}

/** @param {WatchEntry} entry */
async function writeWatch(entry) {
  await VBStore.set(NS, pageKey(), entry);
}

async function removeWatch() {
  await VBStore.remove(NS, pageKey());
}

/**
 * Read a label override from the button, falling back to English.
 * @param {HTMLElement} btn
 * @param {string} key
 * @param {string} fallback
 */
function label(btn, key, fallback) {
  return btn.getAttribute(`data-label-${key}`) ?? fallback;
}

/** Update a button's visual + accessible state to match watched/unwatched. */
function syncButton(btn, watched) {
  btn.setAttribute('aria-pressed', watched ? 'true' : 'false');
  btn.dataset.watching = watched ? '' : '';
  if (!watched) delete btn.dataset.watching;

  // Swap icon if an <icon-wc> child is present. Bookmark ↔ bookmark-check
  // reads unambiguously as "you marked this" when the check appears; the
  // previous eye / eye-off pair confused users because a slashed eye looks
  // like "watching is OFF" even when toggled on.
  const icon = btn.querySelector('icon-wc');
  if (icon) icon.setAttribute('name', watched ? 'bookmark-check' : 'bookmark');

  // If the button's text content is just a label (no element children), update it
  // Locked buttons (watch-wc's own) repaint text and title themselves from aria-pressed.
  if (btn.hasAttribute('data-watch-label-locked')) return;
  const textNode = [...btn.childNodes].find(n => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim());
  if (textNode) {
    textNode.textContent = watched
      ? label(btn, 'watching', 'Watching')
      : label(btn, 'watch', 'Watch for updates');
  }
  btn.setAttribute('title', watched
    ? label(btn, 'stop', 'Stop watching this page')
    : label(btn, 'action', 'Watch this page for content updates'));
}

/** Repaint every enhanced watch button from the store (sibling sync). */
async function resyncAll() {
  const watched = !!(await readWatch());
  for (const btn of document.querySelectorAll(`${SELECTOR}[data-watch-page-init]`)) {
    syncButton(/** @type {HTMLElement} */ (btn), watched);
  }
}

async function enhanceButton(btn) {
  if (btn.hasAttribute('data-watch-page-init')) return;
  btn.setAttribute('data-watch-page-init', '');
  btn.setAttribute('type', btn.getAttribute('type') || 'button');

  const existing = await readWatch();
  syncButton(btn, !!existing);

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const current = await readWatch();
    if (current) {
      // Optimistic local clear; server best-effort
      await removeWatch();
      syncButton(btn, false);
      btn.dispatchEvent(new CustomEvent('page-watch:remove', {
        bubbles: true, composed: true, detail: { url: current.url, subscriptionId: current.subscriptionId },
      }));
      serverUnsubscribe(current.subscriptionId);
    } else {
      const entry = {
        url: location.pathname || '/',
        title: pageTitle(),
        contentHash: currentHash(),
        watchedAt: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        lastChanged: null,
        subscriptionId: null,
      };
      // Write the local entry first so the UI reflects the new state immediately.
      await writeWatch(entry);
      syncButton(btn, true);
      btn.dispatchEvent(new CustomEvent('page-watch:add', {
        bubbles: true, composed: true, detail: { entry },
      }));
      // Then attempt server subscribe; if it returns an id, persist it back.
      const id = await serverSubscribe(entry);
      if (id) await writeWatch({ ...entry, subscriptionId: id });
    }
  });
}

/**
 * On every page load, if this URL is being watched, recompute the hash and
 * fire a notification when it changes.
 */
async function checkForChange() {
  const entry = await readWatch();
  if (!entry) return;

  const hash = currentHash();
  const checkedAt = new Date().toISOString();
  const previousHash = entry.contentHash;

  // Always update lastChecked
  const next = { ...entry, lastChecked: checkedAt };

  if (hash && hash !== previousHash) {
    next.contentHash = hash;
    next.lastChanged = checkedAt;
    await writeWatch(next);

    // Surface as a notification so notification-wc can render it
    const notification = {
      id: `page-watch:${entry.url}:${hash}`,
      type: 'watch',
      title: `Updated: ${entry.title}`,
      body: 'Content changed since your last visit.',
      url: entry.url,
      date: checkedAt,
      read: false,
      dismissed: false,
      priority: 'normal',
    };
    // notification-wc ingests this on document. Wait for it to be defined
    // (its panel listener is attached synchronously during upgrade) so a
    // fast change check on page load is not dropped before the bell exists.
    if (document.querySelector('notification-wc') && !customElements.get('notification-wc')) {
      await customElements.whenDefined('notification-wc');
    }
    document.dispatchEvent(new CustomEvent('notification-wc:new', {
      bubbles: true, composed: true, detail: { notification },
    }));
  } else {
    await writeWatch(next);
  }
}

/** Initialize watch buttons within a root and run the change check once. */
function initPageWatch(root = document) {
  for (const btn of root.querySelectorAll(SELECTOR)) {
    enhanceButton(/** @type {HTMLElement} */ (btn));
  }
  checkForChange();
}

/**
 * A page-watch:add/remove from anywhere (a button or the notification
 * panel's Watching tab) repaints every button. A remove that did not come
 * from a watch button (the bell's unwatch) also mirrors the unsubscribe to
 * the server — buttons already do that themselves.
 * @param {Event} e
 */
function onWatchChanged(e) {
  resyncAll();
  if (e.type !== 'page-watch:remove') return;
  const fromButton = e.target instanceof Element && e.target.matches(SELECTOR);
  if (!fromButton) {
    const detail = /** @type {CustomEvent} */ (e).detail;
    serverUnsubscribe(detail?.subscriptionId ?? null);
  }
}

const SENTINEL = Symbol.for('vb.page-watch-init');
const g = /** @type {Record<symbol, boolean>} */ (/** @type {unknown} */ (globalThis));

if (!g[SENTINEL]) {
  g[SENTINEL] = true;

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initPageWatch());
  } else {
    initPageWatch();
  }

  document.addEventListener('page-watch:add', onWatchChanged);
  document.addEventListener('page-watch:remove', onWatchChanged);

  // Watch for dynamically added watch buttons
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = /** @type {Element} */ (node);
        if (el.matches?.(SELECTOR)) enhanceButton(/** @type {HTMLElement} */ (el));
        el.querySelectorAll?.(SELECTOR).forEach(b => enhanceButton(/** @type {HTMLElement} */ (b)));
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

export { initPageWatch, readWatch, writeWatch, removeWatch, currentHash, normalisePath, pageKey };
