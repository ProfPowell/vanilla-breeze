/**
 * <review-surface> — Pin-based annotation overlay for design review
 *
 * Wraps any content and adds a transparent overlay for placing
 * review comment pins. Supports pluggable persistence adapters.
 *
 * Data sources:
 *   1. `src` attribute — URL to a JSON file
 *   2. `.pins` property — set programmatically
 *   3. Adapter — loaded via `adapter` attribute or `.adapter` property
 *
 * JSON schema:
 *   {
 *     "pins": [
 *       {
 *         "id": "...",
 *         "x": 42.5,
 *         "y": 67.3,
 *         "text": "Fix alignment",
 *         "author": "Sarah",
 *         "createdAt": "2026-04-06T14:30:00Z",
 *         "resolved": false,
 *         "replies": [{ "id": "...", "text": "...", "author": "...", "createdAt": "..." }]
 *       }
 *     ]
 *   }
 */

import { styles } from './styles.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { esc, initials, hashColor, lucideSvg, UX_ICONS } from '../_ux-base.js';
import { VBStore } from '../../lib/vb-store.js';

/* ── Adapters ──────────────────────────────────────── */

class MemoryAdapter {
  #pins = new Map();

  async load() {
    return [...this.#pins.values()];
  }

  async save(pin) {
    if (!pin.id) pin.id = crypto.randomUUID();
    this.#pins.set(pin.id, pin);
    return pin;
  }

  async update(id, changes) {
    const pin = this.#pins.get(id);
    if (!pin) throw new Error(`Pin ${id} not found`);
    Object.assign(pin, changes);
    return pin;
  }

  async remove(id) {
    this.#pins.delete(id);
  }
}

class LocalStorageAdapter {
  #key;

  constructor(key = 'default') {
    this.#key = key;
  }

  async #read() {
    const pins = await VBStore.get('reviews', this.#key);
    return Array.isArray(pins) ? pins : [];
  }

  async #write(pins) {
    await VBStore.set('reviews', this.#key, pins);
  }

  async load() {
    return this.#read();
  }

  async save(pin) {
    if (!pin.id) pin.id = crypto.randomUUID();
    const pins = await this.#read();
    pins.push(pin);
    await this.#write(pins);
    return pin;
  }

