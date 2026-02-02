# Demo-Site & Standards-Site Opportunity Review
**Date:** February 1, 2026
**Compared Against:** Vanilla Breeze v0.1.0

---

## Executive Summary

Reviewed `~/src/demo-site` and `~/src/workshop/standards-site` for patterns that could enhance Vanilla Breeze. Both projects are progressive enhancement showcases with sophisticated CSS architectures. Most core patterns are already present in VB, but several specific implementations and documentation approaches offer value.

**Verdict:** Moderate opportunity. VB's foundation is solid, but 5-6 specific patterns warrant adoption.

---

## Projects Reviewed

| Project | Purpose | Key Tech |
|---------|---------|----------|
| demo-site | Progressive enhancement showcase app | Pure CSS, custom elements |
| standards-site | UC San Diego CSE 134B teaching site | Astro, htmx, View Transitions |

Both share the same philosophy as Vanilla Breeze: HTML-first, CSS-second, JS-third.

---

## Already Present in Vanilla Breeze

These patterns exist in both demo projects but VB already implements them:

| Pattern | VB Implementation | Notes |
|---------|------------------|-------|
| CSS Layers | `@layer tokens, reset, native-elements, custom-elements...` | VB uses 7 layers vs 5 |
| Design tokens | 100+ tokens in `/src/tokens/` | VB is more comprehensive |
| Theme system | `data-theme` + `data-mode` attributes | VB has more themes (18+) |
| Custom elements | 15 layout primitives | VB's are more sophisticated |
| OKLCH colors | Throughout tokens | Demo-sites use hex/HSL |
| Dark mode | Via `light-dark()` function | VB's approach is more modern |
| Logical properties | `inline-size`, `block-size`, etc. | Consistent in VB |
| Accessibility themes | High-contrast, large-text, dyslexia | VB is ahead here |
| Sticky table headers | Native table styling | Already implemented |
| Form-field wrapper | `<form-field>` custom element | VB has this |

**VB is ahead** on: theming depth, accessibility, color system (OKLCH), layout primitives.

---

## Opportunities to Incorporate

### HIGH VALUE


---

#### 2. View Transitions with Shared Element Naming
**Source:** Both projects
**Gap in VB:** VB may have View Transitions but not the shared element pattern.

```css
/* Global transitions */
@view-transition { navigation: auto; }

/* Shared element naming for morphing */
.gallery-card:nth-child(1) { view-transition-name: card-1; }
.gallery-card:nth-child(2) { view-transition-name: card-2; }

/* Detail page matches the name */
.detail-hero { view-transition-name: card-1; }
```

**Benefits:**
- Cards/images morph into detail views
- Creates spatial awareness in navigation
- No JavaScript required
- Delightful UX with minimal code

**Recommendation:** Add View Transitions section to VB documentation with shared element patterns.

---

#### 3. CSS-Only View Toggle (Card ↔ List)
**Source:** standards-site blog page
**Gap in VB:** No documented pattern for layout switching without JS.

```html
<fieldset>
  <label><input type="radio" name="view" id="view-card" checked> Cards</label>
  <label><input type="radio" name="view" id="view-list"> List</label>
</fieldset>

<article>
  <blog-card>...</blog-card>
</article>
```

```css
/* List mode via :has() */
article:has(#view-list:checked) blog-card {
  grid-template-columns: 120px 1fr;
  gap: var(--size-s);
}

article:has(#view-list:checked) .card-grid {
  display: block; /* Stack instead of grid */
}
```

**Benefits:**
- Pure CSS layout switching
- Works without JavaScript
- State is in DOM (form element)

**Recommendation:** Add as a snippet/pattern in VB documentation.

---

#### 4. Color-Mix for Semantic Opacity
**Source:** standards-site
**Gap in VB:** VB uses OKLCH but may not leverage `color-mix()` for opacity variations.

```css
/* Instead of separate opacity tokens */
--text-muted: color-mix(in oklab, var(--color-text) 70%, transparent);
--border-subtle: color-mix(in oklab, var(--color-border) 50%, transparent);
--surface-hover: color-mix(in oklab, var(--color-primary) 10%, var(--color-surface));
```

**Benefits:**
- Fewer tokens needed
- Opacity derived from base colors
- Maintains semantic meaning
- Works with theming automatically

**Recommendation:** Evaluate adding `color-mix()` patterns to VB token system.

---

#### 5. Tag/Topic Color System
**Source:** Both projects
**Gap in VB:** VB has `layout-badge` but not a full semantic tag system.

```css
:root {
  /* Tag palette - 7 topics */
  --tag-philosophy-bg: oklch(95% 0.05 85);
  --tag-philosophy-border: oklch(70% 0.15 85);
  --tag-philosophy-text: oklch(35% 0.1 85);

  --tag-css-bg: oklch(95% 0.05 250);
  --tag-css-border: oklch(70% 0.15 250);
  --tag-css-text: oklch(35% 0.1 250);
  /* ... etc */
}

tag-topic[data-topic="philosophy"] {
  background: var(--tag-philosophy-bg);
  border-color: var(--tag-philosophy-border);
  color: var(--tag-philosophy-text);
}
```

