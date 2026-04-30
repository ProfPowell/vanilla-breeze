/**
 * <user-story> — Agile user story card web component
 *
 * Displays user stories in the classic Agile format:
 * "As a [persona], I want [action] so that [benefit]"
 *
 * Content slots (text the user reads):
 * @slot persona             - The "As a..." role (e.g., <span>)
 * @slot action              - The "I want..." description (e.g., <span>)
 * @slot benefit             - The "so that..." outcome (e.g., <span>)
 * @slot title               - Short label for minimal mode (e.g., <h3>)
 * @slot acceptance-criteria - Checklist (e.g., <ul>)
 * @slot tasks               - Implementation tasks (e.g., <ul>)
 * @slot notes               - Additional context (e.g., <p>)
 *
 * State/config attributes:
 * @attr {string}  persona-id - Links to a user-persona element by id
 * @attr {enum}    priority   - critical | high | medium | low
 * @attr {enum}    status     - backlog | to-do | in-progress | review | done
 * @attr {string}  points     - Story point estimate
 * @attr {string}  epic       - Parent epic label
 * @attr {string}  story-id   - Ticket or story identifier
 * @attr {string}  detail     - full | compact | minimal
 * @attr {boolean} compact    - Alias for detail="compact"
 * @attr {string}  src        - URL to JSON data
 *
 * @fires story-ready      - Fired after render
 * @fires status-changed   - Fired when updateStatus() is called
 * @fires priority-changed - Fired when updatePriority() is called
 *
 * @example
 * <user-story
 *   persona-id="persona-sarah"
 *   priority="high"
 *   status="to-do"
 *   points="5"
 *   epic="Dashboard"
 *   story-id="PROJ-142">
 *   <span slot="persona">Product Manager</span>
 *   <span slot="action">view all project timelines in one dashboard</span>
 *   <span slot="benefit">I can quickly identify bottlenecks</span>
 *   <ul slot="acceptance-criteria">
 *     <li>Dashboard loads within 2 seconds</li>
 *   </ul>
 * </user-story>
 */

import { styles } from './styles.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { esc, lucideSvg, UX_ICONS } from '../_ux-base.js';

class UserStory extends HTMLElement {
  static get observedAttributes() {
    return [
      'persona-id', 'priority', 'points',
      'status', 'epic', 'story-id', 'compact', 'detail', 'src'
    ];
  }

