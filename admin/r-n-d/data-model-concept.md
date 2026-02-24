# Vanilla Breeze Evolution

> Component Composition Patterns and Dynamic Content Architecture

Last updated: 2026-01-20

---

## Overview

This document captures evolved thinking on component composition in Vanilla Breeze. It addresses how components define content models, how children are structured, and how dynamic data flows into templates—all while maintaining the platform-first philosophy.

### Core Principles Maintained

1. **HTML-first**: Semantic markup works without CSS/JS
2. **CSS-second**: Styling via layers, no build step required
3. **JS-third**: Enhancement only, never required for core functionality
4. **Native over custom**: Prefer semantic HTML elements over reinvention
5. **Progressive enhancement**: Everything degrades gracefully

---

## Component Composition

### The Problem with Slots

Shadow DOM's `<slot>` provides composition but creates problems:

- Styling requires `::slotted()` or CSS custom properties tunneling
- Form participation breaks
- Accessibility tree can be confusing
- Encapsulation often fights against theming

### The Solution: Semantic Children with Escape Hatch

Components expect semantic HTML children. When semantics don't fit, a `slot` attribute provides an escape hatch—but this is light DOM, not Shadow DOM.

#### Pattern

```html
<!-- Preferred: semantic children -->
<layout-card>
  <header>
    <h3>Title</h3>
  </header>
  <section>
    <p>Content</p>
  </section>
  <footer>
    <button type="button">Action</button>
  </footer>
</layout-card>

<!-- Escape hatch: slot attribute for non-standard markup -->
<layout-card>
  <figure slot="content">
    <img src="chart.png" alt="Q4 Results">
    <figcaption>Revenue growth</figcaption>
  </figure>
</layout-card>

<!-- Mixed: semantic where it fits, slot where it doesn't -->
<layout-card>
  <header><h3>Report</h3></header>
  <blockquote slot="content">
    <p>Key finding from the research.</p>
    <cite>— Analysis Team</cite>
  </blockquote>
  <footer><a href="report.pdf">Download</a></footer>
</layout-card>
```

#### Why This Works

- **Semantic children** (`<header>`, `<section>`, `<footer>`) communicate document structure
- **Slot attributes** allow valid HTML that doesn't match the semantic expectation
- **No Shadow DOM** means styling works normally
- **CSS handles layout** via grid areas

---

## CSS Architecture

### Consolidating Selectors with `:is()`

Semantic children and slot escapes share styling. Use `:is()` to avoid repetition:

```css
@layer primitives {
  layout-card {
    --_padding: var(--card-padding, var(--space-m));
    --_radius: var(--card-radius, var(--radius-m));
    --_bg: var(--card-bg, var(--color-surface));
    --_border: var(--card-border, var(--border-thin) solid var(--color-border));
    --_divider: var(--card-divider, var(--border-thin) solid var(--color-border));

    display: grid;
    grid-template: 
      "header" auto
      "content" 1fr
      "footer" auto
      / 1fr;
    background: var(--_bg);
    border: var(--_border);
    border-radius: var(--_radius);
    overflow: hidden;
  }

  /* All regions share base treatment */
  layout-card > :is(
    header, [slot="header"],
    section, [slot="content"],
    footer, [slot="footer"]
  ) {
    padding: var(--_region-padding, var(--_padding));
  }

  /* Grid area assignments */
  layout-card > :is(header, [slot="header"]) { grid-area: header; }
  layout-card > :is(section, [slot="content"]) { grid-area: content; }
  layout-card > :is(footer, [slot="footer"]) { grid-area: footer; }

  /* Dividers */
  layout-card > :is(header, [slot="header"]) { 
    border-block-end: var(--_divider); 
  }
  layout-card > :is(footer, [slot="footer"]) { 
    border-block-start: var(--_divider); 
  }

  /* Implicit content: bare children without semantic role or slot */
  layout-card > :not(:is(header, section, footer, [slot])) {
    grid-area: content;
    padding: var(--_padding);
  }

  /* Edge handling: remove dividers and inherit radius when region absent */
  layout-card:not(:has(> :is(header, [slot="header"]))) {
    > :first-child {
      border-block-start: none;
      border-start-start-radius: var(--_radius);
      border-start-end-radius: var(--_radius);
    }
  }

  layout-card:not(:has(> :is(footer, [slot="footer"]))) {
    > :last-child {
      border-block-end: none;
      border-end-start-radius: var(--_radius);
      border-end-end-radius: var(--_radius);
    }
  }
}

@layer variants {
  layout-card[data-variant="elevated"] {
    --card-border: none;
    box-shadow: var(--shadow-m);
  }

  layout-card[data-variant="ghost"] {
    --card-bg: transparent;
    --card-border: none;
  }

  layout-card[data-variant="outlined"] {
    --card-bg: transparent;
  }

  layout-card[data-compact] {
    --card-padding: var(--space-s);
  }
}
```