**Benefits:**
- Semantic content categorization
- Consistent color system for tags
- Easy to extend with new topics
- Works with dark mode automatically

**Recommendation:** Add `<content-tag>` or extend `layout-badge` with topic/category support.

---

### MEDIUM VALUE

#### 6. htmx Integration Patterns
**Source:** standards-site
**Gap in VB:** No htmx integration documented.

```html
<!-- Data-attribute convention (matches VB's data-* philosophy) -->
<nav data-hx-boost="true">
  <a href="/about">About</a>
</nav>
```

```javascript
// Configuration
htmx.config.globalViewTransitions = true;
htmx.config.historyCacheSize = 10;
htmx.config.scrollBehavior = 'smooth';
```

**Benefits:**
- AJAX navigation without framework
- Integrates with View Transitions
- Maintains VB's progressive enhancement philosophy
- Uses data-* attributes (consistent with VB conventions)

**Recommendation:** Add htmx integration guide to VB documentation. Not core but valuable for MPAs.

---

#### 7. CSS-Only Hamburger Menu
**Source:** demo-site
**Gap in VB:** Dashboard example has drawer, but no documented hamburger pattern.

```html
<input type="checkbox" id="menu-toggle" hidden>
<label for="menu-toggle" class="hamburger">☰</label>
<nav>...</nav>
```

```css
nav {
  @media (max-width: 768px) {
    display: none;

    #menu-toggle:checked ~ & {
      display: block;
      position: fixed;
      inset: var(--header-height) 0 0 0;
    }
  }
}
```

**Benefits:**
- No JavaScript for basic menu toggle
- Works on first page load
- Accessible with keyboard

**Recommendation:** Add as snippet for responsive navigation.

---

#### 8. Inert Custom Element Documentation
**Source:** Both projects
**Gap in VB:** VB uses custom elements but doesn't explicitly document the "inert" pattern.

The demo projects use custom element names (`<app-brand>`, `<spacer-element>`, `<blog-card>`) that are **not registered as Web Components**. They're just semantic HTML elements styled with CSS.

**Benefits:**
- Semantic clarity without runtime overhead
- No Web Component registration needed
- Pure CSS styling
- Self-documenting markup

**Recommendation:** Document this pattern explicitly in VB. VB's layout elements already do this for CSS-only elements, but the distinction from `*-wc` components could be clearer.

---

### LOW VALUE (Already Covered or Minor)

| Pattern | Status | Notes |
|---------|--------|-------|
| Sticky headers | Already in VB | VB's table has this |
| Dialog patterns | Already in VB | Native `<dialog>` styling exists |
| Image optimization | Astro-specific | VB is framework-agnostic |
| Content collections | Astro-specific | Not applicable |
| HTML validation scripts | Dev tooling | Nice-to-have but not core |
| Lightbox gallery | Needs JS | Would be a new web component |

---

## Recommendations Summary

### Immediate (Add to Current Docs)

1. **Form validation pseudo-classes** - Document `:user-valid`/`:user-invalid` patterns
2. **View Transitions shared elements** - Add to quick start or new page
3. **Inert vs WC distinction** - Clarify in custom elements docs

### Short Term (New Features)

4. **View toggle pattern** - Add as HTML/CSS snippet
5. **Tag/topic element** - Extend layout-badge or new element
6. **color-mix() adoption** - Evaluate for token simplification

### Medium Term (Integration Guides)

7. **htmx guide** - For MPA progressive enhancement
8. **Hamburger pattern** - Responsive nav snippet

---

## Code Patterns to Extract

### Form Validation (Add to `/src/native-elements/form/`)

```css
form-field {
  /* Success state - only after user interaction */
  &:has(:user-valid) {
    input, textarea, select {
      border-color: var(--color-success);
    }
  }

  /* Error state - only after user interaction */
  &:has(:user-invalid) {
    input, textarea, select {
      border-color: var(--color-error);
    }

    output {
      display: block;
      color: var(--color-error);
    }
  }
}
```

### View Transitions (Add to `/src/utils/` or docs)

```css
/* Enable for all navigation */
@view-transition { navigation: auto; }

/* Main content fades */
main {
  view-transition-name: main-content;
}

/* Shared elements morph */
[data-transition-name] {
  view-transition-name: var(--vt-name);
}
```

---

## Conclusion

The demo-site and standards-site are well-crafted progressive enhancement showcases, but Vanilla Breeze is already more sophisticated in most areas—especially theming, accessibility, and the token system.

**Key takeaways:**
1. VB should adopt `:user-valid`/`:user-invalid` form validation patterns
2. View Transitions with shared elements would enhance VB's value proposition
3. The tag/topic color system fills a gap in content categorization
4. `color-mix()` could simplify VB's token system
5. htmx integration guide would help MPA developers

**Overall:** These are refinements, not foundational changes. VB's architecture is sound.
