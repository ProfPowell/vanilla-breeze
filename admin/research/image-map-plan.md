# `<image-map>` Component Specification

**Vanilla Breeze — Upscaled Image Maps**
**Status:** Draft · **Version:** 0.1.0

---

## Overview

This spec defines a modern replacement for native HTML image maps using two
custom elements: `<image-map>` (the container) and `<map-area>` (hotspot
definitions). The system solves the core failure of native image maps —
pixel-absolute coordinates — by using a percentage-based coordinate space that
scales with the image at any viewport size.

### Design Goals

- **Percentage coordinates** — all geometry is relative to the image dimensions
- **HTML-first authoring** — areas are declared as markup, not JS config objects
- **Progressive enhancement** — degrades to a captioned image without JS
- **Rich tooltips** — full HTML content per area, not just `title` strings
- **Accessible** — keyboard navigable, screen-reader announced, focus visible
- **Composer tool** — a visual editor to generate the markup (replaces ImageMap Editor of old)

---

## Element API

### `<image-map>`

The host element. Wraps the image and its area children.

```html
<image-map src="/maps/world.jpg" alt="World map showing regional offices">
  <map-area ...>...</map-area>
  <map-area ...>...</map-area>
</image-map>
```

#### Attributes

| Attribute   | Type    | Required | Description                                      |
|-------------|---------|----------|--------------------------------------------------|
| `src`       | string  | Yes      | Image URL                                        |
| `alt`       | string  | Yes      | Image alt text (describes the whole map)         |
| `loading`   | string  | No       | `lazy` \| `eager` — passed to inner `<img>`      |
| `crossorigin` | string | No     | Passed to inner `<img>`                          |

#### CSS Custom Properties

| Property                     | Default  | Description                         |
|------------------------------|----------|-------------------------------------|
| `--map-area-color`           | `oklch(60% 0.2 250 / 0.35)` | Default area fill     |
| `--map-area-color-hover`     | `oklch(60% 0.2 250 / 0.6)`  | Hover/focus area fill |
| `--map-tooltip-bg`           | `oklch(15% 0 0 / 0.92)`     | Tooltip background    |
| `--map-tooltip-color`        | `white`  | Tooltip text color                  |
| `--map-tooltip-radius`       | `0.5rem` | Tooltip border radius               |
| `--map-tooltip-max-width`    | `20rem`  | Tooltip max width                   |

#### Parts

| Part         | Description                        |
|--------------|------------------------------------|
| `image`      | The `<img>` element                |
| `overlay`    | The SVG overlay layer              |
| `tooltip`    | The tooltip container              |

#### Events

| Event              | Detail                          | Description                    |
|--------------------|---------------------------------|--------------------------------|
| `area-enter`       | `{ area: MapAreaElement }`      | Pointer/focus entered an area  |
| `area-leave`       | `{ area: MapAreaElement }`      | Pointer/focus left an area     |
| `area-activate`    | `{ area: MapAreaElement }`      | Area clicked or Enter pressed  |

---

### `<map-area>`

Defines a single hotspot. Must be a direct child of `<image-map>`.

```html
<map-area
  shape="rect"
  coords="12.5 8.3 45.0 38.7"
  href="/regions/europe"
  label="Europe">
  <strong>European Region</strong>
  <p>14 offices across 9 countries.</p>
  <a href="/regions/europe">View details →</a>
</map-area>
```

#### Attributes

| Attribute   | Type    | Required | Description                                             |
|-------------|---------|----------|---------------------------------------------------------|
| `shape`     | string  | Yes      | `rect` \| `circle` \| `poly`                           |
| `coords`    | string  | Yes      | Space or comma-separated percentages (see below)        |
| `label`     | string  | Yes      | Accessible label for the area (aria-label on hotspot)   |
| `href`      | string  | No       | Navigation target. Omit for non-link hotspots           |
| `target`    | string  | No       | Link target (`_blank`, etc.)                            |
| `tooltip`   | string  | No       | `hover` (default) \| `click` \| `none`                  |
| `disabled`  | boolean | No       | Suppresses interaction and tooltip                      |

#### Slot

The default slot of `<map-area>` is the tooltip content. Accepts rich HTML:
headings, paragraphs, lists, images, links.

```html
<map-area shape="circle" coords="50 50 8" label="Headquarters">
  <figure>
    <img src="/office-hq.jpg" alt="HQ building exterior" width="200" height="120">
    <figcaption>
      <strong>Global HQ — San Francisco</strong>
      <p>Est. 2009 · 1,200 employees</p>
    </figcaption>
  </figure>
</map-area>
```

