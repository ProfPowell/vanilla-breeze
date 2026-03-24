# Attribute Refactor Brief

## Objective

Use [attribute-explainer.html](/Users/tpowell/src/vanilla-breeze/admin/attribute-explainer.html) as the repo-wide standard for how Vanilla Breeze expresses state, behavior, and variation in markup, then refactor the library toward that standard without breaking the parts of VB that are already conceptually right.

This is not a brief to "remove data attributes."

The actual goal is:

- native HTML state where the platform already has a name
- ARIA where the platform has a semantic state but no native HTML attribute
- `data-*` only for genuinely custom concepts
- classes only for purely visual concerns
- one canonical public attribute vocabulary per component

The biggest current problem is not overuse of `data-*` in general. The biggest problem is shadow APIs and drift:

- native or semantic concepts still showing up as stale `data-*` aliases
- reflected state attributes with unclear input/output contracts
- docs, validators, demos, fixtures, and syntax catalog disagreeing about what the real attribute API is

## Source Standard

`admin/attribute-explainer.html` gives a clear ranking:

1. Native HTML attribute or element
2. ARIA attribute
3. `data-*` attribute
4. Class

The key tests from that file are:

- If the platform already has a name for the concept, use the platform name.
- If removing CSS would still leave meaning behind, the state should live in native HTML or ARIA.
- If the concept is genuinely custom, `data-*` is correct.
- If the concern is purely presentational, use a class.

## Important Nuance For Vanilla Breeze

The explainer is correct, but VB needs one explicit repo nuance:

- on normal HTML elements, follow the ranking strictly
- on custom element hosts, a plain host attribute can be a valid canonical public API once the component defines it intentionally

That means:

- `combo-box filter`, `slide-accept threshold`, `theme-picker variant`, and `settings-panel open` can be valid host APIs
- once VB chooses that canonical host API, old `data-filter`, `data-threshold`, `data-open`, or similar shadow forms become debt

So the refactor should not blindly convert every custom element attribute to `data-*`.

It should do the opposite:

- decide one canonical public vocabulary per component
- delete stale shadow vocabularies
- stop documenting both at once

## What VB Already Gets Right

A lot of the repo is already aligned with the explainer:

- Navigation and pattern docs use `aria-current="page"` extensively and correctly.
- `details[open]` and `dialog[open]` are used as real platform primitives in many docs and patterns.
- Many components correctly use `aria-expanded`, `aria-pressed`, and `aria-sort` where those states are genuinely semantic.
- `data-theme`, `data-layout-*`, `data-position` on non-native concepts, `data-loading`, and many `data-variant` uses are legitimate custom concepts.
- The repo is already in the middle of moving several web components from stale `data-*` host APIs to cleaner host attributes.

Those strengths should be preserved.

## Repo-Wide Failures

### 1. Shadow APIs are still published after the canonical API changed

This is the most common problem.

Representative current examples:

- `combo-box` runtime/docs use plain host attrs like `required`, `filter`, `multiple`, `max`, and `custom`, but `src/htmlvalidate/elements.cjs` and `tests/element-visual/compendium/compendium.json` still publish `data-required`, `data-filter`, `data-multiple`, `data-max`, and `data-allow-custom`
- `include-file` runtime uses `mode`, but `tests/components/include-file.spec.js` still sets `data-mode`
- `reader-view` docs use `storage-key` in the attributes table but still say `data-storage-key` in best practices
- `split-surface` has competing vocabularies across runtime, docs, and demos: `min/max`, `data-min/data-max`, and `data-layout-min/data-layout-max`
- `admin/syntax.md` still blesses stale entries such as `data-open` for "various WC" and `data-required` for `combo-box`

Why this is bad:

- It teaches two APIs for one concept.
- It keeps old attribute names alive in fixtures and docs long after runtime moved on.
- It makes the repo fail the explainer's basic question: "what is the natural home for this information?"

### 2. Some semantic state is still carried in custom data attrs instead of native/ARIA

Representative current examples:

- `context-menu` uses `data-open` in runtime and CSS even though "open" is already a platform word
- `data-table` still sets `data-state-sorted` while also setting `aria-sort`, and the docs/README still publish the data attr as part of the contract
- `data-table` docs claim selectable rows use `aria-selected`, but current logic tracks selection with `data-state-selected`
- `site-search` tracks active result state with `data-active` only; it does not expose a clearer semantic active-descendant model
- `tab-set` docs and styling examples rely on `aria-selected`, but current runtime does not actually set it

Why this is bad:

