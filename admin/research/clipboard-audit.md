# Clipboard / Copy-Paste Audit

**Date:** 2026-05-22
**Beads:** vanilla-breeze-cktd
**Status:** Inventory of existing clipboard support + improvement candidates

## TL;DR

VB already has a solid HTML-first clipboard primitive (`data-copy` / `data-copy-target` via `src/utils/copy-init.js`) with a complete doc page, CSS feedback hook, screen-reader announcement, dispatched `copy` event, MutationObserver auto-init, and lazy loading. **The codyhouse-gap-analysis claim that copy-to-clipboard is a gap is wrong** — that doc should be corrected.

The real opportunity is **internal consistency**: ten internal components reimplement copy-button logic by hand and miss the screen-reader announcement, the `data-state="copied"` CSS hook, and the `copy` custom event. Migrating them to either the existing `data-copy` markup or a small exported helper would be a meaningful quality win.

A second, smaller opportunity is extending `data-copy-target` beyond `textContent` (e.g. `data-copy-attr="value"`) so components with computed/state-derived strings can use the markup pattern instead of imperative JS.

## What VB has today

### 1. `src/utils/copy-init.js` — the canonical primitive

- `data-copy="<text>"` on any `<button>` copies the literal value.
- `data-copy-target="<selector>"` copies the target's `textContent`.
- On click: `navigator.clipboard.writeText(text)` → sets `data-state="copied"` for 1500ms → injects `role="status" aria-live="polite"` announcement (`"Copied to clipboard"`) → dispatches `copy` custom event with `detail.text`.
- Graceful fallback if Clipboard API is unavailable or permission denied.
- MutationObserver watches `document.documentElement` for dynamically added buttons.
- Idempotent via `data-copy-init` flag.
- Loaded eagerly through `src/web-components/core.js` and `src/web-components/index.js`.
- Lazy-loaded by `src/main-autoload.js` only when an instance is present on page.

### 2. CSS feedback hook

In `src/web-components/core.css` and `src/web-components/index.css`:

```css
[data-copy][data-state="copied"],
[data-copy-target][data-state="copied"] {
  /* default: color: var(--color-success); */
}
```

Authors can restyle without touching JS.

### 3. Doc page

`site/src/pages/docs/attributes/data-copy.html` covers: static text, target by selector, attributes table, icon variant, event listener, code-block copy button, share-link, custom CSS feedback, dynamic buttons, accessibility notes. Sidebar entry at `/docs/attributes/data-copy/`.

### 4. Paste handling (limited, scattered)

- `src/lib/form-field-enhancements.js` line 137 — pastes a single string into a row of digit/PIN inputs (splits, distributes across inputs).
- `src/web-components/theme-import/logic.js` — supports a `paste` mode where the user pastes JSON into a textarea, then clicks Apply. No `navigator.clipboard.readText()` call; manual textarea paste only.

No general-purpose paste primitive exists.

### 5. Components that touch `navigator.clipboard.writeText` internally

Ten components implement their own copy buttons rather than reusing the `data-copy` markup:

| Component | What it copies | Feedback style |
|---|---|---|
| `heading-links` | Section URL (silent, click-anywhere) | Screen-reader announce ("Link copied to clipboard") |
| `share-wc` | Page URL + quote text | "Copy" platform button, no `data-state` |
| `color-picker` | Color in active format | Custom `#copyBtn`, aria-label updates with format |
| `color-palette` | Single swatch color | Inline `writeText` on click |
| `palette-generator` | Hex list, CSS variables | `.pg-copy-hex` / `.pg-copy-css` buttons, `#copyFeedback` timer swap |
| `semantic-palette` | Generated CSS + JSON mapping | Inline writeText, no feedback hook |
| `gradient-builder` | Computed CSS | Inline writeText on click |
| `font-pairer` | Computed CSS + `@import` | `.fp-copy-css` / `.fp-copy-import`, `#copyFeedback` helper |
| `theme-export` | Textarea contents | `.te-copy` button, swaps text to "Copied!" for 1500ms |
| `review-surface` | Annotation pins as JSON | Screen-reader announce ("Pins copied to clipboard") |

These ten reinvent the wheel in eight different ways. Most lack:
- The screen-reader announcement (`heading-links` and `review-surface` are the exceptions)
- The `data-state="copied"` CSS hook
- The dispatched `copy` event
- The graceful try/catch around `writeText`

## Gaps and improvement candidates

### Gap 1 — `data-copy-target` only copies `textContent`

