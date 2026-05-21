---
title: Vanilla Breeze Analytics — Backend Specification
description: >
  Server-side infrastructure for the VB analytics system on Cloudflare Pages.
  Covers Pages Functions ingest endpoints, D1 schema, visitor uniqueness,
  Workers Analytics Engine, bot intelligence, and dashboard queries.
  nginx + SQLite variant retained as reference for self-hosted deployments.
date: 2026-04-17
status: ready-for-implementation
version: 0.4.0
deployment-target: cloudflare-pages
companion:
  - analytics-spec.md
  - analytics-master.md
tags:
  - analytics
  - backend
  - privacy
  - vanilla-breeze
  - cloudflare
---

# Vanilla Breeze Analytics — Backend Specification

Server-side companion to the [client-side analytics spec](analytics-spec.md). This document covers the VB-owned ingest: HTTP endpoints, visitor uniqueness hashing, request telemetry, bot intelligence, the data schema, and dashboard queries.

**Implementation phase:** Phase 4 of the [client spec roadmap](analytics-spec.md#phased-roadmap). The client core (Phases 1–3) can operate independently — beacons fire to any endpoint that returns `204`. This spec defines the canonical VB backend for those beacons.

> **v0.4 — architectural pivot.** VB now deploys to **Cloudflare Pages**, not a traditional nginx origin. This revision promotes **Cloudflare Pages Functions + D1 (+ optional Workers Analytics Engine)** to the canonical backend. The original nginx + SQLite + Node ingest design is retained as the *self-hosted reference* alternative. Core privacy, hashing, and compliance logic are unchanged — only the hosting surface differs.

> **Basic Auth gate note.** `functions/_middleware.js` currently enforces HTTP Basic Auth across the whole site. Ingest endpoints added under `functions/api/analytics/*` must either (a) be exempted from the middleware, (b) use a shared-secret header instead, or (c) accept that beacons will `401` while the site stays pre-release. Pick one explicitly before shipping Phase 4. See [Basic Auth Compatibility](#basic-auth-compatibility).

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Basic Auth Compatibility](#basic-auth-compatibility)
- [Ingest Handler (Pages Functions)](#ingest-handler-pages-functions)
- [Daily Hash and Visitor Uniqueness](#daily-hash-and-visitor-uniqueness)
- [Layer 0 — HTTP Header Counting](#layer-0--http-header-counting)
- [Layer 1 — Request Telemetry on Cloudflare](#layer-1--request-telemetry-on-cloudflare)
- [Bot Intelligence System](#bot-intelligence-system)
- [Server Configuration (nginx reference only)](#server-configuration-nginx-reference-only)
- [Data Schema](#data-schema)
- [D1 Compatibility Notes](#d1-compatibility-notes)
- [Dashboard Query Reference](#dashboard-query-reference)
- [Storage Engine Considerations](#storage-engine-considerations)
- [Module Map](#module-map)

---

## Architecture Overview

**Canonical target — Cloudflare Pages:**

```
┌──────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE PAGES                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Static asset host (built by GitHub Actions)           │  │
│  │  · site/ content served at the edge                    │  │
│  │  · Accept-CH headers set via _headers file             │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  functions/_middleware.js (Basic Auth gate)            │  │
│  │  · currently wraps every request                       │  │
│  │  · must bypass /api/analytics/* for Phase 4            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Pages Functions                                       │  │
│  │                                                        │  │
│  │  functions/api/analytics/hit.js     ← page views       │  │
│  │  functions/api/analytics/events.js  ← buffered events  │  │
│  │  functions/api/analytics/click.js   ← ping + beacon    │  │
│  │                                                        │  │
│  │  · request.cf.country / .botManagement (free)          │  │
│  │  · request.headers (Client Hints)                      │  │
│  │  · Daily hash → is_unique (hash discarded)             │  │
│  │  · Write to D1 and/or Analytics Engine                 │  │
│  └──────────┬───────────────────────┬─────────────────────┘  │
│             │                       │                        │
│             ▼                       ▼                        │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │  D1 (SQLite)     │    │  Workers Analytics Engine    │   │
│  │  hits · events   │    │  (optional, high-cardinality │   │
│  │  clicks · bot_log│    │   request telemetry)         │   │
│  │  daily_salts     │    │                              │   │
│  └──────────────────┘    └──────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Scheduled Worker (cron)                               │  │
│  │  · rotate daily_salts at UTC midnight                  │  │
│  │  · optional: Logpush → R2 processing                   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Reference alternative — self-hosted nginx + SQLite:**

```
┌─────────────────────────────────────────────────────────────┐
│                     ORIGIN SERVER                           │
│                                                             │
│  nginx reverse proxy                                        │
│    · JSON structured access logs (Client Hints)             │
│    · Layer 0: Last-Modified/If-Modified-Since counting      │
│    · Honeypot trap location (/~trap/)                       │
│        │                                                    │
│        ▼                                                    │
│  Ingest Handler (Node/Deno/Bun)                             │
│    · Parse Client Hints headers                             │
│    · Geo-IP → country code (IP discarded)                   │
│    · Daily hash → is_unique (hash discarded)                │
│        │                                                    │
│        ▼                                                    │
│  Log Processor (cron)                                       │
│    · Reads nginx JSON access logs                           │
│    · Classifies bot vs human traffic                        │
│        │                                                    │
│        ▼                                                    │
│  SQLite (primary) / PostgreSQL (optional)                   │
└─────────────────────────────────────────────────────────────┘
```

The self-hosted variant is documented in [Server Configuration (nginx reference only)](#server-configuration-nginx-reference-only). The rest of this spec assumes Cloudflare Pages unless noted.

---

## Basic Auth Compatibility

The existing `functions/_middleware.js` authenticates every request with HTTP Basic Auth while vanilla-breeze.com is pre-release. Analytics ingest routes need one of these resolutions before Phase 4 ships:

1. **Exempt `/api/analytics/*` from the middleware.** Update `_middleware.js` to call `next()` immediately when `new URL(request.url).pathname.startsWith('/api/analytics/')`. Gives pre-release telemetry with minimal code change. Accepts that a public-facing ingest surface exists while the site itself is gated.
2. **Shared-secret header.** Middleware requires either Basic Auth credentials **or** a `X-VB-Analytics: <token>` header on `/api/analytics/*`. Client injects the token via `data-token` on the analytics script. Slightly more protection against internet-scale beacon spam, but the token is visible in HTML source.
3. **Defer ingest until the gate is removed.** Ship Phases 1–3 against a dummy endpoint (e.g., a Cloudflare Worker that `204`s everything, or `localhost` in dev). Turn on real ingest the same commit that removes the Basic Auth gate. Cleanest, zero incremental surface area.

**Recommended:** Option 1 for pre-release visibility; revisit at launch. Decision should be captured in a beads issue alongside the Phase 4 implementation.

---

## Ingest Handler (Pages Functions)

All endpoints live on the same domain as the site under `/api/analytics/*` — Cloudflare Pages resolves these to files under `functions/api/analytics/`. All return `204 No Content` on success.

### Endpoints

| Method | Path | Source | File | Purpose |
|--------|------|--------|------|---------|
| `POST` | `/api/analytics/hit` | JS beacon | `functions/api/analytics/hit.js` | Page view with taxonomy |
| `POST` | `/api/analytics/events` | JS buffer | `functions/api/analytics/events.js` | Batched events (scroll, attention, custom) |
| `POST` | `/api/analytics/click` | `ping` + beacon | `functions/api/analytics/click.js` | Outbound link click |

> **`/analytics/forget` is deferred.** Per the master brief: an aggregate-only system has no per-session record to delete, so the endpoint exposes an action with no meaningful effect. Revisit once optional session-token mode exists.

### Pages Function shape

Each endpoint exports `onRequestPost`. Cloudflare binds D1 and (optional) Analytics Engine via the Pages project configuration:

```javascript
// functions/api/analytics/hit.js
export async function onRequestPost({ request, env, waitUntil }) {
  const body = await request.json().catch(() => null);
  if (!body) return new Response(null, { status: 400 });

  const country = request.cf?.country ?? 'XX';
  const ua      = request.headers.get('user-agent') ?? '';
  const ip      = request.headers.get('cf-connecting-ip') ?? '';

  // Daily hash — computed, used for uniqueness, then discarded.
  const isUnique = await checkUnique(env, body.s, ip, ua, body.w ?? 0);

  waitUntil(env.DB.prepare(`
    INSERT INTO hits (site_id, path, referrer, country, is_unique,
                      persona, activity, topic, content, stage, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
  `).bind(
    body.s, body.p, body.r ?? '', country, isUnique ? 1 : 0,
    body.taxonomy?.persona ?? null,
    body.taxonomy?.activity ?? null,
    body.taxonomy?.topic ?? null,
    body.taxonomy?.content ?? null,
    body.taxonomy?.stage ?? null,
    Date.now()
  ).run());

  // Optional: write a data point to Analytics Engine for high-cardinality dashboards
  env.ANALYTICS?.writeDataPoint({
    blobs: [body.s, body.p, country],
    indexes: [body.s],
    doubles: [1],
  });

  return new Response(null, { status: 204 });
}
```

**Bindings required in the Pages project:**

| Binding | Type | Purpose |
|---|---|---|
| `DB` | D1 | Primary store (hits, events, clicks, bot_log, daily_salts) |
| `ANALYTICS` | Analytics Engine | Optional high-cardinality request telemetry |
| `SALT_KV` | KV (optional) | If rotating salts via Worker cron; otherwise store in `daily_salts` D1 table |

### `/api/analytics/hit` — Page View

**Request body:**

```json
{
  "s":  "mysite",
  "p":  "/docs/container-queries",
  "r":  "https://css-tricks.com",
  "w":  1440,
  "t":  1823,
  "u":  1,
  "taxonomy": {
    "persona": "developer",
    "activity": "learning",
    "topic": "css",
    "content": "tutorial",
    "stage": "consideration"
  }
}
```

**Function processing:**

1. Read Client Hints headers from the request (`Sec-CH-UA`, `Sec-CH-UA-Mobile`, `Sec-CH-UA-Platform`).
2. Read `request.cf.country` for geo — no MaxMind, IP never leaves Cloudflare.
3. Daily hash (`SHA-256(ip + ua + siteId + dailySalt)`) → check against D1 `daily_uniques` row or KV key → `is_unique` flag → **discard hash**.
4. Extract taxonomy fields.
5. `INSERT INTO hits` via D1 prepared statement — raw event never stored, only derived aggregate columns.
6. Optionally `env.ANALYTICS.writeDataPoint(...)` for the high-cardinality request-telemetry view.
7. Return `204`.

### `/api/analytics/click` — Outbound Link Click

Handles both browser `ping` POSTs (`Content-Type: text/ping`) and `sendBeacon` fallback POSTs (`Content-Type: application/json`).

```javascript
// functions/api/analytics/click.js
export async function onRequestPost({ request, env, waitUntil }) {
  const contentType = request.headers.get('content-type') ?? '';

  let site, fromPage, toDomain;

  if (contentType.startsWith('text/ping')) {
    const pingFrom = request.headers.get('ping-from');
    const pingTo   = request.headers.get('ping-to');
    const url      = new URL(request.url);
    site     = url.searchParams.get('site') || 'default';
    fromPage = sanitizePath(url.searchParams.get('page') || pingFrom);
    toDomain = extractDomain(pingTo);
  } else if (contentType.startsWith('application/json')) {
    const body = await request.json().catch(() => null);
    if (!body) return new Response(null, { status: 400 });
    site     = body.s || 'default';
    fromPage = sanitizePath(body.from);
    toDomain = body.to;
  } else {
    return new Response(null, { status: 400 });
  }

  waitUntil(env.DB.prepare(
    `INSERT INTO clicks (site_id, from_page, to_domain, created_at)
     VALUES (?1, ?2, ?3, ?4)`
  ).bind(site, fromPage, toDomain, Date.now()).run());

  return new Response(null, { status: 204 });
}
```

> **Dedupe.** Browser `ping` and the `sendBeacon` fallback both fire for Firefox/Brave. Dedupe at query time using `(site_id, from_page, to_domain, time_bucket)` rather than at write time — D1 writes are cheap, and query-time dedupe avoids racy transactions across Workers.

### `/analytics/forget` — Deferred

**Deferred per master brief.** A pure aggregate system has no per-session record to delete: no session ID was ever stored, the daily hash was discarded, and the IP never landed in durable storage. The endpoint adds a surface with no meaningful effect, so it is not included in v0.4. If session-token mode is added later to support per-user erasure, reintroduce the endpoint with real semantics.

---

## Daily Hash and Visitor Uniqueness

The system uses a three-approach gradient for visitor identification, from zero-JS to full-featured. No approach stores a persistent identifier.

### Approach 1 — Last-Modified Header Counting (Layer 0)

Zero-JavaScript visit counting via HTTP conditional requests. See [Layer 0](#layer-0--http-header-counting) below.

### Approach 2 — Referrer-Based Unique Detection

Inspired by Simple Analytics. A visitor arriving with a referrer that is not the site itself is likely unique. A visitor with `document.referrer` matching the current site is a same-session navigation.

```javascript
// In ingest handler — lightweight unique signal
function isLikelyUnique(referrer, siteHost) {
  if (!referrer) return true; // direct visit → likely unique
  try {
    const ref = new URL(referrer);
    return ref.hostname !== siteHost; // external referrer → unique
  } catch {
    return true;
  }
}
```

This is a heuristic, not an exact count. It undercounts returning visitors who always arrive via external links and overcounts tab-restores. Used as a supplementary signal alongside the daily hash.

### Approach 3 — Two-Level Daily Hash (Primary)

Inspired by Fathom's daily hash with OpenPanel's screen-width input for additional entropy without adding identifiability. **Cloudflare Workers are stateless across invocations**, so the reference-nginx in-memory Set becomes a D1 table (or a KV namespace with daily expiry).

```javascript
// functions/_lib/daily-hash.js

async function sha256Hex(input) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getDailySalt(env) {
  const today = new Date().toISOString().slice(0, 10);
  const row = await env.DB.prepare('SELECT salt FROM daily_salts WHERE day = ?1').bind(today).first();
  if (row?.salt) return row.salt;

  // Salt not yet created today — generate and insert. Use INSERT OR IGNORE
  // so concurrent Workers don't race to write duplicate salts.
  const salt = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT OR IGNORE INTO daily_salts (day, salt) VALUES (?1, ?2)'
  ).bind(today, salt).run();

  // Read back — if another Worker won the race, its salt is authoritative.
  const confirmed = await env.DB.prepare('SELECT salt FROM daily_salts WHERE day = ?1').bind(today).first();
  return confirmed.salt;
}

/**
 * Two-level daily hash for unique visitor detection.
 *
 * Level 1: SHA-256(ip + ua + siteId + dailySalt)
 *   → identifies a unique browser session for the day
 *
 * Level 2: SHA-256(level1Hash + screenWidth)
 *   → adds entropy from screen width (OpenPanel pattern) without
 *     being individually identifying. Screen width is one of ~20
 *     common values, so it refines uniqueness without creating a
 *     fingerprint.
 *
 * The hash is checked against the daily_uniques D1 table (or a
 * KV namespace with TTL), used to set is_unique=1 on the first
 * hit, then discarded. Neither the hash nor its inputs are stored
 * long-term — daily_uniques is truncated at salt rotation.
 */
export async function checkUnique(env, siteId, ip, ua, screenWidth) {
  const salt = await getDailySalt(env);
  const level1 = await sha256Hex(`${ip}|${ua}|${siteId}|${salt}`);
  const level2 = await sha256Hex(`${level1}|${screenWidth || 0}`);

  // INSERT OR IGNORE returns a non-zero rowsAffected only if the hash
  // was not already seen today. That's our "first hit" signal.
  const result = await env.DB.prepare(
    'INSERT OR IGNORE INTO daily_uniques (day_hash) VALUES (?1)'
  ).bind(level2).run();

  return result.meta.changes > 0;
}
```

**Salt rotation.** A scheduled Worker triggers at UTC midnight, deletes `daily_salts` and `daily_uniques` rows older than N days (default 2), and lets the next request seed the new day's salt on demand. See `functions/_scheduled/rotate-salts.js` in the module map.

**Privacy guarantees:**

- Salt rotates daily — yesterday's hashes cannot be recomputed
- Salt is per-site — no cross-site correlation
- Hash is checked and discarded — never written to disk
- Screen width adds ~4 bits of entropy without being a fingerprint (only ~20 common values exist)

---

## Layer 0 — HTTP Header Counting

Zero-JavaScript visit counting using Cabin's `Last-Modified` / `If-Modified-Since` pattern. The most privacy-friendly layer: no scripts, no cookies, no client-side state.

### On Cloudflare Pages

Implement as a **catch-all Pages Function** that wraps HTML responses. The Function sets `Last-Modified` to UTC midnight, reads `If-Modified-Since` from the incoming request, and writes one data point per request into D1 (or Analytics Engine) before chaining to the static asset response. Cloudflare's edge cache honors `Last-Modified` but must be told **not** to strip the conditional request — set `Cache-Control: private, must-revalidate` on HTML so the Function sees each hit.

```javascript
// functions/_middleware-layer0.js — chain AFTER the auth middleware
export async function onRequest({ request, next, env, waitUntil }) {
  const url = new URL(request.url);
  // Only instrument HTML pages
  if (!isHtmlPath(url.pathname)) return next();

  const ims     = request.headers.get('if-modified-since');
  const returns = !!ims; // returning visitor within today's Last-Modified window

  waitUntil(env.DB.prepare(
    `INSERT INTO layer0_hits (site_id, path, is_returning, created_at)
     VALUES (?1, ?2, ?3, ?4)`
  ).bind('default', sanitizePath(url.pathname), returns ? 1 : 0, Date.now()).run());

  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('Last-Modified', utcMidnight());
  headers.set('Cache-Control', 'private, must-revalidate');
  return new Response(response.body, { status: response.status, headers });
}

function utcMidnight() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toUTCString();
}
```

### On nginx (reference only)

### How It Works

1. **Server sets `Last-Modified` on the page response** to midnight of the current day
2. **On first visit**, browser has no `If-Modified-Since` → server counts a visit, returns `200`
3. **On subsequent visits** (same day), browser sends `If-Modified-Since` → server counts a returning visit or returns `304` depending on configuration
4. The difference between requests with and without `If-Modified-Since` gives a rough unique visitor count

### nginx Implementation

```nginx
# Layer 0: HTTP header visit counting
# Sets Last-Modified to midnight of the current day.
# Increments by 1 second per page request to create a monotonic counter.

map $request_uri $is_page_request {
  default                    0;
  ~*\.(css|js|png|jpg|svg)$  0;
  ~^/analytics/              0;
  ~^/~trap/                  0;
  ~^/                        1;
}

# Log whether the request included If-Modified-Since
# (indicates returning visitor within the Last-Modified window)
log_format vb_layer0 escape=json
  '{'
    '"ts":$msec,'
    '"uri":"$request_uri",'
    '"ims":"$http_if_modified_since",'
    '"status":$status'
  '}';
```

### Counting Logic

```javascript
// In log processor: count Layer 0 signals
function processLayer0Entry(entry) {
  if (!entry.uri || entry.uri.match(/\.(css|js|png|jpg|svg|woff2?)(\?|$)/i)) return;

  const hasIMS = !!entry.ims; // If-Modified-Since present → returning visitor

  return {
    path: sanitizePath(entry.uri),
    isNewVisitor: !hasIMS,
    isReturning: hasIMS,
    ts: Math.round(entry.ts),
  };
}
```

### Limitations

- Browsers may cache aggressively or strip `If-Modified-Since` (privacy browsers)
- Cannot distinguish between different visitors — only "new today" vs "returning today"
- Granularity is limited to daily windows
- Best used as a baseline floor count, supplemented by Layer 1+ signals

### Bounce Detection

A single page load with no subsequent requests (no `If-Modified-Since` on later pages) indicates a bounce. The log processor can detect this by grouping requests by IP hash within a short time window.

---

## Layer 1 — Request Telemetry on Cloudflare

Replaces the nginx log processor with edge-native primitives. Runs on every HTTP request, independent of the JS beacon, and captures visitors who never load JavaScript (bots, no-JS, strict privacy browsers).

### Primary — Workers Analytics Engine

Workers Analytics Engine is Cloudflare's high-cardinality time-series store. A catch-all Pages Function writes one data point per HTML request with `request.cf` data (country, bot management, HTTP version) and parsed Client Hints:

```javascript
// functions/_middleware-telemetry.js
export async function onRequest({ request, next, env, waitUntil }) {
  const url = new URL(request.url);
  if (!isHtmlPath(url.pathname)) return next();

  const cf   = request.cf ?? {};
  const bot  = cf.botManagement?.score ?? null;
  const hint = {
    ua:       request.headers.get('sec-ch-ua') ?? '',
    mobile:   request.headers.get('sec-ch-ua-mobile') === '?1' ? 1 : 0,
    platform: request.headers.get('sec-ch-ua-platform') ?? '',
  };

  env.ANALYTICS?.writeDataPoint({
    blobs:   ['default', url.pathname, cf.country ?? 'XX', hint.platform, hint.ua],
    indexes: ['default'],
    doubles: [bot ?? -1, hint.mobile],
  });

  return next();
}
```

Analytics Engine queries are SQL-like and support high-cardinality aggregation without per-row billing, making them ideal for the dashboard query layer.

### Optional — Cloudflare Logpush to R2

For deeper bot analysis or cold-storage compliance, enable Cloudflare Logpush (available on paid plans) to stream raw request logs to an R2 bucket. A scheduled Worker reads new Logpush batches from R2 and runs the existing bot classifier for backfilled analytics. Not required for core telemetry.

### `Accept-CH` opt-in

Set `Accept-CH` on HTML responses via the `_headers` file so Chromium browsers send high-entropy Client Hints on subsequent requests:

```
# site/_headers (Pages convention)
/*
  Accept-CH: Sec-CH-UA, Sec-CH-UA-Platform, Sec-CH-UA-Mobile, Sec-CH-Viewport-Width, Sec-CH-DPR, Sec-CH-Prefers-Color-Scheme
```

---

## Server Configuration (nginx reference only)

> **Reference only.** The sections below describe the self-hosted nginx + log-processor design. On Cloudflare Pages, use [Layer 1 — Request Telemetry on Cloudflare](#layer-1--request-telemetry-on-cloudflare) instead.

### nginx Configuration

Structured JSON log format with Client Hints headers:

```nginx
# /etc/nginx/conf.d/analytics-log.conf

log_format vb_analytics escape=json
  '{'
    '"ts":$msec,'
    '"method":"$request_method",'
    '"uri":"$request_uri",'
    '"status":$status,'
    '"bytes":$body_bytes_sent,'
    '"ref":"$http_referer",'
    '"ua":"$http_user_agent",'
    '"host":"$host",'
    '"proto":"$server_protocol",'
    '"rt":"$request_time",'
    # Client Hints — low entropy, sent automatically by Chromium
    '"ch_ua":"$http_sec_ch_ua",'
    '"ch_mobile":"$http_sec_ch_ua_mobile",'
    '"ch_platform":"$http_sec_ch_ua_platform",'
    # Client Hints — high entropy, sent after Accept-CH opt-in
    '"ch_platform_ver":"$http_sec_ch_ua_platform_version",'
    '"ch_model":"$http_sec_ch_ua_model",'
    '"ch_viewport_w":"$http_sec_ch_viewport_width",'
    '"ch_dpr":"$http_sec_ch_dpr",'
    '"ch_color_scheme":"$http_sec_ch_prefers_color_scheme",'
    '"ch_save_data":"$http_save_data"'
  '}';

server {
  # Opt-in to high-entropy Client Hints
  add_header Accept-CH
    "Sec-CH-UA-Full-Version-List, Sec-CH-UA-Platform-Version,
     Sec-CH-UA-Model, Sec-CH-Viewport-Width, Sec-CH-DPR,
     Sec-CH-Prefers-Color-Scheme"
    always;

  # Structured analytics log (separate from error log)
  access_log /var/log/nginx/vb-analytics.log vb_analytics;
}
```

### Log Processor

Run on a schedule (cron, every 5–15 minutes for near-real-time; hourly for most sites).

```javascript
// log-processor.js
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { classifyRequest } from './bot-classifier.js';
import { geoip } from './geoip.js';
import { parseClientHints, parseUserAgent } from './ua-parser.js';
import { db } from './db.js';

export async function processLogFile(logPath) {
  const rl = createInterface({ input: createReadStream(logPath) });

  for await (const line of rl) {
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }

    // Skip non-page requests (assets, health checks)
    if (shouldSkipUri(entry.uri)) continue;

    const classification = classifyRequest(entry.ua, entry.uri);

    if (classification.isBot) {
      await recordBotHit(entry, classification);
    } else {
      await recordLogHit(entry);
    }
  }
}

async function recordLogHit(entry) {
  const country = await geoip(extractIP(entry)); // IP used only for geo, then discarded
  const device  = parseClientHints(entry) ?? parseUserAgent(entry.ua);

  await db.run(`
    INSERT INTO log_hits (
      ts, path, referrer, status, bytes_sent, response_ms,
      country, browser, platform, is_mobile, viewport_w,
      color_scheme, save_data, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'log')
  `, [
    Math.round(entry.ts),
    sanitizePath(entry.uri),
    extractDomain(entry.ref),
    entry.status,
    entry.bytes,
    Math.round(entry.rt * 1000),
    country,
    device.browser,
    device.platform,
    device.isMobile ? 1 : 0,
    entry.ch_viewport_w ? parseInt(entry.ch_viewport_w) : null,
    entry.ch_color_scheme?.replace(/"/g, '') || null,
    entry.ch_save_data === 'on' ? 1 : 0,
  ]);
}

function shouldSkipUri(uri) {
  return /\.(css|js|png|jpg|webp|svg|woff2?|ico|map)(\?|$)/i.test(uri)
    || uri.startsWith('/analytics/')
    || uri === '/favicon.ico'
    || uri === '/robots.txt';
}
```

### Referrer-Based Unique Detection in Logs

Supplement log-layer hits with a referrer heuristic (Simple Analytics pattern). When a log entry has an external referrer, flag the hit as likely unique:

```javascript
async function recordLogHit(entry) {
  // ... (geo, device parsing as above)

  const isLikelyUnique = !entry.ref
    || !entry.ref.includes(entry.host); // external referrer → likely new visitor

  await db.run(`
    INSERT INTO log_hits (
      /* ... columns ... */
      is_likely_unique
    ) VALUES (/* ... */, ?)
  `, [
    /* ... values ... */
    isLikelyUnique ? 1 : 0,
  ]);
}
```

---

## Bot Intelligence System

Bot detection and classification is the most analytically valuable feature of the log layer. All classification happens server-side. The JS layer never fires for bots that don't execute JavaScript (which is most of them).

### Bot Taxonomy

```javascript
// bot-classifier.js

/**
 * Three-tier bot taxonomy:
 * - search: traditional search engine crawlers (valuable for SEO)
 * - ai-training: bulk content scrapers for LLM training datasets
 * - ai-assistant: real-time fetchers triggered by user AI queries
 * - monitoring: synthetic uptime and performance tools
 * - generic: other automated traffic (libraries, scripts, no-UA)
 * - spoofed: claims to be a browser but behaves like a bot
 */

const BOT_PATTERNS = {
  search: /Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|Yandex|
           Applebot(?!-Extended)|LinkedInBot/ix,

  aiTraining: /GPTBot|OAI-SearchBot|ClaudeBot|anthropic-ai|Claude-Web|
               CCBot|Bytespider|Amazonbot|Google-Extended|GoogleOther|
               Applebot-Extended|meta-externalagent|meta-externalfetcher|
               cohere-ai|cohere-training-data-crawler|PerplexityBot|
               FacebookBot|DuckAssistBot|YouBot|Timpibot|PanguBot|
               AI2Bot|Diffbot|Omgilibot|omgili/ix,

  aiAssistant: /ChatGPT-User|Claude-User|Claude-SearchBot|Perplexity-User|
                Gemini-User/ix,

  monitoring: /UptimeRobot|Pingdom|StatusCake|DatadogSynthetics|
               NewRelicSynth|Checkly|GTmetrix|PageSpeed/ix,

  generic: /curl|wget|python-requests|python-urllib|libwww-perl|
            Go-http-client|Java\/|okhttp|axios|node-fetch|
            Scrapy|Mechanize|^-?$/ix,
};

/**
 * Classify an HTTP request as bot or human.
 * @param {string} ua - User-Agent header value
 * @param {string} uri - Request URI
 * @returns {{ isBot: boolean, botType: string|null, botName: string|null }}
 */
export function classifyRequest(ua, uri) {
  if (!ua || ua.trim() === '') {
    return { isBot: true, botType: 'generic', botName: 'no-ua' };
  }

  for (const [type, pattern] of Object.entries(BOT_PATTERNS)) {
    if (pattern.test(ua)) {
      const botName = extractBotName(ua, type);
      return { isBot: true, botType: type, botName };
    }
  }

  return { isBot: false, botType: null, botName: null };
}

function extractBotName(ua, type) {
  const matchers = {
    aiTraining:   /GPTBot|ClaudeBot|CCBot|Bytespider|Amazonbot|Google-Extended|
                  PerplexityBot|Diffbot|AI2Bot|cohere-ai|Applebot-Extended/i,
    aiAssistant:  /ChatGPT-User|Claude-User|Claude-SearchBot|Perplexity-User/i,
    search:       /Googlebot|Bingbot|DuckDuckBot|Applebot/i,
    monitoring:   /UptimeRobot|Pingdom|StatusCake|GTmetrix/i,
  };
  const m = matchers[type]?.exec(ua);
  return m ? m[0] : type;
}
```

### Honeypot Trap

A hidden link no real user visits. Any request to the honeypot URL is definitively a bot.

```html
<!-- In site layout — hidden from all users -->
<a href="/~trap/canary"
   style="position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;"
   tabindex="-1"
   aria-hidden="true">.
</a>
```

```javascript
// Server: mark any IP that hits the honeypot
if (req.path.startsWith('/~trap/')) {
  const ip = getClientIP(req);
  await db.run(
    'INSERT OR REPLACE INTO honeypot_ips (ip_hash, seen_at) VALUES (?, ?)',
    [await sha256(ip + DAILY_SALT), Date.now()]
  );
  return new Response(null, { status: 404 });
}
```

### Bot Recording

```javascript
async function recordBotHit(entry, classification) {
  await db.run(`
    INSERT INTO bot_log (
      ts, path, bot_type, bot_name, ua_snippet,
      status, bytes_sent, response_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    Math.round(entry.ts),
    sanitizePath(entry.uri),
    classification.botType,
    classification.botName,
    entry.ua?.slice(0, 120),   // truncate — we don't need the full string
    entry.status,
    entry.bytes,
    Math.round(entry.rt * 1000),
  ]);
}
```

---

## Server Configuration

### Full nginx Server Block

```nginx
server {
  listen 443 ssl http2;
  server_name yoursite.com;

  # Analytics log (structured JSON + Client Hints)
  include /etc/nginx/conf.d/analytics-log.conf;

  # Accept-CH for high-entropy Client Hints
  add_header Accept-CH
    "Sec-CH-UA-Full-Version-List, Sec-CH-UA-Platform-Version,
     Sec-CH-UA-Model, Sec-CH-Viewport-Width, Sec-CH-DPR,
     Sec-CH-Prefers-Color-Scheme"
    always;

  # Analytics ingest — pass to Node/Deno/Bun backend
  location /analytics/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header X-Real-IP        $remote_addr;
    proxy_set_header X-Forwarded-For  $proxy_add_x_forwarded_for;
    proxy_set_header Sec-CH-UA        $http_sec_ch_ua;
    proxy_set_header Sec-CH-UA-Mobile $http_sec_ch_ua_mobile;
    proxy_set_header Sec-CH-UA-Platform $http_sec_ch_ua_platform;

    # CORS — same origin only
    add_header Access-Control-Allow-Origin $host;
  }

  # Honeypot trap — anything here is a bot
  location /~trap/ {
    proxy_pass http://127.0.0.1:3001/honeypot;
  }
}
```

### Cron Jobs

```cron
# Process analytics logs every 10 minutes
*/10 * * * * node /srv/analytics/log-processor.js >> /var/log/analytics-processor.log 2>&1

# Expire old honeypot IP hashes (24h TTL)
0 * * * * node /srv/analytics/honeypot-expire.js

# Daily salt rotation (midnight UTC)
0 0 * * * node /srv/analytics/rotate-salt.js
```

---

## Data Schema

### SQLite — Primary Database

```sql
-- Human page views (from JS beacon)
CREATE TABLE hits (
  id          INTEGER PRIMARY KEY,
  site_id     TEXT NOT NULL,
  path        TEXT NOT NULL,
  referrer    TEXT,
  screen_w    INTEGER,
  load_ms     INTEGER,
  country     TEXT(2),
  browser     TEXT,
  platform    TEXT,
  is_mobile   INTEGER DEFAULT 0,
  is_unique   INTEGER DEFAULT 0,   -- 1 if first visit today (hash-detected)
  color_scheme TEXT,               -- 'light' | 'dark' (from Client Hints)
  save_data   INTEGER DEFAULT 0,   -- 1 if Save-Data header present
  -- Taxonomy dimensions (from page <meta> tags)
  tx_persona  TEXT,
  tx_activity TEXT,
  tx_topic    TEXT,
  tx_content  TEXT,
  tx_stage    TEXT,
  tx_series   TEXT,
  -- Source
  source      TEXT DEFAULT 'js',   -- 'js' | 'log'
  created_at  INTEGER NOT NULL
);

CREATE INDEX idx_hits_site_time    ON hits (site_id, created_at DESC);
CREATE INDEX idx_hits_path         ON hits (site_id, path, created_at DESC);
CREATE INDEX idx_hits_persona      ON hits (site_id, tx_persona, created_at DESC);
CREATE INDEX idx_hits_activity     ON hits (site_id, tx_activity, created_at DESC);
CREATE INDEX idx_hits_series       ON hits (site_id, tx_series, created_at DESC);

-- Outbound link clicks (from ping + sendBeacon)
CREATE TABLE clicks (
  id          INTEGER PRIMARY KEY,
  site_id     TEXT NOT NULL,
  from_page   TEXT NOT NULL,
  to_domain   TEXT NOT NULL,
  -- Taxonomy of the page the click originated from
  tx_persona  TEXT,
  tx_activity TEXT,
  created_at  INTEGER NOT NULL
);

CREATE INDEX idx_clicks_site_time ON clicks (site_id, created_at DESC);

-- Buffered events (scroll depth, attention, custom)
CREATE TABLE events (
  id          INTEGER PRIMARY KEY,
  site_id     TEXT NOT NULL,
  path        TEXT NOT NULL,
  event_id    TEXT NOT NULL,   -- '__scroll' | '__attention' | custom name
  params      TEXT,            -- JSON
  tx_persona  TEXT,
  tx_activity TEXT,
  created_at  INTEGER NOT NULL
);

CREATE INDEX idx_events_site_path ON events (site_id, path, event_id, created_at DESC);

-- Bot traffic log (from server log processor)
CREATE TABLE bot_log (
  id          INTEGER PRIMARY KEY,
  path        TEXT NOT NULL,
  bot_type    TEXT NOT NULL,   -- 'aiTraining' | 'aiAssistant' | 'search' | 'monitoring' | 'generic'
  bot_name    TEXT,            -- 'GPTBot' | 'ClaudeBot' | 'Googlebot' etc
  ua_snippet  TEXT,            -- first 120 chars of UA for debugging
  status      INTEGER,
  bytes_sent  INTEGER,
  response_ms INTEGER,
  created_at  INTEGER NOT NULL
);

CREATE INDEX idx_bot_log_type_time ON bot_log (bot_type, created_at DESC);
CREATE INDEX idx_bot_log_name_time ON bot_log (bot_name, created_at DESC);

-- All log-layer human traffic (after bot filtering)
CREATE TABLE log_hits (
  id              INTEGER PRIMARY KEY,
  path            TEXT NOT NULL,
  referrer        TEXT,
  status          INTEGER,
  bytes_sent      INTEGER,
  response_ms     INTEGER,
  country         TEXT(2),
  browser         TEXT,
  platform        TEXT,
  is_mobile       INTEGER DEFAULT 0,
  is_likely_unique INTEGER DEFAULT 0,  -- referrer-based heuristic
  viewport_w      INTEGER,
  color_scheme    TEXT,
  save_data       INTEGER DEFAULT 0,
  created_at      INTEGER NOT NULL
);

CREATE INDEX idx_log_hits_path_time ON log_hits (path, created_at DESC);

-- Honeypot — IPs that hit the trap URL (hash only, never raw IP)
CREATE TABLE honeypot_ips (
  ip_hash     TEXT PRIMARY KEY,
  seen_at     INTEGER NOT NULL,
  hit_count   INTEGER DEFAULT 1
);

-- Daily salts for visitor hash rotation
CREATE TABLE daily_salts (
  day   TEXT PRIMARY KEY,  -- 'YYYY-MM-DD'
  salt  TEXT NOT NULL
);

-- Daily uniques — replaces the in-memory Set from the nginx reference.
-- A row here means this daily hash has been seen today. Truncated at salt rotation.
CREATE TABLE daily_uniques (
  day_hash  TEXT PRIMARY KEY
);

-- Layer 0 zero-JS hit counter (new for Cloudflare deployment)
CREATE TABLE layer0_hits (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id       TEXT NOT NULL,
  path          TEXT NOT NULL,
  is_returning  INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);
CREATE INDEX idx_layer0_site_created ON layer0_hits (site_id, created_at);
```

---

## D1 Compatibility Notes

The schema above targets SQLite syntax. Cloudflare **D1** is SQLite-compatible but differs in a few ways worth calling out before copying migrations over:

- **`AUTOINCREMENT` supported** — D1 accepts the `INTEGER PRIMARY KEY AUTOINCREMENT` form used throughout the schema. Omit it and D1 will still allocate rowids, but explicit AUTOINCREMENT guarantees monotonicity.
- **No extensions** — JSON1 (`json_extract`) is available, but FTS, R*Tree, and other loadable extensions are not. The "Content performance by series" query's `json_extract` calls will work; anything relying on FTS has to be rewritten.
- **Binding parameter style** — D1 prepared statements use `?1, ?2` positional binding (shown in the Function examples above), not the `?` style used by `better-sqlite3`.
- **Query size limits** — D1 rows are limited to ~1 MB; individual queries return up to 100 MB. Aggregate ingest is well within limits; bulk imports from R2 may need chunking.
- **`PRAGMA` support is restricted** — the `journal_mode`, `synchronous`, and `busy_timeout` tunings in the self-hosted reference are managed by Cloudflare and not settable by the Function.
- **Transactions** — D1 supports single-request transactions via `env.DB.batch([...statements])`. There is no cross-request `BEGIN; ... COMMIT;`.
- **Concurrency** — D1 serialises writes per database; the `INSERT OR IGNORE` + `SELECT` pattern used in `getDailySalt` is the correct way to race-safely seed daily rows.

Migrations are managed via `wrangler d1 migrations apply` (or the Pages equivalent once integrated). Each migration file should be idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`) so re-running the pipeline against a partially-migrated D1 never fails.

---

## Dashboard Query Reference

### Taxonomy — Persona Breakdown

```sql
-- Which personas are visiting, and what are they reading?
SELECT
  tx_persona,
  tx_activity,
  COUNT(*) AS views,
  SUM(is_unique) AS unique_visitors,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS share_pct
FROM hits
WHERE site_id = ?
  AND tx_persona IS NOT NULL
  AND created_at > ?
GROUP BY tx_persona, tx_activity
ORDER BY views DESC;
```

### Taxonomy — Content Performance by Series

```sql
-- Which content series get the most engagement?
SELECT
  tx_series,
  COUNT(DISTINCT path) AS pages_in_series,
  COUNT(*) AS total_views,
  ROUND(AVG(e.scroll_depth), 0) AS avg_scroll_pct,
  ROUND(AVG(e.attention_ms) / 1000.0, 0) AS avg_attention_s
FROM hits h
LEFT JOIN (
  SELECT path,
    MAX(CASE WHEN event_id = '__scroll' THEN CAST(json_extract(params, '$.depth') AS INTEGER) END) AS scroll_depth,
    MAX(CASE WHEN event_id = '__attention' THEN CAST(json_extract(params, '$.ms') AS INTEGER) END) AS attention_ms
  FROM events
  WHERE site_id = ?
  GROUP BY path
) e ON h.path = e.path
WHERE h.site_id = ?
  AND h.tx_series IS NOT NULL
GROUP BY tx_series
ORDER BY total_views DESC;
```

### Taxonomy — Visitor Journey by Stage

```sql
-- How are visitors distributed across the awareness/adoption journey?
SELECT
  tx_stage,
  COUNT(*) AS views,
  COUNT(DISTINCT path) AS pages,
  SUM(is_unique) AS unique_visitors
FROM hits
WHERE site_id = ? AND tx_stage IS NOT NULL AND created_at > ?
GROUP BY tx_stage
ORDER BY CASE tx_stage
  WHEN 'awareness'     THEN 1
  WHEN 'consideration' THEN 2
  WHEN 'adoption'      THEN 3
  WHEN 'mastery'       THEN 4
  ELSE 5
END;
```

### Core Metrics

```sql
-- Overview: today vs yesterday
SELECT
  SUM(CASE WHEN created_at > ? THEN 1 ELSE 0 END) AS today_views,
  SUM(CASE WHEN created_at > ? AND is_unique = 1 THEN 1 ELSE 0 END) AS today_uniques,
  SUM(CASE WHEN created_at BETWEEN ? AND ? THEN 1 ELSE 0 END) AS yesterday_views,
  SUM(CASE WHEN created_at BETWEEN ? AND ? AND is_unique = 1 THEN 1 ELSE 0 END) AS yesterday_uniques
FROM hits WHERE site_id = ?;

-- Top pages (last 30 days)
SELECT path, tx_persona, tx_content, COUNT(*) AS views, SUM(is_unique) AS uniques
FROM hits
WHERE site_id = ? AND created_at > ?
GROUP BY path
ORDER BY views DESC LIMIT 20;

-- Traffic sources
SELECT
  COALESCE(referrer, 'direct') AS source,
  COUNT(*) AS visits,
  SUM(is_unique) AS unique_visitors
FROM hits
WHERE site_id = ? AND created_at > ?
GROUP BY source
ORDER BY visits DESC;

-- Device breakdown
SELECT
  CASE WHEN is_mobile = 1 THEN 'mobile' ELSE 'desktop' END AS device,
  COUNT(*) AS views,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct
FROM hits WHERE site_id = ? AND created_at > ?
GROUP BY device;

-- Dark mode adoption
SELECT
  COALESCE(color_scheme, 'unknown') AS scheme,
  COUNT(*) AS visits
FROM hits WHERE site_id = ? AND created_at > ?
GROUP BY scheme;
```

### Bot Intelligence

```sql
-- What's crawling my site right now (last 24h)?
SELECT
  bot_name,
  bot_type,
  COUNT(*) AS requests,
  COUNT(DISTINCT path) AS unique_pages,
  ROUND(SUM(bytes_sent) / 1048576.0, 1) AS mb_served
FROM bot_log
WHERE ts > strftime('%s', 'now', '-1 day') * 1000
GROUP BY bot_name, bot_type
ORDER BY requests DESC;

-- AI training bots: which pages are they most interested in?
SELECT path, COUNT(*) AS crawls
FROM bot_log
WHERE bot_type = 'aiTraining'
  AND ts > strftime('%s', 'now', '-30 days') * 1000
GROUP BY path
ORDER BY crawls DESC
LIMIT 20;

-- Bot vs human traffic ratio by day
SELECT
  DATE(ts / 1000, 'unixepoch') AS day,
  SUM(CASE WHEN source = 'log' AND is_bot = 0 THEN 1 ELSE 0 END) AS human,
  SUM(CASE WHEN is_bot = 1 THEN 1 ELSE 0 END) AS bots,
  ROUND(
    100.0 * SUM(CASE WHEN is_bot = 1 THEN 1 ELSE 0 END) / COUNT(*), 1
  ) AS bot_pct
FROM (
  SELECT ts, 'log' AS source, 0 AS is_bot FROM log_hits
  UNION ALL
  SELECT ts, 'bot' AS source, 1 AS is_bot FROM bot_log
)
GROUP BY day
ORDER BY day DESC;

-- Today's bot summary
SELECT
  bot_type, bot_name, COUNT(*) AS requests,
  ROUND(SUM(bytes_sent) / 1048576.0, 1) AS mb_consumed
FROM bot_log
WHERE created_at > strftime('%s', 'now', 'start of day') * 1000
GROUP BY bot_type, bot_name
ORDER BY requests DESC;

-- AI bot trend (weekly)
SELECT
  strftime('%Y-W%W', created_at / 1000, 'unixepoch') AS week,
  SUM(CASE WHEN bot_type = 'aiTraining' THEN 1 ELSE 0 END) AS ai_training,
  SUM(CASE WHEN bot_type = 'aiAssistant' THEN 1 ELSE 0 END) AS ai_assistant,
  SUM(CASE WHEN bot_type = 'search' THEN 1 ELSE 0 END) AS search_bots
FROM bot_log
GROUP BY week ORDER BY week DESC LIMIT 12;

-- Month-over-month AI bot growth
SELECT
  strftime('%Y-%m', ts / 1000, 'unixepoch') AS month,
  COUNT(*) AS requests,
  LAG(COUNT(*)) OVER (ORDER BY month) AS prev_month,
  ROUND(
    100.0 * (COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY month))
    / LAG(COUNT(*)) OVER (ORDER BY month), 1
  ) AS growth_pct
FROM bot_log
WHERE bot_type = 'aiTraining'
GROUP BY month;
```

---

## Storage Engine Considerations

The default schema uses SQLite. For sites with higher traffic or multi-server deployments, consider these alternatives:

### SQLite (Default — Recommended for Most Sites)

| Factor | Assessment |
|--------|------------|
| **Throughput** | Handles ~50K writes/day comfortably with WAL mode. Sufficient for most content sites. |
| **Operational complexity** | Zero. Single file, no daemon, built into Node/Deno/Bun. |
| **Backup** | `sqlite3 .backup` or just copy the file. |
| **Query capabilities** | Full SQL including window functions, CTEs, JSON operators. |
| **Scaling ceiling** | ~1M rows/day with proper indexing. Beyond that, consider alternatives. |
| **Best for** | Single-server deployments, content sites, blogs, documentation sites. |

**Configuration for analytics workloads:**

```sql
PRAGMA journal_mode = WAL;           -- concurrent reads during writes
PRAGMA synchronous = NORMAL;         -- safe for analytics (not financial)
PRAGMA busy_timeout = 5000;          -- wait 5s for locks
PRAGMA cache_size = -64000;          -- 64MB cache
PRAGMA temp_store = MEMORY;          -- temp tables in RAM
```

### PostgreSQL + TimescaleDB (High-Volume)

| Factor | Assessment |
|--------|------------|
| **Throughput** | Effectively unlimited with connection pooling. |
| **Operational complexity** | Moderate. Requires a running database server. |
| **Time-series features** | TimescaleDB extension adds automatic time partitioning, continuous aggregates, and retention policies. |
| **Best for** | Multi-site analytics, >1M events/day, real-time dashboards. |

**Key advantages over SQLite:**
- Continuous aggregates pre-compute dashboard queries
- Automatic data retention (e.g., drop raw data after 90 days, keep rollups forever)
- Connection pooling via PgBouncer for burst traffic

### ClickHouse (Analytics-Scale)

| Factor | Assessment |
|--------|------------|
| **Throughput** | Designed for billions of rows. Column-oriented storage excels at aggregation queries. |
| **Operational complexity** | High. Separate infrastructure, different SQL dialect, different mental model. |
| **Query speed** | Orders of magnitude faster than row-oriented databases for `GROUP BY` over large ranges. |
| **Best for** | Multi-tenant SaaS analytics, >10M events/day, complex funnel analysis. |

**Key consideration:** ClickHouse is likely overkill for VB's target audience. It's documented here for completeness — if someone is building a hosted analytics service on VB, ClickHouse is the right backend.

### Migration Path

The schema is designed to be portable:

1. **Start with SQLite** — zero config, immediate value
2. **If you outgrow it**, export via `sqlite3 .dump` and import into PostgreSQL
3. **If you need time-series features**, add TimescaleDB and convert the `hits` and `events` tables to hypertables
4. **If you need extreme scale**, evaluate ClickHouse with the same schema adapted to columnar patterns

The ingest handler abstracts the database behind a `db.run()` / `db.get()` interface. Swapping SQLite for PostgreSQL requires changing only the database driver import.

---

## Module Map

### Canonical — Cloudflare Pages

```
vanilla-breeze/
├── functions/
│   ├── _middleware.js                    # Existing: Basic Auth gate
│   │                                      # Must be updated to bypass /api/analytics/*
│   ├── _middleware-layer0.js             # Layer 0 counter (Last-Modified wrapper)
│   ├── _middleware-telemetry.js          # Layer 1 Analytics Engine writer
│   │
│   ├── api/analytics/
│   │   ├── hit.js                        # Page view ingest
│   │   ├── events.js                     # Buffered event ingest
│   │   └── click.js                      # Outbound link click ingest
│   │
│   ├── _lib/
│   │   ├── daily-hash.js                 # Web Crypto + D1 salt rotation
│   │   ├── bot-classifier.js             # Portable bot taxonomy (reusable)
│   │   ├── ua-parser.js                  # Client Hints parsing
│   │   └── sanitize.js                   # Path + domain helpers
│   │
│   └── _scheduled/
│       └── rotate-salts.js               # Cron Worker — midnight UTC cleanup
│
├── db/
│   └── migrations/                       # `wrangler d1 migrations` source
│       ├── 0001_init.sql                 # hits, events, clicks, daily_salts
│       ├── 0002_bot_log.sql              # bot classification tables
│       ├── 0003_layer0.sql               # layer0_hits + daily_uniques
│       └── 0004_indexes.sql              # Dashboard query indexes
│
└── admin/r-n-d/analytics/
    └── dashboards/                       # SQL query library (docs only)
```

**Pages project bindings (`wrangler.toml` or Pages dashboard):**

- `DB` → D1 database for aggregate storage
- `ANALYTICS` → Workers Analytics Engine dataset (optional but recommended)
- `SALT_KV` → KV namespace (optional, only if KV-based salt mode is preferred)

### Reference — Self-hosted nginx

```
analytics/
├── server/
│   ├── ingest.js                 # /analytics/* endpoint handlers
│   ├── bot-classifier.js         # Bot detection and taxonomy (portable)
│   ├── log-processor.js          # nginx log → database pipeline
│   ├── ua-parser.js              # Client Hints + User-Agent parsing (portable)
│   ├── geoip.js                  # IP → country code (MaxMind Lite)
│   ├── daily-hash.js             # Two-level daily hash + salt rotation (Node crypto variant)
│   └── honeypot-expire.js        # TTL cleanup for honeypot IP table
│
├── db/
│   ├── schema.sql                # Full SQLite schema
│   ├── migrations/               # Version-controlled schema changes
│   └── queries.js                # Named query functions
│
└── nginx/
    ├── analytics-log.conf        # JSON log format with Client Hints
    └── analytics-locations.conf  # Location blocks for ingest proxy
```

`bot-classifier.js` and `ua-parser.js` are pure functions and should be shared between the two deployment targets — publish from `functions/_lib/` and symlink or import from the self-hosted bundle.

---

*Vanilla Breeze Analytics — Backend Specification v0.4.0. April 2026.*
*Companions: [`analytics-spec.md`](analytics-spec.md) (client-side), [`analytics-master.md`](analytics-master.md) (implementation brief).*
