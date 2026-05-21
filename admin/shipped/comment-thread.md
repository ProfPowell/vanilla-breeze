---
title: comment-thread Component Plan
description: Container for a threaded comment discussion. Author renders comments as `<article data-comment>` children; component decorates them with relative time, reply controls, and ARIA. Composes `<comment-box>` (reply form), `<reaction-bar>` (per-comment reactions), and `<markdown-viewer>` (body rendering).
tags:
  - web-components
  - specification
  - social
  - vanilla-breeze
date: 2026-05-14
status: draft
---

# comment-thread Component Plan

## Why this exists

A persistent threaded-discussion container. Distinct from chat (which is real-time and ephemeral) and from `<comment-wc>` (which is a single inline action button used inside `<selection-menu>`). This component is the **collection** primitive — the thing you mount once and feed comment data to.

| Adjacent | Why not this |
|----------|--------------|
| `<comment-wc>` | Inline action button used by `<selection-menu>` for adding a comment to selected text. Single-comment, not a thread. We **keep this stub** — `<comment-thread>` is additive, not a rename. |
| `<comment-box>` | The reply / new-comment form. `<comment-thread>` consumes it as a template. |
| `<chat-thread>` (custom) | Chat-shaped: real-time, often grouped by sender, ephemeral. Comments are persistent and threaded. |
| `<markdown-viewer>` | Renders markdown — used inside each comment's body. |

## Author API

Author renders comments as `<article data-comment>` children with attributes for the metadata (so the data is in the DOM and SSR-friendly). Replies use `data-parent` for nesting.

```html
<comment-thread aria-label="Comments on issue 482">
  <article data-comment id="c1" data-author="Ada Lovelace" data-time="2026-05-14T10:00:00Z" data-mine>
    <div data-comment-body>Looks great — ship it.</div>
    <reaction-bar>
      <button data-reaction="thumbsup" data-count="3" data-mine>👍</button>
      <template data-palette>
        <button data-reaction="thumbsup">👍</button>
        <button data-reaction="heart">❤️</button>
        <button data-reaction="rocket">🚀</button>
      </template>
    </reaction-bar>
  </article>

  <article data-comment id="c2" data-author="Bob" data-time="2026-05-14T11:00:00Z" data-parent="c1">
    <div data-comment-body>Agreed!</div>
  </article>

  <article data-comment id="c3" data-author="Carol" data-time="2026-05-14T11:30:00Z">
    <div data-comment-body>One nit: ...</div>
  </article>

  <!-- Reply-form template, cloned into the thread when a reply button is clicked -->
  <template data-reply-form>
    <comment-box submit-label="Reply" data-show-cancel></comment-box>
  </template>
</comment-thread>
```

### Comment attributes (on `<article data-comment>`)

| Attribute | Purpose |
|-----------|---------|
| `id` | Stable comment id (used in events, parent references) |
| `data-author` | Display name (string) |
| `data-author-href` | Optional link to author profile |
| `data-author-avatar` | Optional URL for avatar (renders `<user-avatar>`) |
| `data-time` | ISO-8601 timestamp; component renders relative-time via VB's `time-relative` lib |
| `data-mine` | Current user authored this — enables Edit / Delete actions |
| `data-parent` | Id of parent comment for nested replies |
| `data-edited` | Optional ISO timestamp showing last edit; renders "(edited)" badge |

### Comment body

A direct `<div data-comment-body>` child. Authors put **rendered HTML** here (e.g., the output of `<markdown-viewer>` or server-side markdown rendering). The component does not render markdown itself — that's the author's choice (server-side, client-side, or none).

### Auto-rendered chrome

The component decorates each comment with:
- A `<header>` containing author (linked if `data-author-href`), avatar (if `data-author-avatar`), and a relative timestamp via `time-relative`
- A `<footer>` with action buttons:
  - **Reply** (always, unless `data-disabled` on the thread)
  - **Edit** + **Delete** (only if `data-mine`)
- Threaded indentation via CSS `[data-parent]` selector and a `--comment-depth` custom prop

## Events

All bubble. Detail shape includes `commentId` to identify which comment.

