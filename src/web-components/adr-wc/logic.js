/**
 * <adr-wc> — Architectural Decision Record card (MADR format)
 *
 * Renders an ADR with status badge, context, decision, consequences,
 * and chain-linking to other ADRs via supersedes / superseded-by.
 * Part of the UX Planning Pack.
 *
 * Content slots (headings and dates are content, not config):
 * @slot title         - Decision heading (e.g., <h2>)
 * @slot date          - Decision date (e.g., <time datetime="...">)
 * @slot context       - Why the decision was needed
 * @slot decision      - What was decided
 * @slot consequences  - Outcomes (positive and negative)
 *
 * State/config attributes:
 * @attr {string}  adr-id        - ADR identifier (e.g., "ADR-001"), auto-sets HTML id
 * @attr {enum}    status        - proposed | accepted | deprecated | superseded
 * @attr {string}  supersedes    - Comma-separated ADR IDs this supersedes
 * @attr {string}  superseded-by - Comma-separated ADR IDs that supersede this
 * @attr {string}  detail        - full | compact | minimal
 * @attr {boolean} compact       - Alias for detail="compact"
 * @attr {string}  src           - URL to JSON data
 *
 * @fires adr-wc:ready - After render with { adrId, status }
 *
 * @example
 * <adr-wc adr-id="ADR-001" status="accepted">
 *   <h2 slot="title">Use PostgreSQL for persistence</h2>
 *   <time slot="date" datetime="2026-01-15">January 15, 2026</time>
 *   <p slot="context">We need a relational database for complex queries.</p>
 *   <p slot="decision">Use PostgreSQL 16 with pgvector extension.</p>
 *   <ul slot="consequences">
 *     <li>Good: mature ecosystem, strong SQL support</li>
 *     <li>Bad: operational overhead vs managed NoSQL</li>
 *   </ul>
 * </adr-wc>
 */

import { styles } from './styles.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { esc, lucideSvg } from '../_ux-base.js';

/* ── Status metadata ──────────────────────────────── */

