# Vanilla Breeze Analytics Research

The vanilla breeze analytics approach is meant to be self-hosted, platform focused, simple and hopefully useful for people to avoid SaaS services.  Many vendors are currently pushing new analytic systems given the need to potentially move away from Google Analytics.  These are some that can be researched to help shape our approach.  Many are open source so their code can be consulted.



[Rybbit - Privacy-First Web Analytics Platform](https://rybbit.com/)

[Cabin | Privacy-first, Google Analytics alternative](https://withcabin.com/)

[Plausible Analytics](https://plausible.io/)

[Umami](https://umami.is/)

[Fathom Analytics: A Better Google Analytics Alternative](https://usefathom.com/)

[The privacy-first Google Analytics alternative - Simple Analytics](https://www.simpleanalytics.com/)

[OpenPanel Analytics | An open-source alternative to Mixpanel](https://openpanel.dev/)

[Swetrix - Cookieless Google Analytics Alternative](https://swetrix.com/)

![CleanShot 2026-02-27 at 11.27.57@2x.png](https://resv2.craft.do/user/full/24fcac64-b755-f60f-a383-2d4c1d2468c4/doc/094405FB-0C97-4ACB-B1CC-5661E63AA59F/77E59227-3D53-4582-9C4C-7135ECF4B60A_2/UBd0m9DXtGQLbruhugnIQxm1GDRzUmkPZVEpmOjhkKgz/CleanShot%202026-02-27%20at%2011.27.572x.png)



[Pirsch – The Best, Privacy-Friendly Google Analytics Alternative](https://pirsch.io/)

[Self-hosted website analytics | Ackee](https://ackee.electerious.com/)



[PostHog – We make dev tools for product engineers](https://posthog.com/)

---

## Research Summary

Patterns studied across 13 platforms, organized by category. Cross-references point to the [client spec](analytics-spec.md) and [backend spec](analytics-backend-spec.md) where each pattern was adopted.

### Visitor Identification

- **Cabin** — Zero-JS visit counting via HTTP `Last-Modified` / `If-Modified-Since` headers. The server sets `Last-Modified` to midnight; browsers that return with `If-Modified-Since` are "returning" visitors. No client code needed. → Adopted as **Layer 0** ([client spec](analytics-spec.md#layer-0--http-header-counting), [backend spec](analytics-backend-spec.md#layer-0--http-header-counting)).

- **Simple Analytics** — Referrer-based unique detection. If `document.referrer` is external (or empty), the visitor is likely unique. Lightweight heuristic, no hashing needed. → Adopted as **Approach 2** in [Visitor Identification](analytics-spec.md#visitor-identification) and in the [backend log processor](analytics-backend-spec.md#referrer-based-unique-detection-in-logs).

- **Fathom** — Two-level daily hash with salt rotation. `SHA-256(ip + ua + siteId + dailySalt)` produces a daily-scoped visitor identifier that expires at midnight. Salt is per-site to prevent cross-site correlation. → Adopted as **Approach 3** in [Visitor Identification](analytics-spec.md#visitor-identification) and [backend daily-hash module](analytics-backend-spec.md#approach-3--two-level-daily-hash-primary).

- **OpenPanel** — Includes `screen.width` as an additional hash input. Adds ~4 bits of entropy without creating a fingerprint (only ~20 common screen widths exist). → Integrated into the two-level hash as **Level 2** entropy input.

### Script Architecture

- **Plausible** — 938-byte core script. Proves that page view tracking, SPA support, and opt-out can fit in under 1 KB gzipped. → Inspired the **<1.5 KB size budget** for `vb-analytics.js` ([Script Architecture](analytics-spec.md#script-architecture)).

- **PostHog** — Modular script loading. Core is separate from feature flags, session recording, and surveys. Each module is independently loadable. → Inspired the **modular architecture**: core + opt-in events, vitals, and errors modules.

- **Rybbit** — SPA navigation debounce (100ms default). Prevents duplicate page view beacons when `history.pushState` fires multiple times in quick succession. → Adopted in **Layer 3** `watchNavigation()` with `SPA_DEBOUNCE_MS = 100` ([client spec](analytics-spec.md#layer-3--javascript-beacon-module)).

### Declarative Patterns

- **Umami** — `data-umami-event="signup"` attribute on any element. Click events are tracked via delegation without writing JavaScript. Additional properties via `data-umami-event-*` attributes. → Adopted as **`data-vb-event`** with the same property pattern (`data-vb-event-plan="pro"`) ([Declarative Event Attributes](analytics-spec.md#declarative-event-attributes)).

- **PostHog** — `ph-no-capture` class on elements to suppress tracking. Any element (and its descendants) with this class is invisible to analytics. → Adopted as **`data-vb-no-track`** attribute (data attribute preferred over class for VB consistency).

### Extended Metrics

- **Swetrix** — Treats JavaScript runtime errors and unhandled promise rejections as analytics events. Error data flows through the same pipeline as click and page view events. → Adopted as `error.js_runtime` and `error.unhandled_promise` events in `vb-analytics-errors.js` ([Event Catalog](analytics-spec.md#tier-3--error-and-performance-events-phase-3)).

- **Plausible / OpenPanel** — Built-in Web Vitals reporting (LCP, CLS, INP). Performance data is collected alongside page views and displayed in the same dashboard. → Adopted as `perf.lcp`, `perf.cls`, `perf.inp`, `perf.ttfb` events in `vb-analytics-vitals.js` ([Event Catalog](analytics-spec.md#tier-3--error-and-performance-events-phase-3)).

### Privacy Techniques

- **Rybbit** — URL path masking. Configurable patterns replace sensitive route segments (`/users/john` → `/users/*`) before the beacon is sent. Prevents PII from reaching the server. → Adopted as **URL Masking** with regex-based configuration ([URL Masking](analytics-spec.md#url-masking)).

- **Fathom** — Daily salt rotation. The visitor hash salt changes at midnight UTC, so yesterday's hashes cannot be recomputed. Combined with per-site salting, this prevents any form of cross-session or cross-site tracking. → Adopted in the [backend daily-hash module](analytics-backend-spec.md#approach-3--two-level-daily-hash-primary).

### What VB Adopted

The v0.3.0 spec revision integrates 12 patterns from these platforms into a coherent system. The core insight: privacy-first analytics is not a limitation but an architectural advantage. Layer 0 (HTTP headers) and Layer 1 (server logs) provide baseline counts with zero client code. Layer 3 (JS beacon) adds taxonomy, SPA support, and declarative events in under 1.5 KB. Optional modules add observability (vitals, errors) only when explicitly loaded. The result is a five-layer progressive system where each layer adds capability without requiring the layers below it to change — true progressive enhancement applied to analytics.