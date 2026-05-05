---
title: "NFR Compass Specification"
component: nfr-compass
version: 0.1.0
status: draft
---

# NFR Compass

A 12-ility prioritization decision surface that enforces scarcity. Output is a JSON quality vector with required rationales for every Critical pick. Replaces the list-CRUD anti-pattern (every -ility marked "must", no scarcity, no memory) with a forced-trade interface.

## Table of Contents

- [Purpose](#purpose)
- [The pedagogy — why scarcity is the point](#the-pedagogy--why-scarcity-is-the-point)
- [Static HTML Form](#static-html-form)
- [Enhanced Form](#enhanced-form)
- [Slots](#slots)
- [Attributes and API](#attributes-and-api)
- [Events](#events)
- [Constraint cross-checking](#constraint-cross-checking)
- [Failure Modes](#failure-modes)
- [Accessibility](#accessibility)
- [CSS Tokens](#css-tokens)
- [Examples](#examples)
- [Relationship to other components](#relationship-to-other-components)

## Purpose

When a team starts a project, they are tempted to declare every quality attribute "must-have." The result is a requirements document where 12 categories are all marked with the highest priority — which is the same as marking nothing. Real engineering means picking the few axes that justify cost and accepting the rest at baseline.

`<nfr-compass>` makes that trade visible and durable:
- It caps Critical picks at 3.
- It demands a one-sentence rationale for each Critical pick.
- It cross-checks each Critical pick against the project's constraint profile and warns when the picks are implausible together.
- It outputs a structured **quality vector** that downstream tools (ADRs, validators, dashboards, CI) can read.

The constraint *is* the artifact. A list of all-Criticals is not a list. The rationale is the protective shell that stops the choice from being relitigated every Monday.

## The pedagogy — why scarcity is the point

Three problems with the list-CRUD pattern that this component fixes:

| Problem | Symptom | Compass remedy |
|---|---|---|
| **No scarcity** | Every ility flagged "must" → meaningless | Hard cap of 3 Criticals enforced in the UI. Clicking a 4th is disabled. |
| **No cross-cut** | 5+ pages of separate forms, no place where the trade lives | One surface, all 12 ilities, one decision moment |
| **No memory** | Priority gets relitigated every Monday | Required rationale per Critical, persisted in the output vector |

## Static HTML Form

Pre-upgrade, the markup is a semantic `<form>` with a `<fieldset>` per ility. Each ility has a `<legend>` (name) and a 4-button radio group (the priority levels). With no JS the form still submits as plain HTML and a server can read the choices — but the scarcity cap and the rationale gating are not enforced.

```html
<nfr-compass name="nfr-vector">
  <fieldset name="performance">
    <legend>Performance</legend>
    <label><input type="radio" name="performance" value="critical">     Critical</label>
    <label><input type="radio" name="performance" value="important">    Important</label>
    <label><input type="radio" name="performance" value="acceptable" checked> Acceptable</label>
    <label><input type="radio" name="performance" value="not-relevant"> Not relevant</label>
    <textarea name="performance-rationale" hidden></textarea>
  </fieldset>
  <!-- ... 11 more fieldsets ... -->
</nfr-compass>
```

Default ility list (used when no fieldset children are slotted in):
performance, accessibility, security, reliability, maintainability, observability, compatibility, scalability, portability, internationalization, privacy, cost.

## Enhanced Form

After upgrade the component:
- Wraps each fieldset's radio group as a single segmented-control row (visual only — the underlying inputs stay).
- Reveals the rationale `<textarea>` only when Critical is selected for that ility.
- Disables Critical radios on remaining rows once 3 Criticals are selected; clicking a disabled Critical shows a transient inline message ("Max 3 Criticals — pick fewer to add this one").
- Reads the constraints slot/attribute and renders a conflict chip beside any Critical row whose ility is implausible given the constraints.
- Exposes the resolved vector as a property and dispatches `nfr-compass:change` events.

```html
<nfr-compass name="nfr-vector" data-max-criticals="3" data-min-rationale="10">
  <span slot="title">Quality priorities for v1</span>

  <span slot="constraints">
    <data data-constraint="team-size" value="1">Solo team</data>
    <data data-constraint="deadline-weeks" value="6">6-week deadline</data>
    <data data-constraint="budget" value="solo">Solo budget</data>
  </span>

  <!-- 12 fieldsets here, or omit to get the defaults -->
</nfr-compass>
```

## Slots

| Slot | Purpose | Required |
|---|---|---|
| `title` | Heading text shown above the rows | no (defaults to "NFR Compass") |
| `constraints` | Inline `<data data-constraint="..." value="...">` elements (or any element with those attrs) describing the project's constraint profile. Used for cross-checking. | no |
| (default slot) | `<fieldset>` rows. Omit to get the default 12 ilities. | no |
| `footer` | Save/Submit button area | no |

## Attributes and API

| Attribute | Type | Default | Purpose |
|---|---|---|---|
| `name` | string | `nfr-vector` | Form-association name |
| `data-max-criticals` | number | `3` | Hard cap on Critical picks |
| `data-min-rationale` | number | `10` | Min characters required for a Critical rationale |
| `data-max-rationale` | number | `200` | Max characters for the rationale textarea |
| `data-allow-locked` | boolean | absent | When `locked` attribute is also set, all picks become read-only |
| `locked` | boolean | absent | When set, the vector is read-only (released projects) |
| `disabled` | boolean | absent | All inputs disabled, no form submission |

### Properties

| Property | Type | Description |
|---|---|---|
| `vector` | `Record<string, 'critical' \| 'important' \| 'acceptable' \| 'not-relevant'>` | Get current picks. Setting it replaces the form state. |
| `rationales` | `Record<string, string>` | Get/set the rationale strings. Keys must be a subset of vector keys with value `critical`. |
| `conflicts` | `Array<{ ility, constraint, severity }>` | Read-only computed conflicts |
| `criticalCount` | number (readonly) | Live count of Criticals — useful for headers / progress |

### Internal state hooks (`:state(...)`)

- `:state(at-cap)` — set when `criticalCount === maxCriticals` so CSS can dim the remaining Critical buttons
- `:state(has-conflicts)` — set when at least one Critical row conflicts with constraints
- `:state(missing-rationale)` — set during validation when any Critical lacks a complete rationale

## Events

| Event | Detail | When |
|---|---|---|
| `nfr-compass:change` | `{ vector, rationales, conflicts, source: 'pointer'\|'keyboard'\|'api' }` | Any pick or rationale changes |
| `nfr-compass:cap-hit` | `{ ility, attempted: 'critical' }` | User tried to pick a 4th Critical — for analytics or toast UX |
| `nfr-compass:conflict` | `{ ility, constraint, severity }` | A new conflict appears (a Critical pick was made that conflicts with a constraint, or a constraint changed and an existing Critical is now in conflict) |

## Constraint cross-checking

Constraints are read from the `constraints` slot or the `data-constraints` attribute (a JSON object).

The component ships a default conflict matrix keyed by `(ility, constraint)`. Examples:
- `performance` Critical + `team-size: 1` → severity `warn`, message "Hitting top-tier performance solo within the deadline is unusually expensive."
- `accessibility` Critical + `budget: solo` → severity `info`, message "Achievable solo, but plan time for axe + manual screen-reader runs."
- `security` Critical + `team-size: 1` + `deadline-weeks: <8` → severity `warn`.
- `i18n` Critical + `markets: [single]` → severity `warn`, "i18n Critical with a single-market launch — confirm this is for future markets, not v1."

The matrix is data, not code — easy to extend per project. The component reads it from a JS module or a slotted `<script type="application/json" data-conflict-matrix>` block. Default matrix lives in `_conflict-matrix.js` next to the component.

Conflict chips are advisory, not blocking. The pedagogy is "we noticed; explain in the rationale." If the user has a good reason, the rationale captures it — and that's the artifact.

## Failure Modes

### No JavaScript
- **Behavior:** Plain `<fieldset>`s with native radios. The form submits to its action; the server gets the picks. No scarcity cap, no rationale gating, no conflict chips.
- **Acceptable:** Yes. The component is a *better* version of a real form, not a replacement for one.

### No CSS
- **Behavior:** Vertical stack of fieldsets with native radio buttons and labels. Functional, ugly.
- **Acceptable:** Yes.

### Upgrade Delay
- **Behavior:** Until the custom element upgrades, native radios accept input. On upgrade the component reads the existing picks, replaces them with the styled UI, and applies the cap (so a pre-upgrade user who selected 5 Criticals will see a validation message on first interaction).
- **Acceptable:** Yes.

### Keyboard Only
- **Tab order:** Across rows, then within a row across the 4 priority buttons. Rationale textarea is in tab order only when the row is Critical.
- **Key bindings:** Arrow keys move within a row's radio group (native behavior); Tab leaves the row.
- **Acceptable:** Yes.

### Screen Reader
- **Roles:** Native `fieldset/legend/radiogroup`. No ARIA role overrides.
- **Live regions:** A `<output aria-live="polite">` reports cap-hit and conflict messages.
- **Announced state changes:** "3 of 3 Criticals selected" announced when at-cap state is reached.
- **Tested with:** VoiceOver, NVDA.
- **Acceptable:** Yes.

### RTL / i18n
- **Behavior:** Logical properties throughout. Conflict chip flows after the row label inline-end.
- **Acceptable:** Yes.

## Accessibility

- WCAG 2.2 AA target.
- The cap-hit "disabled" state on Critical buttons must NOT be conveyed by color alone — uses `aria-disabled="true"` plus visible iconography (e.g. lock glyph).
- Conflict chips include text + an icon + the live region announcement; never color-only.
- Rationale textarea has visible character count with `aria-live="polite"` updates.

## CSS Tokens

| Token | Default | Purpose |
|---|---|---|
| `--nfr-compass-padding` | `var(--size-l)` | Outer padding |
| `--nfr-compass-row-gap` | `var(--size-s)` | Vertical gap between rows |
| `--nfr-compass-pill-bg` | `var(--color-surface-raised)` | Segmented-control track |
| `--nfr-compass-critical-bg` | `var(--color-error-subtle)` | Critical pip background |
| `--nfr-compass-important-bg` | `var(--color-warning-subtle)` | Important pip background |
| `--nfr-compass-acceptable-bg` | `var(--color-success-subtle)` | Acceptable pip background |
| `--nfr-compass-not-relevant-bg` | `var(--color-surface)` | Not-relevant pip background |
| `--nfr-compass-conflict-color` | `var(--color-warning)` | Chip color |

## Examples

### Default 12 ilities, no constraints

```html
<nfr-compass name="v1-priorities"></nfr-compass>
```

### With constraints from the Canvas

```html
<nfr-compass
  name="v1-priorities"
  data-constraints='{ "team-size": 1, "deadline-weeks": 6, "budget": "solo" }'>
</nfr-compass>
```

### Custom ility list (a docs site might only care about 6)

```html
<nfr-compass name="docs-priorities">
  <fieldset name="accessibility"><legend>Accessibility</legend>…</fieldset>
  <fieldset name="performance"><legend>Performance</legend>…</fieldset>
  <fieldset name="seo"><legend>SEO</legend>…</fieldset>
  <fieldset name="i18n"><legend>i18n</legend>…</fieldset>
  <fieldset name="maintainability"><legend>Maintainability</legend>…</fieldset>
  <fieldset name="cost"><legend>Cost</legend>…</fieldset>
</nfr-compass>
```

### Locked / read-only published vector

```html
<nfr-compass locked data-allow-locked>
  <!-- value attributes pre-checked, rationales pre-filled -->
</nfr-compass>
```

### Listening for the decision

```js
document.querySelector('nfr-compass').addEventListener('nfr-compass:change', (e) => {
  fetch('/api/nfr-vector', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(e.detail),
  });
});
```

### Programmatic API

```js
const compass = document.querySelector('nfr-compass');

// Pre-fill from a saved vector
compass.vector = { performance: 'critical', accessibility: 'important', security: 'critical' };
compass.rationales = {
  performance: 'Sub-200ms TTI is our differentiator vs Competitor X.',
  security: 'We handle PHI; SOC 2 audit pending Q2.',
};

// Programmatic conflict check
console.log(compass.conflicts);
// → [{ ility: 'performance', constraint: 'team-size:1', severity: 'warn' }]
```

## Relationship to other components

- **`<requirement-card>`** (`vanilla-breeze-zq4u`, demoted to row renderer) — a Shadow-DOM card that renders one row inside `<nfr-compass>`. Its only job is the visual atom; the compass owns logic.
- **`<nfr-envelope>`** (`vanilla-breeze-r6d0`, deferred) — the radar-overlay visualizer that consumes the compass output. Defer until 2 real-world adoptions of the compass.
- **`requirements.schema.json`** (existing) — per-category WHAT-WE-TEST rows. Different lifecycle from the vector. The compass priority gates the per-category forms (Critical = required; Important = recommended; Acceptable = baseline; Not relevant = out of scope).
- **`nfr-vector.schema.json`** (`vanilla-breeze-rooj`) — schema for the compass output. Validates the cap, the rationale completeness, and the constraints hash.
- **`uucd nfr` CLI** (`vanilla-breeze-ah93`) — CI guard that fails builds when the vector violates the invariants or drifts from the constraint profile.

## Open questions

1. **Default conflict matrix scope.** Ship with the 4–5 most-cited conflicts (Performance × small team, Security × tight deadline, etc.) or with a richer matrix that covers all 12 × common constraints? Smaller is easier to explain; richer is more useful immediately. I lean small + extensible.

2. **"Acceptable" baseline definition.** Should each ility have a documented baseline that "Acceptable" implicitly commits to (e.g. accessibility=WCAG 2.2 AA, performance=Core Web Vitals "good")? If yes, the compass needs a way to surface those baselines so authors know what they're agreeing to. Likely a tooltip on the Acceptable button.

3. **Locked vectors and re-decisions.** When constraints change after a vector is locked, what's the unlock UX? Probably: hash mismatch shows a banner "constraints have changed since this vector was decided — review and re-lock." The CLI's `nfr check` already plans to flag this.

4. **Form association vs free element.** Should `<nfr-compass>` be `formAssociated = true` so it serializes as a single field within an outer `<form>`, or stand alone with its own submit? Form-associated lets it compose into bigger workflows (the `/requirements` page can wrap it in a real form alongside other UUCD-Pack components). I lean form-associated.
