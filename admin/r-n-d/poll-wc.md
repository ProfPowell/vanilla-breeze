---
title: poll-wc Component Plan
description: Simple poll / survey with live results. Voting options as `<button data-option>` children with per-option count + own-vote flag. Single-choice or multi-choice. Closed state shows results without voting. Presentational; author owns persistence.
tags:
  - web-components
  - specification
  - social
  - vanilla-breeze
date: 2026-05-14
status: draft
---

# poll-wc Component Plan

## Why this exists

A small voting primitive: question, list of options with counts, per-user "did I vote?" flag, and an optional closed state that reveals results without allowing votes. Mirrors the `<reaction-bar>` author-owned-state pattern: the component is presentational, emits a single `poll-wc:vote` event, and authors call back with the new counts via `setCount`.

| Adjacent | Why not this |
|----------|--------------|
| `<reaction-bar>` | Many small icons toggled per-user. Polls have a single vote and a question. |
| `<star-rating>` | Single 1–N rating, form-associated. Polls have arbitrary labelled options. |
| `<form>` + radio group | Plain form input — submitted with a parent form, no live results. |
| `<chart-wc>` | Renders a chart from data. Polls combine voting + result-visualization in one widget. |

## Scope

**In:**
- `<button data-option>` children carry the option label, vote count, and own-vote flag
- Single-choice (default) or multi-choice (`data-multi`)
- Optional question slot
- Closed state (`data-closed`) — disable voting, display results
- Result visualization: bar chart per option, scaled to the largest count
- Total-vote count displayed beneath
- Single event channel: `poll-wc:vote` with `{ option, action: 'add'|'remove', count, mine }`
- `setCount(option, count, { mine })` author-owned update method (mirrors `reaction-bar.setCount`)

**Out:**
- Backend persistence (author hooks `:vote`)
- Anonymous voting / fingerprinting — author concern
- Multi-question surveys — that's a different primitive (composing multiple `poll-wc` elements is the answer)
- Rich results (per-option avatars of voters) — defer
- Time-windowed polls (auto-closes at a date) — author wires that and toggles `data-closed`

## HTML API

```html
<poll-wc
  data-multi              <!-- allow multiple selections -->
  data-closed             <!-- read-only / results-only -->
  data-show-counts        <!-- show numeric counts beside the bars (default true) -->
  aria-label="Pick a launch date"
>
  <span slot="question">When should we ship?</span>

  <button data-option="friday"   data-count="12">Friday</button>
  <button data-option="next-mon" data-count="33" data-mine>Next Monday</button>
  <button data-option="next-fri" data-count="8">Next Friday</button>
  <button data-option="never"    data-count="2">Never</button>
</poll-wc>
```

### Option attributes

| Attribute | Purpose |
|-----------|---------|
| `data-option` | Stable identifier sent in events |
| `data-count` | Current vote count |
| `data-mine` | Current user voted for this option |

The button text content is the option label.

## Events

- `poll-wc:vote` — `{ option, action: 'add'|'remove', count, mine }`. Bubbles. Single-choice mode: when adding a vote, the previously-selected option (if any) emits a separate `:vote` with `action: 'remove'` first.
- `poll-wc:closed-change` — `{ closed }` when `data-closed` is toggled (rare; useful for analytics).

## Programmatic API

```js
const poll = document.querySelector('poll-wc');

// Update a single option after the server confirms
poll.setCount('next-mon', 34, { mine: true });

// Bulk update from a server snapshot
poll.setCounts({ friday: 12, 'next-mon': 34, 'next-fri': 9, never: 2 }, { mine: 'next-mon' });

// Close the poll programmatically
poll.close();
poll.open();

// Read totals
poll.totalVotes; // number
poll.myVotes;    // string[] of option ids
```

## Accessibility