### Layer Strategy

```css
@layer tokens, reset, primitives, components, variants, overrides;
```

| Layer | Purpose |
|-------|---------|
| `tokens` | CSS custom properties (spacing, color, typography) |
| `reset` | Baseline normalization |
| `primitives` | Core component styles |
| `components` | Composed patterns |
| `variants` | Data-attribute driven variations |
| `overrides` | Scoped or one-off adjustments |

Components consume tokens. Theming changes tokens. Overrides happen in a dedicated layer, not via specificity hacks.

---

## Content Model Validation

### Build-Time Validation

Use `html-validate` with custom element definitions:

```json
{
  "elements": [
    {
      "layout-card": {
        "permittedContent": ["header?", "section?", "footer?", "@flow"],
        "permittedOrder": ["header", "section | @flow", "footer"],
        "attributes": {
          "data-variant": {
            "enum": ["elevated", "outlined", "ghost"]
          },
          "data-compact": {
            "boolean": true
          }
        }
      }
    }
  ]
}
```

### Debug Mode (Runtime)

Enable with `<html data-debug>` or `localStorage.setItem('vanillaBreeze.debug', 'true')`.

```javascript
// debug-content-model.js
const contentModels = {
  'layout-card': {
    semantic: ['header', 'section', 'footer'],
    slots: ['header', 'content', 'footer'],
    order: ['header', 'section|content', 'footer'],
  }
};

function validateContentModel(el) {
  const model = contentModels[el.localName];
  if (!model) return;

  const children = [...el.children];
  const warnings = [];

  children.forEach(child => {
    const name = child.localName;
    const slot = child.getAttribute('slot');
    
    const isSemantic = model.semantic.includes(name);
    const isSlotted = slot && model.slots.includes(slot);
    const isImplicit = !slot && !model.semantic.includes(name);
    
    if (!isSemantic && !isSlotted && !isImplicit) {
      warnings.push(`Unexpected child <${name}${slot ? ` slot="${slot}"` : ''}>`);
    }
  });

  // Order validation
  const found = children.map(child => {
    if (model.semantic.includes(child.localName)) return child.localName;
    if (child.hasAttribute('slot')) return child.getAttribute('slot');
    return 'content';
  });

  const orderPattern = model.order.map(p => p.split('|'));
  let orderIndex = 0;
  for (const item of found) {
    while (orderIndex < orderPattern.length && !orderPattern[orderIndex].includes(item)) {
      orderIndex++;
    }
    if (orderIndex >= orderPattern.length) {
      warnings.push(`Child order violation: "${item}" appears after expected position`);
      break;
    }
  }

  if (warnings.length) {
    console.warn(`<${el.localName}> content model:`, warnings, el);
    el.dataset.invalid = '';
  }
}

function initDebug() {
  const isDebug = document.documentElement.hasAttribute('data-debug') 
    || localStorage.getItem('vanillaBreeze.debug');
  
  if (!isDebug) return;

  Object.keys(contentModels).forEach(tag => {
    document.querySelectorAll(tag).forEach(validateContentModel);
  });

  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      if (m.type === 'childList' && m.target.localName in contentModels) {
        validateContentModel(m.target);
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

document.readyState === 'loading' 
  ? document.addEventListener('DOMContentLoaded', initDebug)
  : initDebug();
```

Visual feedback for invalid structures:

```css
@layer debug {
  [data-debug] [data-invalid] {
    outline: 2px dashed oklch(65% 0.25 30);
    outline-offset: 2px;
    position: relative;
  }

  [data-debug] [data-invalid]::after {
    content: "⚠️ Invalid structure";
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: 0;
    font-size: var(--text-xs);
    background: oklch(65% 0.25 30);
    color: white;
    padding: var(--space-2xs) var(--space-xs);
    border-end-start-radius: var(--radius-s);
  }
}
```

---

## Dynamic Content

### The Repeating Content Problem

Static composition is solved. Dynamic lists (cards, rows, items) need a pattern that:

- Keeps templates in HTML
- Binds data without a template language
- Supports formatting and conditionals
- Remains secure

### `<card-list>` Component

