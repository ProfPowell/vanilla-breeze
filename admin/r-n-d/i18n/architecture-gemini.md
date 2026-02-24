# Vanilla Breeze: Architectural Specification

This document defines the core logic for the Style, Controller, and State systems of the Vanilla Breeze library.

## 1. Style: The Three-Layer CSS Architecture
To ensure VB is both a "Reset" and a "Framework," styles are organized into three `@layer` blocks.

```css
@layer vb.base, vb.tokens, vb.theme;

@layer vb.base {
  /* The "Contract": Logical properties, i18n typography, A11y resets.
     Mandatory for the VB experience. */
  [dir="rtl"] { unicode-bidi: isolate; }
  :lang(ja) { line-height: 1.8; }
}

@layer vb.tokens {
  /* The "Theme Engine": CSS Variables with platform fallbacks. */
  :root {
    --vb-primary: AccentColor;
    --vb-font-main: system-ui, sans-serif;
    --vb-radius: 0.5rem;
  }
}

@layer vb.theme {
  /* The "Breeze Look": Opinions on shadows, borders, and polish. 
     Optional and easily overridden. */
  .vb-card {
    border-radius: var(--vb-radius);
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }
}
```

## 2. Controller: The Core Registry Pattern
VB uses a "Micro-Kernel" architecture. The core script is an observer that delegates behavior to registered plugins.

### Core Logic (`vb-core.js`)
```javascript
class VbCore {
  constructor() {
    this.registry = new Map();
    this.observer = new MutationObserver(this._handleMutations.bind(this));
  }

  register(attrName, initFn) {
    this.registry.set(`data-vb-${attrName}`, initFn);
  }

  mount(root = document.body) {
    this.observer.observe(root, { childList: true, subtree: true });
    this._scan(root);
  }

  _scan(root) {
    this.registry.forEach((initFn, attr) => {
      root.querySelectorAll(`[${attr}]`).forEach(el => initFn(el));
    });
  }
}
export const vb = new VbCore();
```

### Plugin Example (`vb-i18n.js`)
```javascript
import { vb } from './vb-core.js';

vb.register('i18n', (el) => {
  const key = el.dataset.vbI18n;
  // Translation logic here...
});
```

## 3. State: The Attribute/Property Hybrid
We separate **Configuration** (Attributes) from **Data** (Properties).

### The "Intent" (HTML)
```html
<!-- Simple, declarative config -->
<div data-vb-slider="loop:true; autoplay:5000"></div>
```

### The "Data" (JavaScript)
We attach a `vb` property to the element to handle complex state and high-frequency updates.

```javascript
const slider = document.querySelector('[data-vb-slider]');

// Accessing the controller instance directly via the element
slider.vb.next(); 

// Updating complex data without stringifying JSON into the DOM
slider.vb.slides = [
  { img: '1.jpg', alt: 'Sunrise' },
  { img: '2.jpg', alt: 'Sunset' }
];
```

### Why this works:
1.  **Serialization Safety:** We avoid `JSON.parse` in loops.
2.  **DevTool Friendliness:** The HTML remains clean in the Inspector.
3.  **Memory Management:** We use `WeakMap` inside the plugins to link DOM elements to their JS Controller instances, preventing memory leaks when elements are removed.
