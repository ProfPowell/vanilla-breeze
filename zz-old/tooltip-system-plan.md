# CSS-First Tooltip System Plan

A research-backed implementation plan for building accessible, performant tooltips using modern HTML and CSS features with minimal-to-no JavaScript.

## Executive Summary

Modern web platform features now enable tooltip implementations that were previously JavaScript-dependent. The combination of the **Popover API**, **CSS Anchor Positioning**, and **CSS discrete transitions** provides a robust foundation. However, **truly zero-JavaScript tooltips are not yet achievable** for hover-triggered interactions—the proposed `interesttarget` attribute remains unimplemented.

**Recommended approach:** Progressive enhancement with CSS handling all positioning, animation, and styling, while a thin JavaScript layer manages hover/focus event binding.

## Feature Landscape

### Baseline Features (Safe to Use)

| Feature | Purpose | Browser Support |
|---------|---------|-----------------|
| `popover` attribute | Top-layer rendering, light-dismiss | Baseline 2024 |
| `popover="hint"` | Tooltip-specific stacking behavior | Baseline 2024 |
| `:popover-open` | Style open state | Baseline 2024 |
| `popovertarget` | Declarative button→popover binding | Baseline 2024 |
| `role="tooltip"` + `aria-describedby` | Accessibility semantics | Universal |

### Emerging Features (Progressive Enhancement)

| Feature | Purpose | Status |
|---------|---------|--------|
| CSS Anchor Positioning | Position relative to trigger | Chrome 125+, Firefox 131+ (flag) |
| `@starting-style` | Entry animations | Chrome 117+, Safari 17.5+ |
| `transition-behavior: allow-discrete` | Animate `display` | Chrome 117+, Safari 17.5+ |
| `position-try-fallbacks` | Auto-flip on overflow | Chrome 125+ |
| Invoker Commands (`commandfor`) | Declarative control | Chrome 135+ |

### Not Yet Available

| Feature | Purpose | Status |
|---------|---------|--------|
| `interesttarget` | Declarative hover trigger | Proposal only—no implementations |

## Architecture Decision

### Why `popover="hint"`?

The `hint` popover type is specifically designed for tooltips:

1. **Stacking behavior:** Hint popovers can appear over `auto` popovers without dismissing them
2. **No light-dismiss:** Won't close when user clicks elsewhere (appropriate for transient hints)
3. **Top-layer rendering:** Escapes all z-index stacking contexts
4. **No backdrop:** Unlike modals, doesn't block interaction

```html
<button id="trigger" aria-describedby="tip">Hover me</button>
<div id="tip" popover="hint" role="tooltip">Helpful information</div>
```

### Positioning Strategy

**Tier 1: CSS Anchor Positioning (preferred)**

```css
/* Establish anchor */
[aria-describedby] {
  anchor-name: --tooltip-trigger;
}

/* Position tooltip */
[role="tooltip"] {
  position: fixed;
  position-anchor: --tooltip-trigger;
  
  /* Place above trigger, centered */
  inset-block-end: anchor(top);
  justify-self: anchor-center;
  margin-block-end: 8px;
  
  /* Auto-flip when constrained */
  position-try-fallbacks: flip-block, flip-inline;
}
```

**Tier 2: Fallback with `calc()` and viewport units**

For browsers without anchor positioning, use JavaScript to set CSS custom properties for position.

### Animation Pattern

Entry and exit animations using CSS transitions:

```css
[popover="hint"] {
  /* Exit state (default) */
  opacity: 0;
  transform: translateY(4px);
  
  transition: 
    opacity 150ms ease-out,
    transform 150ms ease-out,
    display 150ms allow-discrete,
    overlay 150ms allow-discrete;
}

[popover="hint"]:popover-open {
  /* Open state */
  opacity: 1;
  transform: translateY(0);
}

/* Entry animation starting point */
@starting-style {
  [popover="hint"]:popover-open {
    opacity: 0;
    transform: translateY(4px);
  }
}
```

**Key insight:** `allow-discrete` enables animating `display: none ↔ block`, while `@starting-style` provides the "from" state for entry animations.

## Implementation Tiers

### Tier 1: Minimal JavaScript (Recommended)

