# E-commerce Storefront Starter

Frontend-focused e-commerce storefront with product catalog, shopping cart, checkout flow, and order management.

## Features

- **Product Catalog** - Grid listings with filtering, sorting, and pagination
- **Product Detail** - Gallery, variants, reviews, related products
- **Shopping Cart** - Persistent cart with localStorage, drawer UI
- **Checkout Flow** - Multi-step form with shipping, payment, review
- **Order Management** - Order history, tracking, status updates
- **Wishlist** - Save products for later (optional)
- **Search** - Product search (optional)
- **Reviews** - Product ratings and reviews (optional)

## Quick Start

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── index.html              # Homepage with featured products
├── pages/
│   ├── products.html       # Product listing with filters
│   ├── product.html        # Product detail page
│   ├── cart.html           # Full cart page
│   ├── checkout.html       # Multi-step checkout
│   ├── orders.html         # Order history
│   └── order.html          # Order detail/tracking
├── components/
│   ├── cart-button.js      # Header cart icon with count
│   ├── cart-drawer.js      # Slide-out cart panel
│   ├── product-card.js     # Product grid item
│   ├── quantity-input.js   # Increment/decrement input
│   └── x-icon.js           # Icon component
├── lib/
│   ├── store.js            # Cart state management
│   └── api.js              # API client
└── styles/
    ├── _reset.css          # CSS reset
    ├── _tokens.css         # Design tokens
    └── shop.css            # E-commerce styles
```

## Configuration

### API Integration

Edit `src/lib/api.js` to configure your backend:

```javascript
const BASE_URL = 'https://api.yourstore.com';
```

The API client expects these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/products` | GET | List products with filters |
| `/products/:id` | GET | Get product details |
| `/categories` | GET | List categories |
| `/checkout` | POST | Create checkout session |
| `/orders` | GET | List user orders |
| `/orders/:id` | GET | Get order details |

### Cart State

Cart state is managed in `src/lib/store.js` using a pub/sub pattern:

```javascript
import { subscribe, addItem, removeItem, getSubtotal } from './lib/store.js';

// Subscribe to cart changes
subscribe(state => {
  console.log('Cart updated:', state.items);
});

// Add item
addItem({
  id: 'prod-123',
  name: 'Product Name',
  price: 2999, // In cents
  image: '/images/product.jpg',
});
```

## Components

### `<cart-button>`

Header cart icon with item count badge:

```html
<cart-button></cart-button>
```

### `<cart-drawer>`

Slide-out cart panel:

```html
<cart-drawer></cart-drawer>
```

### `<product-card>`

Product card for grid display:

```html
<product-card
  product-id="123"
  name="Product Name"
  price="$29.99"
  original-price="$39.99"
  image="/images/product.jpg"
  category="Category"
  href="/pages/product.html?id=123"
  badge="Sale,New"
  rating="4.5"
  reviews="42"
></product-card>
```

### `<quantity-input>`

Numeric input with +/- buttons:

```html
<quantity-input
  name="quantity"
  value="1"
  min="1"
  max="10"
></quantity-input>
```

## Styling

### CSS Custom Properties

The shop styles use design tokens from `_tokens.css`:

```css
.product-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
```

### Dark Mode

Styles automatically adapt to system dark mode preference via the token system.

### Responsive

- Mobile-first grid layouts
- Collapsible sidebar filters
- Touch-friendly cart drawer

## Optional Features

Enable/disable features in `manifest.yaml`:

```yaml
prompts:
  - key: ENABLE_WISHLIST
    label: "Enable wishlist feature"
    type: boolean
    default: true

  - key: ENABLE_REVIEWS
    label: "Enable product reviews"
    type: boolean
    default: true

  - key: ENABLE_SEARCH
    label: "Enable product search"
    type: boolean
    default: true
```

## Accessibility

- Semantic HTML structure
- ARIA labels and landmarks
- Keyboard navigation
- Focus management in cart drawer
- Screen reader announcements for cart updates
- Reduced motion support

## Performance

- Lazy-loaded images
- Minimal JavaScript (no frameworks)
- CSS-only animations
- LocalStorage cart persistence
- API response caching

## Related Skills

- `responsive-images` - Image optimization
- `forms` - Checkout form patterns
- `state-management` - Cart state patterns
- `api-client` - API integration
- `accessibility-checker` - WCAG compliance