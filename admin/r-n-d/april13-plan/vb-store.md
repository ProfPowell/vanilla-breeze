# VBStore — Unified Client-Side Storage

**Date**: 2026-04-13  
**Status**: Spec  
**Dependencies**: None (foundational)  
**Referenced by**: notification-wc.md, page-watch.md

---

## Problem

Every VB component manages its own `localStorage` independently:

| Component | Key | Shape |
|-----------|-----|-------|
| `consent-banner` | `consent-banner` | `{preferences, action, timestamp}` |
| `highlights-init` | `vb-highlights:{key}` | `{version, contentHash, highlights}` |
| `autosave-init` | `vb-autosave:{key}` | `{data, timestamp}` |
| `theme-manager` | `vb-theme` | Theme preferences object |
| `settings-panel` | `vb-extensions`, `vb-a11y-themes`, `vb-sticky` | Various |
| `review-surface` | `review-surface` | Pin array |
| `split-surface` | `split-surface:{key}` | Position value |
| `environment-manager` | `vb-env` | Environment preferences |

Each has its own read/write/expiry logic. Consequences:

- **No unified query**: Can't ask "what has VB stored?" or "how much storage is used?"
- **No unified clear**: Can't "clear all VB data" without knowing every key
- **No backend swap**: Changing to IndexedDB or server-backed storage means touching every component
- **Inconsistent patterns**: Some use timestamps, some don't. Some check expiry, some don't.

---

## Solution

A single `VBStore` class in `src/lib/vb-store.js` that all components use.

---

## API Design

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

---

## Internal Architecture

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

### Key Format

All VBStore keys are prefixed with `vb:` and namespaced:

```
vb:notifications:dismissed-v3
vb:highlights:page-1
vb:consent:banner
vb:theme:current
```

This makes it trivial to identify VBStore entries in DevTools and to implement `clearAll()` by scanning for the `vb:` prefix.

### Value Envelope

Every value is wrapped:

```json
{
  "data": { "...the actual value..." },
  "timestamp": 1713045600000
}
```

The timestamp enables expiry checking in `get()` via the `maxAge` option. Components don't manage timestamps themselves.

---

## Migration Strategy

Existing components keep working during migration. New components use VBStore from day one. Old components migrate one at a time:

1. **Add VBStore alongside existing code** — new writes go to VBStore
2. **Migration read** — `get()` checks VBStore first, falls back to old localStorage key
3. **Write to VBStore only** — stop writing to old key
4. **Remove old code** — clean up in a later release

### Migration Map

| Component | Old Key(s) | New Namespace | New Key |
|-----------|-----------|---------------|---------|
| `consent-banner` | `consent-banner` | `consent` | `banner` (or custom `persist` attr) |
| `highlights-init` | `vb-highlights:{suffix}` | `highlights` | `{suffix}` |
| `autosave-init` | `vb-autosave:{form-key}` | `autosave` | `{form-key}` |
| `theme-manager` | `vb-theme` | `theme` | `current` |
| `settings-panel` | `vb-extensions` | `settings` | `extensions` |
| `settings-panel` | `vb-a11y-themes` | `settings` | `a11y` |
| `settings-panel` | `vb-sticky` | `settings` | `sticky` |
| `review-surface` | `review-surface` | `reviews` | `{storage-key}` |
| `split-surface` | `split-surface:{key}` | `layout` | `split:{key}` |
| `environment-manager` | `vb-env` | `environment` | `preferences` |

---

## Files

| File | Purpose |
|------|---------|
| `src/lib/vb-store.js` | VBStore class |
| `tests/unit/vb-store.test.js` | Unit tests |

---

## Verification

- Unit tests: set/get/remove/list/clear/clearAll, expiry via maxAge, namespacing isolation
- Verify async API works correctly with localStorage backend
- Verify `clearAll()` removes all `vb:*` keys and nothing else
- `npm test` passes

---

## Cross-References

- `notification-wc.md` — Uses VBStore for dismiss state and read tracking
- `page-watch.md` — Uses VBStore for watch list persistence
