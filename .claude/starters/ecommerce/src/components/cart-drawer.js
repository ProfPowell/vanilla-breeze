/**
 * Cart Drawer Component
 *
 * Slide-out cart panel with item list, totals, and checkout link.
 * Uses focus trap and keyboard navigation for accessibility.
 */

import {
  subscribe,
  getState,
  removeItem,
  updateQuantity,
  getSubtotal,
  formatPrice,
  setCartOpen,
} from '../lib/store.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
      z-index: 100;
    }

    .backdrop[data-open="true"] {
      opacity: 1;
      visibility: visible;
    }

    .drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      max-width: 400px;
      background: var(--color-surface, white);
      box-shadow: var(--shadow-xl, -4px 0 20px rgba(0, 0, 0, 0.15));
      transform: translateX(100%);
      transition: transform 0.3s ease;
      z-index: 101;
      display: flex;
      flex-direction: column;
    }

    .drawer[data-open="true"] {
      transform: translateX(0);
    }

    .drawer__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-md, 1rem) var(--space-lg, 1.5rem);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    .drawer__title {
      font-size: var(--text-lg, 1.125rem);
      font-weight: 600;
      margin: 0;
    }

    .drawer__close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      background: none;
      border: none;
      cursor: pointer;
      border-radius: var(--radius-md, 0.375rem);
      color: var(--color-text-muted, #6b7280);
      transition: background-color 0.2s ease;
    }

    .drawer__close:hover {
      background-color: var(--color-surface-alt, #f3f4f6);
    }

    .drawer__close:focus-visible {
      outline: 2px solid var(--color-primary, #1e40af);
      outline-offset: 2px;
    }

    .drawer__items {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-md, 1rem);
    }

    .drawer__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      color: var(--color-text-muted, #6b7280);
    }

    .drawer__empty-icon {
      width: 64px;
      height: 64px;
      margin-bottom: var(--space-md, 1rem);
      opacity: 0.5;
    }

    .cart-item {
      display: grid;
      grid-template-columns: 80px 1fr;
      gap: var(--space-md, 1rem);
      padding: var(--space-md, 1rem) 0;
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    .cart-item:last-child {
      border-bottom: none;
    }

    .cart-item__image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: var(--radius-md, 0.375rem);
      background: var(--color-surface-alt, #f3f4f6);
    }

    .cart-item__details {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs, 0.25rem);
    }

    .cart-item__name {
      font-weight: 500;
      line-height: 1.3;
    }

    .cart-item__variant {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-muted, #6b7280);
    }

    .cart-item__price {
      font-weight: 600;
    }

    .cart-item__actions {
      display: flex;
      align-items: center;
      gap: var(--space-sm, 0.5rem);
      margin-top: auto;
    }

    .cart-item__quantity {
      display: flex;
      align-items: center;
      gap: var(--space-xs, 0.25rem);
    }

    .cart-item__qty-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      background: var(--color-surface-alt, #f3f4f6);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-sm, 0.25rem);
      cursor: pointer;
      font-size: 16px;
      color: inherit;
    }

    .cart-item__qty-btn:hover {
      background: var(--color-border, #e5e7eb);
    }

    .cart-item__qty-value {
      min-width: 32px;
      text-align: center;
      font-weight: 500;
    }

    .cart-item__remove {
      margin-left: auto;
      padding: var(--space-xs, 0.25rem);
      background: none;
      border: none;
      color: var(--color-error, #dc2626);
      cursor: pointer;
      font-size: var(--text-sm, 0.875rem);
      text-decoration: underline;
    }

    .drawer__footer {
      padding: var(--space-lg, 1.5rem);
      border-top: 1px solid var(--color-border, #e5e7eb);
    }

    .drawer__subtotal {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--space-md, 1rem);
      font-size: var(--text-lg, 1.125rem);
    }

    .drawer__subtotal-amount {
      font-weight: 700;
    }

    .drawer__checkout {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: var(--space-sm, 0.5rem);
      width: 100%;
      padding: var(--space-md, 1rem);
      background: var(--color-primary, #1e40af);
      color: var(--color-on-primary, white);
      border: none;
      border-radius: var(--radius-md, 0.375rem);
      font-size: var(--text-base, 1rem);
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .drawer__checkout:hover {
      background: var(--color-primary-dark, #1e3a8a);
    }

    .drawer__continue {
      display: block;
      margin-top: var(--space-md, 1rem);
      text-align: center;
      color: var(--color-text-muted, #6b7280);
      text-decoration: underline;
      cursor: pointer;
      background: none;
      border: none;
      width: 100%;
    }

    @media (prefers-reduced-motion: reduce) {
      .backdrop,
      .drawer,
      .drawer__close,
      .cart-item__qty-btn,
      .drawer__checkout {
        transition: none;
      }
    }
  </style>

  <div class="backdrop" data-open="false"></div>
  <aside class="drawer" data-open="false" role="dialog" aria-label="Shopping cart" aria-modal="true">
    <header class="drawer__header">
      <h2 class="drawer__title">Your Cart</h2>
      <button type="button" class="drawer__close" aria-label="Close cart">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12"></path>
        </svg>
      </button>
    </header>

    <div class="drawer__items">
      <!-- Items rendered here -->
    </div>

    <footer class="drawer__footer">
      <div class="drawer__subtotal">
        <span>Subtotal</span>
        <span class="drawer__subtotal-amount"></span>
      </div>
      <a href="/pages/cart.html" class="drawer__checkout">
        View Cart & Checkout
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7"></path>
        </svg>
      </a>
      <button type="button" class="drawer__continue">Continue Shopping</button>
    </footer>
  </aside>
`;

class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._backdrop = this.shadowRoot.querySelector('.backdrop');
    this._drawer = this.shadowRoot.querySelector('.drawer');
    this._itemsContainer = this.shadowRoot.querySelector('.drawer__items');
    this._subtotal = this.shadowRoot.querySelector('.drawer__subtotal-amount');
    this._closeBtn = this.shadowRoot.querySelector('.drawer__close');
    this._continueBtn = this.shadowRoot.querySelector('.drawer__continue');
    this._unsubscribe = null;
    this._previousFocus = null;
  }

  connectedCallback() {
    this._closeBtn.addEventListener('click', this._close.bind(this));
    this._continueBtn.addEventListener('click', this._close.bind(this));
    this._backdrop.addEventListener('click', this._close.bind(this));
    this._drawer.addEventListener('keydown', this._handleKeydown.bind(this));
    this._unsubscribe = subscribe(this._update.bind(this));
  }

  disconnectedCallback() {
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }

  _update(state) {
    const isOpen = state.isOpen;

    this._backdrop.dataset.open = isOpen;
    this._drawer.dataset.open = isOpen;

    if (isOpen) {
      this._previousFocus = document.activeElement;
      this._drawer.inert = false;
      this._closeBtn.focus();
      document.body.style.overflow = 'hidden';
    } else {
      this._drawer.inert = true;
      document.body.style.overflow = '';
      if (this._previousFocus) {
        this._previousFocus.focus();
      }
    }

    this._renderItems(state.items);
    this._subtotal.textContent = formatPrice(getSubtotal());
  }

  _renderItems(items) {
    if (items.length === 0) {
      this._itemsContainer.innerHTML = `
        <div class="drawer__empty">
          <svg class="drawer__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <circle cx="8" cy="21" r="1"></circle>
            <circle cx="19" cy="21" r="1"></circle>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
          </svg>
          <p>Your cart is empty</p>
        </div>
      `;
      return;
    }

    this._itemsContainer.innerHTML = items.map(item => `
      <div class="cart-item" data-id="${item.id}" data-variant="${item.variant || ''}">
        <img
          class="cart-item__image"
          src="${item.image || '/assets/placeholder.svg'}"
          alt="${item.name}"
          loading="lazy"
        />
        <div class="cart-item__details">
          <span class="cart-item__name">${item.name}</span>
          ${item.variant ? `<span class="cart-item__variant">${item.variant}</span>` : ''}
          <span class="cart-item__price">${formatPrice(item.price)}</span>
          <div class="cart-item__actions">
            <div class="cart-item__quantity">
              <button type="button" class="cart-item__qty-btn" data-action="decrement" aria-label="Decrease quantity">−</button>
              <span class="cart-item__qty-value">${item.quantity}</span>
              <button type="button" class="cart-item__qty-btn" data-action="increment" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="cart-item__remove" data-action="remove">Remove</button>
          </div>
        </div>
      </div>
    `).join('');

    // Add event listeners
    this._itemsContainer.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', this._handleItemAction.bind(this));
    });
  }

  _handleItemAction(e) {
    const action = e.target.dataset.action;
    const item = e.target.closest('.cart-item');
    const id = item.dataset.id;
    const variant = item.dataset.variant || undefined;
    const currentQty = parseInt(item.querySelector('.cart-item__qty-value').textContent, 10);

    switch (action) {
      case 'increment':
        updateQuantity(id, currentQty + 1, variant);
        break;
      case 'decrement':
        updateQuantity(id, currentQty - 1, variant);
        break;
      case 'remove':
        removeItem(id, variant);
        break;
    }
  }

  _close() {
    setCartOpen(false);
  }

  _handleKeydown(e) {
    if (e.key === 'Escape') {
      this._close();
    }
  }
}

customElements.define('cart-drawer', CartDrawer);