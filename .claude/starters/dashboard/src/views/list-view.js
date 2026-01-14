/**
 * List View
 * Data listing with search and filters
 */

import { api } from '../app/api.js';

class ListView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const searchInput = this.shadowRoot.getElementById('search');
    searchInput?.addEventListener('input', this.handleSearch.bind(this));
  }

  handleSearch(event) {
    const query = event.target.value;
    const table = this.shadowRoot.querySelector('data-table');
    table?.setAttribute('search', query);
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
          justify-content: space-between;
          align-items: center;
          margin-block-end: var(--space-6, 1.5rem);
        }

        header > h1 {
          font-size: var(--text-2xl, 1.5rem);
          font-weight: var(--font-bold, 700);
          margin: 0;
        }

        nav[data-role="actions"] {
          display: flex;
          gap: var(--space-3, 0.75rem);
          align-items: center;
        }

        input[type="search"] {
          padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
          border: 1px solid var(--border, #e5e5e5);
          border-radius: var(--radius-md, 0.375rem);
          font-size: var(--text-sm, 0.875rem);
          inline-size: 16rem;
        }

        input[type="search"]:focus {
          outline: 2px solid var(--primary, #1e40af);
          outline-offset: 2px;
        }

        button {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2, 0.5rem);
          padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
          background: var(--primary, #1e40af);
          color: var(--primary-foreground, #fff);
          border: none;
          border-radius: var(--radius-md, 0.375rem);
          font-size: var(--text-sm, 0.875rem);
          font-weight: var(--font-medium, 500);
          cursor: pointer;
        }

        button:hover {
          background: var(--primary-hover, #1e3a8a);
        }

        section {
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e5e5e5);
          border-radius: var(--radius-lg, 0.5rem);
          overflow: hidden;
        }
      </style>

      <header>
        <h1>Items</h1>
        <nav data-role="actions">
          <input
            type="search"
            id="search"
            placeholder="Search items..."
            aria-label="Search items"
          />
          <button type="button">
            <span aria-hidden="true">+</span>
            Add Item
          </button>
        </nav>
      </header>

      <section>
        <data-table
          columns='[{"key":"id","label":"ID"},{"key":"name","label":"Name"},{"key":"status","label":"Status"},{"key":"created","label":"Created"}]'
          data-src="/items"
          row-link="/list/{id}">
        </data-table>
      </section>
    `;
  }
}

customElements.define('list-view', ListView);
