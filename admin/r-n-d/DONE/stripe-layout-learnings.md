---
title: Stripe Layout Research
description: Analysis of stripe.com and docs.stripe.com layout patterns for Vanilla Breeze generalization
date: 2026-03-16
tags:
  - layout
  - research
  - design-system
---

# Stripe Layout Research

Analysis of layout and design patterns from stripe.com and docs.stripe.com, with generalizations for Vanilla Breeze. All findings are from live DOM inspection and computed styles.

## Table of Contents

- [Marketing Site (stripe.com)](#marketing-site-stripecom)
- [Documentation Site (docs.stripecom)](#documentation-site-docsstripecom)
- [Shared Patterns](#shared-patterns)
- [VB Generalizations](#vb-generalizations)

---

## Marketing Site (stripe.com)

### Navigation

The nav is **not sticky** — `position: relative` — but achieves a sticky-over-hero illusion via the hero background bleeding upward:

```
header (transparent, position: relative, z-index: 2)
  └── nav.navigation-menu (66px tall, flex)
        └── .section-container.navigation__layout (max-width: 1266px)

section.hero-section-container (position: relative)
  ├── .hero-section__layout (content, z-index above bg)
  └── .section-background (position: absolute, inset: -76px 0 0, z-index: 1, overflow: hidden)
        └── .hero-wave-animation (inset: 0)
```

The `inset: -76px 0 0` on `.section-background` pulls the wave background up by 76px (nav height + 10px bleed), making the wave appear to live behind the nav without the nav actually being sticky. The nav's transparent background reveals it.

**Key insight:** Transparent nav + hero background with negative top offset = sticky appearance without `position: sticky`. Zero JS, zero layout reflow.

### Container System

Single max-width container with generous horizontal padding:

| Property | Value |
|----------|-------|
| `max-width` | `1266px` |
| `padding` | `64px 16px` (vertical/horizontal) |
| `margin` | `0 auto` (implied centering) |

`1266px` is ~15px wider than a typical 1280px breakpoint, giving breathing room at common viewport widths.

### 12-Column Grid

Inside the hero layout container:

```css
.hero-section__layout-grid {
  display: grid;
  grid-template-columns: repeat(12, ~46.5px); /* ~672px total + 11 × 16px gap */
  gap: 40px 16px; /* row-gap / column-gap */
}
```

Computed at 800px viewport: 12 columns × 46.5px + 11 gaps × 16px = 734px — fills the constrained container width. This is a fluid 12-col system: columns are fixed-width within the container but the container itself scales.

The 16px column gap and 40px row gap create strong visual rhythm. Content spans column ranges declaratively.

### Section / Mode System

Every `<section>` carries dual class tokens:

```html
<section class="hds-mode section section--white hds-mode--light">
<section class="hds-mode stats-section stats-section--dark section hds-mode--dark">
```

- `hds-mode` is the hook for the design system (HDS = Horizons Design System)
- `hds-mode--light` / `hds-mode--dark` drive color context via scoped CSS custom properties
- `section--white` is the concrete background variant
- A separate semantic class (`stats-section`, `business-sizes-section`) adds component-specific styles

Section backgrounds observed:

| Class modifier | Background |
|----------------|-----------|
| `section--white` / `hds-mode--light` | `rgb(255, 255, 255)` |
| `stats-section--dark` / `hds-mode--dark` | `rgb(13, 23, 56)` — deep navy |
| `section-row` (wrapper rows) | `transparent` |

Dark-to-light transitions are pure background-color changes on sibling `<section>` elements — no wrapper divs, no gradient overlays. The contrast is stark and intentional.

### Background Animation (The Wave)

The hero animated wave is a progressive enhancement stack:

```
.section-background (position: absolute, inset: -76px 0 0, overflow: hidden)
  └── .hero-wave-animation (position: absolute, inset: 0)
        └── .hero-wave-animation__layout
              └── .hero-wave-animation__contents.hero-wave-animation--drawn
                    ├── canvas.hero-wave-animation__canvas (Three.js r178, WebGL)
                    └── .hero-wave-animation__static
                          └── <picture> (fallback PNG)
```

Degradation order:
1. **WebGL + Three.js**: Full animated wave (JS required, GPU required)
2. **`<picture>` static fallback**: PNG served when canvas is not ready or JS fails
3. **Background color**: Section background white shows through if all else fails

The `hero-wave-animation--drawn` class is added by JS when the canvas is ready — a clean progressive enhancement toggle matching VB's `data-*` attribute pattern.

The canvas fills `inset: 0` on the animation container, which itself fills the full bleed area. No sizing JavaScript — pure CSS containment.

**Horizontal rule lines:** Two `<span>` elements with `position: absolute` are placed at computed `top: 76px` and `top: 581px` — marking the nav bottom and hero bottom. These are hairline decorators that reinforce the grid rhythm visually.

### Bento Grid Layout

The "Flexible solutions" section uses a bento-style layout (`.modular-solutions-bento`). From the DOM it renders as `display: block` at 800px viewport width — the bento cards stack on mobile and form an asymmetric grid at wider breakpoints. Each card (`.modular-solutions-bento-card`) is `position: relative` with a background image layer behind content.

### Typography

| Element | Size | Weight | Letter-spacing |
|---------|------|--------|----------------|
| Body | 16px | normal | 0 |
| H1 | 36px | **300** (light!) | −0.02em |
| H1 line-height | 41.4px (1.15) | — | — |

Font: `sohne-var` variable font, with `"SF Pro Display", sans-serif` fallbacks.

The H1 at weight 300 is deliberate — Stripe's hero headline is deliberately thin/editorial, letting the graphic do the heavy lifting. Most sites over-bold their hero text.

---

## Documentation Site (docs.stripe.com)

### Architecture

Docs is a React SPA with Stripe's "Sail" design system (CSS class prefix `⚙`, atomic utility classes). Not analyzable as conventional CSS — but the layout _structure_ is clear:

```
body
  └── #root
        └── .Shell (flex, column, height: 100vh)
              ├── .Header (flex, 64px, border-bottom)
              ├── .Shell-container (flex, row, overflow: hidden, flex: 1)
              │     ├── [Sidebar — hidden on mobile, ~250px fixed on desktop]
              │     └── [Main content area — flex: 1, overflow-y: scroll]
              └── .CookieBanner (position: fixed, bottom)
```

This is the canonical **app shell pattern**: fixed header, scrollable content area, optional sidebar — all within a full-viewport flex column.

### Header (64px)

- `background: rgb(247, 250, 252)` — off-white, not pure white
- `border-bottom: 1px solid rgb(227, 232, 238)` — subtle separator
- `justify-content: space-between` — logo left, actions right
- Contains a **horizontal tab bar** (`.ContentTabs`) for top-level navigation: Get started / Payments / Revenue / Platform / etc.

The tab bar acts as a secondary nav inside the header — not a separate row. This keeps total chrome height to 64px while offering 7+ top-level destinations.

### Sidebar

- Hidden on mobile via `.Sidebar--hidden` class toggle
- `position: sticky` or scroll within the flex row (DOM shows it at `x: 0` within Shell-container)
- Contains hierarchical navigation for the active tab's content
- `.SidebarFooter-fixed` is a separately positioned element for bottom-pinned sidebar actions

### Main Content

- `flex: 1` — takes remaining width
- `overflow-y: scroll` — the main column scrolls, not the page
- Max-width set on inner content container (not measured, but visually ~720–800px based on typical Stripe docs width)

### Typography (Docs)

Font: `-apple-system, "system-ui", "Segoe UI", Roboto, Helvetica, Arial` — system font stack, not the custom sohne-var used on marketing. This is pragmatic: system fonts load instantly and are highly legible for dense documentation.

| Element | Size | Weight |
|---------|------|--------|
| H1/H2 | 32px | 700 |
| Body | 16px | normal |

Clear contrast with the marketing site's editorial lightness — docs prioritize legibility over aesthetics.

---

## Shared Patterns

### The Section as First-Class Citizen

Both sites treat `<section>` as the primary layout unit. Each section is:
- Full-width (no outer container)
- Self-contained: carries its own color context
- Has an inner container for max-width content constraint

```html
<section class="[mode] [variant]">
  <div class="section-container"> <!-- max-width constraint here -->
    <!-- content -->
  </div>
</section>
```

This is Stripe's answer to the "layout vs content" problem. The section owns the background and spacing; the container owns the width.

### Color Context via Class Tokens

Neither site uses CSS `:has()` or complex selectors for dark/light switching. It's a simple class toggle on the section: `hds-mode--light` or `hds-mode--dark`. Within that scope, components read from context-aware custom properties. This is exactly the `data-mode` pattern VB already uses.

### No Sticky Nav on Marketing

The marketing site nav is `position: relative`. The illusion of stickiness comes from:
1. Transparent nav background
2. Hero background with negative top offset bleeding behind nav
3. JS adds a class when scrolling past the hero to switch to an opaque/sticky state (standard scroll-aware nav pattern)

At initial load state the nav is non-sticky — the page feels lighter, the hero feels more immersive.

### Overflow Hidden as Clip Mechanism

`.section-background` uses `overflow: hidden` to clip the wave animation at section boundaries without CSS `clip-path`. Simple and reliable.

---

## VB Generalizations

### The Framework: Four Layers, Two Selectors

Before the patterns, the rule that governs all of them:

**Class = "this IS a [variant]"** — stable authoring identity, declared once, never changed at runtime. CSS only. The author names what type of element this is.

**`data-*` = "this BEHAVES as / IS IN STATE / IS CONFIGURED as [value]"** — anything that can flip at runtime, is read or written by JS, drives a CSS custom property value, or where the *specific value* itself matters to the outcome.

The four-layer progression:

| Layer | Form | Selector | Rule |
|-------|------|----------|------|
| 1 — HTML | `<section>` | element type | Semantic meaning from the element itself |
| 2 — HTML + CSS | `<section class="hero">` | `.classname` | Stable identity: the author declares *what type* this is |
| 3 — HTML + CSS + JS | `<section data-mode="dark" data-angle="down">` | `[data-attr]` | Behavior / state / config: can flip, drives tokens, read by JS |
| 4 — Custom / Web element | `<layout-sidebar>`, `<animated-bg>` | element type + `[data-attr]` | Element name carries intent; `data-*` is the JS observable API |

`data-mode="dark"` looks like a variant but is behavioral — it overrides the color token cascade scoped to that element, and can be flipped by a theme switcher or JS. A section is not "a dark section" in the same way a button is "a ghost button."

`data-angle="down"` is behavioral because the *value* drives a CSS custom property (skew direction and padding compensation math). The direction can vary per section.

`class="hero"` or `class="stats"` on `<section>` is identity — the section IS the hero, IS the stats block. It never becomes something else at runtime. CSS only.

---

### 1. Section Color Context

`data-mode` is a behavioral token override — it locks color context for a scope and can be flipped. A section's semantic type is its class:

```html
<section class="stats" data-mode="dark">
  <layout-center>
    ...
  </layout-center>
</section>
```

```css
@layer bundle-components {
  /* Identity: this section IS a stats block */
  section.stats {
    padding-block: var(--space-xl);
  }

  /* Behavior: overrides the color cascade — can be flipped by JS/theme */
  [data-mode="dark"] {
    --color-surface: var(--color-navy);
    --color-text:    var(--color-white);
  }
}
```

`section.stats` selects by identity. `[data-mode="dark"]` selects by behavioral state. Different concerns, different selectors — both on the same element.

### 2. Hero Background Bleed Technique

The hero is the section's identity — `class="hero"`. The `::before` pseudo-element is triggered by that class. `data-scrolled` on `<body>` is JS-toggled state:

```html
<section class="hero" data-mode="light">
  <layout-center>...</layout-center>
</section>
```

```css
@layer bundle-components {
  /* .hero is the section's identity */
  section.hero {
    position: relative;
    isolation: isolate;
  }

  section.hero::before {
    content: "";
    position: absolute;
    inset: calc(var(--site-header-height, 66px) * -1) 0 0;
    z-index: -1;
    overflow: hidden;
    background: var(--color-surface);
  }
}
```

The nav starts transparent; `data-scrolled` on `<body>` is set by a scroll observer — JS state that CSS reacts to:

```css
body > header > nav {
  background: transparent;
  transition: background var(--duration-fast) var(--ease-out);
}

/* [data-scrolled] is JS-written state */
[data-scrolled] body > header > nav {
  background: var(--color-surface);
}
```

### 3. Width Constraint: `<layout-center>`

`<section>` owns full-bleed background; `<layout-center>` owns max-width. `data-max` on the custom element is dimensional configuration — a sizing value, like `data-gap` on `layout-stack`. On custom elements, sizing and dimension are always `data-*` (they drive token values); classes are not used because the element name already carries the layout type:

```html
<section class="hero" data-mode="light">
  <layout-center data-max="wide">
    ...
  </layout-center>
</section>

<section class="prose">
  <layout-center data-max="prose">
    ...
  </layout-center>
</section>
```

```css
@layer bundle-components {
  layout-center {
    display: block;
    max-inline-size: var(--layout-max, 1280px);
    padding-inline: var(--space-md);
    margin-inline: auto;
  }

  layout-center[data-max="prose"]  { --layout-max: var(--measure-normal); }
  layout-center[data-max="narrow"] { --layout-max: 720px; }
}
```

### 4. Layout Intent vs. Numeric Column Spans

Stripe uses a **numeric 12-column grid** where layout intent is expressed as span counts (`span 7`, `span 5`). This is utility-grid thinking — generic counting, no semantic meaning, responsive requires rewriting span values at each breakpoint.

VB uses **named layout elements** that express intent directly:

| Layout intent | Stripe (numeric grid) | VB (named element) |
|---------------|----------------------|---------------------|
| Text left, graphic right | `span 7` + `span 5` | `<layout-sidebar data-side="right">` |
| Three equal cards | `span 4` × 3 | `<layout-grid data-cols="3">` |
| Stacks on mobile, side-by-side at ≥640px | media query + span rewrite | handled inside the layout element |
| Asymmetric hero grid | 12-col calc | `<layout-sidebar data-content="large">` |

```html
<!-- VB hero: text+graphic split -->
<layout-sidebar data-side="right" data-gap="l">
  <hgroup>
    <h1>The new standard</h1>
    <p>Accept payments...</p>
  </hgroup>
  <figure aria-hidden="true">
    <!-- graphic / animated-bg -->
  </figure>
</layout-sidebar>

<!-- VB feature cards: three equal columns -->
<layout-grid data-cols="3" data-gap="m">
  <article>...</article>
  <article>...</article>
  <article>...</article>
</layout-grid>
```

Responsive stacking is handled inside `layout-sidebar` and `layout-grid` via container queries — the author never writes a media query or recalculates column spans.

**What VB does take from Stripe's column system:**

The **gap rhythm** is worth adopting as tokens. Stripe uses 16px column gap / 40px row gap consistently. In VB terms:

```css
@layer bundle-tokens {
  :root {
    --gap-col: var(--size-md);   /* 16px — tight horizontal rhythm */
    --gap-row: var(--size-2xl);  /* 40px — generous vertical rhythm */
  }
}
```

**CSS subgrid** (used by stripe.dev) is the correct mechanism for cross-component column alignment — layout elements that participate in a page-level track system. VB layout elements should expose `display: subgrid` at Layer 4 for cases where precise track inheritance matters.

### 5. Animated Background Progressive Enhancement

Four-layer PE stack. The web component is Layer 4; the `<picture>` is Layer 2. The component wraps the picture in light DOM — if JS fails, the picture renders normally.

```html
<!-- Layer 2: static fallback, works with no JS -->
<animated-bg aria-hidden="true" data-src="wave-config.json">
  <picture>
    <source srcset="wave.webp" type="image/webp">
    <img src="wave.png" alt="">
  </picture>
</animated-bg>
```

No class on `<picture>` — it is the fallback content, not a variant. The component's `connectedCallback` checks both capabilities before activating:

```js
class AnimatedBg extends HTMLElement {
  connectedCallback() {
    const noMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const noWebGL  = !document.createElement('canvas').getContext('webgl2');
    if (noMotion || noWebGL) return; // <picture> remains, nothing to do
    this.dataset.ready = ''; // CSS hook: [data-ready] shows canvas
    this.#initCanvas();
  }
}
```

`data-ready` is the PE toggle — CSS uses `[data-ready]` to show the canvas and hide the picture. State lives in `data-*`, not a toggled class.

### 6. App Shell for Docs

`data-layout="app"` on `<body>` is a behavioral context declaration — like `data-mode`, it sets the page into an application layout mode that could in principle be switched. `<layout-sidebar>` is the Layer 4 custom element for the split. `data-sidebar="hidden"` is JS-toggled state on `<body>`. `data-sticky` on `<header>` is a behavior flag:

```html
<body data-layout="app">
  <header data-sticky>
    <nav>...</nav>
  </header>
  <layout-sidebar data-side="left">
    <nav aria-label="Section navigation">...</nav>
    <main>...</main>
  </layout-sidebar>
</body>
```

```css
@layer bundle-components {
  [data-layout="app"] {
    display: flex;
    flex-direction: column;
    min-block-size: 100dvh;
  }

  /* data-sticky is a behavior flag — this header sticks */
  [data-layout="app"] > header[data-sticky] {
    position: sticky;
    inset-block-start: 0;
    z-index: var(--z-overlay);
    block-size: var(--site-header-height, 64px);
    background: var(--color-surface);
    border-block-end: 1px solid var(--color-border);
  }

  [data-layout="app"] > layout-sidebar {
    flex: 1;
    overflow: hidden;
  }

  /* data-sidebar="hidden" is JS state on <body> — collapses the nav */
  [data-sidebar="hidden"] layout-sidebar > nav {
    display: none;
  }
}
```

### 7. Section Horizontal Rule Lines

Stripe uses `<span>` hairlines. VB uses `<hr>` — semantic thematic break, with `aria-hidden="true"` marking it decorative. `data-position` configures placement: the value ("top" / "bottom") drives an `inset` property, so this is dimension configuration, not identity:

```html
<section class="hero" data-mode="light">
  <hr aria-hidden="true" data-position="top">
  <layout-center>...</layout-center>
  <hr aria-hidden="true" data-position="bottom">
</section>
```

```css
@layer bundle-components {
  section > hr[data-position] {
    position: absolute;
    inset-inline: 0;
    border: none;
    border-block-start: 1px solid var(--color-border-subtle);
    margin: 0;
  }

  section > hr[data-position="top"]    { inset-block-start: var(--site-header-height); }
  section > hr[data-position="bottom"] { inset-block-end: 0; }
}
```

Selector is `hr[data-position]` — element type plus attribute value. The `hr` IS the rule; `data-position` tells it where to sit.

---

## Key Takeaways

1. **Transparent nav + `section.hero::before` bleed** is the right immersive hero pattern. `class="hero"` is the section's identity; the bleed is pure CSS on the `::before`.
2. **`<section>` identity is a class; its state and configuration are `data-*`.** `class="stats"` names the section type; `data-mode="dark"` overrides its color cascade (behavioral); `data-angle="down"` drives a transform value (configurational).
3. **Dimension and sizing on custom elements are `data-*`.** `data-max`, `data-gap`, `data-cols`, `data-side` — these drive token values. The element name carries the layout type; `data-*` configures the dimension.
4. **VB replaces numeric column spans with named layout elements.** `<layout-sidebar>` expresses intent; `span 7` expresses counting. The gap rhythm is worth inheriting as tokens.
5. **Animated backgrounds follow 4-layer PE**: background-color → `<picture>` → CSS animation → WebGL canvas. `data-ready` is JS-written state; the element name (`animated-bg`) carries the component identity.
6. **App shell for docs**: `data-layout="app"` on `<body>` scopes context (behavioral); `<layout-sidebar>` handles the split (Layer 4 element); `data-sidebar="hidden"` is JS-toggled state.
7. **H1 weight 300** — the graphic environment carries the visual weight; the type provides clarity.

---

## Site Variation Analysis

Beyond the homepage and docs, four distinct page types reveal Stripe's full layout vocabulary.

### Blog Post — stripe.com/blog

**Structure:**

```
article.BlogPost.Section--hasStickyNav
  └── div.Section__masked
        ├── div.Section__backgroundMask
        │     └── div.Section__background   ← colored bg layer
        └── div.Section__container
              └── div.Section__layoutContainer
                    ├── div.BlogPost__hero (display: grid, 2-col at 800px)
                    │     ├── div.BlogPost__title
                    │     ├── div.BlogPost__meta  (flex)
                    │     └── div.BlogPost__authorList
                    └── div.BlogPost__body (max-width: 768px, display: grid)
                          ├── p.BlogBodyParagraph
                          ├── figure.BlogBodyImage.BlogBodyImage--sizeLarge
                          └── ...
```

**Reading width:** `max-width: 768px` on `.BlogPost__body` — a deliberate prose measure. At 18px font size with 28px line-height, this is close to the classic 65–75 character optimal line length.

**Prose typography:**

| Element | Size | Line-height | Notes |
|---------|------|-------------|-------|
| `BlogBodyParagraph` | 18px | 28px (1.56) | Generous leading for long-form reading |
| Hero title H | ~48px | — | Scales via 2-col hero grid |

The `BlogBodyImage--sizeLarge` figure uses the same 2-column grid (`384px 384px`) as the hero, allowing full-width images to break the prose column and span the layout — without any negative margin hacks.

**Related content cards (`Guides__container`):** `display: grid; grid-template-columns: 384px 384px` — two equal-width card columns with flat card style (`border-radius: 0px`). Deliberately unfussy.

**`Section--hasStickyNav`:** A modifier class that flags a section as containing a sticky sub-navigation. The sticky nav appears on long-form content for in-page jump links. The section owns the sticky behavior as a layout variant — clean separation.

**`Section__backgroundMask` + `Section__background` split:** The background div is wrapped in a mask. This two-layer approach enables:
- The background to be clipped within the mask bounds
- The mask to overflow the section container for bleed effects
- The background to be independently transformed (skewY) without affecting content

---

### Use Cases — stripe.com/use-cases/agentic-commerce

**The angle/skew system — the key architectural find:**

```css
/* Root section — content untouched */
.Section {
  position: relative;
  overflow: visible;
}

/* Background div takes all visual transforms */
.Section__background {
  position: relative;
  height: 100%;
  transform-origin: var(--sectionTransformOrigin);
  transform: skewY(var(--sectionAngle));  /* ← THE TRICK */
  background: var(--backgroundColor);
  overflow: hidden;
}
```

The **content stays orthogonal, only the background div is skewed**. This is architecturally clean — transforms on content cause subpixel text rendering artifacts and break sticky positioning. Transforming only the decorative background layer avoids both.

**Angle token system via CSS custom properties:**

```css
.Section {
  --sectionAngle: 0;                        /* default: flat */
  --sectionAngleSin: var(--angleNormalSin); /* used to compute extra padding */
}

.Section--angleBottom { /* sets --sectionAngle on the next sibling too */ }
.UseCasesHero.Section {
  --sectionAngle: var(--angleStrong);       /* steep angle on hero exit */
  --sectionAngleSin: var(--angleStrongSin);
}

/* Pairing rule: hero's bottom angle matches the following section's top angle */
.UseCasesHero.Section + .Section {
  --sectionAngle: var(--angleStrong);
}
```

The sin of the angle is stored as a token and used to calculate the extra vertical padding the angled corner consumes — so content never overlaps the slant. Fluid, mathematical, zero magic numbers.

**Padding token system (fluid typography pattern):**

```css
.Section {
  --sectionPaddingTop: calc(
    var(--sectionPaddingMin)*1px +
    (var(--sectionPaddingTopMax) - var(--sectionPaddingMin)) *
    (var(--windowWidth)/737 - 0.50882px)
  );
}
/* Clamped at breakpoints: ≤375px uses min, ≥1112px uses max */
```

`--windowWidth` is set by JS on `<html>` and mirrors `100vw` without the scrollbar issue. This is Stripe's custom implementation of `clamp()` — written before `clamp()` had universal support, but the pattern is directly translatable to modern `clamp()`.

**Section padding size variants:**

| Class | Purpose |
|-------|---------|
| `Section--paddingNormal` | Standard vertical spacing |
| `Section--paddingSmall` | Tighter sections (mid-page) |
| `Section--paddingXSmall` | Minimal spacing (transition sections) |
| `Section--paddingBottomNone` | When next section bleeds in |
| `Section--paddingTopNone` | When section bleeds from above |

**Multi-axis theme modifiers:**

The footer class: `theme--Light flavor--Chroma accent--Slate`. Three separate axes:

- **`theme--`** — light/dark/white/transparent base
- **`flavor--`** — design personality (Chroma = Stripe's colorful gradient brand identity)
- **`accent--`** — specific color accent (Slate, Blue, etc.)

This is a far more expressive system than a single theme token. It allows independent control of background, decorative treatment, and accent color.

**H1 on use-case pages:** 48px / weight 500 — heavier than the homepage hero (weight 300) because there's less graphic density to provide visual contrast.

---

### Startups Hub — stripe.com/startups

**`ColumnLayout` / `RowLayout` primitive system:**

Rather than raw grid everywhere, Stripe abstracts named layout primitives:

```html
<div class="ColumnLayout ColumnLayout--alignCenter StartupHubHero__layout">
  <div class="RowLayout StartupHubHero__copyRow">
    <div class="Copy variant--Superhero">
      <div class="Copy__header">
        <!-- h1, subhead, CTAs -->
      </div>
    </div>
  </div>
</div>
```

`ColumnLayout` is `display: grid` oriented vertically; `RowLayout` is a horizontal row sub-component. These are semantic, composable layout atoms — the content variant (`variant--Superhero`) is applied to the `Copy` component, not the layout container.

**Superhero variant typography:** H1 at **66.25px / weight 425 / line-height 68.9px (1.04)** — an ultra-tight line-height near 1:1. This only works for short (1–4 word) hero headlines. At this scale the type *is* the visual.

**`AccentedCard`:**

```css
.AccentedCard {
  border-radius: 6px;
  padding: 30px 20px 16px;
  /* box-shadow: none at base, variants add shadow */
}
.AccentedCard--shadowMedium { box-shadow: ...; }
.AccentedCard--noHover { /* disables hover state */ }
```

The `--noHover` modifier is interesting — it makes the card semantically a card (rounded, padded, bordered) without interactive affordances. Used for info/feature display, not navigation.

**`Section--bleed3`:** A section modifier that allows its visual content to bleed outside the section boundary by a fixed amount (3 units, presumably `3 × --space-unit`). Used for the dashboard screenshot that overflows its section bottom into the next section — a deliberate depth effect.

**`theme--Transparent`** on the stats section: the stats float over the section above's background, creating a layered depth effect without any z-index juggling. The section is transparent; the visual is provided by the containing context.

---

### Developer Hub — stripe.dev

This is a Next.js site with CSS Modules (hashed class names), but the architectural patterns are clear.

**Page-level background:** `rgb(232, 232, 232)` — a warm medium gray as the base canvas. Not white. This creates an implicit "card on surface" depth model: white/light-colored content panels read as elevated above the gray base without needing shadows.

**Fixed nav, 49px:** Shorter than the marketing site's 66px — developer audiences prefer more content above the fold. `position: fixed`, transparent background (relies on content scroll beneath to provide context).

**CSS Subgrid architecture — full document grid:**

```css
/* Root layout grid — 15 columns */
.GridLayout {
  display: grid;
  grid-template-columns: repeat(15, ~46.9px);
  gap: 0 0; /* no column gap; columns are tight, spacing managed by content */
  padding: 0 12px;
}

/* Every section spans the full grid and inherits column tracks */
.section {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid; /* ← CSS subgrid */
}

/* Components inside sections also subgrid */
.FeaturedPostsSection__column {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
}
```

**This is the most modern layout pattern on the site.** CSS subgrid means a card deep inside the hierarchy can align to the document's root column tracks without any knowledge of its ancestors' widths. Zero magic numbers, zero `calc()` gymnastics.

Sections are named semantically by their content role: `FeaturedPostsSection`, `StatisticsSection`, `FeedSection`, `GetHelpSection`, `RouterSection`, `Footer`. Each is a full-bleed grid participant.

**Contrast with docs.stripe.com:** The docs site uses Stripe's "Sail" React component library; stripe.dev uses vanilla Next.js with CSS Modules. Two completely different stacks, similar visual outcomes — reinforcing that the *layout patterns* are framework-agnostic.

---

## Extended VB Generalizations

Additional patterns from the site variations.

### 8. Reading Width via Semantic Elements

Stripe constrains prose to `max-width: 768px`. In VB, `<article>` is the reading context. `data-measure` is dimensional configuration — the same pattern as `data-gap` on `layout-stack`. A section containing an article is identified by class. `data-bleed` on `<figure>` is a behavior flag (this element escapes its container):

```html
<section class="prose">
  <layout-center>
    <article data-measure="normal">
      <p>...</p>
      <figure data-bleed><!-- escapes prose measure to full section width --></figure>
      <p>...</p>
    </article>
  </layout-center>
</section>
```

```css
@layer bundle-components {
  /* data-measure: dimensional config — drives a size token */
  article[data-measure] {
    max-inline-size: var(--measure-normal, 68ch);
    margin-inline: auto;
  }
  article[data-measure="narrow"] { --measure-normal: 55ch; }

  /* data-bleed: behavior flag — this element escapes its measure constraint */
  article[data-measure] figure[data-bleed] {
    max-inline-size: 100vw;
    margin-inline: calc(50% - 50vw);
  }
}
```

`data-measure` configures a dimension. `data-bleed` triggers a behavior. Same `data-*` mechanism, two purposes — neither is a stable visual identity that would warrant a class.

### 9. Angled Section Transitions via `::before` skewY

The background-only skew — no extra markup. A `::before` pseudo-element on `<section>` takes the transform; content is never touched:

```html
<section data-mode="light" data-angle="down">
  <layout-center>...</layout-center>
</section>

<section data-mode="dark" data-angle="up">
  <layout-center>...</layout-center>
</section>
```

```css
@layer bundle-tokens {
  :root {
    --angle-normal:     -3deg;
    --angle-strong:     -5deg;
    --angle-normal-sin: 0.052; /* sin(3°) — for padding compensation */
  }
}

@layer bundle-components {
  section[data-angle] {
    position: relative;
    isolation: isolate;
    overflow: visible;
  }

  section[data-angle]::before {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--color-surface);
    overflow: hidden;
    z-index: -1;
  }

  section[data-angle="down"]::before {
    transform-origin: bottom right;
    transform: skewY(var(--angle-normal));
  }

  section[data-angle="up"]::before {
    transform-origin: top right;
    transform: skewY(calc(var(--angle-normal) * -1));
  }

  /* Compensate block-start padding for the slant's vertical incursion */
  section[data-angle="down"] {
    padding-block-start: calc(
      var(--section-padding-normal) + 100vw * var(--angle-normal-sin)
    );
  }
}
```

`data-angle` on each `<section>` tells its own pseudo-element what to do. Adjacent sections pair `down` + `up` for a seamless transition — no sibling selectors, no JS.

### 10. Multi-Axis Section Modifiers

Stripe's `theme--Light flavor--Chroma accent--Slate` maps to three `data-*` attributes. All three are correctly `data-*` — not because they're BEM replacements, but because each one drives a CSS custom property value that can be swapped by a theme system at runtime:

- `data-mode` — behavioral token override; a theme switcher can flip light ↔ dark
- `data-flavor` — drives the `::before` background; the active theme can override it
- `data-accent` — sets `--color-accent`; overridden per-theme or per-brand

None of these is "what type of element is this" — all three are "how is this element currently configured." A `<footer>` is still a `<footer>` regardless of flavor. A `<section class="stats">` IS a stats section regardless of any of these axes:

```html
<footer data-mode="light" data-flavor="gradient" data-accent="teal">
  <layout-center>...</layout-center>
</footer>
```

```css
@layer bundle-components {
  /* Mode: surface + text token values — flippable by JS */
  [data-mode="dark"]        { --color-surface: var(--color-navy); --color-text: var(--color-white); }
  [data-mode="transparent"] { --color-surface: transparent; }

  /* Flavor: decorative ::before background — theme-configurable */
  [data-flavor="gradient"]::before { background: var(--gradient-brand); }
  [data-flavor="solid"]::before    { background: var(--color-surface); }

  /* Accent: highlights, interactive elements, icons — per-brand override */
  [data-accent="teal"]   { --color-accent: var(--color-teal-500); }
  [data-accent="indigo"] { --color-accent: var(--color-indigo-500); }
}
```

### 11. Fluid Section Padding via `clamp()`

Stripe's JS-driven `--windowWidth` fluid padding translates to `clamp()`. Three named sizes on `<section>` via `data-padding`:

```css
@layer bundle-tokens {
  :root {
    --section-padding-normal: clamp(72px, 5vw + 40px, 140px);
    --section-padding-small:  clamp(48px, 3vw + 30px, 110px);
    --section-padding-xsmall: clamp(32px, 2vw + 20px,  72px);
  }
}

@layer bundle-components {
  section                          { padding-block: var(--section-padding-normal); }
  section[data-padding="small"]    { padding-block: var(--section-padding-small); }
  section[data-padding="xsmall"]   { padding-block: var(--section-padding-xsmall); }
  section[data-padding="none"]     { padding-block: 0; }
  section[data-padding-end="none"] { padding-block-end: 0; }
  section[data-padding-start="none"] { padding-block-start: 0; }
}
```

Normal is the default — no attribute needed. `data-padding-end` and `data-padding-start` handle the single-edge nulling case without affecting the overall padding variant.

### 12. Named Grid Tracks for Document-Wide Alignment

The key lesson from stripe.dev's CSS subgrid is **named grid lines**, not a numeric column count. The document grid is `<main>`'s identity in this layout context — it IS a doc layout — so it gets a class. `data-bleed` on child elements remains behavioral:

```html
<main class="doc">
  <h1>Post title</h1>
  <p>Prose stays in the content column.</p>
  <figure data-bleed><!-- escapes to full width --></figure>
  <p>Prose resumes.</p>
</main>
```

```css
@layer bundle-components {
  /* main.doc is this element's layout identity */
  main.doc {
    display: grid;
    grid-template-columns:
      [full-start]
      minmax(0, 1fr)
      [content-start]
      min(720px, 100%)
      [content-end]
      minmax(0, 1fr)
      [full-end];
  }

  main.doc > * {
    grid-column: content;
  }

  /* data-bleed is a behavior flag — escapes to full tracks */
  main.doc > [data-bleed] {
    grid-column: full;
  }
}
```

`main.doc` declares identity (class). `data-bleed` declares behavior. Named lines (`content`, `full`) survive any responsive reflow — no numeric recalculation, no span utilities.

### 13. Section Continuity via Targeted Edge Attributes

Adjacent sections sharing a component visually across their boundary need a single-edge padding null — one attribute per edge:

```html
<section data-mode="light" data-padding-end="none">
  <layout-center>
    <figure data-bleed><!-- overflows section bottom --></figure>
  </layout-center>
</section>

<section data-mode="dark" data-padding-start="none">
  <layout-center>...</layout-center>
</section>
```

These are not variants of the section's padding size — they're targeted edge overrides. Separate attribute, separate concern.

---

## Extended Key Takeaways

8. **Skew the `::before`, never the content.** No extra markup. `isolation: isolate` on the section prevents z-index bleed. `data-angle` is correctly `data-*` because its value drives a CSS token.
9. **Multi-axis theming via `data-*` is justified when the axis is configurable at runtime.** `data-mode`, `data-flavor`, and `data-accent` can all be swapped by a theme switcher — they're not static visual identities.
10. **Dimension and sizing are `data-*`; layout identity is a class.** `data-measure` configures a size (like `data-gap`). `main.doc` IS a doc layout. The test: would a theme or JS ever change it? If yes → `data-*`. If it's what the element IS → class.
11. **Named grid lines, not numeric spans.** `main.doc` with `[content]` and `[full]` named lines. `data-bleed` on `<figure>` opts out — behavior, not identity.
12. **Body background isn't always white.** A warm gray canvas creates implicit surface elevation. White content reads as raised without shadows. Consider a `data-surface` token axis for docs/app contexts.
13. **H1 weight is contextual, not a brand constant.** Weight 300 in graphic-heavy contexts, 500 in standard marketing, 700 in utility/docs. VB themes should expose `--font-weight-display` as a per-context variable.

## Related

- [VB Bundle System](./BUNDLE-SYSTEM.md)
- [VB AI Native Infrastructure](./VB-AI-NATIVE.md)
- [Super2026 Theme](./super2026-theme.html)