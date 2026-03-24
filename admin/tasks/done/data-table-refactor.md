# Data Table Refactor Brief

## Objective

Keep `data-table` aligned with Vanilla Breeze's actual philosophy:

- the native HTML table is the real content and semantic baseline
- the public API is primarily the data attributes on the inner `<table>` and its cells, not a JS-first table engine
- the web component is a thin enhancement wrapper for sorting, filtering, pagination, expansion, and selection

The refactor should make that enhancement reliable and honest. It should not replace the table with a div-grid app model or move the component toward a data-grid abstraction the repo does not need.

The next implementation should deliver all of the following before any extra polish work:

- The documented feature surface matches the code that actually ships.
- Multi-instance tables remain independent.
- Row relationships remain stable under sort/filter/pagination.
- Reconnects do not accumulate setup state.
- Events, docs, and runtime payloads agree.

## Files To Read First

- `src/web-components/data-table/logic.js`
- `src/web-components/data-table/styles.css`
- `src/web-components/data-table/static.html`
- `src/web-components/data-table/README.md`
- `site/src/pages/docs/elements/web-components/data-table.njk`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The static fallback is exactly the right posture for VB in `src/web-components/data-table/static.html:9-25`.
- The table itself remains authored semantic HTML rather than being synthesized from data.
- Sorting, filtering, pagination, expansion, and selection are opt-in through markup.
- The component already exposes a modest public API instead of forcing everything through configuration objects.
- The no-JS story is strong and should remain the standard to protect.

## Current Failures

### 1. The docs and README promise responsive and sticky features that I did not find in the runtime

Evidence:

- The docs advertise responsive card mode and sticky headers/columns in `site/src/pages/docs/elements/web-components/data-table.njk:220`, `site/src/pages/docs/elements/web-components/data-table.njk:306-347`, and `site/src/pages/docs/elements/web-components/data-table.njk:463-475`
- The README also documents `data-responsive`, `data-sticky`, and `data-sticky-column` in `src/web-components/data-table/README.md:52-55` and `src/web-components/data-table/README.md:253-311`
- An `rg` sweep only turned up those features in the docs and README; I did not find matching `data-responsive` or `data-sticky` handling in `src/web-components/data-table/logic.js` or `src/web-components/data-table/styles.css`

Why this is bad:

- The repo is advertising a larger feature surface than the component currently implements.
- That makes it hard to know which regressions are code bugs and which are documentation bugs.

### 2. Selection count is scoped globally instead of to the component instance

Evidence:

- The selected-count element is found with `document.querySelector('[data-selected-count]')` in `src/web-components/data-table/logic.js:450-452`

Why this is bad:

- Two `data-table` instances on the same page can fight over one count display.
- This is a real multi-instance bug, not a philosophical concern.

### 3. The docs claim expansion controls are automatic, but the runtime requires authored buttons

Evidence:

- The docs say "A toggle button is automatically added" in `site/src/pages/docs/elements/web-components/data-table.njk:292-294`
- The runtime only works when a button with `[data-action="toggle-expand"]` already exists in `src/web-components/data-table/logic.js:398-403`
- The README's expansion example is actually closer to the runtime in `src/web-components/data-table/README.md:137-153`

Why this is bad:

- The docs are currently teaching the wrong markup contract for expansion.
- Authors can follow the docs exactly and still not get the feature.

### 4. Sorting, filtering, and pagination treat every `<tr>` as an independent data row, which can break expansion pairs

Evidence:

- `#allRows` is collected as every `tbody > tr` in `src/web-components/data-table/logic.js:89-92`
- Sorting runs against `this.#filteredRows` without distinguishing main rows from companion rows in `src/web-components/data-table/logic.js:257-289`
- Expansion assumes the detail row is the next sibling in `src/web-components/data-table/logic.js:405-425`
- Rendering reorders rows directly in the DOM in `src/web-components/data-table/logic.js:654-673`

Why this is bad:

- Expansion rows are structurally dependent on the row before them, but the current sort/filter/render path treats them like independent records.
- That can separate a detail row from its parent row or otherwise destabilize the authored table structure.
- This is the most important structural bug in the component.

### 5. Setup state is not fully reset on reconnect

Evidence:

- `connectedCallback()` always calls `#setup()` in `src/web-components/data-table/logic.js:73-82`
- `#setupSorting()` pushes header metadata into `#sortableHeaders` in `src/web-components/data-table/logic.js:144-167`
- `#cleanup()` removes listeners but does not reset `#sortableHeaders` in `src/web-components/data-table/logic.js:121-142`

