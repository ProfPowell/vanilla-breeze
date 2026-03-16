# Wizard Forms: Current State and What Should Be Done

## Current Situation (Implemented in the Library)

Wizard support is implemented in core library code, not just in docs.

### Implementation location

1. Runtime logic:
- `../src/lib/wizard.js`

2. Styles:
- `../src/native-elements/form/wizard.css`
- Included by `../src/native-elements/index.css`

3. Bundle entry points:
- `../src/main.js`
- `../src/main-core.js`
- `../src/main-autoload.js`
- Each checks for `[data-wizard]` and then loads wizard logic.

### What works today

1. Auto-init on `form[data-wizard]`.
2. Step discovery from `fieldset[data-wizard-step]`.
3. State attributes:
- `data-wizard-enhanced`
- `data-wizard-active` / `data-wizard-hidden`
- `data-wizard-current` / `data-wizard-total`
- `data-wizard-last`
4. Prev/next wiring through `data-wizard-prev` and `data-wizard-next`.
5. Per-step validation before forward navigation (native validity APIs).
6. Optional-step bypass via `data-wizard-optional`.
7. Conditional steps via `data-wizard-if` with these syntaxes:
- `field:value`
- `field:!value`
- `field`
- `!field`
8. Progress sync for `[data-wizard-progress]`.
9. URL hash sync using `#step=N`, including initial read + `hashchange` handling.
10. Live status region announcements (`data-wizard-status`).
11. `nav.steps` sync:
- Discovers via `data-wizard-steps="#selector"` or internal `nav.steps`
- Sets `aria-current="step"` on active item
- Sets `data-completed` on past items
- Hides nav items when corresponding conditional steps are hidden
12. Public API on form:
- `wizardGoTo(index)`
- `wizardNext()`
- `wizardPrev()`
- `wizardReset()`
- `wizardController`
13. Custom events:
- `wizard:stepchange`
- `wizard:complete`
- `wizard:reset`

## What Changed Since `wizard-status-2-2-26.md`

That status file is now outdated in structure/location:

1. Wizard is no longer a labs-only experiment:
- No `src/labs/wizard.css`
- No wizard export in `src/labs/labs.js`

2. Wizard styles are in core native-element form styles now:
- `src/native-elements/form/wizard.css`

3. Wizard docs are now in normal docs IA:
- Pattern page and attribute page exist under `11ty-site/src/pages/docs/...`

4. Old lab page references are stale:
- No current wizard page under `11ty-site/src/pages/lab/experiments/`

## Gaps vs `wizard-forms.md` Spec

### Not implemented yet

1. Persistence options:
- `data-wizard-persist="sessionStorage|localStorage"`

2. Summary/review auto-generation:
- `data-wizard-summary`
- `data-wizard-field`

3. Config flags from spec:
- `data-wizard-validate`
- `data-wizard-history`
- `data-wizard-auto-nav`

4. Auto-injected default nav when `[data-wizard-nav]` is missing.

5. Auto-populating step lists from legends (`<ol data-wizard-steps>` pattern).

6. Advanced condition grammar (AND/OR expressions).

7. Keyboard extras mentioned in spec notes (arrow-key step nav, Escape behavior).

### Partial/misaligned behavior

1. `wizard:complete` event currently fires on `wizardNext()` at the last step, not on actual form submit.

2. Native `form.reset()` does not automatically reset wizard state unless `wizardReset()` is called.

3. Hash behavior is always on and always `#step=N` (no opt-out mode/config), which can conflict with other hash uses.

4. Condition re-evaluation is bound to `change` events (not `input`), so some step visibility updates only after blur/commit.

5. Docs demo path mismatch:
- Attribute page points to `/docs/examples/demos/wizard-steps.html`
- Current wizard demo files are under `/docs/patterns/demos/`

6. No dedicated automated tests for wizard behavior were found under `../tests`.

## What Should Be Done Next (Priority Order)

1. Fix correctness gaps first:
- Fire `wizard:complete` from real submit flow.
- Handle native `reset` events by syncing wizard state.
- Add option to disable or scope hash synchronization.

2. Close the most important spec gaps:
- Implement `data-wizard-auto-nav` (nav injection fallback).
- Implement persistence (`data-wizard-persist`).
- Implement summary step helpers (`data-wizard-summary` / `data-wizard-field`).

3. Improve docs accuracy:
- Add a real runnable `data-wizard` demo in `docs/examples/demos` or update the iframe path.
- Keep attribute/pattern docs aligned with actual event semantics.

4. Add test coverage:
- Navigation + validation
- Conditional/optional steps
- Hash sync behavior
- Events (`stepchange`, `complete`, `reset`)

5. Optional performance follow-up:
- Ensure wizard is truly split into a separate CDN chunk (right now logic is conditionally executed, but still bundled into main CDN JS files).

