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

After upgrade, the summaries line up as a tab row (a wrapping flex line, so many tabs wrap onto further rows instead of overflowing a narrow screen) and the open panel takes the full line below. `data-orientation="vertical"` puts the tabs in a column at the inline start with the panel beside them. JS adds keyboard navigation (Arrow keys, Home, End) and View Transition support.

Each `<details>` holds one `<summary>` and **exactly one** panel element; use `<section>` panels (a labelled `<section>` is a region named by its tab, a `<div>` panel's name is ignored).

```html
<tab-set transition="slide">
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
| `transition` | string | -- | View Transition type: "fade", "slide", "scale" |
| `data-orientation` | `horizontal` \| `vertical` | `horizontal` | Vertical: tab column at the inline start, panel beside it, ArrowUp/ArrowDown navigation |
| `aria-label` / `aria-labelledby` | string | -- | Names the set; a labelled host (with no role of its own) gets `role="group"` on upgrade |

**Grouping:** exclusivity comes from a shared `<details name>`. On upgrade, a missing, mixed, or page-shared name (another `<details>` outside this set uses it) is replaced with a per-instance `tab-set-N`, so two tab-sets never close each other's tabs.

**Property:** `tabs` — get the tabs as `[{ id?, label, content, active? }]`, or assign an array to rebuild (`<section>` panels). `content` is trusted HTML written with `innerHTML`; never pass unsanitised user input.

**Events:**

- `tab-set:change` `{ index, previousIndex, tab, panel }` — once per activation, from the opening tab (`tab` is its `<details>`). Not fired during setup or when the active tab is re-selected.
- `tab-set:tabs-changed` `{ tabs, source: 'property' }` — after the `tabs` setter rebuilds.

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

- **Behavior:** Before CSS loads, renders as native disclosure widgets. Once CSS loads but before the element is defined, `tab-set:not(:defined) { display: block }` keeps it a stacked exclusive accordion; when it is defined the summaries snap into the tab row (a one-time layout shift).
- **Implementation:** The `:not(:defined)` block keeps the no-JS form an accordion; vertical layout is scoped to `:defined`. Animation suppression via global `:not(:defined)` rule in `reset.css`.
- **Acceptable:** Yes

### Keyboard Only

- **Behavior:** Tab to reach summaries, Enter/Space to toggle (native). After JS upgrade: Arrow Left/Right to navigate between tabs (plus Up/Down with `data-orientation="vertical"`), Home/End to jump to first/last tab. Arrows activate automatically.
- **Tab order:** Summaries receive focus in document order. After upgrade, inactive summaries have `tabindex="-1"` and the active summary has `tabindex="0"`, following roving tabindex pattern.
- **Key bindings:** ArrowRight (next tab; previous in RTL), ArrowLeft (previous tab; next in RTL), ArrowDown/ArrowUp (next/previous, vertical only), Home (first tab), End (last tab), Enter/Space (activate -- native; re-activating the open tab is a no-op)
- **Acceptable:** Yes

### Screen Reader

- **ARIA roles:** No tab/tablist/tabpanel roles. `<summary>` has implicit button role with `aria-expanded`. A labelled host gets `role="group"` (an unlabelled one stays role-less, since `aria-label` is prohibited on a generic). `aria-controls` links summary to panel; `aria-labelledby` names the panel (effective on `<section>` panels, which become regions).
- **Live regions:** None needed -- native `<details>` toggle announces state changes.
- **Announced state changes:** Panel open/close announced by browser. Tab change fires `tab-set:change` event.
- **Tested with:** VoiceOver (macOS)
- **Acceptable:** Yes

### RTL / i18n

- **Behavior:** The tab row flows right-to-left. Arrow keys follow the visual order (APG): in RTL, ArrowLeft moves to the next tab and ArrowRight to the previous.
- **CSS approach:** All spacing uses logical properties (`padding-block-start`, `margin-block-end`, `border-block-end`, `border-inline-end`). The flex row and the vertical grid flow with writing direction.
- **Acceptable:** Yes

## Accessibility

- WCAG 2.1 AA compliant
- Built entirely on native HTML semantics -- no ARIA role overrides
- Focus management via roving tabindex pattern
- Reduced motion: transitions disabled via `prefers-reduced-motion: reduce`
- Forced colors: the selected tab's border uses `Highlight` (also in the extreme-neumorphism theme, whose shadow cue is dropped)
- Print (`utils/print.css`): every panel prints in source order under its tab label, styled as a heading

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
<tab-set transition="slide">
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
