/**
 * Base View Class
 * All view components extend this class
 */

export class BaseView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /**
   * Called when element is added to DOM
   */
  connectedCallback() {
    this.shadowRoot.innerHTML = this.template();
    this.onMount();
  }

  /**
   * Called when element is removed from DOM
   */
  disconnectedCallback() {
    this.onUnmount();
  }

  /**
   * Override to return the view's HTML template
   * @returns {string}
   */
  render() {
    return '<p>Override render() in subclass</p>';
  }

  /**
   * Get the full template with styles
   * @returns {string}
   */
  template() {
    return `
      <style>
        ${this.styles()}
      </style>
      <article>
        ${this.render()}
      </article>
    `;
  }

  /**
   * Override to return component styles
   * @returns {string}
   */
  styles() {
    return `
      :host {
        display: block;
        outline: none;
      }

      article {
        padding: var(--spacing-lg, 1.5rem);
        max-inline-size: var(--content-width, 72rem);
        margin-inline: auto;
      }

      h1 {
        font-size: var(--font-size-3xl, 2.5rem);
        margin-block-end: var(--spacing-md, 1rem);
      }

      p {
        color: var(--text-muted, #666);
        line-height: 1.6;
      }
    `;
  }

  /**
   * Called after render, override for setup
   */
  onMount() {}

  /**
   * Called before removal, override for cleanup
   */
  onUnmount() {}

  /**
   * Query shadow DOM
   * @param {string} selector
   * @returns {Element|null}
   */
  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  /**
   * Query all in shadow DOM
   * @param {string} selector
   * @returns {NodeList}
   */
  $$(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }
}
