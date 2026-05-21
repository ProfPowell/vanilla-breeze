# VBService — Service Abstraction Layer

**Date**: 2026-04-13  
**Status**: Spec  
**Dependencies**: go-convention.md (for URL resolution)  
**Referenced by**: notification-wc.md, page-watch.md, service-contracts.md

---

## Purpose

A shared fetch client in `src/lib/vb-service.js`. Components that need JSON API data instantiate by role name and get the configured endpoint. Independent of html-star, which handles HTML fragment transport (SSE, polling, swap).

---

## Boundary with html-star

| Concern | html-star | VBService |
|---------|-----------|-----------|
| HTML fragment loading | Yes (data-swap, SSE, polling) | No |
| JSON API calls | No | Yes |
| Caching | HTML responses (SWR, sessionStorage) | Not in v1 |
| Auth headers | X-Requested-With only | Developer-configurable |
| Configuration | data-* attributes, meta tags, cascade | JS configure() call |

A page can use both: html-star for navigation and content swaps, VBService for component data (notifications, search results, chat messages). They don't depend on each other.

---

## API Design

```js
// Developer configures once (in their site's main.js or inline script)
VBService.configure({
  baseUrl: '/go',              // default
  headers: { 'X-Auth': '...' }, // global headers
  services: {                   // per-service URL overrides
    ai: 'https://api.openai.com/v1',
  }
});

// Component usage
const notify = new VBService('notify');
const messages = await notify.get('/messages');          // GET /go/notify/messages
await notify.post('/read', { ids: ['msg-1', 'msg-2'] }); // POST /go/notify/read
const page2 = await notify.get('/messages', { page: 2 }); // GET /go/notify/messages?page=2

// URL resolution (static method)
VBService.resolve('notify');  // → '/go/notify'
VBService.resolve('ai');      // → 'https://api.openai.com/v1' (overridden)
VBService.resolve('search');  // → '/go/search' (default)
```

### URL Resolution Order

1. Per-service override in `configure({ services: { role: url } })`
2. `baseUrl` + `/` + `role` (e.g., `/go/notify`)
3. Default: `/go/` + `role`

If no configuration exists at all, `VBService.resolve('notify')` returns `'/go/notify'` — sensible default, zero config required.

---

## Implementation Shape

```
src/lib/vb-service.js
├── VBService class
│   ├── static configure(config)     — set base URL, per-service overrides, global headers
│   ├── static resolve(role)         — return full URL for a service role
│   ├── constructor(role)            — create instance bound to a service
│   ├── get(path, params?)           — GET with query params
│   ├── post(path, body?)            → POST with JSON body
│   ├── patch(path, body?)           → PATCH with JSON body
│   ├── delete(path)                 → DELETE
│   └── Error normalization          → VBServiceError { status, body, role, path }
├── Headers: global config merged with per-request
└── Zero dependencies, pure fetch wrapper
```

### Error Normalization

```js
class VBServiceError extends Error {
  constructor(status, body, role, path) {
    super(`VBService(${role}): ${status} ${path}`);
    this.status = status;
    this.body = body;
    this.role = role;
    this.path = path;
  }
}
```

All non-2xx responses throw VBServiceError with a consistent shape regardless of backend.

---

## Key Constraints

- **Zero dependencies** — Pure fetch wrapper
- **No retry/queue in v1** — Components that need retry handle it themselves
- **No auth opinions** — Developer injects auth headers via `configure({ headers })`
- **Isomorphic-safe** — No DOM dependency; could work server-side
- **Fails gracefully** — No config? Defaults to `/go/{role}`. Server down? Throws VBServiceError.

---

## Existing Components to Migrate

These components currently do their own fetch. Migration to VBService makes them benefit from centralized configuration and the /go/ convention:

| Component | Current Pattern | With VBService |
|-----------|----------------|----------------|
| `chat-window` | `endpoint` attribute → direct fetch | VBService('ai') or VBService('chat') |
| `review-surface` | RestAdapter with hardcoded URL | RestAdapter delegates to VBService internally |
| `card-list` | `src` attribute → direct fetch | Optional VBService resolution |

Migration is non-breaking — components can accept either a direct `endpoint` attribute (current) or resolve via VBService (new). The attribute takes precedence for backward compatibility.

---

## Files

| File | Purpose |
|------|---------|
| `src/lib/vb-service.js` | VBService class |
| `tests/unit/vb-service.test.js` | Unit tests |
| `site/src/docs/services/` | Documentation page for /go/ convention + VBService API |

---

## Verification

- Unit tests: configure, resolve (default, override, baseUrl), get/post/patch/delete, error normalization
- Test against mock /go/ endpoint
- Verify no-config default works (`/go/{role}`)
- `npm test` passes

---

## Cross-References

- `go-convention.md` — Defines the /go/ URL namespace VBService resolves against
- `service-contracts.md` — JSON schemas for what each /go/ endpoint expects
- `notification-wc.md` — Uses VBService('notify') for dynamic notifications
- `page-watch.md` — Uses VBService('notify') for server-side subscriptions
