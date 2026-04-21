/**
 * notification-wc: Notification component with banner + panel modes
 *
 * Spec: admin/r-n-d/april13-plan/notification-wc.md
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
 * @attr {string} [mode="panel"] - "banner" or "panel"
 * @attr {string} persist - (banner) VBStore key used for dismiss state
 * @attr {string} [variant="info"] - (banner) info | success | warning | error
 * @attr {string} [position="top"] - (banner) top | bottom
 * @attr {number} [expires] - (banner) days until the banner re-shows after dismiss
 * @attr {string} [src] - (panel) URL or VBService role name for dynamic notifications
 * @attr {number} [poll] - (panel) polling interval in ms
 * @attr {boolean} [toast-new] - (panel) fire a toast on new dynamic notifications
 * @attr {string} [storage-key="notifications"] - (panel) VBStore namespace for read state
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

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

class NotificationWc extends VBElement {
  /** Mode: "banner" | "panel" */
  #mode = 'panel';

  // ── Banner state ───────────────────────────────────────────────────
  /** @type {HTMLElement|null} */
  #dismissBtn = null;

  // ── Panel state ────────────────────────────────────────────────────
  /** @type {HTMLButtonElement|null} */
  #trigger = null;
  /** @type {HTMLElement|null} */
  #panel = null;
  /** @type {HTMLElement|null} */
  #badge = null;
  /** @type {Set<string>} Read IDs */
  #readIds = new Set();
  /** @type {Array<object>} Dynamic notifications (merged over static children) */
  #dynamic = [];
  #isOpen = false;
  /** @type {number|null} */
  #pollTimer = null;
  /** @type {Set<string>} Seen notification ids for toast debounce */
  #seenIds = new Set();

  setup() {
    this.#mode = this.getAttribute('mode') === 'banner' ? 'banner' : 'panel';
    return this.#mode === 'banner' ? this.#setupBanner() : this.#setupPanel();
  }

  teardown() {
    if (this.#pollTimer != null) {
      clearInterval(this.#pollTimer);
      this.#pollTimer = null;
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // Banner mode
  // ══════════════════════════════════════════════════════════════════

  async #setupBanner() {
    const persist = this.getAttribute('persist');
    if (!persist) {
      console.warn('[notification-wc] banner mode requires a persist attribute');
    }
    this.dataset.mode = 'banner';
    this.dataset.variant = this.getAttribute('variant') || 'info';
    this.dataset.position = this.getAttribute('position') || 'top';

    // Hide if previously dismissed (and not yet expired)
    if (persist) {
      const expiresDays = Number(this.getAttribute('expires') ?? '');
      const maxAge = Number.isFinite(expiresDays) && expiresDays > 0
        ? expiresDays * 86_400_000
        : undefined;
      const state = await VBStore.get('notifications', persist, maxAge ? { maxAge } : undefined);
      if (state && state.dismissed) {
        this.hidden = true;
        return;
      }
    }

    // Hook the dismiss button(s)
    const dismiss = this.querySelector('[value="dismiss"], [data-dismiss]');
    if (dismiss) {
      this.#dismissBtn = /** @type {HTMLElement} */ (dismiss);
      this.listen(dismiss, 'click', this.#handleDismiss);
    }
  }

  #handleDismiss = async (e) => {
    e.preventDefault();
    const persist = this.getAttribute('persist');
    if (persist) {
      await VBStore.set('notifications', persist, { dismissed: true });
    }
    this.dispatchEvent(new CustomEvent('notification-wc:dismiss', {
      bubbles: true,
      composed: true,
      detail: { id: persist },
    }));
    this.hidden = true;
  };

  // ══════════════════════════════════════════════════════════════════
  // Panel mode
  // ══════════════════════════════════════════════════════════════════

  async #setupPanel() {
    this.dataset.mode = 'panel';
    await this.#loadReadState();
    this.#renderTrigger();
    this.#renderPanel();
    this.#updateBadge();

    this.listen(document, 'click', this.#handleOutsideClick);
    this.listen(document, 'keydown', this.#handleEscape);

    if (this.getAttribute('src')) {
      await this.#fetchDynamic();
      const poll = Number(this.getAttribute('poll'));
      if (Number.isFinite(poll) && poll > 0) {
        this.#pollTimer = /** @type {unknown} */ (setInterval(() => this.#fetchDynamic(), poll));
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
    // Accept an author-supplied trigger; otherwise mint a bell button.
    this.#trigger = /** @type {HTMLButtonElement|null} */ (this.querySelector(':scope > [data-trigger]'));
    if (!this.#trigger) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-trigger', '');
      btn.className = 'notification-trigger';
      btn.setAttribute('aria-label', 'Notifications');
      btn.innerHTML = `<icon-wc name="bell" size="sm"></icon-wc><span class="notification-badge" hidden>0</span>`;
      this.#trigger = btn;
      this.prepend(btn);
    } else {
      // Ensure a badge exists inside the author's trigger
      let badge = this.#trigger.querySelector('.notification-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'notification-badge';
        badge.hidden = true;
        this.#trigger.appendChild(badge);
      }
    }
    this.#badge = this.#trigger.querySelector('.notification-badge');
    this.#trigger.setAttribute('aria-haspopup', 'dialog');
    this.#trigger.setAttribute('aria-expanded', 'false');
    this.listen(this.#trigger, 'click', this.#handleTriggerClick);
  }

  #renderPanel() {
    this.#panel = document.createElement('div');
    this.#panel.className = 'notification-panel';
    this.#panel.setAttribute('role', 'dialog');
    this.#panel.setAttribute('aria-label', 'Notifications');
    this.#panel.hidden = true;

    const panelId = `notification-panel-${crypto.randomUUID().slice(0, 8)}`;
    this.#panel.id = panelId;
    this.#trigger?.setAttribute('aria-controls', panelId);

    this.#panel.innerHTML = `
      <header class="notification-header">
        <strong>Notifications</strong>
        <button type="button" class="notification-mark-all">Mark all read</button>
      </header>
      <ul class="notification-list" role="list"></ul>
      <footer class="notification-footer" hidden>
        <em>No notifications</em>
      </footer>
    `;
    this.appendChild(this.#panel);

    const markAll = this.#panel.querySelector('.notification-mark-all');
    if (markAll) this.listen(markAll, 'click', this.#handleMarkAllRead);

    this.#renderList();
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

    for (const n of this.#dynamic) {
      if (!n || typeof n.id !== 'string') continue;
      if (n.dismissed) { byId.delete(n.id); continue; }
      byId.set(n.id, { ...byId.get(n.id), ...n, source: 'dynamic' });
    }

    return Array.from(byId.values()).sort((a, b) => {
      const da = a.date ? Date.parse(a.date) : 0;
      const db = b.date ? Date.parse(b.date) : 0;
      return db - da;
    });
  }

  #renderList() {
    if (!this.#panel) return;
    const list = /** @type {HTMLElement|null} */ (this.#panel.querySelector('.notification-list'));
    const footer = /** @type {HTMLElement|null} */ (this.#panel.querySelector('.notification-footer'));
    if (!list) return;

    const items = this.#collectNotifications();
    list.innerHTML = items.map((n) => this.#renderItem(n)).join('');
    if (footer) footer.hidden = items.length > 0;

    // Click a row to mark read and navigate if it has a URL
    for (const row of list.querySelectorAll('[data-notification-id]')) {
      this.listen(row, 'click', this.#handleRowClick);
    }
    this.#updateBadge();
  }

  #renderItem(n) {
    const iconName = TYPE_ICONS[n.type] || 'bell';
    const read = this.#readIds.has(n.id);
    const time = n.date ? new Date(n.date).toLocaleString() : '';
    const inner = `
      <icon-wc class="notification-type-icon" name="${escapeHtml(iconName)}" size="sm"></icon-wc>
      <div class="notification-body">
        <h4>${escapeHtml(n.title)}</h4>
        ${n.body ? `<p>${escapeHtml(n.body)}</p>` : ''}
        ${time ? `<time datetime="${escapeHtml(n.date)}">${escapeHtml(time)}</time>` : ''}
      </div>
    `;
    const tag = n.url ? 'a' : 'button';
    const extra = n.url ? `href="${escapeHtml(n.url)}"` : 'type="button"';
    return `<li role="listitem" data-notification-id="${escapeHtml(n.id)}" data-type="${escapeHtml(n.type || 'update')}"${read ? ' data-read' : ''}>
      <${tag} class="notification-row" ${extra}>${inner}</${tag}>
    </li>`;
  }

  #updateBadge() {
    if (!this.#badge) return;
    const items = this.#collectNotifications();
    const unread = items.filter((n) => !this.#readIds.has(n.id)).length;
    if (unread > 0) {
      this.#badge.textContent = String(unread);
      this.#badge.hidden = false;
      this.#trigger?.querySelector('icon-wc')?.setAttribute('name', 'bell-dot');
    } else {
      this.#badge.hidden = true;
      this.#trigger?.querySelector('icon-wc')?.setAttribute('name', 'bell');
    }
  }

  // ── Events ─────────────────────────────────────────────────────────

  #handleTriggerClick = (e) => {
    e.stopPropagation();
    this.#isOpen ? this.#close() : this.#open();
  };

  #handleOutsideClick = (e) => {
    if (this.#isOpen && !this.contains(/** @type {Node} */ (e.target))) {
      this.#close();
    }
  };

  #handleEscape = (e) => {
    if (e.key === 'Escape' && this.#isOpen) {
      e.preventDefault();
      this.#close();
      this.#trigger?.focus();
    }
  };

  #handleRowClick = async (e) => {
    const li = /** @type {HTMLElement|null} */ ((/** @type {Element} */ (e.currentTarget)).closest('[data-notification-id]'));
    if (!li) return;
    const id = li.getAttribute('data-notification-id');
    if (!id) return;
    if (!this.#readIds.has(id)) {
      this.#readIds.add(id);
      li.setAttribute('data-read', '');
      await this.#saveReadState();
      this.#updateBadge();
      this.dispatchEvent(new CustomEvent('notification-wc:read', {
        bubbles: true, composed: true, detail: { id },
      }));
    }
  };

  #handleMarkAllRead = async () => {
    const items = this.#collectNotifications();
    for (const n of items) this.#readIds.add(n.id);
    await this.#saveReadState();
    this.#renderList();
    for (const n of items) {
      this.dispatchEvent(new CustomEvent('notification-wc:read', {
        bubbles: true, composed: true, detail: { id: n.id },
      }));
    }
  };

  // ── Open / close ───────────────────────────────────────────────────

  #open() {
    if (!this.#panel) return;
    this.#isOpen = true;
    this.#panel.hidden = false;
    this.#trigger?.setAttribute('aria-expanded', 'true');
    this.dispatchEvent(new CustomEvent('notification-wc:open', { bubbles: true, composed: true }));
  }

  #close() {
    if (!this.#panel) return;
    this.#isOpen = false;
    this.#panel.hidden = true;
    this.#trigger?.setAttribute('aria-expanded', 'false');
    this.dispatchEvent(new CustomEvent('notification-wc:close', { bubbles: true, composed: true }));
  }

  // ── Dynamic fetch ──────────────────────────────────────────────────

  async #fetchDynamic() {
    const src = this.getAttribute('src');
    if (!src) return;
    let payload;
    try {
      if (src.startsWith('http') || src.startsWith('/')) {
        const response = await fetch(src, { headers: { accept: 'application/json' } });
        if (!response.ok) throw new Error(`${response.status}`);
        payload = await response.json();
      } else {
        const svc = new VBService(src);
        payload = await svc.get('/');
      }
    } catch (err) {
      const label = err instanceof VBServiceError ? `${err.status}` : String(err);
      console.warn('[notification-wc] failed to fetch', src, label);
      return;
    }
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.notifications) ? payload.notifications : [];

    // Detect new-to-us entries for toast emission
    const prevSeen = this.#seenIds;
    const firstLoad = prevSeen.size === 0;
    const toastEl = this.hasAttribute('toast-new')
      ? /** @type {{ show?: Function } | null} */ (document.querySelector('toast-msg'))
      : null;

    for (const n of list) {
      if (!n?.id) continue;
      if (!prevSeen.has(n.id)) {
        this.dispatchEvent(new CustomEvent('notification-wc:new', {
          bubbles: true, composed: true, detail: { notification: n },
        }));
        if (!firstLoad && toastEl && typeof toastEl.show === 'function') {
          toastEl.show({
            message: n.title || n.body || 'New notification',
            variant: n.type === 'alert' ? 'warning' : n.type === 'stewardship' ? 'warning' : 'info',
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