  static PRIORITIES = {
    critical: { label: 'Critical', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
    high:     { label: 'High',     color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)' },
    medium:   { label: 'Medium',   color: '#ca8a04', bg: 'rgba(202, 138, 4, 0.1)' },
    low:      { label: 'Low',      color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' }
  };

  static STATUSES = {
    backlog:       { label: 'Backlog',     color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
    'to-do':       { label: 'To Do',       color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    'in-progress': { label: 'In Progress', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    review:        { label: 'Review',      color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    done:          { label: 'Done',        color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' }
  };

  #slotCache = new Map();

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

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

  /* ── Data API ──────────────────────────────────── */

  /**
   * Read the user story as a plain data object. Mirrors what a consumer
   * would assign to .data — useful for diffing, persistence, or echo.
   */
  get data() {
    return {
      storyId: this.storyId || undefined,
      personaId: this.personaId || undefined,
      priority: this.priority,
      status: this.status,
      points: this.points || undefined,
      epic: this.epic || undefined,
      detail: this.getAttribute('detail') || undefined,
      persona: this.persona || undefined,
      action: this.action || undefined,
      benefit: this.benefit || undefined,
      title: this.storyTitle || undefined,
    };
  }

  /**
   * Set state attributes and slotted content from a plain object in one call.
   * Replaces multiple setAttribute calls + manual slotted-child creation.
   * Idempotent for repeat calls.
   */
  set data(value) {
    if (!value || typeof value !== 'object') return;
    this._applyData(value);
    this.#cacheSlotValues();
    if (this.shadowRoot) this.#render();
    this.dispatchEvent(new CustomEvent('user-story:data-changed', {
      detail: { data: this.data, source: 'property' },
      bubbles: true, composed: true,
    }));
  }

  /**
   * Apply a data record to attributes + slotted children. Used by both the
   * .data setter and async _loadSrc. No render or cache update — caller decides.
   * @param {Record<string, unknown>} data
   */
  _applyData(data) {
    for (const [jsonKey, attr] of [
      ['storyId', 'story-id'], ['personaId', 'persona-id'], ['priority', 'priority'],
      ['status', 'status'], ['points', 'points'], ['epic', 'epic'], ['detail', 'detail']
    ]) {
      if (data[jsonKey] != null) this.setAttribute(attr, String(data[jsonKey]));
    }

    if (data.persona && !this.querySelector('[slot="persona"]')) {
      const el = document.createElement('span');
      el.slot = 'persona';
      el.textContent = data.persona;
      this.appendChild(el);
    }
    if (data.action && !this.querySelector('[slot="action"]')) {
      const el = document.createElement('span');
      el.slot = 'action';
      el.textContent = data.action;
      this.appendChild(el);
    }
    if (data.benefit && !this.querySelector('[slot="benefit"]')) {
      const el = document.createElement('span');
      el.slot = 'benefit';
      el.textContent = data.benefit;
      this.appendChild(el);
    }
    if (data.title && !this.querySelector('[slot="title"]')) {
      const el = document.createElement('h3');
      el.slot = 'title';
      el.textContent = data.title;
      this.appendChild(el);
    }
    for (const key of ['acceptance-criteria', 'tasks', 'notes']) {
      const jsonKey = key === 'acceptance-criteria' ? 'acceptanceCriteria' : key;
      if (data[jsonKey] && !this.querySelector(`[slot="${key}"]`)) {
        if (Array.isArray(data[jsonKey])) {
          const ul = document.createElement('ul');
          ul.slot = key;
          for (const item of data[jsonKey]) {
            const li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
          }
          this.appendChild(ul);
        } else {
          const p = document.createElement('p');
          p.slot = key;
          p.textContent = data[jsonKey];
          this.appendChild(p);
        }
      }
    }
  }

  async _loadSrc(url) {
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this._applyData(data);
      this.#cacheSlotValues();
      this.#render();
    } catch (err) {
      console.warn(`[user-story] Failed to load src="${url}":`, err);
    }
  }

  connectedCallback() {
    this.#cacheSlotValues();
    if (this.storyId && !this.id) this.id = this.storyId;
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

  // ── Getters ────────────────────────────────────────────────────────

  /** Read persona from slotted element or cache */
  get persona() {
    const slotted = this.querySelector('[slot="persona"]');
    return slotted?.textContent?.trim() || this.#slotCache.get('persona') || 'user';
  }

  get personaId() {
    return this.getAttribute('persona-id') || '';
  }

  /** Read action from slotted element or cache */
  get action() {
    const slotted = this.querySelector('[slot="action"]');
    return slotted?.textContent?.trim() || this.#slotCache.get('action') || '';
  }

  /** Read benefit from slotted element or cache */
  get benefit() {
    const slotted = this.querySelector('[slot="benefit"]');
    return slotted?.textContent?.trim() || this.#slotCache.get('benefit') || '';
  }

  get priority() {
    return this.getAttribute('priority') || 'medium';
  }

  get points() {
    return this.getAttribute('points') || '';
  }

  get status() {
    return this.getAttribute('status') || 'backlog';
  }

  get epic() {
    return this.getAttribute('epic') || '';
  }

  get storyId() {
    return this.getAttribute('story-id') || '';
  }

  /** Read title from slotted heading or cache */
  get storyTitle() {
    const slotted = this.querySelector('[slot="title"]');
    return slotted?.textContent?.trim() || this.#slotCache.get('title') || '';
  }

  /** Label for minimal mode: title if set, otherwise truncated action */
  get _minimalLabel() {
    if (this.storyTitle) return this.storyTitle;
    const action = this.action;
    return action.length > 40 ? action.slice(0, 40) + '\u2026' : action;
  }

  get compact() {
    return this.hasAttribute('compact');
  }

  get _detailLevel() {
    if (this.getAttribute('detail')) return this.getAttribute('detail');
    if (this.hasAttribute('compact')) return 'compact';
    return 'full';
  }

  // ── Public API ───────────────────────────────────────────────────

  updateStatus(newStatus) {
    if (UserStory.STATUSES[newStatus]) {
      this.setAttribute('status', newStatus);
      this.dispatchEvent(new CustomEvent('status-changed', {
        detail: { status: newStatus, storyId: this.storyId },
        bubbles: true,
        composed: true
      }));
    }
  }

  updatePriority(newPriority) {
    if (UserStory.PRIORITIES[newPriority]) {
      this.setAttribute('priority', newPriority);
      this.dispatchEvent(new CustomEvent('priority-changed', {
        detail: { priority: newPriority, storyId: this.storyId },
        bubbles: true,
        composed: true
      }));
    }
  }

  showDetail() {
    const dialogId = `story-dialog-${this.storyId || this.id || 'detail'}`;
    let dialog = document.getElementById(dialogId);
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = dialogId;
      dialog.setAttribute('data-size', 'l');
      document.body.appendChild(dialog);
    }

    const form = document.createElement('form');
    form.method = 'dialog';
    const header = document.createElement('header');
    const title = document.createElement('h3');
    title.textContent = this.storyTitle || this.storyId || 'Story Detail';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'submit';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '\u00d7';
    header.appendChild(title);
    header.appendChild(closeBtn);

    const section = document.createElement('section');
    const full = document.createElement('user-story');
    for (const attr of this.getAttributeNames()) {
      if (attr === 'detail' || attr === 'compact' || attr === 'data-upgraded' || attr === 'draggable' || attr === 'data-id' || attr === 'data-quadrant') continue;
      full.setAttribute(attr, this.getAttribute(attr));
    }
    const hasSlottedContent = [...this.children].some(c => c.getAttribute('slot') && c.tagName !== 'DIALOG');
    full.setAttribute('detail', hasSlottedContent ? 'full' : 'compact');
    full.removeAttribute('id');
    for (const child of [...this.children]) {
      if (child.tagName === 'DIALOG') continue;
      full.appendChild(child.cloneNode(true));
    }
    section.appendChild(full);

    form.appendChild(header);
    form.appendChild(section);
    dialog.innerHTML = '';
    dialog.appendChild(form);
    dialog.addEventListener('close', () => { dialog.innerHTML = ''; }, { once: true });
    dialog.showModal();
  }

  // ── Private ──────────────────────────────────────────────────────

  #render() {
    const priorityInfo = UserStory.PRIORITIES[this.priority] || UserStory.PRIORITIES.medium;
    const statusInfo = UserStory.STATUSES[this.status] || UserStory.STATUSES.backlog;
    const level = this._detailLevel;
    const ariaLabel = this.storyId
      ? `User story: ${esc(this.storyId)}`
      : 'User story';

    if (level === 'minimal') {
      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <article class="story-card story-card--minimal" role="article" aria-label="${ariaLabel}"
          tabindex="0">
          <div class="story-body">
            ${this.storyId ? `<span class="story-id">${esc(this.storyId)}</span>` : ''}
            <div class="story-title-wrap">
              <slot name="title"><span class="story-title-fallback">${esc(this._minimalLabel || '[describe the action]')}</span></slot>
            </div>
          </div>
        </article>
      `;
      const card = this.shadowRoot.querySelector('.story-card--minimal');
      card.addEventListener('click', () => this.showDetail());
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.showDetail(); }
      });
    } else {
      this.shadowRoot.innerHTML = `
        <style>${styles}</style>

        <article class="story-card story-card--${level}" part="card" role="article" aria-label="${ariaLabel}">
          <header class="story-header" part="header">
            <div class="story-meta">
              ${this.storyId ? `<span class="story-id" part="id">${esc(this.storyId)}</span>` : ''}
              ${this.epic ? `<span class="epic-badge" part="epic">${esc(this.epic)}</span>` : ''}
            </div>
            <div class="story-badges">
              <span class="priority-badge" part="priority"
                style="color: ${priorityInfo.color}; background: ${priorityInfo.bg};"
              >${esc(priorityInfo.label)}</span>
              <span class="status-badge" part="status"
                style="color: ${statusInfo.color}; background: ${statusInfo.bg};"
              >${esc(statusInfo.label)}</span>
              ${this.points ? `<span class="points-badge" part="points">${esc(this.points)}</span>` : ''}
            </div>
          </header>

          <div class="story-body" part="body">
            <p class="story-statement" part="statement">
              <span class="keyword">As a</span>
              ${this.personaId
                ? `<a class="persona-text persona-text--link" href="#${esc(this.personaId)}">${lucideSvg(UX_ICONS.user)} <slot name="persona"><span>user</span></slot></a>`
                : `<span class="persona-text"><slot name="persona"><span>user</span></slot></span>`},
              <span class="keyword">I want</span>
              <span class="action-text"><slot name="action"><span>[describe the action]</span></slot></span>${this.benefit || this.querySelector('[slot="benefit"]') ? `
              <span class="keyword">so that</span>
              <span class="benefit-text"><slot name="benefit"></slot></span>` : ''}
            </p>
          </div>

          <div class="story-sections" part="sections">
            <div class="section" part="section">
              <div class="section-header">
                <div class="section-icon acceptance">
                  <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </div>
                <span class="section-title">Acceptance Criteria</span>
              </div>
              <div class="section-content">
                <slot name="acceptance-criteria">
                  <em class="slot-fallback">No acceptance criteria defined.</em>
                </slot>
              </div>
            </div>

            <div class="section" part="section">
              <div class="section-header">
                <div class="section-icon tasks">
                  <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                </div>
                <span class="section-title">Tasks</span>
              </div>
              <div class="section-content">
                <slot name="tasks">
                  <em class="slot-fallback">No tasks added yet.</em>
                </slot>
              </div>
            </div>

            <div class="section" part="section">
              <div class="section-header">
                <div class="section-icon notes">
                  <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </div>
                <span class="section-title">Notes</span>
              </div>
              <div class="section-content">
                <slot name="notes">
                  <em class="slot-fallback">No additional notes.</em>
                </slot>
              </div>
            </div>
          </div>
        </article>
      `;

      if (level === 'compact') {
        const sections = this.shadowRoot.querySelectorAll('.section');
        sections.forEach(section => {
          const slot = section.querySelector('slot');
          if (slot && slot.assignedNodes().length === 0) {
            section.setAttribute('data-empty', '');
          }
        });
      }
    }

    this.dispatchEvent(new CustomEvent('story-ready', {
      detail: {
        id: this.storyId,
        persona: this.persona,
        action: this.action,
        benefit: this.benefit,
        priority: this.priority,
        status: this.status,
        points: this.points
      },
      bubbles: true,
      composed: true
    }));
  }
}

registerComponent('user-story', UserStory);

export { UserStory };
