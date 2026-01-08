/**
 * App Shell Component
 * Main application container with navigation
 */

import { router } from '../app/router.js';

class AppShell extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
        }

        nav-bar {
          position: sticky;
          inset-block-start: 0;
          z-index: 100;
        }

        main {
          flex: 1;
        }

        footer {
          padding: var(--spacing-lg, 1.5rem);
          background: var(--surface-alt, #f5f5f5);
          border-block-start: 1px solid var(--border, #e5e5e5);
          text-align: center;
          color: var(--text-muted, #666);
          font-size: var(--font-size-sm, 0.875rem);
        }
      </style>

      <nav-bar></nav-bar>
      <main id="router-outlet" role="main"></main>
      <footer>
        <p>&copy; ${new Date().getFullYear()} {{DISPLAY_NAME}}. All rights reserved.</p>
      </footer>
    `;

    // Set up router outlet
    const outlet = this.shadowRoot.getElementById('router-outlet');
    router.setOutlet(outlet);

    // Navigate to current path
    router.navigate(window.location.pathname, false);
  }
}

customElements.define('app-shell', AppShell);
