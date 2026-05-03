# Component State Conventions

> **Status:** living, 2026-05-02
> **Owner:** VB project
> **Related:** [`custom-state-set-research.md`](./custom-state-set-research.md) (the why), [`syntax.md`](../syntax.md) (the public attribute catalog).

Vanilla Breeze components expose two distinct state surfaces. Authors and themes target one; the component itself owns the other.

## Public state — `data-*` and `aria-*` attributes

Anything documented in `admin/syntax.md` is a **public attribute**. It is part of the contract:

- Author CSS targets it (`[data-loading]`, `[data-active]`, `[data-open]`, …).
- Themes assume it exists.
- Agents reading the DOM see it.
- Validators (html-validate, conformance checker) gate on it.
- ARIA attributes (`aria-expanded`, `aria-selected`, `aria-pressed`, `aria-busy`) live here too — non-negotiable for assistive tech.

Add new public state by setting an attribute and documenting it in `syntax.md`. Don't migrate existing public attributes to `:state()`; the migration cost is concentrated and the wins are modest. See the "Migration considerations (deferred)" section of the research doc.

## Internal state — `:state()` via `VBElement.setState`

`VBElement.setState(name, on)` toggles entries in the element's `CustomStateSet`, targetable from CSS via `:state(name)`. Use it for flags that exist **only** to drive component-private CSS:

- Animation phases, transition windows, debounce timers, hover-grace.
- Mode flags consumed only inside `styles.css` for that component.
- Anything where exposing a `data-*` attribute would invite consumers to depend on a surface we don't want to commit to.

`:state()` does not appear in the DOM, is not visible to attribute selectors, is not readable from outside the component, and is not part of the documented surface. That's the feature.

### Decision

| Question | Answer |
|---|---|
| Does an author need to override this in their CSS? | Public attribute |
| Does an agent or test need to read it from the DOM? | Public attribute |
| Is it semantic for assistive tech? | `aria-*` attribute |
| Does it already exist as a documented `data-*` attribute? | Keep the attribute — add `:state()` only if internal CSS would be cleaner with both |
| Is it new and lives only inside the component's `styles.css`? | `:state()` |

## Currently shipped `:state()` flags

Kept short on purpose — the surface should be small and named for what it gates.

| Component | State | Set when | Cleared when |
|---|---|---|---|
| `audio-player` | `:state(scrub-active)` | `pointerdown` on the timeline | `pointerup` / `pointercancel` |
| `content-swap` | `:state(transition-running)` | View Transition starts | `transition.finished` resolves (or immediately if no View Transitions) |
| `combo-box` | `:state(no-matches)` | `#filteredOptions` is empty after a filter pass | next filter pass produces matches |

## Adding a new internal state

1. Pick a short, declarative name (`scrub-active`, not `is_dragging_seekbar_now`).
2. Call `this.setState(name, on)` from the component's logic.
3. Use `:state(name)` in the component's `styles.css`.
4. Add a row to the table above. Don't update `admin/syntax.md` — internal states are not public.
5. If a Playwright test asserts on the state, prefer `el.matches(':state(name)')` via `page.evaluate`. Treat that as a last-resort assertion; observable side effects (visible style change, suppressed event) are better targets when available.

## Candidates for future `:state()` adoption

The list below is the output of `vanilla-breeze-jdsv` — a sweep of all 103 web components and 36 custom elements looking for internal-only flags currently expressed via undocumented attributes, transient classes, or private timer fields with no DOM expression. None of these are commitments; each becomes a small bead when there's reason to touch the component for an unrelated change.

The bar is intentionally high. The vast majority of components had nothing to surface, because their state is either documented (public attribute), ARIA-driven, or correctly absent.

### Strong candidates

