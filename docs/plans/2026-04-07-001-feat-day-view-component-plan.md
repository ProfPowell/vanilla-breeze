---
title: "feat: day-view standalone hour-grid component"
type: feat
status: active
date: 2026-04-07
---

# feat: day-view standalone hour-grid component

## Overview

Build a `<day-view>` web component that renders an hour-grid schedule for a single day. Progressive enhancement: the static HTML is an `<ol>` with `<li>` entries containing `<time>` elements — a readable schedule without JS. CSS positions items into a visual hour grid. JS adds interactivity (click-to-expand, keyboard navigation, event dispatch).

The component serves three roles: (1) standalone schedule/agenda view, (2) drill-down from calendar-wc's large view, (3) future column in `<week-view>`.

## Problem Frame

calendar-wc has an hour grid inside its day detail overlay (`#openDayDetail`), but it's trapped in a modal tied to calendar-wc's DOM. There is no reusable, standalone hour-grid component. Building `<day-view>` extracts this concept into a first-class component with an HTML-first progressive enhancement story using semantic elements (`<ol>`, `<time>`, `<data>`, `<details>`).

## Requirements Trace

- R1. Static HTML renders as a readable ordered list of events with times — no JS required
- R2. CSS enhancement positions events into an hour-grid layout using CSS Grid
- R3. Hour range defaults to working hours (7:00–19:00) with `data-start-hour`/`data-end-hour` overrides
- R4. JS enhancement adds click-to-expand details, keyboard navigation, and event dispatch
- R5. Component works standalone, as calendar-wc drill-down, and as future week-view column
- R6. Locale-aware hour labels via `Intl.DateTimeFormat`
- R7. Supports event metadata: label, time, duration, color, icon, category
- R8. Ships with api.json, static.html, demo, and doc page per VB conventions

## Scope Boundaries

- Not building week-view yet (separate bead `vanilla-breeze-le56`)
- Not building drag-to-reschedule (future enhancement)
- Not integrating with calendar-wc in this unit (separate integration step)
- Not adding event CRUD (day-view is display/read-only like calendar-wc)
- Not parsing iCalendar/RRULE (library territory)

## Context & Research

### Relevant Code and Patterns

- **Existing hour grid**: `src/web-components/calendar-wc/logic.js` lines 812–867 — sparse hour grid with localized labels, event chips with color/icon
- **Locale helpers**: `getLocalizedHours(locale)` in calendar-wc — reusable pattern for hour label generation via `Intl.DateTimeFormat`
- **VBElement base**: `src/lib/vb-element.js` — setup()/teardown() lifecycle, listen() for auto-cleanup
- **Component registration**: `src/lib/bundle-registry.js` — `registerComponent(tag, class)`
- **Reference component**: `src/web-components/accordion-wc/` — progressive enhancement over native `<details>`, good pattern for enhancing semantic HTML
- **Static HTML pattern**: `src/web-components/accordion-wc/static.html` — full HTML document demonstrating the zero-JS baseline

### Institutional Learnings

- **HTML-first philosophy**: Escalation ladder — plain HTML+CSS first, CSS-only custom element second, web component only when JS is genuinely required
- **Ship docs with components**: Every component needs demo, doc page, nav entry, api.json
- **Foundation-first**: Build the semantic HTML layer first, then layer CSS positioning, then JS interactivity

## Key Technical Decisions

- **Semantic markup is `<ol>` with `<li>` + `<time>`**: An ordered list is semantically correct for a chronological schedule. Each `<li>` contains a `<time datetime="HH:MM">` for the event start, and optionally a `<time>` with `datetime` duration format (`PT1H`, `PT30M`) for event length. Screen readers announce as "list of N items" which is meaningful.
- **CSS Grid for hour positioning**: The component container uses `display: grid` with `grid-template-rows: repeat(N, 1fr)` where N = number of hours. Events are positioned via `grid-row: start / span duration`. This is pure CSS — works without JS if the grid-row values are set as inline styles or data-attributes in the static HTML.
- **Working hours default (7:00–19:00)**: `data-start-hour="7"` and `data-end-hour="19"` default values. Override with `data-start-hour="0" data-end-hour="23"` for full 24h. Events outside the visible range get a collapsed "N earlier" / "N later" indicator.
- **`<details>` for expandable event info**: Each event `<li>` can contain a `<details>` element for additional info (location, attendees, description). Works without JS via native `<details>` toggle.
- **`<data>` for metadata**: Event metadata (category, priority, resource) carried as `<data value="...">` elements inside each `<li>`. CSS can target via attribute selectors; JS can read programmatically.
- **Locale from `lang` attribute**: Same pattern as calendar-wc — `this.closest('[lang]')?.lang || navigator.language`.
- **Light DOM**: Events stay in light DOM (not shadow). The component enhances the existing `<ol>` children rather than replacing them. This preserves the progressive enhancement story and lets page CSS style events.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification.*

