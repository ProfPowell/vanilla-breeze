phy)
- [System Architecture](#system-architecture)
- [Page Taxonomy Schema](#page-taxonomy-schema)
- [Collection Layers](#collection-layers)
  - [Layer 1 — Server Logs with Client Hints](#layer-1--server-logs-with-client-hints)
  - [Layer 2 — The `ping` Attribute](#layer-2--the-ping-attribute)
  - [Layer 3 — JavaScript Beacon Module](#layer-3--javascript-beacon-module)
  - [Layer 4 — `sessionStorage` Event Buffer](#layer-4--sessionstorage-event-buffer)
- [Bot Intelligence System](#bot-intelligence-system)
- [The `<analytics-panel>` Settings Component](#the-analytics-panel-settings-component)
- [Data Schema](#data-schema)
- [API Surface](#api-surface)
- [Server Configuration](#server-configuration)
- [Dashboard Query Reference](#dashboard-query-reference)
- [---
title: Vanilla Breeze Analytics System — Design Specification
description: Complete design for a first-party, privacy-transparent, bot-aware analytics system integrated with the VB settings panel web component.
date: 2026-02-25
status: design
version: 0.1.0
tags:
  - analytics
  - privacy
  - web-components
  - vanilla-breeze
---

# Vanilla Breeze Analytics System

A first-party, cookieless, privacy-transparent analytics system. Collected data is visible and clearable by the user through the VB settings panel. Server logs enhanced with Client Hints provide bot intelligence. Page taxonomy metadata categorises visitors into broad interest and persona buckets without identifying individuals.

## Table of Contents

- [Design Philosophy](#design-philosoCompliance Architecture](#compliance-architecture)
- [File and Module Map](#file-and-module-map)

---

## Design Philosophy

### Principles

**1. Transparency as the product.** The user can see exactly what is stored about them, on their device and on the server, through an in-page UI. This is not a privacy policy footer link — it is an actual data viewer built into the site.

**2. First-party only.** No data leaves the site owner's infrastructure. No third-party scripts. No CDN for the analytics script. The ingest endpoint runs on the same domain as the site.

**3. Aggregate over individual.** The server stores counts, not records. When an event arrives at the ingest endpoint, it increments a counter and the raw event is discarded. There is no table of individual user actions to breach or misuse.

**4. Progressive enhancement.** Analytics degrade gracefully at every layer. If JavaScript is blocked, server logs still capture page views. If `ping` is blocked (Firefox), a `sendBeacon` fallback fires. If `sessionStorage` is unavailable, events are sent immediately. Nothing breaks.

**5. Bot traffic is intelligence, not noise.** Rather than just filtering bots out, the system classifies and reports on them. In 2025–2026, knowing which AI crawlers are indexing your content, how often, and which pages they prefer is operationally valuable.

**6. Metadata-driven categorisation.** Pages are tagged at the HTML level with taxonomy attributes. The analytics system reads these tags and rolls up interest, persona, and activity dimensions without storing any behavioural profile on an individual.

### What the System Does Not Do

- Store persistent user identifiers (no UUID, no fingerprint, no cross-session ID)
- Set cookies of any kind
- Share data with any third party
- Track users across different websites
- Store raw IP addresses (geo-lookup only, IP discarded in transit)
- Profile individual users over time

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
│  │                   │   │   event queue                │  │
│  └────────┬──────────┘   └──────────┬───────────────────┘  │
│           │                          │                      │
│           ▼                          ▼                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │              vb-analytics.js module                │    │
│  │   reads taxonomy · buffers events · flushes        │    │
│  └────────────────────┬───────────────────────────────┘    │
│                        │                                    │
│  ┌─────────────────────▼──────────────────────────────┐    │
│  │              <analytics-panel> component            │    │
│  │   inside <vb-settings> · shows stored data         │    │
│  │   lets user view / configure / clear               │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────┬────────────────────────────────────────┘
                   │  HTTP POST  (same domain, first-party)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVER                                │
│                                                             │
│  /analytics/hit     page views + taxonomy dimensions        │
│  /analytics/events  buffered event queue (scroll, attention)│
│  /analytics/click   ping POST handler (outbound clicks)     │
│  /analytics/forget  user-initiated erasure                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Ingest handler                                     │   │
│  │  · parse Client Hints headers                       │   │
│  │  · geo-IP → country code (IP discarded)             │   │
│  │  · daily hash → is_unique flag (hash discarded)     │   │
│  │  · increment aggregate counters                     │   │
│  │  · discard raw event                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  nginx access logs (JSON structured)                        │
│  · captures ALL traffic incl. bots, no-JS visitors          │
│  · Client Hints headers logged natively                     │
│  · processed by log-processor.js on schedule                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SQLite / PostgreSQL                                │   │
│  │  hits · events · bot_log · taxonomy_rollups         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

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

// Example output:
// { persona: 'developer', activity: 'learning', topic: 'web-components',
//   content: 'tutorial', stage: 'consideration', series: 'vb-components' }
```

### Taxonomy in Server Payloads

All taxonomy dimensions travel with every beacon as a flat object. The server stores them as separate indexed columns for efficient GROUP BY queries:

```json
{
  "s": "mysite",
  "p": "/docs/container-queries",
  "r": "https://css-tricks.com",
  "w": 1440,
  "u": 1,
  "taxonomy": {
    "persona": "developer",
    "activity": "learning",
    "topic": "css",
    "content": "tutorial",
    "stage": "consideration"
  }
}
```

---

## Collection Layers

### Layer 1 — Server Logs with Client Hints

The foundation layer. Captures every HTTP request including bots, no-JS visitors, monitoring tools, and AI crawlers. Requires no client cooperation.

#### nginx Configuration

**Structured JSON log format with Client Hints:**

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

#### Log Processor

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

---

### Layer 2 — The `ping` Attribute

Declarative outbound link tracking. Zero JavaScript dependency. Browser-native HTTP POST on link click.

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

#### Server Handler

```javascript
// POST /analytics/click
// Content-Type: text/ping
// Headers guaranteed by spec: Ping-From, Ping-To
export async function handlePingClick(req) {
  if (req.headers.get('content-type') !== 'text/ping') {
    return new Response(null, { status: 400 });
  }

  const pingFrom = req.headers.get('ping-from');
  const pingTo   = req.headers.get('ping-to');
  const url      = new URL(req.url);

  await db.run(`
    INSERT INTO clicks (from_page, to_domain, ts)
    VALUES (?, ?, ?)
  `, [
    sanitizePath(url.searchParams.get('page') || pingFrom),
    extractDomain(pingTo),
    Date.now(),
  ]);

  return new Response(null, { status: 204 });
}
```

---

### Layer 3 — JavaScript Beacon Module

**`vb-analytics.js`** — the primary collection module. Handles page views, taxonomy reading, outbound link instrumentation (with `ping` + `sendBeacon` fallback), SPA navigation, and session management.

```javascript
/**
 * @module vb-analytics
 * @description Privacy-first analytics collection for Vanilla Breeze sites.
 * Reads page taxonomy meta tags and includes them in aggregate beacons.
 * No cookies. No persistent identifiers. No personal data stored.
 */

const SITE_ID  = document.currentScript?.dataset.site ?? '';
const ENDPOINT = '/analytics';

// --- Opt-out signals — respect unconditionally ---
function isOptedOut() {
  return navigator.doNotTrack === '1'
    || navigator.globalPrivacyControl === true
    || sessionStorage.getItem('vb_optout') === '1';
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

    // ping attribute for Chrome/Safari/Edge
    const pingUrl = `${ENDPOINT}/click?page=${encodeURIComponent(location.pathname)}`;
    link.setAttribute('ping', pingUrl);

    // sendBeacon fallback — fires for Firefox where ping is disabled
    // Guard: only fire if we're likely in a ping-unsupported browser
    link.addEventListener('click', () => {
      if (isOptedOut()) return;
      // Firefox check — imperfect but acceptable for a fallback layer
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

// --- SPA navigation (History API) ---
function watchNavigation() {
  const origPush = history.pushState.bind(history);
  history.pushState = (...args) => {
    origPush(...args);
    trackPage(location.pathname + location.search);
    instrumentLinks();
  };
  window.addEventListener('popstate', () =>
    trackPage(location.pathname + location.search)
  );
}

// --- Public event API ---
window.vbTrack = (id, params = {}) => {
  if (isOptedOut()) return;
  // Delegate to buffer module (Layer 4)
  window.dispatchEvent(new CustomEvent('vb:track', { detail: { id, params } }));
};

// --- Init ---
if (!isOptedOut()) {
  trackPage(location.pathname + location.search);
  instrumentLinks();
  watchNavigation();
}
```

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
  // Extract specific bot identifier from UA string
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

### Bot Recording Schema

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

### Bot Dashboard Queries

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

## The `<analytics-panel>` Settings Component

The analytics panel lives inside the existing `<vb-settings>` web component as a named slot or tab section. It renders what is currently stored on the user's device, explains each field in plain language, provides configuration controls, and exposes a clear action.

### Slot Integration

```html
<!-- Inside <vb-settings> — the analytics panel is one section -->
<vb-settings>
  <analytics-panel slot="data"></analytics-panel>
</vb-settings>
```

### Component Design

```javascript
/**
 * @element analytics-panel
 * @description Shows the user what analytics data is stored on their device.
 * Provides controls to view, configure, and clear that data.
 * Slots into <vb-settings> as the 'data' section.
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
      // Session counter
      const sc = JSON.parse(sessionStorage.getItem('vb_sc') || 'null');
      if (sc) raw.sessionCounter = sc;
      // Event queue
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
    // Notify server to forget this session's contributions
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
  id          INTEGER PRIMARY KEY,
  path        TEXT NOT NULL,
  referrer    TEXT,
  status      INTEGER,
  bytes_sent  INTEGER,
  response_ms INTEGER,
  country     TEXT(2),
  browser     TEXT,
  platform    TEXT,
  is_mobile   INTEGER DEFAULT 0,
  viewport_w  INTEGER,
  color_scheme TEXT,
  save_data   INTEGER DEFAULT 0,
  created_at  INTEGER NOT NULL
);

CREATE INDEX idx_log_hits_path_time ON log_hits (path, created_at DESC);

-- Honeypot — IPs that hit the trap URL (hash only, never raw IP)
CREATE TABLE honeypot_ips (
  ip_hash     TEXT PRIMARY KEY,
  seen_at     INTEGER NOT NULL,
  hit_count   INTEGER DEFAULT 1
);
```

---

## API Surface

All endpoints on the same domain. All return `204 No Content` or `200` with minimal response.

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
  -- Average scroll depth for this series
  ROUND(AVG(e.scroll_depth), 0) AS avg_scroll_pct,
  -- Average attention time
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
| CNIL exemption alignment | First-party only, no cross-site correlation, country-level geo only, aggregate output, session-scoped. Meets all six CNIL conditions for analytics without consent. |

### Privacy Policy Disclosure

Your privacy policy should describe the analytics system in plain language. Minimum disclosure:

> **Analytics:** This site uses its own analytics system. We count page views, referrers, and general usage patterns. We do not use cookies. We do not store your IP address. We cannot identify you individually. You can view what is stored on your device and clear it at any time from the Data section of site settings. Data is cleared automatically when you close your browser tab.

---

## File and Module Map

```
analytics/
├── client/
│   ├── vb-analytics.js           # Main collection module (Layer 3)
│   ├── vb-analytics-buffer.js    # sessionStorage event buffer (Layer 4)
│   └── analytics-panel.js        # <analytics-panel> web component
│
├── server/
│   ├── ingest.js                 # /analytics/* endpoint handlers
│   ├── bot-classifier.js         # Bot detection and taxonomy
│   ├── log-processor.js          # nginx log → database pipeline
│   ├── ua-parser.js              # Client Hints + User-Agent parsing
│   ├── geoip.js                  # IP → country code (MaxMind Lite)
│   ├── daily-hash.js             # In-memory unique visitor detection
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

### Custom Element Registration

```javascript
// In your site's main entry point or components bundle
import { AnalyticsPanel } from './analytics/client/analytics-panel.js';
// AnalyticsPanel self-registers on import via customElements.define()
```

### `<vb-settings>` Integration Contract

The settings panel component should expose a named slot:

```html
<!-- vb-settings renders its data panel slot -->
<vb-settings>
  <analytics-panel slot="data"></analytics-panel>
</vb-settings>
```

The `<analytics-panel>` component is self-contained — it reads and writes `sessionStorage` directly and communicates via custom events on the shadow host. No props or attributes required. Events it emits (`analytics-panel:cleared`, `analytics-panel:optout`, `analytics-panel:optin`) bubble and compose, so `<vb-settings>` can react to them if needed.

---

*Vanilla Breeze Analytics System — Design Specification v0.1.0. February 2026.*
*Extends: Privacy-First Web Analytics Research Report, Platform Signals & Bot Intelligence Extension.*
