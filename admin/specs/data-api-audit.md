# Data API Audit — VB component classification

Captures the JS-first / HTML-first dual-mode contract status for every
component in `src/web-components/` as of Phase 6 completion. Source of
truth: `/docs/concepts/data-api/`.

## Legend

- **Done** — exposes a property API (`.data` / `.items` / `.rows` /
  `.value` / etc.) with idempotent setter and source-tagged change
  event. Reactive frameworks can drive it.
- **Confirmed Skip** — display-only, effect, or composition primitive
  with no JS data surface to expose. Audited and confirmed.
- **No data API** — stateless action button or composition wrapper;
  data lives elsewhere (in a sibling controller, parent component, or
  page state). Documented here so we don't re-audit.

## Status by component

### Done — record / collection / form-control / atomic (50 components)

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
| `<command-palette>` | collection | `.commands` | 5a |
| `<selection-menu>` | collection | `.actions` | 5a |
| `<context-menu>` | collection | `.items` | 5a |
| `<drop-down>` | collection | `.items` | 5a |
| `<chat-window>` | collection | `.messages` (keyed diff) | 5b |
| `<chat-input>` | form | `.value` | 5b |
| `<review-surface>` | collection | `.pins` | 5b |
| `<empathy-map>` | record | `.data` | 5c |
| `<impact-effort>` | collection | `.items` (keyed diff, quadrant routing) | 5c |
| `<story-map>` | tree | `.activities` | 5c |
| `<user-journey>` | record | `.data` / `.phases` | 5c |
| `<glossary-wc>` | collection | `.terms` | 5c |
| `<change-set>` | atomic | `.view` (form-style audit) | 5c |
| `<topic-map>` | atomic | `.data` (`{ pages, vocabulary }`) | 5c |
| `<day-view>` | atomic | `.events` | 6a |
| `<week-view>` | atomic | `.events` | 6a |
| `<short-cuts>` | record | `.shortcuts` | 6b |
| `<toast-msg>` | imperative + observer | `.show()` / `.queue` getter / `:enqueued` event | 6b |
| `<notification-wc>` | collection | `.notifications` | 6b |
| `<geo-map>` | atomic | `.data` (`{ lat, lng, zoom, marker, markerColor }`) + `.markers` getter | 6c |
| `<image-map>` | collection | `.regions` | 6c |
| `<site-search>` | form + collection | `.value` + `.results` getter | 6d |
| `<settings-panel>` | record | `.data` (VBStore-backed nested values) | 6d |
| `<include-file>` | atomic | `.src` | 6d |
| `<recently-visited>` | read-only | `.entries` getter | 6e |
| `<page-toc>` | read-only | `.entries` getter | 6e |
| `<audio-player>` | atomic | `.src` + `.currentTime` | 6f |
| `<video-player>` | atomic | `.src` + `.currentTime` | 6f |
| `<content-swap>` | atomic | `.swapped` (existed); `:swap` event now source-tagged | 6f |

### Auto-derived getter recommended (open as filed)

These components derive their content from other page state (headings,
posts, glossary entries, etc.). Adding a `.entries` getter for
read-only access would help reactive consumers observe the derived
list without re-implementing the derivation. Not blocking — file a
ticket if a consumer needs one.

| Component | Suggested getter |
|---|---|
| `<foot-notes>` | `.notes` from inline `<foot-note>` refs |
| `<heading-links>` | `.headings` from page heading scan |
| `<author-index>` | `.authors` from harvested author groups |
| `<glossary-index>` | `.terms` from glossary section scan |
| `<time-index>` | `.entries` from version sections |
| `<popularity-index>` | `.entries` from rank order |
| `<site-index>` | `.sections` from nav scan |

### No data API — stateless action / composition (4 components)

These have no JS data state to expose. Their behavior either delegates
to a sibling/parent (action buttons) or wraps another control.

| Component | Why |
|---|---|
| `<note-wc>` | Stateless action button; notes live in highlights controller |
| `<comment-wc>` | Stateless action button; pins live on `<review-surface>` |
| `<slide-accept>` | One-shot accept gesture; `:accept` event is the surface |
| `<form-field>` | Wraps a native input — input has `.value` already |

### Confirmed Skip — display / effect / composition / theme (40 components)

No data API needed. These render presentational content, are theme
tools, are layout primitives, or are interaction-only chrome. Audited
and confirmed; data lives in author markup or external state.

`<analytics-panel>`, `<audio-visualizer>`, `<brand-mark>`,
`<color-palette>`, `<compare-surface>`, `<component-sampler>`,
`<consent-banner>`, `<content-lens>`, `<drag-surface>`,
`<emoji-picker>`, `<font-pairer>`, `<gradient-builder>`,
`<highlight-wc>`, `<icon-wc>`, `<motion-specimen>`, `<page-info>`,
`<page-stats>`, `<page-tools>`, `<page-tour>`, `<palette-generator>`,
`<print-page>`, `<qr-code>`, `<reader-view>`, `<semantic-palette>`,
`<share-wc>`, `<social-embed>`, `<spacing-specimen>`,
`<split-surface>`, `<text-reader>`, `<theme-export>`,
`<theme-picker>`, `<token-specimen>`, `<tool-tip>`,
`<trust-filter>`, `<type-specimen>`, `<watch-wc>`,
`<youtube-player>`.

### Open from Phase 6f (deferred)

The following had quick state surfaces noted in the re-audit but were
not retrofitted because the contract sits on top of native browser
state that frameworks can already access directly. File a ticket if
a consumer wants explicit exposure:

- `<consent-banner>` — `.accepted` read state (lives in VBStore)
- `<reader-view>` — `.active` mode toggle (lives in attribute)
- `<theme-picker>` — already has theme attribute; `.value` would alias
- `<watch-wc>` — `.url` / `.interval` for poll-driven URL watchers
- `<youtube-player>` — `.videoId` for embed URL changes

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

The audit is complete. Future per-component work happens when:

- A consumer (Montane, downstream framework integration) reports a
  specific gap.
- A bug filed against a component reveals a missing setter that would
  have made the workaround unnecessary.
- The "Auto-derived getter" or "Open from Phase 6f" tables get a
  filed ticket.

Per-component PRs land independently — the mixins, concepts guide, and
this audit are stable; new retrofits don't require any framework-level
changes.
