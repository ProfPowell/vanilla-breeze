# Math Support in Vanilla Breeze

## The Landscape

MathML Core is now a first-class web platform citizen. As of Chrome 109 (Jan 2023), all three major browser engines support it natively — no polyfills, no JavaScript, no external renderers. This is a rare opportunity for Vanilla Breeze to provide math support that is truly zero-dependency and progressively enhanced.

The old pain point was always that MathML existed in the spec but Chrome ignored it for years, pushing everyone toward MathJax or KaTeX. That era is over.

---

## What We Can Actually Do

### 1. A `<math-display>` Web Component

A custom element that accepts LaTeX or MathML as input and renders native MathML. The progressive enhancement story:

- **No JS**: Render the raw source as a `<code>` block (still readable)
- **With JS, legacy browser**: Fall back to a lightweight SVG renderer
- **With JS, modern browser**: Parse and inject native MathML

```html
<math-display>x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}</math-display>

<!-- Or inline -->
<p>The formula <math-display inline>\pi r^2</math-display> gives the area.</p>
```

The component would use a tiny LaTeX-to-MathML parser (there are sub-5kb options) or accept raw MathML directly when authors want full control.

### 2. Native MathML Utilities and CSS

MathML Core is styled via CSS but has quirks across engines. Vanilla Breeze can ship:

- A **math reset** — normalize default MathML rendering across engines (fonts, spacing, operator sizing)
- **Display vs inline math** utilities (`.math-block`, `.math-inline` or `[display]` attribute)
- **Color token integration** — let `--vb-color-accent` apply to math operators, annotations
- **Dark mode support** for math that currently trips people up (math background transparency issues)

### 3. A `<math-equation>` Numbered Block Component

Academic and educational content often needs numbered equations with anchored references.

```html
<math-equation id="eq-quadratic" label="1">
  x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
</math-equation>

<!-- Later in prose -->
<p>As shown in <a href="#eq-quadratic">Equation 1</a>...</p>
```

This maps perfectly to the teaching use case and the web's native linking model.

### 4. Copy-as-LaTeX Interaction

A zero-friction enhancement: clicking a rendered math block copies the LaTeX source to clipboard. Useful for students reproducing equations. Implemented as a behavior attribute:

```html
<math-display copyable>\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}</math-display>
```

### 5. MathML-Aware Syntax Highlighting Integration

For CS/math courses, `<code>` blocks containing LaTeX inside Markdown should optionally render. A `language-math` convention for fenced code blocks that triggers the component automatically.

---

## Architecture Considerations

**LaTeX input vs MathML input**: LaTeX is what authors actually write; MathML is what browsers render. We need to decide where the translation happens:

- **Build time** (via a Remark/markdown plugin): zero runtime cost, best for static sites
- **Client side** (inside the web component): simpler authoring, slightly more JS

Vanilla Breeze's philosophy suggests supporting both, with build-time as the preferred path for production and client-side as the fallback for quick authoring.

**Font loading**: MathML rendering quality depends heavily on a math-capable font being present. The system stack is unreliable. We should recommend and optionally bundle STIX Two or Latin Modern Math via a single CSS `@font-face` import, lazy-loaded only when a math element is detected on the page.

**Accessibility**: Native MathML has the best accessibility story of any approach — screen readers like NVDA+MathPlayer and VoiceOver on Safari understand it natively. This is a strong argument *for* native MathML over SVG fallbacks. Our component should always produce MathML as the accessible layer even when visually rendering via canvas or SVG for edge cases.

---

## Scope for an Initial Release

A reasonable v1 scope:

1. **CSS math reset + utilities** — pure CSS, no JS, ships with the core stylesheet
2. **`<math-display>` component** — accepts MathML directly, progressive enhancement baseline
3. **Font recommendation + lazy loader** — one import, done

LaTeX parsing can be v2 — it's a meaningful dependency decision that deserves its own evaluation.

---

## Teaching Use Cases and Science Papers - The Core Audience

- Statistics courses: rendering distributions, hypothesis tests
- Physics / engineering: equations with proper fraction and radical notation
- Discrete math / CS theory: set notation, logic symbols, Big-O
- Linear algebra: matrices rendered natively without tables

