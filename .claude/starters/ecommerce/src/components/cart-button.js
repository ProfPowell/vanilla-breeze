/**
 * Cart Button Component
 *
 * Displays cart icon with item count badge.
 * Subscribes to cart state for reactive updates.
 */

import { subscribe, getItemCount, toggleCart } from '../lib/store.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
    }

    .cart-button {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-sm, 0.5rem);
      background: none;
      border: none;
      cursor: pointer;
      color: inherit;
      border-radius: var(--radius-md, 0.375rem);
      transition: background-color 0.2s ease;
    }

    .cart-button:hover {
      background-color: var(--color-surface-alt, rgba(0, 0, 0, 0.05));
    }

    .cart-button:focus-visible {
      outline: 2px solid var(--color-primary, #1e40af);
      outline-offset: 2px;
    }

    .cart-button__icon {
      width: 24px;
      height: 24px;
    }

    .cart-button__count {
      position: absolute;
      top: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      font-size: 11px;
      font-weight: 600;
      color: var(--color-on-primary, white);
      background-color: var(--color-primary, #1e40af);
      border-radius: 9px;
      transform: translate(25%, -25%);
    }

    .cart-button__count:empty,
    .cart-button__count[data-count="0"] {
      display: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .cart-button {
        transition: none;
      }
    }
  </style>

  <button type="button" class="cart-button" aria-label="Shopping cart">
    <svg class="cart-button__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="8" cy="21" r="1"></circle>
      <circle cx="19" cy="21" r="1"></circle>
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
    </svg>
    <span class="cart-button__count" aria-live="polite"></span>
  </button>
`;

class CartButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._button = this.shadowRoot.querySelector('.cart-button');
    this._count = this.shadowRoot.querySelector('.cart-button__count');
    this._unsubscribe = null;
  }

  connectedCallback() {
    this._button.addEventListener('click', this._handleClick.bind(this));
    this._unsubscribe = subscribe(this._updateCount.bind(this));
  }

  disconnectedCallback() {
    this._button.removeEventListener('click', this._handleClick.bind(this));
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }

  _handleClick() {
    toggleCart();
  }

  _updateCount() {
    const count = getItemCount();
    this._count.textContent = count > 99 ? '99+' : count;
    this._count.dataset.count = count;
    this._button.setAttribute('aria-label', `Shopping cart, ${count} items`);
  }
}

customElements.define('cart-button', CartButton);