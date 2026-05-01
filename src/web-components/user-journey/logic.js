/**
 * <user-journey> — User journey map web component
 *
 * Visualises a multi-phase user journey with an SVG emotion curve
 * and a structured phase-breakdown grid table.
 *
 * Data sources:
 *   1. `src` attribute — URL to a JSON file containing phase data
 *   2. `.phases` property — set programmatically
 *
 * JSON schema:
 *   {
 *     "title": "...",
 *     "persona": "...",
 *     "personaId": "...",
 *     "summary": "...",
 *     "phases": [
 *       {
 *         "name": "Awareness",
 *         "emotion": "curious",
 *         "storyIds": ["PROJ-142"],
 *         "actions":       ["Searches for solutions"],
 *         "thoughts":      ["There must be a better way"],
 *         "touchpoints":   ["Google", "Hacker News"],
 *         "painPoints":    ["Too many options to compare"],
 *         "opportunities": ["Clear landing page"]
 *       }
 *     ]
 *   }
 */

import { styles } from './styles.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { esc, EMOTION_META, lucideSvg, UX_ICONS } from '../_ux-base.js';

const ROWS = [
  { key: 'actions',       label: 'Actions'       },
  { key: 'thoughts',      label: 'Thoughts'      },
  { key: 'touchpoints',   label: 'Touchpoints'   },
  { key: 'painPoints',    label: 'Pain Points'   },
  { key: 'opportunities', label: 'Opportunities' },
];

