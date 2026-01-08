/**
 * Navigation Bar Component
 * Main navigation for the application
 */

import { router } from '../app/router.js';

class NavBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();

    // Update active state on navigation
    window.addEventListener('popstate', () => this.updateActive());
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: var(--surface, white);
          border-block-end: 1px solid var(--border, #e5e5e5);
        }

        nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-inline-size: var(--content-width, 72rem);
          margin-inline: auto;
          padding: var(--spacing-md, 1rem) var(--spacing-lg, 1.5rem);
        }

        nav > a:first-child {
          font-weight: 600;
          font-size: var(--font-size-lg, 1.25rem);
          text-decoration: none;
          color: var(--text, #111);
        }

        ul {
          display: flex;
          gap: var(--spacing-lg, 1.5rem);
          list-style: none;
          margin: 0;
          padding: 0;
        }

        ul a {
          text-decoration: none;
          color: var(--text-muted, #666);
          transition: color 0.15s;
        }

        ul a:hover,
        ul a[aria-current="page"] {
          color: var(--primary, #1e40af);
        }
      </style>

      <nav aria-label="Main navigation">
        <a href="/" data-link>{{DISPLAY_NAME}}</a>
        <ul>
          <li><a href="/" data-link>Home</a></li>
          <li><a href="/about" data-link>About</a></li>
          <li><a href="/settings" data-link>Settings</a></li>
        </ul>
      </nav>
    `;

    this.updateActive();

    // Handle navigation within shadow DOM
    this.shadowRoot.addEventListener('click', (event) => {
      const link = event.target.closest('[data-link]');
      if (!link) return;

      event.preventDefault();
      const href = link.getAttribute('href');
      if (href && href !== router.currentPath) {
        router.navigate(href);
        this.updateActive();
      }
    });
  }

  updateActive() {
    const links = this.shadowRoot.querySelectorAll('ul a');
    const path = window.location.pathname;

    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === path) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }
}

customElements.define('nav-bar', NavBar);