---

## Coordinate System

All coordinates are **percentages of the rendered image dimensions** — not
pixels. Values are unitless numbers `0`–`100`. Separators can be spaces or
commas (both parsed; spaces preferred for readability).

### `rect`

```
coords="x1 y1 x2 y2"
```

`(x1, y1)` = top-left corner, `(x2, y2)` = bottom-right corner.

```html
<map-area shape="rect" coords="10 20 45 60" ...>
```

### `circle`

```
coords="cx cy r"
```

`cx/cy` = centre point, `r` = radius. All are percentages of image width
(using width for radius maintains shape at non-square aspect ratios).

```html
<map-area shape="circle" coords="50 50 8" ...>
```

### `poly`

```
coords="x1 y1 x2 y2 x3 y3 ..."
```

Minimum 3 points. Polygon auto-closes.

```html
<map-area shape="poly" coords="20 10 80 10 95 90 50 100 5 90" ...>
```

---

## Internal Architecture

### Shadow DOM Structure

```
<image-map> (host)
  └── shadow root
        ├── <style> (component styles)
        ├── <img part="image" src alt loading>
        ├── <svg part="overlay" aria-hidden="true">
        │     └── <g> — one shape element per <map-area>
        │           rect | circle | polygon
        ├── <div part="tooltip" role="tooltip" aria-live="polite">
        │     └── <slot> (tooltip content projected from map-area)
        └── <div class="focus-anchors">
              └── <a> | <button> — one per map-area (keyboard targets)
```

### SVG Overlay

The SVG overlay uses `viewBox="0 0 100 100"` and `preserveAspectRatio="none"`
to fill the image exactly. Percentage coordinates map directly to SVG user
units — no conversion math at runtime.

```svg
<svg viewBox="0 0 100 100" preserveAspectRatio="none">
  <rect x="10" y="20" width="35" height="40" />
  <circle cx="50" cy="50" r="8" />
  <polygon points="20,10 80,10 95,90 50,100 5,90" />
</svg>
```

Shapes use `pointer-events: all` and `fill: var(--map-area-color)`. The SVG
itself uses `pointer-events: none` at root so the underlying image remains
selectable/copyable.

### Tooltip Positioning

Tooltip position is calculated relative to the bounding box of the hovered SVG
shape in screen coordinates via `getBoundingClientRect()`. Placement priority:
above → below → right → left, choosing whichever has most available space.
Tooltip uses `position: fixed` to escape any ancestor `overflow: hidden`.

### ResizeObserver

A single `ResizeObserver` on the `<image-map>` host element triggers
re-measurement of the SVG overlay bounds. No coordinate recalculation is
needed (percentages handle it) but the tooltip anchor positions update.

---

## Accessibility

### Keyboard Navigation

Each `<map-area>` generates a focusable element (`<a>` if `href` is set,
`<button>` otherwise) positioned absolutely over the image region using
`clip-path` or matching `top/left/width/height` percentages. These are the
actual keyboard targets — the SVG shapes are `aria-hidden`.

Tab order follows DOM order of `<map-area>` children.

### ARIA

```html
<!-- host -->
<image-map role="group" aria-label="[alt attribute value]">

<!-- focus anchor per area -->
<a href="/europe" aria-label="Europe" aria-describedby="tooltip-1">Europe</a>

<!-- tooltip -->
<div id="tooltip-1" role="tooltip" aria-live="polite">
  <!-- projected slot content -->
</div>
```

### Focus Rings

Focus anchors use `:focus-visible` with a 3px outline in `--map-area-color-hover`,
matching the SVG highlight so there is a consistent visual feedback loop.

---

## Progressive Enhancement

Without JavaScript, `<image-map>` renders as:

```html
<!-- light DOM fallback (rendered without JS) -->
<figure>
  <img src="/maps/world.jpg" alt="World map showing regional offices">
  <figcaption>
    <ul>
      <!-- one <li> per <map-area>, using label + href -->
      <li><a href="/regions/europe">Europe</a></li>
    </ul>
  </figcaption>
</figure>
```

This fallback is achieved by authors including a `<noscript>` block, or the
component writing it to light DOM during `connectedCallback` before the upgrade
fires — the latter being cleaner for SSR contexts.

---

## Map Composer Tool

The **Map Composer** is a browser-based visual editor that generates
`<image-map>` markup. It replaces tools like the old Mapedit / CoffeeCup Image
Mapper.

