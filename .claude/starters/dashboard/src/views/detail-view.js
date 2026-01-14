/**
 * Detail View
 * Single item detail page
 */

import { api } from '../app/api.js';
import { router } from '../app/router.js';

class DetailView extends HTMLElement {
  static get observedAttributes() {
    return ['id'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.item = null;
  }

  connectedCallback() {
    this.render();
    this.loadItem();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'id' && oldValue !== newValue) {
      this.loadItem();
    }
  }

  async loadItem() {
    const id = this.getAttribute('id');
    if (!id) return;

    try {
      this.item = await api.get(`/items/${id}`);
      this.updateContent();
    } catch (error) {
      console.error('Failed to load item:', error);
      this.showError('Item not found');
    }
  }

  updateContent() {
    if (!this.item) return;

    const title = this.shadowRoot.querySelector('h1');
    const content = this.shadowRoot.querySelector('[data-role="content"]');

    if (title) title.textContent = this.item.name || 'Untitled';
    if (content) {
      content.innerHTML = `
        <dl>
          <div>
            <dt>ID</dt>
            <dd>${this.item.id}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd><span data-status="${this.item.status}">${this.item.status}</span></dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>${new Date(this.item.created).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>${this.item.description || 'No description'}</dd>
          </div>
        </dl>
      `;
    }
  }

  showError(message) {
    const content = this.shadowRoot.querySelector('[data-role="content"]');
    if (content) {
      content.innerHTML = `<p data-state="error">${message}</p>`;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: var(--space-6, 1.5rem);
        }

        header {
          display: flex;
          align-items: center;
          gap: var(--space-4, 1rem);
          margin-block-end: var(--space-6, 1.5rem);
        }

        a[data-role="back"] {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2, 0.5rem);
          color: var(--text-muted, #666);
          text-decoration: none;
          font-size: var(--text-sm, 0.875rem);
        }

        a[data-role="back"]:hover {
          color: var(--primary, #1e40af);
        }

        h1 {
          font-size: var(--text-2xl, 1.5rem);
          font-weight: var(--font-bold, 700);
          margin: 0;
        }

        article {
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e5e5e5);
          border-radius: var(--radius-lg, 0.5rem);
          padding: var(--space-6, 1.5rem);
        }

        dl {
          display: grid;
          gap: var(--space-4, 1rem);
          margin: 0;
        }

        dl > div {
          display: grid;
          grid-template-columns: 8rem 1fr;
          gap: var(--space-2, 0.5rem);
        }

        dl > div > dt {
          font-weight: var(--font-medium, 500);
          color: var(--text-muted, #666);
        }

        dl > div > dd {
          margin: 0;
        }

        [data-status] {
          display: inline-block;
          padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
          border-radius: var(--radius-sm, 0.25rem);
          font-size: var(--text-sm, 0.875rem);
          font-weight: var(--font-medium, 500);
          text-transform: capitalize;
        }

        [data-status="active"] {
          background: var(--success-bg, #dcfce7);
          color: var(--success, #16a34a);
        }

        [data-status="pending"] {
          background: var(--warning-bg, #fef3c7);
          color: var(--warning, #d97706);
        }

        [data-status="inactive"] {
          background: var(--error-bg, #fee2e2);
          color: var(--error, #dc2626);
        }

        [data-state="error"] {
          color: var(--error, #dc2626);
          text-align: center;
          padding: var(--space-4, 1rem);
        }

        nav[data-role="actions"] {
          display: flex;
          gap: var(--space-3, 0.75rem);
          margin-block-start: var(--space-6, 1.5rem);
          padding-block-start: var(--space-6, 1.5rem);
          border-block-start: 1px solid var(--border, #e5e5e5);
        }

        button {
          padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
          border-radius: var(--radius-md, 0.375rem);
          font-size: var(--text-sm, 0.875rem);
          font-weight: var(--font-medium, 500);
          cursor: pointer;
        }

        button {
          background: var(--primary, #1e40af);
          color: var(--primary-foreground, #fff);
          border: none;
        }

        button.secondary {
          background: transparent;
          color: var(--text, #1a1a1a);
          border: 1px solid var(--border, #e5e5e5);
        }

        [data-variant="danger"] {
          background: transparent;
          color: var(--error, #dc2626);
          border: 1px solid var(--error, #dc2626);
        }
      </style>

      <header>
        <a href="/list" data-link data-role="back">
          <span aria-hidden="true">&larr;</span>
          Back to list
        </a>
      </header>

      <h1>Loading...</h1>

      <article>
        <div data-role="content">
          <p>Loading item details...</p>
        </div>

        <nav data-role="actions">
          <button type="button">Edit</button>
          <button type="button" class="secondary">Duplicate</button>
          <button type="button" data-variant="danger">Delete</button>
        </nav>
      </article>
    `;
  }
}

customElements.define('detail-view', DetailView);
