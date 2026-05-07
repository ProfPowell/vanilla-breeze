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
import { portraitUrl } from '../../lib/portrait-url.js';

/** Simple string hash → integer (same algorithm as portrait-url.js). */
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return h;
}

// ── Mock persona corpus (~1 KB) ───────────────────────────────────────
const MOCK_NAMES = [
  'Sarah Chen', 'Marcus Johnson', 'Aisha Patel', 'James O\'Brien',
  'Yuki Tanaka', 'Elena Rodriguez', 'David Kim', 'Fatima Al-Hassan',
  'Lucas Silva', 'Priya Sharma', 'Noah Williams', 'Mei Lin',
  'Carlos Mendez', 'Amara Osei', 'Henrik Larsson', 'Zara Ahmed',
];
const MOCK_ROLES = [
  'Product Manager', 'UX Designer', 'Frontend Developer', 'Data Analyst',
  'Marketing Lead', 'QA Engineer', 'DevOps Lead', 'Content Strategist',
  'Startup Founder', 'IT Director', 'Customer Success Lead', 'Research Scientist',
];
const MOCK_LOCATIONS = [
  'San Francisco, CA', 'Austin, TX', 'London, UK', 'Toronto, CA',
  'Berlin, DE', 'Tokyo, JP', 'Sydney, AU', 'S\u00e3o Paulo, BR',
];
const MOCK_QUOTES = [
  'I need tools that help me stay organized without slowing me down.',
  'The dashboard is where I live \u2014 it has to be fast and reliable.',
  'I want to understand the data, not fight the interface.',
  'If it takes more than two clicks, I\u2019ll find another way.',
  'Collaboration shouldn\u2019t mean endless notification noise.',
  'I just want it to work the way I expect it to.',
  'Give me the big picture first, then let me drill into details.',
  'Accessibility isn\u2019t a nice-to-have \u2014 it\u2019s how I use the web.',
];
const MOCK_GOALS = [
  'Streamline daily workflows', 'Reduce context-switching',
  'Stay aligned with the team', 'Make data-driven decisions quickly',
  'Ship features on a predictable cadence', 'Automate repetitive tasks',
  'Improve onboarding experience', 'Keep documentation up to date',
];
const MOCK_FRUSTRATIONS = [
  'Too many disconnected tools', 'Slow page loads break focus',
  'Unclear ownership of tasks', 'Settings that reset unexpectedly',
  'Notifications that bury important updates', 'Poor mobile experience',
  'Inconsistent design across features', 'No offline support',
];
const MOCK_BEHAVIORS = [
  'Checks dashboards every morning', 'Prefers keyboard shortcuts over mouse',
  'Skims docs, reads deeply only when stuck', 'Shares screenshots in Slack',
  'Batches email to twice a day', 'Tests features in incognito first',
  'Bookmarks frequently used reports', 'Uses dark mode exclusively',
];

class UserPersona extends HTMLElement {
  static get observedAttributes() {
    return ['role', 'age', 'location', 'avatar', 'compact', 'src', 'data-list-stories', 'id'];
  }

