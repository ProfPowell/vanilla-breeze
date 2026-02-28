# Enhance Patterns for html-star

Extracted from [enhance-eval.md](enhance-eval.md) — actionable patterns to implement in html-star or recommend for html-star backends.

---

## 1. Dual Content Negotiation

### The Problem

html-star fetches HTML fragments from the server and swaps them into the page. This means the server needs endpoints that return HTML partials. But those same endpoints often need to return JSON for other consumers (mobile apps, third-party integrations, other API clients).

Today this typically means maintaining two parallel endpoint sets: one returning HTML, one returning JSON. This is duplication.

### The Enhance Pattern

A single route handler returns **data**. The framework decides the response format based on the `Accept` header:

```javascript
// api/products/$slug.js
export async function get(req) {
  const product = await db.getProduct(req.params.slug)
  return { json: { product } }
}
```

- `Accept: text/html` → server renders the page template with `product` as state, returns HTML
- `Accept: application/json` → server returns `{ product: {...} }` as JSON

One handler. Two response formats. No duplication.

### How html-star Can Use This

html-star already sends `X-Requested-With: htmlstar` on its requests. Servers can use this header (or the `Accept` header) to decide whether to return a full page, an HTML fragment, or JSON.

**Recommended server pattern for html-star backends:**

```javascript
// Express/Fastify/Hono handler
app.get('/products/:slug', async (req, res) => {
  const product = await db.getProduct(req.params.slug)

  // html-star partial request
  if (req.headers['x-requested-with'] === 'htmlstar') {
    return res.type('html').send(renderFragment('product-card', { product }))
  }

  // API/JSON request
  if (req.accepts('json') && !req.accepts('html')) {
    return res.json({ product })
  }

  // Full page request (initial load, no JS)
  return res.type('html').send(renderPage('product', { product }))
})
```

### Three-Tier Response

This creates a clean three-tier response model:

| Request Type | Accept / Header | Response |
|:---|:---|:---|
| Initial page load | `text/html` | Full HTML page |
| html-star swap | `X-Requested-With: htmlstar` | HTML fragment |
| API consumer | `application/json` | JSON data |

All three served from one route handler, one data fetch, one source of truth.

### Implementation: Documentation, Not Code

This is a **recommended server pattern**, not something to build into html-star itself. html-star's job is client-side: detect triggers, make requests, swap content. The server-side response strategy is the backend developer's responsibility.

What html-star can do:

1. **Document the pattern** — add a "Server Integration" guide showing the three-tier response model
2. **Recommend Accept headers** — html-star could send `Accept: text/html-fragment` or a custom media type to distinguish fragment requests from full-page requests more cleanly than relying on `X-Requested-With`
3. **Provide server examples** — show the pattern for Express, Fastify, Hono, and plain Node `http`

---

## 2. Fragment Rendering for Partial Updates

### The Connection

Enhance's SSR engine has a `bodyContent: true` mode that returns rendered HTML without the document wrapper (`<!DOCTYPE>`, `<html>`, `<head>`, `<body>`). This is exactly what html-star needs when it swaps content into a page — a rendered HTML fragment, not a full document.

### The Pattern

When html-star requests a partial update (e.g., user clicks a filter, html-star fetches the filtered list), the server should:

1. Run the same data loader as the full page
2. Render only the relevant component/section, not the entire page
3. Return the fragment

```javascript
// Fragment renderer (conceptual)
function renderFragment(componentName, state) {
  const html = enhance({
    elements: registry,
    initialState: state,
    bodyContent: true  // ← fragment mode, no document wrapper
  })
  return html`<${componentName}></${componentName}>`
}
```

### Why This Matters for html-star

html-star's swap strategies (`inner`, `outer`, `prepend`, `append`, etc.) expect HTML fragments. If the server returns a full page, html-star has to select the relevant portion. If the server returns a fragment, the swap is direct and clean.

This is not an html-star code change — it is a server architecture recommendation. But it is worth documenting because the "how should my server return partials?" question is one of the first questions html-star users will have.

### Recommended Fragment Architecture

