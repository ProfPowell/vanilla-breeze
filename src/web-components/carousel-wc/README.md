---
title: "Carousel Specification"
component: carousel-wc
version: 1.0.0
status: stable
---

# Carousel

A scroll-snap carousel with prev/next controls, dot indicators, autoplay, keyboard navigation, and full ARIA support.

## Table of Contents

- [Purpose](#purpose)
- [Static HTML Form](#static-html-form)
- [Enhanced Form](#enhanced-form)
- [Attributes and API](#attributes-and-api)
- [Failure Modes](#failure-modes)
- [Accessibility](#accessibility)
- [CSS Tokens](#css-tokens)
- [Examples](#examples)

## Purpose

Present a sequence of content items (images, cards, slides) in a horizontally scrollable container with navigation controls. Users can browse items sequentially or jump to specific slides.

## Static HTML Form

Without JavaScript, `<carousel-wc>` renders as a horizontal flex scroll container. All slides are visible and scrollable via native scroll-snap. No controls or indicators appear.

```html
<carousel-wc>
  <article>Slide 1 content</article>
  <article>Slide 2 content</article>
  <article>Slide 3 content</article>
</carousel-wc>
```

The `:not(:defined)` CSS provides `display: flex; overflow-x: auto; scroll-snap-type: x mandatory` so slides are browsable without JS.

## Enhanced Form

After upgrade, the component builds a track, prev/next buttons, dot indicators, and a live region for screen reader announcements.

```html
<carousel-wc data-loop data-autoplay data-autoplay-delay="5000">
  <article>Slide 1</article>
  <article>Slide 2</article>
  <article>Slide 3</article>
</carousel-wc>
```

## Attributes and API

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-autoplay` | boolean | -- | Enable autoplay |
| `data-autoplay-delay` | number | 5000 | Autoplay interval in ms |
| `data-loop` | boolean | -- | Wrap around at ends |
| `data-indicators` | string | "true" | Show dot indicators |
| `data-item-width` | string | "full" | Slide width: "full", "auto", or CSS length |
| `data-gap` | string | -- | Gap token: xs, s, m, l, xl |
| `data-start` | number | 0 | Initial slide index |
| `data-persist` | string | -- | localStorage key for slide persistence |
| `data-transition` | string | -- | View Transition type: "fade", "slide", "scale" |

**JS API:** `next()`, `prev()`, `goTo(index)`, `play()`, `pause()`, `reset()`, `currentIndex`, `slideCount`, `playing`

**Events:** `carousel-wc:change`, `carousel-wc:play`, `carousel-wc:pause`

## Failure Modes

### No JavaScript

- **Behavior:** All slides are visible in a horizontal scroll container with native scroll-snap. Users can scroll through slides using mouse, touch, or keyboard.
- **Implementation:** `:not(:defined)` CSS sets `display: flex; overflow-x: auto; scroll-snap-type: x mandatory`. No controls or indicators are rendered.
- **Acceptable:** Partial -- all content is accessible but there are no prev/next controls or indicators.

### No CSS

- **Behavior:** Slides stack vertically as block elements. All content is readable in document order.
- **Implementation:** Semantic HTML (`<article>` or `<div>` children) ensures logical content flow without styling.
- **Acceptable:** Partial -- content is readable but not presented as a carousel.

### Upgrade Delay

- **Behavior:** During the parse-to-upgrade gap, slides render as a horizontal scroll. On upgrade, layout shifts to grid with controls. The `:not(:defined)` CSS and animation suppression in reset.css prevent flicker.
- **Implementation:** `:not(:defined)` block in `styles.css` lines 4-14. Global `transition: none !important; animation: none !important` on `:not(:defined)` in `reset.css`.
- **Acceptable:** Yes -- smooth transition from scroll to controlled carousel.

### Keyboard Only

- **Behavior:** Full keyboard navigation: Tab to reach carousel, Arrow Left/Right to navigate slides, Home/End to jump to first/last.
- **Tab order:** Focus moves to track, then prev/next buttons, then indicator dots.
- **Key bindings:** ArrowLeft (prev), ArrowRight (next), Home (first), End (last)
- **Acceptable:** Yes

### Screen Reader

- **ARIA roles:** `region` on carousel, `group` with `aria-roledescription="slide"` on each slide, `tablist` on indicators, `tab` on dots
- **Live regions:** `aria-live="polite"` region announces "Slide X of Y" on change
- **Announced state changes:** Current slide index announced on navigation, autoplay play/pause via events
- **Tested with:** VoiceOver (macOS)
- **Acceptable:** Yes

### RTL / i18n

- **Behavior:** Layout uses CSS Grid which respects writing direction. Arrow key directions remain physical (Left = previous, Right = next) matching carousel convention.
- **CSS approach:** Uses logical properties for spacing (`padding-block-start`, `gap`). Grid areas are direction-agnostic. Button sizing uses physical `width`/`height` for the circular shape (intentional exception).
- **Acceptable:** Partial -- arrow key mapping is physical, not logical.

## Accessibility

- WCAG 2.1 AA compliant
- Autoplay pauses on hover, focus, and touch (WCAG 2.2.2)
- Autoplay disabled when `prefers-reduced-motion: reduce` is active
- All interactive elements meet 44x44px minimum touch target
- Live region announces slide changes without interrupting user flow

## CSS Tokens

| Token | Default | Purpose |
|-------|---------|---------|
| `--size-s` | 0.75rem | Gap between slides |
| `--size-xs` | 0.5rem | Gap between indicator dots |
| `--color-border` | -- | Button border color |
| `--color-surface` | -- | Button background |
| `--color-text` | -- | Button icon color |
| `--color-interactive` | -- | Active dot and hover color |
| `--color-focus` | -- | Focus ring color |
| `--radius-full` | 50% | Button border-radius |
| `--radius-s` | -- | Track focus ring radius |

## Examples

Basic carousel:
```html
<carousel-wc>
  <img src="photo-1.jpg" alt="Mountain landscape" />
  <img src="photo-2.jpg" alt="Ocean sunset" />
  <img src="photo-3.jpg" alt="Forest path" />
</carousel-wc>
```

Autoplay with loop:
```html
<carousel-wc data-autoplay data-loop data-autoplay-delay="3000">
  <article>Testimonial 1</article>
  <article>Testimonial 2</article>
  <article>Testimonial 3</article>
</carousel-wc>
```