class UserJourney extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'persona', 'persona-id', 'story-ids', 'compact'];
  }

  #slotCache = new Map();

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.__phases = null;
  }

  /** @returns {Array|null} */
  get phases() { return this.__phases; }

  /**
   * Replace the phase list. Idempotent (skip on same array reference).
   * Emits user-journey:phases-changed { phases, source: 'property' }.
   * @param {Array|null} data
   */
  set phases(data) {
    if (this.__phases === data) return;
    this.__phases = data;
    if (this.isConnected) this._render();
    this.dispatchEvent(new CustomEvent('user-journey:phases-changed', {
      detail: { phases: data, source: 'property' },
      bubbles: true, composed: true,
    }));
  }

  /**
   * Read the journey as a plain data object combining state, slotted
   * content, and the phase array. Mirrors what a consumer would assign
   * to .data.
   */
  get data() {
    return {
      persona: this.getAttribute('persona') || undefined,
      personaId: this.getAttribute('persona-id') || undefined,
      title: this.querySelector('[slot="title"]')?.textContent?.trim() || undefined,
      summary: this.querySelector('[slot="summary"]')?.textContent?.trim() || undefined,
      phases: this.__phases || undefined,
    };
  }

  /**
   * Set state attributes, slotted content, and phases in one assignment.
   * Emits user-journey:data-changed { data, source: 'property' }.
   */
  set data(value) {
    if (!value || typeof value !== 'object') return;
    if (value.persona)   this.setAttribute('persona',    String(value.persona));
    if (value.personaId) this.setAttribute('persona-id', String(value.personaId));
    if (value.title && !this.querySelector('[slot="title"]')) {
      const el = document.createElement('h2');
      el.slot = 'title';
      el.textContent = value.title;
      this.appendChild(el);
    }
    if (value.summary && !this.querySelector('[slot="summary"]')) {
      const el = document.createElement('p');
      el.slot = 'summary';
      el.textContent = value.summary;
      this.appendChild(el);
    }
    if (value.phases != null) this.__phases = value.phases;
    if (this.isConnected) this._render();
    this.dispatchEvent(new CustomEvent('user-journey:data-changed', {
      detail: { data: this.data, source: 'property' },
      bubbles: true, composed: true,
    }));
  }

  /* ── Slot caching ──────────────────────────── */

  #cacheSlotValues() {
    for (const child of this.children) {
      const slot = child.getAttribute('slot');
      if (slot) this.#slotCache.set(slot, child.textContent.trim());
    }
  }

  _resolve(attr) {
    return this.getAttribute(attr) || this.#slotCache.get(attr) || '';
  }

  /* ── Lifecycle ─────────────────────────────── */

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

  /* ── JSON loading ──────────────────────────── */

  async _loadSrc(src) {
    if (!src) return;
    this.shadowRoot.innerHTML = `<style>${styles}</style>` +
      `<div class="state-msg">Loading\u2026</div>`;
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.persona)   this.setAttribute('persona',    data.persona);
      if (data.personaId) this.setAttribute('persona-id', data.personaId);
      if (data.title && !this.querySelector('[slot="title"]')) {
        const el = document.createElement('h2');
        el.slot = 'title';
        el.textContent = data.title;
        this.appendChild(el);
      }
      if (data.summary && !this.querySelector('[slot="summary"]')) {
        const el = document.createElement('p');
        el.slot = 'summary';
        el.textContent = data.summary;
        this.appendChild(el);
      }
      this.__phases = data.phases || [];
      this._render();
    } catch (err) {
      this.shadowRoot.innerHTML = `<style>${styles}</style>` +
        `<div class="state-msg state-msg--error">Could not load journey: ${esc(err.message)}</div>`;
    }
  }

  /* ── Render ────────────────────────────────── */

  _render() {
    const persona   = this._resolve('persona')    || '';
    const personaId = this._resolve('persona-id') || '';
    const storyIds  = (this.getAttribute('story-ids') || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    const compact   = this.hasAttribute('compact');
    const phases    = this.__phases;
    const hasSummary = !!this.querySelector('[slot="summary"]') || this.#slotCache.has('summary');
    const title     = this.querySelector('[slot="title"]')?.textContent?.trim()
      || this.#slotCache.get('title') || '';

    this.shadowRoot.innerHTML = `<style>${styles}</style>
      <article class="journey${compact ? ' journey--compact' : ''}">

        <header class="journey__header">
          <div class="journey__header-top">
            <div class="journey__chips">
              <span class="chip chip--type">Journey Map</span>
              ${storyIds.map(id =>
                `<a class="chip chip--story" href="#${id}">${this._label(id)}</a>`
              ).join('')}
            </div>
            ${persona ? `
              <div class="journey__persona">
                ${personaId
                  ? `<a class="persona-ref" href="#${personaId}">${lucideSvg(UX_ICONS.user)} ${esc(persona)}</a>`
                  : `<span class="persona-ref">${lucideSvg(UX_ICONS.user)} ${esc(persona)}</span>`}
              </div>` : ''}
          </div>
          <div class="journey__title-wrap">
            <slot name="title"><h2 class="journey__title">User Journey</h2></slot>
          </div>
          ${hasSummary ? `<div class="journey__summary-wrap"><slot name="summary"></slot></div>` : ''}
        </header>

        ${phases && phases.length
          ? this._curve(phases) + this._grid(phases)
          : `<div class="journey__placeholder">
               <p>Add phase data via <code>src</code> (JSON) or set <code>.phases</code> programmatically.</p>
             </div>`
        }

      </article>`;

    /* Dispatch ready event */
    this.dispatchEvent(new CustomEvent('journey-ready', {
      bubbles: true,
      composed: true,
      detail: {
        title,
        persona,
        phaseCount: phases ? phases.length : 0,
      },
    }));
  }

  /* ── SVG curve ─────────────────────────────── */

  _curve(phases) {
    const W = 1000, H = 100, PX = 28, PY = 14;
    const uw = W - PX * 2, uh = H - PY * 2;
    const n  = phases.length;

    const toX = i  => PX + (n < 2 ? uw / 2 : (i / (n - 1)) * uw);
    const toY = ph => {
      const m = EMOTION_META[ph.emotion] || EMOTION_META.neutral;
      return PY + (1 - m.score) * uh;
    };

    const pts = phases.map((ph, i) => ({ x: toX(i), y: toY(ph), ph }));

    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], cx = (a.x + b.x) / 2;
      d += ` C ${cx},${a.y} ${cx},${b.y} ${b.x},${b.y}`;
    }

    const uid = `uj-${Math.random().toString(36).slice(2, 8)}`;
    const last = pts.at(-1);

    return `
      <div class="journey__curve" aria-hidden="true">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="curve-svg">
          <defs>
            <linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#6366f1" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <rect x="0"             y="0"          width="${W}" height="${H * 0.4}"  class="zone zone--pos"/>
          <rect x="0"             y="${H * 0.4}" width="${W}" height="${H * 0.2}"  class="zone zone--neu"/>
          <rect x="0"             y="${H * 0.6}" width="${W}" height="${H * 0.4}"  class="zone zone--neg"/>
          ${pts.map(({x}) => `<line x1="${x}" y1="0" x2="${x}" y2="${H}" class="vline"/>`).join('')}
          <path d="${d} L ${last.x},${H} L ${pts[0].x},${H} Z" fill="url(#${uid})"/>
          <path d="${d}" fill="none" class="curve-line"/>
          ${pts.map(({x, y, ph}) => {
            const m = EMOTION_META[ph.emotion] || EMOTION_META.neutral;
            return `<circle cx="${x}" cy="${y}" r="5" class="dot" style="fill:${m.color}"/>`;
          }).join('')}
        </svg>
      </div>`;
  }

  /* ── Phase grid ────────────────────────────── */

  _grid(phases) {
    const headCells = phases.map((ph, i) => {
      const m       = EMOTION_META[ph.emotion] || EMOTION_META.neutral;
      const stories = ph.storyIds || [];
      return `
        <th class="phase-head" data-emotion="${ph.emotion || 'neutral'}"
            style="--ec:${m.color}">
          <span class="ph-num">${i + 1}</span>
          <span class="ph-name">${esc(ph.name || '')}</span>
          <span class="ph-emoji" title="${ph.emotion || 'neutral'}"><span role="img" aria-label="${esc(ph.emotion || 'neutral')}">${m.emoji}</span></span>
          ${stories.length
            ? `<div class="ph-stories">${stories.map(id =>
                `<a class="chip chip--story" href="#${id}">${this._label(id)}</a>`
              ).join('')}</div>`
            : ''}
        </th>`;
    }).join('');

    const bodyRows = ROWS.map(({ key, label }) => {
      const cells = phases.map(ph => {
        const items = ph[key] || [];
        if (!items.length) return `<td class="data-cell data-cell--empty">\u2014</td>`;
        return `<td class="data-cell data-cell--${key.toLowerCase()}">
          ${items.map(t => `<p>${esc(t)}</p>`).join('')}
        </td>`;
      }).join('');
      return `
        <tr class="grid-row grid-row--${key.toLowerCase()}">
          <th class="row-label">${label}</th>
          ${cells}
        </tr>`;
    }).join('');

    return `
      <div class="journey__grid-wrap">
        <table class="journey__grid"
               aria-label="${esc(this.getAttribute('title') || 'User Journey')} \u2014 phase breakdown">
          <thead>
            <tr>
              <th class="corner">Stage</th>
              ${headCells}
            </tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>`;
  }

  /* ── Helpers ───────────────────────────────── */

  _label(id) {
    return id.replace(/^(activity|persona|journey|story|user)-/, '')
             .replace(/-/g, ' ')
             .replace(/\b\w/g, c => c.toUpperCase());
  }
}

registerComponent('user-journey', UserJourney);

export { UserJourney };