JavaScript responsibilities:
- Bind `mouseenter`/`mouseleave` and `focus`/`blur` events
- Call `showPopover()` and `hidePopover()`
- Optional: Set `source` parameter for implicit anchor relationship

```javascript
function initTooltips() {
  document.querySelectorAll('[data-tooltip]').forEach(trigger => {
    const tip = document.getElementById(trigger.dataset.tooltip);
    if (!tip) return;
    
    const show = () => tip.showPopover({ source: trigger });
    const hide = () => tip.hidePopover();
    
    trigger.addEventListener('mouseenter', show);
    trigger.addEventListener('mouseleave', hide);
    trigger.addEventListener('focus', show);
    trigger.addEventListener('blur', hide);
  });
}
```

CSS handles everything else: positioning, animation, styling.

### Tier 2: CSS-Only for Click Triggers

For tooltips triggered by click (info buttons, help icons), truly zero JavaScript:

```html
<button popovertarget="help-tip" popovertargetaction="toggle">
  <span aria-hidden="true">?</span>
  <span class="sr-only">Help</span>
</button>
<div id="help-tip" popover="auto" role="tooltip">
  Click outside to dismiss
</div>
```

### Tier 3: Future Pure CSS (When `interesttarget` Ships)

The proposed syntax would enable:

```html
<!-- NOT YET IMPLEMENTED -->
<button interesttarget="tip">Hover me</button>
<div id="tip" popover="hint">Tooltip text</div>
```

