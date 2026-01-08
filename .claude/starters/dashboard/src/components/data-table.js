/**
 * Data Table
 * Sortable, filterable data table component
 */

import { api } from '../app/api.js';

class DataTable extends HTMLElement {
  static get observedAttributes() {
    return ['columns', 'data-src', 'search', 'limit', 'row-link'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.data = [];
    this.sortColumn = null;
    this.sortDirection = 'asc';
  }

  connectedCallback() {
    this.render();
    this.loadData();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'search' && oldValue !== newValue) {
      this.renderBody();
    } else if (name === 'data-src' && oldValue !== newValue) {
      this.loadData();
    }
  }

  get columns() {
    try {
      return JSON.parse(this.getAttribute('columns') || '[]');
    } catch {
      return [];
    }
  }

  get searchQuery() {
    return (this.getAttribute('search') || '').toLowerCase();
  }

  get limit() {
    return parseInt(this.getAttribute('limit') || '0', 10);
  }

  get rowLink() {
    return this.getAttribute('row-link') || '';
  }

  async loadData() {
    const src = this.getAttribute('data-src');
    if (!src) return;

    try {
      const response = await api.get(src);
      this.data = Array.isArray(response) ? response : response.items || [];
      this.renderBody();
    } catch (error) {
      console.error('Failed to load table data:', error);
      this.showError('Failed to load data');
    }
  }

  sortBy(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.renderBody();
  }

  getFilteredData() {
    let filtered = [...this.data];

    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(this.searchQuery)
        )
      );
    }

    // Apply sorting
    if (this.sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[this.sortColumn] ?? '';
        const bVal = b[this.sortColumn] ?? '';
        const comparison = String(aVal).localeCompare(String(bVal));
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    // Apply limit
    if (this.limit > 0) {
      filtered = filtered.slice(0, this.limit);
    }

    return filtered;
  }

  renderBody() {
    const tbody = this.shadowRoot.querySelector('tbody');
    if (!tbody) return;

    const filtered = this.getFilteredData();

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${this.columns.length}" data-state="empty">
            No data available
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(row => {
      const rowLink = this.rowLink.replace(/\{(\w+)\}/g, (_, key) => row[key] || '');

      return `
        <tr ${rowLink ? `data-link href="${rowLink}" role="link" tabindex="0"` : ''}>
          ${this.columns.map(col => `
            <td>${this.formatValue(row[col.key], col)}</td>
          `).join('')}
        </tr>
      `;
    }).join('');

    // Add click handlers for row links
    if (this.rowLink) {
      tbody.querySelectorAll('tr[data-link]').forEach(row => {
        row.addEventListener('click', () => {
          window.history.pushState({}, '', row.getAttribute('href'));
          window.dispatchEvent(new PopStateEvent('popstate'));
        });
        row.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            row.click();
          }
        });
      });
    }
  }

  formatValue(value, column) {
    if (value === null || value === undefined) return '';
    if (column.format === 'date') {
      return new Date(value).toLocaleDateString();
    }
    if (column.format === 'currency') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    return String(value);
  }

  showError(message) {
    const tbody = this.shadowRoot.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${this.columns.length}" data-state="error">
            ${message}
          </td>
        </tr>
      `;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        table {
          inline-size: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
          text-align: start;
        }

        th {
          background: var(--surface-alt, #f9fafb);
          font-weight: var(--font-semibold, 600);
          font-size: var(--text-sm, 0.875rem);
          color: var(--text-muted, #666);
          border-block-end: 1px solid var(--border, #e5e5e5);
          cursor: pointer;
          user-select: none;
        }

        th:hover {
          background: var(--hover-bg, #f5f5f5);
        }

        th > span[data-role="sort"] {
          margin-inline-start: var(--space-1, 0.25rem);
          opacity: 0.5;
        }

        th[aria-sort] > span[data-role="sort"] {
          opacity: 1;
        }

        td {
          font-size: var(--text-sm, 0.875rem);
          border-block-end: 1px solid var(--border, #e5e5e5);
        }

        tr[data-link] {
          cursor: pointer;
        }

        tr[data-link]:hover td {
          background: var(--hover-bg, #f5f5f5);
        }

        tr[data-link]:focus {
          outline: 2px solid var(--primary, #1e40af);
          outline-offset: -2px;
        }

        [data-state="empty"],
        [data-state="error"] {
          text-align: center;
          color: var(--text-muted, #666);
          padding: var(--space-8, 2rem);
        }

        [data-state="error"] {
          color: var(--error, #dc2626);
        }
      </style>

      <table>
        <thead>
          <tr>
            ${this.columns.map(col => `
              <th
                data-column="${col.key}"
                ${this.sortColumn === col.key ? `aria-sort="${this.sortDirection === 'asc' ? 'ascending' : 'descending'}"` : ''}
              >
                ${col.label}
                <span data-role="sort">
                  ${this.sortColumn === col.key
                    ? (this.sortDirection === 'asc' ? '↑' : '↓')
                    : '↕'}
                </span>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="${this.columns.length}" data-state="empty">Loading...</td>
          </tr>
        </tbody>
      </table>
    `;

    // Add sort handlers
    this.shadowRoot.querySelectorAll('th').forEach(th => {
      th.addEventListener('click', () => {
        this.sortBy(th.dataset.column);
        // Update header aria-sort
        this.shadowRoot.querySelectorAll('th').forEach(h => h.removeAttribute('aria-sort'));
        th.setAttribute('aria-sort', this.sortDirection === 'asc' ? 'ascending' : 'descending');
        th.querySelector('[data-role="sort"]').textContent =
          this.sortDirection === 'asc' ? '↑' : '↓';
      });
    });
  }
}

customElements.define('data-table', DataTable);
