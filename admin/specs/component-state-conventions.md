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

## What not to do

- Don't add `:state(name)` and a parallel `data-name` attribute "for safety." Pick one based on the table above.
- Don't read `:state()` from outside the component. If you find yourself wanting to, the flag should be a public attribute.
- Don't migrate existing `data-*` attributes to `:state()` opportunistically. The deferred migration question is tracked in `custom-state-set-research.md` § "Migration considerations" and only revisited intentionally.
