---
title: "Iron Triangle Specification"
component: iron-triangle
version: 0.1.0
status: draft
---

# Iron Triangle

A project-shape constraint surface that captures **Time × Cost × Scope** as one decision and computes a single integer capacity budget that downstream Planning Pack components (`<nfr-compass>` first) can spend on quality choices. Replaces the scattered `targetLaunch` field and informal "team-size" guesswork with one authoritative artifact.

## Table of Contents

- [Purpose](#purpose)
- [The pedagogy — why this surface exists](#the-pedagogy--why-this-surface-exists)
- [Static HTML Form](#static-html-form)
- [Enhanced Form](#enhanced-form)
- [The capacity model](#the-capacity-model)
- [Slots](#slots)
- [Attributes and API](#attributes-and-api)
- [Events](#events)
- [Failure Modes](#failure-modes)
- [Accessibility](#accessibility)
- [CSS Tokens](#css-tokens)
- [Examples](#examples)
- [Relationship to other components](#relationship-to-other-components)

## Purpose

Project teams routinely treat Time, Cost, and Scope as separate inputs that get filled in by different people in different documents at different times. The Iron Triangle (a.k.a. Triple Constraint) is the engineering-management observation that you cannot fix all three without paying somewhere — and the "somewhere" is usually quality. Making the trade visible at one surface, with one authoritative capacity number, lets every downstream decision be honest about the budget it's spending against.

`<iron-triangle>` is that surface. It captures all three corners on one screen, computes a `capacityPoints` integer the rest of the planning pack reads, and persists every revision with a required reason so the constraint surface accumulates memory.

## The pedagogy — why this surface exists

| Symptom of the missing surface | Iron Triangle's fix |
|---|---|
| Time lives in `targetLaunch`, cost is unrecorded, scope is fragmented across `features.json` and MoSCoW priorities. No place where the trade lives. | One surface, three corners, one decision moment. |
| Engineering-quality decisions ("can we afford performance-critical?") get answered by hunch. | Capacity is a real integer the team picked together. |
| When the team says "we'll just hire" or "we'll cut a feature", the change vanishes into a Slack thread. | `revisionLog` requires a reason for every edit. |

## Static HTML Form

Pre-upgrade, the markup is a semantic `<form>` with three `<fieldset>`s — Time, Cost, Scope — plus a fourth section for capacity. With no JS the form still submits as plain HTML; the server can persist the values and even compute capacity server-side. The component just adds the live readout, the formula visualization, and the revision-tracking machinery.

```html
<iron-triangle name="triangle">
  <fieldset name="time">
    <legend>Time</legend>
    <label>Sprint weeks <input name="time.sprintWeeks" type="number" value="2"></label>
    <label>Sprint count <input name="time.sprintCount" type="number" value="3"></label>
    <label>Hours/week  <input name="time.hoursPerWeek" type="number" value="40"></label>
    <label>Deadline    <input name="time.deadline" type="date"></label>
  </fieldset>

  <fieldset name="cost">
    <legend>Cost</legend>
    <label>Team FTE  <input name="cost.teamFTE" type="number" step="0.5" value="1"></label>
    <label>Budget tier
      <select name="cost.budgetTier">
        <option value="solo">Solo</option>
        <option value="small">Small (≤ $25k)</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>
    </label>
    <label>Contractor budget <input name="cost.contractorBudget" type="number"></label>
  </fieldset>

  <fieldset name="scope">
    <legend>Scope</legend>
    <label>Must-have count   <input name="scope.mustHaveCount" type="number"></label>
    <label>Should-have count <input name="scope.shouldHaveCount" type="number"></label>
    <label>Notes <textarea name="scope.scopeNotes"></textarea></label>
  </fieldset>

  <fieldset name="capacity">
    <legend>Capacity</legend>
    <output name="capacityPoints">—</output>
    <small name="capacityFormula">— (formula will appear after upgrade)</small>
  </fieldset>
</iron-triangle>
```

## Enhanced Form

After upgrade the component:
- Computes `capacityPoints` live from the formula `sprintWeeks × teamFTE × focusFactor` (default focusFactor `0.6`).
- Shows the formula text under the readout: *"based on 6 weeks × 1 FTE × 0.6 = 3.6 → 4 points"*.
- Provides a "Use a manual capacity" toggle that switches to a single integer input. T/C/S inputs stay editable but no longer drive capacity. `capacitySource` flips to `"manual"`.
- Form-associated: serializes the entire object as a single JSON string field via `setFormValue` so a wrapping `<form>` round-trips cleanly.
- Computes a stable hash (`fnv1a`) of the T/C/S object after each change, exposed via `.hash` and emitted in `iron-triangle:change`. Downstream consumers (notably `<nfr-compass>`) compare hashes to detect drift.

```html
<iron-triangle id="project-shape" name="triangle"
               data-focus-factor="0.6"
               data-min-capacity="1">
  <span slot="title">Project shape — v1.0</span>
</iron-triangle>
```

## The capacity model

`capacityPoints` is an integer that represents the engineering-quality budget the team has to spend across the project. It exists to make the question "can we afford this Critical pick?" answerable.

### Default formula

```
capacityPoints = ceil(sprintWeeks × teamFTE × focusFactor)
                  defaults: focusFactor = 0.6
```

The formula assumes 60% of FTE is available for engineering quality work; the remaining 40% goes to features, meetings, ops, and the unknowns.

Examples:
- 6 weeks × 1 FTE × 0.6 = **4 points** (solo project)
- 12 weeks × 3 FTE × 0.6 = **22 points** (small team, quarter-long)
- 26 weeks × 5 FTE × 0.6 = **78 points** (full team, half-year)

### Three operator paths

| Mode | When to use | UX |
|---|---|---|
| **Formula** (default) | Most cases. Team thinks in T/C/S, capacity falls out. | T/C/S inputs drive the readout live. Formula text shown beneath. `data-focus-factor` overrides the multiplier. |
| **Manual** | Team has a budget number from elsewhere (board, OKR commitment, prior project). | Toggle "Use manual capacity" reveals a single integer input. T/C/S still saved for context but doesn't drive capacity. |
| **Custom formula** (advanced, v1+) | Project wants a different model (e.g. `(sprintWeeks × teamFTE) - meetingsPerWeek`). | `data-capacity-formula` attribute supplies a string expression evaluated against `time.*`, `cost.*`, `scope.*`. Out of scope for v1; document the extension point. |

`capacitySource` (`"formula" | "manual"`) tracks which mode produced the saved number.

### Why not a tier-based system?

A simpler design would map T/C/S to a `small/medium/large` tier with hardcoded capacity per tier. It was rejected because:
- Tiers hide the math. The team can't see why a small project gets 5 points and a medium gets 12.
- Tiers force discrete jumps. A team that's halfway between small and medium has nowhere to land.
- Tiers smuggle opinions about what "small" means into a hidden lookup.

The integer-points model surfaces the trade — at the cost of asking the team to tune one number (the focus factor) — and that's the trade we want.

## Slots

| Slot | Purpose | Required |
|---|---|---|
| `title` | Heading text shown above the form | no (defaults to "Iron Triangle") |
| `time-controls` | Override the default Time inputs | no |
| `cost-controls` | Override the default Cost inputs | no |
| `scope-controls` | Override the default Scope inputs | no |
| `capacity-readout` | Override the readout block (advanced) | no |
| `footer` | Save/Submit button area | no |

## Attributes and API

| Attribute | Type | Default | Purpose |
|---|---|---|---|
| `name` | string | `triangle` | Form-association field name |
| `data-focus-factor` | number | `0.6` | Multiplier in the default formula |
| `data-min-capacity` | integer | `1` | Floor for `capacityPoints` |
| `data-capacity-formula` | string | absent | Custom formula expression (v1+) |
| `disabled` | boolean | absent | All inputs disabled |
| `locked` | boolean | absent | Read-only mode for shipped vectors |

### Properties

| Property | Type | Description |
|---|---|---|
| `time` | `{ sprintWeeks, sprintCount, hoursPerWeek, deadline }` | Get/set the Time corner |
| `cost` | `{ teamFTE, budgetTier, contractorBudget }` | Get/set the Cost corner |
| `scope` | `{ mustHaveCount, shouldHaveCount, scopeNotes }` | Get/set the Scope corner |
| `capacityPoints` | integer (readonly when source=formula; writable in manual mode) | Current budget |
| `capacitySource` | `"formula" \| "manual"` | Mode |
| `hash` | string (readonly) | FNV-1a of the T/C/S object — for drift detection |
| `revisionLog` | array (readonly) | Append-only edit history |
| `value` | object (readonly) | Full snapshot for serialization |

### Methods

| Method | Description |
|---|---|
| `revise(field, newValue, reason)` | Programmatic edit that appends to `revisionLog`. Throws if `reason.length < 10`. |
| `setManual(integer)` | Switch to manual mode and set `capacityPoints` |
| `setFormula(formulaString)` | Switch to formula mode (default formula or custom) |
| `recalc()` | Force capacity recomputation (rarely needed; happens on every input event) |

### Internal state hooks (`:state(...)`)

- `:state(formula)` — current source is formula
- `:state(manual)` — current source is manual integer
- `:state(over-deadline)` — deadline date is in the past (passive warning)
- `:state(unbudgeted)` — capacityPoints < `data-min-capacity` (formula yielded 0)

## Events

| Event | Detail | When |
|---|---|---|
| `iron-triangle:change` | `{ time, cost, scope, capacityPoints, capacitySource, hash, source: 'pointer'\|'keyboard'\|'api' }` | Any input or property change |
| `iron-triangle:revise` | `{ field, from, to, reason }` | A revision is committed via `revise()` |
| `iron-triangle:mode` | `{ from, to }` | Capacity source flips between formula and manual |

## Failure Modes

### No JavaScript
- **Behavior:** Plain `<fieldset>`s with native inputs. The form submits with raw T/C/S values to its action; the server computes capacity. No live readout.
- **Acceptable:** Yes.

### No CSS
- **Behavior:** Vertical stack of fieldsets. Functional, ugly.
- **Acceptable:** Yes.

### Upgrade Delay
- **Behavior:** Native inputs accept user input. On upgrade the component reads existing values, computes capacity for the first time, and starts emitting events.
- **Acceptable:** Yes.

### Keyboard Only
- **Tab order:** Across the four sections, then within each section across the inputs.
- **Acceptable:** Yes — uses native form inputs throughout.

### Screen Reader
- **Roles:** Native `fieldset/legend` semantics. The capacity readout is an `<output>` with `aria-live="polite"`.
- **Tested with:** VoiceOver, NVDA.
- **Acceptable:** Yes.

### RTL / i18n
- **Behavior:** Logical properties throughout. Numbers stay LTR per CSS Color 4 / formal-syntax convention.
- **Acceptable:** Yes.

## Accessibility

WCAG 2.2 AA target.
- The mode-switch toggle is a real `<button aria-pressed>` not a checkbox + label hack.
- The capacity readout's "based on …" formula text is wrapped in `<small>` and `aria-live="polite"`; screen readers hear "Capacity now 4 points based on 6 weeks times 1 F T E times 0.6".
- The deadline-in-past warning is not color-only — it's a text label "Deadline has passed" alongside any styling.

## CSS Tokens

| Token | Default | Purpose |
|---|---|---|
| `--iron-triangle-padding` | `var(--size-l)` | Outer padding |
| `--iron-triangle-section-gap` | `var(--size-l)` | Vertical gap between Time/Cost/Scope |
| `--iron-triangle-input-min` | `8rem` | Min width per numeric input |
| `--iron-triangle-readout-bg` | `var(--color-surface-raised)` | Capacity readout background |
| `--iron-triangle-readout-size` | `var(--font-size-3xl)` | Capacity number font size |
| `--iron-triangle-formula-color` | `var(--color-text-muted)` | Formula text |
| `--iron-triangle-warning-color` | `var(--color-warning)` | Over-deadline / unbudgeted warning |

## Examples

### Default (formula mode, no overrides)

```html
<iron-triangle></iron-triangle>
```

### Formula override — different focus factor

```html
<iron-triangle data-focus-factor="0.5"></iron-triangle>
<!-- 50% focus factor: more honest about meetings/ops/etc. -->
```

### Manual capacity (already negotiated with stakeholders)

```html
<iron-triangle id="t" name="triangle"></iron-triangle>
<script type="module">
  const t = document.getElementById('t');
  t.setManual(15);
</script>
```

### Listening for changes (compass binding)

```js
const triangle = document.getElementById('project-shape');
const compass = document.getElementById('priorities');

// Push the initial capacity
compass.capacityPoints = triangle.capacityPoints;
compass.dataset.ironTriangleHash = triangle.hash;

// And on every revision
triangle.addEventListener('iron-triangle:change', (e) => {
  compass.capacityPoints = e.detail.capacityPoints;
  compass.dataset.ironTriangleHash = e.detail.hash;
});
```

### Programmatic revision with reason

```js
triangle.revise('cost.teamFTE', 1, 2,
  'Hired a backend contractor for sprints 3–5; doubles capacity.');
// Appends to revisionLog; emits iron-triangle:revise
```

### Locked vector (released project)

```html
<iron-triangle locked>
  <!-- value attributes pre-filled from saved state; all inputs disabled -->
</iron-triangle>
```

## Relationship to other components

- **`<nfr-compass>`** (`vanilla-breeze-0tr4`) — primary consumer. Reads `capacityPoints`, listens for `iron-triangle:change`, and stamps `ironTriangleHash` into the saved vector for drift detection.
- **`<nfr-envelope>`** (`vanilla-breeze-r6d0`, deferred) — visualizer that draws the feasible region using this triangle's capacity as the envelope.
- **`requirements.schema.json`** (existing UUCD) — unchanged. The triangle is project-shape; requirements are per-category WHAT-WE-TEST.
- **`project.schema.json`** (UUCD) — `targetLaunch` is **removed** in favor of `iron-triangle.json`. Clean break, pre-release.

## Open questions

These are smaller and can be resolved during implementation; defaults are easy to tune.

1. **Default focus factor.** `0.6` is in the middle of the 50–70% range. Tunable per project via `data-focus-factor`; the default is the only opinion to settle.
2. **Iron Triangle persistence.** One per project version, where "version" is a folder. Same pattern as ADRs.
3. **Custom formula expression evaluator (v1+).** Out of scope for v1 — a v2 bead can wire in a small expression parser if real projects ask for it.