Monitor: [Open UI Interest Invokers Explainer](https://open-ui.org/components/interest-invokers.explainer/)

## Accessibility Requirements

### Required Patterns

```html
<!-- Trigger references tooltip -->
<button aria-describedby="tooltip-1">Term</button>
<div id="tooltip-1" role="tooltip" popover="hint">Definition</div>
```

### Keyboard Support

| Key | Action |
|-----|--------|
| Focus trigger | Show tooltip |
| Blur trigger | Hide tooltip |
| Escape | Hide tooltip (built into popover API) |

### Screen Reader Behavior

- `role="tooltip"` identifies the element semantically
- `aria-describedby` creates relationship; screen reader announces tooltip content after trigger's accessible name
- Popover API manages focus appropriately

### Timing Considerations

- **Show delay:** 300-500ms prevents accidental triggers
- **Hide delay:** 100-200ms prevents flickering when moving between trigger/tooltip
- CSS `transition-delay` can handle simple cases; JavaScript needed for hover intent

## Implementation Checklist

### HTML Structure

```html
<span class="tooltip-trigger" 
      data-tooltip="tip-1" 
      tabindex="0"
      aria-describedby="tip-1">
  Hover term
</span>
<div id="tip-1" 
     class="tooltip" 
     popover="hint" 
     role="tooltip">
  Tooltip content
</div>
```

### CSS Core

```css
/* === Base tooltip styles === */
.tooltip {
  /* Reset popover defaults */
  border: none;
  padding: 0;
  margin: 0;
  background: transparent;
  
  /* Actual tooltip styling */
  --tooltip-bg: hsl(0 0% 15%);
  --tooltip-fg: hsl(0 0% 100%);
  
  background: var(--tooltip-bg);
  color: var(--tooltip-fg);
  padding: 0.5em 0.75em;
  border-radius: 4px;
  font-size: 0.875rem;
  max-inline-size: 30ch;
  
  /* Animation exit state */
  opacity: 0;
  transform: translateY(4px) scale(0.98);
  
  transition:
    opacity 150ms ease-out,
    transform 150ms ease-out,
    display 150ms allow-discrete,
    overlay 150ms allow-discrete;
}

.tooltip:popover-open {
  opacity: 1;
  transform: translateY(0) scale(1);
}

@starting-style {
  .tooltip:popover-open {
    opacity: 0;
    transform: translateY(4px) scale(0.98);
  }
}

/* === Anchor positioning (when supported) === */
@supports (anchor-name: --x) {
  .tooltip-trigger {
    anchor-name: --trigger;
  }
  
  .tooltip {
    position: fixed;
    position-anchor: --trigger;
    inset-block-end: anchor(top);
    justify-self: anchor-center;
    margin-block-end: 8px;
    
    position-try-fallbacks: flip-block;
  }
}
```

### JavaScript Enhancement

```javascript
class TooltipController {
  static SHOW_DELAY = 400;
  static HIDE_DELAY = 150;
  
  #showTimeout = null;
  #hideTimeout = null;
  
  constructor(trigger, tooltip) {
    this.trigger = trigger;
    this.tooltip = tooltip;
    this.#bind();
  }
  
  #bind() {
    this.trigger.addEventListener('mouseenter', () => this.#scheduleShow());
    this.trigger.addEventListener('mouseleave', () => this.#scheduleHide());
    this.trigger.addEventListener('focus', () => this.#show());
    this.trigger.addEventListener('blur', () => this.#hide());
    
    // Cancel hide if mouse enters tooltip
    this.tooltip.addEventListener('mouseenter', () => this.#cancelHide());
    this.tooltip.addEventListener('mouseleave', () => this.#scheduleHide());
  }
  
  #scheduleShow() {
    this.#cancelHide();
    this.#showTimeout = setTimeout(() => this.#show(), TooltipController.SHOW_DELAY);
  }
  
  #scheduleHide() {
    this.#cancelShow();
    this.#hideTimeout = setTimeout(() => this.#hide(), TooltipController.HIDE_DELAY);
  }
  
  #cancelShow() {
    clearTimeout(this.#showTimeout);
  }
  
  #cancelHide() {
    clearTimeout(this.#hideTimeout);
  }
  
  #show() {
    this.#cancelShow();
    this.tooltip.showPopover({ source: this.trigger });
  }
  
  #hide() {
    this.#cancelHide();
    this.tooltip.hidePopover();
  }
}

// Initialize
document.querySelectorAll('[data-tooltip]').forEach(trigger => {
  const tooltip = document.getElementById(trigger.dataset.tooltip);
  if (tooltip) new TooltipController(trigger, tooltip);
});
```

## Browser Support Strategy

### Feature Detection

```css
/* Anchor positioning enhancement */
@supports (anchor-name: --x) {
  /* Use anchor positioning */
}

/* Discrete animation enhancement */
@supports (transition-behavior: allow-discrete) {
  /* Use animated entry/exit */
}
```

```javascript
// Popover API support
const supportsPopover = 'popover' in HTMLElement.prototype;

// Anchor positioning support
const supportsAnchor = CSS.supports('anchor-name', '--x');
```

### Fallback Strategy

1. **No popover support:** Use CSS `:hover` and `:focus-within` with `visibility`
2. **No anchor positioning:** Use JavaScript to compute position, set via CSS custom properties
3. **No `@starting-style`:** Tooltips still work, just without smooth entry animation

## File Organization

```
tooltip-system/
├── tooltip.css           # Core styles + anchor positioning
├── tooltip.js            # Event binding + hover intent
├── tooltip-fallback.css  # Non-anchor positioning fallback
└── tooltip-fallback.js   # Position calculation fallback
```

## Performance Notes

- **Top-layer rendering:** No z-index management, no forced compositing of ancestor layers
- **Anchor positioning:** Browser-native positioning avoids layout thrashing from JS calculations
- **CSS animations:** GPU-accelerated, main-thread-free
- **Popover API:** Built-in show/hide state machine, no manual DOM manipulation

## Testing Matrix

| Browser | Popover | Anchor | `@starting-style` | Priority |
|---------|---------|--------|-------------------|----------|
| Chrome 125+ | ✓ | ✓ | ✓ | Full experience |
| Safari 17.5+ | ✓ | ✗ | ✓ | Needs position fallback |
| Firefox 131+ | ✓ | Flag | ✓ | Needs position fallback |
| Firefox 114-130 | ✓ | ✗ | ✗ | Basic experience |

## Open Questions

1. **Touch devices:** Should tooltips trigger on long-press? Current popover behavior doesn't support this natively.

2. **Rich content:** For tooltips with interactive content (links, buttons), consider `popover="auto"` instead of `hint` for light-dismiss behavior.

3. **Multiple anchors:** CSS anchor positioning currently requires unique anchor names per trigger—at scale, JavaScript may need to dynamically set anchor names.

## References

- [MDN: Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
- [MDN: CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning)
- [MDN: @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)
- [Open UI: Invoker Commands](https://open-ui.org/components/invokers.explainer/)
- [ARIA: tooltip role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/tooltip_role)
