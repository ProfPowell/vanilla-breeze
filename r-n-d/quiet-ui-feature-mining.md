# Quiet UI → Vanilla Breeze: Feature Mining Review

**Date:** February 9, 2026
**Source:** Quiet UI by Cory LaViska (88 web components, Lit + Shadow DOM)
**Compared Against:** Vanilla Breeze v0.1.x

---

## Executive Summary

Quiet UI is a defunct web component library built on Lit with Shadow DOM — a different philosophy than VB's HTML-first progressive enhancement. However, it contains several ideas worth adapting. This review identifies what to bring over, adapted to VB's principles: semantic HTML first, CSS second, JS third, zero dependencies, data-attributes for state.

**Verdict:** Strong opportunity. 15+ specific features warrant adoption across 4 tiers.

---

## Tier 1: Quick Wins (Small effort, immediate value)

### 1.1 `<copy-wc>` — Copy to Clipboard Button

**Why:** VB already has clipboard copy in `heading-links` but no reusable copy component. This is a common need (code blocks, share URLs, API keys).

**VB approach:** Progressive enhancement on a `<button>`.

```html
<copy-wc data-value="text to copy">
  <button>Copy</button>
</copy-wc>
<!-- Or copy from a target element -->
<copy-wc data-target="#code-block">
  <button>Copy</button>
</copy-wc>
```

**Complexity:** Small — ~60 lines of JS, CSS for feedback state.

### 1.2 `<relative-time-wc>` — Relative Time Display

**Why:** "3 hours ago" is ubiquitous in web apps. Uses `Intl.RelativeTimeFormat` (no deps). VB has nothing for this.

**VB approach:** Enhance a `<time>` element with progressive enhancement.

```html
<relative-time-wc>
  <time datetime="2026-02-09T10:00:00Z">February 9, 2026</time>
</relative-time-wc>
```

Without JS: shows the formatted date. With JS: shows "2 hours ago" and auto-updates.

**Complexity:** Small — ~80 lines of JS.

### 1.3 `<hotkey-wc>` — Keyboard Shortcut Display

**Why:** Shows keyboard shortcuts with platform-aware rendering (⌘ on Mac, Ctrl on Windows). VB has nothing for this.

**VB approach:** Pure CSS custom element + small JS for platform detection.

```html
<hotkey-wc data-keys="meta+k">Ctrl+K</hotkey-wc>
```

CSS styles `<kbd>` elements inside; JS swaps labels per platform.

**Complexity:** Small — mostly CSS, ~30 lines of JS.

### 1.4 Color Presets Expansion

**Why:** Quiet UI has 20 named color presets. VB has 3 themes (forest, ocean, sunset). More presets = instant differentiation for users.

**VB approach:** Already fits — just add more hue presets to the token system.

**Complexity:** Small — CSS-only, one file per preset or a single presets file.

---

## Tier 2: High-Value Additions (Medium effort, significant capability)

### 2.1 `<combobox-wc>` — Autocomplete/Typeahead Input

**Why:** The gap between `<select>` and a searchable dropdown is a top user frustration. VB has `<datalist>` styling but no rich combobox. This is one of the hardest components to build accessibly.

**VB approach:** Enhance native `<input>` + `<datalist>` or `<input>` + list.

```html
<combobox-wc>
  <input type="text" list="options" />
  <datalist id="options">
    <option value="Apple">
    <option value="Banana">
  </datalist>
</combobox-wc>
```

Or with richer markup for descriptions/icons in options:

```html
<combobox-wc>
  <input type="text" role="combobox" />
  <ul role="listbox">
    <li role="option" data-value="apple">Apple</li>
    <li role="option" data-value="banana">Banana</li>
  </ul>
</combobox-wc>
```

**Complexity:** Large — ARIA combobox pattern is complex (keyboard nav, filtering, announcements).

### 2.2 `<carousel-wc>` — Scroll Carousel

**Why:** Carousels/sliders are extremely common. VB has `layout-reel` for horizontal scroll but no carousel with navigation controls, indicators, or auto-play.

**VB approach:** Enhance `layout-reel` or a scroll container with prev/next buttons.

```html
<carousel-wc>
  <div class="slides">
    <article>Slide 1</article>
    <article>Slide 2</article>
    <article>Slide 3</article>
  </div>
</carousel-wc>
```