  #slotCache = new Map();
  /** @type {MutationObserver | null} */
  #storyObserver = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /**
   * Find every <user-story> in the document whose `persona-id` matches
   * this persona's id. Returns elements in document order.
   * @returns {Element[]}
   */
  relatedStories() {
    if (!this.id) return [];
    const root = this.getRootNode();
    const scope = root.querySelectorAll ? root : document;
    return Array.from(scope.querySelectorAll(`user-story[persona-id="${cssEscape(this.id)}"]`));
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

  /* ── Data API ──────────────────────────────────── */

  /**
   * Read the persona as a plain data object. Mirrors what a consumer
   * would assign to .data — useful for diffing or persistence.
   */
  get data() {
    return {
      name: this.personaName,
      role: this.personaRole || undefined,
      age: this.age || undefined,
      location: this.location || undefined,
      avatar: this.avatar || undefined,
      quote: this.quote || undefined,
      bio: this.#slotCache.get('bio') || undefined,
      goals: this.#slotCache.get('goals') || undefined,
      frustrations: this.#slotCache.get('frustrations') || undefined,
      behaviors: this.#slotCache.get('behaviors') || undefined,
    };
  }

  /**
   * Set state attributes and slotted content from a plain object in one
   * call. Idempotent for repeat calls.
   */
  set data(value) {
    if (!value || typeof value !== 'object') return;
    this._applyData(value);
    if (this.shadowRoot) this.#render();
    this.dispatchEvent(new CustomEvent('user-persona:data-changed', {
      detail: { data: this.data, source: 'property' },
      bubbles: true, composed: true,
    }));
  }

  /**
   * Apply a data record to attributes + slotted children. Used by both
   * the .data setter and async _loadSrc.
   * @param {Record<string, unknown>} data
   */
  _applyData(data) {
    for (const key of ['role', 'age', 'location', 'avatar']) {
      if (data[key]) this.setAttribute(key, data[key]);
    }
    if (data.name && !this.querySelector('[slot="name"]')) {
      const el = document.createElement('h2');
      el.slot = 'name';
      el.textContent = data.name;
      this.appendChild(el);
    }
    if (data.quote && !this.querySelector('[slot="quote"]')) {
      const el = document.createElement('p');
      el.slot = 'quote';
      el.textContent = data.quote;
      this.appendChild(el);
    }
    for (const key of ['bio', 'goals', 'frustrations', 'behaviors']) {
      if (data[key]) this.#slotCache.set(key, data[key]);
    }
  }

  async _loadSrc(url) {
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this._applyData(data);
      this.#render();
    } catch (err) {
      console.warn(`[user-persona] Failed to load src="${url}":`, err);
    }
  }

  connectedCallback() {
    this.#cacheSlotValues();
    if (this.hasAttribute('data-mock')) {
      this.#applyMock();
    } else if (this.hasAttribute('src')) {
      this._loadSrc(this.getAttribute('src'));
    }
    this.#render();
    this.#syncStoryObserver();
    this.setAttribute('data-upgraded', '');
    this.dispatchEvent(new CustomEvent('persona-ready', {
      bubbles: true,
      composed: true,
      detail: { name: this.personaName, role: this.personaRole }
    }));
  }

  disconnectedCallback() {
    this.removeAttribute('data-upgraded');
    this.#storyObserver?.disconnect();
    this.#storyObserver = null;
  }

