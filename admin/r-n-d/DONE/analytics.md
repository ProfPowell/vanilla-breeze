# Analytics: Current Status and First-Class Plan

Status date: February 24, 2026

This document consolidates `analytics-users.md` ideas with what Vanilla Breeze actually ships today.

## 1) Current State in the Library

## What already exists

1. Root page context already exists on `<html>`:
- `data-page` (layout/page type hook used by docs/lab layouts)
- `data-theme`, `data-mode`, and `data-fluid` (theme/mode/fluid context)
- optional extension context like `data-motion-reduced`

2. `ping` is already documented as a first-class native attribute:
- `11ty-site/src/pages/docs/attributes/ping.njk`
- docs correctly call out major limitations:
  - Firefox disables `ping` by default (`browser.send_pings=false`)
  - privacy browsers/extensions can block pings
  - payload is fixed (`PING`) so rich data must be in query params

3. The component/runtime layer emits many analytics-ready events already:
- Form/wizard: `vb:submit`, `wizard:stepchange`, `wizard:complete`, `wizard:reset`
- Theme/a11y: `theme-change`, `a11y-themes-change`, `extensions-change`
- UI interaction: `accordion-wc:toggle`, `drop-down:open|close`, `tab-set:change`, `site-search:open|close`
- Data interactions: `data-table:sort|filter|expand|selection|page`
- Navigation helpers: `page-toc:navigate`, `heading-links:navigate`

4. Privacy primitives are already documented:
- `referrerpolicy` guidance exists and is detailed.
- This gives a solid foundation for analytics that does not leak unnecessary URL data.

## What is missing

1. No dedicated analytics runtime in `src/lib` (no unified `track()` or `initAnalytics()` API).
2. No standard event taxonomy across component events.
3. No consent gate or policy layer in runtime.
4. No transport abstraction (`sendBeacon`/`fetch keepalive`/queue fallback).
5. No single analytics document tying context + events + ping + privacy together.

## 2) User-Centered Analytics Principle for VB

If analytics becomes first-class in Vanilla Breeze, it should stay platform-first and user-centered:

1. Measure interactions and outcomes, not identity.
2. Prefer first-party collection endpoints.
3. Keep event payloads minimal and typed.
4. Respect consent, GPC/DNT, and referrer boundaries.
5. Never require third-party SDKs for core functionality.
6. Work progressively: no analytics should block navigation or UI.

## 3) Recommended Architecture (Clean and Composable)

## Layer A: Context model

Build from existing `<html>` dataset and optionally add the manifest pattern from `analytics-users.md`.

Minimal context payload:

```json
{
  "page": "docs",
  "theme": "forest a11y-high-contrast",
  "mode": "dark",
  "fluid": "default"
}
```

Future-ready (optional) additions from `analytics-users.md`:
- `data-page-type`
- `data-task`
- `data-audience`
- `data-topics`
- `data-journey`

## Layer B: Event model

Use existing custom events as source signals, but normalize them into one envelope:

```json
{
  "name": "table.sort",
  "ts": 1739942400000,
  "context": { "...": "..." },
  "props": { "column": 2, "direction": "asc" }
}
```

Starter mapping examples:
- `data-table:sort` -> `table.sort`
- `wizard:stepchange` -> `form.wizard_step_change`
- `vb:submit` -> `form.submit_valid`
- `theme-change` -> `ui.theme_change`
- `heading-links:navigate` -> `docs.anchor_navigate`

## Layer C: Transport model

Two-lane transport keeps things simple:

1. Link click lane (`ping`):
- Great for declarative anchor click tracking.
- Should be treated as best-effort only.

2. JS event lane (`sendBeacon` + `fetch keepalive` fallback):
- Handles component/form/custom events.
- Flush on `visibilitychange`/`pagehide`.

## Layer D: Privacy/consent model

Gate all transmission behind a policy check:

1. Consent state (`granted|denied|pending`) from app policy.
2. Honor `navigator.globalPrivacyControl === true` when present.
3. Honor `navigator.doNotTrack === "1"` policy decision.
4. Drop or hash sensitive fields before transport.
5. Default to first-party endpoint (`/api/analytics/events`).

## 4) How `ping` Should Fit (Important)

`ping` should be used as one channel, not the analytics foundation.

Best use:
1. Outbound link click attribution.
2. CTA click counting where exact payload is small.
3. JS-independent measurement for simple links.

Do not depend on `ping` for:
1. Critical conversion metrics that require full coverage.
2. Rich event payloads.
3. Button/programmatic navigation analytics.

Recommended pattern:
1. Add `ping` to key anchors for transparent, declarative tracking.
2. Also instrument click events in JS for fallback and richer metadata.
3. Deduplicate server-side (link id + timestamp window + session key).

## 5) Minimal VB API to Add (Incremental)

Proposed light API surface:

```js
import { Analytics } from './lib/analytics.js';

Analytics.init({
  endpoint: '/api/analytics/events',
  consent: () => window.appConsent?.analytics === true,
  context: () => ({ page: document.documentElement.dataset.page || 'unknown' }),
  sampleRate: 1
});

Analytics.track('docs.anchor_navigate', { id: 'api-reference' });
```

Suggested internals:

1. `src/lib/analytics.js`
- `init()`, `track()`, `flush()`, `setConsent()`

2. `src/utils/analytics-init.js`
- auto-wires listeners for existing VB custom events

3. Optional attribute hooks
- `data-analytics-id`
- `data-analytics-event`
- `data-analytics-ignore`

This keeps components decoupled from vendor SDK logic.

## 6) Phased Roadmap

## Phase 1 (small, low risk)

1. Publish this analytics contract in docs.
2. Add minimal analytics runtime with pluggable transport.
3. Wire high-value existing events (`vb:submit`, wizard, data-table, theme-change).
4. Add root context extraction utility from `<html>` dataset.

## Phase 2 (production hardening)

1. Add consent policy hooks and GPC/DNT support.
2. Add queueing + beacon fallback behavior.
3. Add dedupe strategy for combined `ping` + JS click tracking.
4. Provide first-party endpoint example in docs (similar to service-facade pattern).

## Phase 3 (ecosystem integration)

1. Add adapters for common analytics backends (PostHog, Plausible, custom endpoint) without hard dependency.
2. Add optional Web Vitals/performance event bridge.
3. Add documented schema versioning and migration policy.

## 7) Recommendation

Vanilla Breeze is already close to analytics-ready because it has:
- strong page-level context on `<html>`
- many meaningful semantic custom events
- a platform-native `ping` story with documented tradeoffs

The highest-value next step is a tiny first-party analytics core that normalizes existing events, enforces privacy policy, and treats `ping` as supplemental transport rather than primary truth.

## 8) Key Files Referenced

- `r-n-d/analytics-users.md`
- `11ty-site/src/pages/docs/attributes/ping.njk`
- `11ty-site/src/pages/docs/attributes/referrerpolicy.njk`
- `11ty-site/src/_includes/layouts/base.njk`
- `11ty-site/src/_includes/partials/head.njk`
- `src/main.js`
- `src/main-core.js`
- `src/main-autoload.js`
- `src/lib/wizard.js`
- `src/lib/form-validation.js`
- `src/lib/theme-manager.js`
- `src/web-components/data-table/logic.js`
