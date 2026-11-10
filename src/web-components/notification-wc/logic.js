/**
 * notification-wc: Notification component with banner + panel modes
 *
 * Spec: admin/plans/april13-plan/notification-wc.md
 *
 * Two modes dispatched on the `mode` attribute:
 *
 *   <notification-wc mode="banner" persist="site-update-v3" variant="info">
 *     <p>We've launched v3.0! <a href="/changelog">See what's new</a></p>
 *   </notification-wc>
 *
 *   <notification-wc mode="panel">
 *     <article data-id="release-3.0" data-type="update" data-date="2026-04-10">
 *       <h4>v3.0 Released</h4>
 *       <p>New notification system.</p>
 *     </article>
 *   </notification-wc>
 *
 * Persistence goes through VBStore (namespace `notifications`). Dynamic
 * notifications go through VBService when `src` is a service role, or a
 * plain `fetch` when `src` is an absolute URL.
 *
 * Lifecycle: setup() is async-tolerant. Every await is followed by a
 * generation check, so a disconnect (or a move) mid-setup never leaves a
 * poll interval or document listener behind, and the panel/trigger are
 * reused on reconnect rather than duplicated.
 *
 * Link URLs (static <a href>, feed/setter `url`, watch-list `url`) are
 * rendered only when they resolve to http(s); anything else (javascript:,
 * data:, …) renders the row as a plain button.
 *
 * @attr {string} [mode="panel"] - "banner" or "panel"
 * @attr {string} persist - (banner) VBStore key used for dismiss state
 * @attr {string} [variant="info"] - (banner) info | success | warning | error
 * @attr {string} [position="top"] - (banner) top | bottom
 * @attr {number} [expires] - (banner) days until the banner re-shows after dismiss
 * @attr {string} [src] - (panel) URL or VBService role name for dynamic notifications
 * @attr {number} [poll] - (panel) polling interval in ms
 * @attr {string} [toast-new] - (panel) fire a toast on new dynamic notifications; value "#id" targets a specific <toast-msg> (bare = first in document)
 * @attr {string} [storage-key="notifications"] - (panel) VBStore namespace for read state
 * @attr {string} data-label-* - (panel) English string overrides, see LABELS
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { VBStore } from '../../lib/vb-store.js';
import { VBService, VBServiceError } from '../../lib/vb-service.js';

const TYPE_ICONS = {
  update: 'package',
  alert: 'alert-triangle',
  watch: 'eye',
  system: 'settings',
  message: 'mail',
  stewardship: 'shield',
};

/** Default English strings; each is overridable with data-label-<key>. */
const LABELS = {
  trigger: 'Notifications',
  unread: '{n} unread',
  title: 'Notifications',
  'mark-all': 'Mark all read',
  close: 'Close notifications',
  tabs: 'Notification categories',
  all: 'All',
  watching: 'Watching',
  empty: 'No notifications',
  'watch-empty': 'You aren’t watching any pages yet. Use the “Watch” button on a page to start.',
  'last-checked': 'Last checked: {date}',
  never: '—',
  changed: 'Changed',
  unwatch: 'Unwatch {title}',
  new: 'New notification',
  // Banner: visually hidden prefix so the variant isn't conveyed by colour alone
  'variant-info': 'Information:',
  'variant-success': 'Success:',
  'variant-warning': 'Warning:',
  'variant-error': 'Error:',
};

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/**
 * Allow only http(s) and relative URLs. Returns the original string when
 * safe, null otherwise (javascript:, data:, vbscript:, malformed…).
 * @param {unknown} url
 * @returns {string|null}
 */
