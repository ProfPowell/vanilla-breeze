# Enhance Patterns for montane

Extracted from [enhance-eval.md](enhance-eval.md) — actionable patterns to implement in montane.

---

## 1. Pure-Function Component Model

### The Pattern

Components are plain functions. No class, no decorator, no lifecycle boilerplate. A component receives state and returns an HTML string.

```javascript
// components/product-card.js
export default function ProductCard({ html, state }) {
  const { attrs, store, context } = state
  const { name, price } = store.product || {}
  return html`
    <article>
      <h3>${name}</h3>
      <data value="${price}">${formatPrice(price)}</data>
      <add-to-cart product-id="${attrs['product-id']}"></add-to-cart>
    </article>
  `
}
```

### Why This Works

- **Testable** — call the function with mock state, assert the returned string. No DOM, no renderer, no test harness.
- **Composable** — `<add-to-cart>` in the template is another registered function. The `html` tag recursively expands it. Composition is just HTML.
- **No framework runtime** — on the server this is string concatenation. Zero overhead beyond the tagged template parser.
- **Portable** — a pure function with no imports from a framework can be moved between projects, tested in isolation, or compiled to WASM.

### Implementation Notes

- The `html` tagged template is the engine. It parses the returned string, identifies custom element tags, looks them up in a registry (`Map<string, Function>`), calls them with `{ html, state }`, and splices the output back in. This is recursive — nested custom elements resolve depth-first.
- `attrs` are always strings (per the HTML spec). Complex data goes through `store` or `context`.
- `state.instanceID` is a unique string per element instance — use it to generate unique `id` attributes when a component appears multiple times on a page.

### How to Build It

The core engine is surprisingly small. The essential pieces:

