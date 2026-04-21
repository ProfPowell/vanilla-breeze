# Plan: Notification System, /go/ Service Layer & VBStore for Vanilla Breeze

**Date**: 2026-04-13  
**Status**: Approved Plan  

## Context

VB needs a notification system spanning dismissible site banners, a notification panel (bell + drawer), page watching, and changelog feeds. Building this properly requires two foundational pieces: a service abstraction layer (`VBService`) so components can talk to backend services without hardcoding providers, and a unified storage layer (`VBStore`) so all components persist data through one abstraction instead of each managing their own `localStorage` keys.

The `/go/` URL namespace provides a convention where reserved service names coexist with shortlink redirects. html-star handles HTML fragment transport (SSE, polling, swap); VBService handles JSON API calls for component data. They're independent concerns.

**Key decisions**:
- URL namespace: `/go/` with reserved service names + shortlinks (documented, not enforced)
- Storage: Unified `VBStore` class — all components use it, single swap point
- Service transport: `VBService` wraps fetch independently of html-star
- Service Worker: No `/go/` involvement yet — stays on static assets
- Scope: Full story, phased build with beads per phase

---

## Table of Contents

1. [The /go/ Convention](#1-the-go-convention)
2. [VBStore — Unified Storage Layer](#2-vbstore--unified-storage-layer)
3. [VBService — Service Abstraction](#3-vbservice--service-abstraction)
4. [notification-wc Component](#4-notification-wc-component)
5. [Page Watch System](#5-page-watch-system)
6. [Content Feed & Changelog (/go/feed)](#6-content-feed--changelog-gofeed)
7. [Newsletter (/go/newsletter)](#7-newsletter-gonewsletter)
8. [Email Relay (/go/email)](#8-email-relay-goemail)
9. [Broader /go/ Service Vision](#9-broader-go-service-vision)
10. [Implementation Phases](#10-implementation-phases)
11. [Verification](#11-verification)
12. [Sources](#12-sources)

---

## 1. The /go/ Convention

### Concept

`/go/` is a single URL namespace with two purposes:
- **Reserved names** → service relay endpoints (finite, documented list)
- **Everything else** → shortlink redirects (`/go/32adad`, `/go/my-article`)

Additionally, `/rss` is reserved at the site root for RSS feeds (common convention).

### Reserved Service Names

| Path | Service | Purpose |
|------|---------|---------|
| `/go/notify` | Notifications | Push/poll notification delivery |
| `/go/email` | Email | Transactional email (contact forms, watch alerts) |
| `/go/feed` | Content Feed | Changelog, what's new, release notes |
| `/go/newsletter` | Newsletter | Newsletter subscription management |
| `/go/search` | Search | Site search relay (Algolia, Meilisearch, Pagefind, etc.) |
| `/go/ai` | AI/LLM | AI chat relay (keeps API keys server-side) |
| `/go/chat` | Chat | Live chat relay (Intercom, Crisp, custom) |
| `/go/webhook` | Webhooks | Incoming webhook receiver |
| `/go/auth` | Authentication | OAuth/session management relay |
| `/go/analytics` | Analytics | First-party analytics endpoint |
| `/go/storage` | Storage | File upload/asset management relay |
| `/rss` | RSS | RSS feed (root-level, not under /go/) |

### Documentation Convention

The reserved list lives in a VB docs page. Not enforced in code — a future link-shortener component could warn on collision but won't block. The developer implements whatever lives behind each endpoint; VB provides URL conventions, JSON contracts, and reference implementations.

### Why /go/?

- Short, memorable, verb-like ("go do this")
- Doubles as link-shortener home — one namespace, two purposes
- Won't collide with `/services/` (org content) or `/api/` (API docs/endpoints)
- Precedent: go-links at Google, Slack, many orgs

---

## 2. VBStore — Unified Storage Layer

### Problem

Today, every VB component manages its own `localStorage`:
- `consent-banner` → `consent-banner` key with `{preferences, action, timestamp}`
- `highlights-init` → `vb-highlights:{key}` with `{version, contentHash, highlights}`
- `autosave-init` → `vb-autosave:{key}` with `{data, timestamp}`
- `theme-manager` → `vb-theme` with theme object
- `settings-panel` → `vb-extensions`, `vb-a11y-themes`, `vb-sticky`
- `review-surface` → `review-surface` key with pin array
- `split-surface` → `split-surface:{key}` with position value
- `environment-manager` → `vb-env` with preferences

Each has its own read/write/expiry logic. Swapping localStorage for IndexedDB or a server backend means touching every component. There's no way to query "what has VB stored?" or "clear all VB data."

### Solution

A single `VBStore` class in `src/lib/vb-store.js` that all components use.

### API Design

```js
// Read/write with namespaced keys
await VBStore.set('notifications', 'dismissed-v3', { timestamp: Date.now() });
const val = await VBStore.get('notifications', 'dismissed-v3');
await VBStore.remove('notifications', 'dismissed-v3');

// List all entries in a namespace
const all = await VBStore.list('notifications');

// Clear an entire namespace
await VBStore.clear('notifications');

// Clear ALL VB storage
await VBStore.clearAll();

// Query with expiry
const val = await VBStore.get('consent', 'banner', { maxAge: 365 * 86400000 });
// Returns null if older than maxAge

// Bulk operations
await VBStore.setMany('highlights', [
  ['page-1', { highlights: [...] }],
  ['page-2', { highlights: [...] }],
]);
```

### Why Async?

The API is async (`await`) even though localStorage is synchronous. This allows swapping to IndexedDB or a network backend without changing any component code. Components written against VBStore today will work with IndexedDB tomorrow.

### Internal Architecture

```
src/lib/vb-store.js
├── VBStore (static API)
│   ├── set(namespace, key, value)
│   ├── get(namespace, key, options?)
│   ├── remove(namespace, key)
│   ├── list(namespace)
│   ├── clear(namespace)
│   ├── clearAll()
│   └── setMany(namespace, entries)
├── Storage key format: `vb:{namespace}:{key}`
│   └── e.g., `vb:notifications:dismissed-v3`
├── Value envelope: { data, timestamp, version? }
│   └── Timestamp always set on write
├── Default backend: localStorage
│   └── JSON.stringify/parse with try/catch
└── Future: swap backend via VBStore.configure({ backend })
    └── Backends: LocalStorageBackend, IndexedDBBackend, RestBackend
```

### Migration Strategy

Existing components keep working during migration. New components use VBStore from day one. Old components migrate one at a time:
1. Add VBStore usage alongside existing localStorage calls
2. Read from VBStore, fall back to old key (migration read)
3. Write to VBStore only
4. Remove old localStorage code in a later release

### Files

| File | Purpose |
|------|---------|
| `src/lib/vb-store.js` | Unified storage class |
| `tests/unit/vb-store.test.js` | Unit tests |

---

## 3. VBService — Service Abstraction

### Purpose

A shared fetch client in `src/lib/vb-service.js`. Components that need JSON API data instantiate by role name. Independent of html-star (which handles HTML fragment transport via SSE, polling, and swap).

### Boundary with html-star

| Concern | html-star | VBService |
|---------|-----------|-----------|
| HTML fragment loading | Yes (data-swap, SSE, polling) | No |
| JSON API calls | No | Yes |
| Caching | HTML responses (SWR, sessionStorage) | Not in v1 |
| Auth headers | X-Requested-With only | Developer-configurable |
| Configuration | data-* attributes, meta tags | JS configure() call |

A page can use both: html-star for navigation and content swaps, VBService for component data (notifications, search results, chat messages).

### API Design

```js
// Developer configures once
VBService.configure({
  baseUrl: '/go',              // default
  headers: { 'X-Auth': '...' }, // global headers
  services: {                   // per-service overrides
    ai: 'https://api.openai.com/v1',
  }
});

// Component usage
const notify = new VBService('notify');
const messages = await notify.get('/messages');          // GET /go/notify/messages
await notify.post('/read', { ids: ['msg-1', 'msg-2'] }); // POST /go/notify/read

// URL resolution
VBService.resolve('notify');  // → '/go/notify'
VBService.resolve('ai');      // → 'https://api.openai.com/v1' (overridden)
```

### Implementation Shape

```
src/lib/vb-service.js
├── VBService class
│   ├── static configure(config)
│   ├── static resolve(role) → full URL
│   ├── constructor(role)
│   ├── get(path, params?)    → GET with query params
│   ├── post(path, body?)     → POST JSON
│   ├── patch(path, body?)    → PATCH JSON
│   ├── delete(path)          → DELETE
│   └── Error normalization → VBServiceError { status, body, role }
├── URL resolution: per-service override > baseUrl/role > '/go/' + role
├── Headers: global merged with per-request
└── Zero dependencies, pure fetch wrapper
```

### Files

| File | Purpose |
|------|---------|
| `src/lib/vb-service.js` | VBService class |
| `tests/unit/vb-service.test.js` | Unit tests |
| `site/src/docs/services/` | Documentation for /go/ convention + VBService API |

### Existing Components to Eventually Migrate

- `chat-window` (`endpoint` attr → VBService('ai') or VBService('chat'))
- `review-surface` RestAdapter (direct fetch → VBService internally)
- `card-list` (`src` attr → optional VBService resolution)

---

## 4. notification-wc Component

### Overview

A single component with two presentation modes:

| Mode | Attribute | Behavior |
|------|-----------|----------|
| **Banner** | `mode="banner"` | Full-width dismissible strip. Persistence via VBStore. |
| **Panel** | `mode="panel"` (default) | Bell icon with badge count. Opens drawer with notification list. |

### Banner Mode

```html
<notification-wc mode="banner" persist="site-update-v3" variant="info" position="top">
  <p>We've launched v3.0! <a href="/changelog">See what's new</a></p>
  <button value="dismiss">Dismiss</button>
</notification-wc>
```

**Behavior**:
- Shows on load if not previously dismissed (checks VBStore)
- Dismiss writes to VBStore under `notifications` namespace with the `persist` key
- `expires="30"` re-shows after 30 days
- Content is static HTML — works without JS as a visible element
- JS adds dismiss behavior and persistence check
- Variants: `info`, `warning`, `error`, `success`
- Position: `top` (default), `bottom`
- Multiple banners allowed (unlike consent-banner)

**How it differs from consent-banner**:
- No checkbox preferences — just message + dismiss
- Supports `expires` for timed re-show
- Multiple instances per page
- Uses VBStore instead of direct localStorage

### Panel Mode

```html
<notification-wc mode="panel">
  <!-- Static notifications (progressive enhancement) -->
  <article data-id="release-3.0" data-type="update" data-date="2026-04-10">
    <h4>v3.0 Released</h4>
    <p>New notification system and service layer.</p>
    <a href="/changelog#v3">Read more</a>
  </article>
</notification-wc>
```

**Behavior**:
- Renders bell icon button (via `icon-wc` or inline SVG)
- Badge count shows unread notifications
- Click opens drawer/popover with notification list
- Notifications are `<article>` elements with data attributes
- Read state tracked via VBStore
- "Mark all as read" action
- Optional polling for dynamic notifications via VBService('notify')

### Notification Data Shape

```json
{
  "id": "release-3.0",
  "type": "update",
  "title": "v3.0 Released",
  "body": "New notification system.",
  "url": "/changelog#v3",
  "date": "2026-04-10T00:00:00Z",
  "read": false,
  "dismissed": false,
  "priority": "normal",
  "expires": null
}
```

### Notification Types

| Type | Icon | Use Case |
|------|------|----------|
| `update` | Package | "v3.0 Released" — changelog, release notes |
| `alert` | Alert-triangle | "Scheduled Maintenance" — urgent system messages |
| `watch` | Eye | "Docs: Getting Started updated" — page change |
| `system` | Settings | "New version available" — framework-level |
| `message` | Mail | "New comment on your review" — user-to-user |

### Dynamic Notifications via VBService

```html
<notification-wc mode="panel" src="/go/notify" poll="300000">
  <!-- Static fallback content -->
</notification-wc>
```

When `src` is set, the component:
1. Renders static `<article>` children immediately (progressive enhancement)
2. Fetches from VBService('notify') for additional/updated notifications
3. Merges static + dynamic, deduplicates by `data-id`/`id`
4. Polls at interval if `poll` attribute set (default: no polling)

### Integration with toast-msg

```html
<notification-wc mode="panel" toast-new>...</notification-wc>
```

When `toast-new` is present and a new notification arrives, it fires a toast via the nearest `<toast-msg>`. The notification lives in the panel; the toast is ephemeral awareness.

### Events

| Event | Detail | When |
|-------|--------|------|
| `notification-wc:new` | `{ notification }` | New notification received |
| `notification-wc:read` | `{ id }` | Marked as read |
| `notification-wc:dismiss` | `{ id }` | Dismissed |
| `notification-wc:open` | `{}` | Panel drawer opened |
| `notification-wc:close` | `{}` | Panel drawer closed |

### Component Files

```
src/web-components/notification-wc/
├── logic.js        # Main component (banner + panel modes)
├── styles.css      # Banner, panel, drawer, badge styles
├── api.json        # Component API definition
├── static.html     # Demo template
└── README.md       # Spec
```

---

## 5. Page Watch System

### Concept

Bookmark + watch: save a page reference, get notified when content changes. Inspired by Medium's bookmark but active rather than passive.

### Client-Side Detection (VBStore, no backend)

1. User clicks "Watch this page" in `page-tools`
2. Page URL + content hash (FNV-1a, borrowed from highlights-init) stored in VBStore('watches')
3. On subsequent visits to any watched page, content hash recalculated
4. If changed → notification injected into notification-wc via event
5. **Limitation**: Only detects changes when the user visits the page

### Server-Side Detection (VBService via /go/notify)

1. User clicks "Watch" → `POST /go/notify/subscribe { url, type: 'page-watch' }`
2. Server periodically checks pages (content hash, ETag, Last-Modified)
3. On change → creates notification at `/go/notify`
4. notification-wc polls `/go/notify` and surfaces it
5. Optional: server sends email via `/go/email` if user opted in

### UI Trigger

Attribute on page-tools (v1, keeps it simple):

```html
<page-tools>
  <button data-watch-page>Watch for updates</button>
</page-tools>
```

The `data-watch-page` button toggles watch state. Visual indicator (filled/outline eye icon) shows current state. Watch list viewable in notification panel under a "Watching" tab or filter.

---

## 6. Content Feed & Changelog (/go/feed)

### Concept

A structured way to surface release notes, product updates, and site changes. Entries can be static HTML or fetched from `/go/feed`.

### Static Authoring

```html
<notification-wc mode="panel">
  <article data-id="v3.0" data-type="update" data-date="2026-04-10">
    <h4>v3.0 — Notification System</h4>
    <p>New notification panel and service layer.</p>
    <a href="/changelog#v3.0">Full changelog</a>
  </article>
</notification-wc>
```

### JSON Feed from /go/feed

```html
<notification-wc mode="panel" src="/go/feed"></notification-wc>
```

`/go/feed` returns:
```json
{
  "items": [
    {
      "id": "v3.0",
      "type": "update",
      "title": "v3.0 — Notification System",
      "body": "New notification panel and service layer.",
      "url": "/changelog#v3.0",
      "date": "2026-04-10"
    }
  ]
}
```

### Relationship to /rss

`/rss` serves the same content as an RSS/Atom feed for feed readers. `/go/feed` serves it as JSON for the notification panel. Same data, different formats. The developer can generate both from the same source (e.g., a changelog markdown file or CMS).

---

## 7. Newsletter (/go/newsletter)

### Concept

Newsletter subscription management separate from page watches. `/go/newsletter` handles subscribe/unsubscribe/preferences.

### Contract

```
POST /go/newsletter/subscribe
{ "email": "user@example.com", "lists": ["weekly-digest", "release-notes"] }

POST /go/newsletter/unsubscribe
{ "email": "user@example.com", "lists": ["weekly-digest"] }

GET /go/newsletter/preferences?email=user@example.com
→ { "subscriptions": ["release-notes"], "available": ["weekly-digest", "release-notes", "security-alerts"] }
```

### UI Integration

Could be a standalone form or part of notification-wc panel settings. Likely a separate component (`newsletter-form` or similar) since it's a form pattern, not a notification pattern.

---

## 8. Email Relay (/go/email)

### Contract

```
POST /go/email
{
  "to": "user@example.com",
  "template": "page-watch-update",
  "data": {
    "pageTitle": "Getting Started",
    "pageUrl": "/docs/getting-started",
    "changeDescription": "Section 3 rewritten"
  }
}
→ { "status": "queued", "id": "msg_xyz" }
```

VB provides the contract. Developer implements with Sendgrid, Postmark, Resend, SES, or self-hosted SMTP. Reference implementations provided.

### Connection to Notifications

- Page watch detects change → server creates notification AND sends email
- Email contains link back to page + "manage subscriptions" link
- User can unsubscribe from notification panel or email link

---

## 9. Broader /go/ Service Vision

Beyond notifications, the /go/ convention + VBService class enables swappable backends for all VB components that need a server:

| Component | Currently | With /go/ |
|-----------|-----------|-----------|
| `chat-window` | Hardcoded `endpoint` attr | VBService('chat') or VBService('ai') |
| `review-surface` | RestAdapter with direct URL | RestAdapter delegates to VBService |
| `card-list` | Direct `src` URL | Optional VBService resolution |
| `site-search` (future) | — | VBService('search') |
| `contact-form` (future) | — | VBService('email') |
| `geo-map` | Direct tile URL | VBService('tiles') or keep direct |

The value: swap Sendgrid for Postmark, Algolia for Meilisearch, or OpenAI for Anthropic by changing one `VBService.configure()` call. No component code changes.

### Why This Matters (The Lock-in Problem)

Modern web dev ties projects directly to third-party services. Changing email providers means finding every `fetch('https://api.sendgrid.com/...')` in your codebase. The /go/ convention + VBService creates one indirection layer:

```
Component → VBService('email') → /go/email → [your implementation] → Sendgrid/Postmark/SES
```

The component never knows or cares what's behind `/go/email`. The developer implements it once, swaps the implementation when needed. VB provides the contract and reference implementations for common providers.

---

## 10. Implementation Phases

### Phase 1: VBStore — Unified Storage

**Effort**: Medium  
**Creates foundation for everything else**

Deliverables:
- `src/lib/vb-store.js` — VBStore class with namespace/key API
- Async API (await-based) for future IndexedDB/network swap
- Key format: `vb:{namespace}:{key}`, value envelope: `{ data, timestamp }`
- `clearAll()` for "clear all VB data" use case
- Unit tests
- Doc page

Files to create:
- `src/lib/vb-store.js`
- `tests/unit/vb-store.test.js`

### Phase 2: VBService — Service Abstraction

**Effort**: Small-Medium

Deliverables:
- `src/lib/vb-service.js` — VBService class with configure, resolve, get/post/patch/delete
- Error normalization (VBServiceError)
- /go/ convention documentation (reserved names, contracts)
- Unit tests

Files to create:
- `src/lib/vb-service.js`
- `tests/unit/vb-service.test.js`
- `site/src/docs/services/` (doc page)

### Phase 3: notification-wc — Banner Mode

**Effort**: Small

Deliverables:
- `notification-wc` with `mode="banner"` support
- Uses VBStore for dismiss persistence
- Variants, position, expires
- Progressive enhancement (works without JS)
- Styles, demo, docs, api.json

Files to create:
- `src/web-components/notification-wc/logic.js`
- `src/web-components/notification-wc/styles.css`
- `src/web-components/notification-wc/api.json`
- `src/web-components/notification-wc/static.html`

Files to modify:
- `src/web-components/index.js` — register
- `src/main.css` — import styles
- `admin/future-wc.md` — move from wishlist

### Phase 4: notification-wc — Panel Mode

**Effort**: Medium-Large

Deliverables:
- Bell icon + badge count
- Drawer/popover with notification list
- Static HTML notifications (progressive enhancement)
- Read tracking via VBStore
- Dynamic fetch via VBService('notify') with optional polling
- JSON feed via `src` attribute
- Toast integration (`toast-new` attribute)
- "Mark all as read", dismiss, notification type icons
- Events

Files to modify:
- `src/web-components/notification-wc/logic.js`
- `src/web-components/notification-wc/styles.css`

### Phase 5: Page Watch

**Effort**: Medium

Deliverables:
- `data-watch-page` attribute in page-tools
- Client-side content hash comparison (FNV-1a)
- Watch list in VBStore('watches')
- Integration with notification-wc (injects watch notifications)
- Server-side path via VBService('notify') POST /subscribe

Files to create:
- `src/utils/page-watch-init.js`

Files to modify:
- `src/web-components/page-tools/logic.js`
- `src/main.js` — lazy-load if `[data-watch-page]` present

### Phase 6: Migrate Existing Components to VBStore + VBService

**Effort**: Medium

Deliverables:
- Migrate consent-banner, highlights-init, autosave-init, theme-manager, settings-panel, review-surface, split-surface, environment-manager to VBStore
- Migrate chat-window, review-surface RestAdapter to VBService
- Migration reads: check VBStore first, fall back to old localStorage key
- Remove old localStorage code after migration period

### Phase 7: /go/email, /go/feed, /go/newsletter Contracts + Reference Implementations

**Effort**: Medium

Deliverables:
- JSON schema contracts for /go/email, /go/feed, /go/newsletter
- Reference implementation: Cloudflare Worker stubs
- Reference implementation: Express middleware stubs
- Doc pages for each service contract
- Email notification opt-in for page watches

---

## 11. Verification

### Phase 1 (VBStore)
- Unit tests: set/get/remove/list/clear/clearAll, expiry, namespacing
- Verify async API works with localStorage backend
- `npm test` passes

### Phase 2 (VBService)
- Unit tests: configure, resolve, get/post/patch/delete, error normalization
- Test against mock /go/ endpoint
- `npm test` passes

### Phase 3 (Banner)
- Demo: banner shows, dismiss persists across reload
- Verify VBStore key created correctly
- Expires: banner re-shows after configured days
- Works without JS (visible as static HTML)
- `npm run conformance` passes

### Phase 4 (Panel)
- Bell icon renders, badge shows unread count
- Drawer opens/closes, notifications render with types and timestamps
- Read state persists via VBStore
- Static HTML notifications enhanced with JS
- Dynamic fetch from mock /go/notify endpoint
- Events fire correctly
- `npm run test:components` passes

### Phase 5 (Page Watch)
- Watch button toggles, state persists in VBStore
- Content change detected → notification appears in panel
- Watch list viewable in notification panel

### Phase 6 (Migration)
- All components still work after VBStore migration
- Old localStorage keys cleaned up
- VBStore.clearAll() removes everything

### Phase 7 (Contracts)
- JSON schemas validate request/response shapes
- Reference implementations handle happy path
- Doc pages complete with examples

---

## 12. Sources

- [Carbon Design System — Notification Pattern](https://carbondesignsystem.com/patterns/notification-pattern/) — Notification taxonomy (inline, toast, banner, actionable, callout, modal)
- [PatternFly — Notification Drawer](https://www.patternfly.org/components/notification-drawer/design-guidelines/) — Bell icon + drawer design guidelines
- [PatternFly — Notification Badge](https://www.patternfly.org/components/notification-badge/design-guidelines/) — Badge count patterns
- [How to Design a Notification Center (UX Collective)](https://uxdesign.cc/notification-center-7ec3d41efb10) — Notification center UX research
- [Notification System Design (MagicBell)](https://www.magicbell.com/blog/notification-system-design) — Architecture and best practices
- [A Comprehensive Guide to Notification Design (Toptal)](https://www.toptal.com/designers/ux/notification-design) — Design patterns overview
- [Sam Newman — Backends for Frontends](https://samnewman.io/patterns/architectural/bff/) — BFF pattern for swappable backends
- [AWS — Backends for Frontends Pattern](https://aws.amazon.com/blogs/mobile/backends-for-frontends-pattern/) — Service abstraction architecture
- [Beamer — Changelog Tool](https://www.getbeamer.com/changelog) — "What's new" notification widget pattern
- [Sleekplan — Changelog Notifications](https://help.sleekplan.com/en/articles/8050522-changelog-notifications-keeping-your-customers-informed) — Changelog notification UX
- [MDN — Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) — Web Push notification standards
- [MDN — Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) — Service worker proxy patterns
- [Using Service Worker as an Auth Relay (ITNEXT)](https://itnext.io/using-service-worker-as-an-auth-relay-5abc402878dd) — SW as middleware pattern
- [RxDB — LocalStorage Article](https://rxdb.info/articles/localstorage.html) — Unified storage abstraction patterns
- [Mozilla — DataStore Abstraction Layer](https://blog.mozilla.org/webdev/2011/03/07/datastore-an-abstraction-layer-for-storing-data-and-processing-requests/) — Centralized storage API design
- [Improving Medium's Bookmark Feature (UX Collective)](https://uxdesign.cc/improving-mediums-bookmark-feature-ux-case-study-522470182faa) — Bookmark + watch UX analysis
- [VB Server-Side Service Facade](admin/r-n-d/server-side-service-facade.md) — Existing VB research on first-party proxy pattern
- [html-star](https://github.com/ProfPowell/html-star) — Hypermedia framework; handles HTML transport (SSE, polling, swap) independent of VBService
