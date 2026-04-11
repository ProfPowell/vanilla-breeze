/**
 * <work-item> — General-purpose work unit card
 *
 * The engineering sibling of <user-story>. Represents tasks, bugs,
 * chores, spikes, and features — work that may or may not map to
 * a user story. Can live in kanban-board, gantt-chart, story-map,
 * or standalone.
 *
 * Content slots:
 * @slot title       - Work item heading (e.g., <h3>)
 * @slot description - Work item description (e.g., <p>)
 * @slot checklist   - Subtasks or checklist (e.g., <ul>)
 * @slot notes       - Additional notes (e.g., <p>)
 *
 * State/config attributes:
 * @attr {string}  item-id   - Unique identifier (e.g., "PROJ-42")
 * @attr {enum}    type      - task | bug | chore | spike | feature
 * @attr {enum}    priority  - critical | high | medium | low
 * @attr {enum}    status    - backlog | to-do | in-progress | review | done | blocked
 * @attr {string}  estimate  - Effort estimate (points, hours, t-shirt size)
 * @attr {string}  assignee  - Assignee name
 * @attr {string}  story-ids - Comma-separated linked story IDs
 * @attr {string}  detail    - full | compact | minimal
 * @attr {boolean} compact   - Alias for detail="compact"
 * @attr {string}  src       - URL to JSON data
 *
 * @fires work-item:ready    - After render
 * @fires work-item:status   - When updateStatus() is called
 * @fires work-item:priority - When updatePriority() is called
 *
 * @example
 * <work-item
 *   item-id="PROJ-42"
 *   title="Implement search API"
 *   type="task"
 *   status="in-progress"
 *   priority="high"
 *   assignee="Sarah Chen"
 *   estimate="5"
 *   story-ids="PROJ-101,PROJ-102">
 *   <p slot="description">Build the /search endpoint with filters.</p>
 *   <ul slot="checklist">
 *     <li>Schema design</li>
 *     <li>Endpoint implementation</li>
 *     <li>Tests</li>
 *   </ul>
 * </work-item>
 */

import { styles } from './styles.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { esc, initials, hashColor, lucideSvg, UX_ICONS } from '../_ux-base.js';

/* ── Type icons (Lucide SVG fragments) ─────────────── */

const TYPE_ICONS = {
  task:    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/>',
  bug:     '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',
  chore:   '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',
  spike:   '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  feature: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
};

/* ── Static lookups ────────────────────────────────── */

