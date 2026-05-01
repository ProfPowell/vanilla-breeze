# Data API Audit — VB component classification

Captures the JS-first / HTML-first dual-mode contract status for every
component in `src/web-components/` as of Phase 4 completion. Source of
truth: `/docs/concepts/data-api/`.

## Legend

- **Done** — exposes a property API (`.data` / `.items` / `.rows` /
  `.value` / etc.) with idempotent setter and source-tagged change
  event. Reactive frameworks can drive it.
- **Skip** — display-only, effect, or composition primitive with no
  data surface. No reactive use case to serve.
- **Soon** — collection or record shape that would benefit but isn't
  yet retrofitted; covered by future Phase 5+ work or one-off PRs.
- **Form-control** — exposes `.value` already; covered by Phase 3e
  audit (idempotent + source tag).

## Status by component

### Done — record / collection / form-control (23 components)

| Component | Shape | Property | Phase |
|---|---|---|---|
| `<work-item>` | record | `.data` | 2 |
| `<user-story>` | record | `.data` | 2 |
| `<kanban-board>` | collection | `.items` (keyed diff) | 2 |
| `<chart-wc>` | atomic | `.data` / `.config` | 3a |
| `<data-table>` | collection | `.rows` (keyed diff) | 3b |
| `<calendar-wc>` | atomic | `.events` | 3c |
| `<gantt-chart>` | atomic | `.tasks` | 3d |
| `<color-picker>` | form | `.value` | 3e |
| `<date-picker>` | form | `.value` | 3e |
| `<time-picker>` | form | `.value` | 3e |
| `<combo-box>` | form | `.value` | 3e |
| `<star-rating>` | form | `.value` | 3e |
| `<card-list>` | collection | `.items` (keyed diff) | 4a |
| `<image-gallery>` | collection | `.images` | 4a |
| `<flow-diagram>` | atomic | `.steps` | 4a |
| `<adr-wc>` | record | `.data` | 4b |
| `<user-persona>` | record | `.data` | 4b |
| `<markdown-viewer>` | atomic | `.markdown` | 4b |
| `<site-map-wc>` | tree | `.pages` | 4c |
| `<markdown-editor>` | form | `.value` | 4d |
| `<accordion-wc>` | collection | `.panels` | 4e |
| `<tab-set>` | collection | `.tabs` | 4e |
| `<carousel-wc>` | collection | `.slides` | 4e |

### Soon — collection-shaped, candidate for Phase 5

These exist today as collections of children (commands, items, options,
messages, etc.) but currently expect HTML markup or imperative
`show()` / `add()` calls. Adding `.items` / `.commands` / similar would
match the rest of the library.

| Component | Shape | Suggested property | Priority |
|---|---|---|---|
| `<command-palette>` | collection of commands | `.commands` | high — common app feature |
| `<selection-menu>` | collection of action buttons | `.actions` | medium |
| `<context-menu>` | collection of menu items | `.items` | medium |
| `<drop-down>` | collection of menu items | `.items` | medium |
| `<short-cuts>` | keyboard shortcut list | `.shortcuts` | low — usually static |
| `<recently-visited>` | history items | `.entries` | medium — reads from localStorage; read-only `.entries` getter ok |
| `<toast-msg>` | toast queue | already has `show()` API; alias as `.notify(...)` or expose `.queue` getter | low — imperative is the right shape |
| `<notification-wc>` | banner + panel | `.notifications` array with read state | medium |
| `<chat-window>` | message list | `.messages` collection | medium |
| `<chat-input>` | form input | `.value` audit (form-control style) | low |
| `<page-toc>` | TOC items | usually auto-derived from headings; `.entries` getter only | low |
| `<foot-notes>` | footnote list | usually auto-derived; `.notes` getter only | low |
| `<heading-links>` | link list | auto-derived; no setter needed | skip |
| `<author-index>` | author list | auto-derived from posts; no setter needed | skip |
| `<glossary-index>` | glossary entries | auto-derived; no setter needed | skip |
| `<glossary-wc>` | term + definition | record (`.data`) | low |
| `<time-index>` | date-grouped items | auto-derived; getter only | skip |
| `<popularity-index>` | ranked posts | auto-derived; getter only | skip |
| `<site-index>` | flat page list | could overlap with `<site-map-wc>` | skip |
| `<site-search>` | search results | record (`.results`) + form `.value` | medium |
| `<topic-map>` | topic graph | collection (`.topics`) | low |
| `<note-wc>` | annotation note | record (`.data`) | low |
| `<comment-wc>` | comment thread item | record (`.data`) | low |
| `<change-set>` | diff entries | collection (`.changes`) | low |
| `<review-surface>` | review thread | shadow-DOM heavy; record (`.data`) | low |
| `<empathy-map>` | persona quadrants | record (`.data`) | low |
| `<impact-effort>` | matrix items | collection (`.items`) | low |
| `<story-map>` | activities + tasks tree | tree (`.activities`) | low |
| `<user-journey>` | journey steps | collection (`.steps`) | low |
| `<day-view>` | calendar day view | atomic (`.events`) | medium — borrow from calendar-wc |
| `<week-view>` | calendar week view | atomic (`.events`) | medium |
| `<image-map>` | clickable regions | collection (`.regions`) | low |
| `<geo-map>` | map markers | collection (`.markers`) + record `.center` / `.zoom` | medium |
| `<settings-panel>` | grouped form fields | record (`.data`) wrapping nested values | low — already framework-friendly via slots |