Many of the ten components above can't migrate to the markup pattern because they need to copy a **computed string** (formatted color, generated CSS, JSON serialization). The existing primitive offers no way to source that.

**Candidate enhancements (pick at most one):**

- **`data-copy-attr="<attr-name>"`** — copy the named attribute of the target. Cheap win for state-bearing elements (`<output value="...">`, `<input value="...">`, custom elements with a `value` attribute).
- **`data-copy-property="<prop>"`** — copy a DOM property (`.value`, `.checked`, etc). More flexible but less declarative.
- **Programmatic helper** — export `copyText(text, { button?, announce? })` from `copy-init.js` so internal components can call it and still get the feedback/announce/event behavior. **This is probably the right move for internal consolidation**; the attribute extensions can come later if external authors ask for them.

### Gap 2 — Inconsistent internal usage

Ten components, eight variants, three with screen-reader feedback. This is the biggest concrete quality issue. Migration plan would be:

1. Extract the `writeText + data-state + announce + event` logic into an exported `copyText(text, button?)` helper in `copy-init.js` (or a sibling `clipboard.js`).
2. Refactor the ten components to call it. Most are 5–10 line diffs each.
3. Their copy buttons get screen-reader announcements + the standard `data-state="copied"` styling hook for free.
4. Authors writing custom components in user-land get the same helper as a public export.

Estimated effort: half a day for the refactor; gates on the helper API design.

### Gap 3 — No paste primitive

Currently:
- `form-field-enhancements.js` handles OTP-style digit paste inline.
- `theme-import` uses a textarea-as-paste-pad pattern.

**Two possible directions:**

- **Tiny addition:** `data-paste-target="<selector>"` on a button reads `navigator.clipboard.readText()` and writes to target's `.value` or `.textContent`. Symmetric with `data-copy-target`. Probably 30 lines.
- **Bigger play:** a `paste` event symmetric with the `copy` event, plus a `<paste-zone>` or `data-paste` attribute that handles drop + paste + file-pick uniformly. Out of scope for now; file as future research if demand surfaces.

Recommend the small `data-paste-target` if any internal component would actually use it. Currently nothing in the codebase needs it — defer.

### Gap 4 — No rich-clipboard support

`ClipboardItem` (text + html, text + image) is well-supported in modern browsers and would unlock:

- `color-picker` / `palette-generator` copying a color as both hex text and a small swatch image (paste into Figma/Sketch as actual color).
- `qr-code` copying as PNG.
- `chart-wc` copying as image.

**Verdict:** real but niche. File as a P3 follow-up tied to whichever component first needs it; don't build the helper speculatively.

### Gap 5 — No `<copy-wc>` wrapper component

Don't add one. The attribute-on-button pattern is the right HTML-first move (memory `feedback_html_first_components`) and the doc page already shows the canonical recipes. The only scenario that would justify a wrapper is a non-text payload (image, file) — and even then, an attribute upgrade is probably better.

### Non-gap — documentation

The codyhouse-gap-analysis listed "Copy-to-clipboard utility" as a minor gap. That was a research miss; the doc page at `/docs/attributes/data-copy/` is comprehensive. **Action:** edit `admin/research/codyhouse-gap-analysis.md` to remove the false gap.

## Recommended follow-ups

Prioritized as new beads issues if pursued:

1. **P2 — Consolidate internal copy buttons.** Extract `copyText(text, button?)` helper from `copy-init.js`, migrate the ten components, get uniform a11y + CSS hook. Half-day refactor, lasting quality win.
2. **P3 — Extend `data-copy-target`.** Add `data-copy-attr` or `data-copy-property` so the markup pattern can express computed/state copies. Only if real external authors request it — internal needs are covered by the helper from #1.
3. **P3 — Fix codyhouse-gap-analysis.md.** Remove the bogus copy-to-clipboard gap claim.
4. **P4 — Rich-clipboard / ClipboardItem.** Defer until a component (likely `color-picker` or `qr-code`) has a concrete user-facing reason.
5. **P4 — `data-paste-target`.** Defer; no current internal need.

## Methodology notes

- Source: live read of `src/utils/copy-init.js`, `src/web-components/index.js`, `src/main-autoload.js`, all ten internal components, doc page, and CSS hooks. Ripgrep across `src/`, `site/src/`, and `admin/`.
- Excluded: third-party `@profpowell/code-block` package (used in docs as `<code-block>`; its internal copy behavior, if any, is its own concern).
- No browser test performed — analysis is static.
