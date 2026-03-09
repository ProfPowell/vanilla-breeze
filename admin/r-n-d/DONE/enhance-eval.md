# Enhance.dev: Technical Evaluation

Review of [enhance.dev](https://enhance.dev) and [enhance-ssr](https://github.com/enhance-dev/enhance-ssr) — February 2026.

## What Enhance Is

Enhance is an HTML-first full-stack web framework built on server-side rendering of web components. Components are **pure functions** that receive state and return HTML strings. The framework expands custom element tags into real markup on the server before the browser ever sees them. JavaScript on the client is optional — pages work as plain HTML.

Core stack:

- **enhance-ssr** — the rendering engine. Takes a registry of element functions and a template string, recursively expands every custom element tag into server-rendered HTML.
- **File-based routing** — `app/pages/` for HTML routes, `app/api/` for data handlers. API handlers run first, their returned JSON populates `state.store` for all elements on the page.
- **Enhance Styles** — a utility CSS generator configured via JSON. Outputs a static CSS file with logical properties, fluid `clamp()` scaling, and responsive suffixes. Not a runtime system.
- **Architect / arc.codes** — infrastructure-as-code layer. Compiles an `app.arc` manifest into AWS CloudFormation (Lambda, API Gateway, DynamoDB, S3). Deploy with `npx arc deploy`.
- **Begin** — hosted deployment platform wrapping Architect with managed CI/CD.

The project is maintained by the team behind Architect and Begin. It is opinionated about deployment (AWS serverless) but the SSR engine is usable standalone.

---

## Key Technical Ideas

### 1. Pure-Function Components

```javascript
export default function MyTag({ html, state }) {
  const { attrs, store, context, instanceID } = state
  return html`<h1>${attrs.greeting || 'Hello'}</h1>`
}
```

No class. No lifecycle. No `this`. The function receives `html` (a tagged template that recursively expands nested custom elements) and `state` (attributes, store data, parent context, instance ID). It returns an HTML string.

This is the cleanest component authoring model in the SSR web component space. Compared to Lit SSR (class-based, decorator-heavy, needs `@lit-labs/ssr`) or WebC (template files with front matter), Enhance components are just functions.

**The interesting part**: the `html` tagged template is not a simple string interpolator. When it encounters `<child-element>` in the template, it looks up that element's function in the registry, calls it with the appropriate state, and splices the rendered output back in. This recursive expansion is the entire rendering engine.

### 2. Server-Side Custom Element Expansion

```javascript
import enhance from '@enhance/ssr'
const html = enhance({
  elements: { 'my-header': MyHeader, 'my-card': MyCard },
  initialState: { user: { name: 'Taylor' } }
})
const page = html`<my-header></my-header><my-card></my-card>`
```

The output preserves custom element tags — `<my-header>` stays in the HTML, with its rendered children inside and an `enhanced="..."` attribute marking it as server-rendered. This means the elements can be progressively enhanced by client-side Custom Element definitions that `connectedCallback` into the already-rendered DOM.

Style tags from components are hoisted to `<head>` and deduplicated automatically. The engine handles full document mode (returns `<!DOCTYPE html>...`) or body-only mode for fragment rendering.

### 3. Scoped Styles Without Shadow DOM

Components write CSS using Shadow DOM pseudo-selectors. The style transform rewrites them for light DOM:

| Component CSS | Server Output |
|:---|:---|
| `:host { display: block }` | `my-tag { display: block }` |
| `:host(.active) span` | `my-tag.active span` |
| `::slotted([slot=title])` | `[slot=title]` |
| `::part(header)` | `[part*="header"]` |

Three scope modes: `global` (no transform), `component` (tag-name prefix, default), `instance` (tag-name + unique class). Component scoping prevents style bleed without the Shadow DOM cost — no FOUC, no form participation issues, no slot complexity.

This is a practical middle ground. Full Shadow DOM has real costs (styling isolation breaks form `:invalid` propagation, slotted content cannot be styled from outside, FOUC on initial render). Enhance's approach accepts that scoping is imperfect but functional.

### 4. Context Passing

Parent components can set context that flows to all descendants without attribute drilling:

```javascript
// Parent
export default function ThemeProvider({ html, state }) {
  state.context.theme = 'dark'
  return html`<slot></slot>`
}

// Deeply nested child
export default function ThemedCard({ html, state }) {
  const { theme } = state.context
  return html`<article class="${theme}">...</article>`
}
```

This works because enhance-ssr processes the tree top-down. When it hits `ThemeProvider`, it runs the function (which mutates `context`), then continues expanding children within that scope. Children see the updated context.

It is SSR-only — not a reactive system. But for the server rendering pass, it solves the same problem React Context or provide/inject solve: sharing configuration across component boundaries without threading attributes through every intermediate element.

### 5. WASM Portability

The entire enhance-ssr engine compiles to a 4.1MB WebAssembly binary via QuickJS and the Extism plugin system. The WASM plugin exposes a single `"ssr"` function that accepts JSON (markup string + stringified element functions + initial state) and returns JSON (rendered document + body + styles).

This means any language with an Extism host SDK — Python, Ruby, Go, Rust, PHP, Java, .NET, C — can server-render web components without Node.js. A Rails app, a Django app, a Spring Boot app can all call the same WASM binary to expand `<my-component>` into real HTML.

The tradeoff: element functions must be passed as source code strings across the WASM boundary, not as executable functions. The QuickJS engine inside WASM evaluates them. Performance is slower than native Node.js but acceptable for SSR where the alternative is shipping a full Node sidecar.

### 6. Data Flow: API Routes Feed SSR

The file-based routing creates a clean data pipeline:

1. Request hits `/products/shoes`
2. `app/api/products/$slug.mjs` runs, queries database, returns `{ json: { product: {...} } }`
3. `app/pages/products/$slug.html` renders with `state.store.product` available to all elements
4. Same endpoint serves JSON when requested with `Accept: application/json`

This dual content negotiation from a single handler is elegant. The API route is both the page's data loader and the client-side API endpoint.

---

## What Is NOT Interesting

### Deployment Lock-in

Enhance is tightly coupled to Architect/AWS. The `app.arc` manifest compiles to CloudFormation templates targeting Lambda + API Gateway + DynamoDB. Begin is the recommended hosted platform. You can use enhance-ssr standalone, but the full framework assumes this deployment model.

### Enhance Styles

A utility CSS generator. Competent but unremarkable — logical properties, fluid clamp() scales, responsive suffixes. Similar to every-framework's-utility-system. Not a reason to adopt Enhance.

### Client-Side Story

The render-object pattern lets you add lifecycle hooks (`init`, `connected`, `disconnected`) and observed attributes to the same component file. But this is just standard Custom Elements with a convenience wrapper. No reactive state system, no client-side rendering engine. If a component needs significant client-side interactivity, you are writing vanilla Custom Elements.

This is honest — Enhance does not pretend to be a client framework. But it means Enhance components that need interactivity look just like any other Custom Element code.

---

## Relevance to Our Projects

### Vanilla Breeze: Low

VB is a design system (tokens, themes, native element styles, layout attributes, web components). Enhance is an application framework (routing, data loading, SSR, deployment). They solve different problems. VB could be used inside an Enhance app — Enhance renders the HTML, VB styles it — but Enhance's ideas do not change how VB works.

The scoped style transform is mildly interesting as validation of VB's approach. VB already avoids Shadow DOM for most components and scopes styles via tag-name selectors. Enhance's `:host` rewriting is a formalization of the same pattern.

### html-star: Medium

html-star is a hypermedia engine — it enhances HTML with AJAX capabilities. Enhance's server-side rendering model is complementary: Enhance renders the initial HTML, html-star could handle subsequent partial updates. The combination would give you SSR on first load and declarative AJAX for in-page updates.

More specifically, Enhance's API route pattern (same endpoint returns HTML or JSON based on Accept header) aligns with html-star's model of fetching HTML fragments from the server. An Enhance API route could serve both the initial SSR render and the partial responses html-star swaps into the page.

### montane: High

montane is the most natural fit. If montane needs a server framework for rendering HTML pages with web components, Enhance's model is worth studying closely:

- **Pure-function components** — the authoring model is minimal and testable
- **File-based routing with data loaders** — API routes feeding SSR state is clean and explicit
- **WASM portability** — if montane has non-Node backend requirements, the WASM SSR engine is a real option
- **Style scoping without Shadow DOM** — proven approach for server-rendered component styles

---

## What to Steal

### 1. Pure-Function Component Pattern

The `function({ html, state }) { return html\`...\` }` signature is the right abstraction for server-rendered components. No class ceremony, trivially testable (call the function, assert the string), composable (the html tag recurses). Any project that does SSR of custom elements should consider this pattern.

### 2. Recursive Tagged Template Expansion

The `html` tagged template that identifies custom element tags and recursively renders them is a clever engine design. It means component composition is just HTML — you write `<child-element>` in your template and the engine handles it. No import statements, no render calls, no JSX. The registry maps tag names to functions, and the template does the rest.

### 3. Style Transform for :host / ::slotted

The `:host` → tag-name rewriting is a clean solution for scoped styles in SSR. Writing components with Shadow DOM pseudo-selectors but rendering them as light DOM selectors means the same component CSS works conceptually in both modes. Worth adopting if building an SSR pipeline for web components.

### 4. Context Via Tree-Order Processing

Processing components top-down and letting parents mutate a shared context object is the simplest possible implementation of "provide/inject" for SSR. No special API, no context registration — just set a property and descendants see it. This only works for synchronous SSR (which is what you want on a server), and it works well.

### 5. Dual Content Negotiation

A single API handler returning HTML for browsers and JSON for fetch requests is a pattern worth copying. It eliminates the "API endpoint for the page" vs. "API endpoint for the client" duplication.

## What to Skip

### 1. The Full Framework

Enhance as a framework is Architect is AWS. Unless you want Lambda + API Gateway + DynamoDB as your deployment target, the framework layer is not useful. The ideas (pure-function components, recursive SSR, scoped styles) are extractable; the framework is not.

### 2. WASM for Node Projects

If you are already running Node.js, the native enhance-ssr package is faster and simpler than the WASM build. The WASM story matters for non-Node backends. For Node projects, it adds complexity for no benefit.

### 3. Enhance Styles

Unremarkable utility CSS. VB's token system is more opinionated and better integrated. If montane or html-star need utility CSS, Open Props or VB's tokens are better starting points.

---

## Recommendation

**Do not adopt Enhance as a framework. Extract its SSR patterns.**

Enhance's value is not in its routing or deployment — those are Architect with a coat of paint. The value is in three specific technical ideas:

1. **Pure-function components for SSR** — the cleanest authoring model for server-rendered web components available today
2. **Recursive tagged template expansion** — an elegant rendering engine that composes via HTML rather than function calls
3. **:host style rewriting** — a pragmatic solution to scoped styles without Shadow DOM

For **montane**: study enhance-ssr's source closely. If montane needs server-side rendering of web components, the enhance-ssr approach (or a port of it) is the right starting point. The WASM build is relevant if montane targets non-Node backends.

For **html-star**: the dual content negotiation pattern (same endpoint, HTML or JSON based on Accept header) is worth adopting as a recommended server pattern for html-star backends.

For **VB**: no action needed. VB is a design system, not an application framework. Enhance validates VB's existing choices (light DOM, tag-name scoping, progressive enhancement) but does not change what VB should build.
