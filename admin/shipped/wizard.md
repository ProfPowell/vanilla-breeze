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

All spec gaps have been resolved as of 2026-03-25.

### Resolved (previously not implemented)

1. **Persistence** — `data-wizard-persist="session|local"` implemented with sessionStorage/localStorage.
2. **Summary/review step** — `data-wizard-summary` on fieldset, `data-wizard-field="name"` for manual mode, auto-generated `<dl>` for auto mode.
3. **Config flags** — `data-wizard-validate` ("step" | "none"), `data-wizard-history` (opt-in hash sync).
4. **Auto-injected nav** — When `[data-wizard-nav]` is missing, Back/Next/Submit buttons are auto-created.
5. **Auto-populating step lists** — Empty `nav.steps ol` is auto-filled from `<legend>` text.
6. **AND/OR condition grammar** — `&&` and `||` operators in `data-wizard-if`, with correct precedence.
7. **Keyboard navigation** — Roving tabindex in step indicator with Arrow, Home, End keys.

### Resolved (previously partial/misaligned)

1. **`wizard:complete`** — Now fires on actual form `submit` event, not on `wizardNext()`.
2. **`form.reset()` sync** — Native reset events trigger `wizardReset()` via RAF.
3. **Hash opt-in** — Hash sync only when `data-wizard-history` is present (no longer always-on).
4. **Condition listeners** — Both `change` and `input` events trigger condition re-evaluation (RAF-debounced).
5. **Demo paths** — Demos exist at `/docs/examples/demos/wizard-*.html` and `/docs/patterns/demos/wizard-*.html`.
6. **Test coverage** — Comprehensive Playwright test suite in `tests/components/wizard.spec.js` covering all features.

## Remaining (optional follow-ups)

1. Performance: consider splitting wizard into a separate CDN chunk (currently conditionally executed but bundled).

