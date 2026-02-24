# Form Validation: Current Status and What We Should Do

This replaces `form-validation-updates.md` with an implementation-accurate snapshot.

Status date: February 24, 2026

## 1) Current State (Implemented Today)

## Foundation model

1. Validation has a strong progressive-enhancement split:
- CSS-first baseline with native Constraint Validation (`:user-valid` / `:user-invalid`)
- Optional JS enhancement when a form has `data-validate`

2. Core files:
- `src/lib/form-validation.js`
- `src/custom-elements/form-field/styles.css`
- `src/native-elements/input/styles.css`
- `src/native-elements/output/styles.css`

3. JS is initialized in all major entry points:
- `src/main.js`
- `src/main-core.js`
- `src/main-autoload.js`

## CSS-only behavior (works without JS)

1. `form-field` styles valid/invalid states after user interaction (`:user-*`).
2. Required indicator is automatic.
3. Hint/error message slots are supported with `<output class="hint">` and `<output class="error">`.
4. Validation icons (check/x) are built in, with `data-no-icon` opt-out.
5. Password toggle, OTP/PIN, and password-strength enhancements exist in `form-field-enhancements.js` (separate from validation engine).

## JS-enhanced behavior (opt-in via `form[data-validate]`)

1. Per-constraint custom messages:
- `data-message-required`
- `data-message-type`
- `data-message-minlength`
- `data-message-maxlength`
- `data-message-min`
- `data-message-max`
- `data-message-pattern`

2. Cross-field equality:
- `data-match`
- `data-message-match`

3. Checkbox group constraints on `<fieldset>`:
- `data-min-checked`
- `data-max-checked`
- `data-message-min-checked`
- `data-message-max-checked`

4. Error summary with native element:
- `<output class="error-summary">`
- clickable anchors to invalid fields
- focus management for summary container

5. Submit-time forcing of touched state:
- focus/blur pass to trigger `:user-invalid` on untouched fields

6. Dynamic DOM support:
- MutationObserver auto-enhances forms added after load

## Good calls that match the platform-first direction

1. Native `<output>` was used for summaries/messages instead of inventing a new required component.
2. Basic UX is still available without JS.
3. CSS hooks for async validation state already exist (`form-field[data-state="validating"]`).

## 2) What Changed Relative to `form-validation-updates.md`

Most of the old proposal is already implemented now:

1. Custom messages: done.
2. `data-match`: done.
3. Checkbox min/max groups: done.
4. Error summary: done, but as `<output class="error-summary">` (good choice) instead of a new custom element.
5. Async spinner CSS hook: done.

Not implemented from that proposal:

1. Async validation engine (`data-validate-async`) is not implemented.
2. Generic cross-field comparisons like `data-min-field` / `data-max-field` are not implemented.

## 3) Real Gaps We Should Address

## P0: Correctness and contract gaps

1. Summary mode contract drift:
- Docs say `data-validate` + summary output can show both inline + summary.
- Current submit logic only updates summary when `data-validate` has a non-empty value (`mode !== ''`).
- Effect: `<form data-validate>` with summary output can fail to populate summary on submit.

2. Submission semantics are currently non-native:
- `form[data-validate]` always calls `preventDefault()` on submit.
- On valid forms, library dispatches `vb:submit` but does not submit natively.
- This is undocumented in docs and can surprise consumers using normal `action`/`method`.

3. Global suppression of browser validation bubbles:
- `suppressValidationBubble(document)` runs for all forms, not only `data-validate` forms.
- This can unintentionally remove native message UI for forms that did not opt in to JS validation behavior.

4. Fieldset output targeting is too loose:
- `checkFieldset()` uses `fieldset.querySelector('output')`.
- This can target nested outputs unintentionally.
- CSS contract uses direct child output (`fieldset[data-invalid] > output`), so JS should align.

5. No dedicated automated tests for validation behavior:
- No unit/integration tests found for custom messages, match, fieldset constraints, summary modes, or submit behavior.

## P1: Feature completeness gaps

1. Cross-field validation is currently equality-only (`data-match`).
2. No async validation pipeline yet despite existing UI hook.
3. Summary anchors can be weak for group errors if fieldset has no stable ID.
4. Fields without `data-message-*` may not get synchronized inline messages in `.error` outputs as reliably as expected.

## P2: Polish and resilience

1. Add idempotent enhancement guard (avoid duplicate listeners if same form is re-attached).
2. Clarify and normalize accepted `data-validate` mode values.
3. Improve docs around integration with non-JS fallback and native form submission expectations.

## 4) What We Should Do Next (Priority Plan)

## Phase 1: Lock behavior contract (P0)

1. Define explicit modes:
- `data-validate` (or `"both"`): inline + summary when summary output exists
- `data-validate="summary"`: summary only
- `data-validate="inline"`: inline only

2. Fix summary gating in submit/input paths to match that contract.

3. Decide submit strategy and document it:
- Preferred: native submit when valid by default
- Optional event mode: keep `vb:submit` for AJAX flows
- Add explicit opt-in attribute for event-only mode if needed

4. Scope validation-bubble suppression to enhanced forms (or add explicit global opt-in).

5. Make fieldset group output lookup use direct child output (`:scope > output`).

## Phase 2: Test and documentation alignment (P0/P1)

1. Add tests for:
- per-constraint custom messages
- `data-match`
- min/max checked fieldset behavior
- summary modes (`inline`, `summary`, `both`)
- valid submit path behavior

2. Update docs and demo text to match runtime behavior exactly, especially:
- summary mode semantics
- whether valid submit is native or event-based

## Phase 3: Feature expansions (P1/P2)

1. Add optional async validation (`data-validate-async`) using existing `data-state="validating"` CSS hook.
2. Add optional comparison validators (`data-min-field`, `data-max-field`) if needed by forms roadmap.
3. Add improved group-summary target behavior (focus first checkbox in group when no fieldset ID).

## 5) Recommendation

Validation is already in a strong place and notably better than the old draft suggested. The highest-value work now is not redesign; it is contract cleanup, submit semantics clarification, and test coverage so the current implementation is predictable and safe to scale.
