---
title: "Review Surface Specification"
component: review-surface
version: 1.0.0
status: stable
---

# Review Surface

Pin-based annotation overlay for collaborative design review.

## Table of Contents
- [Purpose](#purpose)
- [Static HTML Form](#static-html-form)
- [Enhanced Form](#enhanced-form)
- [Attributes and API](#attributes-and-api)
- [Adapters](#adapters)
- [Accessibility](#accessibility)
- [CSS Tokens](#css-tokens)

## Purpose

Wraps any HTML content and adds a transparent overlay for placing review
comment pins. Supports pluggable persistence (memory, localStorage, REST)
for solo and team workflows.

Part of the **UX Planning Pack** — completes the feedback loop alongside
user-persona, user-story, user-journey, empathy-map, and other planning
components.

## Static HTML Form

Without JavaScript, the component renders its slotted content unchanged.
An optional `<ol slot="pins-fallback">` provides a text-based pin list.

```html
<review-surface>
  <img src="/comp.png" alt="Design comp" />
  <ol slot="pins-fallback">
    <li><strong>Sarah</strong> (42%, 18%): Fix alignment</li>
  </ol>
</review-surface>
```

## Enhanced Form

```html
<review-surface editable adapter="local" storage-key="sprint-4" author="Sarah">
  <empathy-map src="/data/empathy.json"></empathy-map>
</review-surface>
```

With JavaScript:
- Transparent overlay captures clicks in annotate mode
- Numbered pin markers placed at percentage coordinates
- Click a pin to open a comment popover with reply thread
- Toolbar for mode toggle, pin count, and JSON export

## Attributes and API

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` | string | — | JSON URL containing pin data |
| `editable` | boolean | — | Enables annotate mode and toolbar |
| `adapter` | string | `"memory"` | Persistence: `memory`, `local`, `rest` |
| `endpoint` | string | — | REST endpoint (when adapter=rest) |
| `storage-key` | string | `"review-surface"` | localStorage key |
| `author` | string | `"Anonymous"` | Default author name |
| `compact` | boolean | — | Reduced spacing variant |
| `show-resolved` | boolean | — | Show resolved pins |
| `pin-count` | number | 0 | Reflected visible pin count (read-only) |

**JS API:**

| Method | Description |
|--------|-------------|
| `addPin({ x, y, text, author })` | Create a pin |
| `removePin(id)` | Delete a pin |
| `resolvePin(id)` | Mark resolved |
| `unresolvePin(id)` | Re-open resolved pin |
| `exportPins()` | Return pins as JSON array |
| `importPins(data)` | Load pins (replaces current) |

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `.pins` | Pin[] | Get/set pin data |
| `.adapter` | Object | Get/set adapter instance |

**Events:**

| Event | Detail | Description |
|-------|--------|-------------|
| `review-surface:ready` | `{ pinCount }` | After render |
| `review-surface:add` | `{ pin }` | Pin created |
| `review-surface:update` | `{ pin, changes }` | Pin modified |
| `review-surface:remove` | `{ pin }` | Pin deleted |
| `review-surface:resolve` | `{ pin }` | Pin resolved |
| `review-surface:select` | `{ pin }` | Popover opened |
| `review-surface:mode` | `{ mode }` | Mode toggled |

## Adapters

### Memory (default)
Ephemeral — pins are lost on page refresh.

### LocalStorage
```html
<review-surface adapter="local" storage-key="my-review">
```

### REST
```html
<review-surface adapter="rest" endpoint="/api/reviews/page-1">
```
Expects standard REST: `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`.

### Custom
Set via property:
```js
document.querySelector('review-surface').adapter = myCustomAdapter;
```
Must implement: `load()`, `save(pin)`, `update(id, changes)`, `remove(id)`.

## Failure Modes

- **No JavaScript:** Child content renders normally; pins are not shown.
- **No CSS:** Shadow DOM styles are self-contained; layout degrades gracefully.
- **Keyboard Only:** Tab navigates pins; Enter opens popover; Escape closes.
- **Screen Reader:** Pin markers announced as "Pin N: [text preview]";
  live region announces create/delete/resolve actions.

## Accessibility

- Pin markers are `<button>` with `aria-label`, `aria-expanded`, `aria-haspopup="dialog"`
- Popover uses `role="dialog"` with `aria-labelledby`
- Toolbar uses `role="toolbar"` with `aria-label`
- `aria-live="polite"` region announces pin actions
- All transitions respect `prefers-reduced-motion: reduce`

## CSS Tokens

| Token | Fallback | Purpose |
|-------|----------|---------|
| `--review-surface-bg` | `--color-surface` | Background |
| `--review-surface-card` | `--color-surface-raised` | Popover/toolbar bg |
| `--review-surface-border` | `--color-border` | Borders |
| `--review-surface-text` | `--color-text` | Text color |
| `--review-surface-muted` | `--color-text-muted` | Secondary text |
| `--review-surface-accent` | `--color-interactive` | Focus/active |
| `--review-surface-pin-bg` | `--color-interactive` | Pin marker bg |
| `--review-surface-pin-text` | `#ffffff` | Pin marker text |
| `--review-surface-pin-size` | `28px` | Pin marker diameter |
| `--review-surface-resolved` | `--color-success` | Resolved pin color |

## Examples

### Annotating an empathy map
```html
<review-surface editable adapter="local" storage-key="sprint-4-empathy">
  <empathy-map src="/data/sarah.json"></empathy-map>
</review-surface>
```

### Annotating a browser window demo
```html
<review-surface editable author="Design Lead">
  <browser-window src="/demos/landing.html" shadow></browser-window>
</review-surface>
```

### Loading saved pins from JSON
```html
<review-surface src="/data/review-pins.json">
  <img src="/comp.png" alt="Design comp" />
</review-surface>
```
