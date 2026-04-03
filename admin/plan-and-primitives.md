# Planning Pack: Plan And Primitives

## Thesis

Vanilla Breeze already has enough primitives to cover a large part of the proposed planning-pack surface without adding seven new first-class components.

The efficient path is:

1. Use existing layout and interaction primitives compositionally first.
2. Group the proposed ideas into a small number of surface families.
3. Only extract a new public primitive when at least two real components clearly share the same structure, behavior, and event model.

The proposed list is not one family. It naturally breaks into four:

- **Lane boards**: `kanban-board`, `retrospective-board`, existing `story-map`
- **Quadrant surfaces**: existing `impact-effort`, `swot-analysis`, `stakeholder-map`
- **Tables/registers**: `decision-matrix`, `risk-register`
- **Timelines**: `gantt-chart`

That matters, because trying to solve all of these with one generalized “planning widget” would add abstraction noise and bloat quickly.

## What VB Already Has

### Layout primitives

VB already has a strong non-JS layout layer:

- `data-layout="stack"` for vertical lanes
- `data-layout="grid"` for responsive boards and matrix shells
- `data-layout="cluster"` for badges, controls, and chip rows
- `data-layout="sidebar"` and `data-layout="switcher"` for split or adaptive planning views
- `layout-card` for surfaced panels
- `data-layout-subgrid` for aligning repeated card internals across a board

This is enough to build most planning page geometry with semantic HTML alone.

### Interaction primitive

`<drag-surface>` is already the key planning primitive:

- reorder within a surface
- transfer between surfaces by shared `group`
- keyboard support
- live region announcements
- vertical and horizontal modes
- optional drag handles

This is already sufficient for kanban-style movement and board interaction.

### Content atoms already available

- `<user-story>` is a reusable planning card with `minimal`, `compact`, and full detail modes
- `<user-persona>` and `<user-journey>` already cover persona/journey artifacts
- `<empathy-map>` already covers one editable quadrant-style artifact

In other words, VB already has a portable planning card and one specialized quadrant editor.

### Data/display primitives already available

- `<data-table>` already covers sorting, filtering, pagination, expansion, and selection
- `<card-list>` already covers JSON-driven card rendering safely
- `<chart-wc>` already covers table-to-chart enhancement for standard chart types

That makes `risk-register` and `decision-matrix` look much more like structured table work than like brand new planning widgets.

### Existing planning composites

Two current components are especially important because they show the architectural direction that already works:

- `<impact-effort>` is a light-DOM composite over four internal `<drag-surface>` instances
- `<story-map>` is a light-DOM composite over labeled columns, each with a `<drag-surface>`

Those are not giant monoliths. They are orchestrators over existing primitives.

## Key Architectural Read

The existing planning system already suggests a good split:

- **Shadow DOM components** for self-contained content artifacts like `user-story` and `empathy-map`
- **Light DOM components** for orchestration surfaces like `impact-effort` and `story-map`

That is the right direction to continue.

If a planning component is mostly:

- arranging children
- labeling regions
- wiring drag/transfer events
- optionally loading JSON

then it should generally be a **light-DOM composite**, not a heavy self-contained widget.

If it is mostly:

- rendering one authored artifact
- encapsulating internal presentation
- exposing a compact/full display API

then Shadow DOM is more reasonable.

## Mapping The Proposed Components

| Proposed component | Best first implementation | New public primitive needed now? | Notes |
|---|---|---:|---|
| `kanban-board` | Composition with `data-layout="grid"` + per-column `drag-surface` + `user-story` or plain cards | No | Already demonstrated by the drag-surface kanban demo. |
| `retrospective-board` | Same board recipe as kanban with different lane labels | No | This is a preset, not a new behavior model. |
| `decision-matrix` | `data-table`-based scoring table, maybe with formula helpers later | No | This is not really a 2x2 grid; it is a weighted scoring table. |
| `swot-analysis` | Start as semantic 2x2 layout or thin quadrant composite | Not yet | More similar to an editable artifact like `empathy-map` than to a drag board. |
| `stakeholder-map` | Quadrant composite over a 2x2 shell, optionally draggable cards | Not yet | V1 can be quadrant buckets; later versions might need finer x/y placement. |
| `risk-register` | `data-table` recipe or thin wrapper over `data-table` | No | Sorting/filtering/expansion already exist. |
| `gantt-chart` | Probably the one truly new component if needed | Maybe later | Current `chart-wc` supports standard chart types, not an obvious gantt/range timeline model. |

## Recommendation By Family

### 1. Lane Boards

This family includes:

- `kanban-board`
- `retrospective-board`
- existing `story-map`

### Current primitive fit

VB already has almost everything needed:

- `data-layout="grid"` for columns
- `data-layout="stack"` for lane structure
- `<drag-surface>` for reorder and cross-lane transfer
- `<user-story>` for rich cards
- `<card-list>` if JSON-fed card generation is needed

### Recommendation

Do **not** add `kanban-board` as a first-class component first.

Start with:

- a documented composition recipe
- a polished demo
- maybe one or two snippets

Example shape:

```html
<section data-layout="grid" data-layout-min="15rem" data-layout-gap="m">
  <section data-layout="stack" data-layout-gap="s">
    <h3>To Do</h3>
    <drag-surface group="tasks" data-layout="stack" data-layout-gap="xs">
      <user-story draggable="true" data-id="PROJ-101" detail="minimal"></user-story>
    </drag-surface>
  </section>

  <section data-layout="stack" data-layout-gap="s">
    <h3>In Progress</h3>
    <drag-surface group="tasks" data-layout="stack" data-layout-gap="xs"></drag-surface>
  </section>

  <section data-layout="stack" data-layout-gap="s">
    <h3>Done</h3>
    <drag-surface group="tasks" data-layout="stack" data-layout-gap="xs"></drag-surface>
  </section>
</section>
```

### When a new primitive becomes justified

If the same needs repeat across kanban, retro, and future board variants, then extract a shared board primitive.

That primitive would be something like an internal or public `board-surface`:

- labeled lanes
- optional counters
- optional empty-state text
- shared drag group wiring
- optional horizontal scrolling
- optional JSON lane loading

The important point is that **story-map already proves this family exists**, but there is no reason to rush a generic public primitive until a second or third consumer needs exactly the same structure.

### Practical call

- `kanban-board`: recipe first
- `retrospective-board`: recipe first
- `story-map`: keep as the specialized planning board already in the pack

If later extracted, `story-map` should probably become a specialization of a lower board utility, not the other way around.

### 2. Quadrant Surfaces

This family includes:

- existing `impact-effort`
- `swot-analysis`
- `stakeholder-map`

This is where your “grid-surface” instinct is strongest, but it needs one refinement: not all quadrant artifacts want the same behavior.

### What is already true

`<impact-effort>` already behaves like a domain-specific quadrant orchestrator:

- hardcoded 2x2 shell
- axis labels
- quadrant titles and descriptions
- internal `<drag-surface>` cells
- optional JSON data mode

`<empathy-map>` is also a quadrant artifact, but it is not drag-based. It is an authored/editable content artifact instead.

### Important distinction

There are really two quadrant sub-families:

- **drag-based quadrants**: `impact-effort`, likely `stakeholder-map`
- **editable/authored quadrants**: `empathy-map`, likely `swot-analysis`

That means one primitive can easily become too broad if it tries to solve both drag orchestration and editable content authoring in one API.

### Recommendation

Do not immediately create a giant public `grid-surface` that tries to solve every quadrant use case.

Instead:

1. Keep `impact-effort` as-is for now.
2. If a second drag-based quadrant tool lands, extract an internal `matrix-surface` helper or thin public primitive.
3. Keep authored/editable quadrant artifacts on a separate path unless the APIs truly converge.

### What a good `matrix-surface` would do

Only if extracted, it should stay narrow:

- render a 2x2 shell
- label rows/columns or cells
- host four semantic regions
- optionally instantiate internal `drag-surface` cells
- emit normalized move events when used in drag mode

It should **not** also try to become:

- a weighted scoring table
- a freeform canvas
- an editing framework

### Component recommendations

- `swot-analysis`
  - start as either a semantic 2x2 recipe or a thin component
  - if editable, it is closer to `empathy-map` than to `impact-effort`
- `stakeholder-map`
  - start as a thin specialization of the drag-based quadrant family
  - if later you want arbitrary in-cell positioning rather than simple quadrant membership, that becomes a second-phase problem

### 3. Tables And Registers

This family includes:

- `decision-matrix`
- `risk-register`

This is the family most likely to get over-engineered if treated as “planning components” instead of “semantic tables with enhancements.”

### Decision matrix

A weighted decision matrix is usually:

- options as rows
- criteria as columns
- weights and totals
- maybe sortable totals and hidden detail rows

That is a table, not a quadrant surface.

### Risk register

A risk register is also naturally a table:

- risk
- owner
- likelihood
- impact
- score
- mitigation
- status

This fits `data-table` immediately.

### Recommendation

Do **not** create dedicated first-class components first.

