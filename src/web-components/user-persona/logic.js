/**
 * user-persona: User persona card for UX planning
 *
 * Displays a persona with avatar, demographics, quote, and slotted
 * sections for bio, goals, frustrations, and behaviors. Uses Shadow DOM
 * for encapsulation and VB design tokens for theming.
 *
 * @attr {string}  name     - Persona name (drives avatar initials and color)
 * @attr {string}  role     - Job title or role
 * @attr {string}  age      - Age display
 * @attr {string}  location - Location display
 * @attr {string}  avatar   - Optional avatar image URL
 * @attr {string}  quote    - Key quote displayed in highlight block
 * @attr {boolean} compact  - Reduced spacing variant
 *
 * @fires persona-ready - After initial render, detail: { name, role }
 *
 * @example
 * <user-persona name="Sarah Chen" role="Product Manager" age="34"
 *   location="San Francisco, CA"
 *   quote="I need tools that help me stay organized.">
 *   <p slot="bio">Sarah has 8 years of PM experience.</p>
 *   <ul slot="goals"><li>Streamline communication</li></ul>
 *   <ul slot="frustrations"><li>Too many disconnected tools</li></ul>
 *   <ul slot="behaviors"><li>Checks dashboards every morning</li></ul>
 * </user-persona>
 */
import { styles } from './styles.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { esc, initials, hashColor } from '../_ux-base.js';

class UserPersona extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'role', 'age', 'location', 'avatar', 'quote', 'compact', 'src'];
  }

  #slotCache = new Map();

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  #cacheSlotValues() {
    for (const child of [...this.children]) {
      const slotName = child.getAttribute('slot');
      if (slotName && !this.getAttribute(slotName)) {
        this.#slotCache.set(slotName, child.textContent.trim());
      }
    }
  }

  _resolve(attr) {
    return this.getAttribute(attr) || this.#slotCache.get(attr) || '';
  }

  async _loadSrc(url) {
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Map JSON fields to attributes
      for (const key of ['name', 'role', 'age', 'location', 'avatar', 'quote']) {
        if (data[key]) this.setAttribute(key, data[key]);
      }
      // For list fields, store as JSON in slot cache (render will handle)
      for (const key of ['bio', 'goals', 'frustrations', 'behaviors']) {
        if (data[key]) {
          if (Array.isArray(data[key])) {
            this.#slotCache.set(key, data[key]);
          } else {
            this.#slotCache.set(key, data[key]);
          }
        }
      }
      this.#render();
    } catch (err) {
      console.warn(`[user-persona] Failed to load src="${url}":`, err);
    }
  }

  connectedCallback() {
    this.#cacheSlotValues();
    if (this.hasAttribute('src')) {
      this._loadSrc(this.getAttribute('src'));
    }
    this.#render();
    this.setAttribute('data-upgraded', '');
    this.dispatchEvent(new CustomEvent('persona-ready', {
      bubbles: true,
      composed: true,
      detail: { name: this.personaName, role: this.personaRole }
    }));
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

  // ── Attribute getters ──────────────────────────────────────────────

  get personaName() {
    return this._resolve('name') || 'Unnamed Persona';
  }

  get personaRole() {
    return this._resolve('role') || '';
  }

  get age() {
    return this._resolve('age') || '';
  }

  get location() {
    return this._resolve('location') || '';
  }

  get avatar() {
    return this._resolve('avatar') || '';
  }

  get quote() {
    return this._resolve('quote') || '';
  }

  get compact() {
    return this.hasAttribute('compact');
  }

  // ── Render ─────────────────────────────────────────────────────────

  #render() {
    const name = this.personaName;
    const role = this.personaRole;
    const age = this.age;
    const loc = this.location;
    const avatarUrl = this.avatar;
    const quote = this.quote;
    const avatarBg = hashColor(name);

    const avatarStyle = avatarUrl
      ? `background:url(${esc(avatarUrl)}) center/cover`
      : `background:${avatarBg}`;

    /** @type {ShadowRoot} */ (this.shadowRoot).innerHTML = `
      <style>${styles}</style>

      <article class="persona-card" part="card" role="article"
        aria-label="User persona: ${esc(name)}">

        <header class="persona-header" part="header">
          <div class="avatar" part="avatar" style="${avatarStyle}"
            role="img" aria-label="Avatar for ${esc(name)}">
            ${!avatarUrl ? esc(initials(name)) : ''}
          </div>
          <div class="header-info">
            <h2 class="persona-name" part="name">${esc(name)}</h2>
            ${role ? `<p class="persona-role" part="role">${esc(role)}</p>` : ''}
            <div class="persona-meta" part="meta">
              ${age ? `
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                  ${esc(age)} years old
                </span>
              ` : ''}
              ${loc ? `
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  ${esc(loc)}
                </span>
              ` : ''}
            </div>
          </div>
        </header>

        ${quote ? `
          <div class="persona-quote" part="quote">
            <span class="quote-mark" aria-hidden="true">&ldquo;</span>
            <p class="quote-text">${esc(quote)}</p>
          </div>
        ` : ''}

        <div class="persona-body" part="body">
          <div class="section" part="section-bio">
            <div class="section-header">
              <div class="section-icon bio" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <span class="section-title">Background</span>
            </div>
            <div class="section-content">
              <slot name="bio">No background information provided.</slot>
            </div>
          </div>

          <div class="section" part="section-goals">
            <div class="section-header">
              <div class="section-icon goals" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </div>
              <span class="section-title">Goals</span>
            </div>
            <div class="section-content">
              <slot name="goals">No goals specified.</slot>
            </div>
          </div>

          <div class="section" part="section-frustrations">
            <div class="section-header">
              <div class="section-icon frustrations" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              </div>
              <span class="section-title">Frustrations</span>
            </div>
            <div class="section-content">
              <slot name="frustrations">No frustrations listed.</slot>
            </div>
          </div>

          <div class="section" part="section-behaviors">
            <div class="section-header">
              <div class="section-icon behaviors" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
              </div>
              <span class="section-title">Behaviors</span>
            </div>
            <div class="section-content">
              <slot name="behaviors">No behaviors documented.</slot>
            </div>
          </div>
        </div>
      </article>
    `;
  }
}

registerComponent('user-persona', UserPersona);

export { UserPersona };
