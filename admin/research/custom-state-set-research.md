# CustomStateSet for Vanilla Breeze — Research & Recommendation

> **Status:** R&D / advisory, 2026-05-02
> **Owner:** VB project
> **Source reviewed:** [MDN — CustomStateSet](https://developer.mozilla.org/en-US/docs/Web/API/CustomStateSet); audit of `src/web-components/`, `src/lib/vb-element.js`, `admin/syntax.md`.

## TL;DR

**Additive adoption only. Add CustomStateSet as a new tool; preserve every existing `data-*` and `aria-*` attribute as-is.**

Add a `setState(name, on)` helper to `VBElement` that lazily attaches `ElementInternals` and writes to `internals.states`. Use `:state()` for *new* internal-only flags that don't justify a public attribute, and as an *additional* surface mirroring (not replacing) existing public state where internal CSS benefits. No themes break, no demos break, no `admin/syntax.md` entries removed, no consumer page regresses.

Net effect: a smaller new tool in the toolbox, zero loss surface area. Pre-release status would let us go further (see "Migration considerations" below) but the chosen path is conservative on purpose — the wins from a sweep are real but modest, and the cost of getting it wrong (broken consumer pages, agent-native parity gaps, validator blind spots) is concentrated and asymmetric.

---

## 1. What CustomStateSet Is

`CustomStateSet` is the Set-like object exposed at `ElementInternals.states`. A custom element opts in by calling `attachInternals()` (autonomous elements only — customized built-ins cannot use it). The element's own JS adds and removes string identifiers; CSS matches them via `:state(name)`.

```js
class MyEl extends HTMLElement {
  #internals = this.attachInternals();
  set busy(on) { on ? this.#internals.states.add('busy') : this.#internals.states.delete('busy'); }
}
```

```css
my-el:state(busy) { opacity: .6; pointer-events: none; }
```

Key facts:

- **Baseline: Newly Available, May 2024.** Safe to use; matches VB's existing browser target.
- **Autonomous elements only.** Fine for VB — every component is autonomous.
- **Legacy `--name` syntax** for older releases of Chromium/WebKit; still parseable by modern engines via `:state(--name)`. Worth handling defensively in a base helper.
- **States are not in the DOM.** They are not visible to attribute selectors, the inspector's attribute panel, `getAttribute()`, MutationObservers watching attributes, or any tooling that reads HTML.

That last point is both the feature and the constraint.

---

## 2. VB's Current State Model

VB has no shared state helper. ~50+ components reflect state by calling `setAttribute()`, `toggleAttribute()`, or assigning `this.dataset.x` directly. The audit grouped them as follows:

| Category | Components | Attribute |
|---|---|---|
| Open / closed | `site-search` (`logic.js:103-110`), `time-picker`, `context-menu`, `drop-down` (`logic.js:73-74`) | `[open]`, `[data-open]` |
| Active / selected | `site-search`, `combo-box` (`logic.js:~240`), `carousel-wc`, `glossary-wc`, `audio-player` | `[data-active]`, `[aria-selected]` |
| Busy / loading | `include-file`, `markdown-viewer`, `card-list` | `[data-loading]` |
| Disabled / valid / invalid | `form-field` (`logic.js:128-132`), `time-picker`, `color-picker`, `date-picker` | `[data-disabled]`, `[data-valid]`, `[data-invalid]` |
| Expanded | `tab-set` (`logic.js:~170`), `drop-down`, `site-map-wc` | `[aria-expanded]` |
| Exclusive mode | `change-set` view modes, `content-lens` lens modes, `audio-player` mute | `[data-active-lens]`, `[muted]` |

Twelve form-associated components already call `attachInternals()` for `setValidity()` / form-value participation: `combo-box` (`logic.js:43,66`), `date-picker`, `time-picker`, `calendar-wc`, `color-picker`, `chat-input`, `star-rating`. **None of them touch `internals.states`.** The plumbing is in place; the API is unused.

`VBElement` (`src/lib/vb-element.js:13`) is the base class. It provides `data-upgraded` guarding, an event-listener cleanup helper (`listen()`), and `setup()` / `teardown()` hooks. Nothing for state.

---

## 3. Where CustomStateSet Helps — And Where It Doesn't

This is the honest part. The MDN page makes it sound like a strict upgrade. It isn't.

### Wins (real)

- **Truly internal flags.** Animation phases, post-restore pulse timers, hover-grace windows, "just-debounced" markers — flags that exist only to drive a transient CSS rule and have no value as a public surface. Today these often don't exist at all because authors avoid attribute pollution; `:state()` removes the cost of having one.
- **Encapsulation.** External code can't fake `:state(open)` on a `drop-down` by setting an attribute. For components whose correctness depends on internal logic owning the flag, this prevents a class of subtle bugs.
- **No DOM noise.** The inspector stays clean. MutationObservers in user code don't fire on internal transitions.
- **Free for form-associated components.** Twelve components already have `internals` lying around; `internals.states.add('foo')` costs nothing.

### Losses / non-fits (also real)

- **`aria-*` is non-negotiable.** Assistive tech reads ARIA attributes, not custom states. Every `aria-expanded`, `aria-selected`, `aria-pressed`, `aria-busy` in the audit must stay. `:state()` is a CSS selector, not an a11y mechanism. Pre-release status doesn't change this.
- **Agent-native parity is harder.** The skill list includes an `agent-native-reviewer`: "any action a user can take, an agent can also take." An agent that reads a page can see `data-open=""` on a dropdown; it cannot see `:state(open)`. For anything we want an agent to inspect (or assert on in a test), the visible attribute is the API. Pre-release doesn't change this either — agents read the DOM today.
- **Validators don't see states.** VB runs `html-validate` with a custom-element registry and a conformance checker; both inspect markup. Attributes participate in those gates. States don't.
- **Tests need observable surfaces.** Playwright can call `el.matches(':state(foo)')`, but tests for behavior generally want to wait on something visible — an attribute toggle, a class change, a text update. Internal state is fine as an *implementation* detail; it's a poor *assertion* target.
- **No fallback story.** If a future engine quirk drops support, every `:state()` rule silently stops matching. Attribute selectors degrade to "doesn't match" too, but at least the attribute is still in the DOM and visible to other code.
- **Public contract surface IS attributes — but in pre-release that's a smaller cost.** `admin/syntax.md` documents `data-open`, `data-loading`, `data-active`, `data-valid`, `data-invalid`, etc. as author-facing CSS hooks; themes target them. In a stable framework this would be the dominant cost. In pre-release, it's a one-PR migration cost, not a breaking-change-across-releases cost — provided we update the bundled themes, demos, and `admin/syntax.md` in the same sweep so the gap is closed atomically.

The wins are concentrated in flags that exist only to drive CSS. The losses cluster in flags that have a job *outside* CSS (a11y, agent observation, validator gates).

---

## 4. Recommended Adoption Pattern

### Helper on `VBElement`

Add a single method to `src/lib/vb-element.js`:

```js
/** Toggle an internal CSS state. Lazily attaches internals on first call. */
setState(name, on) {
  // Reuse internals if a subclass already attached them (form-associated components).
  if (!this.#internals) this.#internals = this.attachInternals();
  const states = this.#internals.states;
  try {
    on ? states.add(name) : states.delete(name);
  } catch {
    // Legacy --name syntax for older engines
    on ? states.add(`--${name}`) : states.delete(`--${name}`);
  }
}
```

`attachInternals()` throws if called twice on the same element, so the seven form-associated components that already attach their own internals need to either (a) drop their private field and let the base class own it, or (b) pass their existing internals into the base via a setter. The implementation bead should pick one — (a) is cleaner; (b) is less invasive.

### When to use `:state()` vs. an attribute

| Scenario | Tool |
|---|---|
| ARIA semantics (`aria-expanded`, `aria-selected`, `aria-pressed`, `aria-busy`, …) | Attribute (always) |
| Form validity / value | Existing `internals.setValidity()` — orthogonal to states |
| Existing public attribute documented in `admin/syntax.md` | Keep the attribute. Optionally *also* call `setState()` if internal CSS would be cleaner with `:state()` — additive, not replacement |
| State an author needs to override via CSS | Attribute |
| State an agent or test needs to read from the DOM | Attribute |
| New internal flag that has never existed as an attribute | `setState()` + `:state()` |
| Animation phase, debounce window, hover-grace, post-restore pulse | `setState()` + `:state()` |
| Truly internal exclusive modes consumed only by component-private CSS | `setState()` + `:state()` |

The rule of thumb: **if the flag is already an attribute, leave the attribute alone.** Add `:state()` alongside if internal CSS benefits, but don't remove the attribute. If the flag is new, default to `:state()` unless an external consumer needs to see it.

### Migration considerations (deferred)

Pre-release status (`feedback_prerelease_adopt_aggressively.md`) would technically allow a one-shot migration of `data-*` flags that have no a11y mirror and no agent need (`data-active-lens`, `data-loading` if not surfacing `aria-busy`, etc.) by updating components, themes, demos, and `admin/syntax.md` together. The chosen path defers this:

- The wins are modest (DOM noise reduction, encapsulation against author tampering).
- The losses are concentrated (every consumer page targeting `[data-loading]` regresses silently).
- Reversing a "we removed the attribute" decision later is harder than reversing an "we kept both" decision.

Revisit if a future motivator appears — e.g., a documented case where the dual-surface causes ambiguity, or a 1.0 release where attribute trim becomes valuable.

### Form-associated components

The seven components that already call `attachInternals()` for `setValidity()` get `internals.states` for free. When they need a new internal flag, route it through the new `setState()` helper (which must detect existing internals rather than re-attach — see helper sketch).

---

## 5. Browser Support & Legacy Syntax

- Baseline May 2024. VB targets modern browsers; this is well within the support window.
- The legacy `--name` syntax was required by older Chromium and WebKit. Engines that accept the new syntax also accept the old. The helper above handles both with a `try / catch` so we never have to think about it again.
- Detection (only needed if a component must hard-block on missing support):
  ```js
  const ok = CSS.supports('selector(:state(x))');
  ```
  Don't add detection unless a specific component needs it; the `try / catch` covers the common case.

---

## 6. Testing Implications

- `:state()` participates in `Element.matches()`, so Playwright can write `el.matches(':state(busy)')` from `page.evaluate`. Works, but couples the test to the implementation.
- Prefer asserting on observable side effects: an attribute that *is* mirrored, a visible style change, a fired event. Save `:state()` queries for cases where there is no external surface to observe — and consider that a hint to add one.
- Conformance checker, html-validate, and pa11y do not see states. They will not regress when a state is added; they also will not catch a bug where a state should have been set and wasn't.

---

## 7. Open Questions / Follow-ups

Two beads, additive only:

> **Bead 1 — Add `VBElement.setState` helper.** Lands the API on the base class. Refactors the seven existing form-associated components to share internals (so `setState()` doesn't double-attach). Ships unit tests. No behavior change to any component.
>
> **Bead 2 — Pilot `:state()` for new internal-only flags.** Picks 2–3 components and adds new internal flags via `setState()` for cases where the CSS would be cleaner with `:state()` than with no flag at all (today's status quo). Does **not** remove or replace any existing attribute. Documents the convention in a new `admin/specs/component-state-conventions.md`.

Pilot targets for Bead 2 (all new flags, no existing attribute affected):

- `audio-player` — `:state(scrub-active)` while the user is dragging the seek bar.
- `content-swap` — `:state(transition-running)` during the View Transitions API window.
- `combo-box` — `:state(filter-pending)` during the input debounce, distinct from the public `[data-active]` on options.

Open questions for the implementation beads, not this doc:

- Should `setState()` be a *separate* helper, or expose a `state` getter that returns `internals.states` directly? Narrow API ages better; default to `setState(name, on)`.
- New file `admin/specs/component-state-conventions.md` to capture the "public attribute / internal `:state()`" convention. `syntax.md` is already 1700+ lines.
