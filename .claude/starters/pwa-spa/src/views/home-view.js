/**
 * Home View
 * Landing page for the application
 */

import { BaseView } from './base-view.js';

class HomeView extends BaseView {
  static get tag() {
    return 'home-view';
  }

  render() {
    return `
      <header data-section="hero">
        <h1>Welcome to {{DISPLAY_NAME}}</h1>
        <p data-role="lead">{{DESCRIPTION}}</p>
        <nav aria-label="Get started">
          <a href="/about" data-link class="button">Learn More</a>
          <a href="/settings" data-link class="button secondary">Settings</a>
        </nav>
      </header>

      <section data-section="features">
        <h2>Features</h2>
        <ul role="list">
          <li>
            <feature-card>
              <h3>Offline Support</h3>
              <p>Works without an internet connection thanks to service workers.</p>
            </feature-card>
          </li>
          <li>
            <feature-card>
              <h3>Fast Navigation</h3>
              <p>Client-side routing for instant page transitions.</p>
            </feature-card>
          </li>
          <li>
            <feature-card>
              <h3>Installable</h3>
              <p>Add to your home screen for a native app experience.</p>
            </feature-card>
          </li>
        </ul>
      </section>
    `;
  }

  styles() {
    return `
      ${super.styles()}

      [data-section="hero"] {
        text-align: center;
        padding: var(--size-3xl) var(--size-l);
        background: var(--surface-alt, #f5f5f5);
        margin: calc(-1 * var(--size-l));
        margin-block-end: var(--size-2xl);
      }

      [data-role="lead"] {
        font-size: var(--font-size-lg, 1.25rem);
        max-inline-size: 40rem;
        margin-inline: auto;
        margin-block-end: var(--size-xl);
      }

      [data-section="hero"] nav {
        display: flex;
        gap: var(--size-m);
        justify-content: center;
        flex-wrap: wrap;
      }

      button,
      button.secondary {
        display: inline-flex;
        padding: var(--size-xs) var(--size-l);
        border-radius: var(--radius-md, 0.25rem);
        text-decoration: none;
        font-weight: 500;
      }

      button {
        background: var(--primary, #1e40af);
        color: white;
      }

      button.secondary {
        background: transparent;
        color: var(--primary, #1e40af);
        border: 1px solid var(--primary, #1e40af);
      }

      [data-section="features"] h2 {
        text-align: center;
        margin-block-end: var(--size-xl);
      }

      [data-section="features"] ul {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--size-l);
        list-style: none;
        padding: 0;
        margin: 0;
      }

      feature-card {
        display: block;
        padding: var(--size-l);
        background: var(--surface, white);
        border: 1px solid var(--border, #e5e5e5);
        border-radius: var(--radius-lg, 0.5rem);
      }

      feature-card h3 {
        margin-block-end: var(--size-xs);
      }
    `;
  }
}

customElements.define(HomeView.tag, HomeView);