- Host: `role="group"` (or `role="radiogroup"` / `role="checkboxgroup"` per `data-multi`)
- Options: `role="radio"` (single) or `role="checkbox"` (multi) with `aria-checked`
- `<output>` for the total-vote count, `aria-live="polite"` so screen readers announce changes
- Closed state: options get `aria-disabled="true"`, focus + keyboard nav still work
- Result bars marked `aria-hidden="true"` (the count text already conveys the value)
- Keyboard: Arrow keys move between options (radio-group convention); Space toggles
- Per-option `aria-label` derived: e.g. "Next Monday, 33 votes, you voted"

## CSS architecture

- Layer: `@layer components`
- Each option is a horizontal row: label + bar + count
- Bars: `width: calc(var(--option-pct) * 1%)` set inline by JS
- Mine: accent border + filled background (mirrors `reaction-bar` mine styling)
- Closed: muted bar color, no hover, cursor: default
- Tokens: `--color-action-*`, `--color-action-subtle`, `--color-surface-raised`, `--space-*`, `--radius-m`

## Composition

```html
<!-- Inline question + options -->
<poll-wc aria-label="Favorite framework">
  <span slot="question">What's your favorite framework?</span>
  <button data-option="vue"    data-count="42">Vue</button>
  <button data-option="react"  data-count="33">React</button>
  <button data-option="svelte" data-count="17">Svelte</button>
</poll-wc>

<!-- Closed poll showing results only -->
<poll-wc data-closed aria-label="Q4 retro vote (closed)">
  <span slot="question">Best win this quarter?</span>
  <button data-option="ship"    data-count="22">Shipping VB 1.0</button>
  <button data-option="onboard" data-count="9">Onboarding revamp</button>
  <button data-option="docs"    data-count="14">Docs rewrite</button>
</poll-wc>

<!-- Multi-choice -->
<poll-wc data-multi aria-label="Which features matter to you?">
  <span slot="question">Which features matter to you? (pick any)</span>
  <button data-option="dark"      data-count="80" data-mine>Dark mode</button>
  <button data-option="i18n"      data-count="55">i18n</button>
  <button data-option="offline"   data-count="40" data-mine>Offline</button>
  <button data-option="oauth"     data-count="30">OAuth</button>
</poll-wc>
```

## File structure

```
src/web-components/poll-wc/
├── api.json
├── logic.js
├── styles.css
└── static.html
```

## Implementation checklist

- [ ] Scaffold; VBElement subclass
- [ ] On setup, scan `:scope > button[data-option]`; decorate each with bar + count
- [ ] Compute total + per-option pct; set inline `--option-pct` custom prop
- [ ] Single-choice mode: clicking a new option emits remove for the previous + add for the new
- [ ] Multi-choice mode: clicking toggles independently
- [ ] Closed mode: aria-disabled, no click handlers fire toggle, results display unchanged
- [ ] `setCount` / `setCounts` / `close` / `open` imperative API
- [ ] `totalVotes` / `myVotes` getters
- [ ] WAI-ARIA radiogroup / checkboxgroup pattern; arrow-key nav (single) or focus-cycling (multi)
- [ ] Register in `src/web-components/index.js` + `index.css` (full bundle, not core)
- [ ] Demo at `demos/examples/demos/poll-wc-launch-date.html` with mocked backend
- [ ] Doc page with adjacency table (vs `reaction-bar`, `star-rating`, `form` + radio)

## Open questions

- **Should the component show the user "you voted" for their selected option even before any clicks?** Yes — `data-mine` on author render handles this.
- **Should the host be `<form>`-associated?** No — polls don't usually submit with a form; events are the right channel.
- **How should ties / zero-vote options render?** Zero-vote options show an empty bar; ties render with equal bar widths.

## References

- `src/web-components/reaction-bar/` — author-owned state pattern + `setCount` precedent
- `src/web-components/star-rating/` — single-value sibling (form-associated)
- WAI-ARIA Radio Group: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
- WAI-ARIA Checkbox: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