```
Static HTML (no JS):                    Enhanced (with JS):

<day-view data-date="2026-04-10">       <day-view data-date="2026-04-10"
  <ol>                                           data-upgraded>
    <li>                                  ┌─────────────────────────┐
      <time datetime="09:00">9 AM</time> │ 7:00  _________________ │
      <data value="meeting">Meeting</data>│ 8:00  _________________ │
      Sprint standup                      │ 9:00  ┌──────────────┐ │
      <details>                           │       │ Sprint standup│ │
        <summary>Details</summary>        │       │ 📍 Room B     │ │
        <p>Room B, 30 min</p>            │       └──────────────┘ │
      </details>                          │ 10:00 _________________ │
    </li>                                 │ ...                     │
    <li>                                  │ 14:00 ┌──────────────┐ │
      <time datetime="14:00">2 PM</time> │       │ Design review │ │
      Design review                       │       │ 2h duration   │ │
    </li>                                 │       └──────────────┘ │
  </ol>                                   │ ...                     │
</day-view>                               └─────────────────────────┘
```

## Implementation Units

- [ ] **Unit 1: Component scaffold and static HTML pattern**

  **Goal:** Create the component directory with all required files. Define the static HTML contract (what authors write) and the api.json manifest.

  **Requirements:** R1, R8

  **Dependencies:** None

  **Files:**
  - Create: `src/web-components/day-view/logic.js`
  - Create: `src/web-components/day-view/styles.css`
  - Create: `src/web-components/day-view/api.json`
  - Create: `src/web-components/day-view/static.html`
  - Modify: `src/web-components/index.js` (register import)
  - Modify: `.claude/schemas/elements.json` (add element definition)

  **Approach:**
  - `logic.js`: VBElement subclass with setup()/teardown() stubs, registerComponent call
  - `api.json`: element name, type, attributes (data-date, data-start-hour, data-end-hour), events (day-view:event-click)
  - `static.html`: Full HTML document demonstrating the `<ol>` + `<time>` markup pattern — readable without JS
  - Register in index.js, add to elements.json

  **Patterns to follow:**
  - `src/web-components/accordion-wc/` for progressive enhancement over semantic HTML
  - Scaffold command pattern from `.claude/commands/scaffold-component.md`

  **Test expectation:** none — pure scaffolding

  **Verification:** `npm run validate:api` passes; `npm run check:component-files` passes; component directory has all 4 required files

- [ ] **Unit 2: CSS hour-grid layout**

  **Goal:** Style the `<ol>` children into a positioned hour grid using CSS Grid. This should work with the static HTML alone (CSS-only enhancement).

  **Requirements:** R2, R3

  **Dependencies:** Unit 1

  **Files:**
  - Modify: `src/web-components/day-view/styles.css`

  **Approach:**
  - Container: `display: grid; grid-template-rows: repeat(var(--_hours), 1fr)` where `--_hours` is computed from start/end hour range
  - Hour labels rendered as a pseudo-grid or as styled elements within the list
  - Each `<li>` positioned via `grid-row` based on its `<time datetime>` value — for CSS-only, use `data-hour` attribute on `<li>` that maps to grid-row
  - Hour lines as grid row borders or `::before` pseudo-elements
  - Current time indicator line (via `--_now` custom property if JS sets it)
  - Scope with `@scope (day-view)`
  - Responsive: on narrow containers, revert to plain list layout

  **Patterns to follow:**
  - Calendar-wc `@scope` pattern from `src/web-components/calendar-wc/styles.css`
  - CSS Grid positioning from `src/web-components/calendar-wc/styles.css` (large mode container queries)

  **Test expectation:** none — pure CSS styling

  **Verification:** Static HTML in a browser shows events positioned in an hour grid without JS loaded