```
┌─────────────────────────────────────┐
│ Route: GET /products?category=shoes │
│                                     │
│ Full page request:                  │
│   → renderPage('products', data)    │
│   → Returns: <html>...<body>...     │
│     <product-list>...</product-list> │
│     ...</body></html>               │
│                                     │
│ html-star fragment request:         │
│   → renderFragment('product-list',  │
│       data)                         │
│   → Returns: <product-list>         │
│     <product-card>...</product-card> │
│     ...</product-list>              │
│                                     │
│ JSON API request:                   │
│   → Returns: { products: [...] }    │
└─────────────────────────────────────┘
```

---

## 3. Progressive Enhancement Alignment

### The Shared Philosophy

Both Enhance and html-star are built on the same core belief: **the page should work as HTML first, and JavaScript should enhance it.**

Enhance achieves this by rendering custom elements to real HTML on the server. The page is fully readable and functional before any JS loads. Client-side Custom Element definitions then upgrade the elements with interactivity.

html-star achieves this by reading native HTML attributes (`href`, `action`, `method`) and enhancing them with AJAX behavior. Links navigate without JS. html-star intercepts and fetches partials instead.

### The Combined Model

The strongest version of both projects together:

1. **Server**: Enhance-style SSR renders web components to HTML
2. **Client (no JS)**: page works — links navigate, forms submit, content is readable
3. **Client (with JS)**: html-star intercepts navigations and form submissions, fetches fragments, swaps them in with view transitions
4. **Client (with more JS)**: Custom Element definitions upgrade interactive components (accordions, carousels, etc.)

This is **three layers of progressive enhancement**:
- HTML (server-rendered, works everywhere)
- html-star (AJAX, partial updates, no full page reloads)
- Custom Elements (rich interactivity for specific components)

### Implementation: Documentation

Document this as a reference architecture for html-star. Show a minimal example:

```html
<!-- Server-rendered by Enhance-style SSR -->
<nav data-target="#product-list">
  <a href="/products?category=shoes">Shoes</a>
  <a href="/products?category=boots">Boots</a>
</nav>

<section id="product-list">
  <product-card>
    <h3>Running Shoe</h3>
    <data value="49">$49.00</data>
  </product-card>
</section>
```

- Without JS: links navigate to full pages (server-rendered)
- With html-star: clicks fetch fragments, swap into `#product-list`
- With Custom Elements: `<product-card>` upgrades with add-to-cart behavior

---

## 4. Server-Side Component Registry for html-star Backends

### The Idea

html-star does not do SSR — it is a client-side library. But html-star backends need to render HTML fragments. If those backends use web components, they need a way to expand `<product-card>` into real HTML on the server.

Enhance's component registry pattern is the answer:

```javascript
// server/components.js
const registry = {
  'product-card': ProductCard,
  'user-avatar': UserAvatar,
  'price-tag': PriceTag
}

// server/render.js
import enhance from '@enhance/ssr'

export function renderFragment(template, state) {
  const html = enhance({
    elements: registry,
    initialState: state,
    bodyContent: true
  })
  return html`${template}`
}
```

### This Is Not a Dependency on Enhance

The pattern is the point, not the library. html-star backends could:

1. **Use enhance-ssr directly** — it is a standalone npm package, no Architect/Begin required
2. **Build a minimal equivalent** — the core algorithm (parse → find custom elements → call functions → replace) is ~200 lines
3. **Use a different SSR engine** — Lit SSR, WebC, or a custom solution

The recommendation for html-star documentation: show how a component registry + fragment renderer creates the server-side complement to html-star's client-side swapping.

---

## Summary: What to Build vs. What to Document

| Item | Type | Description |
|:---|:---|:---|
| Three-tier content negotiation | **Document** | Recommended server pattern for full page / fragment / JSON from one handler |
| Fragment rendering guide | **Document** | How to structure server-side fragment rendering for html-star swap targets |
| Progressive enhancement reference | **Document** | SSR → html-star → Custom Elements layering model |
| `Accept` header refinement | **Consider** | Whether html-star should send `Accept: text/html-fragment` or similar to distinguish from full-page requests |
| Server examples | **Document** | Express/Fastify/Hono examples showing the patterns above |

html-star's code does not need to change. The value from Enhance is in the server-side patterns that make html-star's client-side work cleaner. These belong in html-star's documentation as recommended architectures.