| Component | Proposed `:state()` name | Set when | Cleared when | Currently expressed as |
|---|---|---|---|---|
| `drag-surface` | `drag-over` | `dragover` event on the surface | `dragleave` or drop completes | `[data-drag-over]` attribute (undocumented) — `logic.js:162,172,179,232`; `styles.css:34` |
| `drag-surface` | `reorder-mode` | Keyboard-initiated reorder begins | Reorder confirmed or Escape pressed | `[data-reorder-mode]` attribute (undocumented) — `logic.js:258,284,363,373`; `styles.css:46`. The `aria-grabbed` mirror on the child item stays as ARIA. |
| `drag-surface` | `drop-flash` | Drop completes; pulse animation begins | `animationend` fires or 500ms timeout elapses | `[data-just-dropped]` attribute (undocumented) — `logic.js:397,399,402`; `styles.css:57` |
| `tool-tip` | `show-pending` | `mouseenter` on trigger; show-delay timer starts | Delay timer fires (tooltip becomes visible) or `mouseleave` cancels | `#showTimer` private field — `logic.js:61,236`. No DOM expression today; would gate optional CSS during the show-delay window. |
| `drop-down` | `hover-grace-pending` | `mouseleave` on a hover-mode dropdown; close timer starts | Timer fires (dropdown closes) or `mouseenter` cancels | `#hoverMode` + close-timer field — `logic.js:46-47,86`. No DOM expression today. |
| `site-search` | `input-debounce-pending` | User types into the search input | Debounce window expires (pagefind invocation begins) | Internal `setTimeout` for pagefind debounce. No DOM expression today. |
| `split-surface` | `divider-dragging` | `pointerdown` on the divider | `pointerup` / `pointercancel` | `#dragging` boolean — `logic.js:28,122,130,145`, plus inline `userSelect` style manipulation. No CSS-targetable expression today. |
| `emoji-picker` | `search-pending` | Search input receives input; debounce begins | Debounce timer fires or input is cleared | `#searchTimer` private field — `logic.js:54-55,82`. No DOM expression today. |

### Tentative

| Component | Proposed `:state()` name | Why tentative |
|---|---|---|
| `drop-down` | `positioning-active` | JS-driven positioning runs before the Popover API takes over. The Popover-supported branch may not need this state at all; verify before adopting. |
| `emoji-picker` | `grid-loading` | Implicit in the grid-cell rebuild during a category switch. Need to confirm there's a real visible window where loading-state styling would help. |

### Components surveyed and discarded

The following 90+ components had nothing to surface. Categorized by reason:

- **Already documented public attributes:** `audio-player` (data-active), `combo-box` (data-active), `content-lens` (data-active-lens), `change-set` (view), `card-list` (data-loading), `include-file` (data-loading), `markdown-viewer` (data-loading), `notification-wc`, `recently-visited`, `site-search` ([open]), `time-picker` (data-open), `context-menu` (data-open), and many more.
- **ARIA-driven state:** `tab-set`, `glossary-wc`, `site-map-wc`, `accordion-wc`, etc.
- **Form-associated validity:** `combo-box`, `date-picker`, `time-picker`, `calendar-wc`, `color-picker`, `chat-input`, `star-rating` — all use `internals.setValidity()`.
- **No CSS-relevant state:** layout primitives in `src/custom-elements/` (layout-stack, layout-grid, layout-cluster, etc.), pure-render components (icon-wc, brand-mark, qr-code), data-display components without ephemeral states (chart-wc, gantt-chart, day-view, week-view).

## How a candidate becomes a shipped state

When a candidate is picked up:

1. Verify it still meets all five criteria from the decision table above (codebases drift).
2. Add `this.setState(name, on)` calls at the set/clear points listed.
3. Update the component's `styles.css` to use `:state(name)` instead of any prior expression (and remove the prior expression — undocumented attribute or class — in the same change).
4. Move the row from "Strong candidates" to "Currently shipped `:state()` flags" above.
5. Add a small Playwright test asserting the state toggles on the documented set/clear triggers.
6. No `admin/syntax.md` update — internal states are not public.

## What not to do

- Don't add `:state(name)` and a parallel `data-name` attribute "for safety." Pick one based on the table above.
- Don't read `:state()` from outside the component. If you find yourself wanting to, the flag should be a public attribute.
- Don't migrate existing `data-*` attributes to `:state()` opportunistically. The deferred migration question is tracked in `custom-state-set-research.md` § "Migration considerations" and only revisited intentionally.
