---
title: Vanilla Breeze Analytics System — Client Specification
description: >
  Client-side design for a first-party, privacy-transparent analytics system
  for Vanilla Breeze. Covers collection layers, page taxonomy, event catalog,
  declarative attributes, modular script architecture, and compliance.
date: 2026-02-27
status: design
version: 0.3.0
companion: analytics-backend-spec.md
supersedes:
  - analytics.md
  - analytics-part2.md
tags:
  - analytics
  - privacy
  - web-components
  - vanilla-breeze
---

# Vanilla Breeze Analytics System

A first-party, cookieless, privacy-transparent analytics system. Collected data is visible and clearable by the user through the VB settings panel. Page taxonomy metadata categorises visitors into broad interest and persona buckets without identifying individuals. Server-side infrastructure (ingest, bot intelligence, schema, queries) is documented in the companion [backend specification](analytics-backend-spec.md).

---

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Competitive Landscape](#competitive-landscape)
- [Current State in Vanilla Breeze](#current-state-in-vanilla-breeze)
- [System Architecture](#system-architecture)
- [Page Taxonomy Schema](#page-taxonomy-schema)
- [Collection Layers](#collection-layers)
  - [Layer 0 — HTTP Header Counting](#layer-0--http-header-counting)
  - [Layer 1 — Server Logs with Client Hints](#layer-1--server-logs-with-client-hints)
  - [Layer 2 — The `ping` Attribute](#layer-2--the-ping-attribute)
  - [Layer 3 — JavaScript Beacon Module](#layer-3--javascript-beacon-module)
  - [Layer 4 — `sessionStorage` Event Buffer](#layer-4--sessionstorage-event-buffer)
- [Visitor Identification](#visitor-identification)
- [Declarative Event Attributes](#declarative-event-attributes)
- [VB Event Catalog and Analytics Mapping](#vb-event-catalog-and-analytics-mapping)
- [Script Architecture](#script-architecture)
- [URL Masking](#url-masking)
- [The `<analytics-panel>` Component](#the-analytics-panel-component)
- [Compliance Architecture](#compliance-architecture)
- [Phased Roadmap](#phased-roadmap)
- [Key Files Referenced](#key-files-referenced)

---

## Design Philosophy

### Principles

**1. Transparency as the product.** The user can see exactly what is stored about them, on their device and on the server, through an in-page UI. This is not a privacy policy footer link — it is an actual data viewer built into the site.

**2. First-party only.** No data leaves the site owner's infrastructure. No third-party scripts. No CDN for the analytics script. The ingest endpoint runs on the same domain as the site.

**3. Aggregate over individual.** The server stores counts, not records. When an event arrives at the ingest endpoint, it increments a counter and the raw event is discarded. There is no table of individual user actions to breach or misuse.

**4. Progressive enhancement.** Analytics degrade gracefully at every layer. If JavaScript is blocked, server logs still capture page views. If `ping` is blocked (Firefox), a `sendBeacon` fallback fires. If `sessionStorage` is unavailable, events are sent immediately. Nothing breaks.

**5. Bot traffic is intelligence, not noise.** Rather than just filtering bots out, the system classifies and reports on them. In 2025–2026, knowing which AI crawlers are indexing your content, how often, and which pages they prefer is operationally valuable.

**6. Metadata-driven categorisation.** Pages are tagged at the HTML level with taxonomy attributes. The analytics system reads these tags and rolls up interest, persona, and activity dimensions without storing any behavioural profile on an individual.

**7. Script economy.** The core analytics script targets <1.5 KB gzipped — smaller than most analytics platforms' tracking pixels. Every byte must justify its existence. Extended capabilities (events, Web Vitals, error tracking) are separate opt-in modules, not bundled into the core.

**8. Declarative first.** HTML authors can instrument analytics through `data-vb-event` attributes without writing JavaScript. This aligns with VB's progressive-enhancement philosophy: markup declares intent, the runtime observes it.

### Industry Context

This spec was informed by studying 13 privacy-first analytics platforms. Key patterns adopted:

- **Cabin** — zero-JS visit counting via HTTP `Last-Modified` headers (Layer 0)
- **Simple Analytics** — referrer-based unique visitor detection
- **Fathom** — two-level daily hash with salt rotation for visitor uniqueness
- **OpenPanel** — screen width as additional hash entropy
- **Plausible** — sub-1KB script architecture and Web Vitals integration
- **Umami** — `data-umami-event` declarative attribute pattern
- **PostHog** — `ph-no-capture` element exclusion and modular script loading
- **Rybbit** — SPA navigation debounce and URL path masking
- **Swetrix** — JavaScript error tracking as an analytics event category

See [analytics-part3.md](analytics-part3.md) for the full research index with links.

### What the System Does Not Do

- Store persistent user identifiers (no UUID, no fingerprint, no cross-session ID)
- Set cookies of any kind
- Share data with any third party
- Track users across different websites
- Store raw IP addresses (geo-lookup only, IP discarded in transit)
- Profile individual users over time

### User-Centered Principles

If analytics becomes first-class in Vanilla Breeze, it should stay platform-first and user-centered:

1. Measure interactions and outcomes, not identity.
2. Prefer first-party collection endpoints.
3. Keep event payloads minimal and typed.
4. Respect consent, GPC/DNT, and referrer boundaries.
5. Never require third-party SDKs for core functionality.
6. Work progressively: no analytics should block navigation or UI.

---

## Competitive Landscape

Patterns studied across 13 platforms and how they influenced this spec:

| Platform | Pattern Adopted | Spec Section |
|----------|----------------|--------------|
| Cabin | Zero-JS `Last-Modified` header counting | [Layer 0](#layer-0--http-header-counting) |
| Simple Analytics | Referrer-based unique visitor detection | [Visitor Identification](#visitor-identification) |
| Fathom | Two-level daily hash with salt rotation | [Visitor Identification](#visitor-identification) |
| OpenPanel | Screen width as hash entropy input | [Visitor Identification](#visitor-identification) |
| Plausible | Sub-1KB core script, Web Vitals integration | [Script Architecture](#script-architecture) |
| Umami | `data-umami-event` declarative tracking | [Declarative Event Attributes](#declarative-event-attributes) |
| PostHog | `ph-no-capture` element exclusion, modular loading | [Declarative Event Attributes](#declarative-event-attributes), [Script Architecture](#script-architecture) |
| Rybbit | SPA debounce (100ms), URL path masking | [Layer 3](#layer-3--javascript-beacon-module), [URL Masking](#url-masking) |
| Swetrix | JS error tracking as analytics events | [Event Catalog](#vb-event-catalog-and-analytics-mapping) |
| Pirsch | Server-side only, no client script needed | [Layer 1](#layer-1--server-logs-with-client-hints) |
| Ackee | Self-hosted, minimal-footprint design | Design Philosophy |
| Fathom | CNIL-exempt architecture | [Compliance](#compliance-architecture) |
| PostHog | Feature flags gating analytics modules | [Script Architecture](#script-architecture) |

---

## Current State in Vanilla Breeze

### What Already Exists

1. **Root page context on `<html>`:**
   - `data-page` (layout/page type hook used by docs/lab layouts)
   - `data-theme`, `data-mode`, and `data-fluid` (theme/mode/fluid context)
   - Optional extension context like `data-motion-reduced`

2. **`ping` is already documented as a first-class native attribute:**
   - `11ty-site/src/pages/docs/attributes/ping.njk`
   - Docs correctly call out major limitations:
     - Firefox disables `ping` by default (`browser.send_pings=false`)
     - Privacy browsers/extensions can block pings
     - Payload is fixed (`PING`) so rich data must be in query params

3. **The component/runtime layer emits many analytics-ready events already:**
   - Form/wizard: `vb:submit`, `wizard:stepchange`, `wizard:complete`, `wizard:reset`
   - Theme/a11y: `theme-change`, `a11y-themes-change`, `extensions-change`
   - UI interaction: `accordion-wc:toggle`, `drop-down:open|close`, `tab-set:change`, `site-search:open|close`
   - Data interactions: `data-table:sort|filter|expand|selection|page`
   - Navigation helpers: `page-toc:navigate`, `heading-links:navigate`

4. **Privacy primitives are already documented:**
   - `referrerpolicy` guidance exists and is detailed
   - This gives a solid foundation for analytics that does not leak unnecessary URL data

### What Is Missing

1. No dedicated analytics runtime in `src/lib` (no unified `track()` or `initAnalytics()` API).
2. No standard event taxonomy across component events.
3. No consent gate or policy layer in runtime.
4. No transport abstraction (`sendBeacon`/`fetch keepalive`/queue fallback).
5. No single analytics document tying context + events + ping + privacy together.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│  ┌───────────────────┐   ┌──────────────────────────────┐  │
│  │   Page HTML        │   │   sessionStorage buffer      │  │
│  │   <meta> taxonomy  │   │   scroll depth               │  │
│  │   ping attributes  │   │   attention time             │  │
│  │   data-vb-event    │   │   event queue                │  │
│  └────────┬──────────┘   └──────────┬───────────────────┘  │
│           │                          │                      │
│           ▼                          ▼                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              vb-analytics.js (<1.5 KB core)            │ │
│  │   reads taxonomy · opt-out check · page view beacon    │ │
│  │   SPA debounce · data-vb-event delegation              │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                     │
│  ┌────────────────────┼───────────────────────────────────┐ │
│  │  Optional modules  │                                   │ │
│  │  · vb-analytics-events.js    (event buffer, Layer 4)   │ │
│  │  · vb-analytics-vitals.js    (LCP, CLS, INP)          │ │
│  │  · vb-analytics-errors.js    (runtime + promise)       │ │
│  └────────────────────┼───────────────────────────────────┘ │
│                       │                                     │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │              <analytics-panel> component               │ │
│  │   inside <settings-panel> · shows stored data          │ │
│  │   lets user view / configure / clear                   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────┬────────────────────────────────────────┘
                   │  HTTP POST  (same domain, first-party)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 0: HTTP headers (zero JS)                            │
│  Layer 1: Server logs + Client Hints                        │
│  Layers 2-4: Beacon/ping/buffer ingest                      │
│  → See analytics-backend-spec.md                            │
└─────────────────────────────────────────────────────────────┘
```

### Layer Mapping

The five-layer model maps to concrete implementations:

| Layer | Purpose | Concrete Implementation |
|---|---|---|
| **0: HTTP Headers** | Zero-JS visit counting | Server sets `Last-Modified` at midnight; browser conditional requests indicate new vs returning visitors. No client code required. |
| **A: Context** | Page-level metadata for every beacon | `<html>` dataset (runtime state) + `<meta name="vb:*">` taxonomy (build-time content metadata) |
| **B: Events** | Normalised interaction signals | VB custom events → `Analytics.track()` envelope → sessionStorage buffer. `data-vb-event` delegation for declarative tracking. |
| **C: Transport** | Getting data to the server | Two lanes: `ping` attribute (outbound clicks) + `sendBeacon`/`fetch keepalive` (JS events). Flush on `visibilitychange`/`pagehide`. |
| **D: Privacy/Consent** | Gating all transmission | `isOptedOut()` check on every action. Priority: `sessionStorage` opt-out > GPC > DNT > app consent function. `data-vb-no-track` for author-side exclusion. |

---

## Page Taxonomy Schema

Pages are annotated with `<meta>` tags that describe their content type, target audience, and intended visitor activity. The analytics script reads these on page load and includes the values in every beacon. This enables aggregate reporting by persona and content type without tracking individuals.

### Meta Tag Vocabulary

```html
<head>
  <!-- Who this page is for (one primary persona) -->
  <meta name="vb:persona" content="developer">

  <!-- What the visitor is likely doing here -->
  <meta name="vb:activity" content="learning">

  <!-- Primary content topic (freeform, site-defined) -->
  <meta name="vb:topic" content="web-components">

  <!-- Content type -->
  <meta name="vb:content" content="tutorial">

  <!-- Where in the journey this page sits -->
  <meta name="vb:stage" content="awareness">

  <!-- Optional: content series or collection membership -->
  <meta name="vb:series" content="css-fundamentals">
</head>
```

### Controlled Vocabulary

Each dimension uses a closed vocabulary so aggregate roll-ups are meaningful. Teams define their own values, but consistency is enforced at the meta tag level.

**`vb:persona`** — Who is the primary intended reader?

| Value | Description |
|-------|-------------|
| `developer` | Software developer, engineer |
| `designer` | Visual designer, UX practitioner |
| `educator` | Teacher, trainer, course author |
| `student` | Learner, bootcamp attendee |
| `manager` | Technical lead, engineering manager |
| `general` | Non-technical audience |

**`vb:activity`** — What is the visitor trying to accomplish?

| Value | Description |
|-------|-------------|
| `learning` | Consuming educational content |
| `reference` | Looking up a specific fact or API |
| `evaluating` | Assessing a tool or approach |
| `implementing` | Following along to build something |
| `troubleshooting` | Debugging or solving a problem |
| `browsing` | General exploration, no specific goal |

**`vb:content`** — What form does this content take?

| Value | Description |
|-------|-------------|
| `tutorial` | Step-by-step guide |
| `reference` | API docs, specification |
| `article` | Long-form editorial |
| `demo` | Interactive example |
| `index` | List or directory page |
| `home` | Site root |
| `about` | About / info page |

**`vb:stage`** — Where in an awareness/adoption journey?

| Value | Description |
|-------|-------------|
| `awareness` | Visitor is first discovering the topic |
| `consideration` | Comparing options, deepening knowledge |
| `adoption` | Actively using or implementing |
| `mastery` | Advanced, reference-level material |

**`vb:series`** — Optional grouping for multi-part content.

Free-form slug, e.g. `container-queries`, `http-fundamentals`, `vb-components`. Used to group related pages for series-level analytics.

### Reading Taxonomy in JavaScript

```javascript
/**
 * Read all vb:* meta tags from the current page.
 * Returns a flat object of taxonomy dimensions.
 * @returns {Record<string, string>}
 */
function readPageTaxonomy() {
  const taxonomy = {};
  document.querySelectorAll('meta[name^="vb:"]').forEach(meta => {
    const key = meta.getAttribute('name').slice(3); // strip 'vb:'
    const val = meta.getAttribute('content')?.trim();
    if (key && val) taxonomy[key] = val;
  });
  return taxonomy;
}
```

### How `<html>` Dataset Complements `<meta>` Taxonomy

| Source | When set | What it captures | Example |
|---|---|---|---|
| `<html>` dataset | Runtime (JS or template) | Theme, mode, fluid, layout state, extensions | `data-theme="forest"`, `data-mode="dark"` |
| `<meta name="vb:*">` | Build time (template) | Content taxonomy: persona, activity, topic, stage | `<meta name="vb:persona" content="developer">` |

The analytics module reads both. The `<html>` dataset provides runtime context that changes per-session (theme choice, accessibility preferences). The `<meta>` taxonomy provides stable content classification that stays the same across visits to the same page.

---

## Collection Layers

### Layer 0 — HTTP Header Counting

Zero-JavaScript visit counting using HTTP conditional requests. This is the most privacy-friendly layer: no scripts, no cookies, no client-side state. Inspired by Cabin's `Last-Modified` / `If-Modified-Since` pattern.

**How it works:**

1. Server sets `Last-Modified` on page responses to midnight of the current day
2. On first visit, browser has no `If-Modified-Since` → server counts a new visit
3. On subsequent visits (same day), browser sends `If-Modified-Since` → server counts a returning visit
4. The difference gives a rough unique visitor count with zero client cooperation

**Client requirements:** None. This layer is entirely server-side. See the [backend specification](analytics-backend-spec.md#layer-0--http-header-counting) for implementation.

**Limitations:**

- Privacy browsers may strip `If-Modified-Since`
- Cannot distinguish between different visitors — only "new today" vs "returning today"
- Best used as a baseline floor count, supplemented by Layer 1+ signals

---

### Layer 1 — Server Logs with Client Hints

The foundation layer. Captures every HTTP request including bots, no-JS visitors, monitoring tools, and AI crawlers. Requires no client cooperation.

Server logs are processed by a scheduled job that classifies requests as human or bot traffic, extracts device information from Client Hints headers, and records structured hits in the database.

**Client requirements:** None — the browser sends Client Hints headers automatically when the server opts in via `Accept-CH`. The [backend specification](analytics-backend-spec.md#server-logs-and-log-processor) covers nginx configuration, the log processor, and bot classification.

**Referrer-based unique detection:** Visitors arriving with an external referrer are flagged as likely unique (Simple Analytics pattern). This supplements the Layer 3 daily hash for log-only traffic.

---

### Layer 2 — The `ping` Attribute

Declarative outbound link tracking. Zero JavaScript dependency. Browser-native HTTP POST on link click.

`ping` should be used as one channel, not the analytics foundation.

**Best use:**
1. Outbound link click attribution.
2. CTA click counting where exact payload is small.
3. JS-independent measurement for simple links.

**Do not depend on `ping` for:**
1. Critical conversion metrics that require full coverage.
2. Rich event payloads.
3. Button/programmatic navigation analytics.

**Recommended pattern:**
1. Add `ping` to key anchors for transparent, declarative tracking.
2. Also instrument click events in JS for fallback and richer metadata.
3. Deduplicate server-side (link id + timestamp window + session key).

#### Instrumenting Links at Build Time

For static sites, apply `ping` at build time in your template layer:

```html
<!-- Template: all external links get ping automatically -->
<a
  href="https://github.com/example/repo"
  ping="/analytics/click?page=/docs/installation&type=outbound"
  rel="noopener noreferrer"
>
  View on GitHub
</a>
```

For content managed dynamically, apply via the JS module (see Layer 3).

The server-side `ping` handler is documented in the [backend specification](analytics-backend-spec.md#analyticsclick--outbound-link-click).

---

### Layer 3 — JavaScript Beacon Module

**`vb-analytics.js`** — the core collection module. Handles page views, taxonomy reading, outbound link instrumentation (with `ping` + `sendBeacon` fallback), SPA navigation with debounce, opt-out checks, and `data-vb-no-track` exclusion.

```javascript
/**
 * @module vb-analytics
 * @description Privacy-first analytics collection for Vanilla Breeze sites.
 * Reads page taxonomy meta tags and includes them in aggregate beacons.
 * No cookies. No persistent identifiers. No personal data stored.
 *
 * Size target: <1.5 KB gzipped.
 */

const SITE_ID  = document.currentScript?.dataset.site ?? '';
const ENDPOINT = '/analytics';

// --- Opt-out signals — respect unconditionally ---
function isOptedOut() {
  return navigator.doNotTrack === '1'
    || navigator.globalPrivacyControl === true
    || sessionStorage.getItem('vb_optout') === '1';
}

// --- data-vb-no-track check (PostHog pattern) ---
function isExcludedElement(el) {
  return el?.closest('[data-vb-no-track]') != null;
}

// --- Page taxonomy ---
function readTaxonomy() {
  const t = {};
  document.querySelectorAll('meta[name^="vb:"]').forEach(m => {
    const k = m.getAttribute('name').slice(3);
    const v = m.getAttribute('content')?.trim();
    if (k && v) t[k] = v;
  });
  return t;
}

// --- Device info via Client Hints (Chromium) or UA fallback ---
async function getDeviceHints() {
  if (navigator.userAgentData) {
    try {
      const h = await navigator.userAgentData.getHighEntropyValues([
        'platform', 'mobile', 'platformVersion',
      ]);
      return { platform: h.platform, mobile: h.mobile };
    } catch {}
  }
  return {};
}

// --- Session visit counter (day-scoped, no identity) ---
function getSessionVisitCount() {
  const TODAY = new Date().toISOString().slice(0, 10);
  try {
    const raw = sessionStorage.getItem('vb_sc');
    const s = raw ? JSON.parse(raw) : null;
    if (s?.d !== TODAY) {
      sessionStorage.setItem('vb_sc', JSON.stringify({ d: TODAY, v: 1 }));
      return 1;
    }
    s.v++;
    sessionStorage.setItem('vb_sc', JSON.stringify(s));
    return s.v;
  } catch { return 0; }
}

// --- Beacon ---
function send(endpoint, payload) {
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(`${ENDPOINT}/${endpoint}`, blob);
  } else {
    fetch(`${ENDPOINT}/${endpoint}`, { method: 'POST', body: blob, keepalive: true });
  }
}

// --- Page view ---
async function trackPage(path) {
  if (isOptedOut()) return;
  const hints    = await getDeviceHints();
  const visitNum = getSessionVisitCount();

  send('hit', {
    s:        SITE_ID,
    p:        path,
    r:        document.referrer || '',
    w:        screen.width,
    t:        Math.round(performance.now()),
    u:        visitNum === 1 ? 1 : 0,    // unique today?
    taxonomy: readTaxonomy(),
    ...hints,
  });
}

// --- Outbound links: ping + sendBeacon fallback ---
function instrumentLinks() {
  document.querySelectorAll('a[href^="http"]').forEach(link => {
    if (link.hostname === location.hostname) return;
    if (isExcludedElement(link)) return;

    // ping attribute for Chrome/Safari/Edge
    const pingUrl = `${ENDPOINT}/click?page=${encodeURIComponent(location.pathname)}`;
    link.setAttribute('ping', pingUrl);

    // sendBeacon fallback — fires for Firefox where ping is disabled
    link.addEventListener('click', () => {
      if (isOptedOut()) return;
      if (navigator.userAgent.includes('Firefox') || navigator.userAgent.includes('Brave')) {
        send('click', {
          s:    SITE_ID,
          from: location.pathname,
          to:   link.hostname,
          taxonomy: readTaxonomy(),
        });
      }
    });
  });
}

// --- SPA navigation (History API) with debounce ---
function watchNavigation() {
  let debounceTimer;
  const SPA_DEBOUNCE_MS = 100; // Rybbit pattern: prevent duplicate fires

  const handleNav = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      trackPage(location.pathname + location.search);
      instrumentLinks();
    }, SPA_DEBOUNCE_MS);
  };

  const origPush = history.pushState.bind(history);
  history.pushState = (...args) => {
    origPush(...args);
    handleNav();
  };
  window.addEventListener('popstate', handleNav);
}

// --- Public event API ---
window.vbTrack = (id, params = {}) => {
  if (isOptedOut()) return;
  // Delegate to buffer module (Layer 4)
  window.dispatchEvent(new CustomEvent('vb:track', { detail: { id, params } }));
};

// --- Init ---
if (!isOptedOut() && !document.documentElement.hasAttribute('data-vb-no-track')) {
  trackPage(location.pathname + location.search);
  instrumentLinks();
  watchNavigation();
}
```

> **Known limitation:** The Firefox/Brave UA-sniff in `instrumentLinks()` is imperfect. An alternative approach is to always fire the `sendBeacon` fallback for every outbound click and deduplicate server-side against `ping` POSTs using `(from_page, to_domain, timestamp_window)`. This trades slightly higher ingest volume for complete coverage.

**HTML integration:**

```html
<script src="/js/vb-analytics.js" data-site="mysite" async></script>
```

---

### Layer 4 — `sessionStorage` Event Buffer

A separate module that handles event queueing, scroll depth, and attention tracking. Kept separate from the beacon module to keep concerns clean.

```javascript
/**
 * @module vb-analytics-buffer
 * @description sessionStorage event buffer for Vanilla Breeze analytics.
 * Accumulates scroll depth, attention time, and custom events.
 * Flushes on page hide. Auto-cleared by browser on tab close.
 * No cross-session persistence — sessionStorage only.
 */

const ENDPOINT  = '/analytics';
const QUEUE_KEY = 'vb_q';
const MAX_QUEUE = 50;

// --- sessionStorage queue ---
const queue = {
  get:   () => { try { return JSON.parse(sessionStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; } },
  set:   (q) => { try { sessionStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {} },
  clear: () => { try { sessionStorage.removeItem(QUEUE_KEY); } catch {} },
};

function enqueue(id, params) {
  const q = queue.get();
  // Replace existing event of same id (e.g. scroll depth updates in place)
  const idx = q.findIndex(e => e.id === id);
  const ev  = { id, params, ts: Date.now() };
  if (idx >= 0) q[idx] = ev; else q.push(ev);
  if (q.length > MAX_QUEUE) q.shift();
  queue.set(q);
}

// --- Flush ---
function flush() {
  const q = queue.get();
  if (!q.length) return;
  const payload = {
    s:   document.currentScript?.dataset.site ?? '',
    p:   location.pathname,
    evs: q,
  };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  if (navigator.sendBeacon(`${ENDPOINT}/events`, blob)) {
    queue.clear();
  }
  // If sendBeacon returns false (queue full), leave in sessionStorage.
  // Browser will clear it on tab close anyway, so no privacy concern.
}

// --- Scroll depth ---
let maxScroll = 0;
const trackScroll = () => {
  const pct = Math.round(
    ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
  );
  if (pct > maxScroll) {
    maxScroll = pct;
    enqueue('__scroll', { depth: pct });
  }
};
let scrollTimer;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(trackScroll, 500);
}, { passive: true });

// --- Attention time (active tab time only) ---
let attStart = document.visibilityState === 'visible' ? Date.now() : null;
let totalAtt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    attStart = Date.now();
  } else {
    if (attStart) { totalAtt += Date.now() - attStart; attStart = null; }
    enqueue('__attention', { ms: totalAtt });
    flush();
  }
});

// --- Listen for custom events from vb-analytics.js ---
window.addEventListener('vb:track', ({ detail: { id, params } }) => {
  enqueue(id, params);
});

// --- Flush on page departure ---
window.addEventListener('pagehide', flush);
```

---

## Visitor Identification

The system uses a three-approach gradient for visitor identification, from zero-JS to full-featured. No approach stores a persistent identifier.

### Approach 1 — HTTP Header Counting (Zero-JS)

Cabin's `Last-Modified` / `If-Modified-Since` pattern. The presence or absence of `If-Modified-Since` in the request indicates whether the browser has visited today. No client code required.

**Granularity:** Daily. Cannot distinguish between different visitors — only "new today" vs "returning today."

See [Layer 0](#layer-0--http-header-counting) and the [backend specification](analytics-backend-spec.md#layer-0--http-header-counting).

### Approach 2 — Referrer-Based Uniques

Simple Analytics pattern. A visitor arriving with an external referrer (or no referrer — direct visit) is likely unique. A visitor whose `document.referrer` matches the current site is a same-session navigation.

**Granularity:** Per-visit heuristic. Undercounts returning visitors who always arrive via external links. Overcounts tab-restores. Used as a supplementary signal.

### Approach 3 — Two-Level Daily Hash (Primary)

Fathom's daily hash with OpenPanel's screen-width entropy. Computed server-side:

```
Level 1: SHA-256(ip + ua + siteId + dailySalt)
Level 2: SHA-256(level1 + screenWidth)
```

The hash is checked against an in-memory Set, used to set `is_unique = 1` on the first hit of the day, then **discarded**. Neither the hash nor its inputs are stored.

**Privacy guarantees:**
- Salt rotates daily — yesterday's hashes cannot be recomputed
- Salt is per-site — no cross-site correlation
- Screen width adds ~4 bits of entropy without being a fingerprint (only ~20 common values exist)

See the [backend specification](analytics-backend-spec.md#daily-hash-and-visitor-uniqueness) for the full implementation.

---

## Declarative Event Attributes

HTML authors can instrument analytics through data attributes without writing JavaScript. Inspired by Umami's `data-umami-event` pattern and PostHog's `ph-no-capture` exclusion.

### Tracking Events

Add `data-vb-event` to any interactive element. The analytics system observes clicks via event delegation:

```html
<!-- Simple event -->
<button data-vb-event="signup">Create Account</button>

<!-- Event with properties (extra data-vb-event-* attributes) -->
<button data-vb-event="signup" data-vb-event-plan="pro" data-vb-event-source="hero">
  Start Pro Plan
</button>

<!-- On links — fires alongside ping -->
<a href="/pricing" data-vb-event="pricing_click" data-vb-event-from="nav">
  Pricing
</a>
```

### Excluding Elements

Add `data-vb-no-track` to any element to suppress analytics for it and all descendants:

```html
<!-- Internal tools section — don't track -->
<section data-vb-no-track>
  <button>Admin Action</button> <!-- not tracked -->
  <a href="/internal">Internal Link</a> <!-- no ping, no beacon -->
</section>

<!-- Individual element -->
<button data-vb-no-track>Skip Survey</button>
```

### Delegation Handler

The core script uses a single click listener on `document` for all declarative events:

```javascript
/**
 * Event delegation handler for data-vb-event attributes.
 * Reads the event name and any data-vb-event-* properties,
 * then forwards through the standard Analytics.track() pipeline.
 */
function initDeclarativeEvents() {
  document.addEventListener('click', (e) => {
    if (isOptedOut()) return;

    const target = e.target.closest('[data-vb-event]');
    if (!target || isExcludedElement(target)) return;

    const eventName = target.dataset.vbEvent;
    if (!eventName) return;

    // Collect data-vb-event-* properties
    const props = {};
    for (const [key, value] of Object.entries(target.dataset)) {
      if (key.startsWith('vbEvent') && key !== 'vbEvent') {
        // Convert camelCase back to kebab: vbEventPlan → plan
        const propName = key.slice(7).replace(/^./, c => c.toLowerCase());
        props[propName] = value;
      }
    }

    window.vbTrack(eventName, props);
  });
}
```

### Attribute Reference

| Attribute | Scope | Purpose |
|-----------|-------|---------|
| `data-vb-event="name"` | Element | Declares a trackable click event with the given name |
| `data-vb-event-*="value"` | Element | Adds a property to the event (e.g., `data-vb-event-plan="pro"` → `{ plan: "pro" }`) |
| `data-vb-no-track` | Element + descendants | Suppresses all analytics tracking for this element and its children |

---

## VB Event Catalog and Analytics Mapping

Vanilla Breeze already emits 60+ custom events from its components and runtime. This section maps those events to analytics value tiers and defines the normalised event names used in beacon payloads.

### Normalisation Convention

Source events use `component:action` format (e.g., `data-table:sort`). Analytics event names use `category.action_detail` format (e.g., `table.sort`).

### Tier 1 — High-Value (Phase 1)

These events represent meaningful user intent and should be wired from day one.

| Source Event | Analytics Name | Props |
|---|---|---|
| `vb:submit` | `form.submit_valid` | `{ formId }` |
| `wizard:stepchange` | `form.wizard_step` | `{ step, direction }` |
| `wizard:complete` | `form.wizard_complete` | `{ steps }` |
| `wizard:reset` | `form.wizard_reset` | `{}` |
| `data-table:sort` | `table.sort` | `{ column, direction }` |
| `data-table:filter` | `table.filter` | `{ column, value }` |
| `data-table:page` | `table.paginate` | `{ page }` |
| `theme-change` | `ui.theme_change` | `{ theme, mode }` |
| `heading-links:navigate` | `docs.anchor_navigate` | `{ id }` |
| `page-toc:navigate` | `docs.toc_navigate` | `{ id }` |
| `site-search:open` | `search.open` | `{}` |
| `site-search:close` | `search.close` | `{ hasQuery }` |

### Tier 2 — Medium-Value (Phase 2)

Useful for understanding engagement depth but not critical for launch.

| Source Event | Analytics Name | Props |
|---|---|---|
| `accordion-wc:toggle` | `ui.accordion_toggle` | `{ open, index }` |
| `tab-set:change` | `ui.tab_change` | `{ tab }` |
| `carousel-wc:slide-change` | `ui.carousel_slide` | `{ index }` |
| `carousel-wc:autoplay-toggle` | `ui.carousel_autoplay` | `{ playing }` |
| `rating-change` | `ui.rating` | `{ value }` |
| `copy` | `ui.copy` | `{ target }` |
| `a11y-themes-change` | `ui.a11y_theme` | `{ theme }` |
| `extensions-change` | `ui.extension_toggle` | `{ extension, enabled }` |

### Tier 3 — Error and Performance Events (Phase 3)

Observability events from optional modules. Inspired by Swetrix (error tracking) and Plausible/OpenPanel (Web Vitals).

| Analytics Name | Source | Props | Module |
|---|---|---|---|
| `error.js_runtime` | `window.onerror` | `{ message, source, line, col }` | `vb-analytics-errors.js` |
| `error.unhandled_promise` | `unhandledrejection` | `{ reason }` | `vb-analytics-errors.js` |
| `perf.lcp` | `PerformanceObserver` | `{ value, rating }` | `vb-analytics-vitals.js` |
| `perf.cls` | `PerformanceObserver` | `{ value, rating }` | `vb-analytics-vitals.js` |
| `perf.inp` | `PerformanceObserver` | `{ value, rating }` | `vb-analytics-vitals.js` |
| `perf.ttfb` | `PerformanceObserver` | `{ value }` | `vb-analytics-vitals.js` |

### Exclude by Default

High-frequency events that would create noise. Never auto-wire these.

| Source Event | Reason |
|---|---|
| `text-reader:word` | Fires per word during TTS — extremely high frequency |
| `geo-map:move` | Fires on every pan/zoom gesture |
| `split-surface:resize` | Fires continuously during drag |
| Internal lifecycle events (`connectedCallback` signals, etc.) | No user intent |

### Opt-In on Demand

Events that have niche value. Wire only when a specific analytics question requires them.

| Source Event | Analytics Name | When Useful |
|---|---|---|
| `command-palette:select` | `ui.command_select` | Measuring feature discovery |
| `emoji-picker:select` | `ui.emoji_select` | Content creation analytics |
| `geo-map:activate` | `ui.map_interact` | Measuring map engagement |
| `drop-down:open` | `ui.dropdown_open` | Navigation pattern analysis |
| `drop-down:close` | `ui.dropdown_close` | Navigation pattern analysis |
| `data-table:expand` | `table.row_expand` | Detail engagement depth |
| `data-table:selection` | `table.row_select` | Bulk action usage patterns |

---

## Script Architecture

### Modular Design with Size Budget

The analytics system is modular by design. The core script is tiny; everything else is opt-in. This matches the pattern used by Plausible (938 bytes core) and PostHog (modular extensions).

| Module | Purpose | Size Target | Load |
|--------|---------|-------------|------|
| `vb-analytics.js` | Page views, opt-out, SPA debounce, declarative events | <1.5 KB gzip | Always |
| `vb-analytics-events.js` | sessionStorage buffer, scroll depth, attention time | <1 KB gzip | Opt-in |
| `vb-analytics-vitals.js` | Web Vitals (LCP, CLS, INP, TTFB) | <0.8 KB gzip | Opt-in |
| `vb-analytics-errors.js` | Runtime errors, unhandled promise rejections | <0.5 KB gzip | Opt-in |

**Total budget:** <4 KB gzipped for all modules combined.

### Loading Patterns

```html
<!-- Core only (most sites) -->
<script src="/js/vb-analytics.js" data-site="mysite" async></script>

<!-- Core + event buffer -->
<script src="/js/vb-analytics.js" data-site="mysite" async></script>
<script src="/js/vb-analytics-events.js" async></script>

<!-- Full observability suite -->
<script src="/js/vb-analytics.js" data-site="mysite" async></script>
<script src="/js/vb-analytics-events.js" async></script>
<script src="/js/vb-analytics-vitals.js" async></script>
<script src="/js/vb-analytics-errors.js" async></script>
```

### Entry Point Integration

The analytics system initialises after the theme manager (which sets up `<html>` dataset state). In `src/main.js` or equivalent:

```javascript
// After ThemeManager.init() — HTML dataset is now populated
import { Analytics } from './lib/analytics.js';

Analytics.init({
  endpoint: '/analytics',
  consent: () => window.appConsent?.analytics === true,
  context: () => ({ page: document.documentElement.dataset.page || 'unknown' }),
  sampleRate: 1
});
```

### `Analytics` API

```javascript
// src/lib/analytics.js

Analytics.init(config)       // Configure endpoint, consent function, context builder, sample rate
Analytics.track(name, props) // Send a normalised event to the buffer
Analytics.flush()            // Force-flush the event buffer (called on pagehide)
```

### Auto-Wiring Module

The `analytics-init.js` module listens for VB custom events and forwards them through `Analytics.track()` using the event catalog mapping:

```javascript
// src/utils/analytics-init.js
import { Analytics } from '../lib/analytics.js';

const TIER_1_MAP = {
  'vb:submit':              (e) => Analytics.track('form.submit_valid', { formId: e.detail?.formId }),
  'wizard:stepchange':      (e) => Analytics.track('form.wizard_step', { step: e.detail?.step, direction: e.detail?.direction }),
  'wizard:complete':        (e) => Analytics.track('form.wizard_complete', { steps: e.detail?.steps }),
  'wizard:reset':           ()  => Analytics.track('form.wizard_reset'),
  'data-table:sort':        (e) => Analytics.track('table.sort', { column: e.detail?.column, direction: e.detail?.direction }),
  'data-table:filter':      (e) => Analytics.track('table.filter', { column: e.detail?.column, value: e.detail?.value }),
  'data-table:page':        (e) => Analytics.track('table.paginate', { page: e.detail?.page }),
  'theme-change':           (e) => Analytics.track('ui.theme_change', { theme: e.detail?.theme, mode: e.detail?.mode }),
  'heading-links:navigate': (e) => Analytics.track('docs.anchor_navigate', { id: e.detail?.id }),
  'page-toc:navigate':      (e) => Analytics.track('docs.toc_navigate', { id: e.detail?.id }),
  'site-search:open':       ()  => Analytics.track('search.open'),
  'site-search:close':      (e) => Analytics.track('search.close', { hasQuery: e.detail?.hasQuery }),
};

export function wireAnalyticsEvents() {
  for (const [event, handler] of Object.entries(TIER_1_MAP)) {
    document.addEventListener(event, handler);
  }
}
```

### Web Vitals Module

```javascript
/**
 * @module vb-analytics-vitals
 * @description Optional Web Vitals reporting for VB analytics.
 * Reports LCP, CLS, INP, and TTFB as analytics events.
 * Inspired by Plausible and OpenPanel's built-in vitals support.
 *
 * Size target: <0.8 KB gzipped.
 */

function observeVitals() {
  if (!('PerformanceObserver' in window)) return;

  // LCP
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcp = entries[entries.length - 1];
      const value = Math.round(lcp.startTime);
      window.vbTrack?.('perf.lcp', {
        value,
        rating: value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor',
      });
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}

  // CLS
  try {
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) clsValue += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });

    // Report CLS on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        window.vbTrack?.('perf.cls', {
          value: Math.round(clsValue * 1000) / 1000,
          rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
        });
      }
    });
  } catch {}

  // INP
  try {
    let inpValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > inpValue) inpValue = entry.duration;
      }
    }).observe({ type: 'event', buffered: true });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && inpValue > 0) {
        window.vbTrack?.('perf.inp', {
          value: inpValue,
          rating: inpValue <= 200 ? 'good' : inpValue <= 500 ? 'needs-improvement' : 'poor',
        });
      }
    });
  } catch {}
}

observeVitals();
```

### Error Tracking Module

```javascript
/**
 * @module vb-analytics-errors
 * @description Optional error tracking for VB analytics.
 * Captures runtime JS errors and unhandled promise rejections.
 * Inspired by Swetrix's error tracking as analytics events.
 *
 * Size target: <0.5 KB gzipped.
 */

window.addEventListener('error', (e) => {
  window.vbTrack?.('error.js_runtime', {
    message: e.message?.slice(0, 200),
    source: e.filename?.split('/').pop(),
    line: e.lineno,
    col: e.colno,
  });
});

window.addEventListener('unhandledrejection', (e) => {
  window.vbTrack?.('error.unhandled_promise', {
    reason: String(e.reason)?.slice(0, 200),
  });
});
```

### Client Module Map

```
analytics/
├── client/
│   ├── vb-analytics.js           # Core: page views, opt-out, SPA, declarative events (<1.5 KB)
│   ├── vb-analytics-events.js    # Opt-in: sessionStorage event buffer (<1 KB)
│   ├── vb-analytics-vitals.js    # Opt-in: Web Vitals (LCP, CLS, INP, TTFB) (<0.8 KB)
│   ├── vb-analytics-errors.js    # Opt-in: Error tracking (<0.5 KB)
│   └── analytics-panel.js        # <analytics-panel> web component
│
└── server/                        # → See analytics-backend-spec.md
```

---

## URL Masking

Configure path patterns to mask sensitive route segments before sending beacons. Inspired by Rybbit's URL masking pattern. Useful for:

- User profile pages (`/users/john-doe` → `/users/*`)
- Account pages (`/account/settings/billing` → `/account/*`)
- Dynamic IDs (`/orders/abc-123-def` → `/orders/*`)

### Configuration

```javascript
// In analytics init
Analytics.init({
  endpoint: '/analytics',
  urlMasks: [
    { pattern: /^\/users\/[^/]+/, replace: '/users/*' },
    { pattern: /^\/account\//, replace: '/account/*' },
    { pattern: /^\/orders\/[^/]+/, replace: '/orders/*' },
    { pattern: /\/[0-9a-f]{8,}/, replace: '/*' },  // UUIDs anywhere in path
  ],
});
```

### Implementation

```javascript
/**
 * Apply URL masks before sending a beacon.
 * Runs against the path only (not query string or hash).
 */
function maskUrl(path, masks = []) {
  for (const { pattern, replace } of masks) {
    if (pattern.test(path)) return path.replace(pattern, replace);
  }
  return path;
}
```

This runs client-side before the beacon is sent, so the server never sees the original path for masked routes.

---

## The `<analytics-panel>` Component

The analytics panel lives inside the existing `<settings-panel>` web component. It renders what is currently stored on the user's device, explains each field in plain language, provides configuration controls, and exposes a clear action.

> **Integration note:** `SettingsPanel` currently renders internal sections via `innerHTML` with `<details>` elements — it does not support named slots. Integration requires either adding slot support to `<settings-panel>` or placing `<analytics-panel>` adjacent to it. This is a design decision to resolve during implementation.

### Component Design

```javascript
/**
 * @element analytics-panel
 * @description Shows the user what analytics data is stored on their device.
 * Provides controls to view, configure, and clear that data.
 * Intended for integration with <settings-panel>.
 *
 * @fires analytics-panel:cleared - When user clears their data
 * @fires analytics-panel:optout  - When user opts out
 * @fires analytics-panel:optin   - When user opts back in
 */
class AnalyticsPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  // --- Functional core ---

  get isOptedOut() {
    return sessionStorage.getItem('vb_optout') === '1';
  }

  get sessionData() {
    try {
      const raw = {};
      const sc = JSON.parse(sessionStorage.getItem('vb_sc') || 'null');
      if (sc) raw.sessionCounter = sc;
      const q = JSON.parse(sessionStorage.getItem('vb_q') || '[]');
      if (q.length) raw.queuedEvents = q;
      return raw;
    } catch { return {}; }
  }

  get hasData() {
    return Object.keys(this.sessionData).length > 0;
  }

  // --- Imperative shell ---

  connectedCallback() {
    this.render();
    this.shadowRoot.addEventListener('click', this.handleClick.bind(this));
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this.handleClick.bind(this));
  }

  handleClick(e) {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    switch (action) {
      case 'clear':  this.clearData(); break;
      case 'optout': this.toggleOptOut(); break;
      case 'refresh': this.render(); break;
    }
  }

  clearData() {
    sessionStorage.removeItem('vb_q');
    sessionStorage.removeItem('vb_sc');
    navigator.sendBeacon?.('/analytics/forget',
      new Blob([JSON.stringify({ ts: Date.now() })], { type: 'application/json' })
    );
    this.dispatch('analytics-panel:cleared');
    this.render();
  }

  toggleOptOut() {
    if (this.isOptedOut) {
      sessionStorage.removeItem('vb_optout');
      this.dispatch('analytics-panel:optin');
    } else {
      sessionStorage.setItem('vb_optout', '1');
      this.clearData();
      this.dispatch('analytics-panel:optout');
    }
    this.render();
  }

  dispatch(name) {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));
  }

  render() {
    const data   = this.sessionData;
    const optout = this.isOptedOut;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .panel { padding: var(--space-4, 1rem); }
        h3 { margin: 0 0 var(--space-2, 0.5rem); font-size: var(--font-size-1, 0.875rem); }
        .status {
          display: flex; align-items: center; gap: var(--space-2, 0.5rem);
          padding: var(--space-2) var(--space-3);
          background: var(--surface-2, #f4f4f5);
          border-radius: var(--radius-2, 4px);
          margin-block-end: var(--space-4);
          font-size: var(--font-size-0, 0.8rem);
        }
        .indicator {
          width: 8px; height: 8px; border-radius: 50%;
          background: ${optout ? 'var(--red-6, #dc2626)' : 'var(--green-6, #16a34a)'};
        }
        .data-section { margin-block: var(--space-4); }
        dl {
          display: grid; grid-template-columns: auto 1fr; gap: var(--space-1) var(--space-4);
          font-size: var(--font-size-0, 0.8rem); margin: 0;
        }
        dt { color: var(--text-2, #71717a); font-weight: 500; }
        dd { margin: 0; }
        .empty {
          color: var(--text-2, #71717a);
          font-size: var(--font-size-0, 0.8rem);
          font-style: italic;
        }
        .actions {
          display: flex; flex-wrap: wrap; gap: var(--space-2);
          margin-block-start: var(--space-4);
        }
        button {
          padding: var(--space-1) var(--space-3);
          border: 1px solid var(--surface-4, #d4d4d8);
          border-radius: var(--radius-2, 4px);
          background: var(--surface-1, #fff);
          cursor: pointer;
          font-size: var(--font-size-0, 0.8rem);
        }
        button[data-action="clear"] {
          border-color: var(--red-4, #f87171);
          color: var(--red-7, #b91c1c);
        }
        button[data-action="optout"] {
          border-color: ${optout ? 'var(--green-4, #4ade80)' : 'var(--surface-4)'};
          color: ${optout ? 'var(--green-7, #15803d)' : 'inherit'};
        }
        .note {
          font-size: var(--font-size-00, 0.75rem);
          color: var(--text-2, #71717a);
          margin-block-start: var(--space-3);
          line-height: 1.5;
        }
      </style>

      <div class="panel">
        <h3>Analytics Data</h3>

        <div class="status" role="status">
          <span class="indicator"></span>
          <span>${optout ? 'Analytics paused — no data is being collected' : 'Analytics active — collecting aggregate visit data'}</span>
        </div>

        <div class="data-section">
          <h4>Stored on this device (this session only)</h4>
          ${this.renderSessionData(data)}
        </div>

        <div class="actions">
          ${this.hasData ? `
            <button type="button" data-action="clear">Clear my data</button>
          ` : ''}
          <button type="button" data-action="optout">
            ${optout ? 'Resume analytics' : 'Pause analytics'}
          </button>
          <button type="button" data-action="refresh">Refresh</button>
        </div>

        <p class="note">
          This site collects anonymous, aggregate data only.
          No name, email, or IP address is ever stored.
          Data clears automatically when you close this tab.
          <a href="/privacy">Full privacy details</a>
        </p>
      </div>
    `;
  }

  renderSessionData(data) {
    if (!this.hasData) {
      return `<p class="empty">No data stored on this device in this session.</p>`;
    }

    const sc = data.sessionCounter;
    const q  = data.queuedEvents ?? [];

    const scrollEvent   = q.find(e => e.id === '__scroll');
    const attentionEvent = q.find(e => e.id === '__attention');
    const customEvents  = q.filter(e => !e.id.startsWith('__'));

    return `
      <dl>
        ${sc ? `
          <dt>Pages visited today</dt>
          <dd>${sc.v ?? 1} page${(sc.v ?? 1) !== 1 ? 's' : ''}</dd>
        ` : ''}
        ${scrollEvent ? `
          <dt>Scroll depth (this page)</dt>
          <dd>${scrollEvent.params.depth}%</dd>
        ` : ''}
        ${attentionEvent ? `
          <dt>Active reading time</dt>
          <dd>${formatMs(attentionEvent.params.ms)}</dd>
        ` : ''}
        ${customEvents.length ? `
          <dt>Events queued</dt>
          <dd>${customEvents.map(e => e.id).join(', ')}</dd>
        ` : ''}
      </dl>
    `;
  }
}

function formatMs(ms) {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

customElements.define('analytics-panel', AnalyticsPanel);
export { AnalyticsPanel };
```

---

## Compliance Architecture

The system's compliance properties are architectural, not policy-level. Each is built into the data flow:

| Concern | Mechanism |
|---------|-----------|
| No personal data stored | IP discarded in transit. Daily hash discarded after uniqueness check. UA string stored only as parsed browser/platform fields. |
| No cross-session tracking | Session counter uses `sessionStorage` (tab-scoped). Daily hash expires at midnight via salt rotation. |
| No cross-site tracking | Hash salt includes site ID. A hash from site A cannot be correlated with site B. |
| User transparency | `<analytics-panel>` renders all device-side data in plain language. No JSON dumps. |
| User control | "Clear my data" button wipes `sessionStorage` and calls `/analytics/forget`. "Pause analytics" sets `vb_optout` in `sessionStorage` and stops all collection. |
| DNT / GPC signals | Checked on every page load. If set, collection stops entirely. |
| Data minimisation | Server stores only what appears in the dashboard. No raw events table. |
| Layer 0 strengthens CNIL | Zero-JS counting produces no client-side state at all — no sessionStorage, no scripts — further strengthening the CNIL exemption case. |
| Author privacy control | `data-vb-no-track` allows page authors to exclude sensitive sections from analytics without modifying the analytics configuration. |
| Modular opt-in | Web Vitals and error tracking are separate scripts. Sites that don't load them collect no performance or error data. Minimises data collection to what the site owner explicitly requests. |
| CNIL exemption alignment | First-party only, no cross-site correlation, country-level geo only, aggregate output, session-scoped. Meets all six CNIL conditions for analytics without consent. |

### Consent Signal Priority Order

The `isOptedOut()` function checks signals in this priority order:

1. **`sessionStorage` opt-out** (`vb_optout === '1'`) — explicit user action via `<analytics-panel>`
2. **Global Privacy Control** (`navigator.globalPrivacyControl === true`) — browser-level signal
3. **Do Not Track** (`navigator.doNotTrack === '1'`) — legacy but still respected
4. **App consent function** (`window.appConsent?.analytics`) — site-level consent gate

If any signal indicates opt-out, all collection stops. No fallback, no degraded mode.

### Privacy Policy Disclosure

Your privacy policy should describe the analytics system in plain language. Minimum disclosure:

> **Analytics:** This site uses its own analytics system. We count page views, referrers, and general usage patterns. We do not use cookies. We do not store your IP address. We cannot identify you individually. You can view what is stored on your device and clear it at any time from the Data section of site settings. Data is cleared automatically when you close your browser tab.

---

## Phased Roadmap

### Phase 1 — Core Script

1. Publish `vb-analytics.js` (<1.5 KB gzipped).
2. Page view beacon with taxonomy, SPA debounce, opt-out checks.
3. Declarative `data-vb-event` delegation handler.
4. `data-vb-no-track` exclusion.
5. `instrumentLinks()` with `ping` + `sendBeacon` fallback.

### Phase 2 — Declarative Events and Buffer

1. Deploy `vb-analytics-events.js` (Layer 4 buffer).
2. Wire **Tier 1 high-value events** via `analytics-init.js`.
3. Wire **Tier 2 medium-value events**.
4. Deploy `<analytics-panel>` component and integrate with `<settings-panel>`.
5. Add consent policy hooks and GPC/DNT support.
6. Add dedupe strategy for combined `ping` + JS click tracking.

### Phase 3 — Observability Modules

1. Deploy `vb-analytics-vitals.js` (LCP, CLS, INP, TTFB).
2. Deploy `vb-analytics-errors.js` (runtime errors, unhandled rejections).
3. Add URL masking configuration.
4. Wire **Tier 3 error and performance events**.

### Phase 4 — Server Infrastructure

1. Deploy ingest handler (`ingest.js`, endpoints).
2. Deploy bot classifier and log processor.
3. Set up SQLite schema and daily salt rotation.
4. Deploy honeypot trap.
5. See [analytics-backend-spec.md](analytics-backend-spec.md) for full server-side roadmap.

### Phase 5 — Ecosystem and Adapters

1. Add adapters for common analytics backends (PostHog, Plausible, custom endpoint) without hard dependency.
2. Add documented schema versioning and migration policy.
3. Deploy dashboard query layer and admin reporting.
4. Publish analytics spec in VB documentation.

---

## Key Files Referenced

### Existing VB files

- `11ty-site/src/pages/docs/attributes/ping.njk` — ping attribute documentation
- `11ty-site/src/pages/docs/attributes/referrerpolicy.njk` — referrer policy docs
- `11ty-site/src/_includes/layouts/base.njk` — base layout template
- `11ty-site/src/_includes/partials/head.njk` — head partial
- `src/main.js` — main JS entry point
- `src/main-core.js` — core module loader
- `src/main-autoload.js` — autoload module
- `src/lib/theme-manager.js` — theme manager (analytics init after this)
- `src/lib/wizard.js` — wizard component (emits analytics events)
- `src/lib/form-validation.js` — form validation (emits `vb:submit`)
- `src/web-components/data-table/logic.js` — data table (emits sort/filter/page events)
- `src/web-components/settings-panel.js` — settings panel component

### New files — client (this spec)

- `analytics/client/vb-analytics.js` — Core: page views, opt-out, SPA, declarative events (<1.5 KB)
- `analytics/client/vb-analytics-events.js` — Opt-in: sessionStorage event buffer (<1 KB)
- `analytics/client/vb-analytics-vitals.js` — Opt-in: Web Vitals (LCP, CLS, INP, TTFB) (<0.8 KB)
- `analytics/client/vb-analytics-errors.js` — Opt-in: error tracking (<0.5 KB)
- `analytics/client/analytics-panel.js` — `<analytics-panel>` web component
- `src/lib/analytics.js` — `Analytics.init/track/flush` API
- `src/utils/analytics-init.js` — auto-wiring for VB custom events

### New files — server (companion spec)

See [analytics-backend-spec.md](analytics-backend-spec.md#module-map) for the server-side module map.

---

*Vanilla Breeze Analytics System — Client Specification v0.3.0. February 2026.*
*Companion: [analytics-backend-spec.md](analytics-backend-spec.md) (server-side specification).*
*Supersedes: analytics.md (architecture blueprint), analytics-part2.md (design spec).*
