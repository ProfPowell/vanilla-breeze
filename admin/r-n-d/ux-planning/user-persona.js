/**
 * <user-persona> Web Component
 * Displays user personas in an Agile-friendly visual format
 *
 * @example
 * <user-persona
 *   name="Sarah Chen"
 *   role="Product Manager"
 *   age="34"
 *   location="San Francisco, CA"
 *   avatar="https://example.com/avatar.jpg"
 *   quote="I need tools that help me stay organized across multiple projects.">
 *
 *   <p slot="bio">Sarah has 8 years of experience in product management...</p>
 *   <ul slot="goals">
 *     <li>Streamline team communication</li>
 *     <li>Track project progress efficiently</li>
 *   </ul>
 *   <ul slot="frustrations">
 *     <li>Too many disconnected tools</li>
 *     <li>Difficulty getting stakeholder buy-in</li>
 *   </ul>
 * </user-persona>
 */

class UserPersona extends HTMLElement {
	static get observedAttributes() {
		return ['name', 'role', 'age', 'location', 'avatar', 'quote', 'mode', 'compact'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		this._render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue && this.shadowRoot) {
			this._render();
		}
	}

	// Attribute getters
	get personaName() {
		return this.getAttribute('name') || 'Unnamed Persona';
	}

	get role() {
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

	get quote() {
		return this.getAttribute('quote') || '';
	}

	get mode() {
		return this.getAttribute('mode') || 'auto';
	}

	get compact() {
		return this.hasAttribute('compact');
	}

	_getInitials(name) {
		return name
			.split(' ')
			.map(n => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	_generateAvatarColor(name) {
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}
		const hue = hash % 360;
		return `hsl(${hue}, 65%, 55%)`;
	}

	_render() {
		const isDark = this.mode === 'dark' ||
			(this.mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

		const avatarBg = this._generateAvatarColor(this.personaName);

		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--user-persona-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
          --up-bg: ${isDark ? '#1e1e1e' : '#ffffff'};
          --up-card-bg: ${isDark ? '#252525' : '#f8f9fa'};
          --up-text: ${isDark ? '#e8e8e8' : '#1a1a1a'};
          --up-muted: ${isDark ? '#888888' : '#666666'};
          --up-border: ${isDark ? '#333333' : '#e0e0e0'};
          --up-accent: ${isDark ? '#6b9fff' : '#0066cc'};
          --up-goals: ${isDark ? '#4ade80' : '#22c55e'};
          --up-frustrations: ${isDark ? '#f87171' : '#ef4444'};
        }

        .persona-card {
          background: var(--up-bg);
          border: 1px solid var(--up-border);
          border-radius: var(--user-persona-radius, 16px);
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .persona-header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          background: linear-gradient(135deg, ${isDark ? '#2a2a2a' : '#f0f4f8'} 0%, ${isDark ? '#1e1e1e' : '#ffffff'} 100%);
          border-bottom: 1px solid var(--up-border);
        }

        :host([compact]) .persona-header {
          padding: 16px;
          gap: 16px;
        }

        .avatar {
          width: var(--user-persona-avatar-size, 80px);
          height: var(--user-persona-avatar-size, 80px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 600;
          color: white;
          background: ${this.avatar ? `url(${this.avatar}) center/cover` : avatarBg};
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        :host([compact]) .avatar {
          width: 56px;
          height: 56px;
          font-size: 20px;
        }

        .header-info {
          flex: 1;
          min-width: 0;
        }

        .persona-name {
          font-size: 24px;
          font-weight: 700;
          color: var(--up-text);
          margin: 0 0 4px 0;
        }

        :host([compact]) .persona-name {
          font-size: 18px;
        }

        .persona-role {
          font-size: 16px;
          color: var(--up-accent);
          font-weight: 500;
          margin: 0;
        }

        :host([compact]) .persona-role {
          font-size: 14px;
        }

        .persona-meta {
          display: flex;
          gap: 16px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--up-muted);
        }

        .meta-item svg {
          width: 14px;
          height: 14px;
          fill: currentColor;
          opacity: 0.7;
        }

        .persona-quote {
          padding: 20px 24px;
          background: var(--up-card-bg);
          border-bottom: 1px solid var(--up-border);
          position: relative;
        }

        :host([compact]) .persona-quote {
          padding: 16px;
        }

        .quote-mark {
          position: absolute;
          top: 12px;
          left: 16px;
          font-size: 48px;
          line-height: 1;
          color: var(--up-accent);
          opacity: 0.2;
          font-family: Georgia, serif;
        }

        .quote-text {
          font-size: 16px;
          font-style: italic;
          color: var(--up-text);
          line-height: 1.6;
          margin: 0;
          padding-left: 24px;
        }

        :host([compact]) .quote-text {
          font-size: 14px;
        }

        .persona-body {
          padding: 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }

        :host([compact]) .persona-body {
          padding: 16px;
          gap: 16px;
        }

        .section {
          background: var(--up-card-bg);
          border-radius: 12px;
          padding: 16px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .section-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .section-icon svg {
          width: 16px;
          height: 16px;
          fill: white;
        }

        .section-icon.bio { background: var(--up-accent); }
        .section-icon.goals { background: var(--up-goals); }
        .section-icon.frustrations { background: var(--up-frustrations); }
        .section-icon.behaviors { background: #8b5cf6; }
        .section-icon.needs { background: #f59e0b; }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--up-text);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .section-content {
          color: var(--up-text);
          font-size: 14px;
          line-height: 1.6;
        }

        .section-content ::slotted(ul),
        .section-content ::slotted(ol) {
          margin: 0;
          padding-left: 20px;
        }

        .section-content ::slotted(li) {
          margin-bottom: 8px;
        }

        .section-content ::slotted(p) {
          margin: 0;
        }

        /* Empty slot handling */
        slot:not([name])::slotted(*) {
          color: var(--up-text);
        }

        @media (max-width: 600px) {
          .persona-header {
            flex-direction: column;
            text-align: center;
          }

          .persona-meta {
            justify-content: center;
          }

          .persona-body {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
          }
        }
      </style>

      <article class="persona-card" part="card" role="article" aria-label="User persona: ${this.personaName}">
        <header class="persona-header" part="header">
          <div class="avatar" part="avatar" role="img" aria-label="Avatar for ${this.personaName}">
            ${!this.avatar ? this._getInitials(this.personaName) : ''}
          </div>
          <div class="header-info">
            <h2 class="persona-name" part="name">${this.personaName}</h2>
            ${this.role ? `<p class="persona-role" part="role">${this.role}</p>` : ''}
            <div class="persona-meta" part="meta">
              ${this.age ? `
                <span class="meta-item">
                  <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                  ${this.age} years old
                </span>
              ` : ''}
              ${this.location ? `
                <span class="meta-item">
                  <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  ${this.location}
                </span>
              ` : ''}
            </div>
          </div>
        </header>

        ${this.quote ? `
          <div class="persona-quote" part="quote">
            <span class="quote-mark" aria-hidden="true">"</span>
            <p class="quote-text">${this.quote}</p>
          </div>
        ` : ''}

        <div class="persona-body" part="body">
          <div class="section" part="section">
            <div class="section-header">
              <div class="section-icon bio">
                <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <span class="section-title">Background</span>
            </div>
            <div class="section-content">
              <slot name="bio">No background information provided.</slot>
            </div>
          </div>

          <div class="section" part="section">
            <div class="section-header">
              <div class="section-icon goals">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </div>
              <span class="section-title">Goals</span>
            </div>
            <div class="section-content">
              <slot name="goals">No goals specified.</slot>
            </div>
          </div>

          <div class="section" part="section">
            <div class="section-header">
              <div class="section-icon frustrations">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              </div>
              <span class="section-title">Frustrations</span>
            </div>
            <div class="section-content">
              <slot name="frustrations">No frustrations listed.</slot>
            </div>
          </div>

          <div class="section" part="section">
            <div class="section-header">
              <div class="section-icon behaviors">
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

customElements.define('user-persona', UserPersona);

export { UserPersona };