  async update(id, changes) {
    const pins = await this.#read();
    const idx = pins.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Pin ${id} not found`);
    Object.assign(pins[idx], changes);
    await this.#write(pins);
    return pins[idx];
  }

  async remove(id) {
    const pins = (await this.#read()).filter(p => p.id !== id);
    await this.#write(pins);
  }
}

class RestAdapter {
  #endpoint;

  constructor(endpoint) {
    if (!endpoint) throw new Error('RestAdapter requires an endpoint URL');
    this.#endpoint = endpoint.replace(/\/$/, '');
  }

  async load() {
    const res = await fetch(this.#endpoint);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : data.pins || [];
  }

  async save(pin) {
    const res = await fetch(this.#endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pin),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async update(id, changes) {
    const res = await fetch(`${this.#endpoint}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async remove(id) {
    const res = await fetch(`${this.#endpoint}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
}

/* ── Component ─────────────────────────────────────── */

class ReviewSurface extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'editable', 'adapter', 'endpoint', 'storage-key', 'author', 'compact', 'show-resolved'];
  }

  #slotCache = new Map();

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    /** @type {import('./logic.js').Pin[]} */
    this.__pins = [];
    /** @type {MemoryAdapter|LocalStorageAdapter|RestAdapter|null} */
    this.__adapter = null;
    /** @type {string|null} */
    this._activePin = null;
    /** @type {boolean} */
    this._annotating = false;
  }

  /* ── Properties ─────────────────────────────────── */

  /** @returns {Object[]} */
  get pins() { return this.__pins; }

  /**
   * Replace the pin list and re-render. Idempotent — assigning the
   * same array reference is a no-op. Emits review-surface:pins-changed
   * with `source: 'property'` so reactive consumers can filter their
   * own assignments out of the event stream.
   * @param {Object[]} data
   */
  set pins(data) {
    const next = Array.isArray(data) ? data : [];
    if (this.__pins === next) return;
    this.__pins = next;
    if (this.isConnected) this._render();
    this.dispatchEvent(new CustomEvent('review-surface:pins-changed', {
      detail: { pins: next, source: 'property' },
      bubbles: true, composed: true,
    }));
  }

  /** @returns {MemoryAdapter|LocalStorageAdapter|RestAdapter|null} */
  get adapter() { return this.__adapter; }

  /** @param {Object} adapterInstance */
  set adapter(adapterInstance) {
    this.__adapter = adapterInstance;
    if (this.isConnected) this._loadFromAdapter();
  }

  /* ── Slot caching ───────────────────────────────── */

  #cacheSlotValues() {
    for (const child of this.children) {
      const slot = child.getAttribute('slot');
      if (slot) this.#slotCache.set(slot, child.textContent.trim());
    }
  }

  _resolve(attr) {
    return this.getAttribute(attr) || this.#slotCache.get(attr) || '';
  }

  /* ── Lifecycle ─────────────────────────────────── */

  connectedCallback() {
    this.#cacheSlotValues();
    this.setAttribute('data-upgraded', '');
    this.#resolveAdapter();

    if (this.hasAttribute('src')) {
      this._loadSrc(this.getAttribute('src'));
    } else {
      this._loadFromAdapter();
    }
  }

  disconnectedCallback() {
    this.removeAttribute('data-upgraded');
    this.removeAttribute('data-annotating');
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'src') {
      this._loadSrc(this.getAttribute('src'));
    } else if (name === 'adapter' || name === 'endpoint' || name === 'storage-key') {
      this.#resolveAdapter();
      this._loadFromAdapter();
    } else {
      this._render();
    }
  }

  /* ── Adapter resolution ────────────────────────── */

  #resolveAdapter() {
    /* If a custom adapter was set via property, keep it */
    if (this.__adapter && !(this.__adapter instanceof MemoryAdapter) &&
        !(this.__adapter instanceof LocalStorageAdapter) &&
        !(this.__adapter instanceof RestAdapter)) {
      return;
    }

    const type = this.getAttribute('adapter') || 'memory';
    switch (type) {
      case 'local':
        this.__adapter = new LocalStorageAdapter(this.getAttribute('storage-key') || 'default');
        break;
      case 'rest':
        try {
          this.__adapter = new RestAdapter(this.getAttribute('endpoint'));
        } catch {
          this.__adapter = new MemoryAdapter();
        }
        break;
      default:
        this.__adapter = new MemoryAdapter();
    }
  }

  /* ── Data loading ──────────────────────────────── */

  async _loadSrc(src) {
    if (!src) return;
    this.shadowRoot.innerHTML = `<style>${styles}</style>` +
      `<div class="state-msg">Loading\u2026</div>`;
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.__pins = Array.isArray(data) ? data : data.pins || [];
      this._render();
    } catch (err) {
      this.shadowRoot.innerHTML = `<style>${styles}</style>` +
        `<div class="state-msg state-msg--error">Could not load pins: ${esc(err.message)}</div>`;
    }
  }

  async _loadFromAdapter() {
    if (!this.__adapter) return;
    try {
      this.__pins = await this.__adapter.load();
    } catch {
      this.__pins = [];
    }
    this._render();
  }

  /* ── Public API ────────────────────────────────── */

  /**
   * Add a pin programmatically.
   * @param {{ x: number, y: number, text: string, author?: string }} pinData
   * @returns {Promise<Object>}
   */
  async addPin(pinData) {
    const pin = {
      id: crypto.randomUUID(),
      x: Math.max(0, Math.min(100, pinData.x)),
      y: Math.max(0, Math.min(100, pinData.y)),
      text: pinData.text || '',
      author: pinData.author || this.getAttribute('author') || 'Anonymous',
      createdAt: new Date().toISOString(),
      resolved: false,
      resolvedBy: null,
      resolvedAt: null,
      replies: [],
    };

    if (this.__adapter) {
      await this.__adapter.save(pin);
    }
    this.__pins.push(pin);
    this._render();
    this.#announce(`Pin ${this.#visiblePins().length} added`);

    this.dispatchEvent(new CustomEvent('review-surface:add', {
      bubbles: true, composed: true,
      detail: { pin },
    }));

    return pin;
  }

  /**
   * Remove a pin by ID.
   * @param {string} id
   */
  async removePin(id) {
    const pin = this.__pins.find(p => p.id === id);
    if (!pin) return;

    if (this.__adapter) {
      await this.__adapter.remove(id);
    }
    this.__pins = this.__pins.filter(p => p.id !== id);
    if (this._activePin === id) this._activePin = null;
    this._render();
    this.#announce('Pin removed');

    this.dispatchEvent(new CustomEvent('review-surface:remove', {
      bubbles: true, composed: true,
      detail: { pin },
    }));
  }

  /**
   * Mark a pin as resolved.
   * @param {string} id
   */
  async resolvePin(id) {
    const pin = this.__pins.find(p => p.id === id);
    if (!pin) return;

    const changes = {
      resolved: true,
      resolvedBy: this.getAttribute('author') || 'Anonymous',
      resolvedAt: new Date().toISOString(),
    };

    if (this.__adapter) {
      await this.__adapter.update(id, changes);
    }
    Object.assign(pin, changes);
    this._render();
    this.#announce('Pin resolved');

    this.dispatchEvent(new CustomEvent('review-surface:resolve', {
      bubbles: true, composed: true,
      detail: { pin },
    }));
  }

  /**
   * Re-open a resolved pin.
   * @param {string} id
   */
  async unresolvePin(id) {
    const pin = this.__pins.find(p => p.id === id);
    if (!pin) return;

    const changes = { resolved: false, resolvedBy: null, resolvedAt: null };

    if (this.__adapter) {
      await this.__adapter.update(id, changes);
    }
    Object.assign(pin, changes);
    this._render();
    this.#announce('Pin re-opened');

    this.dispatchEvent(new CustomEvent('review-surface:update', {
      bubbles: true, composed: true,
      detail: { pin, changes },
    }));
  }

  /**
   * Export all pins as a plain array.
   * @returns {Object[]}
   */
  exportPins() {
    return structuredClone(this.__pins);
  }

  /**
   * Import pins from an array (replaces current).
   * @param {Object[]} data
   */
  importPins(data) {
    this.__pins = Array.isArray(data) ? structuredClone(data) : [];
    this._activePin = null;
    this._render();
  }

  /* ── Render ────────────────────────────────────── */

  #visiblePins() {
    const showResolved = this.hasAttribute('show-resolved');
    return this.__pins
      .filter(p => showResolved || !p.resolved)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  _render() {
    const editable = this.hasAttribute('editable');
    const visible = this.#visiblePins();
    const activePin = this._activePin ? this.__pins.find(p => p.id === this._activePin) : null;

    this.setAttribute('pin-count', String(visible.length));

    this.shadowRoot.innerHTML = `<style>${styles}</style>
      <div class="rs-container">
        <slot></slot>
        <div class="rs-overlay" role="img" aria-label="Review annotation surface">
          ${visible.map((pin, i) => this._renderPin(pin, i + 1)).join('')}
        </div>
        ${activePin ? this._renderPopover(activePin, editable) : ''}
      </div>
      ${editable ? this._renderToolbar(visible.length) : ''}
      <div class="rs-live" aria-live="polite" aria-atomic="true"></div>`;

    this._bindListeners(editable);

    this.dispatchEvent(new CustomEvent('review-surface:ready', {
      bubbles: true, composed: true,
      detail: { pinCount: visible.length },
    }));
  }

  /* ── Pin marker ────────────────────────────────── */

  _renderPin(pin, number) {
    const preview = pin.text ? pin.text.slice(0, 50) : 'Empty pin';
    return `<button class="rs-pin"
      data-pin-id="${esc(pin.id)}"
      ${pin.resolved ? 'data-resolved' : ''}
      ${this._activePin === pin.id ? 'data-active' : ''}
      style="left:${pin.x}%;top:${pin.y}%"
      aria-label="Pin ${number}: ${esc(preview)}"
      aria-expanded="${this._activePin === pin.id}"
      aria-haspopup="dialog">
      <span class="rs-pin__number">${number}</span>
    </button>`;
  }

  /* ── Popover ───────────────────────────────────── */

  _renderPopover(pin, editable) {
    const number = this.#visiblePins().findIndex(p => p.id === pin.id) + 1;

    return `<div class="rs-popover" data-open
      style="left:${Math.min(pin.x, 70)}%;top:${pin.y}%"
      role="dialog"
      aria-labelledby="rs-popover-title-${esc(pin.id)}">

      <div class="rs-popover__header">
        <span class="rs-popover__title" id="rs-popover-title-${esc(pin.id)}">
          Pin ${number}
          ${pin.resolved ? `<span class="rs-resolved-badge">${lucideSvg(UX_ICONS.checkCircle)} Resolved</span>` : ''}
        </span>
        <div class="rs-popover__actions">
          ${editable && !pin.resolved ? `
            <button class="rs-popover__btn rs-popover__btn--resolve" data-action="resolve" data-pin-id="${esc(pin.id)}"
              aria-label="Resolve pin" title="Resolve">${lucideSvg(UX_ICONS.checkCircle)}</button>` : ''}
          ${editable && pin.resolved ? `
            <button class="rs-popover__btn" data-action="unresolve" data-pin-id="${esc(pin.id)}"
              aria-label="Re-open pin" title="Re-open">${lucideSvg(UX_ICONS.messageCircle)}</button>` : ''}
          ${editable ? `
            <button class="rs-popover__btn rs-popover__btn--delete" data-action="delete" data-pin-id="${esc(pin.id)}"
              aria-label="Delete pin" title="Delete">${lucideSvg(UX_ICONS.x)}</button>` : ''}
          <button class="rs-popover__btn" data-action="close"
            aria-label="Close">${lucideSvg(UX_ICONS.x)}</button>
        </div>
      </div>

      <div class="rs-comment">
        <div class="rs-comment__meta">
          <span class="rs-comment__avatar" style="background:${hashColor(pin.author || 'Anonymous')}">${initials(pin.author || 'Anonymous')}</span>
          <span class="rs-comment__author">${esc(pin.author || 'Anonymous')}</span>
          <span class="rs-comment__time">${this.#formatTime(pin.createdAt)}</span>
        </div>
        <div class="rs-comment__text">${esc(pin.text)}</div>
      </div>

      ${pin.replies?.length ? `
        <div class="rs-replies">
          ${pin.replies.map(reply => `
            <div class="rs-reply">
              <div class="rs-comment__meta">
                <span class="rs-comment__avatar" style="background:${hashColor(reply.author || 'Anonymous')}">${initials(reply.author || 'Anonymous')}</span>
                <span class="rs-comment__author">${esc(reply.author || 'Anonymous')}</span>
                <span class="rs-comment__time">${this.#formatTime(reply.createdAt)}</span>
              </div>
              <div class="rs-comment__text">${esc(reply.text)}</div>
            </div>
          `).join('')}
        </div>` : ''}

      ${editable ? `
        <div class="rs-input">
          <textarea class="rs-input__field" placeholder="Reply\u2026" rows="1"
            aria-label="Reply to pin ${number}"></textarea>
          <button class="rs-input__submit" data-action="reply" data-pin-id="${esc(pin.id)}"
            aria-label="Send reply">${lucideSvg(UX_ICONS.send)}</button>
        </div>` : ''}

    </div>`;
  }

  /* ── Toolbar ───────────────────────────────────── */

  _renderToolbar(count) {
    return `<div class="rs-toolbar" role="toolbar" aria-label="Review tools">
      <button class="rs-toolbar__btn" data-action="toggle-mode"
        aria-pressed="${this._annotating}"
        title="Toggle annotate mode">
        ${lucideSvg(UX_ICONS.mapPin)} Annotate
      </button>
      <button class="rs-toolbar__btn" data-action="export"
        title="Export pins as JSON">
        ${lucideSvg(UX_ICONS.download)} Export
      </button>
      <output class="rs-toolbar__count">${count} pin${count !== 1 ? 's' : ''}</output>
    </div>`;
  }

  /* ── Event binding ─────────────────────────────── */

  _bindListeners(editable) {
    const root = this.shadowRoot;

    /* Pin clicks — open popover */
    root.querySelectorAll('.rs-pin').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.pinId;
        this._activePin = this._activePin === id ? null : id;
        this._render();

        if (this._activePin) {
          this.dispatchEvent(new CustomEvent('review-surface:select', {
            bubbles: true, composed: true,
            detail: { pin: this.__pins.find(p => p.id === id) },
          }));
        }
      });
    });