Start with:

- semantic HTML tables
- `<data-table>` for filtering, sorting, paging, selection, row expansion
- optional CSS/status chips for risk severity or decision outcomes

If repeated scoring logic is useful, add small helpers later:

- score calculation utility
- preset column rendering
- docs snippets

But the main surface should remain a table.

### Why this matters

If `risk-register` and `decision-matrix` become separate bespoke components too early, you will likely duplicate:

- table semantics
- filtering
- sorting
- state chips
- mobile collapse logic
- print handling

VB already has that solved once.

### 4. Timelines

This family currently means:

- `gantt-chart`

This is the one proposed item that does not obviously collapse into the current primitives.

### Why it is different

A real gantt view needs:

- time axis
- range bars with start/end
- grouped rows
- milestone handling
- maybe dependencies later

Current `chart-wc` supports:

- line
- area
- bar
- column
- pie
- scatter
- bubble

That is not obviously a gantt/range-bar timeline system today.

### Recommendation

Treat `gantt-chart` as the one proposal most likely to deserve a real component, but do not build it first.

When built, it should follow the same VB pattern:

- semantic table fallback first
- upgrade to timeline visualization second
- light DOM if possible
- data source from table and/or JSON

That would make it consistent with `data-table` and `chart-wc` rather than introducing a data-only monolith.

## A Better Minimal Plan

Instead of adding all seven components, I would aim for this:

### Phase 1: No new primitives, only compositions and recipes

- `kanban-board` as a documented recipe using `drag-surface`
- `retrospective-board` as a documented recipe using the same structure
- `risk-register` as a `data-table` example/preset
- `decision-matrix` as a `data-table`-based scoring example
- one or two polished demos showing `user-story` inside boards and quadrants

This gives real value with almost no new JS surface area.

### Phase 2: Extract only the repeated orchestration patterns

If the repetition proves real, extract at most:

- a **board** primitive for lane-based movement
- a **matrix** primitive for 2x2 drag-based quadrants

These should stay narrow and light-DOM.

### Phase 3: Add only the truly irreducible specialized component

- `gantt-chart`

That is the only proposed item that currently looks justified as a likely standalone visualization component.

## Concrete Recommendation Per Proposed Item

### `kanban-board`

- Ship as recipe/snippet first
- Use `drag-surface` + semantic sections
- Use `user-story` for rich cards or `<article>` for simple cards
- Do not add a dedicated component yet

### `retrospective-board`

- Same structure as kanban
- Ship as recipe/snippet first
- If later needed, it is just a preset over the same board family

### `decision-matrix`

- Build on `data-table`
- Add scoring docs/snippet logic if needed
- Do not model this as a quadrant primitive

### `swot-analysis`

- Start as semantic 2x2 layout or a very thin quadrant component
- Borrow ideas from `empathy-map` if editable mode matters
- Avoid coupling it to drag unless the use case actually needs drag

### `stakeholder-map`

- Start with quadrant buckets first
- Reuse the drag-based quadrant family if drag is desired
- Do not jump immediately to freeform x/y placement

### `risk-register`

- Build on `data-table`
- Use sort/filter/expand/select immediately
- Treat it as a preset table pattern, not a new interaction primitive

### `gantt-chart`

- Defer until the pack has proven board and table needs
- When built, use table-first progressive enhancement

## Rules To Avoid Bloat

1. Prefer **recipes over components** when the markup is already clear.
2. Prefer **light-DOM orchestration** over Shadow DOM when composing existing child elements.
3. Keep `src`/JSON loading optional; do not make planning surfaces data-only.
4. Reuse `drag-surface` for movement instead of embedding new drag systems.
5. Reuse `data-table` for anything that is fundamentally tabular.
6. Only create a new public primitive after **two real consumers** clearly share the same structure and events.
7. Treat presets and docs examples as first-class product value. Not every good planning pattern needs a tag name.

##  Recommended Path

If the goal is to expand the planning pack efficiently, I would do this:

1. Add polished docs/examples for `kanban-board`, `retrospective-board`, `risk-register`, and `decision-matrix` using current primitives.  Make these stand  alone demos and link from the docs
2. Watch where the markup repeats.
3. If repetition is real, extract two narrow internal/public families:
   - board surface
   - matrix surface
4. Keep `impact-effort` and `story-map` as proof that this compositional architecture works and refactor these if we make new primitives
5. Execute `gantt-chart` likely standalone component

For now let's not add seven full web components let's build the examples and see if we need to add primitives and if it makes sense we package as components.

In short demos via **composition-first, primitive-second, component-last**.
