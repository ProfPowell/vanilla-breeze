---
title: "Heading Links Specification"
component: heading-links
version: 1.0.0
status: stable
---

# Heading Links

Adds anchor links to headings that appear on hover, enabling deep linking and URL sharing for any section.

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

Allow users to link directly to any section of a page. Hovering over a heading reveals a link icon; clicking it copies the section URL to the clipboard and updates the browser address bar.

## Static HTML Form

Without JavaScript, headings remain plain headings. If headings have `id` attributes, users can still navigate to them via URL fragments. The component adds zero visual change and no interactive affordance without JS -- but it also breaks nothing.

```html
<heading-links>
  <h2 id="usage">Usage</h2>
  <p>Content here...</p>
  <h3 id="examples">Examples</h3>
  <p>More content...</p>
</heading-links>
```

## Enhanced Form

After upgrade, the component scans child headings, generates IDs for those without them, and appends a link icon (`<a class="heading-anchor">`) to each heading. The icon appears on hover/focus.

```html
<heading-links data-levels="h2,h3,h4">
  <h2>Usage</h2>
  <p>Content here...</p>
</heading-links>
```

## Attributes and API

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-levels` | string | "h2,h3" | Comma-separated heading levels to process |

**Events:** `heading-links:navigate` with `{ id, url }` detail

## Failure Modes

### No JavaScript

- **Behavior:** Headings render exactly as plain headings. No anchor links appear. No functionality is lost -- the page is fully readable. If headings have IDs, direct URL fragment navigation still works.
- **Implementation:** The component uses `display: block` and adds no visual changes to its children. All enhancement is JS-driven via `connectedCallback`.
- **Acceptable:** Yes -- near-perfect degradation. Heading anchors are a pure enhancement.

### No CSS

- **Behavior:** Headings render with browser defaults. If JS has run, anchor links appear inline as standard blue links. Content remains fully readable and navigable.
- **Implementation:** Anchor links are standard `<a>` elements with `href="#id"`. They function as normal links without CSS.
- **Acceptable:** Yes -- links are visible and functional.

### Upgrade Delay

- **Behavior:** Headings display normally during the gap. On upgrade, anchor links are appended. No layout shift occurs because anchors are inline elements with `opacity: 0` (hidden until hover). The `display: block` on `:not(:defined)` prevents the element from collapsing.
- **Implementation:** `:not(:defined)` CSS sets `display: block`. Animation suppression via global `:not(:defined)` rule in `reset.css`.
- **Acceptable:** Yes -- no visible change during upgrade gap.

### Keyboard Only

- **Behavior:** Anchor links are focusable via Tab. Pressing Enter activates the link (copies URL and scrolls to heading). Headings are made focusable with `tabindex="-1"` for programmatic focus after anchor click.
- **Tab order:** Anchor links appear in tab order after their parent heading's content.
- **Key bindings:** Tab (focus anchor), Enter (activate), standard link behavior
- **Acceptable:** Yes

### Screen Reader

- **ARIA roles:** Each anchor has `aria-label="Link to [heading text]"` for clear announcement.
- **Live regions:** Clipboard copy success is announced via a dynamically inserted `role="status" aria-live="polite"` element ("Link copied to clipboard").
- **Announced state changes:** Copy confirmation announced via live region. Visual check icon is decorative.
- **Tested with:** VoiceOver (macOS)
- **Acceptable:** Yes

### RTL / i18n

- **Behavior:** Anchor links use `margin-inline-start` so they appear on the correct side in RTL. The link icon position mirrors automatically.
- **CSS approach:** All spacing uses logical properties. No physical directional properties.
- **Acceptable:** Yes -- fully supports RTL.

## Accessibility

- WCAG 2.1 AA compliant
- Anchor links have descriptive `aria-label`
- Clipboard feedback announced to screen readers
- No interference with heading semantics or document outline
- MutationObserver watches for dynamically added headings

## CSS Tokens

| Token | Default | Purpose |
|-------|---------|---------|
| `--size-xs` | 0.5rem | Anchor link margin from heading |
| `--size-3xs` | -- | Anchor link padding |
| `--size-xl` | 2rem | Heading scroll-margin-top |
| `--color-text-muted` | -- | Anchor link default color |
| `--color-interactive` | -- | Anchor link hover color |
| `--color-surface-raised` | -- | Anchor link hover background |
| `--color-success` | -- | Copied state color |
| `--radius-s` | -- | Anchor link border-radius |
| `--border-width-medium` | -- | Focus ring width |

## Examples

Default (h2, h3):
```html
<heading-links>
  <h2>Getting Started</h2>
  <p>Installation instructions...</p>
  <h3>Prerequisites</h3>
  <p>You will need...</p>
</heading-links>
```

Custom levels:
```html
<heading-links data-levels="h2,h3,h4">
  <h2>API Reference</h2>
  <h3>Methods</h3>
  <h4>connect()</h4>
  <p>Establishes connection...</p>
</heading-links>
```
