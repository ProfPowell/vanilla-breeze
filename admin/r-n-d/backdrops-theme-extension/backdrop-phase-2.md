---
title: Living Themes — Transparent Surfaces, Scoped Inheritance, and Environmental Awareness
description: Extending Vanilla Breeze themes beyond static appearance into dynamic, contextual, and environmental design that breathes personality into sites and apps
author: Thomas
date: 2026-03-03
tags:
  - vanilla-breeze
  - themes
  - backdrop
  - environment
  - seasonal
  - sub-surface
status: exploration
---

# Living Themes — Transparent Surfaces, Scoped Inheritance, and Environmental Awareness

An exploration of what happens when themes stop being static palettes and become dynamic, responsive, and alive — reacting to layout structure, context, time, place, weather, and the identity of the organisation behind the design.

## Table of Contents

- [The Core Insight](#the-core-insight)
- [Transparent Grid Regions — The See-Through Surface](#transparent-grid-regions--the-see-through-surface)
- [Sub-Surfaces — Layers All the Way Down](#sub-surfaces--layers-all-the-way-down)
- [Scoped Theme Inheritance](#scoped-theme-inheritance)
- [Environmental Awareness — Time, Place, and Atmosphere](#environmental-awareness--time-place-and-atmosphere)
- [Seasonal and Event Theming](#seasonal-and-event-theming)
- [The Google Doodle Pattern](#the-google-doodle-pattern)
- [Theme as Brand System](#theme-as-brand-system)
- [Theme Testing and the Design-Is-The-Theme Demo](#theme-testing-and-the-design-is-the-theme-demo)
- [Architecture Implications](#architecture-implications)
- [Implementation Roadmap](#implementation-roadmap)

---

## The Core Insight

A theme in most frameworks is a colour palette bolted onto a set of components. That is the wrong level of abstraction. A theme should be a **total sensory environment** — it controls not just colour and type, but the physical metaphor of the surface, how that surface reacts to context, and what the world feels like behind and around the content.

This document explores what it looks like to push that idea to its logical extreme: themes that breathe, that know what season it is, that know you are viewing them from a university campus or a corporate office, and that allow an organisation to express deep identity not through one-off CSS hacks but through the design system's own vocabulary.

The four expanding circles of theme scope:

```
┌──────────────────────────────────────────────────────────┐
│  ENVIRONMENT  (time, place, weather, seasonal event)      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  BRAND  (organisation identity, campaign, doodle)   │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  PAGE / SECTION  (scoped theme inheritance)   │  │  │
│  │  │  ┌────────────────────────────────────────┐  │  │  │
│  │  │  │  SURFACE  (transparent gaps, layers)   │  │  │  │
│  │  │  └────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

Each circle is independently controllable but inherits from the one above it. Each one is a design lever, not a hard-coded value.

---

## Transparent Grid Regions — The See-Through Surface

The backdrop spec established the canvas as a solid sheet floating above an environment. The next move is to **puncture that sheet** — to let the backdrop show through the gaps in the layout grid, between cards, between header and main, between any region and its neighbour.

### The Holy Grail As A Windowed Layout

The classic holy grail layout gains a completely different character when its grid regions are treated as floating islands above the backdrop rather than a seamless filled page:

```
┌──────────────────────────────────────┐  ← backdrop (environment)
│  ░░░ GAP ░░░                         │  ← backdrop visible through gap
│  ┌────────────────────────────────┐  │
│  │  HEADER                        │  │  ← opaque or translucent surface
│  └────────────────────────────────┘  │
│  ░░░ GAP ░░░                         │
│  ┌──────┐  ░░░  ┌────────────────┐  │
│  │ SIDE │       │  MAIN          │  │  ← sidebar and main float separately
│  │      │       │                │  │
│  └──────┘  ░░░  └────────────────┘  │
│  ░░░ GAP ░░░                         │
│  ┌────────────────────────────────┐  │
│  │  FOOTER                        │  │
│  └────────────────────────────────┘  │
│  ░░░ GAP ░░░                         │
└──────────────────────────────────────┘
```

This is achieved by removing the canvas as a single solid container and instead making each **grid region its own elevated surface**.

### Implementation

```css
/* Each layout region is its own floating surface */
.vb-layout-region {
  background: var(--vb-surface-bg, oklch(98% 0 0));
  border-radius: var(--vb-surface-radius, 12px);
  box-shadow: var(--vb-surface-shadow);
  backdrop-filter: var(--vb-surface-filter, none);
}

/* The page grid itself is transparent — backdrop shows through gaps */
vb-canvas[data-layout-mode="windowed"] {
  background: transparent;
  box-shadow: none;
  display: grid;
  gap: var(--vb-layout-gap, 1.5rem);
  padding: var(--vb-layout-padding, 1.5rem);
}
```

### Card Lists With Gap Breathing

A card list is a perfect candidate. Each card is a surface; the space between cards exposes the backdrop. With an animated backdrop behind, the gaps become alive — the shimmer or drift plays through the windows between cards.

```html
<vb-backdrop data-animation="shimmer">
  <vb-canvas data-layout-mode="windowed">
    <ul class="vb-card-list" data-gap-breathing="true">
      <li class="vb-card">...</li>
      <li class="vb-card">...</li>
      <li class="vb-card">...</li>
    </ul>
  </vb-canvas>
</vb-backdrop>
```

```css
.vb-card-list[data-gap-breathing="true"] {
  display: grid;
  gap: var(--vb-card-gap, 1.25rem);
  background: transparent; /* list itself is see-through */
}

.vb-card {
  background: var(--vb-card-bg);
  border-radius: var(--vb-card-radius);
  box-shadow: var(--vb-card-shadow);
  /* each card is its own opaque or semi-opaque island */
}
```

### Transparency Spectrum

Region surfaces are not binary (opaque vs. transparent). They sit on a spectrum, and themes control where each region type lands:

| Surface Type | CSS | Visual Effect |
|-------------|-----|---------------|
| `solid` | `background: var(--vb-surface-bg)` | No backdrop visible |
| `frosted` | `background: oklch(98% 0 0 / 0.8)` + `backdrop-filter: blur(16px)` | Blurred backdrop bleed |
| `tinted` | `background: oklch(from var(--vb-accent) l c h / 0.15)` | Colour-tinted glass |
| `ghost` | `background: oklch(98% 0 0 / 0.05)` + thin border | Nearly invisible, structural only |
| `transparent` | `background: transparent` | Full backdrop passthrough |

```css
[data-surface="frosted"] {
  background: oklch(98% 0 0 / 0.75);
  backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid oklch(1 0 0 / 0.1);
}

[data-surface="tinted"] {
  background: oklch(from var(--vb-accent) l c h / 0.12);
  backdrop-filter: blur(8px);
}
```

---

## Sub-Surfaces — Layers All the Way Down

The backdrop spec has one backdrop behind one canvas. Living themes support **nested surface layers**: a page backdrop, a section backdrop within that, a card backdrop within that — each with its own opacity, blur, and colour treatment.

### The Layer Stack

```
LEVEL 0  →  Page backdrop  (animated environment)
LEVEL 1  →  Canvas / grid regions  (frosted glass, solid, windowed)
LEVEL 2  →  Section backdrop  (e.g. a hero zone, a feature strip)
LEVEL 3  →  Component backdrop  (card, sidebar, modal)
LEVEL 4  →  Element backdrop  (highlighted text block, inline callout)
```

Each level inherits the visual context of the level above — its colour, its animation, its blur — and can override any property locally.

### Scoped `<vb-backdrop>` Inside a Section

`<vb-backdrop>` is not restricted to the page root. It can wrap any section:

```html
<section>
  <vb-backdrop data-backdrop-type="gradient"
               data-backdrop-start="oklch(30% 0.15 280)"
               data-backdrop-end="oklch(20% 0.08 260)"
               data-canvas-effect="faded"
               data-scope="section">
    <div class="feature-grid">
      <vb-card>...</vb-card>
      <vb-card>...</vb-card>
    </div>
  </vb-backdrop>
</section>
```

When `data-scope="section"`, the backdrop uses `position: absolute` within its parent rather than `position: fixed`, and the contained cards become frosted windows into that local gradient — not the page-level environment.

```css
vb-backdrop[data-scope="section"] {
  position: absolute; /* local, not viewport-filling */
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
}
```

### Visual Depth Cueing

Deep surface nesting should feel physically coherent. A design rule of thumb: each layer should be slightly lighter (in dark themes) or slightly darker (in light themes) than the layer above it, creating a sense of genuine depth.

```css
:root {
  --vb-depth-step: 4%; /* lightness shift per layer */
}

[data-depth="1"] { --vb-surface-lightness: calc(var(--vb-base-l) + var(--vb-depth-step)); }
[data-depth="2"] { --vb-surface-lightness: calc(var(--vb-base-l) + calc(var(--vb-depth-step) * 2)); }
[data-depth="3"] { --vb-surface-lightness: calc(var(--vb-base-l) + calc(var(--vb-depth-step) * 3)); }
```

---

## Scoped Theme Inheritance

A page belongs to a theme. A section within that page can override that theme — partially or wholly. This is the CSS cascade working as intended, finally applied deliberately.

### Partial Override — The Colour Coding Pattern

A common pattern in educational content: sections coded by topic or difficulty level. Rather than a completely different theme, a section inherits the parent theme but shifts its accent colour and perhaps its surface tint.

```html
<!-- Whole page is "lecture" theme -->
<body data-theme="lecture">

  <!-- Introduction section — default theme -->
  <section>
    <h2>Introduction</h2>
    ...
  </section>

  <!-- Core concepts — accent shifted to amber, "warning" tone -->
  <section data-theme-accent="amber" data-theme-surface="tinted">
    <h2>Core Concepts</h2>
    ...
  </section>

  <!-- Advanced content — accent shifted to red, elevated surface -->
  <section data-theme-accent="crimson" data-theme-surface="solid">
    <h2>Advanced Topics</h2>
    ...
  </section>

  <!-- Exercise section — green accent, ghost surface -->
  <section data-theme-accent="forest" data-theme-surface="ghost">
    <h2>Exercises</h2>
    ...
  </section>

</body>
```

```css
/* Accent overrides cascade locally */
[data-theme-accent="amber"]  { --vb-accent: oklch(75% 0.18 80); }
[data-theme-accent="crimson"] { --vb-accent: oklch(55% 0.22 25); }
[data-theme-accent="forest"]  { --vb-accent: oklch(55% 0.15 145); }
```

The rest of the theme — type scale, spacing, border radius, shadow model — is inherited unchanged. The colour shift is the signal.

### Full Section Theme Override

For more dramatic breaks — a dark hero on a light-theme page, a brand moment within editorial content — a section can declare a full theme switch:

```html
<section data-theme="midnight">
  <!-- Entirely different theme environment inside this section -->
  <vb-backdrop data-scope="section" data-animation="shimmer">
    <h2>Featured Project</h2>
    ...
  </vb-backdrop>
</section>
```

Because themes are just `[data-theme]` CSS scopes, the cascade handles this automatically — no JavaScript required. The section becomes its own isolated design environment.

### Theme Composition Rules

| Scope | Mechanism | Inherits From |
|-------|-----------|---------------|
| Root theme | `[data-theme]` on `<html>` or `<body>` | Browser defaults |
| Page override | `[data-theme]` on `<main>` or `<article>` | Root theme |
| Section override | `[data-theme]` or `[data-theme-accent]` on `<section>` | Nearest ancestor theme |
| Component override | `data-theme-*` attributes | Nearest ancestor theme |

The key constraint: **every override must be expressible as a change to CSS custom properties**. No override requires new CSS rules — only new property values. This is what makes themes composable rather than fragile.

---

## Environmental Awareness — Time, Place, and Atmosphere

This is where themes become genuinely alive. Rather than a static palette, a theme can register **environmental modifiers** that shift its appearance based on signals from the real world.

### Signal Sources

| Signal | API / Source | Example Use |
|--------|-------------|-------------|
| Time of day | `Date` | Dawn palette, noon brightness, evening warmth, night depth |
| Season | `Date` (hemisphere-aware) | Winter blues, autumn amber, spring green, summer gold |
| Weather | OpenWeatherMap (server proxy) | Overcast desaturates palette; rain adds cool tones |
| Geolocation | `navigator.geolocation` | Latitude shifts sky colour; local sunrise/sunset time |
| Ambient light | `AmbientLightSensor` API | Dim screen automatically in dark environments |
| System color scheme | `prefers-color-scheme` | Dark/light base |
| Battery | `navigator.getBattery()` | Disable animations when battery is low |

### Time-of-Day Palette Shifts

The most impactful and cheapest to implement. A theme defines keyframes of colour states across the day, and the `VbEnvironment` service interpolates between them using `@property`.

```css
@property --vb-env-sky-hue {
  syntax: '<angle>';
  inherits: true;
  initial-value: 220deg;
}

@property --vb-env-sky-lightness {
  syntax: '<percentage>';
  inherits: true;
  initial-value: 12%;
}

[data-theme="aurora"] {
  /* These are overridden at runtime by VbEnvironment */
  --vb-backdrop-start: oklch(
    var(--vb-env-sky-lightness)
    0.08
    var(--vb-env-sky-hue)
  );
}
```

```javascript
class VbEnvironment {
  // Called once on load, then every 10 minutes
  static apply() {
    const hour = new Date().getHours();
    const { hue, lightness, chroma } = this.#skyAt(hour);

    document.documentElement.style.setProperty('--vb-env-sky-hue', `${hue}deg`);
    document.documentElement.style.setProperty('--vb-env-sky-lightness', `${lightness}%`);
    document.documentElement.style.setProperty('--vb-env-sky-chroma', chroma);
  }

  static #skyAt(hour) {
    // 24-point colour table covering dawn, day, dusk, night
    const keyframes = [
      { hour: 0,  hue: 240, lightness: 8,  chroma: 0.04 },  // midnight
      { hour: 5,  hue: 260, lightness: 10, chroma: 0.06 },  // pre-dawn
      { hour: 6,  hue: 30,  lightness: 45, chroma: 0.15 },  // golden hour
      { hour: 8,  hue: 210, lightness: 70, chroma: 0.08 },  // morning
      { hour: 12, hue: 220, lightness: 80, chroma: 0.06 },  // noon
      { hour: 17, hue: 45,  lightness: 65, chroma: 0.16 },  // golden hour PM
      { hour: 19, hue: 20,  lightness: 40, chroma: 0.18 },  // sunset
      { hour: 21, hue: 240, lightness: 20, chroma: 0.08 },  // evening
      { hour: 23, hue: 240, lightness: 10, chroma: 0.05 },  // late night
    ];
    return interpolate(keyframes, hour);
  }
}
```

Because the values land in CSS custom properties, the transition between states uses CSS `transition` — no JavaScript animation loop needed.

```css
:root {
  transition:
    --vb-env-sky-hue 5s ease,
    --vb-env-sky-lightness 5s ease;
}
```

### Weather Atmosphere

Weather data (fetched server-side to protect the API key) modulates the theme with atmospheric qualities:

| Condition | Effect |
|-----------|--------|
| Clear | No modification — theme plays normally |
| Overcast | Desaturate backdrop chroma by 40%, reduce contrast |
| Rain | Shift hue toward cool blue-grey; add `rain` backdrop animation |
| Snow | Shift to near-white backdrop; add `snow` particle animation |
| Fog | Heavy blur on backdrop image; reduce canvas shadow depth |
| Storm | High contrast, dramatic shadows, fast shimmer |

```css
[data-weather="rain"] {
  --vb-env-chroma-modifier: 0.6;  /* desaturate */
  --vb-env-lightness-modifier: -5%;  /* slightly darker */
  --vb-backdrop-animation: rain;
}

[data-weather="snow"] {
  --vb-env-chroma-modifier: 0.2;
  --vb-backdrop-animation: snow;
}
```

The `rain` and `snow` animations use CSS `@property`-animated particle systems layered as a pseudo-element above the backdrop image.

### The Vision Pro Effect — Without The 5K

The Apple Vision Pro's immersive environments work because they put you inside a space that has atmospheric qualities: light direction, ambient colour, a sense of place. We can approximate this with four cheap ingredients:

1. **Ambient hue** — backdrop colour shifted to match a "space" (forest = green-shifted, ocean = blue, desert = warm amber)
2. **Light direction** — a subtle gradient on surface backgrounds simulating overhead light vs. oblique evening light, driven by time of day
3. **Atmospheric depth** — distant "layer" of the backdrop slightly more blurred and desaturated than the near layer, mimicking atmospheric perspective
4. **Motion parallax** — backdrop scrolls at 0.1× the canvas scroll rate (`background-attachment: fixed` with `background-position` updated via scroll handler) creating physical depth

```css
/* Atmospheric depth: two-layer backdrop */
vb-backdrop[data-scope="page"]::before {
  /* Far layer — more blurred, lower saturation */
  content: '';
  position: absolute;
  inset: 0;
  background: inherit;
  filter: blur(60px) saturate(50%);
  transform: scale(1.1);
  opacity: 0.5;
}

/* Near layer is the normal backdrop — sharper, richer */
```

```javascript
// Parallax: backdrop moves at 10% of scroll
window.addEventListener('scroll', () => {
  const offset = window.scrollY * 0.1;
  document.querySelector('vb-backdrop').style
    .setProperty('--vb-parallax-offset', `${offset}px`);
}, { passive: true });
```

```css
vb-backdrop {
  background-position: center calc(50% + var(--vb-parallax-offset, 0px));
}
```

---

## Seasonal and Event Theming

Themes can declare a calendar of **seasonal modifiers** — lightweight overlays that activate automatically within a date range and then silently deactivate. No manual toggling, no code deployments.

### Season Definition in Theme JSON

```json
{
  "name": "brand-standard",
  "seasonal": [
    {
      "id": "winter",
      "months": [12, 1, 2],
      "hemisphere": "northern",
      "backdrop": {
        "animation": "snow",
        "start": "oklch(85% 0.03 240)",
        "end": "oklch(92% 0.01 220)"
      },
      "accent": "oklch(55% 0.18 240)"
    },
    {
      "id": "autumn",
      "months": [9, 10, 11],
      "backdrop": {
        "animation": "drift",
        "start": "oklch(55% 0.15 60)",
        "end": "oklch(35% 0.18 40)"
      },
      "accent": "oklch(65% 0.2 55)"
    },
    {
      "id": "spring",
      "months": [3, 4, 5],
      "backdrop": {
        "animation": "pulse",
        "start": "oklch(75% 0.1 130)",
        "end": "oklch(85% 0.06 150)"
      }
    }
  ]
}
```

### Event Windows

Events are date-ranged theme moments — broader than a seasonal shift, more targeted than a full theme swap:

```json
{
  "events": [
    {
      "id": "new-year",
      "from": "01-01",
      "to": "01-07",
      "backdrop": { "animation": "confetti" },
      "hero": "/assets/events/new-year-hero.svg"
    },
    {
      "id": "end-of-semester",
      "from": "05-01",
      "to": "05-15",
      "accent": "oklch(65% 0.2 145)",
      "motd": "Finals season — good luck!"
    }
  ]
}
```

`VbEnvironment` evaluates events on load, applies the matching modifier as a `data-event` attribute on `<html>`, and the CSS cascade does the rest.

---

## The Google Doodle Pattern

An organisation should be able to inject a **themed hero moment** — a special illustration, backdrop, or animation — for a day, a week, or a season, without editing theme CSS or redeploying.

This is the Google Doodle pattern applied to design systems: the brand stays consistent, but a prominent element expresses personality and timeliness.

### The `<vb-hero-moment>` Element

```html
<!-- Rendered by the theme system when an active event defines a hero -->
<vb-hero-moment
  data-event="graduation-2026"
  data-from="2026-05-01"
  data-to="2026-05-20"
  data-asset="/assets/events/graduation-cap.svg"
  data-animation="float"
  data-placement="canvas-top"
>
</vb-hero-moment>
```

The element renders the asset at the designated placement, animates it with the named animation, and self-removes when the event window closes. No JavaScript beyond the custom element definition is required.

### Doodle Assets

Assets can be:
- SVG illustrations (recommended — scalable, animatable with CSS, brandable)
- Lottie animations (JSON-based, lightweight)
- CSS-only animations (no asset at all — pure code)

An organisation's theme package includes an `/events/` directory. A non-technical person can drop a new SVG there, add a JSON entry, and the doodle appears on schedule.

### Placement Options

| Placement | Description |
|-----------|-------------|
| `canvas-top` | Floats above the canvas top edge — bleeds into the backdrop |
| `backdrop-corner` | Fixed in a backdrop corner, behind the canvas |
| `nav-inline` | Inline within the site navigation |
| `fab` | Floating action button position — a seasonal icon |

---

## Theme as Brand System

The most ambitious claim in this document: **a sufficiently expressive theme should be able to reproduce any major brand's visual identity using only standard HTML and the Vanilla Breeze theme vocabulary**.

Not a pixel-perfect clone. But unmistakably that brand — the colour, the type feel, the surface texture, the motion character.

### The McDonald's Example

```json
{
  "name": "golden-arches",
  "palette": {
    "brand-primary": "oklch(75% 0.18 85)",
    "brand-secondary": "oklch(35% 0.15 35)",
    "surface": "oklch(98% 0.01 85)",
    "text": "oklch(20% 0.02 35)"
  },
  "type": {
    "family-display": "'Speedee', system-ui",
    "family-body": "system-ui",
    "scale": "compact"
  },
  "surfaces": {
    "canvas": "solid",
    "card": "solid",
    "radius": "8px"
  },
  "backdrop": {
    "type": "solid",
    "color": "oklch(75% 0.18 85)",
    "animation": "none",
    "transition": "push"
  },
  "motion": {
    "duration-base": "150ms",
    "easing": "ease-out",
    "character": "snappy"
  }
}
```

Result: a site with McDonald's yellow, their compact confident type scale, their solid opaque surfaces, their fast-snap transitions, their warm red accents. Nothing unusual in the HTML. The theme does all of it.

### The Anthropic Example

```json
{
  "name": "anthropic-brand",
  "palette": {
    "brand-primary": "oklch(55% 0.08 240)",
    "surface": "oklch(97% 0.005 240)",
    "text": "oklch(18% 0.02 240)"
  },
  "type": {
    "family-display": "'Tiempos Headline', Georgia, serif",
    "family-body": "'Söhne', system-ui",
    "scale": "editorial",
    "measure": "68ch"
  },
  "surfaces": {
    "canvas": "solid",
    "card": "ghost",
    "radius": "4px"
  },
  "backdrop": {
    "type": "gradient",
    "start": "oklch(95% 0.01 230)",
    "end": "oklch(90% 0.02 250)",
    "animation": "none",
    "transition": "dissolve"
  },
  "motion": {
    "duration-base": "400ms",
    "easing": "cubic-bezier(0.16, 1, 0.3, 1)",
    "character": "considered"
  }
}
```

Result: editorial serif headlines, considered spacing, subtle blue-tinted backdrop, ghost-surfaced cards — recognisably Anthropic without a single custom CSS rule.

### What a Theme Encodes

A complete Vanilla Breeze theme is a statement about:

- **Colour** — palette, accent, semantic mappings
- **Type** — families, scale, measure, rhythm
- **Surface** — material metaphor (solid, glass, ghost), radius, shadow depth
- **Space** — layout gaps, padding scale, density
- **Backdrop** — environment layer, animation, effect
- **Motion** — duration, easing curve, character (snappy / considered / playful)
- **Sound** (future) — optional interaction audio cues at the system level
- **Environmental modifiers** — seasonal, time-of-day, weather responses
- **Events** — doodle assets, hero moments

When a designer hands over a theme file, they are handing over a fully articulated design philosophy — not a colour swatch.

---

## Theme Testing and the Design-Is-The-Theme Demo

A powerful pedagogical and sales tool: a demo that shows a single HTML document rendered simultaneously under multiple themes, proving that the HTML has no opinion about the design.

### The Theme Switcher Demo

One page, one HTML source, rendered in a grid of iframes each loaded with a different theme. Switching themes in the sidebar updates all iframes simultaneously via `BroadcastChannel`.

```javascript
const channel = new BroadcastChannel('vb-theme-demo');

// Switcher sends
function setTheme(name) {
  channel.postMessage({ type: 'theme', name });
}

// Each iframe receives
channel.onmessage = ({ data }) => {
  if (data.type === 'theme') {
    document.documentElement.dataset.theme = data.name;
  }
};
```

### The Split Comparison View

Two iframes side by side — Brand A on the left, Brand B on the right — same HTML. A splitter bar you can drag to reveal more of either side. The point made visually and immediately: **the design is the theme, the HTML is neutral**.

This is the killer demo for students who have been told "semantic HTML doesn't matter." It shows, concretely, that semantic HTML is what makes theming possible at all. A `<nav>` is a `<nav>` whether it is rendered as McDonald's or Anthropic's navigation. The theme author relies on that.

### Theme Performance Profiles

Each theme can declare a performance tier, allowing graceful degradation on lower-powered devices without a separate stylesheet:

```json
{
  "name": "midnight",
  "performance": {
    "tier-full": {
      "backdrop-animation": "shimmer",
      "canvas-effect": "faded",
      "transition": "slide-stack",
      "stack-depth": 3
    },
    "tier-reduced": {
      "backdrop-animation": "none",
      "canvas-effect": "solid",
      "transition": "dissolve",
      "stack-depth": 1
    },
    "tier-minimal": {
      "backdrop-animation": "none",
      "canvas-effect": "solid",
      "transition": "none",
      "stack-depth": 0
    }
  }
}
```

`VbEnvironment` selects the tier based on `navigator.hardwareConcurrency`, `navigator.deviceMemory`, and `prefers-reduced-motion`.

---

## Architecture Implications

### New Services

| Service | Responsibility |
|---------|---------------|
| `VbEnvironment` | Evaluates time, location, weather, season, event windows; applies `data-env-*` attributes to `<html>` |
| `VbThemeComposer` | Extended to author all backdrop, motion, seasonal, and event properties |
| `VbDoodle` | Manages `<vb-hero-moment>` lifecycle — activation, animation, teardown |
| `VbThemeProxy` | Cloudflare Worker: Unsplash proxy, weather proxy, geolocation reverse-geocode |

### New CSS Layers

```css
@layer
  vb.reset,
  vb.tokens,
  vb.theme,
  vb.theme.seasonal,     /* NEW — seasonal overrides */
  vb.theme.event,        /* NEW — event window overrides */
  vb.theme.environment,  /* NEW — time/weather/place modifiers */
  vb.backdrop,
  vb.backdrop.animations,
  vb.layout,
  vb.components,
  vb.utilities,
  vb.overrides;
```

### New Custom Properties

| Property | Description |
|----------|-------------|
| `--vb-env-sky-hue` | Current sky hue angle (time-driven) |
| `--vb-env-sky-lightness` | Current sky lightness (time-driven) |
| `--vb-env-chroma-modifier` | Weather desaturation multiplier |
| `--vb-env-season` | Current season name |
| `--vb-env-event` | Current event id or `none` |
| `--vb-depth-step` | Lightness step per surface layer |
| `--vb-parallax-offset` | Scroll-driven backdrop position |
| `--vb-layout-mode` | `windowed` or `solid` canvas |
| `--vb-surface` | Surface material for a region |

---

## Implementation Roadmap

These ideas form a natural dependency chain. Implementation should flow in this order:

1. **Windowed layout mode** — transparent canvas gaps, region surfaces. Pure CSS. No new JS. High visual impact immediately.
2. **Sub-surfaces and scoped backdrops** — `data-scope="section"` on `<vb-backdrop>`. Extends existing backdrop work.
3. **Accent-scoped theme overrides** — `data-theme-accent` attributes. CSS only. Unlocks educational colour coding immediately.
4. **Full section theme override** — already works via CSS cascade. Document the pattern, add Theme Composer support.
5. **Time-of-day palette shifts** — `VbEnvironment` with 24-point colour table. First environmental signal.
6. **Seasonal modifiers** — calendar evaluation in `VbEnvironment`. Reads from theme JSON.
7. **Event windows and `<vb-hero-moment>`** — doodle infrastructure. SVG asset pipeline.
8. **Weather integration** — Cloudflare Worker proxy, CSS weather state hooks.
9. **Geolocation atmosphere** — opt-in, privacy-forward. Sunset/sunrise times from coords.
10. **Theme-as-brand demos** — showcase themes for well-known brands. Teaching tool.
11. **Performance tier selection** — `VbEnvironment` device capability detection.