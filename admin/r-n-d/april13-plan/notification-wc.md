# notification-wc — Notification Component

**Date**: 2026-04-13  
**Status**: Spec  
**Dependencies**: vb-store.md, vb-service.md, go-convention.md  
**Referenced by**: page-watch.md, service-contracts.md

---

## Overview

A single component with two presentation modes:

| Mode | Attribute | Behavior |
|------|-----------|----------|
| **Banner** | `mode="banner"` | Full-width dismissible strip. Persistence via VBStore. |
| **Panel** | `mode="panel"` (default) | Bell icon with badge count. Opens drawer with notification list. |

Listed in `admin/future-wc.md` as "notification-center" — this is the implementation.

---

## Banner Mode

### Usage

```html
<notification-wc mode="banner" persist="site-update-v3" variant="info" position="top">
  <p>We've launched v3.0! <a href="/changelog">See what's new</a></p>
  <button value="dismiss">Dismiss</button>
</notification-wc>
```

### Behavior

- Shows on load if not previously dismissed (checks VBStore)
- Dismiss writes to VBStore namespace `notifications` with the `persist` value as key
- `expires="30"` re-shows after 30 days (uses VBStore's maxAge on read)
- Content is static HTML — works without JS as a visible element
- JS adds dismiss behavior and persistence check
- Variants: `info`, `warning`, `error`, `success` (maps to color/icon)
- Position: `top` (default), `bottom`
- Multiple banners allowed per page

### Attributes (Banner Mode)

| Attribute | Type | Default | Purpose |
|-----------|------|---------|---------|
| `mode` | string | `"panel"` | Set to `"banner"` for banner mode |
| `persist` | string | required | VBStore key for dismiss state |
| `variant` | string | `"info"` | `info`, `warning`, `error`, `success` |
| `position` | string | `"top"` | `top`, `bottom` |
| `expires` | number | none | Days before re-showing after dismiss |

### How It Differs from consent-banner

- No checkbox preferences — just message + dismiss
- Supports `expires` for timed re-show
- Multiple instances per page (consent-banner is one-per-page)
- Uses VBStore instead of direct localStorage
- Simpler API — no trigger, no granular options

---

## Panel Mode

### Usage

```html
<notification-wc mode="panel">
  <!-- Static notifications (progressive enhancement) -->
  <article data-id="release-3.0" data-type="update" data-date="2026-04-10">
    <h4>v3.0 Released</h4>
    <p>New notification system and service layer.</p>
    <a href="/changelog#v3">Read more</a>
  </article>

  <article data-id="maintenance" data-type="alert" data-date="2026-04-12">
    <h4>Scheduled Maintenance</h4>
    <p>Brief downtime Sunday 2am-4am UTC.</p>
  </article>
</notification-wc>
```

### Behavior

- Renders bell icon button (via `icon-wc` or inline SVG)
- Badge count shows unread notifications
- Click opens drawer/popover with notification list
- Notifications are `<article>` elements with structured data attributes
- Read state tracked via VBStore (namespace `notifications`, key `read-ids`)
- "Mark all as read" action
- Optional polling for dynamic notifications via VBService('notify')

### Attributes (Panel Mode)

| Attribute | Type | Default | Purpose |
|-----------|------|---------|---------|
| `mode` | string | `"panel"` | Panel mode (default) |
| `src` | string | none | URL to fetch notifications (e.g., `/go/notify` or `/go/feed`) |
| `poll` | number | none | Polling interval in ms (e.g., `300000` for 5 min) |
| `toast-new` | boolean | false | Surface new notifications as toasts via nearest `<toast-msg>` |
| `storage-key` | string | `"notifications"` | VBStore namespace for read state |

### Dynamic Notifications via VBService

```html
<notification-wc mode="panel" src="/go/notify" poll="300000">
  <!-- Static fallback content -->
</notification-wc>
```

When `src` is set:
1. Renders static `<article>` children immediately (progressive enhancement)
2. Fetches from VBService('notify') for additional/updated notifications
3. Merges static + dynamic, deduplicates by `data-id`/`id`
4. Polls at interval if `poll` attribute set (default: no polling)

---

## Notification Data Shape

### Static (HTML)

```html
<article data-id="release-3.0" data-type="update" data-date="2026-04-10">
  <h4>v3.0 Released</h4>
  <p>New notification system.</p>
  <a href="/changelog#v3">Read more</a>
</article>
```

### Dynamic (JSON from /go/notify or /go/feed)

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

---

## Notification Types

| Type | Icon | Use Case |
|------|------|----------|
| `update` | Package | "v3.0 Released" — changelog, release notes |
| `alert` | Alert-triangle | "Scheduled Maintenance" — urgent system messages |
| `watch` | Eye | "Docs: Getting Started updated" — page change (see `page-watch.md`) |
| `system` | Settings | "New version available" — framework-level |
| `message` | Mail | "New comment on your review" — user-to-user |
| `stewardship` | Shield | "3 broken links need attention" — GoodURL digest items |

### GoodURL Integration

GoodURL's daily digest (see `GOODURL.md` Part 9) surfaces link health items as `type: "stewardship"` notifications in the panel. Rather than building a separate `<good-url-digest>` widget, GoodURL digest items flow into notification-wc:

- GoodURL's digest Worker writes items to `/go/notify`
- notification-wc polls `/go/notify` and renders them alongside other notification types
- Stewardship notifications link to the GoodURL admin page or include inline actions

This means GoodURL Phase 4's `<good-url-digest>` component becomes a notification type rather than a standalone component.

---

## Integration with toast-msg

```html
<notification-wc mode="panel" toast-new>...</notification-wc>
```

When `toast-new` is present and a new notification arrives (via polling or static render), it fires a toast via the nearest `<toast-msg>` using the existing toast API. The notification lives in the panel for history; the toast is ephemeral awareness.

---

## Events

| Event | Detail | When |
|-------|--------|------|
| `notification-wc:new` | `{ notification }` | New notification received |
| `notification-wc:read` | `{ id }` | Marked as read |
| `notification-wc:dismiss` | `{ id }` | Dismissed |
| `notification-wc:open` | `{}` | Panel drawer opened |
| `notification-wc:close` | `{}` | Panel drawer closed |

---

## Component Files

```
src/web-components/notification-wc/
├── logic.js        # Main component (banner + panel modes)
├── styles.css      # Banner, panel, drawer, badge styles
├── api.json        # Component API definition
├── static.html     # Demo template
└── README.md       # Spec
```

### Files to Modify

| File | Change |
|------|--------|
| `src/web-components/index.js` | Register notification-wc |
| `src/main.css` | Import notification-wc styles |
| `admin/future-wc.md` | Move notification-center from wishlist to implemented |

---

## Verification

### Banner
- Demo: banner shows, dismiss persists across reload
- Verify VBStore key created correctly (`vb:notifications:{persist}`)
- Expires: banner re-shows after configured days
- Works without JS (visible as static HTML)
- `npm run conformance` passes

### Panel
- Bell icon renders, badge shows unread count
- Drawer opens/closes, notifications render with types and timestamps
- Read state persists via VBStore across reload
- Static HTML notifications enhanced with read tracking
- Dynamic fetch from /go/notify endpoint works
- Polling fetches at configured interval
- Toast integration fires correctly
- Events fire on all actions
- `npm run test:components` passes

---

## Cross-References

- `vb-store.md` — Dismiss persistence and read tracking
- `vb-service.md` — Dynamic notification fetch via VBService('notify')
- `go-convention.md` — /go/notify endpoint
- `service-contracts.md` — /go/notify JSON schema
- `page-watch.md` — Injects `watch` type notifications
- `GOODURL.md` — Digest items surface as `stewardship` type notifications
