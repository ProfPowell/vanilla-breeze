/**
 * Not Found View
 * 404 error page
 */

import { BaseView } from './base-view.js';

class NotFoundView extends BaseView {
  static get tag() {
    return 'not-found-view';
  }

  render() {
    return `
      <section data-section="error">
        <h1>404</h1>
        <p data-role="title">Page Not Found</p>
        <p data-role="message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a href="/" data-link data-variant="primary">Go to Home</a>
      </section>
    `;
  }

  styles() {
    return `
      ${super.styles()}

      article {
        min-block-size: 60vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      [data-section="error"] {
        text-align: center;
      }

      h1 {
        font-size: 6rem;
        color: var(--primary, #1e40af);
        margin-block-end: var(--spacing-sm, 0.5rem);
      }

      [data-role="title"] {
        font-size: var(--font-size-xl, 1.5rem);
        color: var(--text, #111);
        margin-block-end: var(--spacing-md, 1rem);
      }

      [data-role="message"] {
        margin-block-end: var(--spacing-xl, 2rem);
      }

      [data-variant="primary"] {
        display: inline-flex;
        padding: var(--spacing-sm, 0.5rem) var(--spacing-lg, 1.5rem);
        background: var(--primary, #1e40af);
        color: white;
        text-decoration: none;
        border-radius: var(--radius-md, 0.25rem);
        font-weight: 500;
      }
    `;
  }
}

customElements.define(NotFoundView.tag, NotFoundView);
