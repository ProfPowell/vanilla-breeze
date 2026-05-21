---
title: reaction-bar Component Plan
description: GitHub-style emoji reaction picker — persistent chip bar attached to an item (comment, post, message), with a trigger that opens a curated palette of available reactions. Distinct from selection-menu (text-selection toolbar) and emoji-picker (full unicode browser).
tags:
  - web-components
  - specification
  - social
  - vanilla-breeze
date: 2026-05-14
status: draft
---

# reaction-bar Component Plan

## Why this exists

A persistent bar of emoji-reaction chips attached to an item (a GitHub comment, a social post, a chat message). Authors today wire this up by hand: a row of buttons + a "+" picker + ad-hoc toggle/count state. This component formalizes that pattern.

It is **not** a clone of three existing VB primitives that look superficially similar. The disambiguation matters because the wrong choice forces awkward code.

| Component | Trigger | Surface | Use when |
|-----------|---------|---------|----------|
| `selection-menu` | User selects text | Floating toolbar anchored to a `Range` (composes `pop-over`) | You want a contextual toolbar that appears on selection. |
| `emoji-picker` | Click a button | Dropdown with **full Unicode catalog** + search + categories + recent | The user could pick *any* emoji. |
| `star-rating` | Click a star | Inline stars (form-associated) | Single-value 1-N rating; submitted with a form. |
| `status-wc` | (passive) | Inline dot + label | Showing an entity's *current* state, not collecting input. |
| **`reaction-bar`** | Click trigger or chip | Inline horizontal bar of **curated** chips with counts + a "+" trigger opening a small palette | A discrete, curated set of reactions toggled per-item, with counts per option. |

The key tells:
- Reactions are **multi-select** per user (you can react with both 👍 and ❤️).
- The palette is **curated** (≈8 options), not the full emoji catalog.
- Each option carries a **count** and a per-user "did I react?" flag.
- Reactions trigger **backend mutations**, not form submission.

## Scope (in)

### The visible shape

```
[👍 3] [❤️ 1] [🎉]   [😀+]
 ──────────────       ────
 existing chips       trigger opens the palette popover
```

Two slots of content:

1. **Chips** — buttons for reactions that already have at least one user. Carry count + "is mine?" flag. Click to toggle (add/remove your reaction). When count drops to 0 the chip is removed.
2. **Palette** — buttons inside a `<template data-palette>` listing the *available* reactions. The component clones this into a popover when the trigger opens. Clicking a palette option emits the same toggle event.

### Two interaction paths