const PRIORITIES = {
  critical: { label: 'Critical', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
  high:     { label: 'High',     color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)' },
  medium:   { label: 'Medium',   color: '#ca8a04', bg: 'rgba(202, 138, 4, 0.1)' },
  low:      { label: 'Low',      color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' },
};

const STATUSES = {
  backlog:       { label: 'Backlog',     color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
  'to-do':       { label: 'To Do',       color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  'in-progress': { label: 'In Progress', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  review:        { label: 'Review',      color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  done:          { label: 'Done',        color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
  blocked:       { label: 'Blocked',     color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
};

/* ── Component ─────────────────────────────────────── */

class WorkItem extends HTMLElement {
  static get observedAttributes() {
    return [
      'item-id', 'type', 'priority', 'status',
      'estimate', 'assignee', 'story-ids', 'detail', 'compact', 'src',
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

  _resolve(attr) {
    return this.getAttribute(attr) || this.#slotCache.get(attr) || '';
  }

  /* ── Lifecycle ─────────────────────────────────── */

  connectedCallback() {
    this.#cacheSlotValues();
    if (this.itemId && !this.id) this.id = this.itemId;
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

  get itemId()    { return this.getAttribute('item-id') || ''; }
  get itemTitle() {
    const slotted = this.querySelector('[slot="title"]');
    return slotted?.textContent?.trim() || this.#slotCache.get('title') || '';
  }
  get itemType()  { return this.getAttribute('type') || 'task'; }
  get priority()  { return this.getAttribute('priority') || 'medium'; }
  get status()    { return this.getAttribute('status') || 'backlog'; }
  get estimate()  { return this.getAttribute('estimate') || ''; }
  get assignee()  { return this.getAttribute('assignee') || ''; }

  get storyIds() {
    const raw = this.getAttribute('story-ids') || '';
    return raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
  }

  get _detailLevel() {
    if (this.getAttribute('detail')) return this.getAttribute('detail');
    if (this.hasAttribute('compact')) return 'compact';
    return 'full';
  }

  get _minimalLabel() {
    return this.itemTitle || this.itemId || 'Work item';
  }

  /* ── Public API ────────────────────────────────── */

  updateStatus(newStatus) {
    if (STATUSES[newStatus]) {
      this.setAttribute('status', newStatus);
      this.dispatchEvent(new CustomEvent('work-item:status', {
        detail: { status: newStatus, itemId: this.itemId },
        bubbles: true, composed: true,
      }));
    }
  }

  updatePriority(newPriority) {
    if (PRIORITIES[newPriority]) {
      this.setAttribute('priority', newPriority);
      this.dispatchEvent(new CustomEvent('work-item:priority', {
        detail: { priority: newPriority, itemId: this.itemId },
        bubbles: true, composed: true,
      }));
    }
  }

  /* ── JSON loading ──────────────────────────────── */

  async _loadSrc(url) {
    if (!url) return;
    this.shadowRoot.innerHTML = `<style>${styles}</style><div class="state-msg">Loading\u2026</div>`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // State attributes
      for (const [jsonKey, attr] of [
        ['itemId', 'item-id'], ['type', 'type'], ['priority', 'priority'],
        ['status', 'status'], ['estimate', 'estimate'], ['assignee', 'assignee'],
        ['detail', 'detail'],
      ]) {
        if (data[jsonKey] != null) this.setAttribute(attr, String(data[jsonKey]));
      }
      if (data.storyIds) {
        this.setAttribute('story-ids', Array.isArray(data.storyIds) ? data.storyIds.join(',') : data.storyIds);
      }

      // Content → slotted elements
      if (data.title && !this.querySelector('[slot="title"]')) {
        const el = document.createElement('h3');
        el.slot = 'title';
        el.textContent = data.title;
        this.appendChild(el);
      }
      for (const key of ['description', 'notes']) {
        if (data[key] && !this.querySelector(`[slot="${key}"]`)) {
          const el = document.createElement('p');
          el.slot = key;
          el.textContent = data[key];
          this.appendChild(el);
        }
      }
      if (data.checklist && !this.querySelector('[slot="checklist"]')) {
        const ul = document.createElement('ul');
        ul.slot = 'checklist';
        const items = Array.isArray(data.checklist) ? data.checklist : [data.checklist];
        for (const item of items) {
          const li = document.createElement('li');
          li.textContent = item;
          ul.appendChild(li);
        }
        this.appendChild(ul);
      }
      this.#render();
    } catch (err) {
      this.shadowRoot.innerHTML = `<style>${styles}</style>` +
        `<div class="state-msg state-msg--error">Could not load: ${esc(err.message)}</div>`;
    }
  }

  /* ── Render ────────────────────────────────────── */

  #render() {
    const priorityInfo = PRIORITIES[this.priority] || PRIORITIES.medium;
    const statusInfo = STATUSES[this.status] || STATUSES.backlog;
    const type = this.itemType;
    const typeIcon = TYPE_ICONS[type] || TYPE_ICONS.task;
    const level = this._detailLevel;
    const ariaLabel = this.itemId ? `Work item: ${esc(this.itemId)}` : 'Work item';

    if (level === 'minimal') {
      this.shadowRoot.innerHTML = `<style>${styles}</style>
        <article class="wi-card wi-card--minimal" role="article" aria-label="${ariaLabel}"
          tabindex="0">
          <div class="wi-body">
            <div class="wi-meta">
              ${this.itemId ? `<span class="wi-id">${esc(this.itemId)}</span>` : ''}
              <span class="wi-type" data-type="${esc(type)}">${lucideSvg(typeIcon)} ${esc(type)}</span>
            </div>
            <div class="wi-title-wrap">
              <slot name="title"><span class="wi-title-fallback">${esc(this._minimalLabel)}</span></slot>
            </div>
          </div>
        </article>`;
      return;
    }

    this.shadowRoot.innerHTML = `<style>${styles}</style>
      <article class="wi-card wi-card--${level}" role="article" aria-label="${ariaLabel}">

        <header class="wi-header">
          <div class="wi-meta">
            ${this.itemId ? `<span class="wi-id">${esc(this.itemId)}</span>` : ''}
            <span class="wi-type" data-type="${esc(type)}">${lucideSvg(typeIcon)} ${esc(type)}</span>
          </div>
          <div class="wi-badges">
            <span class="wi-priority" style="color:${priorityInfo.color};background:${priorityInfo.bg}">${esc(priorityInfo.label)}</span>
            <span class="wi-status" style="color:${statusInfo.color};background:${statusInfo.bg}">${esc(statusInfo.label)}</span>
            ${this.estimate ? `<span class="wi-estimate" title="Estimate">${esc(this.estimate)}</span>` : ''}
          </div>
        </header>

        <div class="wi-body">
          <div class="wi-title-wrap">
            <slot name="title"><span class="wi-title-fallback">[Untitled work item]</span></slot>
          </div>

          ${this.assignee ? `
            <div class="wi-assignee">
              <span class="wi-assignee__avatar" style="background:${hashColor(this.assignee)}">${initials(this.assignee)}</span>
              ${esc(this.assignee)}
            </div>` : ''}

          ${this.storyIds.length ? `
            <div class="wi-links">
              ${this.storyIds.map(id =>
                `<a class="wi-link" href="#${esc(id)}">${lucideSvg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/>')} ${esc(id)}</a>`
              ).join('')}
            </div>` : ''}
        </div>

        <div class="wi-sections">
          <div class="wi-section">
            <div class="wi-section-header">
              <div class="wi-section-icon description">
                <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <span class="wi-section-title">Description</span>
            </div>
            <div class="wi-section-content">
              <slot name="description"><em class="slot-fallback">No description.</em></slot>
            </div>
          </div>

          <div class="wi-section">
            <div class="wi-section-header">
              <div class="wi-section-icon checklist">
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </div>
              <span class="wi-section-title">Checklist</span>
            </div>
            <div class="wi-section-content">
              <slot name="checklist"><em class="slot-fallback">No checklist items.</em></slot>
            </div>
          </div>

          <div class="wi-section">
            <div class="wi-section-header">
              <div class="wi-section-icon notes">
                <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
              </div>
              <span class="wi-section-title">Notes</span>
            </div>
            <div class="wi-section-content">
              <slot name="notes"><em class="slot-fallback">No notes.</em></slot>
            </div>
          </div>
        </div>

      </article>`;

    // Compact: mark empty slot sections
    if (level === 'compact') {
      for (const section of this.shadowRoot.querySelectorAll('.wi-section')) {
        const slot = section.querySelector('slot');
        if (slot && slot.assignedNodes().length === 0) {
          section.setAttribute('data-empty', '');
        }
      }
    }

    this.dispatchEvent(new CustomEvent('work-item:ready', {
      detail: {
        itemId: this.itemId,
        title: this.itemTitle,
        type,
        priority: this.priority,
        status: this.status,
      },
      bubbles: true, composed: true,
    }));
  }
}

registerComponent('work-item', WorkItem);

export { WorkItem };