Native MathML renders matrices and cases expressions far better than any CSS table hack, and it's fully responsive without any extra work.

---

## Alternate thoughts

Instead of just doing `<math-display>`, maybe we do an attribute approach instead?

# Vanilla Breeze Math Rendering Spec

## Overview

Math rendering in Vanilla Breeze is driven by a `data-math` attribute placed on standard HTML elements. No custom elements are required. The attribute signals intent to enhance; the content remains readable and semantic without any JavaScript.

This approach aligns with Vanilla Breeze's progressive enhancement philosophy:

- **No JS**: content renders as a `<code>` block — still human-readable LaTeX
- **JS + modern browser**: content is parsed and replaced with native MathML
- **JS + legacy browser**: content is rendered via an SVG fallback

---

## The `data-math` Attribute

### Basic Usage

```html
<!-- Block math (default when on <pre> or standalone <code>) -->
<pre><code data-math>
  x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
</code></pre>

<!-- Inline math inside prose -->
<p>The area of a circle is <code data-math="inline">\pi r^2</code>.</p>
```

### Attribute Value: Token List

The attribute value is a space-separated list of render tokens. Order is irrelevant. An empty value (`data-math` or `data-math=""`) applies default block rendering.

| Token | Effect |
|---|---|
| `block` | Renders as display math, centered on its own line (default for `<pre>/<code>`) |
| `inline` | Renders as inline math, flowing with surrounding text |
| `numbered` | Appends an auto-incremented equation number; registers the element in the page equation index |
| `copyable` | Clicking the rendered math copies the LaTeX source to clipboard |
| `no-fallback` | Skips SVG fallback on unsupported browsers; shows raw source instead |

### Examples

```html
<!-- Numbered equation with copy support -->
<pre><code data-math="numbered copyable" id="eq-quadratic">
  x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
</code></pre>

<!-- Reference it naturally via the web's own linking -->
<p>See <a href="#eq-quadratic">Equation 1</a> for the derivation.</p>

<!-- Inline, no extras -->
<p>Where <code data-math="inline">b^2 - 4ac</code> is the discriminant.</p>
```

---

## Markdown Pipeline Integration

Markdown processors emit fenced code blocks with a language class. A `math` language tag maps directly to the `data-math` attribute with no extra tooling — just a CSS selector or a single post-processing step.

### Source Markdown

````markdown
The quadratic formula:

```math
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
```

Inline example: the area is `\pi r^2`{.math-inline}.
````

### Emitted HTML (standard Markdown output)

```html
<pre><code class="language-math">
  x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
</code></pre>
```

### Enhancement Options

**Option A — CSS selector only (zero config):**  
The Vanilla Breeze JS enhancement script automatically selects `code.language-math` in addition to `[data-math]`. No changes to the Markdown pipeline needed.

**Option B — Build-time attribute injection (recommended for production):**  
A Remark or Markdown-it plugin rewrites `language-math` code blocks to include `data-math` before the page is served. This makes the attribute explicit in the HTML and decouples rendering from class name conventions.

```js
// remark-vanilla-math.js (minimal plugin sketch)
export function remarkVanillaMath() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      if (node.lang === 'math') {
        node.data = node.data || {}
        node.data.hProperties = { 'data-math': node.meta || '' }
      }
    })
  }
}
```

---

## JavaScript Enhancement

The enhancement script is a single module that initialises on `DOMContentLoaded` and observes for dynamic content via `MutationObserver`.

### Initialization

```js
// Auto-selects [data-math] and code.language-math
import { initMath } from 'vanilla-breeze/math.js'
initMath()
```

Or scoped to a container:

```js
initMath({ root: document.querySelector('#content') })
```

### Enhancement Pipeline per Element

1. Read the LaTeX source from `textContent`
2. Parse tokens from `data-math` attribute value
3. Detect browser MathML support (feature detection, not UA sniffing)
4. Translate LaTeX → MathML (client-side parser or pre-compiled)
5. Inject `<math>` element; hide original `<code>` (kept in DOM for copy source)
6. Apply token behaviors (`numbered`, `copyable`, etc.)
7. Dispatch `math:rendered` custom event on the element

### Feature Detection