### Soon — form-control audit (5 components)

These should get the same treatment as Phase 3e: idempotent `.value`
setter and source-tagged change event.

| Component | Why | Priority |
|---|---|---|
| `<chat-input>` | text input with command parsing | low |
| `<emoji-picker>` | inserts into target — has `:select` event but no `.value` | review whether `.value` even applies |
| `<slide-accept>` | one-shot accept button | already correct shape; no `.value` needed |
| `<form-field>` | wraps a native input | the wrapped input already has `.value`; no surface to audit |
| `<include-file>` | file embed | `.src` setter; record-shaped |

### Skip — display / effect / composition (49 components)

No data API needed. These render presentational content, layout
primitives, themes, or are interaction-only chrome. Included here so
the audit is complete and we don't revisit them.

`<accordion-wc>` (already done above), `<analytics-panel>`,
`<audio-player>`, `<audio-visualizer>`, `<brand-mark>`,
`<color-palette>`, `<compare-surface>`, `<component-sampler>`,
`<consent-banner>`, `<content-lens>`, `<content-swap>`,
`<drag-surface>`, `<font-pairer>`, `<gradient-builder>`,
`<heading-links>`, `<highlight-wc>`, `<icon-wc>`, `<image-map>`,
`<motion-specimen>`, `<page-info>`, `<page-stats>`, `<page-tools>`,
`<page-tour>`, `<palette-generator>`, `<print-page>`, `<qr-code>`,
`<reader-view>`, `<semantic-palette>`, `<settings-panel>`,
`<share-wc>`, `<social-embed>`, `<spacing-specimen>`,
`<split-surface>`, `<text-reader>`, `<theme-export>`,
`<theme-picker>`, `<token-specimen>`, `<tool-tip>`,
`<trust-filter>`, `<type-specimen>`, `<video-player>`, `<watch-wc>`,
`<youtube-player>`.

## Process for adding new dual-mode components

1. Pick the shape from the four canonical patterns documented in
   `/docs/concepts/data-api/`:
   - **Record** — one logical thing, `.data` setter via `VBRecord` mixin.
   - **Collection** — keyed list, `.items` setter via `VBCollection` mixin
     (or `diffByKey` directly for components that don't fit the mixin shape).
   - **Atomic** — owns the entire render, `.data` setter rebuilds wholesale.
   - **Form-control** — `.value` setter, idempotent + source-tagged event.
2. Always inherit `:upgraded` from `VBElement` (free).
3. Always emit a tagged change event with `source: 'api' | 'pointer' |
   'keyboard' | 'internal' | 'drag' | ...` so reactive consumers can
   filter loops.
4. Document the new property API in the component's doc page under a
   "Property API (JS-first)" section, linking to the concepts guide.
5. Add a Playwright spec covering: HTML-first parse, .property setter
   re-renders, source-tagged event fires.

## Roadmap signals

We will revisit "Soon" components when:

- A consumer (Montane, downstream framework integration) reports a
  specific gap.
- A bug filed against a component reveals a missing setter that would
  have made the workaround unnecessary.
- Aggregate signal: 3+ consumers want the same shape.

Per-component PRs from the "Soon" table can land independently — the
mixins and concepts guide are stable; new retrofits don't require any
framework-level changes.
