---
title: Vanilla Breeze Analytics - Master Implementation Brief
description: Pragmatic synthesis of the analytics R&D docs into an implementation-oriented plan.
date: 2026-03-23
status: synthesis
version: 0.1.0
sources:
  - analytics.md
  - analytics-spec.md
  - analytics-backend-spec.md
  - analytics-part2.md
  - analytics-part3.md
---

# Vanilla Breeze Analytics - Master Implementation Brief

This document synthesizes the analytics R&D docs into a single recommendation for what Vanilla Breeze should actually build. It favors the parts that are aligned, incremental, privacy-safe, and compatible with the current codebase. It explicitly de-prioritizes ideas that are better treated as optional modules, site-specific infrastructure, or later-phase experiments.

## Source priority

1. `analytics-spec.md` is the best client-side baseline and supersedes `analytics.md` and `analytics-part2.md`.
2. `analytics-backend-spec.md` is the canonical reference for a VB-owned backend, but it should be treated as optional reference infrastructure rather than a prerequisite for the client API.
3. `analytics.md` remains the clearest short statement of strategy: normalize existing semantic events, use `ping` as a supplement, and keep the core small.
4. `analytics-part2.md` is useful for rationale and examples, but where it differs from v0.3, the newer spec wins.
5. `analytics-part3.md` is research input, not implementation scope.

## What makes sense to implement

### 1. A small analytics core in the library

Ship a first-party, vendor-neutral runtime with:

- `Analytics.init(config)`
- `Analytics.track(name, props)`
- `Analytics.flush()`
- optional `Analytics.setConsent(value)` if it simplifies app integration

Core responsibilities:

- build context from `document.documentElement.dataset`
- optionally merge page taxonomy from `<meta name="vb:*">`
- enforce consent and privacy gating
- send events via `sendBeacon`, then `fetch(..., { keepalive: true })` fallback
- expose a stable event envelope and schema version
- never block navigation or UI

This is the highest-value common denominator across all documents.

### 2. Declarative instrumentation

Ship support for:

- `data-vb-event`
- `data-vb-event-*`
- `data-vb-no-track`

This fits Vanilla Breeze's declarative style and removes the need for per-page analytics glue code. It is one of the strongest ideas in the larger spec and is cheap to support.

### 3. Auto-wire existing high-value VB events

Add a small `analytics-init` module that listens for the events VB already emits and forwards a normalized subset into `Analytics.track()`.

Ship first:

| Current source event | Normalized analytics event | Implementation note |
|---|---|---|
| `vb:submit` | `form.submit_valid` | Send a form identifier only, never `FormData` contents |
| `wizard:step-change` | `form.wizard_step` | Use `{ from, to }` from the current implementation |
| `wizard:complete` | `form.wizard_complete` | |
| `wizard:reset` | `form.wizard_reset` | |
| `data-table:sort` | `table.sort` | Prefer `{ column, direction, columnName }` |
| `data-table:filter` | `table.filter` | Do not send raw filter text; send count, length, or a boolean instead |
| `data-table:page` | `table.paginate` | |
| `vb:theme-change` | `ui.theme_change` | Current runtime event name uses the `vb:` prefix |
| `vb:a11y-themes-change` | `ui.a11y_themes_change` | Current runtime event name uses the `vb:` prefix |
| `vb:extensions-change` | `ui.extensions_change` | Current runtime event name uses the `vb:` prefix |
| `heading-links:navigate` | `docs.anchor_navigate` | |
| `page-toc:navigate` | `docs.toc_navigate` | |
| `site-search:open` | `search.open` | |
| `site-search:close` | `search.close` | |

Defer the noisier UI events until there is a real reporting need.

### 4. Use `ping` only for outbound links

The docs are consistent on this point and it is the right call:

- use `ping` for outbound anchors and simple CTA links
- treat it as best-effort only
- back it with JS tracking if richer data or browser coverage is needed
- dedupe server-side if both channels are enabled

`ping` should not be the primary analytics system.

### 5. Privacy and safety rules in the core

These should be baseline behavior, not later polish:

- no cookies
- no persistent identifiers
- respect explicit opt-out, GPC, and DNT
- no raw text capture from searches, form fields, or filters
- allow URL masking before transport
- keep payloads typed and minimal

### 6. Make page taxonomy optional, not mandatory

The taxonomy model in `analytics-spec.md` is good, but it is site-content metadata, not universal library state.

Recommended split:

- always collect runtime context from `<html>` dataset
- optionally collect content taxonomy from `<meta name="vb:*">`
- keep taxonomy vocabulary documented, but do not make it required for core analytics

That keeps the library generic while still supporting the richer docs-site reporting model.