```js
function supportsMathML() {
  const div = document.createElement('div')
  div.innerHTML = '<math><mfrac><mn>1</mn><mn>2</mn></mfrac></math>'
  document.body.appendChild(div)
  const height = div.firstElementChild?.getBoundingClientRect().height ?? 0
  div.remove()
  return height > 0
}
```

### LaTeX Translation Strategy

The script supports two modes, selected at init time:

```js
// Client-side parsing (authoring convenience, ~5kb parser)
initMath({ parser: 'client' })

// Pre-compiled MathML (production default — zero parse cost)
initMath({ parser: 'precompiled' })
```

In `precompiled` mode the script expects a `data-mathml` attribute containing the pre-rendered MathML string, injected at build time. The LaTeX in `textContent` is retained as the copy source and accessible fallback.

```html
<code data-math="numbered copyable" data-mathml="<math>...</math>">
  x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
</code>
```

---

## CSS Hooks

The enhancement script sets a `data-math-state` attribute on each element, enabling CSS-driven styling at each enhancement stage.

| Attribute State | Meaning |
|---|---|
| *(absent)* | Not yet processed |
| `data-math-state="pending"` | Queued for enhancement |
| `data-math-state="rendered"` | MathML injected successfully |
| `data-math-state="fallback"` | SVG fallback rendered |
| `data-math-state="source"` | Showing raw LaTeX (no JS or `no-fallback`) |

### Example CSS

```css
/* Hide raw source once rendered */
[data-math-state="rendered"] > code,
[data-math-state="fallback"] > code {
  display: none;
}

/* Numbered equations: right-aligned number */
[data-math~="numbered"] {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--vb-space-4);
}

[data-math~="numbered"]::after {
  content: "(" attr(data-equation-number) ")";
  color: var(--vb-color-subtle);
  font-variant-numeric: tabular-nums;
}

/* Copyable cursor affordance */
[data-math~="copyable"][data-math-state="rendered"] {
  cursor: copy;
}

/* Inline math sits flush with text */
[data-math~="inline"] math {
  display: inline math;
  vertical-align: middle;
}
```

---

## Font Loading

MathML rendering quality is highly dependent on a math-capable font. The enhancement script lazy-loads a font only when math elements are present on the page.

```css
/* math.css — loaded on demand */
@font-face {
  font-family: "Latin Modern Math";
  src: url("/fonts/latinmodern-math.woff2") format("woff2");
  font-display: swap;
}

math {
  font-family: "Latin Modern Math", "STIX Two Math", serif;
}
```

```js
// Font injected once, only when math is detected
function ensureMathFont() {
  if (document.querySelector('[data-vb-math-font]')) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = '/path/to/math.css'
  link.setAttribute('data-vb-math-font', '')
  document.head.appendChild(link)
}
```

---

## Accessibility

Native MathML is the most accessible math format on the web. Screen readers including VoiceOver (Safari) and NVDA+MathPlayer understand MathML natively — no ARIA hacks required.

Additional considerations:

- The original LaTeX source is always retained in the DOM (hidden `<code>`) and serves as the accessible label via `aria-label` if the MathML rendering is insufficient for a given AT
- `numbered` equations are associated with their anchor `id` so `<a href="#eq-id">` announces correctly
- Copy confirmation is announced via a visually hidden live region: `aria-live="polite"`

---

## Equation Numbering

Equations with the `numbered` token are auto-numbered in DOM order. The enhancement script maintains a page-level counter and sets `data-equation-number` on each element.

If the document uses `id` attributes on numbered equations, the script registers them in a page index accessible as `window.VBMath.equations` — an array of `{ id, number, latex }` objects useful for dynamically generating a list of equations.

---

## Open Questions

- Should `data-math` live on `<code>` directly or always require a `<pre><code>` wrapper for block math? (The wrapper is more semantically correct but more verbose for authors.)
- Should the Remark/Markdown-it plugin be in the core Vanilla Breeze repo or a companion package?
- Pre-compiled MathML at build time needs a Node-side LaTeX parser — same library as client, or a heavier but more accurate one (e.g. `temml`, `mathjax-full`)?
- Do we expose `window.VBMath.equations` as a proper custom element registry alternative, or is that scope creep?