1. **Registry** — `Map<string, ComponentFunction>` mapping tag names to functions
2. **HTML parser** — identify custom element tags in template output (any tag with a hyphen)
3. **Recursive expander** — for each custom element found, call its function with current state, replace the tag with the output, repeat until no custom elements remain
4. **State threading** — pass `attrs` (from the element's attributes), `store` (global), `context` (inherited from ancestors)

Enhance uses a full HTML parser internally. A simpler approach for montane: regex-based tag detection for custom elements (tags containing a hyphen), then parse only those elements' attributes. This avoids a full HTML parser dependency while handling the 95% case.

```
┌─────────────────────────────────────────┐
│  html`<page-header>                     │
│         <nav-menu></nav-menu>           │
│       </page-header>`                   │
│                                         │
│  1. Parse → find <page-header>          │
│  2. Look up registry["page-header"]     │
│  3. Call PageHeader({ html, state })    │
│  4. PageHeader returns html with        │
│     <nav-menu> inside                   │
│  5. Parse output → find <nav-menu>      │
│  6. Look up registry["nav-menu"]        │
│  7. Call NavMenu({ html, state })       │
│  8. No more custom elements → done      │
└─────────────────────────────────────────┘
```

---

## 2. Context Passing (Provide/Inject for SSR)

### The Pattern

Parent components set properties on a shared `context` object. All descendants see those properties without attribute drilling.

```javascript
// components/theme-provider.js
export default function ThemeProvider({ html, state }) {
  state.context.theme = state.attrs.theme || 'default'
  state.context.density = state.attrs.density || 'comfortable'
  return html`<slot></slot>`
}

// components/data-table.js (deeply nested)
export default function DataTable({ html, state }) {
  const { theme, density } = state.context
  return html`<table data-theme="${theme}" data-density="${density}">...</table>`
}
```

### Why This Works

- Processing is top-down and synchronous. Parent runs first, mutates context, children run next and read it.
- No registration API, no provider/consumer ceremony. Just set a property.
- Scoped naturally — context set by one parent does not leak to siblings or ancestors.

### Implementation Notes

- The `context` object should be **shallow-cloned** at each component boundary so mutations in one branch do not leak to sibling branches. Enhance handles this by passing a fresh context copy to each child subtree.
- Context is SSR-only. On the client, use standard DOM patterns (CSS custom properties, data attributes, events) for runtime configuration.

### Use Cases in montane

- Theme/variant propagation without repeating attributes on every element
- Layout configuration (density, direction) flowing from a page wrapper to all children
- Auth/user state available to any component without store wiring

---

## 3. Scoped Styles via :host Rewriting

### The Pattern

Components write styles using Shadow DOM pseudo-selectors. A transform rewrites them to light DOM equivalents scoped by tag name.

```javascript
export default function AlertBanner({ html, state }) {
  return html`
    <style>
      :host {
        display: block;
        border-left: 4px solid var(--color-warning);
        padding: var(--space-m);
      }
      :host([severity="error"]) {
        border-color: var(--color-error);
      }
      h2 {
        margin: 0;
      }
    </style>
    <h2>${state.attrs.title}</h2>
    <slot></slot>
  `
}
```

Server output CSS (hoisted to `<head>`):

```css
alert-banner {
  display: block;
  border-left: 4px solid var(--color-warning);
  padding: var(--space-m);
}
alert-banner[severity="error"] {
  border-color: var(--color-error);
}
alert-banner h2 {
  margin: 0;
}
```

### Transform Rules

| Input | Output |
|:---|:---|
| `:host` | `tag-name` |
| `:host(.class)` | `tag-name.class` |
| `:host([attr])` | `tag-name[attr]` |
| `:host-context(selector)` | `selector tag-name` |
| `::slotted(selector)` | `selector` (attribute-based) |
| `::part(name)` | `[part*="name"]` |
| bare selector (e.g., `h2`) | `tag-name h2` |

### Scope Modes

- **`component`** (default) — all selectors prefixed with the tag name. One set of styles per component type.
- **`instance`** — selectors prefixed with tag name + unique class (e.g., `alert-banner.abc123`). Allows per-instance style overrides.
- **`global`** — no transform, styles go to `<head>` as-is.

### Implementation Notes

- Collect all component `<style>` blocks during rendering. Hoist to `<head>`. Deduplicate identical blocks (same component rendered multiple times only emits styles once).
- The transform is a CSS string operation — regex-based replacement of `:host`, `::slotted`, `::part`. No CSS parser needed for the common cases.
- This approach does **not** prevent descendant selector leakage (a parent's `h2` rule will match `h2` in child components). Enhance accepts this tradeoff. If montane needs stricter isolation, scope selectors could use `>` combinators or `:where(tag-name > *)` patterns.

---

## 4. SSR Engine Architecture

### The Full Pipeline

```
Input:  Template string + Element registry + Initial state
          │
          ▼
   ┌──────────────┐
   │ Parse HTML    │  Identify custom element tags (hyphenated)
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Expand        │  For each custom element:
   │ elements      │  1. Extract attrs from tag
   │ (recursive)   │  2. Build state { attrs, store, context, instanceID }
   │               │  3. Call component function
   │               │  4. Replace tag contents with output
   │               │  5. Mark tag with enhanced="..." attr
   │               │  6. Repeat for any custom elements in output
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Collect       │  Extract <style> blocks from components
   │ styles        │  Apply scope transforms
   │               │  Deduplicate
   │               │  Hoist to <head>
   └──────┬───────┘
          │
          ▼
Output: Complete HTML document (or body fragment)
```

### Slot Handling

Enhance supports `<slot>` in SSR. When a component uses `<slot></slot>`, the content placed inside the custom element tag (the "light DOM children") is inserted where the slot appears in the component output.

```html
<!-- Usage -->
<alert-banner title="Warning">
  <p>Something happened.</p>
</alert-banner>

<!-- Component template -->
<h2>${state.attrs.title}</h2>
<slot></slot>

<!-- Rendered output -->
<alert-banner enhanced="..." title="Warning">
  <h2>Warning</h2>
  <p>Something happened.</p>
</alert-banner>
```

Named slots work too — `<slot name="footer">` matches `<div slot="footer">`.

### bodyContent Mode

Setting `bodyContent: true` returns only the inner HTML without `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` wrappers. Use this for:
- Fragment rendering (partial page updates)
- Embedding in an existing template engine (Nunjucks, Jinja, ERB)
- Testing (assert against body content without document boilerplate)

---

## 5. WASM Portability

### When to Use

If montane needs to render web components from a **non-Node backend** (Python, Ruby, Go, PHP, Java, .NET), the WASM approach is viable.

### How It Works

```
JavaScript component functions (source strings)
  + HTML template (string)
  + Initial state (JSON)
      │
      ▼
  WASM binary (4.1MB, contains QuickJS + enhance-ssr)
      │
      ▼
  JSON output: { document, body, styles }
```

The WASM binary embeds QuickJS (a lightweight JS engine). Component functions are passed as **source code strings**, not executable functions. QuickJS evaluates them inside WASM.

### Integration Example (Python)

```python
import extism

plugin = extism.Plugin("enhance-ssr.wasm", wasi=True)
result = plugin.call("ssr", json.dumps({
    "markup": "<my-header>Hello</my-header>",
    "elements": {
        "my-header": "function({ html }) { return html`<h1><slot></slot></h1>` }"
    },
    "initialState": {}
}))
output = json.loads(result)
# output["document"] = full HTML
# output["body"] = rendered body content
# output["styles"] = collected CSS
```

### Tradeoffs

| | Native Node | WASM |
|:---|:---|:---|
| Performance | Fast (native V8) | Slower (QuickJS in WASM) |
| Component format | Normal JS functions | Source code strings |
| Backend requirement | Node.js | Any Extism host |
| Binary size | npm install | 4.1MB single file |
| Debugging | Standard Node tooling | Limited (WASM boundary) |

### Recommendation

Use native Node if montane's server is Node. Use WASM only for polyglot backends where running Node is impractical.

---

## 6. Data Flow Pattern (API → SSR → Page)

### The Pattern

A data loader runs before the page renders. Its output becomes the store available to all components.

```
Request: GET /products/shoes
  │
  ├─ 1. api/products/$slug.js → runs first
  │     Returns: { json: { product: { name: "Shoes", price: 49 } } }
  │
  ├─ 2. pages/products/$slug.html → renders with state.store.product
  │     All <product-*> components can read state.store.product
  │
  └─ 3. Response: fully rendered HTML page
```

### Dual Content Negotiation

The same handler serves both HTML (for browsers) and JSON (for fetch):

```javascript
// api/products/$slug.js
export async function get(req) {
  const product = await db.getProduct(req.params.slug)
  return { json: { product } }
}
```

- Browser requests `text/html` → framework SSR-renders the page using the JSON as store
- Client JS requests `application/json` → framework returns raw JSON

One handler, two consumers. No duplicate endpoints.

### Implementation in montane

This pattern does not require Enhance's framework. The core idea:

1. **Route handler** returns data (not HTML)
2. **SSR engine** receives data as `initialState`, makes it available as `state.store`
3. **Content negotiation** middleware checks `Accept` header, returns HTML or JSON from the same data

This can be built on any Node server (Express, Fastify, Hono) or integrated into an existing routing system. The key insight is separating data fetching from rendering and letting them share a single route definition.
