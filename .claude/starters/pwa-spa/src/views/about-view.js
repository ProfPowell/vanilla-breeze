/**
 * About View
 * Information about the application
 */

import { BaseView } from './base-view.js';

class AboutView extends BaseView {
  static get tag() {
    return 'about-view';
  }

  render() {
    return `
      <h1>About</h1>
      <p data-role="lead">Learn more about {{DISPLAY_NAME}}.</p>

      <section>
        <h2>Technology</h2>
        <ul>
          <li><strong>Vanilla JavaScript</strong> - No framework dependencies</li>
          <li><strong>Web Components</strong> - Custom elements for encapsulation</li>
          <li><strong>Service Worker</strong> - Offline support and caching</li>
          <li><strong>History API</strong> - Client-side routing</li>
        </ul>
      </section>

      <section>
        <h2>Philosophy</h2>
        <p>
          This application is built with progressive enhancement in mind.
          It works without JavaScript (as a multi-page site), but provides
          a smooth single-page experience when JavaScript is available.
        </p>
      </section>
    `;
  }

  styles() {
    return `
      ${super.styles()}

      [data-role="lead"] {
        font-size: var(--font-size-lg, 1.25rem);
        margin-block-end: var(--size-2xl);
      }

      section {
        margin-block-end: var(--size-2xl);
      }

      h2 {
        font-size: var(--font-size-xl, 1.5rem);
        margin-block-end: var(--size-m);
      }

      ul {
        padding-inline-start: var(--size-l);
      }

      li {
        margin-block-end: var(--size-xs);
      }
    `;
  }
}

customElements.define(AboutView.tag, AboutView);