CSS handles scroll-snap. JS adds navigation buttons, indicators, keyboard support.

**Complexity:** Medium — scroll-snap does heavy lifting, JS for controls.

### 2.3 `<splitter-wc>` — Resizable Panels

**Why:** Resizable panel layouts (IDE-style, admin dashboards) are increasingly common. No CSS-only solution exists.

**VB approach:** Enhance a container with draggable divider.

```html
<splitter-wc data-orientation="horizontal">
  <div>Panel 1</div>
  <div>Panel 2</div>
</splitter-wc>
```

**Complexity:** Medium — drag handling, keyboard resize, orientation support.

### 2.4 Form-Associated Custom Elements (Architecture)

**Why:** Quiet UI uses `ElementInternals` API so custom form controls participate in native `<form>` submission and validation. VB has `<form-field>` for layout but no form-associated elements.

**VB approach:** Could apply to components like a future rating input, toggle switch, or combobox. Create a base mixin or pattern.

```javascript
// Pattern for VB web components that need form participation
class FormControlMixin {
  static formAssociated = true;
  #internals;
  constructor() { this.#internals = this.attachInternals(); }
  // setFormValue(), setValidity(), etc.
}
```

**Complexity:** Medium — pattern creation, then apply to relevant components.

### 2.5 Data Formatting Elements

**Why:** Quiet UI has `<quiet-number>`, `<quiet-date>`, `<quiet-bytes>` for locale-aware formatting using `Intl.*` APIs. These are useful utilities VB lacks entirely.

**VB approach:** Enhance native elements progressively.

```html
<!-- Formatted number -->
<format-number value="48200" data-style="currency" data-currency="USD">
  $48,200
</format-number>

<!-- Formatted date -->
<format-date>
  <time datetime="2026-02-09">Feb 9, 2026</time>
</format-date>

<!-- File size -->
<format-bytes value="1048576">1 MB</format-bytes>
```

Without JS: static fallback text renders. With JS: live Intl formatting.

**Complexity:** Small-Medium per element — `Intl` APIs do the work.

---

## Tier 3: Architectural Improvements

### 3.1 Component Autoloader

**Why:** Quiet UI's autoloader watches the DOM and lazy-loads components as they appear — zero manual registration. VB currently loads all JS upfront via `vanilla-breeze.js`.

**VB approach:** A small MutationObserver-based loader that imports only the web components present in the DOM.

```html
<!-- Instead of loading everything: -->
<script type="module" src="vanilla-breeze.js"></script>

<!-- Optionally use autoloader for selective loading: -->
<script type="module" src="vanilla-breeze.loader.js"></script>
```

**Complexity:** Medium — the loader itself is small (~50 lines), but requires restructuring JS exports for tree-shakeable imports.

### 3.2 Enter/Exit Animation Pattern

**Why:** Quiet UI has coordinated enter/exit animations for things like toasts, dialogs, and dropdowns. VB's toast-wc already does this, but there's no shared pattern.

**VB approach:** Standardize a CSS + data-attribute animation protocol across all show/hide components.

```css
/* Shared animation pattern */
[data-state="entering"] { animation: vb-enter 200ms ease-out; }
[data-state="exiting"]  { animation: vb-exit 150ms ease-in; }

@keyframes vb-enter { from { opacity: 0; translate: 0 -0.5rem; } }
@keyframes vb-exit  { to   { opacity: 0; translate: 0 -0.5rem; } }
```

Apply to: toast-wc, dropdown-wc, tooltip-wc, dialog, any future overlay.

**Complexity:** Small-Medium — CSS pattern + minor JS refactor in existing components.

### 3.3 View Transitions Integration

**Why:** VB already has a `view-transitions.css` file. Quiet UI has a JS utility for the View Transitions API. VB could formalize this as a progressive enhancement for page/state transitions.

**VB approach:** Already started — expand the CSS, add optional JS helper.

**Complexity:** Small — build on existing foundation.

---

## Tier 4: Nice-to-Have (Differentiation & Delight)

### 4.1 `<sparkline-wc>` — Inline Trend Charts

**Why:** Tiny inline charts for dashboards and stats. VB has CSS-only charts but no inline sparklines.

**VB approach:** SVG-based, enhance a data source.

