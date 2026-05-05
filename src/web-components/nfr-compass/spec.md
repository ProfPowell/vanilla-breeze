---
title: "NFR Compass Specification"
component: nfr-compass
version: 0.2.0
status: draft
---

# NFR Compass

An 11-ility prioritization decision surface that spends a numeric capacity budget supplied by `<iron-triangle>`. Output is a JSON quality vector with required rationales for every Critical pick — and a captured `overrunRationale` if the team consciously chose to spend over budget. Replaces the list-CRUD anti-pattern (every -ility marked "must", no scarcity, no memory) with a forced-trade interface backed by real numbers.

> **v0.2.0 architectural change.** The earlier draft conflated project-shape constraints (Time/Cost/Scope) with engineering-quality decisions. That's now split: `<iron-triangle>` owns the constraint surface and produces `capacityPoints`; this component spends the points on quality picks. The "max 3 Criticals" hard cap is gone — replaced by the budget. The hardcoded conflict matrix is gone — replaced by per-ility cost weights.

## Table of Contents

- [Purpose](#purpose)
- [The pedagogy — why scarcity is the point](#the-pedagogy--why-scarcity-is-the-point)
- [Architectural shift — what changed since v0.1](#architectural-shift--what-changed-since-v01)
- [Static HTML Form](#static-html-form)
- [Enhanced Form](#enhanced-form)
- [The cost-weight + capacity model](#the-cost-weight--capacity-model)
- [Slots](#slots)
- [Attributes and API](#attributes-and-api)
- [Events](#events)
- [Failure Modes](#failure-modes)
- [Accessibility](#accessibility)
- [CSS Tokens](#css-tokens)
- [Examples](#examples)
- [Relationship to other components](#relationship-to-other-components)

## Purpose

Teams routinely declare every quality attribute "must-have." The result is a requirements document where 11+ categories are all top-priority — meaningless. Real engineering means picking the few axes that justify cost and accepting the rest at baseline.

`<nfr-compass>` makes the trade visible and durable:
- Each Critical pick costs points from a project budget.
- Budget comes from `<iron-triangle>` (or a literal attribute as a fallback).
- Going over budget is allowed but requires a written rationale.
- Each Critical pick requires a one-sentence rationale.
- The output is a structured **quality vector** that downstream tools (ADRs, validators, dashboards, CI) can read.

The constraint *is* the artifact. The rationale is the protective shell that stops the choice from being relitigated every Monday.

## The pedagogy — why scarcity is the point

| Problem | Symptom | Compass remedy |
|---|---|---|
| **No scarcity** | Every ility flagged "must" → meaningless | Each Critical spends real points; team sees the running total |
| **No cross-cut** | 5+ pages of separate forms, no place where the trade lives | One surface, all 11 ilities, one decision moment |
| **No memory** | Priority gets relitigated every Monday | Required rationale per Critical, persisted in the vector |
| **No budget** | "Should we go performance-Critical?" gets answered by hunch | Points budget makes the trade arithmetic |
| **No over-budget honesty** | Teams tacitly exceed capacity without saying so | Over-budget reveals an `overrunRationale` textarea; the override is captured, not hidden |

## Architectural shift — what changed since v0.1

| Concept | v0.1 | v0.2 |
|---|---|---|
| Scarcity mechanism | Hard cap of 3 Criticals | Budget-sum cap (points spent ≤ capacity, with explicit overrun path) |
| Capacity source | Implicit / opinion-based | `<iron-triangle>` component, or `data-capacity-points` attribute |
| Conflict warnings | Hardcoded matrix (`performance + team-size <=2 → warn`) | Per-ility numeric cost weights summed against capacity. Project-tunable. |
| Cost as an ility | Yes (one of 12) | **No** — cost is project-shape, lives in `<iron-triangle>` |
| Ility count | 12 | **11** |
| Over-budget posture | n/a (cap was hard) | Allow + require `overrunRationale` field |

## Static HTML Form

Pre-upgrade, the markup is a semantic `<form>` with a `<fieldset>` per ility. Each ility has a `<legend>` (name) and a 4-button radio group (the priority levels). With no JS the form still submits as plain HTML — server-side a backend can read the picks and validate the budget.

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
  <!-- ... 10 more fieldsets ... -->
</nfr-compass>
```

Default ility list (11; cost dropped from v0.1 list):
performance, accessibility, security, reliability, maintainability, observability, compatibility, scalability, portability, internationalization, privacy.

## Enhanced Form

After upgrade the component:
- Wraps each fieldset's radio group as a single segmented-control row.
- Reveals each ility's rationale `<textarea>` only when Critical is selected for that row.
- Shows a live header readout: **"X of Y points spent"** (X = sum of cost weights for current Criticals; Y = `capacityPoints`).
- When `X > Y`, reveals an `overrunRationale` textarea below the rows. Saving the form requires it (≥ 10 chars).
- Reads capacity from a sibling `<iron-triangle>` (matched by `data-bind-to` / `id`), or from the `data-capacity-points` attribute, or from the `capacityPoints` property — whichever resolves first.
- Stamps the source triangle's hash into the saved vector as `ironTriangleHash` so `uucd nfr check` can detect drift.

```html
<iron-triangle id="project-shape"></iron-triangle>

<nfr-compass id="priorities" name="nfr-vector"
             data-bind-to="project-shape">
  <span slot="title">Quality priorities for v1</span>
  <!-- 11 fieldsets here, or omit to get the defaults -->
</nfr-compass>
```

## The cost-weight + capacity model

Two layers, both with shipped defaults, both override-friendly.

### Capacity (from `<iron-triangle>`)

Read via three resolution paths, in order:
1. Sibling `<iron-triangle>` element matched by `data-bind-to="<id>"`. Compass listens for `iron-triangle:change` and updates live.
2. `data-capacity-points` attribute (literal integer fallback for compass-only usage).
3. `capacityPoints` property (programmatic).

If none resolves, capacity is `Infinity` (the compass becomes informational — you can pick Criticals freely; no budget is enforced). A console warning suggests pairing with `<iron-triangle>`.

### Cost weights (per ility)

Default Critical cost weights — opinion, easy to override:

| Ility | Default Critical cost |
|---|---|
| accessibility | 3 |
| performance | 5 |
| security | 5 |
| reliability | 4 |
| observability | 3 |
| internationalization | 4 |
| compatibility | 2 |
| portability | 3 |
| privacy | 4 |
| scalability | 5 |
| maintainability | 2 |

Sum at all-Critical = 40. Realistic mid-size budget = 10–15 → forces real choice.

`Important`, `Acceptable`, and `Not relevant` cost 0 points (only Critical spends budget).

Project overrides via attribute, slotted JSON, or property:
```html
<nfr-compass data-cost-weights='{"performance": 8, "scalability": 8}'>
```

The merged weights (defaults + overrides) are **frozen into the saved vector** as `costWeights` so a future re-validation produces the same arithmetic.

### Over-budget posture

When `criticalSum > capacityPoints`:

1. The pick lands. The over-budget chip appears next to the heaviest Critical(s).
2. An `overrunRationale` textarea reveals below the row list with the prompt *"You're over budget by N points — explain why."*
3. The form refuses to submit until `overrunRationale.length >= data-min-overrun-rationale` (default 10).
4. The saved vector includes `overrunRationale` and the override is now durable.

The CLI's `nfr check` rejects vectors where `criticalSum > capacityPoints` and `overrunRationale` is missing (only possible via hand-edit; the UI prevents it).

## Slots

| Slot | Purpose | Required |
|---|---|---|
| `title` | Heading text shown above the rows | no (defaults to "NFR Compass") |
| (default slot) | `<fieldset>` rows. Omit to get the default 11 ilities. | no |
| `notes` | Project-supplied advisory notes (e.g. JSON conflict matrix, baseline overrides) | no |
| `footer` | Save/Submit button area | no |

## Attributes and API

| Attribute | Type | Default | Purpose |
|---|---|---|---|
| `name` | string | `nfr-vector` | Form-association field name |
| `data-bind-to` | string | absent | ID of a sibling `<iron-triangle>` to read capacity from |
| `data-capacity-points` | integer | absent | Literal capacity fallback |
| `data-cost-weights` | JSON object | absent | Per-ility cost-weight overrides |
| `data-min-rationale` | integer | `10` | Min characters for a Critical row's rationale |
| `data-max-rationale` | integer | `200` | Max characters for the rationale textarea |
| `data-min-overrun-rationale` | integer | `10` | Min chars for the `overrunRationale` |
| `data-max-overrun-rationale` | integer | `400` | Max chars for `overrunRationale` |
| `locked` | boolean | absent | Read-only mode for shipped vectors |
| `disabled` | boolean | absent | All inputs disabled |

### Properties

| Property | Type | Description |
|---|---|---|
| `vector` | `Record<string, 'critical' \| 'important' \| 'acceptable' \| 'not-relevant'>` | Get current picks. Setting it replaces the form state. |
| `rationales` | `Record<string, string>` | Get/set rationale strings. Keys must match Criticals in the vector. |
| `costWeights` | `Record<string, integer>` | Effective merged weights (defaults + overrides) |
| `capacityPoints` | integer | Get current capacity (resolved from sibling, attr, or prop) |
| `criticalSum` | integer (readonly) | Live sum of weights for current Criticals |
| `overBudget` | boolean (readonly) | `criticalSum > capacityPoints` |
| `overrunRationale` | string | Required textarea contents when over budget |
| `value` | object (readonly) | Full snapshot for serialization |

### Internal state hooks (`:state(...)`)

- `:state(over-budget)` — set when `criticalSum > capacityPoints` so CSS can highlight the readout
- `:state(missing-rationale)` — set during validation when any Critical lacks a complete rationale or `overrunRationale` is absent while over-budget

## Events

| Event | Detail | When |
|---|---|---|
| `nfr-compass:change` | `{ vector, rationales, costWeights, capacityPoints, criticalSum, overrunRationale, source }` | Any pick or rationale changes |
| `nfr-compass:over-budget` | `{ delta, criticalSum, capacityPoints }` | The selection just crossed into over-budget |
| `nfr-compass:under-budget` | `{ slack, criticalSum, capacityPoints }` | The selection just returned to within budget |

## Failure Modes

### No JavaScript
- **Behavior:** Plain `<fieldset>`s with native radios. No live readout, no over-budget chip; the form submits to its action and a server can validate the budget.
- **Acceptable:** Yes.

### No CSS
- **Behavior:** Vertical stack of fieldsets. Functional, ugly.
- **Acceptable:** Yes.

### No `<iron-triangle>` paired
- **Behavior:** Capacity resolves to `data-capacity-points`, then property, then `Infinity`. Compass becomes informational; no over-budget gate. Console warning suggests pairing.
- **Acceptable:** Yes — graceful degradation. The compass still enforces "Critical needs a rationale."

### Upgrade Delay
- **Behavior:** Native radios accept input. On upgrade the component reads existing picks, computes capacity, applies any over-budget UI.
- **Acceptable:** Yes.

### Keyboard Only
- **Tab order:** Across rows, then within a row across the 4 priority buttons. Rationale textarea is in tab order only when the row is Critical.
- **Acceptable:** Yes.

### Screen Reader
- **Roles:** Native `fieldset/legend/radiogroup`. No ARIA role overrides.
- **Live regions:** Header readout is `<output aria-live="polite">`. Over-budget message is announced when crossed.
- **Acceptable:** Yes.

### RTL / i18n
- **Behavior:** Logical properties throughout.
- **Acceptable:** Yes.

## Accessibility

- WCAG 2.2 AA target.
- Over-budget state is conveyed by text + icon, never color alone.
- The `overrunRationale` textarea has a visible character count via `aria-live="polite"`.
- The header readout is announced as picks change ("Now spending 12 of 10 points; rationale required").

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
| `--nfr-compass-overbudget-color` | `var(--color-error)` | Over-budget chip + readout when over |

## Examples

### Default 11 ilities, paired with iron-triangle

```html
<iron-triangle id="shape"></iron-triangle>
<nfr-compass name="v1-priorities" data-bind-to="shape"></nfr-compass>
```

### Compass-only (no triangle, fixed capacity)

```html
<nfr-compass name="v1-priorities" data-capacity-points="12"></nfr-compass>
```

### Custom cost weights for a perf-sensitive project

```html
<nfr-compass data-bind-to="shape"
             data-cost-weights='{"performance": 8, "reliability": 6, "observability": 5}'>
</nfr-compass>
<!-- A team treats perf as expensive (8 instead of 5). One perf-Critical
     pick now spends most of a small project's budget. -->
```

### Custom ility list (a docs site might only care about 6)

```html
<nfr-compass name="docs-priorities" data-bind-to="shape">
  <fieldset name="accessibility"><legend>Accessibility</legend>…</fieldset>
  <fieldset name="performance"><legend>Performance</legend>…</fieldset>
  <fieldset name="seo"><legend>SEO</legend>…</fieldset>
  <fieldset name="i18n"><legend>i18n</legend>…</fieldset>
  <fieldset name="maintainability"><legend>Maintainability</legend>…</fieldset>
  <fieldset name="cost"><legend>Cost</legend>…</fieldset>
</nfr-compass>
<!-- The author opts out of the default 11 entirely. -->
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

compass.vector = { performance: 'critical', security: 'critical', accessibility: 'important' };
compass.rationales = {
  performance: 'Sub-200ms TTI is our differentiator vs Competitor X.',
  security: 'We handle PHI; SOC 2 audit pending Q2.',
};

console.log(compass.criticalSum, compass.capacityPoints, compass.overBudget);
// e.g. 10, 12, false  — or 12, 10, true (with overrunRationale required)
```

### Locked / read-only published vector

```html
<nfr-compass locked>
  <!-- value attributes pre-checked, rationales pre-filled, overrunRationale captured -->
</nfr-compass>
```

## Relationship to other components

- **`<iron-triangle>`** (`vanilla-breeze-05y0`) — capacity supplier. Compass reads `capacityPoints` from a paired triangle and stamps `ironTriangleHash` into the saved vector for drift detection.
- **`<requirement-card>`** (`vanilla-breeze-zq4u`, demoted to row renderer / standalone display) — Shadow-DOM card for displaying a single ility row outside the compass (e.g. on a status dashboard).
- **`<nfr-envelope>`** (`vanilla-breeze-r6d0`, deferred) — radar-overlay visualizer. Defer until 2 real-world adoptions.
- **`requirements.schema.json`** (existing) — per-category WHAT-WE-TEST rows. Different lifecycle from the vector. The compass priority gates the per-category forms.
- **`nfr-vector.schema.json`** (`vanilla-breeze-rooj`) — schema for the compass output. Validates rationale completeness, capacity arithmetic, and `overrunRationale` invariant.
- **`uucd nfr` CLI** (`vanilla-breeze-ah93`) — CI guard.

## Open questions (smaller, can be settled during build)

1. **Default cost weights.** The 11-row table above is opinion. Easy to adjust during implementation.
2. **Soft "most projects pick 2–3 Criticals" hint.** Still useful UX even with the budget cap? Lean: yes, as a light-grey footnote under the readout, no enforcement.
3. **Surfacing baselines for "Acceptable".** Separate `nfr-baselines.json` data file shipped alongside the component, slot-overridable per project. Settled in earlier round.
4. **`<requirement-card>` standalone usage.** Once the compass is ready, what does `<requirement-card>` render outside the compass? Lean: a status-dashboard card showing one ility's priority + rationale + verification status, for projects that want to surface a single quality on their homepage.