- `comment-thread:reply` — `{ parentId, value }` when the reply form is submitted
- `comment-thread:edit-request` — `{ commentId, value }` when Edit is clicked (author renders an inline editor)
- `comment-thread:edit-submit` — `{ commentId, value }` when the inline editor submits
- `comment-thread:delete-request` — `{ commentId }` when Delete is clicked (author confirms + deletes)
- Reactions bubble via `reaction-bar:toggle` (already correct shape; thread doesn't intercept)

## Programmatic API

```js
const thread = document.querySelector('comment-thread');

// Add a new comment from server response
thread.addComment({
  id: 'c4',
  author: 'Dan',
  time: '2026-05-14T12:00:00Z',
  body: '<p>Hello</p>',
  parentId: 'c1',  // optional
  mine: true,
});

// Update existing
thread.updateComment('c2', { body: '<p>Edited.</p>', edited: '2026-05-14T11:45:00Z' });

// Remove
thread.removeComment('c3');
```

## Accessibility

- Thread: `role="region"` with the host's `aria-label`
- Each comment: `role="article"` (native), with an accessible name derived from author + time
- Reply form: focus moves into the editor when shown; Esc cancels (closes the form)
- Threaded depth communicated via CSS indentation + `aria-level` on nested comments (matches WAI-ARIA tree comment patterns)
- Edit / Delete buttons: `aria-label` includes target ("Edit your comment", "Delete your comment")
- Time badges: `<time datetime="...">` + relative text inside; full timestamp on hover via `title`

## Composition

- **Inside an article page**: drop the thread under the main content with comments rendered server-side
- **In a comment system**: hook the events to a backend; call `addComment` / `updateComment` / `removeComment` on responses
- **Per-comment reactions**: each comment can include its own `<reaction-bar>` child — works out of the box, the thread doesn't manage reaction state

## CSS architecture

- Layer: `@layer components`
- Comments laid out as a vertical stack with depth-based inset
- Author header uses `<layout-cluster>` semantics (avatar + name + time inline)
- Reply form animates in/out using `details`-style scaling or a simple slide
- Tokens: `--color-surface`, `--color-border`, `--space-*`, `--radius-m`, `--color-action-*`

## File structure

```
src/web-components/comment-thread/
├── api.json
├── logic.js
├── styles.css
└── static.html
```

## Implementation checklist

- [ ] Scaffold; VBElement subclass
- [ ] On setup, scan `:scope > article[data-comment]`; decorate each with header/footer/actions
- [ ] Wire `<time-relative>` for timestamps (use existing lib)
- [ ] Reply button toggles a cloned `<template data-reply-form>` form below the comment
- [ ] Edit / Delete buttons (only when `data-mine`) emit request events
- [ ] Threaded indentation via `data-parent` + CSS `--comment-depth` custom prop
- [ ] `addComment` / `updateComment` / `removeComment` imperative API
- [ ] Form submit dispatches `comment-thread:reply` / `:edit-submit` with `{ parentId|commentId, value }`
- [ ] Register in `src/web-components/index.js` + `index.css` (full bundle, not core)
- [ ] Demo at `demos/examples/demos/comment-thread-issue.html` showing nested replies + reactions + mocked backend
- [ ] Doc page with adjacency table (vs `comment-wc` stub, `chat-thread`, `comment-box`)
- [ ] Cross-link from `comment-wc` doc page ("for full threaded discussions, see `comment-thread`")

## Open questions

- **Inline edit mode** — does the component render an inline `<comment-box>` in place of the body, or does it just emit `edit-request` and let the author swap the body? **v1: emit + author handles** (mirrors reaction-bar's presentational philosophy). Add inline-edit convenience in v2 if requested.
- **Pagination / load-more** — defer to author. Component will cleanly handle DOM insertion via `addComment`.
- **Sort order** — author owns. Component renders in DOM order.

## References

- `src/web-components/comment-wc/` — inline single-comment action (different role; we keep it)
- `admin/r-n-d/comment-box.md` — reply-form dependency
- `src/web-components/reaction-bar/` — per-comment reactions
- `src/lib/time-relative.js` — relative-time formatting