Why this is bad:

- Reconnects can leave stale internal bookkeeping behind even if listeners are removed.
- This is a smaller issue than the row-relationship bug, but it still shows the setup path is not fully idempotent.

### 6. Event docs do not consistently match runtime payloads

Evidence:

- The docs use `matchCount` for filter events and `totalPages` for page events in `site/src/pages/docs/elements/web-components/data-table.njk:181-189` and `site/src/pages/docs/elements/web-components/data-table.njk:369-376`
- The runtime dispatches filter events as `{ query, count }` in `src/web-components/data-table/logic.js:371-378`
- The runtime dispatches page events as `{ page }` in `src/web-components/data-table/logic.js:694-697`
- The docs list selection detail as `{ selectedRows, count }` in `site/src/pages/docs/elements/web-components/data-table.njk:383-386`, while the runtime dispatches `{ count, rows }` in `src/web-components/data-table/logic.js:532-541`

Why this is bad:

- Events are part of the public contract.
- Mismatched payload docs create false bug reports and broken demos.

### 7. I did not find dedicated component behavior tests beyond the visual compendium fixture

Evidence:

- The compendium includes a `data-table` fixture in `tests/element-visual/compendium/compendium.json:1663-1674`
- I did not find dedicated `data-table` behavior tests under `tests/components`

Why this is bad:

- The biggest risks here are multi-instance behavior, row-pair integrity, and docs/runtime drift.
- Visual fixtures alone will not catch those regressions.

## Recommended Refactor Direction

## 1. Preserve the native table and the inner-table data-attribute API

Recommended direction:

- Keep the real table markup as the source of truth
- Keep the enhancement surface declarative on the table and cells
- Keep the custom element thin around that markup

That is the most important VB constraint here.

## 2. Choose an honest feature surface

There are only two good options:

- Implement `data-responsive` and `data-sticky` for real
- Or remove those claims from docs and README until the feature exists

The current ambiguous middle state is the problem.

## 3. Scope all auxiliary UI and state to the component instance

Required fixes:

- Do not use global `document.querySelector()` for instance-owned elements
- Keep selection count and bulk-action wiring inside the component boundary
- Make multi-instance behavior a first-class requirement

## 4. Treat expandable rows as row groups, not as independent sortable/filterable records

Recommended direction:

- Model an expandable row and its companion content row as one logical record
- Sort, filter, and paginate records, then render the paired rows together
- Preserve adjacency between parent and detail rows

This is the core structural refactor.

## 5. Make setup and cleanup fully idempotent

Refactor goal:

- Reset internal arrays and bookkeeping on disconnect or before setup
- Prevent repeated setup from accumulating stale metadata

## 6. Align event docs with actual runtime payloads

At minimum:

- Make the docs match the runtime
- Or intentionally change the runtime payloads and then update the docs, README, and demos together

The repo needs one event contract, not multiple near-matches.

## Suggested Implementation Sequence

1. Fix the row-group model for expansion so sorting/filtering/pagination work on logical records.
2. Scope selection count and other helper UI to the component instance.
3. Make setup/cleanup idempotent.
4. Decide whether responsive/sticky features are real or documentation debt.
5. Align docs, README, demos, and event payload descriptions.
6. Add behavior tests for the real risk areas.

## Acceptance Criteria

- Two `data-table` instances on the same page keep their selected counts separate.
- Expandable detail rows remain attached to their parent rows under sort, filter, and pagination.
- Docs and README only describe features that actually ship.
- Reconnecting a `data-table` does not duplicate setup bookkeeping or controls.
- Event payload docs match actual dispatched events.
- The plain table remains fully readable without JS.

## Tests That Should Exist After The Refactor

- A multi-instance selection-count test.
- An expansion-row integrity test under sorting.
- An expansion-row integrity test under filtering and pagination.
- A reconnect test for setup idempotency.
- An event-payload test for filter, page, and selection events.

## Do Not Do This

- Do not replace the native table with a div-grid data-grid architecture.
- Do not move the real API from markup to a JS configuration object unless the project explicitly wants a different philosophy.
- Do not keep documenting aspirational features as though they already ship.

## Bottom Line

`data-table` has the right baseline and the most serious remaining work is structural: preserve row relationships, make multi-instance state safe, and stop letting docs outrun the actual runtime.