    /* Overlay click — place new pin in annotate mode */
    const overlay = root.querySelector('.rs-overlay');
    if (overlay && editable) {
      overlay.addEventListener('click', (e) => {
        if (!this._annotating) return;
        if (e.target.closest('.rs-pin')) return;

        const rect = overlay.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        this.#promptNewPin(x, y);
      });
    }

    /* Popover actions */
    root.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const pinId = btn.dataset.pinId;

        switch (action) {
          case 'close':
            this._activePin = null;
            this._render();
            break;
          case 'resolve':
            this.resolvePin(pinId);
            break;
          case 'unresolve':
            this.unresolvePin(pinId);
            break;
          case 'delete':
            this.removePin(pinId);
            break;
          case 'toggle-mode':
            this._annotating = !this._annotating;
            if (this._annotating) {
              this.setAttribute('data-annotating', '');
            } else {
              this.removeAttribute('data-annotating');
            }
            this._render();
            this.dispatchEvent(new CustomEvent('review-surface:mode', {
              bubbles: true, composed: true,
              detail: { mode: this._annotating ? 'annotate' : 'view' },
            }));
            break;
          case 'export':
            this.#exportToClipboard();
            break;
          case 'reply':
            this.#submitReply(pinId);
            break;
        }
      });
    });

    /* Reply input — Enter to submit (Shift+Enter for newline) */
    const replyField = root.querySelector('.rs-input__field');
    if (replyField) {
      replyField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const pinId = root.querySelector('[data-action="reply"]')?.dataset.pinId;
          if (pinId) this.#submitReply(pinId);
        }
      });
    }

    /* Keyboard: Escape to close popover or exit annotate mode */
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this._activePin) {
          this._activePin = null;
          this._render();
        } else if (this._annotating) {
          this._annotating = false;
          this.removeAttribute('data-annotating');
          this._render();
          this.dispatchEvent(new CustomEvent('review-surface:mode', {
            bubbles: true, composed: true,
            detail: { mode: 'view' },
          }));
        }
      }
    });
  }

  /* ── Internal helpers ──────────────────────────── */

  async #promptNewPin(x, y) {
    const author = this.getAttribute('author') || 'Anonymous';
    const pin = await this.addPin({ x, y, text: '', author });

    /* Open the new pin's popover immediately so user can type */
    this._activePin = pin.id;
    this._render();

    /* Focus the reply field for immediate text entry */
    requestAnimationFrame(() => {
      const field = this.shadowRoot.querySelector('.rs-input__field');
      if (field) field.focus();
    });
  }

  async #submitReply(pinId) {
    const field = this.shadowRoot.querySelector('.rs-input__field');
    if (!field) return;

    const text = field.value.trim();
    if (!text) return;

    const pin = this.__pins.find(p => p.id === pinId);
    if (!pin) return;

    const reply = {
      id: crypto.randomUUID(),
      text,
      author: this.getAttribute('author') || 'Anonymous',
      createdAt: new Date().toISOString(),
    };

    if (!pin.replies) pin.replies = [];

    /* If pin has no text yet (just placed), promote first reply to pin text */
    if (!pin.text) {
      pin.text = text;
      if (this.__adapter) {
        await this.__adapter.update(pinId, { text });
      }
    } else {
      pin.replies.push(reply);
      if (this.__adapter) {
        await this.__adapter.update(pinId, { replies: pin.replies });
      }
    }

    this._render();
    this.#announce('Reply added');

    /* Re-focus input */
    requestAnimationFrame(() => {
      const newField = this.shadowRoot.querySelector('.rs-input__field');
      if (newField) newField.focus();
    });

    this.dispatchEvent(new CustomEvent('review-surface:update', {
      bubbles: true, composed: true,
      detail: { pin, changes: { replies: pin.replies } },
    }));
  }

  async #exportToClipboard() {
    const data = JSON.stringify(this.exportPins(), null, 2);
    try {
      await navigator.clipboard.writeText(data);
      this.#announce('Pins copied to clipboard');
    } catch {
      /* Fallback: download as file */
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'review-pins.json';
      a.click();
      URL.revokeObjectURL(url);
      this.#announce('Pins exported as file');
    }
  }

  #formatTime(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString();
    } catch {
      return '';
    }
  }

  #announce(message) {
    const live = this.shadowRoot.querySelector('.rs-live');
    if (live) live.textContent = message;
  }
}

registerComponent('review-surface', ReviewSurface);

export { ReviewSurface, MemoryAdapter, LocalStorageAdapter, RestAdapter };
