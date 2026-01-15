# Scaffold E-commerce Storefront

Create a new e-commerce storefront project with product catalog, shopping cart, checkout, and order management.

## Usage

```
/scaffold-ecommerce [project-name]
```

## What This Creates

- Product catalog with grid listings and filters
- Product detail pages with gallery and variants
- Shopping cart with persistent state
- Multi-step checkout flow
- Order history and tracking
- Optional: wishlist, reviews, search

## Instructions

1. **Read the starter manifest**:
   ```
   .claude/starters/ecommerce/manifest.yaml
   ```

2. **Collect configuration** using AskUserQuestion:

   **Required:**
   - Project name (lowercase, hyphens): e.g., `my-shop`
   - Store name (display name): e.g., `My Shop`
   - Description (max 160 chars)

   **Optional:**
   - Currency code (default: USD)
   - Currency symbol (default: $)
   - Theme color (default: #1e40af)
   - API base URL (default: /api)
   - Enable wishlist (default: true)
   - Enable reviews (default: true)
   - Enable search (default: true)

3. **Create project structure**:
   ```
   {project-name}/
   ├── src/
   │   ├── index.html
   │   ├── pages/
   │   │   ├── products.html
   │   │   ├── product.html
   │   │   ├── cart.html
   │   │   ├── checkout.html
   │   │   ├── orders.html
   │   │   └── order.html
   │   ├── components/
   │   │   ├── cart-button.js
   │   │   ├── cart-drawer.js
   │   │   ├── product-card.js
   │   │   ├── quantity-input.js
   │   │   └── icon-wc.js
   │   ├── lib/
   │   │   ├── store.js
   │   │   └── api.js
   │   ├── styles/
   │   │   ├── _reset.css
   │   │   ├── _tokens.css
   │   │   └── shop.css
   │   └── assets/
   │       └── favicon.svg
   ├── package.json
   ├── vite.config.js
   └── README.md
   ```

4. **Copy files from starter**:
   - Copy all files from `.claude/starters/ecommerce/`
   - Copy shared resources from `.claude/starters/_shared/`
   - Replace `{{PLACEHOLDER}}` values with collected configuration

5. **Handle conditionals**:
   - `{{#IF_ENABLE_WISHLIST}}...{{/IF_ENABLE_WISHLIST}}`
   - `{{#IF_ENABLE_REVIEWS}}...{{/IF_ENABLE_REVIEWS}}`
   - `{{#IF_ENABLE_SEARCH}}...{{/IF_ENABLE_SEARCH}}`

6. **Display next steps**:
   ```
   E-commerce storefront created!

   Next steps:
   1. cd {project-name}
   2. npm install
   3. Configure API endpoints in src/lib/api.js
   4. npm run dev

   Key files:
   - src/pages/          - Page templates
   - src/components/     - UI components
   - src/lib/store.js    - Cart state management
   - src/lib/api.js      - API client

   Available skills:
   - /skill responsive-images
   - /skill forms
   - /skill state-management
   - /skill api-client
   ```

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Folder/package name |
| `{{STORE_NAME}}` | Display name |
| `{{DESCRIPTION}}` | Store description |
| `{{CURRENCY}}` | Currency code (USD, EUR, etc.) |
| `{{CURRENCY_SYMBOL}}` | Currency symbol ($, €, etc.) |
| `{{THEME_COLOR}}` | Brand color (hex) |
| `{{API_BASE_URL}}` | API endpoint base URL |
| `{{CURRENT_YEAR}}` | Current year |
| `{{AUTHOR}}` | Author/organization |

## Example

```
User: /scaffold-ecommerce

Claude: Let's create your e-commerce storefront!

Project name (lowercase, hyphens)?
User: outdoor-gear-shop

Store name?
User: Outdoor Gear Co

Description?
User: Premium outdoor and camping equipment

[Creates project with defaults for optional features]

Claude: E-commerce storefront created!

Your project is ready at outdoor-gear-shop/

Next steps:
1. cd outdoor-gear-shop
2. npm install
3. Configure your API endpoints in src/lib/api.js
4. npm run dev

The store includes:
- Product catalog with filters
- Shopping cart with drawer
- Multi-step checkout
- Order tracking
- Wishlist feature
- Product reviews
- Search functionality
```

## Notes

- This is a frontend-only starter; backend API integration required
- Cart state persists in localStorage
- All components are vanilla Web Components
- Styles use CSS custom properties from design tokens
- Checkout form includes validation but no payment processing