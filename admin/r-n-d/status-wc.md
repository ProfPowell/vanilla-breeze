---
title: status-wc Component Plan
description: Pulsing/steady visual indicator for entity state — live, online, recording, streaming, idle, offline, error. Pairs with the existing `status-message` custom element (visual + textual).
tags:
  - web-components
  - specification
  - vanilla-breeze
date: 2026-05-14
status: draft
---

# status-wc Component Plan

## Why this exists

A tiny visual primitive showing the *current ongoing state* of an entity: a stream, a user, a process, a service, a connection. Authors today reach for ad-hoc `<span class="dot">` patterns plus inline keyframes; this component formalizes that pattern with VB theme tokens, a reduced-motion fallback, and a small accessible API.

Adjacent VB primitives — none of these collide:

| Component | What it does | Why it's not this |
|-----------|--------------|-------------------|
| `status-message` (custom element) | Renders a one-shot status message ("Form submitted") in prose flow. | Textual announcement, not a persistent state indicator. |
| `notification-wc` | Banner + panel for notifications with stewardship. | Action-bearing, not a passive badge. |
| `toast-msg` | Transient toast feedback. | Time-limited, dismisses; not a steady state. |
| `score-card` | KPI tile with title/value/change. | Heavier surface; tracks a metric, not a state. |
| `live-indicator` (wishlist name) | — | Renamed to `status-wc`; "live" is one variant, not the whole component. |

## Scope (in)

A single small primitive that supports several use cases via a `data-variant` attribute:

```html
<!-- Broadcast / media -->
<status-wc data-variant="live">Live</status-wc>
<status-wc data-variant="recording">REC</status-wc>
<status-wc data-variant="streaming">Streaming</status-wc>

<!-- Presence -->
<status-wc data-variant="online">Available</status-wc>
<status-wc data-variant="away">Away</status-wc>
<status-wc data-variant="busy">Do not disturb</status-wc>
<status-wc data-variant="offline">Offline</status-wc>

<!-- System / process state -->
<status-wc data-variant="running">Running</status-wc>
<status-wc data-variant="paused">Paused</status-wc>
<status-wc data-variant="stopped">Stopped</status-wc>
<status-wc data-variant="error">Error</status-wc>

<!-- Bare dot (no label) -->
<status-wc data-variant="online" aria-label="John is online"></status-wc>
```

Built-in variants ship with sensible defaults — color, pulse-or-steady, semantic meaning. Authors can override via theme tokens or add their own variants by extending the CSS map (see *Adding custom variants* below).

### Variant defaults

| Variant | Color token | Animation | Semantic intent |
|---------|-------------|-----------|-----------------|
| `live`, `recording` | `--color-error` (red) | Pulse | Active broadcast / recording |
| `streaming` | `--color-warning` (amber) | Pulse | In-flight data stream |
| `online` | `--color-success` (green) | Steady | Available / reachable |
| `away` | `--color-warning` (amber) | Steady | Idle but reachable |
| `busy` | `--color-error` (red) | Steady | Reachable, do not disturb |
| `offline` | `--color-muted` (gray) | Steady | Unreachable |
| `running` | `--color-success` (green) | Pulse | Active process |
| `paused` | `--color-warning` (amber) | Steady | Suspended |
| `stopped` | `--color-muted` (gray) | Steady | Halted |
| `error` | `--color-error` (red) | Pulse | Failed |

Pulse animation uses a single `@keyframes` with a CSS-only `prefers-reduced-motion: reduce` override that collapses to steady. No JS animation.

## Scope (out)

- **State-change history / activity log** — that's `notification-wc` or a future `activity-feed`.
- **Countdowns / timers** — separate primitive; this only shows current state.
- **Backend presence sync** — author wires their own data source; the component is presentational and updates via attribute changes.
- **Action buttons** — not a button. If clicking should do something, wrap or compose with a `<button>` / `<a>`. Purely informational role.
- **Composite cards** — for "avatar + status + label" Slack-style composites, use `<user-avatar>` + `<status-wc>` together. Don't conflate.
- **Tooltip-on-hover semantics** — that's `tool-tip` composed externally if needed.

