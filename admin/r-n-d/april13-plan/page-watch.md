# Page Watch — Bookmark + Watch for Content Changes

**Date**: 2026-04-13  
**Status**: Spec  
**Dependencies**: vb-store.md, notification-wc.md  
**Optional dependency**: vb-service.md (for server-side watching)

---

## Concept

Save a page reference and get notified when content changes. Inspired by Medium's bookmark — but instead of passive saving for later, it actively monitors for updates.

Distinct from GoodURL, which watches *outbound* links for health. Page watch monitors *internal* pages for content changes.

---

## Client-Side Detection (VBStore, no backend)

1. User clicks "Watch this page" in `page-tools`
2. Page URL + content hash (FNV-1a, borrowed from highlights-init) stored in VBStore namespace `watches`
3. On subsequent visits to any watched page, content hash is recalculated
4. If hash differs → notification injected into notification-wc via `notification-wc:new` event
5. VBStore entry updated with new hash

**Limitation**: Only detects changes when the user visits the page. Content could change and the user wouldn't know until they navigate there.

### Content Hashing

Reuse the FNV-1a hash function from `src/utils/highlights-init.js`. Hash the main content area (e.g., `<main>` or `<article>`), not the full page — avoids false positives from nav/footer/sidebar changes.

### VBStore Shape

```js
// VBStore namespace: 'watches'
// Key: URL path (e.g., '/docs/getting-started')
await VBStore.set('watches', '/docs/getting-started', {
  url: '/docs/getting-started',
  title: 'Getting Started',
  contentHash: 'a8f3c2b9',
  watchedAt: '2026-04-13T16:00:00Z',
  lastChecked: '2026-04-13T16:00:00Z',
  lastChanged: null
});
```

---

## Server-Side Detection (VBService via /go/notify)

For sites with a backend:

1. User clicks "Watch" → `POST /go/notify/subscribe` via VBService('notify')
2. Server periodically checks pages (content hash, ETag, Last-Modified)
3. On change → creates notification at `/go/notify`
4. notification-wc polls `/go/notify` and surfaces the watch notification
5. Optional: server sends email via `/go/email` if user opted in

### Subscribe Contract

See `service-contracts.md` for the full `/go/notify/subscribe` schema.

```
POST /go/notify/subscribe
{
  "url": "/docs/getting-started",
  "type": "page-watch",
  "notify": ["panel"],          // or ["panel", "email"]
  "email": "user@example.com"   // only if "email" in notify
}
→ { "id": "sub_abc123", "status": "active" }

DELETE /go/notify/subscribe/sub_abc123
→ { "status": "removed" }
```

---

## UI Trigger

Attribute on page-tools (keeps it simple):

```html
<page-tools>
  <button data-watch-page>Watch for updates</button>
</page-tools>
```

### Behavior

- Click toggles watch state (watch / unwatch)
- Visual indicator: filled eye icon (watching) vs outline eye icon (not watching)
- Button text updates: "Watching" vs "Watch for updates"
- State persisted in VBStore
- If VBService is configured, also subscribes/unsubscribes server-side

### Watch List

The user's watch list is viewable in the notification panel. notification-wc shows a "Watching" filter/tab that lists all watched pages with their status:

- Page title + URL
- Last checked date
- "Changed" badge if content updated since last visit
- Unwatch button

---

## Lazy-Loading

In `src/main.js`, page-watch is lazy-loaded only when the trigger is present:

```js
if (document.querySelector('[data-watch-page]')) {
  import('./utils/page-watch-init.js');
}
```

---

## Files

| File | Purpose |
|------|---------|
| `src/utils/page-watch-init.js` | Page watch initialization and hash comparison |

| File | Change |
|------|--------|
| `src/web-components/page-tools/logic.js` | Optional watch button support |
| `src/main.js` | Lazy-load if `[data-watch-page]` present |

---

## Verification

- Watch button toggles, state persists in VBStore across reload
- Content change detected → notification appears in notification-wc panel
- Watch list viewable in notification panel
- Unwatch removes from VBStore and notification panel
- Server-side subscribe/unsubscribe via VBService (when configured)

---

## Cross-References

- `vb-store.md` — Watch list persistence
- `notification-wc.md` — Injects `watch` type notifications, watch list UI
- `vb-service.md` — Server-side subscribe/unsubscribe via VBService('notify')
- `service-contracts.md` — /go/notify/subscribe contract
- `GOODURL.md` — Complementary but distinct: GoodURL watches outbound link health, page-watch monitors internal content changes
