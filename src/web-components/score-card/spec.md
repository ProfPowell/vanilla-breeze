---
title: "Score Card Specification"
component: score-card
version: 0.1.0
status: draft
---

# Score Card

A single KPI tile: title, headline value, optional change indicator, optional sparkline, optional supporting copy. The atom of dashboards and analytics summaries.

## Table of Contents

- [Purpose](#purpose)
- [Static HTML Form](#static-html-form)
- [Enhanced Form](#enhanced-form)
- [Slots](#slots)
- [Attributes and API](#attributes-and-api)
- [Composition with chart-wc](#composition-with-chart-wc)
- [Drill-down (link wrapping)](#drill-down-link-wrapping)
- [Failure Modes](#failure-modes)
- [Accessibility](#accessibility)
- [CSS Tokens](#css-tokens)
- [Examples](#examples)
- [Relationship to the stats pattern](#relationship-to-the-stats-pattern)

## Purpose

Dashboards and analytics surfaces repeatedly need to show a single metric in a uniform tile: a title, a big number, a delta against a prior period, sometimes a small trend chart, sometimes an icon, sometimes a click-through to detail. The current `/docs/patterns/data/stats/` recipe handles this with hand-written `<figure>/<figcaption>/<data>` markup. That works, but every consumer re-implements layout, trend coloring, sparkline sizing, and skeleton loading. `<score-card>` packages that recipe as a single composable element while preserving the semantic figure structure underneath.

## Static HTML Form

The pre-upgrade structure is the existing stats pattern, slotted into the host element. It renders correctly without JS or CSS.

```html
<score-card trend="up">
  <figure>
    <figcaption slot="title">Total Users</figcaption>
    <data slot="value" value="24521">24,521</data>
    <small slot="change" data-trend="up">+12.5% vs last month</small>
    <figcaption slot="description">Active in last 30 days</figcaption>
  </figure>
</score-card>
```

Without JS the user sees a normal figure with caption and data. With CSS only, host styles apply but slots are not projected — the figure renders inline. With JS, the shadow tree projects each slot into the tile layout.

## Enhanced Form

```html
<score-card trend="up" tone="success" layout="stack">
  <span slot="title">Total Users</span>
  <data slot="value" value="24521">24,521</data>
  <small slot="change">
    <data value="0.125">+12.5%</data> vs last month
  </small>
  <chart-wc slot="sparkline"
            data-type="line"
            data-values='[100,120,118,140,160,180]'
            data-legend="false"
            data-tooltip="false"></chart-wc>
  <span slot="description">Active in last 30 days</span>
  <icon-wc slot="icon" name="users"></icon-wc>
</score-card>
```

Wrapped as a drill-down link:

```html
<a href="/dashboard/users">
  <score-card trend="up">…</score-card>
</a>
```

## Slots

| Slot          | Purpose                                                | Required |
|---------------|--------------------------------------------------------|----------|
| `title`       | Metric label                                           | yes      |
| `value`       | Headline number (default slot also accepts `<data>`)   | yes      |
| `change`      | Delta indicator (recommend nested `<data>` for value)  | no       |
| `sparkline`   | Trend visualisation (any element; `<chart-wc>` recommended) | no   |
| `description` | Supporting context line                                | no       |
| `icon`        | Brand/category icon                                    | no       |

Per VB convention, **content goes in slots, state and config go in attributes**. The component is intentionally unopinionated about what fills each slot — pass an `<svg>`, `<canvas>`, or `<chart-wc>` for the sparkline; pass any inline element for value if `<data>` doesn't fit.

## Attributes and API

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `trend`   | enum: `up` \| `down` \| `flat` | none | Drives change-indicator color and exposes `:state(trend-up\|trend-down\|trend-flat)` |
| `tone`    | enum: `default` \| `success` \| `warning` \| `error` \| `info` | `default` | Optional accent color (icon/border) |
| `layout`  | enum: `stack` \| `cluster` \| `compact` | `stack` | Tile composition: vertical stack, icon-cluster row, or dense |
| `loading` | boolean | absent | Skeleton state via `:state(loading)` |

No `href` attribute. Drill-down is achieved by wrapping the element in `<a>` (see below).

### CustomStateSet hooks

Internal states exposed via `ElementInternals.states` for CSS `:state()` targeting:

- `trend-up`, `trend-down`, `trend-flat` (mirrors `trend` attribute)
- `loading`
- `interactive` (set when the element is inside an `<a>` ancestor)

Following the project's `:state()` adoption convention from the recent jdsv work — `:state()` for internal state, `data-*` attributes for public configuration knobs.

### Properties / Methods

The component is value-agnostic — all data lives in the DOM. No imperative `data` setter; consumers update slotted content directly. The shadow tree observes slot changes and re-applies layout if needed.

## Composition with chart-wc

The sparkline slot accepts any element. `<chart-wc>` is the recommended partner because:

- It already handles line/area rendering with theme tokens.
- It degrades to a `<table>` for screen readers and no-JS.
- It handles its own resize observation.

`<score-card>` provides a sized container via `--score-card-sparkline-height` (default `40px`) and forwards it to the slot region. It does **not** wrap chart-wc, configure it, or pass data through. Consumers compose directly:

```html
<score-card>
  …
  <chart-wc slot="sparkline" data-type="area" data-values="[…]"></chart-wc>
</score-card>
```

This keeps chart-wc's API surface in one place and avoids a parallel sparkline API.

## Drill-down (link wrapping)

To make a tile clickable, wrap it in an anchor:

```html
<a href="/dashboard/users" class="score-card-link">
  <score-card>…</score-card>
</a>
```

When `<score-card>` upgrades, it walks ancestors looking for the nearest `<a>`. If found, it sets the `interactive` state, allowing CSS to apply hover/focus affordances (cursor, surface lift, focus ring) **on the score-card itself** even though focus actually lives on the anchor.

The anchor receives keyboard focus and the click — no synthetic key handling, no role override, no tabindex juggling. The whole tile is a single accessible link.

CSS pattern:

```css
:host(:state(interactive)) {
  cursor: pointer;
  transition: transform 120ms, box-shadow 120ms;
}
:host(:state(interactive)):hover { transform: translateY(-2px); }
a:has(score-card):focus-visible { outline: 2px solid var(--color-focus-ring); }
```

## Failure Modes

### No JavaScript

- **Behavior:** Slotted figure renders inline using its native semantics. Trend color comes from `data-trend` on `<small>` (existing stats pattern). Sparkline `<chart-wc>` falls back to its own table.
- **Implementation:** Static fallback structure mirrors the `/docs/patterns/data/stats/` recipe; no upgrade needed for content to be readable.
- **Acceptable:** Yes. The information is fully available; only the tile chrome (border, padding, sparkline sizing) is absent.

### No CSS

- **Behavior:** Stacked semantic content — figcaption, data, small, optional sparkline — readable top to bottom.
- **Implementation:** No CSS depends on shadow DOM projection. Slots project, but visual layout collapses gracefully.
- **Acceptable:** Yes.

### Upgrade Delay

- **Behavior:** Light-DOM children remain visible because the static fallback IS the figure pattern. No layout shift on upgrade beyond grid placement.
- **Implementation:** Element's static.html structure matches what the rendered shadow projects.
- **Acceptable:** Yes. May see a brief moment where padding/border are missing.

### Keyboard Only

- **Tab order:** When wrapped in `<a>`, the anchor takes focus. Without a wrapper, the tile is non-interactive and skipped.
- **Key bindings:** None — the anchor handles Enter natively.
- **Acceptable:** Yes.

### Screen Reader

- **ARIA roles:** None added; semantics come from the slotted `<figure>`, `<figcaption>`, `<data>`, and `<small>`.
- **Live regions:** None by default. If consumers update values dynamically and want announcements, they can wrap the relevant slot content in `aria-live="polite"`.
- **Announced state changes:** Trend changes are announced when the change-indicator text content updates inside a live region (consumer's choice).
- **Tested with:** VoiceOver (macOS), NVDA (Windows).
- **Acceptable:** Yes — relies on native semantics, no custom widget role.

### RTL / i18n

- **Behavior:** Layout uses logical properties (`padding-inline`, `margin-block`) so it mirrors. Sparkline does not auto-mirror (data direction is consumer's call).
- **CSS approach:** Logical properties throughout; no `left/right` hardcoding.
- **Acceptable:** Yes.

## Accessibility

WCAG 2.1 AA targets:

- Color is never the sole carrier of trend information — change indicator includes `+`/`-` sign and direction word in copy.
- Contrast for `tone` accents resolved from theme tokens (already AA in light + dark).
- Focus ring on the wrapping anchor uses `--color-focus-ring`, never suppressed.
- Skeleton loading state respects `prefers-reduced-motion`: shimmer animation falls back to a static muted background.

## CSS Tokens

| Token | Default | Purpose |
|-------|---------|---------|
| `--score-card-padding` | `var(--size-l)` | Tile internal padding |
| `--score-card-radius` | `var(--radius-m)` | Corner radius |
| `--score-card-gap` | `var(--size-s)` | Gap between rows in stack layout |
| `--score-card-value-size` | `var(--font-size-3xl)` | Headline number size |
| `--score-card-value-weight` | `var(--font-weight-bold)` | Headline number weight |
| `--score-card-sparkline-height` | `40px` | Reserved height for sparkline slot |
| `--score-card-surface` | `var(--color-surface)` | Background |
| `--score-card-border` | `1px solid var(--color-border-subtle)` | Border |
| `--score-card-tone-accent` | resolved from `tone` attribute | Accent color (icon, optional border-inline-start) |

## Examples

### Minimal

```html
<score-card>
  <span slot="title">Orders</span>
  <data slot="value" value="1429">1,429</data>
</score-card>
```

### With change indicator

```html
<score-card trend="down">
  <span slot="title">Bounce Rate</span>
  <data slot="value" value="0.423">42.3%</data>
  <small slot="change"><data value="-0.031">-3.1%</data> vs last month</small>
</score-card>
```

### With sparkline (chart-wc composition)

```html
<score-card trend="up">
  <span slot="title">Revenue</span>
  <data slot="value" value="48352">$48,352</data>
  <small slot="change"><data value="0.082">+8.2%</data> from last month</small>
  <chart-wc slot="sparkline" data-type="area"
            data-values="[42000,43500,44200,45800,47100,48352]"></chart-wc>
</score-card>
```

### Dashboard grid

```html
<layout-grid data-layout-min="240px" data-layout-gap="m">
  <a href="/users"><score-card>…</score-card></a>
  <a href="/revenue"><score-card>…</score-card></a>
  <a href="/orders"><score-card>…</score-card></a>
  <a href="/conversion"><score-card>…</score-card></a>
</layout-grid>
```

### Loading skeleton

```html
<score-card loading>
  <span slot="title">Total Users</span>
</score-card>
```

## Relationship to the stats pattern

The `/docs/patterns/data/stats/` recipe stays for now and will be cross-linked from the score-card doc page as the no-JS / no-component baseline. After `<score-card>` ships and is adopted in `analytics-panel`, dashboard demos, and the docs home, we revisit:

- If every consumer ends up using `<score-card>`, demote the pattern page to a single "semantic fallback" note inside the score-card doc and remove the recipe page.
- If consumers continue to reach for the raw figure pattern (e.g. for static content sites without the JS bundle), keep both and document the trade-off explicitly.

The decision is captured as a follow-up beads task, evaluated after at least three real adoptions.
