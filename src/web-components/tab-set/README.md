---
title: "Tab Set Specification"
component: tab-set
version: 1.0.0
status: stable
---

# Tab Set

A tabbed interface built on native `<details>` elements that degrades to a working accordion without JavaScript.

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

Organize related content into panels that share the same screen space. Users select a panel via tab triggers. Only one panel is visible at a time.

## Static HTML Form

Without JavaScript, `<tab-set>` renders as a native exclusive accordion using `<details name="...">`. All panels are accessible via click/tap on the `<summary>` elements. The browser handles exclusive-open behavior natively.

```html
<tab-set>
  <details name="tabs" open>
    <summary>Overview</summary>
    <section>Overview content</section>
  </details>
  <details name="tabs">
    <summary>Details</summary>
    <section>Details content</section>
  </details>
</tab-set>
```

## Enhanced Form

After upgrade, CSS Grid reorders summaries into a horizontal tab bar (row 1) with panels below (row 2). JS adds keyboard navigation (Arrow keys, Home, End) and View Transition support.

```html
<tab-set data-transition="slide">
  <details name="tabs" open>
    <summary>Tab 1</summary>
    <section>Panel 1</section>
  </details>
  <details name="tabs">
    <summary>Tab 2</summary>
    <section>Panel 2</section>
  </details>
</tab-set>
```

## Attributes and API

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-transition` | string | -- | View Transition type: "fade", "slide", "scale" |

**Events:** `tab-set:change` with `{ index }` detail

## Failure Modes

### No JavaScript

- **Behavior:** Renders as a native `<details name="...">` exclusive accordion. Users can open/close sections. The `name` attribute ensures only one section is open at a time. Full interactivity is preserved.
- **Implementation:** `<details>` and `<summary>` are native HTML interactive elements. The `name` attribute provides exclusive-accordion behavior without JS.
- **Acceptable:** Yes -- full functionality preserved as accordion layout.

### No CSS

- **Behavior:** Each `<details>` renders as a standard disclosure widget with `<summary>` as the toggle. All content is accessible and logically ordered. Sections expand/collapse natively.
- **Implementation:** `<details>` and `<summary>` are styled by the browser's default stylesheet. Content order matches reading order.
- **Acceptable:** Yes -- fully functional without CSS.

### Upgrade Delay

- **Behavior:** Before CSS loads, renders as native disclosure widgets. Once CSS loads but before JS upgrade, CSS Grid reorders summaries into tab bar. JS adds keyboard navigation. No layout shift occurs because the grid layout is defined in CSS, not JS.
- **Implementation:** Tab-set styles apply to `:defined` and undefined states equally (no `:not(:defined)` block needed because the CSS grid layout works with native `<details>` behavior). Animation suppression via global `:not(:defined)` rule in `reset.css`.
- **Acceptable:** Yes

### Keyboard Only

- **Behavior:** Tab to reach summaries, Enter/Space to toggle (native). After JS upgrade: Arrow Left/Right to navigate between tabs, Home/End to jump to first/last tab.
- **Tab order:** Summaries receive focus in document order. After upgrade, inactive summaries have `tabindex="-1"` and the active summary has `tabindex="0"`, following roving tabindex pattern.
- **Key bindings:** ArrowRight (next tab), ArrowLeft (previous tab), Home (first tab), End (last tab), Enter/Space (toggle -- native)
- **Acceptable:** Yes

### Screen Reader

- **ARIA roles:** No custom ARIA roles applied. `<summary>` has implicit button role. `<details>` announces expanded/collapsed state natively. `aria-controls` links summary to panel. `aria-labelledby` links panel back to summary.
- **Live regions:** None needed -- native `<details>` toggle announces state changes.
- **Announced state changes:** Panel open/close announced by browser. Tab change fires `tab-set:change` event.
- **Tested with:** VoiceOver (macOS)
- **Acceptable:** Yes

### RTL / i18n

- **Behavior:** CSS Grid layout auto-mirrors. Tab bar flows right-to-left. Arrow key behavior is physical (Left = previous, Right = next) matching browser convention.
- **CSS approach:** All spacing uses logical properties (`padding-block-start`, `margin-block-end`, `border-block-end`). Grid columns flow with writing direction.
- **Acceptable:** Yes

## Accessibility

- WCAG 2.1 AA compliant
- Built entirely on native HTML semantics -- no ARIA role overrides
- Focus management via roving tabindex pattern
- Reduced motion: transitions disabled via `prefers-reduced-motion: reduce`

## CSS Tokens

| Token | Default | Purpose |
|-------|---------|---------|
| `--size-s` | 0.75rem | Tab padding (inline) |
| `--size-m` | 1rem | Tab padding (block), panel padding |
| `--color-border` | -- | Tab bar bottom border |
| `--color-text-muted` | -- | Inactive tab text color |
| `--color-text` | -- | Hovered tab text color |
| `--color-interactive` | -- | Active tab text and border color |
| `--border-width-thin` | -- | Tab bar border width |
| `--border-width-medium` | -- | Active tab indicator width |
| `--size-touch-min` | -- | Minimum tab height for touch |

## Examples

Basic tabs:
```html
<tab-set>
  <details name="demo" open>
    <summary>HTML</summary>
    <section><pre><code>...</code></pre></section>
  </details>
  <details name="demo">
    <summary>CSS</summary>
    <section><pre><code>...</code></pre></section>
  </details>
  <details name="demo">
    <summary>JS</summary>
    <section><pre><code>...</code></pre></section>
  </details>
</tab-set>
```

With View Transitions:
```html
<tab-set data-transition="slide">
  <details name="animated" open>
    <summary>Overview</summary>
    <section>Content slides in from the right</section>
  </details>
  <details name="animated">
    <summary>Details</summary>
    <section>Previous content slides out to the left</section>
  </details>
</tab-set>
```