function safeHref(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  try {
    const { protocol } = new URL(url, location.href);
    return protocol === 'http:' || protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * Locale-aware date formatting with the document language. Date-only
 * strings (YYYY-MM-DD) are formatted in UTC so they don't shift a day
 * west of Greenwich.
 * @param {string} value
 * @param {string|undefined} lang
 * @returns {string}
 */
function formatDate(value, lang) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  /** @type {Intl.DateTimeFormatOptions} */
  const opts = dateOnly
    ? { dateStyle: 'medium', timeZone: 'UTC' }
    : { dateStyle: 'medium', timeStyle: 'short' };
  try {
    return new Intl.DateTimeFormat(lang || undefined, opts).format(d);
  } catch {
    return new Intl.DateTimeFormat(undefined, opts).format(d);
  }
}

let panelSeq = 0;

class NotificationWc extends VBElement {
  static observedAttributes = ['variant', 'position'];

  /** Mode: "banner" | "panel" */
  #mode = 'panel';
  /** Setup generation — bumped by teardown so stale async setup bails. */
  #gen = 0;

  // ── Panel state ────────────────────────────────────────────────────
  /** @type {HTMLButtonElement|null} */
  #trigger = null;
  /** Author trigger's original accessible name (captured once). */
  #authorLabel = /** @type {string|null} */ (null);
  /** @type {HTMLElement|null} */
  #panel = null;
  /** @type {HTMLElement|null} */
  #badge = null;
  /** @type {Set<string>} Read IDs */
  #readIds = new Set();
  /** @type {Array<any>} Dynamic notifications (merged over static children) */
  #dynamic = [];
  #isOpen = false;
  /** @type {ReturnType<typeof setInterval> | null} */
  #pollTimer = null;
  /** @type {Set<string>} Seen notification ids for toast debounce */
  #seenIds = new Set();
  /** "all" | "watching" — which tab is visible */
  #activeTab = 'all';
  /** @type {Array<{key: string, data: any, timestamp: number}>} Watch list rows */
  #watches = [];
  /** @type {Array<any>} Notifications ingested from document-level notification-wc:new (page-watch) */
  #ingested = [];

  setup() {
    const gen = ++this.#gen;
    this.#mode = this.getAttribute('mode') === 'banner' ? 'banner' : 'panel';
    if (this.#mode === 'banner') this.#setupBanner(gen);
    else this.#setupPanel(gen);
    return true;
  }

  teardown() {
    this.#gen++;
    if (this.#pollTimer != null) {
      clearInterval(this.#pollTimer);
      this.#pollTimer = null;
    }
    if (this.#isOpen) {
      this.#isOpen = false;
      this.#hideSheet();
      if (this.#panel) this.#panel.hidden = true;
      this.#trigger?.setAttribute('aria-expanded', 'false');
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || this.#mode !== 'banner' || !this.hasAttribute('data-upgraded')) return;
    if (name === 'variant') {
      this.dataset.variant = newValue || 'info';
      this.#syncVariantPrefix();
    }
    if (name === 'position') this.dataset.position = newValue || 'top';
  }

  /** True while the setup that started as `gen` is still current. */
  #alive(gen) {
    return gen === this.#gen && this.isConnected;
  }

  #label(key, vars = {}) {
    let text = this.getAttribute(`data-label-${key}`) ?? LABELS[key] ?? key;
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
    return text;
  }

  #toastTarget() {
    const ref = (this.getAttribute('toast-new') || '').trim();
    let el = null;
    if (ref) {
      try { el = document.querySelector(ref); } catch { el = null; }
      if (el && el.localName !== 'toast-msg') el = null;
    }
    return el ?? document.querySelector('toast-msg');
  }

  #lang() {
    return /** @type {HTMLElement|null} */ (this.closest('[lang]'))?.lang || document.documentElement.lang || undefined;
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Read the current dynamic notification list (panel mode). Each entry
   * mirrors what was assigned via the setter or fetched from `src`.
   *
   * @returns {any[]} A copy of the notification records.
   */
  get notifications() {
    return [...this.#dynamic];
  }

  /**
   * Replace the dynamic notification list (panel mode only). Each entry:
   * `{ id, title, body?, date?, type?, url?, dismissed? }` — the same shape
   * as the `src` feed. Entries merge over static <article> children by id.
   * Re-renders the panel and updates the unread badge. Banner mode ignores
   * this setter.
   *
   * Emits notification-wc:notifications-changed { notifications, source: 'property' }.
   */
  set notifications(value) {
    if (this.#mode !== 'panel') return;
    this.#dynamic = Array.isArray(value) ? value : [];
    this.#renderList();
    this.dispatchEvent(new CustomEvent('notification-wc:notifications-changed', {
      detail: { notifications: this.#dynamic, source: 'property' },
      bubbles: true,
    }));
  }

  // ══════════════════════════════════════════════════════════════════
  // Banner mode
  // ══════════════════════════════════════════════════════════════════

  async #setupBanner(gen) {
    const persist = this.getAttribute('persist');
    if (!persist) {
      console.warn('[notification-wc] banner mode requires a persist attribute');
    }
    this.dataset.mode = 'banner';
    this.dataset.variant = this.getAttribute('variant') || 'info';
    this.dataset.position = this.getAttribute('position') || 'top';
    this.#syncVariantPrefix();

    // Hide if previously dismissed (and not yet expired)
    if (persist) {
      const expiresDays = Number(this.getAttribute('expires') ?? '');
      const maxAge = Number.isFinite(expiresDays) && expiresDays > 0
        ? expiresDays * 86_400_000
        : undefined;
      const state = /** @type {any} */ (await VBStore.get('notifications', persist, maxAge ? { maxAge } : undefined));
      if (!this.#alive(gen)) return;
      if (state && state.dismissed) {
        this.hidden = true;
        return;
      }
    }

    // Hook the dismiss button(s)
    const dismiss = this.querySelector('[value="dismiss"], [data-dismiss]');
    if (dismiss) this.listen(dismiss, 'click', this.#handleDismiss);
  }

  /**
   * Banner variant is shown by colour; give assistive tech (and forced-colors
   * users, via the same text) a word for it. One idempotent visually-hidden
   * span, placed before the banner's first text-bearing child.
   */
  #syncVariantPrefix() {
    const variant = this.dataset.variant || 'info';
    let prefix = /** @type {HTMLElement|null} */ (this.querySelector(':scope [data-variant-prefix]'));
    if (!prefix) {
      prefix = document.createElement('span');
      prefix.className = 'visually-hidden';
      prefix.setAttribute('data-variant-prefix', '');
      const target = this.querySelector(':scope > :is(p, strong, span, h2, h3, h4)') || this;
      target.prepend(prefix);
    }
    prefix.textContent = `${this.#label(`variant-${variant}`)} `;
  }

  #handleDismiss = async (e) => {
    e.preventDefault();
    const hadFocus = this.contains(document.activeElement);
    const persist = this.getAttribute('persist');
    this.hidden = true;
    if (hadFocus) this.#focusAfterBanner();
    if (persist) {
      await VBStore.set('notifications', persist, { dismissed: true });
    }
    this.dispatchEvent(new CustomEvent('notification-wc:dismiss', {
      bubbles: true,
      composed: true,
      detail: { id: persist },
    }));
  };

  /** After hiding a focused banner, land focus on <main> (or <body>'s first heading) instead of <body>. */
  #focusAfterBanner() {
    const target = /** @type {HTMLElement|null} */ (
      document.querySelector('main, [role="main"]') || document.querySelector('h1'));
    if (!target) return;
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
    target.focus({ preventScroll: true });
  }

  // ══════════════════════════════════════════════════════════════════
  // Panel mode
  // ══════════════════════════════════════════════════════════════════

  async #setupPanel(gen) {
    this.dataset.mode = 'panel';
    // Attached before the first await so a page-watch change event that
    // fires right after upgrade is not missed.
    this.listen(document, 'notification-wc:new', this.#onExternalNew);
    await this.#loadReadState();
    if (!this.#alive(gen)) return;
    this.#renderTrigger();
    this.#renderPanel();

    this.listen(document, 'click', this.#handleOutsideClick);
    this.listen(document, 'keydown', this.#handleEscape);
    this.listen(this, 'focusout', this.#handleFocusOut);
    this.listen(document, 'page-watch:add', this.#onWatchesChanged);
    this.listen(document, 'page-watch:remove', this.#onWatchesChanged);

    await this.#loadWatches(); // pre-populate the Watching tab so its count is accurate before first open
    if (!this.#alive(gen)) return;

    if (this.getAttribute('src')) {
      await this.#fetchDynamic(gen);
      if (!this.#alive(gen)) return;
      const poll = Number(this.getAttribute('poll'));
      if (Number.isFinite(poll) && poll > 0) {
        this.#pollTimer = setInterval(() => this.#fetchDynamic(gen), poll);
      }
    }
  }

  async #loadReadState() {
    const ns = this.getAttribute('storage-key') || 'notifications';
    const list = await VBStore.get(ns, 'read-ids');
    if (Array.isArray(list)) this.#readIds = new Set(list.filter((x) => typeof x === 'string'));
  }

  async #saveReadState() {
    const ns = this.getAttribute('storage-key') || 'notifications';
    await VBStore.set(ns, 'read-ids', Array.from(this.#readIds));
  }

  // ── Rendering ──────────────────────────────────────────────────────

  #renderTrigger() {
    // Accept an author-supplied trigger (or our own minted one on reconnect).
    this.#trigger = /** @type {HTMLButtonElement|null} */ (this.querySelector(':scope > [data-trigger]'));
    if (!this.#trigger) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-trigger', '');
      btn.className = 'notification-trigger';
      btn.innerHTML = '<icon-wc name="bell" size="sm" aria-hidden="true"></icon-wc><span class="notification-badge" aria-hidden="true" hidden>0</span>';
      this.#trigger = btn;
      this.prepend(btn);
    } else if (!this.#trigger.classList.contains('notification-trigger') && this.#authorLabel === null) {
      const clone = /** @type {HTMLElement} */ (this.#trigger.cloneNode(true));
      clone.querySelector('.notification-badge')?.remove();
      this.#authorLabel = (this.#trigger.getAttribute('aria-label') || clone.textContent || '').trim();
    }
    let badge = /** @type {HTMLElement | null} */ (this.#trigger.querySelector('.notification-badge'));
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'notification-badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.hidden = true;
      this.#trigger.appendChild(badge);
    }
    this.#badge = badge;
    this.#trigger.setAttribute('aria-haspopup', 'dialog');
    this.#trigger.setAttribute('aria-expanded', 'false');
    this.listen(this.#trigger, 'click', this.#handleTriggerClick);
  }

  #renderPanel() {
    // Reuse the panel built by a previous setup (reconnect / move).
    let panel = /** @type {HTMLElement|null} */ (this.querySelector(':scope > .notification-panel'));
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'notification-panel';
      panel.id = `notification-panel-${++panelSeq}-${Math.random().toString(36).slice(2, 7)}`;
      this.appendChild(panel);
    }
    this.#panel = panel;
    const id = panel.id;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', `${id}-title`);
    panel.tabIndex = -1;
    panel.hidden = true;
    this.#trigger?.setAttribute('aria-controls', id);

    const all = this.#activeTab === 'all';
    panel.innerHTML = `
      <header class="notification-header">
        <strong id="${id}-title">${escapeHtml(this.#label('title'))}</strong>
        <button type="button" class="notification-mark-all">${escapeHtml(this.#label('mark-all'))}</button>
        <button type="button" class="notification-close" aria-label="${escapeHtml(this.#label('close'))}"><icon-wc name="x" size="sm" aria-hidden="true"></icon-wc></button>
      </header>
      <div class="notification-tabs" role="tablist" aria-label="${escapeHtml(this.#label('tabs'))}">
        <button type="button" role="tab" id="${id}-tab-all" data-tab="all" aria-controls="${id}-all" aria-selected="${all}" tabindex="${all ? 0 : -1}">${escapeHtml(this.#label('all'))}</button>
        <button type="button" role="tab" id="${id}-tab-watching" data-tab="watching" aria-controls="${id}-watching" aria-selected="${!all}" tabindex="${all ? -1 : 0}">${escapeHtml(this.#label('watching'))} <span class="notification-tab-count" hidden>0</span></button>
      </div>
      <div class="notification-tabpanel" role="tabpanel" id="${id}-all" aria-labelledby="${id}-tab-all" data-tab-panel="all"${all ? '' : ' hidden'}>
        <ul class="notification-list" role="list"></ul>
        <p class="notification-footer" hidden><em>${escapeHtml(this.#label('empty'))}</em></p>
      </div>
      <div class="notification-tabpanel" role="tabpanel" id="${id}-watching" aria-labelledby="${id}-tab-watching" data-tab-panel="watching"${all ? ' hidden' : ''}>
        <ul class="notification-watch-list" role="list"></ul>
      </div>
    `;

    // One delegated listener set on the panel (survives list re-renders).
    this.listen(panel, 'click', this.#handlePanelClick);
    this.listen(panel, 'keydown', this.#handlePanelKeydown);

    this.#renderList();
    this.#renderWatchList();
  }

  /** Produce the ordered list of notifications from static children + dynamic merge. */
  #collectNotifications() {
    const staticArticles = Array.from(this.querySelectorAll(':scope > article'));
    const byId = new Map();

    for (const el of staticArticles) {
      const id = el.getAttribute('data-id') || el.id || `static-${byId.size}`;
      const type = el.getAttribute('data-type') || 'update';
      const date = el.getAttribute('data-date') || '';
      const title = el.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim() || id;
      const bodyEl = el.querySelector('p');
      const body = bodyEl?.textContent?.trim() || '';
      const link = /** @type {HTMLAnchorElement|null} */ (el.querySelector('a'));
      byId.set(id, {
        id, type, date, title, body, url: link?.getAttribute('href') || null, source: 'static',
      });
    }

    for (const n of [...this.#ingested, ...this.#dynamic]) {
      if (!n || typeof n.id !== 'string') continue;
      if (n.dismissed) { byId.delete(n.id); continue; }
      byId.set(n.id, { ...byId.get(n.id), ...n, source: 'dynamic' });
    }

    return Array.from(byId.values()).sort((a, b) => {
      const da = a.date ? Date.parse(a.date) || 0 : 0;
      const db = b.date ? Date.parse(b.date) || 0 : 0;
      return db - da;
    });
  }

  #renderList() {
    if (!this.#panel) return;
    const list = /** @type {HTMLElement|null} */ (this.#panel.querySelector('.notification-list'));
    const footer = /** @type {HTMLElement|null} */ (this.#panel.querySelector('.notification-footer'));
    if (!list) return;

    const items = this.#collectNotifications();
    const lang = this.#lang();
    list.innerHTML = items.map((n) => this.#renderItem(n, lang)).join('');
    if (footer) footer.hidden = items.length > 0;
    this.#updateBadge(items);
  }

  #renderItem(n, lang) {
    const iconName = TYPE_ICONS[n.type] || 'bell';
    const read = this.#readIds.has(n.id);
    const time = n.date ? formatDate(n.date, lang) : '';
    // Row content is phrasing-only (it lives inside <a>/<button>).
    const inner = `
      <icon-wc class="notification-type-icon" name="${escapeHtml(iconName)}" size="sm" aria-hidden="true"></icon-wc>
      <span class="notification-body">
        <strong class="notification-title">${escapeHtml(n.title)}</strong>
        ${n.body ? `<span class="notification-text">${escapeHtml(n.body)}</span>` : ''}
        ${time ? `<time datetime="${escapeHtml(n.date)}">${escapeHtml(time)}</time>` : ''}
      </span>
    `;
    const href = safeHref(n.url);
    const tag = href ? 'a' : 'button';
    const extra = href ? `href="${escapeHtml(href)}"` : 'type="button"';
    return `<li data-notification-id="${escapeHtml(n.id)}" data-type="${escapeHtml(n.type || 'update')}"${read ? ' data-read' : ''}>
      <${tag} class="notification-row" ${extra}>${inner}</${tag}>
    </li>`;
  }

  #updateBadge(items = this.#collectNotifications()) {
    if (!this.#badge || !this.#trigger) return;
    const unread = items.filter((n) => !this.#readIds.has(n.id)).length;
    const icon = this.#trigger.querySelector('icon-wc');
    if (unread > 0) {
      this.#badge.textContent = String(unread);
      this.#badge.hidden = false;
      icon?.setAttribute('name', 'bell-dot');
      // Reflected for styling from outside (a menu button's unread dot)
      this.setAttribute('data-unread', String(unread));
    } else {
      this.#badge.hidden = true;
      icon?.setAttribute('name', 'bell');
      this.removeAttribute('data-unread');
    }
    // The badge is aria-hidden; the count lives in the trigger's name.
    const base = this.#authorLabel || this.#label('trigger');
    this.#trigger.setAttribute('aria-label',
      unread > 0 ? `${base}, ${this.#label('unread', { n: unread })}` : base);
  }

  // ── Watch list (page-watch surface) ────────────────────────────────

  /**
   * Ingest a notification dispatched on the document by another script
   * (page-watch-init's "content changed" record). Events a notification-wc
   * emits itself for its own fetch path are ignored; ids are deduped.
   * @param {Event} e
   */
  #onExternalNew = (e) => {
    if (e.target instanceof Element && e.target.localName === 'notification-wc') return;
    const n = /** @type {CustomEvent} */ (e).detail?.notification;
    if (!n || typeof n.id !== 'string') return;
    if (this.#ingested.some((x) => x.id === n.id)) return;
    this.#ingested.push(n);
    this.#renderList();
  };

  #onWatchesChanged = () => { this.#loadWatches(); };

  /** Hydrate the in-memory watch list from VBStore namespace `watches`. */
  async #loadWatches() {
    const gen = this.#gen;
    let rows;
    try {
      rows = await VBStore.list('watches');
    } catch {
      rows = [];
    }
    if (!this.#alive(gen)) return;
    this.#watches = Array.isArray(rows) ? rows : [];
    this.#renderWatchList();
  }

  #renderWatchList() {
    if (!this.#panel) return;
    const list = /** @type {HTMLElement|null} */ (this.#panel.querySelector('.notification-watch-list'));
    const tabCount = /** @type {HTMLElement|null} */ (this.#panel.querySelector('.notification-tab-count'));
    if (!list) return;

    const lang = this.#lang();
    list.innerHTML = this.#watches.map((row) => this.#renderWatchItem(row, lang)).join('') ||
      `<li class="notification-empty"><em>${escapeHtml(this.#label('watch-empty'))}</em></li>`;

    if (tabCount) {
      const count = this.#watches.length;
      tabCount.textContent = String(count);
      tabCount.hidden = count === 0;
    }
  }

  #renderWatchItem(row, lang) {
    const data = /** @type {{url?: string, title?: string, lastChecked?: string, lastChanged?: string|null}} */ (row.data || {});
    const url = data.url || row.key;
    const title = data.title || url;
    const lastChecked = data.lastChecked ? formatDate(data.lastChecked, lang) : this.#label('never');
    const changed = !!data.lastChanged;
    const href = safeHref(url);
    const inner = `
        <icon-wc class="notification-type-icon" name="eye" size="sm" aria-hidden="true"></icon-wc>
        <span class="notification-body">
          <strong class="notification-title">${escapeHtml(title)}${changed ? ` <span class="notification-changed-badge">${escapeHtml(this.#label('changed'))}</span>` : ''}</strong>
          <span class="notification-text">${escapeHtml(url)}</span>
          <time>${escapeHtml(this.#label('last-checked', { date: lastChecked }))}</time>
        </span>`;
    const rowEl = href
      ? `<a class="notification-watch-row" href="${escapeHtml(href)}">${inner}</a>`
      : `<span class="notification-watch-row">${inner}</span>`;
    return `<li class="notification-watch-item"${changed ? ' data-changed' : ''}>
      ${rowEl}
      <button type="button" class="notification-unwatch" data-watch-unwatch data-watch-key="${escapeHtml(row.key)}" aria-label="${escapeHtml(this.#label('unwatch', { title }))}">
        <icon-wc name="x" size="xs" aria-hidden="true"></icon-wc>
      </button>
    </li>`;
  }

  // ── Tabs ───────────────────────────────────────────────────────────

  #selectTab(tab, { focus = false } = {}) {
    if (!this.#panel) return;
    this.#activeTab = tab;
    for (const t of this.#panel.querySelectorAll('[role="tab"]')) {
      const active = /** @type {HTMLElement} */ (t).dataset.tab === tab;
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      t.setAttribute('tabindex', active ? '0' : '-1');
      if (active && focus) /** @type {HTMLElement} */ (t).focus();
    }
    for (const p of this.#panel.querySelectorAll('[data-tab-panel]')) {
      /** @type {HTMLElement} */ (p).hidden = /** @type {HTMLElement} */ (p).dataset.tabPanel !== tab;
    }
  }

  #handlePanelKeydown = (e) => {
    const tab = /** @type {HTMLElement} */ (e.target).closest?.('[role="tab"]');
    if (!tab || !this.#panel) return;
    const tabs = /** @type {HTMLElement[]} */ ([...this.#panel.querySelectorAll('[role="tab"]')]);
    const i = tabs.indexOf(/** @type {HTMLElement} */ (tab));
    const rtl = getComputedStyle(this.#panel).direction === 'rtl';
    let next = -1;
    if (e.key === 'ArrowRight') next = rtl ? i - 1 : i + 1;
    else if (e.key === 'ArrowLeft') next = rtl ? i + 1 : i - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    next = (next + tabs.length) % tabs.length;
    const name = tabs[next].dataset.tab;
    if (name) this.#selectTab(name, { focus: true });
  };

  // ── Events ─────────────────────────────────────────────────────────

  #handlePanelClick = (e) => {
    const target = /** @type {Element} */ (e.target);
    const tab = /** @type {HTMLElement|null} */ (target.closest('[role="tab"]'));
    if (tab?.dataset.tab) { this.#selectTab(tab.dataset.tab); return; }
    if (target.closest('.notification-mark-all')) { this.#handleMarkAllRead(); return; }
    if (target.closest('.notification-close')) { this.#close({ restoreFocus: true }); return; }
    const unwatch = /** @type {HTMLElement|null} */ (target.closest('[data-watch-unwatch]'));
    if (unwatch) { this.#handleUnwatch(e, unwatch); return; }
    const row = target.closest('.notification-list .notification-row');
    if (row) this.#handleRowClick(/** @type {HTMLElement} */ (row));
  };

  async #handleUnwatch(e, btn) {
    e.preventDefault();
    e.stopPropagation();
    const key = btn.getAttribute('data-watch-key');
    if (!key || !this.#panel) return;
    const buttons = [...this.#panel.querySelectorAll('[data-watch-unwatch]')];
    const index = buttons.indexOf(btn);
    const row = this.#watches.find(w => w.key === key);
    await VBStore.remove('watches', key);
    this.#watches = this.#watches.filter(w => w.key !== key);
    this.#renderWatchList();
    // Keep focus in the list: next row's unwatch button, else the tab.
    const remaining = /** @type {HTMLElement[]} */ ([...this.#panel.querySelectorAll('[data-watch-unwatch]')]);
    const focusTarget = remaining[Math.min(index, remaining.length - 1)]
      || /** @type {HTMLElement|null} */ (this.#panel.querySelector('[role="tab"][data-tab="watching"]'));
    focusTarget?.focus();
    this.dispatchEvent(new CustomEvent('page-watch:remove', {
      bubbles: true, composed: true,
      detail: { url: row?.data?.url || key, subscriptionId: row?.data?.subscriptionId || null },
    }));
  }

  #handleTriggerClick = (e) => {
    e.stopPropagation();
    this.#isOpen ? this.#close() : this.#open();
  };

  #handleOutsideClick = (e) => {
    if (!this.#isOpen) return;
    if (!this.contains(/** @type {Node} */ (e.target))) {
      this.#close();
      return;
    }
    // Sheet: a click on the backdrop is dispatched to the panel itself.
    if (e.target === this.#panel && this.#panel?.matches(':popover-open')) {
      const r = this.#panel.getBoundingClientRect();
      const { clientX: x, clientY: y } = /** @type {MouseEvent} */ (e);
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) this.#close({ restoreFocus: true });
    }
  };

  /**
   * Whether the panel opens as a sheet (top layer, with a backdrop) instead
   * of a dropdown under the bell: on a narrow screen, or when the bell sits
   * inside a popover such as a mobile menu, where a dropdown would be
   * clipped or squeezed.
   */
  #asSheet() {
    return !!this.closest('[popover]') || matchMedia('(width < 37.5rem)').matches;
  }

  /** Tabbing out of the component closes the (non-modal) panel. */
  #handleFocusOut = (e) => {
    const next = /** @type {Node|null} */ (e.relatedTarget);
    if (this.#isOpen && next && !this.contains(next)) this.#close();
  };

  #handleEscape = (e) => {
    if (e.key === 'Escape' && this.#isOpen) {
      e.preventDefault();
      this.#close({ restoreFocus: true });
    }
  };

  async #handleRowClick(row) {
    const li = /** @type {HTMLElement|null} */ (row.closest('[data-notification-id]'));
    const id = li?.getAttribute('data-notification-id');
    if (!li || !id || this.#readIds.has(id)) return;
    this.#readIds.add(id);
    li.setAttribute('data-read', '');
    this.#updateBadge();
    this.dispatchEvent(new CustomEvent('notification-wc:read', {
      bubbles: true, composed: true, detail: { id },
    }));
    await this.#saveReadState();
  }

  async #handleMarkAllRead() {
    const items = this.#collectNotifications();
    for (const n of items) this.#readIds.add(n.id);
    this.#renderList();
    for (const n of items) {
      this.dispatchEvent(new CustomEvent('notification-wc:read', {
        bubbles: true, composed: true, detail: { id: n.id },
      }));
    }
    await this.#saveReadState();
  }

  // ── Open / close ───────────────────────────────────────────────────

  #open() {
    if (!this.#panel) return;
    this.#isOpen = true;
    this.#panel.hidden = false;
    if (this.#asSheet() && typeof this.#panel.showPopover === 'function') {
      // Manual popover: top layer, above an open menu, which stays open.
      this.#panel.setAttribute('popover', 'manual');
      this.#panel.showPopover();
    }
    this.#trigger?.setAttribute('aria-expanded', 'true');
    this.#panel.focus({ preventScroll: true });
    this.#loadWatches(); // refresh watch list each time the panel opens
    this.dispatchEvent(new CustomEvent('notification-wc:open', { bubbles: true, composed: true }));
  }

  #close({ restoreFocus = false } = {}) {
    if (!this.#panel) return;
    const focusInside = this.#panel.contains(document.activeElement);
    this.#isOpen = false;
    this.#hideSheet();
    this.#panel.hidden = true;
    this.#trigger?.setAttribute('aria-expanded', 'false');
    // Return focus to the trigger when it would otherwise be stranded.
    if (restoreFocus || focusInside) this.#trigger?.focus();
    this.dispatchEvent(new CustomEvent('notification-wc:close', { bubbles: true, composed: true }));
  }

  /** Take the panel out of the top layer (no-op when it is a dropdown). */
  #hideSheet() {
    const panel = this.#panel;
    if (!panel?.hasAttribute('popover')) return;
    if (panel.matches(':popover-open')) panel.hidePopover();
    panel.removeAttribute('popover');
  }

  // ── Dynamic fetch ──────────────────────────────────────────────────

  async #fetchDynamic(gen) {
    const src = this.getAttribute('src');
    if (!src) return;
    let payload;
    let status = 0;
    try {
      if (src.startsWith('http') || src.startsWith('/')) {
        const response = await fetch(src, { headers: { accept: 'application/json' } });
        status = response.status;
        if (!response.ok) throw new Error(`${response.status}`);
        payload = await response.json();
      } else {
        const svc = new VBService(src);
        payload = await svc.get('/');
      }
    } catch (err) {
      // 404 / 503 are expected when no /go/* backend is running (e.g. on
      // local dev or before KV is provisioned). Static fallback children
      // already render in the panel — no need to spam the console.
      const errStatus = err instanceof VBServiceError ? err.status : status;
      if (errStatus === 404 || errStatus === 503) return;
      const label = err instanceof VBServiceError ? `${err.status}` : String(err);
      console.warn('[notification-wc] failed to fetch', src, label);
      return;
    }
    if (!this.#alive(gen)) return;
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.notifications) ? payload.notifications : [];

    // Detect new-to-us entries for toast emission
    const prevSeen = this.#seenIds;
    const firstLoad = prevSeen.size === 0;
    // toast-new="#id" targets a specific <toast-msg>; a bare toast-new
    // (or a selector that matches nothing) uses the first one in the document.
    const toastEl = this.hasAttribute('toast-new')
      ? /** @type {{ show?: Function } | null} */ (this.#toastTarget())
      : null;

    for (const n of list) {
      if (!n?.id) continue;
      if (!prevSeen.has(n.id)) {
        this.dispatchEvent(new CustomEvent('notification-wc:new', {
          bubbles: true, composed: true, detail: { notification: n },
        }));
        if (!firstLoad && toastEl && typeof toastEl.show === 'function') {
          toastEl.show({
            message: n.title || n.body || this.#label('new'),
            variant: n.type === 'alert' || n.type === 'stewardship' ? 'warning' : 'info',
            duration: 5000,
          });
        }
      }
      prevSeen.add(n.id);
    }

    this.#dynamic = list;
    this.#renderList();
  }
}

registerComponent('notification-wc', NotificationWc);

export { NotificationWc };