```html
<card-list src="/api/products.json">
  <template>
    <layout-card>
      <header>
        <h3 data-field="name"></h3>
        <span data-field="`$${price.toFixed(2)}`"></span>
      </header>
      <section>
        <p data-field="description"></p>
        <p data-field="stock > 0 ? `${stock} in stock` : 'Out of stock'"></p>
      </section>
      <footer>
        <button data-field-attr="disabled: stock === 0">Add to Cart</button>
      </footer>
    </layout-card>
  </template>
</card-list>
```

### Data Binding Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-field` | Set `textContent` | `data-field="name"` |
| `data-field` | Expression for text | `data-field="\`$${price}\`"` |
| `data-field-attr` | Set element attributes | `data-field-attr="disabled: stock === 0"` |
| `data-field-html` | Set `innerHTML` (sanitized) | `data-field-html="richDescription"` |

### Data Sources

```html
<!-- From URL -->
<card-list src="/api/items.json">

<!-- From inline JSON -->
<card-list data-items='[{"name":"One"},{"name":"Two"}]'>

<!-- From JavaScript property -->
<script>
  document.querySelector('card-list').items = fetchedData;
</script>
```

### Expression Evaluation

Expressions in `data-field` support formatting and conditionals. Security is handled via a two-tier system.

#### Default Mode: Safe Expressions

Property access plus allowlisted operations (template literals, ternary, comparison, math). Forbidden patterns are blocked:

```javascript
const forbidden = [
  /\bfunction\b/,
  /\beval\b/,
  /\bimport\b/,
  /\bfetch\b/,
  /\bdocument\b/,
  /\bwindow\b/,
  /\bglobalThis\b/,
  /\bconstructor\b/,
  /\bprototype\b/,
  /\b__proto__\b/,
  /\bthis\b/,
  /=(?!=)/,       // assignment (not == or ===)
  /\bnew\b/,
];
```

#### Trusted Mode: Full Expressions

Add `data-trusted` for unrestricted expression evaluation when you control the data source:

```html
<card-list src="/api/internal-data.json" data-trusted>
  <template>
    <span data-field="complexCalculation(items.filter(i => i.active))"></span>
  </template>
</card-list>
```

### Implementation

```javascript
class CardList extends HTMLElement {
  connectedCallback() {
    this.template = this.querySelector('template');
    
    if (this.hasAttribute('src')) {
      this.load(this.getAttribute('src'));
    } else if (this.hasAttribute('data-items')) {
      this.render(JSON.parse(this.getAttribute('data-items')));
    }
  }

  async load(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.render(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      console.error(`<card-list> fetch failed:`, err);
      this.dispatchEvent(new CustomEvent('load-error', { detail: err }));
    }
  }

  render(items) {
    const fragment = document.createDocumentFragment();
    
    for (const item of items) {
      const clone = this.template.content.cloneNode(true);
      this.bindFields(clone, item);
      fragment.appendChild(clone);
    }

    [...this.children].forEach(el => {
      if (el !== this.template) el.remove();
    });
    this.appendChild(fragment);
    
    this.dispatchEvent(new CustomEvent('render', { detail: { count: items.length } }));
  }

  bindFields(root, item) {
    root.querySelectorAll('[data-field]').forEach(el => {
      el.textContent = this.evaluate(el.dataset.field, item);
    });

    root.querySelectorAll('[data-field-attr]').forEach(el => {
      const bindings = el.dataset.fieldAttr.split(',').map(s => s.trim());
      bindings.forEach(binding => {
        const [attr, expr] = binding.split(':').map(s => s.trim());
        const value = this.evaluate(expr, item);
        if (typeof value === 'boolean') {
          value ? el.setAttribute(attr, '') : el.removeAttribute(attr);
        } else {
          el.setAttribute(attr, value);
        }
      });
    });

    root.querySelectorAll('[data-field-html]').forEach(el => {
      el.innerHTML = this.sanitize(this.evaluate(el.dataset.fieldHtml, item));
    });
  }

  evaluate(expr, item) {
    // Simple property access (always allowed)
    if (/^[a-zA-Z_][\w]*(?:\.[\w]+)*$/.test(expr)) {
      return expr.split('.').reduce((obj, key) => obj?.[key], item) ?? '';
    }

    const trusted = this.hasAttribute('data-trusted');

    // Check forbidden patterns (always, even in trusted mode)
    const forbidden = [
      /\bfunction\b/, /\beval\b/, /\bimport\b/, /\bexport\b/,
      /\brequire\b/, /\bfetch\b/, /\bXMLHttpRequest\b/,
      /\bdocument\b/, /\bwindow\b/, /\bglobalThis\b/,
      /\bconstructor\b/, /\bprototype\b/, /\b__proto__\b/, /\bthis\b/,
      /=(?!=)/, /\bnew\b/,
    ];

    for (const pattern of forbidden) {
      if (pattern.test(expr)) {
        console.warn(`Forbidden pattern in expression: ${expr}`);
        return '';
      }
    }

    // Complex expressions require trusted mode
    if (!trusted) {
      // Allow only: template literals, ternary, comparison, math, string concat
      const safePattern = /^[\w\s\.\[\]`${}()+\-*/%<>=!?:'",]+$/;
      if (!safePattern.test(expr)) {
        console.warn(`Expression "${expr}" requires data-trusted attribute`);
        return '';
      }
    }

    try {
      const keys = Object.keys(item);
      const values = Object.values(item);
      const fn = new Function(...keys, `"use strict"; return ${expr}`);
      return fn(...values);
    } catch (err) {
      console.warn(`Expression error: ${expr}`, err);
      return '';
    }
  }

  sanitize(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  static observedAttributes = ['src'];
  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'src' && oldVal !== newVal && newVal) {
      this.load(newVal);
    }
  }

  set items(data) {
    this.render(Array.isArray(data) ? data : []);
  }
}