  /**
   * Watch the document for added/removed/relabeled <user-story> elements
   * so the auto-rendered Stories section stays current. Only runs when
   * data-list-stories is present.
   */
  #syncStoryObserver() {
    if (!this.hasAttribute('data-list-stories') || !this.id) {
      this.#storyObserver?.disconnect();
      this.#storyObserver = null;
      return;
    }
    if (this.#storyObserver) return;
    this.#storyObserver = new MutationObserver(() => this.#renderStoriesSection());
    this.#storyObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['persona-id'],
    });
  }

  /**
   * Re-render only the Stories section in-place so MutationObserver
   * callbacks don't have to rebuild the whole shadow tree.
   */
  #renderStoriesSection() {
    if (!this.shadowRoot) return;
    const slot = this.shadowRoot.querySelector('[data-stories-section]');
    if (!slot) return;
    slot.outerHTML = this.#storiesSectionHtml();
  }

  /** Markup for the optional Stories section. */
  #storiesSectionHtml() {
    if (!this.hasAttribute('data-list-stories') || !this.id) return '';
    const stories = this.relatedStories();
    return `
      <section class="section" part="section-stories" data-stories-section>
        <div class="section-header">
          <div class="section-icon stories" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          </div>
          <span class="section-title">Stories <span class="section-count">${stories.length}</span></span>
        </div>
        <div class="section-content">
          ${stories.length === 0
            ? '<p class="empty-stories">No user stories reference this persona yet.</p>'
            : `<ul class="story-list">${
                stories.map(s => {
                  const id = s.id || s.getAttribute('story-id') || '';
                  const action = s.querySelector('[slot="action"]')?.textContent?.trim()
                    || s.getAttribute('action')
                    || (s.id || 'untitled');
                  const priority = s.getAttribute('priority') || '';
                  const status = s.getAttribute('status') || '';
                  return `<li class="story-item" data-priority="${esc(priority)}" data-status="${esc(status)}">${
                    id
                      ? `<a href="#${esc(id)}">${esc(action)}</a>`
                      : `<span>${esc(action)}</span>`
                  }${priority ? `<span class="story-meta">${esc(priority)}</span>` : ''}${status ? `<span class="story-meta">${esc(status)}</span>` : ''}</li>`;
                }).join('')
              }</ul>`}
        </div>
      </section>
    `;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.shadowRoot) return;
    if (name === 'src' && this.isConnected) {
      this._loadSrc(newValue);
      return;
    }
    if (name === 'data-list-stories' || name === 'id') {
      this.#syncStoryObserver();
    }
    this.#render();
  }

  // ── Attribute getters ──────────────────────────────────────────────

  /** Read name from slotted heading or cache */
  get personaName() {
    const slotted = this.querySelector('[slot="name"]');
    return slotted?.textContent?.trim() || this.#slotCache.get('name') || 'Unnamed Persona';
  }

  get personaRole() {
    return this.getAttribute('role') || '';
  }

  get age() {
    return this.getAttribute('age') || '';
  }

  get location() {
    return this.getAttribute('location') || '';
  }

  get avatar() {
    return this.getAttribute('avatar') || '';
  }

  /** Read quote from slotted element or cache */
  get quote() {
    const slotted = this.querySelector('[slot="quote"]');
    return slotted?.textContent?.trim() || this.#slotCache.get('quote') || '';
  }

  get compact() {
    return this.hasAttribute('compact');
  }

  // ── Mock data ──────────────────────────────────────────────────────

  #applyMock() {
    const seed = this.dataset.seed || this.dataset.mock || String(Date.now());
    const pick = (arr) => arr[((hash(seed + arr.length) % arr.length) + arr.length) % arr.length];
    const pickN = (arr, n) => {
      const out = [];
      for (let i = 0; i < n; i++) {
        out.push(arr[((hash(seed + i + arr.length) % arr.length) + arr.length) % arr.length]);
      }
      return [...new Set(out)];
    };

    // Name and quote are slotted content, not attributes
    if (!this.querySelector('[slot="name"]')) {
      const h2 = document.createElement('h2');
      h2.slot = 'name';
      h2.textContent = pick(MOCK_NAMES);
      this.appendChild(h2);
    }
    if (!this.getAttribute('role'))     this.setAttribute('role', pick(MOCK_ROLES));
    if (!this.getAttribute('age'))      this.setAttribute('age', String(25 + ((hash(seed) % 30) + 30) % 30));
    if (!this.getAttribute('location')) this.setAttribute('location', pick(MOCK_LOCATIONS));
    if (!this.getAttribute('avatar')) {
      const name = this.querySelector('[slot="name"]')?.textContent?.trim() || 'Persona';
      this.setAttribute('avatar', portraitUrl(name, 256));
    }
    if (!this.querySelector('[slot="quote"]')) {
      const p = document.createElement('p');
      p.slot = 'quote';
      p.textContent = pick(MOCK_QUOTES);
      this.appendChild(p);
    }

    // Inject slotted sections as light DOM so native <slot> picks them up
    const injectList = (slotName, items) => {
      if (this.querySelector(`[slot="${slotName}"]`)) return;
      const ul = document.createElement('ul');
      ul.setAttribute('slot', slotName);
      for (const item of items) {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      }
      this.appendChild(ul);
    };
    injectList('goals', pickN(MOCK_GOALS, 3));
    injectList('frustrations', pickN(MOCK_FRUSTRATIONS, 3));
    injectList('behaviors', pickN(MOCK_BEHAVIORS, 3));
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
            <div class="persona-name-wrap" part="name">
              <slot name="name"><h2 class="persona-name-fallback">${esc(name)}</h2></slot>
            </div>
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

        ${quote || this.querySelector('[slot="quote"]') ? `
          <div class="persona-quote" part="quote">
            <span class="quote-mark" aria-hidden="true">&ldquo;</span>
            <div class="quote-text-wrap"><slot name="quote"><p class="quote-text">${esc(quote)}</p></slot></div>
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

          ${this.#storiesSectionHtml()}
        </div>
      </article>
    `;
  }
}

function cssEscape(s) {
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(String(s)) : String(s).replace(/["\\]/g, '\\$&');
}

registerComponent('user-persona', UserPersona);

export { UserPersona };