## HTML API

```html
<status-wc
  data-variant="..."       <!-- one of the built-in variants OR a custom name -->
  data-size="..."          <!-- xs | sm | md (default) | lg -->
  data-position="..."      <!-- before (default) | after | only -->
  data-pulse="..."         <!-- on | off — force/override animation -->
  aria-label="..."         <!-- required when no slot content -->
>
  Optional label text
</status-wc>
```

### Attribute behaviour

- **`data-variant`** — required. Determines color + default animation + meaning. Unrecognized variant falls back to muted/steady with a console warning.
- **`data-size`** — controls dot diameter (`xs` 6px, `sm` 8px, `md` 10px, `lg` 14px) and label font scale.
- **`data-position`** — where the dot sits relative to the label. `only` hides the label visually but keeps it for screen readers (with `aria-label` as the announcement source if no slot text).
- **`data-pulse`** — explicit override of the variant's default animation. Useful when you want `online` to pulse during a join-call moment, or to silence `live` for a static screenshot.

### Slot content

Label text is **slotted as the only child** (per `feedback_content_vs_state_attrs` — content goes in the slot, state/variant goes in attributes). When the slot is empty, `aria-label` is required and is announced in place of slot text.

### Programmatic API

```js
const s = document.querySelector('status-wc');
s.dataset.variant = 'offline'; // attribute change re-renders; emits 'status-wc:change'
```

A `status-wc:change` event fires when `data-variant` mutates, for downstream listeners (e.g., page-tools wanting to mirror state).

## Accessibility

- **Role**: defaults to `role="status"` so screen readers announce the current state.
- **`aria-live`**: `polite` by default. Authors can set `data-live="off"` to suppress announcements (e.g., when the indicator is decorative in a dashboard with many statuses).
- **Label source**:
  - If slot has text content, that's the accessible name.
  - Else, `aria-label` is required and used.
  - Component logs a console warning in dev when neither is provided.
- **`prefers-reduced-motion: reduce`**: pulse animation collapses to a steady dot — color still conveys state.
- **Color independence**: never color-only. Each variant ships a default text label so meaning carries without color perception. `data-position="only"` (bare dot) keeps `aria-label` for assistive tech.

## CSS architecture

- Layer: `@layer components`.
- Self-contained `:host`-style rules; no global selectors.
- Variant map driven by a single `[data-variant="..."]` attribute selector block — easy to extend.
- Pulse keyframe defined once; variants opt in via `animation: status-pulse var(--status-pulse-duration, 2s) ease-in-out infinite`.
- Tokens used: `--color-error`, `--color-warning`, `--color-success`, `--color-muted`, `--space-3xs`/`--size-xs` for padding, `--radius-full` for the dot.
- Author override surface:
  ```css
  status-wc {
    --status-dot-size: 12px;
    --status-pulse-duration: 1.5s;
    --status-gap: var(--size-xs);
  }
  status-wc[data-variant="custom-priority"] {
    --status-dot-color: var(--color-accent-purple);
    --status-animation: status-pulse 1s ease-in-out infinite;
  }
  ```

### Adding custom variants

```css
status-wc[data-variant="deploying"] {
  --status-dot-color: var(--color-accent-blue);
  --status-animation: status-pulse 1.5s ease-in-out infinite;
}
```

No JS change needed. The component is presentational — it just reflects `data-variant` to CSS.

## Composition examples

```html
<!-- Header live badge -->
<header>
  <h1>Today's keynote</h1>
  <status-wc data-variant="live">Live</status-wc>
</header>

<!-- User row -->
<layout-cluster>
  <user-avatar src="..." name="Ada Lovelace"></user-avatar>
  <strong>Ada Lovelace</strong>
  <status-wc data-variant="online" data-position="only" aria-label="Online"></status-wc>
</layout-cluster>

<!-- Service health row -->
<dl>
  <dt>API</dt><dd><status-wc data-variant="running">Healthy</status-wc></dd>
  <dt>Worker queue</dt><dd><status-wc data-variant="paused">Drained</status-wc></dd>
  <dt>Webhook delivery</dt><dd><status-wc data-variant="error">Failing</status-wc></dd>
</dl>

<!-- Bare dot in compact lists -->
<status-wc data-variant="recording" data-position="only" aria-label="Recording in progress"></status-wc>
```

