# Charts in Vanilla Breeze: Current Status and Platform-First Roadmap

This consolidates:
- `charts-experiment.md`
- `chart-status-feb1.md`
- Current VB implementation in `src/charts/*` and `src/lib/charts.js`
- Relevant patterns from `~/src/svc` and `~/src/svc-wc`

Status date: February 24, 2026

## 1) What Vanilla Breeze already has

### Chart rendering model

1. VB has a real charts add-on, not just concept notes.
2. It is CSS-first and table-based (`.vb-chart` + `data-type`).
3. Core idea is progressive enhancement: semantic table first, visual chart second.

### Implemented chart CSS modules

1. `src/charts/tokens.css`
2. `src/charts/base.css`
3. `src/charts/bar.css`
4. `src/charts/column.css`
5. `src/charts/line.css`
6. `src/charts/area.css`
7. `src/charts/pie.css`
8. `src/charts/legend.css`
9. `src/charts/tooltip.css`
10. `src/charts-standalone.css` entry point

### Implemented chart types

1. Bar (`--value`)
2. Column (`--value`)
3. Line (`--start` + `--end`, clip-path)
4. Area (`--start` + `--end`, clip-path)
5. Pie and donut (`conic-gradient`, optional `data-donut`, optional `data-half`)

### Implemented modifiers and helpers

1. Modifiers: `data-tooltip`, `data-labels`, `data-grid`, `data-gap`, `data-size`, `data-axes`, `data-stacked`, `data-grouped`
2. Legend component: `.vb-chart-legend`, `.vb-chart-legend-item`
3. JS helper exists in `src/lib/charts.js` with:
- `create`
- `createPie`
- `generateLegend`
- `enableTooltips`
- `update`
- `animate`
- `animateOnScroll`

### Packaging state

1. Charts ship as CSS add-on: `dist/cdn/vanilla-breeze-charts.css`
2. Package export exists: `./charts-css`
3. Current built size is lightweight: about 3.3 KB gzip (`budget-report.json`)

## 2) What from old notes is now done vs still missing

### Done from experiment/status docs

1. CSS module structure was created as planned.
2. Token mapping to VB variables exists (`--chart-series-*`, axis/label/grid tokens).
3. Line and area were upgraded to clip-path segment pattern (`--start`/`--end`).
4. Pie/donut and legend/tooltip styles exist.

### Not done or partially done

1. `charts.js` is still `--value`-centric for most logic.
2. `charts.create()` does not model line/area segment generation from raw arrays.
3. `charts.update()` updates `--value` for non-pie charts; it does not recompute line/area `--start`/`--end`.
4. `charts.animate()` animates `--value`, so line/area behavior is incomplete.
5. Grouped/stacked support in JS API is not a true multi-cell-per-row data model yet.
6. No automated chart test coverage found.

## 3) Current drift/gaps in docs and integration

1. Lab chart page exists (`11ty-site/src/pages/lab/experiments/charts.njk`), but no `includeCharts` toggle is set there.
2. The same page shows interactive JS sections, but no page script currently wires those controls/containers.
3. `src/lib/charts.js` exists in repo source, but there is no dedicated distributed charts JS bundle/export path (only charts CSS is exported).

## 4) What `svc` and `svc-wc` add that VB does not

### SVC strengths relevant to VB

1. SVG chart engine with richer scale/axis/legend/tooltip behavior.
2. Additional chart types: scatter and bubble.
3. Multi-series cartesian handling is mature.
4. SSR + hydration flow is already implemented.
5. Uses token-friendly palette hooks (already demonstrates `--chart-series-*` in examples).

### `svc-wc` / WC wrapper direction

1. Web component wrapper pattern is viable for opt-in client-side rendering.
2. Current wrapper code under `svc-wc/src` is functional but dated.
3. The newer wrapper style in `svc/examples/web-components/svc-elements.js` is a better baseline for future wrapper work.

## 5) Recommended platform-first direction for Vanilla Breeze

Use a tiered model so VB stays lightweight by default.

### Tier A: Native-first and zero-JS (default path)

1. Keep semantic table as canonical data source.
2. Keep CSS-only charts for simple/common cases (bar, column, line, area, pie).
3. Ensure print and no-CSS/table fallback remains first-class.

### Tier B: Tiny progressive enhancement JS (optional, still light)

1. Evolve `charts.js` into a small data-to-markup transformer.
2. Add built-in line/area segment generation from plain arrays.
3. Add reliable update/animate behavior for line/area and grouped/stacked variants.
4. Ship a dedicated optional bundle/export (`vanilla-breeze-charts.js` or similar), separate from core.

### Tier C: Optional SVG path for advanced use cases

1. Do not move SVC into VB core.
2. Provide an adapter pattern for teams needing scatter/bubble/advanced scales.
3. Recommend SSR+hydrate when advanced interactivity is needed without heavy client runtime.

## 6) Concrete "should do" plan (priority order)

### P0 (do now)

1. Fix docs/runtime drift:
- Ensure chart demo pages actually include charts CSS add-on.
- Either wire interactive JS demo sections or remove non-functional controls.
2. Align helper API with implemented CSS contract:
- Add line/area `--start`/`--end` generation to `charts.create()`.
- Update `charts.update()` and `charts.animate()` for line/area semantics.
3. Add minimum chart tests:
- Render smoke tests for each type.
- Line/area segment continuity tests.
- Helper update/animate behavior tests.

### P1 (next)

1. Publish optional charts JS artifact/export path.
2. Add clearer data model docs for:
- simple series
- multi-series
- grouped/stacked
- pie segmentation
3. Tighten accessibility guidance:
- required caption/headers patterns
- optional textual summary patterns for dashboards

### P2 (future)

1. Add lightweight micro-chart primitives:
- sparkline pattern
- `meter`/`progress`-backed KPI visuals
2. Add optional SVC bridge package/docs for advanced charts.
3. Evaluate adding scatter/bubble only through optional SVG path, not core CSS add-on.

## 7) Recommendation summary

Vanilla Breeze already has a strong lightweight chart base. The right next move is not a new chart engine in core. The right move is to polish the existing CSS-first/table-first model, ship a small optional JS helper that matches it, and keep advanced SVG charts as an opt-in integration lane.
