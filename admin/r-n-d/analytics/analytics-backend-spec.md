---
title: Vanilla Breeze Analytics — Backend Specification
description: >
  Server-side infrastructure for the VB analytics system. Covers ingest
  endpoints, visitor uniqueness, log processing, bot intelligence, data
  schema, dashboard queries, and storage engine considerations.
date: 2026-02-27
status: design
version: 0.3.0
companion: analytics-spec.md
tags:
  - analytics
  - backend
  - privacy
  - vanilla-breeze
---

# Vanilla Breeze Analytics — Backend Specification

Server-side companion to the [client-side analytics spec](analytics-spec.md). This document covers everything that runs on the site owner's infrastructure: HTTP ingest endpoints, visitor uniqueness hashing, nginx log processing, bot intelligence, the SQLite data schema, and dashboard queries.

**Implementation phase:** Phase 4 of the [client spec roadmap](analytics-spec.md#phased-roadmap). The client-side core script (Phases 1–3) can operate independently — beacons fire to any endpoint that returns `204`. This spec defines the canonical VB backend for those beacons.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Ingest Handler](#ingest-handler)
- [Daily Hash and Visitor Uniqueness](#daily-hash-and-visitor-uniqueness)
- [Layer 0 — HTTP Header Counting](#layer-0--http-header-counting)
- [Server Logs and Log Processor](#server-logs-and-log-processor)
- [Bot Intelligence System](#bot-intelligence-system)
- [Server Configuration](#server-configuration)
- [Data Schema](#data-schema)
- [Dashboard Query Reference](#dashboard-query-reference)
- [Storage Engine Considerations](#storage-engine-considerations)
- [Module Map](#module-map)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        SERVER                                │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  nginx reverse proxy                                   │  │
│  │  · JSON structured access logs (Client Hints)          │  │
│  │  · Accept-CH headers for high-entropy hints            │  │
│  │  · Layer 0: Last-Modified/If-Modified-Since counting   │  │
│  │  · Honeypot trap location (/~trap/)                    │  │
│  └──────────┬─────────────────────────────────────────────┘  │
│             │                                                 │
│             ▼                                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Ingest Handler (Node/Deno/Bun)                        │  │
│  │                                                        │  │
│  │  POST /analytics/hit    ← page views + taxonomy        │  │
│  │  POST /analytics/events ← buffered event queue         │  │
│  │  POST /analytics/click  ← ping + beacon outbound       │  │
│  │  POST /analytics/forget ← user-initiated erasure       │  │
│  │                                                        │  │
│  │  · Parse Client Hints headers                          │  │
│  │  · Geo-IP → country code (IP discarded)                │  │
│  │  · Daily hash → is_unique flag (hash discarded)        │  │
│  │  · Increment aggregate counters                        │  │
│  │  · Discard raw event                                   │  │
│  └──────────┬─────────────────────────────────────────────┘  │
│             │                                                 │
│             ▼                                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Log Processor (cron schedule)                         │  │
│  │  · Reads nginx JSON access logs                        │  │
│  │  · Classifies bot vs human traffic                     │  │
│  │  · Records log-layer hits (no-JS visitors, bots)       │  │
│  └──────────┬─────────────────────────────────────────────┘  │
│             │                                                 │
│             ▼                                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  SQLite (primary) / PostgreSQL (optional)              │  │
│  │  hits · events · clicks · bot_log · log_hits           │  │
│  │  honeypot_ips · daily_salts                            │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Ingest Handler

All endpoints live on the same domain as the site. All return `204 No Content` on success. The handler runs as a lightweight HTTP server behind nginx.

### Endpoints

| Method | Path | Source | Purpose |
|--------|------|--------|---------|
| `POST` | `/analytics/hit` | JS beacon | Page view with taxonomy |
| `POST` | `/analytics/events` | JS buffer | Batched events (scroll, attention, custom) |
| `POST` | `/analytics/click` | `ping` + beacon | Outbound link click |
| `POST` | `/analytics/forget` | Settings panel | Delete this session's data |

### `/analytics/hit` — Page View

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

**Server processing:**

1. Parse Client Hints headers from the request (`Sec-CH-UA`, `Sec-CH-UA-Mobile`, `Sec-CH-UA-Platform`)
2. Geo-IP lookup → ISO country code → **discard IP immediately**
3. Daily hash (`SHA-256(ip + ua + siteId + dailySalt)`) → check in-memory Set → `is_unique` flag → **discard hash**
4. Extract taxonomy fields
5. `INSERT INTO hits` — raw event never stored, only derived aggregate columns
6. Return `204`

### `/analytics/click` — Outbound Link Click

Handles both browser `ping` POSTs (`Content-Type: text/ping`) and `sendBeacon` fallback POSTs (`Content-Type: application/json`).

```javascript
// POST /analytics/click
// Content-Type: text/ping (browser ping) or application/json (sendBeacon fallback)
// Headers guaranteed by ping spec: Ping-From, Ping-To
export async function handlePingClick(req) {
  const contentType = req.headers.get('content-type');

  if (contentType === 'text/ping') {
    // Browser-native ping POST
    const pingFrom = req.headers.get('ping-from');
    const pingTo   = req.headers.get('ping-to');
    const url      = new URL(req.url);

    await db.run(`
      INSERT INTO clicks (site_id, from_page, to_domain, created_at)
      VALUES (?, ?, ?, ?)
    `, [
      url.searchParams.get('site') || 'default',
      sanitizePath(url.searchParams.get('page') || pingFrom),
      extractDomain(pingTo),
      Date.now(),
    ]);
  } else if (contentType === 'application/json') {
    // sendBeacon fallback (Firefox, Brave)
    const body = await req.json();
    await db.run(`
      INSERT INTO clicks (site_id, from_page, to_domain, created_at)
      VALUES (?, ?, ?, ?)
    `, [
      body.s || 'default',
      sanitizePath(body.from),
      body.to,
      Date.now(),
    ]);
  } else {
    return new Response(null, { status: 400 });
  }

  return new Response(null, { status: 204 });
}
```

### `/analytics/forget` — Session Erasure

Called by the settings panel "Clear my data" button. For a pure aggregate system, there is no per-session data to delete on the server (no session ID was ever stored). The endpoint exists for completeness and future session-token support.

```javascript
export async function handleForget(req) {
  // If using session tokens (optional extended mode):
  const { token } = await req.json().catch(() => ({}));
  if (token) {
    await db.run('DELETE FROM events WHERE session_token = ?', [token]);
  }
  return new Response(null, { status: 204 });
}
```

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

Inspired by Fathom's daily hash with OpenPanel's screen-width input for additional entropy without adding identifiability.

```javascript
// daily-hash.js
import { createHash } from 'node:crypto';

// Salt rotates at midnight UTC — stored in DB, never logged
let currentSalt = null;
let saltDate    = null;

async function getDailySalt() {
  const today = new Date().toISOString().slice(0, 10);
  if (saltDate === today && currentSalt) return currentSalt;

  const row = await db.get('SELECT salt FROM daily_salts WHERE day = ?', [today]);
  if (row) {
    currentSalt = row.salt;
  } else {
    currentSalt = crypto.randomUUID();
    await db.run('INSERT INTO daily_salts (day, salt) VALUES (?, ?)', [today, currentSalt]);
  }
  saltDate = today;
  return currentSalt;
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
 * The hash is checked against an in-memory Set, used to set
 * is_unique=1 on the first hit, then discarded. Neither the hash
 * nor its inputs are stored.
 */
const dailyUniques = new Set();

export async function checkUnique(ip, ua, siteId, screenWidth) {
  const salt = await getDailySalt();

  // Level 1: core identity signals
  const level1 = createHash('sha256')
    .update(`${ip}|${ua}|${siteId}|${salt}`)
    .digest('hex');

  // Level 2: add screen width for extra entropy
  const level2 = createHash('sha256')
    .update(`${level1}|${screenWidth || 0}`)
    .digest('hex');

  if (dailyUniques.has(level2)) return false;
  dailyUniques.add(level2);
  return true;
}

// Clear the Set at midnight (salt rotation also invalidates all hashes)
export function resetDailyUniques() {
  dailyUniques.clear();
  currentSalt = null;
  saltDate = null;
}
```

**Privacy guarantees:**

- Salt rotates daily — yesterday's hashes cannot be recomputed
- Salt is per-site — no cross-site correlation
- Hash is checked and discarded — never written to disk
- Screen width adds ~4 bits of entropy without being a fingerprint (only ~20 common values exist)

---

## Layer 0 — HTTP Header Counting

Zero-JavaScript visit counting using Cabin's `Last-Modified` / `If-Modified-Since` pattern. This is the most privacy-friendly layer: no scripts, no cookies, no client-side state.

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

## Server Logs and Log Processor

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
```

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

```
analytics/
├── server/
│   ├── ingest.js                 # /analytics/* endpoint handlers
│   ├── bot-classifier.js         # Bot detection and taxonomy
│   ├── log-processor.js          # nginx log → database pipeline
│   ├── ua-parser.js              # Client Hints + User-Agent parsing
│   ├── geoip.js                  # IP → country code (MaxMind Lite)
│   ├── daily-hash.js             # Two-level daily hash + salt rotation
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

---

*Vanilla Breeze Analytics — Backend Specification v0.3.0. February 2026.*
*Companion to: [analytics-spec.md](analytics-spec.md) (client-side specification).*