### Workflow

1. **Upload or URL** — load a source image into the canvas
2. **Draw areas** — toolbar with Rect, Circle, Poly tools (click/drag)
3. **Edit area** — sidebar shows `label`, `href`, `tooltip` mode fields +
   a rich text editor for tooltip content
4. **Review** — live preview pane renders the actual web component
5. **Export** — copies or downloads the final `<image-map>` markup

### Canvas Interactions

| Tool   | Gesture                          | Result                  |
|--------|----------------------------------|-------------------------|
| Rect   | Click-drag                       | Draws bounding box      |
| Circle | Click-drag from centre           | Draws circle            |
| Poly   | Click points, double-click close | Draws polygon           |
| Select | Click shape                      | Selects for edit/delete |
| Move   | Drag selected shape              | Repositions             |
| Resize | Drag handles on selected shape   | Resizes                 |

All coordinates stored internally as percentages. The canvas uses an
`<svg>` overlay on top of a `<canvas>` background (image) — SVG handles
hit-testing and shape rendering, canvas handles image display at full
resolution.

### Composer Output

```html
<!-- Generated markup — copy-paste ready -->
<image-map src="/maps/world.jpg" alt="World map showing regional offices">

  <map-area
    shape="rect"
    coords="8.3 11.2 42.7 58.4"
    href="/regions/europe"
    label="Europe">
    <strong>European Region</strong>
    <p>14 offices across 9 countries.</p>
  </map-area>

  <map-area
    shape="circle"
    coords="72.1 38.5 6.4"
    href="/regions/asia"
    label="Asia Pacific">
    <strong>Asia-Pacific Region</strong>
    <p>8 offices, 4 countries.</p>
  </map-area>

</image-map>
```

### Composer Tech Stack

- Vanilla JS + Web Components (dogfoods the system)
- `<svg>` overlay for drawing + shape management
- `<canvas>` for image rendering
- `File` API + `URL.createObjectURL` for image loading
- `Clipboard` API for copy-to-clipboard output
- Persistent state via `localStorage` (auto-saves in-progress work)
- No build step — single `composer.html` file

---

## Demo Concept

A high-quality demonstration page showcasing:

**Subject:** Vintage illustrated world map (public domain, high resolution)

**Areas demonstrated:**

| Area     | Shape  | Tooltip Content                                      |
|----------|--------|------------------------------------------------------|
| Europe   | poly   | Rich card with regional stats + inline chart         |
| Americas | rect   | Split layout — image + text                          |
| Asia     | poly   | Multi-tab content (Overview / Offices / Contacts)    |
| Oceania  | circle | Minimal — just a heading and link                    |

**Demonstrates:**
- All three shape types
- Tooltip richness spectrum (minimal → rich)
- Keyboard navigation across areas
- Responsive scaling — viewport resize shows coords tracking
- Dark mode toggle (CSS custom properties cascade into tooltip)

---

## File Structure

```
packages/
  image-map/
    src/
      image-map.js        # <image-map> element
      map-area.js         # <map-area> element
      image-map.css       # Host styles + CSS custom properties
      tooltip.js          # Tooltip positioning logic (pure function)
      coords.js           # Coordinate parsing + SVG path generation
    composer/
      composer.html       # The standalone Map Composer tool
      composer.js         # Composer application logic
      composer.css        # Composer styles
    demo/
      index.html          # Demo page
    test/
      coords.test.js      # Unit tests for coordinate math
    README.md
    custom-elements.json  # CEM manifest
```

---

## Open Questions

1. **Multi-tooltip** — should multiple tooltips be open simultaneously (click
   mode), or always one at a time?
   Thomas: Depends on if the tool tip can be dismissed directly as they may stack.  if the tooltip supports that we could allow.  It could be a mode to allow one or not

2. **Touch** — `tooltip="hover"` maps to `touchstart` on mobile; is a
   `tooltip="tap"` mode needed that shows on first tap, navigates on second?
   Thomas: I think that is correct

3. **Animations** — CSS `@starting-style` for tooltip enter/exit, or leave to
   consumer?
   Thomas: The tooltip is a separate element so its behavior is defined there.

4. **SSR** — does the noscript fallback strategy hold for island hydration
   contexts (Astro, 11ty edge)?
   Thomas: I think it does

5. **Native map passthrough** — worth including a `<map>` + `<area>` fallback
   inside the shadow DOM for search engines / scrapers, or is the light DOM
   anchor list sufficient?
   Thomas: the light DOM anchor list is sufficient