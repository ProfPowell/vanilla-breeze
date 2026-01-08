/**
 * Dashboard View
 * Main dashboard with stats and overview
 */

import { api } from '../app/api.js';

class DashboardView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.loadData();
  }

  async loadData() {
    try {
      const stats = await api.get('/dashboard/stats');
      this.updateStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  updateStats(stats) {
    const cards = this.shadowRoot.querySelectorAll('stat-card');
    if (stats.users) {
      cards[0]?.setAttribute('value', stats.users.toString());
    }
    if (stats.revenue) {
      cards[1]?.setAttribute('value', `$${stats.revenue.toLocaleString()}`);
    }
    if (stats.orders) {
      cards[2]?.setAttribute('value', stats.orders.toString());
    }
    if (stats.growth) {
      cards[3]?.setAttribute('value', `${stats.growth}%`);
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
          margin-block-end: var(--space-6, 1.5rem);
        }

        header > h1 {
          font-size: var(--text-2xl, 1.5rem);
          font-weight: var(--font-bold, 700);
          color: var(--text, #1a1a1a);
          margin: 0;
        }

        header > p {
          color: var(--text-muted, #666);
          margin-block-start: var(--space-1, 0.25rem);
        }

        [data-section="stats"] {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4, 1rem);
          margin-block-end: var(--space-6, 1.5rem);
        }

        section {
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e5e5e5);
          border-radius: var(--radius-lg, 0.5rem);
          padding: var(--space-4, 1rem);
        }

        [data-section="stats"] {
          background: transparent;
          border: none;
          padding: 0;
        }

        section > header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-block-end: var(--space-4, 1rem);
        }

        section > header > h2 {
          font-size: var(--text-lg, 1.125rem);
          font-weight: var(--font-semibold, 600);
          margin: 0;
        }

        a[data-role="view-all"] {
          color: var(--primary, #1e40af);
          text-decoration: none;
          font-size: var(--text-sm, 0.875rem);
        }

        a[data-role="view-all"]:hover {
          text-decoration: underline;
        }
      </style>

      <header>
        <h1>Dashboard</h1>
        <p>Welcome back! Here's an overview of your data.</p>
      </header>

      <section data-section="stats">
        <stat-card
          label="Total Users"
          value="--"
          trend="+12%"
          icon="users">
        </stat-card>
        <stat-card
          label="Revenue"
          value="--"
          trend="+8%"
          icon="dollar-sign">
        </stat-card>
        <stat-card
          label="Orders"
          value="--"
          trend="+23%"
          icon="shopping-cart">
        </stat-card>
        <stat-card
          label="Growth"
          value="--"
          trend="+5%"
          icon="trending-up">
        </stat-card>
      </section>

      <section>
        <header>
          <h2>Recent Activity</h2>
          <a href="/list" data-link data-role="view-all">View all</a>
        </header>
        <data-table
          columns='[{"key":"name","label":"Name"},{"key":"action","label":"Action"},{"key":"date","label":"Date"}]'
          data-src="/dashboard/activity"
          limit="5">
        </data-table>
      </section>
    `;
  }
}

customElements.define('dashboard-view', DashboardView);