customElements.define('card-list', CardList);
```

---

## Usage Examples

### Simple Card

```html
<layout-card>
  <header><h3>Welcome</h3></header>
  <section><p>Thanks for visiting.</p></section>
</layout-card>
```

### Card with Escape Hatch

```html
<layout-card data-variant="elevated">
  <header><h3>Testimonial</h3></header>
  <blockquote slot="content">
    <p>"This changed everything for our team."</p>
    <cite>— Jamie Chen, CTO</cite>
  </blockquote>
</layout-card>
```

### Dynamic Product List

```html
<card-list src="/api/products.json">
  <template>
    <layout-card>
      <header>
        <h3 data-field="name"></h3>
        <span data-field="`$${price.toFixed(2)}`"></span>
      </header>
      <section>
        <p data-field="description"></p>
        <p data-field="stock > 0 ? `${stock} available` : 'Out of stock'"></p>
      </section>
      <footer>
        <button data-field-attr="disabled: stock === 0">Add to Cart</button>
      </footer>
    </layout-card>
  </template>
</card-list>
```

### Task List with Status Styling

```html
<card-list src="/api/tasks.json">
  <template>
    <layout-card data-field-attr="data-status: status">
      <header>
        <h3 data-field="title"></h3>
        <span data-field="status === 'done' ? '✓' : ''"></span>
      </header>
      <section>
        <p data-field="description"></p>
        <p data-field="assignee ? `Assigned: ${assignee}` : 'Unassigned'"></p>
      </section>
    </layout-card>
  </template>
</card-list>

<style>
  layout-card[data-status="done"] { opacity: 0.7; }
  layout-card[data-status="blocked"] { 
    --card-border: var(--border-thin) solid var(--color-warning); 
  }
</style>
```

---

## Migration Path

1. **Audit existing `<layout-*>` components** for composition patterns
2. **Add `:is()` consolidation** to reduce CSS repetition
3. **Define content models** for build-time validation
4. **Add debug mode script** for runtime feedback during development
5. **Implement `<card-list>`** as the pattern for dynamic repeating content
6. **Document slot conventions** (header, content, footer) across components

---

## Future Considerations

### Platform Evolution

These patterns are designed as a bridge. As the platform evolves:

- **DOM Parts / Template Instantiation**: Could replace `data-field` binding
- **CSS `:has()` improvements**: More content model enforcement in CSS
- **Declarative Custom Elements**: May simplify component registration
- **Scoped Element Registries**: Better encapsulation without Shadow DOM costs

### Open Questions

1. Should `data-field` support filters like `data-field="name | uppercase"`?
2. Should there be a `<list-item>` generic wrapper for non-card lists?
3. How do we handle pagination and infinite scroll in `<card-list>`?
4. Should content model validation integrate with TypeScript/JSDoc for IDE support?

---

## References

- [HTML Content Models (WHATWG)](https://html.spec.whatwg.org/multipage/dom.html#content-models)
- [CSS `:is()` and `:where()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:is)
- [CSS `:has()` Selector](https://developer.mozilla.org/en-US/docs/Web/CSS/:has)
- [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
- [Template Instantiation Proposal](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Template-Instantiation.md)
- [DOM Parts Proposal](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/DOM-Parts.md)