- [ ] **Unit 3: JS enhancement — hour grid rendering and event positioning**

  **Goal:** The JS enhances the static `<ol>` by reading `<time>` elements, computing grid positions, adding localized hour labels, and handling the visible hour range.

  **Requirements:** R3, R4, R6, R7

  **Dependencies:** Units 1, 2

  **Files:**
  - Modify: `src/web-components/day-view/logic.js`
  - Test: `tests/unit/day-view.test.js`

  **Approach:**
  - In `setup()`: read `data-start-hour` (default 7) and `data-end-hour` (default 19)
  - Scan child `<ol> > li` for `<time datetime="HH:MM">` elements
  - Compute grid-row positions: `row = hour - startHour + 1`, `span = durationHours || 1`
  - Set `style.gridRow` on each `<li>` for precise positioning
  - Generate hour label elements and insert them alongside the grid
  - Locale-aware labels via `Intl.DateTimeFormat(locale, { hour: 'numeric' })`
  - Events outside the visible range: count and show "N earlier" / "N later" indicators at top/bottom
  - Read `<data>` children for category metadata — add as `data-category` on the `<li>` for CSS targeting
  - Set `--_now` custom property for current-time indicator line
  - Dispatch `day-view:event-click` when an event `<li>` is clicked

  **Patterns to follow:**
  - calendar-wc's `getLocalizedHours()` pattern
  - calendar-wc's event chip rendering (color, icon support)
  - accordion-wc's progressive enhancement approach (reads existing DOM, enhances in place)

  **Test scenarios:**
  - Happy path: 3 events at 9:00, 12:00, 14:00 → positioned at correct grid rows within 7-19 range
  - Happy path: `data-start-hour="0" data-end-hour="23"` → 24 hour labels rendered
  - Happy path: Event with `<time datetime="PT2H">` duration → spans 2 grid rows
  - Edge case: Event at 06:00 with default range 7-19 → "1 earlier" indicator shown
  - Edge case: No `<time>` in an `<li>` → item rendered but not grid-positioned (falls to end)
  - Edge case: Empty `<ol>` → empty grid with hour labels only
  - Edge case: `lang="fr"` ancestor → hour labels in French (14 h, 15 h)
  - Integration: `day-view:event-click` fires with event detail containing the `<li>` content

  **Verification:** Events render in correct grid positions; hour labels are locale-aware; events outside range show overflow indicators

- [ ] **Unit 4: Demo and documentation**

  **Goal:** Ship the demo page and doc page so the component is discoverable and testable.

  **Requirements:** R8

  **Dependencies:** Units 1-3

  **Files:**
  - Create: `demos/examples/demos/day-view-basic.html`
  - Create: `site/src/pages/docs/elements/web-components/day-view.html`
  - Modify: `site/data/navigation.json` (add nav entry)

  **Approach:**
  - Demo: realistic day schedule with 5-6 events at various times, some with `<details>` expansion, some with `<data>` categories, one with duration
  - Doc page: overview, markup pattern, attributes table, JS properties, events, CSS tokens, keyboard, accessibility notes
  - Navigation: add to "Interaction" group in web components sidebar

  **Patterns to follow:**
  - `site/src/pages/docs/elements/web-components/calendar-wc.html` for doc page structure
  - `demos/examples/demos/calendar-wc-basic.html` for demo structure

  **Test expectation:** none — documentation

  **Verification:** Doc page renders at `https://vb.test/docs/elements/web-components/day-view/`; demo is accessible from the doc page; `npm run conformance` passes on the demo

## System-Wide Impact

- **Interaction graph:** day-view is a new leaf component — no existing components depend on it. Future: calendar-wc could use it for day detail drill-down; week-view will compose 7 day-views.
- **Unchanged invariants:** calendar-wc's existing day detail overlay is not modified in this plan. Integration is a separate step.
- **API surface parity:** The `<ol>` + `<time>` markup pattern must be stable since week-view and calendar-wc will depend on it.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| CSS Grid positioning of `<li>` inside `<ol>` may conflict with list semantics | Test with screen readers; `role="list"` is preserved on `<ol>`, `role="listitem"` on `<li>` regardless of grid positioning |
| Events spanning multiple hours need sub-hour precision | Support `datetime="09:30"` for 30-min offsets; grid can use half-hour rows if needed (defer to implementation) |
| Integration with calendar-wc day detail overlay | Deferred — calendar-wc continues using its internal overlay; integration is a follow-up |

## Future Considerations

- **calendar-wc integration**: Replace the internal `#openDayDetail` hour grid with an embedded `<day-view>` component
- **week-view composition**: 7 `<day-view>` columns in a `<table>` grid
- **Drag-to-reschedule**: Move events by dragging `<li>` to different time slots (compose with `drag-surface`)
- **Current time line**: Animate a "now" indicator line that updates every minute

## Sources & References

- Related bead: `vanilla-breeze-uz4t` (this component)
- Related bead: `vanilla-breeze-le56` (week-view, depends on day-view)
- Related bead: `vanilla-breeze-pi8k` (gantt-chart, shares `<time>` + `<progress>` patterns)
- Existing code: `src/web-components/calendar-wc/logic.js` (hour grid at lines 812–867)
- HTML spec: `<time>` datetime formats including duration (`PT1H30M`)
