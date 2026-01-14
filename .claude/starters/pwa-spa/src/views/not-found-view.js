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
        <a href="/" data-link class="button">Go to Home</a>
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
        margin-block-end: var(--size-xs);
      }

      [data-role="title"] {
        font-size: var(--font-size-xl, 1.5rem);
        color: var(--text, #111);
        margin-block-end: var(--size-m);
      }

      [data-role="message"] {
        margin-block-end: var(--size-xl);
      }

      button {
        display: inline-flex;
        padding: var(--size-xs) var(--size-l);
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