- This is exactly the kind of semantic duplication the explainer warns against.
- CSS and JS begin depending on project jargon instead of platform meaning.
- Accessibility docs become more aspirational than real.

### 3. Reflected state attributes do not have one consistent contract

Across the repo, reflected attributes like `open` currently mean different things:

- output only
- public input
- both
- or "state hook for styling, but not really for authored markup"

Representative current examples:

- `emoji-picker` docs are relatively clear: `open` is reflected state and not intended as initial markup
- `settings-panel` docs list `open` as an attribute without making the output-only nature equally clear
- `site-search` docs present `open` as reflected state, but the runtime is a generated JS dialog shell rather than an authored declarative open/close surface
- `theme-picker` has the same general reflected-state ambiguity

Why this is bad:

- A reflected attribute is not automatically a supported authored input.
- Without a repo rule, authors cannot tell which reflected attrs are safe to write in markup and which are only outputs.

### 4. The repo has no single enforced source of truth for attribute contracts

Right now attribute contracts are spread across:

- runtime logic
- docs pages
- README files
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`
- `admin/syntax.md`

This is the systemic reason drift keeps recurring.

Representative current examples:

- `combo-box` drift across runtime, docs, htmlvalidate, and compendium
- `data-table` drift across runtime, docs, and README
- `theme-picker`, `emoji-picker`, and `site-search` reflected-state wording diverging across docs and runtime
- `syntax.md` still cataloging stale repo contracts after individual components changed

### 5. The repo sometimes documents semantic state that runtime does not currently manage

Representative current examples:

- `tab-set` docs promise `aria-selected`, and styling examples target it, but runtime currently only manages `tabindex`
- `data-table` docs promise `aria-selected` on selectable rows, but current logic does not set it
- several component briefs already found this same pattern in narrower form: docs moving faster than runtime on semantic state

Why this is bad:

- This is worse than a stale example.
- It teaches the right semantics while shipping something else.

## Representative Current Mismatches

Use these as the initial tracking list for the refactor:

- `src/web-components/context-menu/logic.js` and `src/web-components/context-menu/styles.css`
  Problem: `data-open` shadows an "open" concept that should not need a custom data name
- `admin/syntax.md`
  Problem: still catalogs `data-open` as a public repo pattern and keeps other stale attribute contracts alive
- `src/htmlvalidate/elements.cjs` + `tests/element-visual/compendium/compendium.json` for `combo-box`
  Problem: stale `data-*` shadow API after runtime moved to plain host attrs
- `tests/components/include-file.spec.js`
  Problem: stale `data-mode`
- `site/src/pages/docs/elements/web-components/reader-view.njk`
  Problem: `storage-key` vs `data-storage-key` drift in one page
- `site/src/pages/docs/elements/web-components/tabs.njk` + `src/web-components/tab-set/logic.js`
  Problem: docs/style promise `aria-selected`; runtime does not set it
- `site/src/pages/docs/elements/web-components/data-table.njk` + `src/web-components/data-table/logic.js` + `src/web-components/data-table/README.md`
  Problem: semantic sort/select state split across ARIA and custom data attrs, with docs overclaiming ARIA support
- `site/src/pages/docs/elements/web-components/site-search.njk` + `src/web-components/site-search/logic.js`
  Problem: reflected `open` contract and active-result semantics are under-specified

## Recommended Repo Policy

### 1. Native elements and native states

Rule:

- if the element is native and the platform already has the concept, use the native attribute or element

Examples to preserve:

- `open`
- `disabled`
- `required`
- `checked`
- `selected`
- `details`
- `dialog`

### 2. Semantic interactive state

Rule:

- if the state is meaningful to assistive technology or interaction semantics, prefer ARIA over a project-specific data attr

Examples to preserve:

- `aria-current`
- `aria-expanded`
- `aria-pressed`
- `aria-selected`
- `aria-sort`

### 3. Custom element host public API

Rule:

- each custom element gets one canonical host attribute vocabulary
- once a host attr is canonical, shadow `data-*` aliases are deprecated and then removed

Examples:

- `combo-box filter`, not both `filter` and `data-filter`
- `slide-accept threshold`, not both `threshold` and `data-threshold`
- `settings-panel open` must be documented clearly as input, output, or both

### 4. `data-*`

Rule:

- use `data-*` for genuinely custom concepts with no platform term
- also allow `data-*` for internal styling hooks only when no better semantic/native state exists

Examples that are broadly fine:

- `data-theme`
- `data-layout-*`
- `data-position` for custom drawer or layout positioning
- `data-variant`
- `data-loading`

Examples that need scrutiny:

- `data-open`
- `data-state-sorted`
- `data-state-selected`
- `data-active` when it is really semantic active-descendant state

### 5. Classes

Rule:

- classes are for visual-only concerns, utilities, and style scopes

This refactor should not try to move legitimate utility classes into attributes.

## Refactor Program

## Phase 1. Freeze The Standard

Do this first:

- adopt `admin/attribute-explainer.html` as the repo-wide decision standard
- add one short version of the rule set to the docs/contributing guidance
- explicitly document the custom-element-host nuance above

## Phase 2. Create One Canonical Attribute Manifest Per Component/Pattern

Add a machine-readable manifest for each public surface.

Each entry should include:

- attribute name
- kind: `native`, `aria`, `host-api`, `data`, or `class`
- purpose: `semantic-state`, `config`, `visual-variant`, `output-state`, or `internal-hook`
- whether it is public
- whether it is authored input, reflected output, or both
- allowed values

This manifest should become the source for:

- docs attribute tables
- `src/htmlvalidate/elements.cjs`
- `admin/syntax.md`
- compendium fixture linting

Hand-maintaining all of those separately is what created the current drift.

## Phase 3. Remove Shadow APIs In Priority Order

Priority order:

1. `data-open` shadow APIs
2. stale `data-*` aliases on web components whose canonical host attrs are now plain attrs
3. docs pages that still teach both old and new forms
4. syntax catalog entries that preserve dead vocabularies

Immediate candidate list:

- `context-menu[data-open]`
- `combo-box` stale `data-*` aliases in htmlvalidate and compendium
- `include-file` stale `data-mode` in tests
- `reader-view` stale `data-storage-key` docs text
- `split-surface` split vocabulary around `min/max`

## Phase 4. Repair Semantic State

Focus on places where VB currently duplicates or skips platform semantics.

Initial candidate list:

- `tab-set`
  Either actually manage `aria-selected`, or stop documenting/styling against it
- `data-table`
  Style off `aria-sort` instead of publishing `data-state-sorted` as a user-facing contract
  Add `aria-selected` if docs continue to promise it
- `site-search`
  Decide whether active result needs a semantic active-descendant model rather than `data-active` alone
- `context-menu`
  Replace `data-open` with a clearer native/ARIA-aligned state model

## Phase 5. Normalize Reflected State Policy

For every reflected attribute, decide one of:

- public input + output
- output only
- internal only, not documented

Then make docs match.

Use `emoji-picker` as the current best local model for output-only wording:

- reflected state
- not intended as initial markup

Apply that same explicitness to:

- `settings-panel`
- `site-search`
- `theme-picker`
- any other component using reflected `open`

## Phase 6. Add Guardrails

Add checks that fail CI when attribute drift returns.

Recommended checks:

- lint that flags docs/htmlvalidate/compendium attrs not present in the canonical manifest
- lint that flags public `data-*` aliases shadowing canonical host attrs
- lint that flags documented semantic ARIA states not actually set in runtime
- behavior tests for reflected-state contracts
- behavior tests for ARIA-state contracts

## Acceptance Criteria

The refactor should not be considered complete until all of these are true:

- no public docs or validators still bless stale shadow APIs like `data-open`, `data-mode`, or `data-storage-key` when a canonical form already exists
- every component with a public API has one canonical attribute vocabulary
- reflected attrs are clearly classified as input, output, or both
- semantic interactive state is expressed through native HTML or ARIA where the platform already has a name
- `admin/syntax.md` no longer acts as a stale parallel attribute universe
- htmlvalidate, docs, fixtures, and runtime all agree on the same public contract

## Do Not Do This

- Do not mass-convert every `data-*` attribute in the repo to plain attrs.
- Do not mass-convert legitimate custom design-system concepts like `data-theme`, `data-layout-*`, or `data-variant`.
- Do not keep backward-compat shadow aliases indefinitely once a canonical API exists.
- Do not document reflected state as though it were a supported authored input unless runtime actually supports that.
- Do not let internal styling hooks leak into public syntax docs.

## Bottom Line

Vanilla Breeze is already close to the right philosophy. The repo mostly understands where native attrs, ARIA, and `data-*` each belong.

The real work now is enforcement:

- pick one canonical attribute contract per surface
- stop publishing shadow vocabularies
- stop documenting semantics the runtime does not set
- generate or validate docs/tooling from one source of truth

If that happens, the library will match `attribute-explainer.html` much more closely without losing the parts of VB that are already strong.
