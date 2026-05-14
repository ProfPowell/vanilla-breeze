---
title: comment-box Component Plan
description: Standalone comment form — markdown editor + submit/cancel buttons. Form-associated. Composes existing `<markdown-editor>` for the input experience. Presentational; author owns submission.
tags:
  - web-components
  - specification
  - social
  - vanilla-breeze
date: 2026-05-14
status: draft
---

# comment-box Component Plan

## Why this exists

A small, opinionated comment-form primitive that composes `<markdown-editor>` for the editing experience and adds the canonical Comment / Cancel button layout. Used standalone for top-level comment forms or as the **reply-form template** inside `<comment-thread>`.

| Adjacent | Why not this |
|----------|--------------|
| `<markdown-editor>` | The raw editor — no submit/cancel chrome, no form participation. |
| `<form-field>` | Generic input wrapper — doesn't know about markdown or comment patterns. |
| `<chat-input>` | Chat-shaped (single line + send), not a paragraph comment box. |

## Scope

**In:**
- Wraps `<markdown-editor>` inside a `<form>`-associated element
- Submit + optional Cancel buttons, both labelled, both keyboard-focusable
- Form participation via `ElementInternals` (`formAssociated=true`, `setFormValue`)
- Min / max length validation
- Optional toolbar slot for custom action buttons (attach file, mention, etc.)
- Auto-resize textarea behavior inherits from `<markdown-editor>`
- Clears on submit (unless author preventDefault())

**Out:**
- Markdown rendering — that's `<markdown-viewer>` (used by `<comment-thread>`)
- File uploads — author wires their own toolbar slot
- @mention autocomplete / smart suggestions — defer to v2
- Multi-step "submit + sign" flows — out of scope
- Edit-vs-new mode distinction — `<comment-thread>` handles that by mounting a comment-box pre-filled with the edited body

## HTML API

```html
<comment-box
  name="..."              <!-- form field name; submits the markdown source -->
  placeholder="..."       <!-- editor placeholder text -->
  submit-label="Comment"  <!-- default "Comment"; "Reply" for threads -->
  cancel-label="Cancel"
  data-show-cancel        <!-- shows the Cancel button -->
  data-min-length="..."   <!-- validation -->
  data-max-length="..."
  required
  disabled
  value="..."             <!-- preset content (e.g., for edit mode) -->
>
  <!-- Optional toolbar slot -->
  <button slot="toolbar" type="button" data-action="attach">📎</button>
</comment-box>
```

### Events

- `comment-box:submit` — detail: `{ value }`. Bubbles. Cancellable via `preventDefault()` (if author cancels, value is NOT cleared, useful for client-side validation).
- `comment-box:cancel` — detail: `{ value }`. Bubbles.
- `comment-box:input` — every keystroke. Detail: `{ value, length }`.

### Programmatic API

```js
const box = document.querySelector('comment-box');
box.value;          // current markdown source
box.value = '...';  // set (useful for edit mode)
box.focus();        // focuses the editor
box.clear();        // clears + emits comment-box:input
```

## Accessibility

- Renders a `<form>` semantically (or `role="form"` if not a `<form>` element to avoid nested-form issues — verify during impl)
- Submit button: `type="submit"` inside the inner form so Enter on the editor still works (markdown-editor's own keyboard handling)
- Cancel button: `type="button"`
- Toolbar slot: `role="toolbar"`
- Required state announced via `aria-required`
- Validation messages via `<output>` near the submit row (form-field-style)

## CSS architecture

- Layer: `@layer components`
- Inner layout: editor on top, action row below (toolbar on the left, submit + cancel on the right)
- Submit button styled with primary action tokens; cancel as ghost
- Tokens: `--color-action-*`, `--color-surface-raised`, `--space-*`, `--radius-m`

## Composition

```html
<!-- Standalone top-level comment form -->
<comment-box name="comment" placeholder="Add a comment..."></comment-box>

<!-- Pre-filled edit mode -->
<comment-box value="..." submit-label="Save" data-show-cancel></comment-box>

<!-- Inside comment-thread as the reply-form template -->
<comment-thread>
  ...
  <template data-reply-form>
    <comment-box submit-label="Reply" data-show-cancel></comment-box>
  </template>
</comment-thread>
```

## File structure

```
src/web-components/comment-box/
├── api.json
├── logic.js
├── styles.css
└── static.html
```

## Implementation checklist

- [ ] Scaffold; VBElement subclass; `formAssociated = true`
- [ ] Compose `<markdown-editor>` for the input surface
- [ ] Submit + Cancel buttons; toolbar slot
- [ ] `value` get/set; `clear()`; `focus()`
- [ ] `comment-box:submit/cancel/input` events; cancellable submit
- [ ] Min/max length validation via `ElementInternals.setValidity`
- [ ] Register in `src/web-components/index.js` + `index.css` (full bundle, not core)
- [ ] Demo at `demos/examples/demos/comment-box-basic.html`
- [ ] Doc page with adjacency disambiguation (vs `markdown-editor`, `chat-input`, `form-field`)
- [ ] Cross-link from `comment-thread` doc when that ships

## Open questions

- Should keyboard Cmd/Ctrl+Enter submit the form? **Yes for v1** — matches GitHub/Slack/most editors.
- Should empty-value submit be blocked by the component or by the author? **Author owns** — they may have valid empty-comment use cases (e.g., quick reactions); they can preventDefault().

## References

- `src/web-components/markdown-editor/` — input dependency
- `src/web-components/form-field/` — composition reference
- `admin/r-n-d/comment-thread.md` — primary consumer
