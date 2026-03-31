/**
 * <empathy-map> — Four-quadrant empathy map web component
 *
 * Visualises Says / Thinks / Does / Feels quadrants with optional
 * flip-to-edit interaction and JSON loading.
 *
 * Data sources:
 *   1. `src` attribute — URL to a JSON file
 *   2. `.quadrants` property — set programmatically
 *   3. Slotted content — `<ul slot="says">`, etc.
 *
 * JSON schema:
 *   {
 *     "title": "...",
 *     "persona": "...",
 *     "personaId": "...",
 *     "summary": "...",
 *     "quadrants": {
 *       "says":   ["item1", "item2"],
 *       "thinks": ["item1", "item2"],
 *       "does":   ["item1", "item2"],
 *       "feels":  ["frustrated", "curious"]
 *     },
 *     "goals": ["goal1"],
 *     "painPoints": ["pain1"]
 *   }
 */

import { styles } from './styles.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { esc, QUADRANT_META, EMOTION_META, lucideSvg, UX_ICONS } from '../_ux-base.js';

const QUADRANT_KEYS = ['says', 'thinks', 'does', 'feels'];

class EmpathyMap extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'persona', 'persona-id', 'summary', 'src', 'editable', 'compact'];
  }

  #slotCache = new Map();

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    /** @type {Object<string, string[]>|null} */
    this.__quadrants = null;
    /** @type {string[]|null} */
    this.__goals = null;
    /** @type {string[]|null} */
    this.__painPoints = null;
    /** @type {Set<string>} */
    this._editingQuadrants = new Set();
  }

  /* ── Properties ─────────────────────────────────── */

  /** @returns {Object<string, string[]>|null} */
  get quadrants() { return this.__quadrants; }

  /** @param {Object<string, string[]>|null} data */
  set quadrants(data) {
    this.__quadrants = data;
    if (this.isConnected) this._render();
  }

  /** @returns {string[]|null} */
  get goals() { return this.__goals; }

  /** @param {string[]|null} data */
  set goals(data) {
    this.__goals = data;
    if (this.isConnected) this._render();
  }

  /** @returns {string[]|null} */
  get painPoints() { return this.__painPoints; }

  /** @param {string[]|null} data */
  set painPoints(data) {
    this.__painPoints = data;
    if (this.isConnected) this._render();
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
    if (this.hasAttribute('src')) {
      this._loadSrc(this.getAttribute('src'));
    } else {
      this._render();
    }
  }

  disconnectedCallback() {
    this.removeAttribute('data-upgraded');
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'src') {
      this._loadSrc(this.getAttribute('src'));
    } else {
      this._render();
    }
  }

  /* ── Public API ────────────────────────────────── */

  /**
   * Open a quadrant for editing.
   * @param {string} name - Quadrant key: says|thinks|does|feels
   */
  editQuadrant(name) {
    if (!QUADRANT_KEYS.includes(name)) return;
    if (!this.hasAttribute('editable')) return;
    this._openEdit(name);
  }

  /**
   * Close a quadrant edit and save.
   * @param {string} name - Quadrant key: says|thinks|does|feels
   */
  closeQuadrant(name) {
    if (!QUADRANT_KEYS.includes(name)) return;
    this._closeEdit(name);
  }

  /* ── JSON loading ──────────────────────────────── */

  async _loadSrc(src) {
    if (!src) return;
    this.shadowRoot.innerHTML = `<style>${styles}</style>` +
      `<div class="state-msg">Loading\u2026</div>`;
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.title)     this.setAttribute('title',      data.title);
      if (data.persona)   this.setAttribute('persona',    data.persona);
      if (data.personaId) this.setAttribute('persona-id', data.personaId);
      if (data.summary)   this.setAttribute('summary',    data.summary);
      this.__quadrants  = data.quadrants || null;
      this.__goals      = data.goals || null;
      this.__painPoints = data.painPoints || null;
      this._render();
    } catch (err) {
      this.shadowRoot.innerHTML = `<style>${styles}</style>` +
        `<div class="state-msg state-msg--error">Could not load empathy map: ${esc(err.message)}</div>`;
    }
  }

  /* ── Render ────────────────────────────────────── */

  _render() {
    const title     = this._resolve('title')      || 'Empathy Map';
    const persona   = this._resolve('persona')    || '';
    const personaId = this._resolve('persona-id') || '';
    const summary   = this._resolve('summary')    || '';
    const compact   = this.hasAttribute('compact');
    const editable  = this.hasAttribute('editable');

    const hasGoals = this.__goals?.length || this.querySelector('[slot="goals"]');
    const hasPains = this.__painPoints?.length || this.querySelector('[slot="pain-points"]');

    this.shadowRoot.innerHTML = `<style>${styles}</style>
      <article class="empathy-map${compact ? ' empathy-map--compact' : ''}">

        <header class="empathy-map__header">
          <div class="empathy-map__header-top">
            <div class="empathy-map__chips">
              <span class="chip chip--type">Empathy Map</span>
            </div>
            ${persona ? `
              <div class="empathy-map__persona">
                ${personaId
                  ? `<a class="persona-ref" href="#${esc(personaId)}">${lucideSvg(UX_ICONS.user)} ${esc(persona)}</a>`
                  : `<span class="persona-ref">${lucideSvg(UX_ICONS.user)} ${esc(persona)}</span>`}
              </div>` : ''}
          </div>
          <h2 class="empathy-map__title">${esc(title)}</h2>
          ${summary ? `<p class="empathy-map__summary">${esc(summary)}</p>` : ''}
        </header>

        <div class="empathy-map__grid">
          ${QUADRANT_KEYS.map(key => this._renderQuadrant(key, editable)).join('')}
        </div>

        ${hasGoals || hasPains ? `
          <footer class="empathy-map__footer">
            ${this._renderSummaryRow('goals', lucideSvg(UX_ICONS.target), 'Goals')}
            ${this._renderSummaryRow('pain-points', lucideSvg(UX_ICONS.alertTriangle), 'Pain Points')}
          </footer>
        ` : ''}

      </article>`;

    if (editable) {
      this._bindEditListeners();
    }

    /* Dispatch ready event */
    this.dispatchEvent(new CustomEvent('empathy-map:ready', {
      bubbles: true,
      composed: true,
      detail: { title, persona },
    }));
  }

  /* ── Render quadrant ───────────────────────────── */

  _renderQuadrant(key, editable) {
    const meta = QUADRANT_META[key];
    const items = this.__quadrants?.[key];
    const isEditing = this._editingQuadrants.has(key);

    const frontContent = items && items.length
      ? (key === 'feels'
          ? items.map(item => this._renderEmotion(item)).join('')
          : items.map(item => `<p>${esc(item)}</p>`).join(''))
      : `<slot name="${key}"><p class="placeholder">Add ${meta.label.toLowerCase()} items\u2026</p></slot>`;

    const textareaValue = items?.length ? items.join('\n') : '';

    return `
      <section class="quadrant quadrant--${key}"${isEditing ? ' data-editing' : ''}>
        <div class="quadrant__inner">
          <div class="quadrant__header">
            <div class="quadrant__icon" aria-hidden="true">${lucideSvg(meta.icon)}</div>
            <span class="quadrant__label">${meta.label}</span>
            ${editable ? `<button class="quadrant__edit-btn" data-quadrant="${key}"
              aria-label="Edit ${meta.label}" title="Edit ${meta.label}">${lucideSvg(UX_ICONS.pencil)}</button>` : ''}
          </div>
          <div class="quadrant__faces">
            <div class="quadrant__face quadrant__face--front"${isEditing ? ' inert' : ''}>
              <div class="quadrant__content">
                ${frontContent}
              </div>
            </div>
            ${editable ? `
              <div class="quadrant__face quadrant__face--back"${isEditing ? '' : ' inert'}>
                <textarea class="quadrant__editor" data-quadrant="${key}"
                  placeholder="One item per line\u2026"
                  aria-label="Edit ${meta.label} items">${esc(textareaValue)}</textarea>
                <button class="quadrant__done-btn" data-quadrant="${key}"
                  aria-label="Done editing ${meta.label}">${lucideSvg(UX_ICONS.check)} Done</button>
              </div>
            ` : ''}
          </div>
        </div>
      </section>`;
  }

  /* ── Render emotion tag ────────────────────────── */

  _renderEmotion(item) {
    const normalized = item.toLowerCase().trim();
    const meta = EMOTION_META[normalized];
    if (meta) {
      return `<span class="emotion-tag" style="--ec:${meta.color}"><span role="img" aria-label="${esc(item)}">${meta.emoji}</span> ${esc(item)}</span>`;
    }
    return `<p>${esc(item)}</p>`;
  }

  /* ── Render summary row ────────────────────────── */

  _renderSummaryRow(slotName, icon, label) {
    const dataKey = slotName === 'pain-points' ? 'painPoints' : slotName;
    const items = dataKey === 'painPoints' ? this.__painPoints : this.__goals;

    const content = items?.length
      ? items.map(item => `<p>${esc(item)}</p>`).join('')
      : `<slot name="${slotName}"><p class="placeholder">No ${label.toLowerCase()} specified.</p></slot>`;

    return `
      <div class="summary-row">
        <span class="summary-row__icon" aria-hidden="true">${icon}</span>
        <div class="summary-row__body">
          <div class="summary-row__label">${label}</div>
          <div class="summary-row__content">${content}</div>
        </div>
      </div>`;
  }

  /* ── Edit interaction ──────────────────────────── */

  _bindEditListeners() {
    const root = this.shadowRoot;

    root.querySelectorAll('.quadrant__edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._openEdit(btn.dataset.quadrant);
      });
    });

    root.querySelectorAll('.quadrant__done-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._closeEdit(btn.dataset.quadrant);
      });
    });

    root.querySelectorAll('.quadrant__editor').forEach(textarea => {
      textarea.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          e.preventDefault();
          this._closeEdit(textarea.dataset.quadrant);
        }
      });
    });
  }

  _openEdit(key) {
    this._editingQuadrants.add(key);

    const section = this.shadowRoot.querySelector(`.quadrant--${key}`);
    if (!section) return;

    section.setAttribute('data-editing', '');

    const front = section.querySelector('.quadrant__face--front');
    const back  = section.querySelector('.quadrant__face--back');
    if (front) front.setAttribute('inert', '');
    if (back)  back.removeAttribute('inert');

    const textarea = section.querySelector('.quadrant__editor');
    if (textarea) {
      /* Pre-fill: prefer JSON data; fall back to slotted text */
      const items = this.__quadrants?.[key];
      if (items?.length) {
        textarea.value = items.join('\n');
      } else {
        const slot = section.querySelector(`slot[name="${key}"]`);
        if (slot) {
          const assigned = slot.assignedElements();
          if (assigned.length) {
            const lines = [];
            assigned.forEach(el => {
              const lis = el.querySelectorAll('li');
              if (lis.length) {
                lis.forEach(li => lines.push(li.textContent.trim()));
              } else {
                lines.push(el.textContent.trim());
              }
            });
            textarea.value = lines.filter(Boolean).join('\n');
          }
        }
      }
      textarea.focus();
    }
  }

  _closeEdit(key) {
    const section = this.shadowRoot.querySelector(`.quadrant--${key}`);
    if (!section) return;

    const textarea = section.querySelector('.quadrant__editor');
    if (textarea) {
      const items = textarea.value
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

      /* Ensure __quadrants object exists */
      if (!this.__quadrants) this.__quadrants = {};
      this.__quadrants[key] = items;

      /* Partially re-render front face content */
      const contentEl = section.querySelector('.quadrant__content');
      if (contentEl) {
        if (items.length) {
          contentEl.innerHTML = key === 'feels'
            ? items.map(item => this._renderEmotion(item)).join('')
            : items.map(item => `<p>${esc(item)}</p>`).join('');
        } else {
          const meta = QUADRANT_META[key];
          contentEl.innerHTML = `<p class="placeholder">Add ${meta.label.toLowerCase()} items\u2026</p>`;
        }
      }
    }

    this._editingQuadrants.delete(key);
    section.removeAttribute('data-editing');

    const front = section.querySelector('.quadrant__face--front');
    const back  = section.querySelector('.quadrant__face--back');
    if (front) front.removeAttribute('inert');
    if (back)  back.setAttribute('inert', '');

    /* Dispatch update event */
    this.dispatchEvent(new CustomEvent('empathy-map:update', {
      bubbles: true,
      composed: true,
      detail: {
        quadrant: key,
        items: this.__quadrants?.[key] || [],
      },
    }));
  }
}

registerComponent('empathy-map', EmpathyMap);

export { EmpathyMap };