```html
<sparkline-wc data-values="4,8,15,16,23,42" data-color="var(--color-primary)">
  Trend: 4, 8, 15, 16, 23, 42
</sparkline-wc>
```

**Complexity:** Medium — SVG generation, responsive sizing.

### 4.2 `<number-ticker-wc>` — Animated Counters

**Why:** Eye-catching for stats/dashboards. Common in marketing pages.

**VB approach:** Enhance a number display.

```html
<number-ticker-wc>
  <data value="2847">2,847</data>
</number-ticker-wc>
```

Without JS: shows static number. With JS: animates count-up on intersection.

**Complexity:** Small-Medium — `IntersectionObserver` + `requestAnimationFrame`.

### 4.3 `<comparison-wc>` — Before/After Slider

**Why:** Useful for image comparisons, design showcases. Unique differentiator.

**VB approach:** Enhance two images with a draggable divider.

```html
<comparison-wc>
  <img slot="before" src="before.jpg" alt="Before" />
  <img slot="after" src="after.jpg" alt="After" />
</comparison-wc>
```

**Complexity:** Medium — drag/touch handling, responsive.

### 4.4 `<flip-card-wc>` — Two-Sided Card

**Why:** Useful for product cards, team bios, educational content.

**VB approach:** CSS 3D transforms with progressive enhancement.

```html
<flip-card-wc>
  <div data-face="front">Front content</div>
  <div data-face="back">Back content</div>
</flip-card-wc>
```

CSS handles the 3D flip. JS adds keyboard activation. Without JS: both sides visible stacked.

**Complexity:** Small — mostly CSS.

### 4.5 Observer Wrapper Elements

**Why:** `<intersection-observer>`, `<resize-observer>`, `<mutation-observer>` as declarative HTML elements that fire events. Useful for scroll-triggered animations, lazy loading, responsive behavior without writing JS.

```html
<intersection-wc data-threshold="0.5">
  <section data-state="offscreen">
    Content that animates when visible
  </section>
</intersection-wc>
```

**Complexity:** Small each — thin wrappers around native APIs.

---

## Tier 5: Skip (Doesn't fit VB philosophy)

| Quiet UI Feature | Why Skip |
|---|---|
| Shadow DOM encapsulation | VB uses light DOM intentionally for CSS cascade control |
| Lit dependency | VB is zero-dependency |
| `<quiet-joystick>` | Too niche for a general framework |
| `<quiet-qr>` | Requires canvas/SVG library, too specialized |
| `<quiet-mesh-gradient>` | Fun but not a framework concern |
| `<quiet-lorem-ipsum>` | Dev tool, not a component |
| `<quiet-passcode>` | Too specialized (OTP/PIN entry) |
| `<quiet-slide-activator>` | Niche interaction pattern |
| `<quiet-text-mask>` | Visual effect, not a framework concern |
| `<quiet-stamp>` | Template engine — VB uses HTML |
| `<quiet-include>` | HTML imports — out of scope |
| Full i18n system | Adds complexity; VB components have minimal text |
| `<quiet-veil>` | Loading overlay — CSS-only solution sufficient |
| Icon library system | VB already has `<icon-wc>` with Lucide |

---

## Priority Recommendation

If implementing in order:

1. **Copy button** (1.1) — immediate utility, small scope
2. **Relative time** (1.2) — common need, great PE example
3. **Color presets** (1.4) — CSS-only, instant value
4. **Enter/exit animation pattern** (3.2) — improves existing components
5. **Data formatting elements** (2.5) — fills real gap
6. **Number ticker** (4.2) — dashboard enhancement
7. **Carousel** (2.2) — high demand component
8. **Combobox** (2.1) — hardest but most impactful
9. **Autoloader** (3.1) — architectural improvement for perf

---

## Cross-References

- VB existing web components: `accordion-wc`, `card-list`, `dropdown-wc`, `footnotes-wc`, `heading-links`, `icon-wc`, `page-toc`, `search-wc`, `table-wc`, `tabs-wc`, `theme-wc`, `toast-wc`, `tooltip-wc`
- VB existing custom elements: registered in `src/custom-elements/register.js`
- VB existing libs: `charts.js`, `form-validation.js`, `sound-manager.js`, `theme-manager.js`, `wireframe.js`, `wizard.js`
- Related R&D: `demo-site-opportunity-review.md`, `theme-enhancement.md`