## What should be optional or later

### Buffered engagement metrics

Keep scroll depth, attention time, and event queueing in a separate opt-in module. They are useful, but they are not required to prove the core design.

### Web Vitals and JS error tracking

These fit well as optional observability modules. They should not be bundled into the first shipping slice.

### Reference backend

The backend spec is coherent as a reference architecture, but it is too large to be the definition of "VB analytics" on day one. Treat it as:

- a reference same-origin backend
- a docs example
- a separate phase after the client contract is stable

### Bot intelligence, log processing, honeypots, and Layer 0 header counting

These are interesting and potentially valuable for a VB-operated site, but they are not library-core concerns. They belong in the reference backend track, not the client/runtime track.

### Analytics UI inside settings

The transparency goal is strong, but the implementation should wait. The current `settings-panel` component does not expose the slot-based integration assumed by the design docs, and the current "clear my data" story is only meaningful for local session storage.

## What does not make sense to implement as written

### 1. Stale event names need correction before implementation

The docs do not fully match the live codebase. Current code uses:

- `wizard:step-change`, not `wizard:stepchange`
- `vb:theme-change`, not `theme-change`
- `vb:a11y-themes-change`, not `a11y-themes-change`
- `vb:extensions-change`, not `extensions-change`

The master event map should use the real emitted names.

### 2. The settings integration story is incomplete

The design docs assume a slot-based analytics panel inside settings. The current component in `src/web-components/settings-panel/logic.js` renders its own internal markup and does not expose named slots. If an analytics UI is added later, it should either:

- extend `settings-panel` directly with a new section
- or first add a formal extension or slot API to `settings-panel`

### 3. `/analytics/forget` is not meaningful without a deletable identifier

The docs correctly note that there may be nothing to delete on the server in an aggregate-only system. That means the endpoint should remain optional until the backend actually stores session-addressable data.

### 4. The backend storage story needs one explicit decision

The documents say "store counts, not records," but the backend schema stores per-hit and per-event rows. That is not necessarily wrong, but it is a different implementation choice.

Recommended decision:

- store row-level, low-detail, aggregate-oriented records with strict field minimization
- add rollups and retention later if needed

That is much simpler than trying to build a pure counter-only system from the start.

## Recommended phased implementation

### Phase 1: client foundation

1. Create `src/lib/analytics.js`.
2. Define the event envelope, context extraction, consent checks, and transport.
3. Add URL masking.
4. Add declarative `data-vb-event` and `data-vb-no-track`.
5. Document outbound-link `ping` usage as supplemental.

### Phase 2: VB event integration

1. Create `src/utils/analytics-init.js`.
2. Wire the high-value current events listed above.
3. Keep payloads minimal and avoid raw user-entered text.
4. Publish the normalized event catalog in docs.

### Phase 3: optional client modules

1. Add buffered scroll and attention tracking as an opt-in module.
2. Add optional Web Vitals.
3. Add optional JS error tracking.
4. Add sample-rate support if needed.

### Phase 4: reference backend

1. Add same-origin ingest endpoints.
2. Support simple page hits, events, and outbound clicks first.
3. Add dedupe for `ping` plus JS click tracking.
4. Add log processing and bot intelligence only after the basic ingest and query path works.

## Minimal canonical architecture

If Vanilla Breeze ships analytics, the default shape should be:

```text
VB components/events
  -> Analytics.track()
  -> transport abstraction
  -> same-origin endpoint or user-provided adapter
```

Supporting layers:

- runtime context from `<html>` dataset
- optional page taxonomy from `<meta name="vb:*">`
- optional declarative events from `data-vb-event`
- optional `ping` for outbound links
- optional engagement, vitals, and error modules

## Recommended non-goals

Do not make these part of the first implementation:

- third-party SDK dependencies
- cookies or persistent user identifiers
- cross-site tracking
- session replay, heatmaps, or fingerprinting
- mandatory backend infrastructure
- a promise of legal or compliance exemption without formal review

## Deliverables to create or update first

- `src/lib/analytics.js`
- `src/utils/analytics-init.js`
- docs for event naming, payload rules, and privacy constraints
- a corrected event catalog that matches the live codebase
- a short reference doc for optional `<meta name="vb:*">` taxonomy
- later: reference backend docs and examples, not core runtime coupling

## Final recommendation

The right implementation is not the entire system described across all documents. The right implementation is a small, privacy-first analytics core plus a thin event-normalization layer for the semantic events Vanilla Breeze already emits.

Everything else, especially backend analytics infrastructure, bot intelligence, and settings-panel UI, should be treated as optional follow-on work once the client contract is real and useful.