## File structure

```
src/web-components/status-wc/
├── api.json
├── logic.js       — VBElement subclass; reads data-variant + announces changes
├── static.html    — minimal demo with each variant
└── styles.css     — variant map + pulse keyframe + reduced-motion fallback
```

Plus:

```
demos/examples/demos/status-wc-variants.html
  — comprehensive demo: broadcast, presence, system, custom-variant extension
site/src/pages/docs/elements/web-components/status-wc.html
  — usage docs
```

## Docs cross-referencing

The doc page must explicitly point at adjacent primitives so authors pick the right one:

1. **Lead with the disambiguation table** (the adjacency table at the top of this plan) — `status-message` vs `notification-wc` vs `toast-msg` vs `status-wc`.
2. **Reference the form-association doc** if anyone reaches for it as an input — it's not one; clarify.
3. **Cross-link** from `notification-wc` and `status-message` doc pages: "For passive state indication, see `<status-wc>`."
4. **Update `admin/future-wc.md`** Social table row on ship (mark Shipped, link the doc page). The wishlist name `live-indicator` becomes a redirect/note pointing at `status-wc`.

## Implementation checklist

- [ ] Scaffold `src/web-components/status-wc/` (logic.js, styles.css, api.json, static.html)
- [ ] Build the variant map in CSS (12 built-in variants per the table above)
- [ ] Implement `status-pulse` keyframe + `prefers-reduced-motion` fallback
- [ ] Wire `data-variant` change observation → emit `status-wc:change`, re-render display
- [ ] ARIA: `role="status"`, `aria-live="polite"`, label resolution (slot > aria-label > console warn)
- [ ] `data-size`, `data-position`, `data-pulse` attributes with documented defaults
- [ ] Custom-variant extension surface (CSS custom-property pattern documented)
- [ ] Register in `src/web-components/core.js` (small, broadly useful — belongs in core)
- [ ] Register CSS in `src/web-components/core.css` + `src/web-components/index.css`
- [ ] Demo file (`demos/examples/demos/status-wc-variants.html`) with each category
- [ ] Doc page (`site/src/pages/docs/elements/web-components/status-wc.html`)
- [ ] Add to `webComponents.js`, `elements.js`, `navigation.json` under Interaction (or wherever brand-mark / icon-wc live — adjacency by "small primitive")
- [ ] Update `admin/future-wc.md` — mark `live-indicator` → shipped as `status-wc`
- [ ] Update `admin/syntax.md` if a `data-variant` row is appropriate at the syntax-catalog level (probably yes given how many components use it)
- [ ] Visual smoke-test in Chrome (vb.test): verify each variant renders with correct color, pulse where expected, reduced-motion collapses

## Open questions

- **Custom variants without CSS authoring** — should `data-color` and `data-pulse-duration` be promoted to first-class attributes for one-off variants without needing a CSS rule? v1: no — variants should be discoverable in CSS for theming consistency. Reconsider if pattern emerges.
- **`role="status"` vs `role="img"`** — `status` triggers polite announcements on change. For decorative dots (avatar accent), authors want neither announcement nor an extra image in the accessibility tree. Resolve via `data-live="off"` flipping the role/aria-live; document the choice.
- **Animation in iframes / printed pages** — pulse should pause in print stylesheets and offscreen. Print CSS: collapse to steady. Confirm during build.

## References

- `src/web-components/notification-wc/` — notification-tier primitive (adjacent, not overlapping)
- `src/custom-elements/status-message/` — textual sibling (different role)
- `src/web-components/toast-msg/` — transient feedback (different lifecycle)
- `admin/future-wc.md` Social section — `live-indicator` wishlist row
- MDN: [ARIA `role="status"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role)
- MDN: [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
