/**
 * Stat Card
 * Metric display card with icon and trend
 */

class StatCard extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'value', 'trend', 'icon'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  get label() {
    return this.getAttribute('label') || '';
  }

  get value() {
    return this.getAttribute('value') || '0';
  }

  get trend() {
    return this.getAttribute('trend') || '';
  }

  get icon() {
    return this.getAttribute('icon') || 'activity';
  }

  get trendDirection() {
    if (!this.trend) return 'neutral';
    return this.trend.startsWith('+') ? 'up' : this.trend.startsWith('-') ? 'down' : 'neutral';
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        article {
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e5e5e5);
          border-radius: var(--radius-lg, 0.5rem);
          padding: var(--space-4, 1rem);
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-block-end: var(--space-2, 0.5rem);
        }

        header > span {
          font-size: var(--text-sm, 0.875rem);
          color: var(--text-muted, #666);
          font-weight: var(--font-medium, 500);
        }

        header > x-icon {
          inline-size: 1.5rem;
          block-size: 1.5rem;
          color: var(--text-muted, #666);
        }

        [data-role="value"] {
          font-size: var(--text-2xl, 1.5rem);
          font-weight: var(--font-bold, 700);
          color: var(--text, #1a1a1a);
          line-height: 1.2;
        }

        [data-trend] {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1, 0.25rem);
          font-size: var(--text-sm, 0.875rem);
          margin-block-start: var(--space-1, 0.25rem);
        }

        [data-trend="up"] {
          color: var(--success, #16a34a);
        }

        [data-trend="down"] {
          color: var(--error, #dc2626);
        }

        [data-trend="neutral"] {
          color: var(--text-muted, #666);
        }

        [data-trend] x-icon {
          inline-size: 1rem;
          block-size: 1rem;
        }
      </style>

      <article>
        <header>
          <span>${this.label}</span>
          <x-icon name="${this.icon}"></x-icon>
        </header>
        <div data-role="value">${this.value}</div>
        ${this.trend ? `
          <div data-trend="${this.trendDirection}">
            ${this.trendDirection === 'up' ? '<x-icon name="trending-up"></x-icon>' : ''}
            ${this.trendDirection === 'down' ? '<x-icon name="trending-down"></x-icon>' : ''}
            <span>${this.trend}</span>
          </div>
        ` : ''}
      </article>
    `;
  }
}

customElements.define('stat-card', StatCard);