const STATUSES = {
  proposed:   { label: 'Proposed',   color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  accepted:   { label: 'Accepted',   color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
  deprecated: { label: 'Deprecated', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  superseded: { label: 'Superseded', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
};

/* ── SVG icon fragments (Lucide) ──────────────────── */

const ICONS = {
  calendar:     '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
  context:      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>',
  decision:     '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
  consequences: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  arrowRight:   '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
};

/* ── Component ─────────────────────────────────────── */

class AdrWc extends HTMLElement {
  static get observedAttributes() {
    return [
      'adr-id', 'status',
      'supersedes', 'superseded-by',
      'detail', 'compact', 'src',
    ];
  }

  #slotCache = new Map();

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /* ── Slot caching ───────────────────────────────── */

  #cacheSlotValues() {
    for (const child of [...this.children]) {
      const slotName = child.getAttribute('slot');
      if (slotName) {
        this.#slotCache.set(slotName, child.textContent.trim());
      }
    }
  }

  /* ── Lifecycle ─────────────────────────────────── */

  connectedCallback() {
    this.#cacheSlotValues();
    if (this.adrId && !this.id) this.id = this.adrId;
    if (this.hasAttribute('src')) {
      this._loadSrc(this.getAttribute('src'));
    }
    this.#render();
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    this.removeAttribute('data-upgraded');
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.shadowRoot) {
      if (name === 'src' && this.isConnected) {
        this._loadSrc(newValue);
      } else {
        this.#render();
      }
    }
  }

  /* ── Getters ───────────────────────────────────── */

  get adrId()  { return this.getAttribute('adr-id') || ''; }
  get status() { return this.getAttribute('status') || 'proposed'; }

  /** Read the title from the slotted heading's text content */
  get adrTitle() {
    const slotted = this.querySelector('[slot="title"]');
    return slotted?.textContent?.trim() || this.#slotCache.get('title') || '';
  }

  /** Read the date from the slotted <time>'s datetime attribute or text */
  get adrDate() {
    const slotted = this.querySelector('[slot="date"]');
    return slotted?.getAttribute('datetime') || slotted?.textContent?.trim() || this.#slotCache.get('date') || '';
  }

  get supersedes() {
    const raw = this.getAttribute('supersedes') || '';
    return raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
  }

  get supersededBy() {
    const raw = this.getAttribute('superseded-by') || '';
    return raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
  }

  get _detailLevel() {
    if (this.getAttribute('detail')) return this.getAttribute('detail');
    if (this.hasAttribute('compact')) return 'compact';
    return 'full';
  }

  get _minimalLabel() {
    return this.adrTitle || this.adrId || 'ADR';
  }

  /* ── JSON loading ──────────────────────────────── */

  async _loadSrc(url) {
    if (!url) return;
    this.shadowRoot.innerHTML = `<style>${styles}</style><div class="state-msg">Loading\u2026</div>`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.adrId != null) this.setAttribute('adr-id', String(data.adrId));
      if (data.status != null) this.setAttribute('status', String(data.status));
      if (data.detail != null) this.setAttribute('detail', String(data.detail));

      if (data.supersedes) {
        this.setAttribute('supersedes', Array.isArray(data.supersedes) ? data.supersedes.join(',') : data.supersedes);
      }
      if (data.supersededBy) {
        this.setAttribute('superseded-by', Array.isArray(data.supersededBy) ? data.supersededBy.join(',') : data.supersededBy);
      }

      // Create slotted content elements from JSON
      if (data.title && !this.querySelector('[slot="title"]')) {
        const h = document.createElement('h3');
        h.slot = 'title';
        h.textContent = data.title;
        this.appendChild(h);
      }
      if (data.date && !this.querySelector('[slot="date"]')) {
        const t = document.createElement('time');
        t.slot = 'date';
        t.setAttribute('datetime', data.date);
        t.textContent = new Date(data.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        this.appendChild(t);
      }
      for (const key of ['context', 'decision']) {
        if (data[key] && !this.querySelector(`[slot="${key}"]`)) {
          const p = document.createElement('p');
          p.slot = key;
          p.textContent = data[key];
          this.appendChild(p);
        }
      }
      if (data.consequences && !this.querySelector('[slot="consequences"]')) {
        const ul = document.createElement('ul');
        ul.slot = 'consequences';
        const items = Array.isArray(data.consequences) ? data.consequences : [data.consequences];
        for (const item of items) {
          const li = document.createElement('li');
          li.textContent = item;
          ul.appendChild(li);
        }
        this.appendChild(ul);
      }

      this.#cacheSlotValues();
      this.#render();
    } catch (err) {
      this.shadowRoot.innerHTML = `<style>${styles}</style>` +
        `<div class="state-msg state-msg--error">Could not load: ${esc(err.message)}</div>`;
    }
  }

  /* ── Render ────────────────────────────────────── */

  #render() {
    const statusInfo = STATUSES[this.status] || STATUSES.proposed;
    const level = this._detailLevel;
    const ariaLabel = this.adrId ? `ADR: ${esc(this.adrId)}` : 'Architectural Decision Record';
    const hasDate = !!this.querySelector('[slot="date"]') || this.#slotCache.has('date');

    if (level === 'minimal') {
      this.shadowRoot.innerHTML = `<style>${styles}</style>
        <article class="adr-card adr-card--minimal" role="article" aria-label="${ariaLabel}"
          tabindex="0">
          <div class="adr-body">
            <div class="adr-meta">
              ${this.adrId ? `<span class="adr-id">${esc(this.adrId)}</span>` : ''}
              <span class="adr-status" style="color:${statusInfo.color};background:${statusInfo.bg}">${esc(statusInfo.label)}</span>
            </div>
            <div class="adr-title-wrap">
              <slot name="title"><span class="adr-title-fallback">${esc(this._minimalLabel)}</span></slot>
            </div>
          </div>
        </article>`;
      return;
    }

    this.shadowRoot.innerHTML = `<style>${styles}</style>
      <article class="adr-card adr-card--${level}" role="article" aria-label="${ariaLabel}">

        <header class="adr-header">
          <div class="adr-meta">
            ${this.adrId ? `<span class="adr-id">${esc(this.adrId)}</span>` : ''}
            ${hasDate ? `<span class="adr-date-wrap">${lucideSvg(ICONS.calendar)} <slot name="date"></slot></span>` : ''}
          </div>
          <div class="adr-badges">
            <span class="adr-status" style="color:${statusInfo.color};background:${statusInfo.bg}">${esc(statusInfo.label)}</span>
          </div>
        </header>

        <div class="adr-body">
          <div class="adr-title-wrap">
            <slot name="title"><span class="adr-title-fallback">[Untitled ADR]</span></slot>
          </div>

          ${this.supersedes.length ? `
            <div class="adr-links">
              <span class="adr-links-label">Supersedes</span>
              ${this.supersedes.map(id =>
                `<a class="adr-link" href="#${esc(id)}">${lucideSvg(ICONS.arrowRight)} ${esc(id)}</a>`
              ).join('')}
            </div>` : ''}

          ${this.supersededBy.length ? `
            <div class="adr-links">
              <span class="adr-links-label">Superseded by</span>
              ${this.supersededBy.map(id =>
                `<a class="adr-link" href="#${esc(id)}">${lucideSvg(ICONS.arrowRight)} ${esc(id)}</a>`
              ).join('')}
            </div>` : ''}
        </div>

        <div class="adr-sections">
          <div class="adr-section">
            <div class="adr-section-header">
              <div class="adr-section-icon context">${lucideSvg(ICONS.context)}</div>
              <span class="adr-section-title">Context</span>
            </div>
            <div class="adr-section-content">
              <slot name="context"><em class="slot-fallback">No context provided.</em></slot>
            </div>
          </div>

          <div class="adr-section">
            <div class="adr-section-header">
              <div class="adr-section-icon decision">${lucideSvg(ICONS.decision)}</div>
              <span class="adr-section-title">Decision</span>
            </div>
            <div class="adr-section-content">
              <slot name="decision"><em class="slot-fallback">No decision recorded.</em></slot>
            </div>
          </div>

          <div class="adr-section">
            <div class="adr-section-header">
              <div class="adr-section-icon consequences">${lucideSvg(ICONS.consequences)}</div>
              <span class="adr-section-title">Consequences</span>
            </div>
            <div class="adr-section-content">
              <slot name="consequences"><em class="slot-fallback">No consequences documented.</em></slot>
            </div>
          </div>
        </div>

      </article>`;

    // Compact: mark empty slot sections
    if (level === 'compact') {
      for (const section of this.shadowRoot.querySelectorAll('.adr-section')) {
        const slot = section.querySelector('slot');
        if (slot && slot.assignedNodes().length === 0) {
          section.setAttribute('data-empty', '');
        }
      }
    }

    this.dispatchEvent(new CustomEvent('adr-wc:ready', {
      detail: {
        adrId: this.adrId,
        title: this.adrTitle,
        status: this.status,
      },
      bubbles: true, composed: true,
    }));
  }
}

registerComponent('adr-wc', AdrWc);

export { AdrWc };