- **Add a NEW reaction** (reaction not yet in the bar): click trigger → palette opens → click an option → palette closes → bar emits `reaction-bar:toggle` with `action: "add"`.
- **Toggle an EXISTING reaction** (chip already in the bar): click the chip → bar emits `reaction-bar:toggle` with `action: "add"` (if you weren't reacting) or `action: "remove"` (if you were).

### State ownership

The component is **presentational**. Authors own the source of truth — counts, per-user state, persistence. The component:

- Renders chips from the slot DOM.
- Manages chip's `aria-pressed` based on `data-mine` attribute.
- Opens/closes the palette popover.
- Emits a single `reaction-bar:toggle` event.

After the network call resolves, authors update the DOM (or call an imperative method like `bar.setCount(name, count, mine)`) and the component re-renders the affected chip.

## Scope (out)

- **Backend sync** — authors hook the toggle event; the component never touches the network.
- **Real-time presence** of other users' reactions — that's the author's data layer.
- **Full Unicode emoji browsing** — that's `emoji-picker`; reaction-bar is a fixed small set.
- **Per-user popover** ("who reacted?") — flagged as a future enhancement; v1 only shows counts in `aria-label` ("👍, 3 reactions, you reacted").
- **Text-selection trigger** — that's `selection-menu`. reaction-bar is anchored in its DOM position.
- **Form participation** — reactions aren't form data. No `formAssociated`.
- **Custom emoji** / image reactions beyond emoji codepoints — defer until a use case emerges; v1 accepts any text content in the button (so authors *can* put an `<img>` in there, but it's not a first-class feature).

## HTML API

```html
<reaction-bar
  data-trigger-icon="..."     <!-- emoji or label for the trigger (default 😀) -->
  data-trigger-label="..."    <!-- aria-label for the trigger (default "Add reaction") -->
  data-disabled               <!-- read-only mode -->
>
  <!-- 0+ existing chips, authored as buttons -->
  <button data-reaction="thumbsup" data-count="3" data-mine>👍</button>
  <button data-reaction="heart"    data-count="1">❤️</button>

  <!-- Available reactions, cloned into the palette popover on first open -->
  <template data-palette>
    <button data-reaction="thumbsup">👍</button>
    <button data-reaction="thumbsdown">👎</button>
    <button data-reaction="laugh">😄</button>
    <button data-reaction="hooray">🎉</button>
    <button data-reaction="confused">😕</button>
    <button data-reaction="heart">❤️</button>
    <button data-reaction="rocket">🚀</button>
    <button data-reaction="eyes">👀</button>
  </template>
</reaction-bar>
```

### Chip attributes

- **`data-reaction`** (required): identifier used in events. Keep stable strings (`thumbsup`, `heart`) — these are what the backend stores.
- **`data-count`** (required): number ≥ 1. Chip with `data-count="0"` is removed on render.
- **`data-mine`** (optional, boolean): the current user has this reaction. Drives `aria-pressed="true"` and a "you reacted" CSS hook.

### Trigger

A single trigger button is auto-rendered by the component at the end of the bar (so authors don't have to remember to include it). Click opens the palette popover. Authors can override the icon via `data-trigger-icon`.

### Palette

The palette uses **`pop-over` composition** — same pattern as `selection-menu`, `combo-box`, `context-menu`, etc. Top-layer rendering, no z-index battles, light-dismiss handled by `pop-over`. The component clones the `<template data-palette>` content into the pop-over on first open.

## Programmatic API

```js
const bar = document.querySelector('reaction-bar');

// Update a chip's count + my-status (e.g., after server confirms)
bar.setCount('thumbsup', 4, { mine: true });

// Remove a reaction entirely (count to 0)
bar.setCount('thumbsup', 0);

// Open/close the palette programmatically
bar.openPalette();
bar.closePalette();
```

## Events

```js
bar.addEventListener('reaction-bar:toggle', (e) => {
  const { reaction, action, count, mine } = e.detail;
  // reaction: "thumbsup"
  // action:   "add" | "remove"
  // count:    current count BEFORE this toggle (so author can derive optimistic count)
  // mine:     whether the current user had this reaction BEFORE this toggle
  fetch(`/reactions/${reaction}`, { method: action === 'add' ? 'POST' : 'DELETE' })
    .then(r => r.json())
    .then(({ count }) => bar.setCount(reaction, count, { mine: action === 'add' }));
});
```

A single event covers both paths (chip toggle, palette pick). The detail tells you which.

Optional supporting events:
- `reaction-bar:palette-open`
- `reaction-bar:palette-close`

## Accessibility

- **Bar**: `role="toolbar"` with `aria-label="Reactions"` (or a more specific label set via `aria-label` on the host).
- **Chips**: `role="button"`, `aria-pressed` reflects `data-mine`. Each chip gets a derived `aria-label` like `"👍, 3 reactions, you reacted"` so screen-reader users hear count + own-state in one announcement.
- **Trigger**: `aria-haspopup="dialog"`, `aria-expanded` tracks open state.
- **Palette**: `role="dialog"` with a focus trap when open. Esc closes (handled by `pop-over`'s light-dismiss).
- **Keyboard inside the bar**: Arrow Left / Right to move between chips and trigger; Enter / Space to activate; Home / End to jump to first / last; Escape closes the palette.
- **Keyboard inside the palette**: Arrow keys to navigate options; Enter / Space to select.
- **Focus return**: after palette closes (whether by selection or Escape), focus returns to the trigger.

## CSS architecture

- Layer: `@layer components`.
- The bar is a flex row of chips + trigger.
- Chip styling: pill button with subtle background, hover/active states. `data-mine` adds an accent border or filled background to distinguish "you reacted".
- Counter font: `tabular-nums`.
- The palette popover lives in the top layer (via `pop-over`); its inner grid lays out reaction buttons in a single row.
- Tokens used: `--color-action-*`, `--color-surface-raised`, `--radius-full` (pill), `--space-*`, `--border-width-thin`.
- Print: chips render flat (no hover), trigger hidden.

```css
reaction-bar[data-disabled] button {
  pointer-events: none;
  opacity: 0.6;
}
reaction-bar button[data-mine] {
  /* themable accent for own reactions */
  border-color: var(--color-interactive);
  background: var(--color-action-subtle);
}
```

## Composition examples

```html
<!-- Under a comment -->
<article class="comment">
  <p>Looks great — ship it.</p>
  <reaction-bar aria-label="Reactions to comment 482">
    <button data-reaction="thumbsup" data-count="3" data-mine>👍</button>
    <button data-reaction="rocket"   data-count="2">🚀</button>
    <template data-palette>
      <button data-reaction="thumbsup">👍</button>
      <button data-reaction="thumbsdown">👎</button>
      <button data-reaction="laugh">😄</button>
      <button data-reaction="hooray">🎉</button>
      <button data-reaction="confused">😕</button>
      <button data-reaction="heart">❤️</button>
      <button data-reaction="rocket">🚀</button>
      <button data-reaction="eyes">👀</button>
    </template>
  </reaction-bar>
</article>

<!-- Read-only display (e.g., archived thread) -->
<reaction-bar data-disabled aria-label="Reactions">
  <button data-reaction="thumbsup" data-count="12">👍</button>
  <button data-reaction="heart"    data-count="3">❤️</button>
</reaction-bar>
```

The author wires reactions to a backend in their own JS. No additional VB wiring needed beyond importing the component.

## File structure

```
src/web-components/reaction-bar/
├── api.json
├── logic.js     — VBElement class; composes pop-over for the palette
├── styles.css
└── static.html  — minimal authoring demo (no JS dependencies for the structure)
```

Plus:

```
demos/examples/demos/reaction-bar-comment.html
  — demo showing chips + trigger + optimistic update via the toggle event
site/src/pages/docs/elements/web-components/reaction-bar.html
  — usage docs with adjacency table (vs selection-menu / emoji-picker / star-rating)
```

## Docs cross-referencing

The doc page must lead with the **adjacency disambiguation table** (see "Why this exists" above) so authors who reach here from "I want a reaction widget" pick the right primitive. The page should also link to:

- `selection-menu` — for text-selection floating toolbars
- `emoji-picker` — for full Unicode emoji selection
- `star-rating` — for single-value ratings

And `admin/future-wc.md` Social table row marked Shipped on completion.

## Implementation checklist

- [ ] Scaffold `src/web-components/reaction-bar/` (logic.js, styles.css, api.json, static.html)
- [ ] VBElement subclass; on setup: scan children for `button[data-reaction]` chips + `<template data-palette>`; auto-append trigger button
- [ ] Render chip aria-pressed from `data-mine`; derive aria-label including count + own-state
- [ ] Compose `pop-over` for the palette surface (mirrors selection-menu / combo-box pattern)
- [ ] Click on chip → emit `reaction-bar:toggle` with current count + mine state
- [ ] Click on palette option → close palette; if a chip with that reaction exists, defer to chip toggle path; else emit toggle with `action: "add"` and let author render the new chip via `setCount`
- [ ] Imperative `setCount(name, count, { mine })` — single source for chip mutation
- [ ] Keyboard: Arrow Left/Right between chips and trigger; Enter/Space activate; Esc closes palette
- [ ] Open/close palette events: `reaction-bar:palette-open` / `:palette-close`
- [ ] Register in `src/web-components/index.js` (full bundle — this is not a core primitive)
- [ ] Register CSS in `src/web-components/index.css`
- [ ] Demo at `demos/examples/demos/reaction-bar-comment.html` with mocked backend (Promise resolves with a count)
- [ ] Doc page with adjacency table; cross-link from `selection-menu` and `emoji-picker` doc pages ("not what you want? see `reaction-bar`")
- [ ] Update `admin/future-wc.md` Social row → Shipped
- [ ] Smoke-test in Chrome on `vb.test`: add new reaction via palette, toggle existing chip on/off, keyboard nav, palette light-dismiss on Esc + outside-click

## Open questions

- **Who-reacted hover/popover** — Slack and GitHub both show a "who reacted" tooltip on chip hover. Defer to a future enhancement that composes `tool-tip` around each chip on opt-in (`data-show-users`). Out of scope for v1.
- **Custom-emoji support** — for now, slot content can include `<img>` instead of a Unicode codepoint. No first-class API for custom emoji catalog.
- **Long lists of chips** — what if an item collects 30 distinct reactions? Wrap with flex-wrap; no overflow truncation logic in v1. Reconsider if real authors hit it.
- **Optimistic updates vs author-managed** — v1 stays author-managed (no built-in optimistic increment). Cleaner for race conditions. Can add `data-optimistic` later if pattern emerges.

## References

- `src/web-components/selection-menu/logic.js` — `pop-over` composition pattern to mirror
- `src/web-components/emoji-picker/logic.js` — adjacent primitive (different shape)
- `src/web-components/star-rating/logic.js` — single-value rating sibling (form-associated)
- `src/web-components/pop-over/` — palette surface
- `admin/future-wc.md` — Social section, reaction-bar row
- GitHub's reactions UX (the screenshot reference): compact bar of chips + a single trigger that opens a curated palette.
