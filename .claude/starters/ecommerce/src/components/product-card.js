/**
 * Product Card Component
 *
 * Displays product with image, name, price, and quick-add button.
 * Accepts product data via attributes or properties.
 */

import { addItem } from '../lib/store.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
    }

    .card {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--color-surface, white);
      border-radius: var(--radius-lg, 0.5rem);
      overflow: hidden;
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }

    .card:hover {
      box-shadow: var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
      transform: translateY(-2px);
    }

    .card__image-wrapper {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      background: var(--color-surface-alt, #f3f4f6);
    }

    .card__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .card:hover .card__image {
      transform: scale(1.05);
    }

    .card__badges {
      position: absolute;
      top: var(--space-sm, 0.5rem);
      left: var(--space-sm, 0.5rem);
      display: flex;
      flex-direction: column;
      gap: var(--space-xs, 0.25rem);
    }

    .card__badge {
      padding: var(--space-xs, 0.25rem) var(--space-sm, 0.5rem);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: var(--radius-sm, 0.25rem);
    }

    .card__badge--sale {
      background: var(--color-error, #dc2626);
      color: white;
    }

    .card__badge--new {
      background: var(--color-success, #16a34a);
      color: white;
    }

    .card__quick-add {
      position: absolute;
      bottom: var(--space-sm, 0.5rem);
      right: var(--space-sm, 0.5rem);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      background: var(--color-surface, white);
      border: none;
      border-radius: 50%;
      box-shadow: var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
      cursor: pointer;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
    }

    .card:hover .card__quick-add,
    .card__quick-add:focus {
      opacity: 1;
      transform: translateY(0);
    }

    .card__quick-add:hover {
      background: var(--color-primary, #1e40af);
      color: white;
    }

    .card__quick-add:focus-visible {
      outline: 2px solid var(--color-primary, #1e40af);
      outline-offset: 2px;
    }

    .card__body {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs, 0.25rem);
      padding: var(--space-md, 1rem);
      flex: 1;
    }

    .card__category {
      font-size: 11px;
      color: var(--color-text-muted, #6b7280);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .card__name {
      font-size: var(--text-base, 1rem);
      font-weight: 600;
      color: var(--color-text, #111827);
      text-decoration: none;
      line-height: 1.3;
    }

    .card__name:hover {
      color: var(--color-primary, #1e40af);
    }

    .card__rating {
      display: flex;
      align-items: center;
      gap: var(--space-xs, 0.25rem);
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-muted, #6b7280);
    }

    .card__stars {
      display: flex;
      color: var(--color-warning, #f59e0b);
    }

    .card__price {
      display: flex;
      align-items: baseline;
      gap: var(--space-xs, 0.25rem);
      margin-top: auto;
      padding-top: var(--space-sm, 0.5rem);
    }

    .card__price-current {
      font-size: var(--text-lg, 1.125rem);
      font-weight: 700;
      color: var(--color-text, #111827);
    }

    .card__price-original {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-muted, #6b7280);
      text-decoration: line-through;
    }

    @media (prefers-reduced-motion: reduce) {
      .card,
      .card__image,
      .card__quick-add {
        transition: none;
      }

      .card:hover {
        transform: none;
      }

      .card:hover .card__image {
        transform: none;
      }
    }
  </style>

  <article class="card">
    <div class="card__image-wrapper">
      <img class="card__image" src="" alt="" loading="lazy" />
      <div class="card__badges"></div>
      <button type="button" class="card__quick-add" aria-label="Add to cart">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M12 5v14M5 12h14"></path>
        </svg>
      </button>
    </div>
    <div class="card__body">
      <span class="card__category"></span>
      <a class="card__name" href="#"></a>
      <div class="card__rating" hidden>
        <span class="card__stars"></span>
        <span class="card__review-count"></span>
      </div>
      <div class="card__price">
        <span class="card__price-current"></span>
        <span class="card__price-original" hidden></span>
      </div>
    </div>
  </article>
`;

class ProductCard extends HTMLElement {
  static get observedAttributes() {
    return ['product-id', 'name', 'price', 'original-price', 'image', 'category', 'href', 'badge', 'rating', 'reviews'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._image = this.shadowRoot.querySelector('.card__image');
    this._badges = this.shadowRoot.querySelector('.card__badges');
    this._quickAdd = this.shadowRoot.querySelector('.card__quick-add');
    this._category = this.shadowRoot.querySelector('.card__category');
    this._name = this.shadowRoot.querySelector('.card__name');
    this._rating = this.shadowRoot.querySelector('.card__rating');
    this._stars = this.shadowRoot.querySelector('.card__stars');
    this._reviews = this.shadowRoot.querySelector('.card__review-count');
    this._priceCurrent = this.shadowRoot.querySelector('.card__price-current');
    this._priceOriginal = this.shadowRoot.querySelector('.card__price-original');
  }

  connectedCallback() {
    this._quickAdd.addEventListener('click', this._handleQuickAdd.bind(this));
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    const productId = this.getAttribute('product-id');
    const name = this.getAttribute('name') || '';
    const price = this.getAttribute('price') || '0';
    const originalPrice = this.getAttribute('original-price');
    const image = this.getAttribute('image') || '/assets/placeholder.svg';
    const category = this.getAttribute('category') || '';
    const href = this.getAttribute('href') || `/pages/product.html?id=${productId}`;
    const badge = this.getAttribute('badge');
    const rating = this.getAttribute('rating');
    const reviews = this.getAttribute('reviews');

    this._image.src = image;
    this._image.alt = name;
    this._category.textContent = category;
    this._name.textContent = name;
    this._name.href = href;
    this._priceCurrent.textContent = price;

    if (originalPrice) {
      this._priceOriginal.textContent = originalPrice;
      this._priceOriginal.hidden = false;
    } else {
      this._priceOriginal.hidden = true;
    }

    // Render badges
    this._badges.innerHTML = '';
    if (badge) {
      const badges = badge.split(',');
      badges.forEach(b => {
        const badgeEl = document.createElement('span');
        badgeEl.className = `card__badge card__badge--${b.toLowerCase()}`;
        badgeEl.textContent = b;
        this._badges.appendChild(badgeEl);
      });
    }

    // Render rating
    if (rating) {
      this._rating.hidden = false;
      const ratingNum = parseFloat(rating);
      const fullStars = Math.floor(ratingNum);
      const hasHalf = ratingNum % 1 >= 0.5;

      let starsHtml = '';
      for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
          starsHtml += '★';
        } else if (i === fullStars && hasHalf) {
          starsHtml += '½';
        } else {
          starsHtml += '☆';
        }
      }
      this._stars.textContent = starsHtml;
      this._reviews.textContent = reviews ? `(${reviews})` : '';
    } else {
      this._rating.hidden = true;
    }
  }

  _handleQuickAdd(e) {
    e.preventDefault();

    const productId = this.getAttribute('product-id');
    const name = this.getAttribute('name');
    const price = parseInt(this.getAttribute('price').replace(/[^0-9]/g, ''), 10) || 0;
    const image = this.getAttribute('image');

    addItem({
      id: productId,
      name,
      price,
      image,
    });

    // Visual feedback
    this._quickAdd.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M20 6L9 17l-5-5"></path>
      </svg>
    `;

    setTimeout(() => {
      this._quickAdd.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M12 5v14M5 12h14"></path>
        </svg>
      `;
    }, 1500);
  }
}

customElements.define('product-card', ProductCard);