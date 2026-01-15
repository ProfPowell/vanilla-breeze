/**
 * Sidebar Navigation
 * Dashboard navigation menu
 */

import { auth } from '../app/auth.js';
import { router } from '../app/router.js';

class SidebarNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.updateActiveLink();

    // Update active link on navigation
    window.addEventListener('popstate', () => this.updateActiveLink());
  }

  updateActiveLink() {
    const currentPath = window.location.pathname;
    const links = this.shadowRoot.querySelectorAll('nav ul a');

    links.forEach(link => {
      const href = link.getAttribute('href');
      const isActive = href === currentPath ||
        (href !== '/' && currentPath.startsWith(href));
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  render() {
    const user = auth.getUser();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          block-size: 100%;
        }

        header {
          padding: var(--space-4, 1rem);
          border-block-end: 1px solid var(--border, #e5e5e5);
        }

        header > a {
          font-size: var(--text-lg, 1.125rem);
          font-weight: var(--font-bold, 700);
          color: var(--primary, #1e40af);
          text-decoration: none;
        }

        nav {
          flex: 1;
          padding: var(--space-4, 1rem);
        }

        nav > section {
          margin-block-end: var(--space-4, 1rem);
        }

        nav > section > h2 {
          font-size: var(--text-xs, 0.75rem);
          font-weight: var(--font-semibold, 600);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted, #666);
          margin-block-end: var(--space-2, 0.5rem);
          padding-inline: var(--space-3, 0.75rem);
        }

        nav ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        nav ul a {
          display: flex;
          align-items: center;
          gap: var(--space-3, 0.75rem);
          padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
          color: var(--text, #1a1a1a);
          text-decoration: none;
          border-radius: var(--radius-md, 0.375rem);
          font-size: var(--text-sm, 0.875rem);
          transition: background-color 0.15s;
        }

        nav ul a:hover {
          background: var(--hover-bg, #f5f5f5);
        }

        nav ul a[aria-current="page"] {
          background: var(--primary-bg, #eff6ff);
          color: var(--primary, #1e40af);
          font-weight: var(--font-medium, 500);
        }

        nav ul a icon-wc {
          inline-size: 1.25rem;
          block-size: 1.25rem;
          opacity: 0.7;
        }

        nav ul a[aria-current="page"] icon-wc {
          opacity: 1;
        }

        footer {
          padding: var(--space-4, 1rem);
          border-block-start: 1px solid var(--border, #e5e5e5);
        }

        footer > div {
          display: flex;
          align-items: center;
          gap: var(--space-3, 0.75rem);
        }

        [data-role="avatar"] {
          inline-size: 2rem;
          block-size: 2rem;
          border-radius: 50%;
          background: var(--primary, #1e40af);
          color: var(--primary-foreground, #fff);
          display: grid;
          place-items: center;
          font-size: var(--text-sm, 0.875rem);
          font-weight: var(--font-medium, 500);
        }

        footer > div > div {
          flex: 1;
          min-inline-size: 0;
        }

        footer > div > div > span:first-child {
          display: block;
          font-size: var(--text-sm, 0.875rem);
          font-weight: var(--font-medium, 500);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        footer > div > div > span:last-child {
          display: block;
          font-size: var(--text-xs, 0.75rem);
          color: var(--text-muted, #666);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      </style>

      <header>
        <a href="/" data-link>{{DISPLAY_NAME}}</a>
      </header>

      <nav aria-label="Main navigation">
        <section>
          <ul>
            <li>
              <a href="/dashboard" data-link>
                <icon-wc name="layout-dashboard"></icon-wc>
                Dashboard
              </a>
            </li>
            <li>
              <a href="/list" data-link>
                <icon-wc name="list"></icon-wc>
                Items
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2>Settings</h2>
          <ul>
            <li>
              <a href="/settings" data-link>
                <icon-wc name="settings"></icon-wc>
                Settings
              </a>
            </li>
          </ul>
        </section>
      </nav>

      <footer>
        <div>
          <span data-role="avatar">${user?.name?.charAt(0).toUpperCase() || 'U'}</span>
          <div>
            <span>${user?.name || 'User'}</span>
            <span>${user?.email || ''}</span>
          </div>
        </div>
      </footer>
    `;
  }
}

customElements.define('sidebar-nav', SidebarNav);