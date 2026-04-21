# April 13 Plan — Notifications, /go/ Service Layer & VBStore

This directory contains the spec documents for VB's notification system, service abstraction layer, and unified storage — refactored from two monolithic documents (GOODURL.md and go-notifications-plan.md) into focused, cross-referenced specs.

## Document Map

```
go-convention.md          ← Foundation: the /go/ URL namespace
    │
    ├── vb-store.md       ← Foundation: unified client-side storage
    │
    ├── vb-service.md     ← Foundation: service fetch abstraction
    │       │
    ├── service-contracts.md  ← /go/notify, /go/feed, /go/email, /go/newsletter schemas
    │       │
    ├── notification-wc.md    ← Component: banner + panel modes
    │       │
    └── page-watch.md         ← Feature: bookmark + watch for content changes
```

## Dependency Graph

| Document | Depends On |
|----------|-----------|
| `go-convention.md` | Nothing (foundational) |
| `vb-store.md` | Nothing (foundational) |
| `vb-service.md` | go-convention.md |
| `service-contracts.md` | go-convention.md |
| `notification-wc.md` | vb-store.md, vb-service.md, service-contracts.md |
| `page-watch.md` | vb-store.md, notification-wc.md, (optionally) vb-service.md |

## Related Documents (Outside This Directory)

| Document | Relationship |
|----------|-------------|
| `admin/GOODURL.md` | Link stewardship system. Shares the /go/ namespace. Digest items flow into notification-wc as `stewardship` type. |
| `admin/r-n-d/server-side-service-facade.md` | Prior research on first-party proxy pattern. Influenced the /go/ convention. |
| `admin/r-n-d/virtual-scroll.md` | Unrelated. Virtual scrolling research from the same session. |

## Implementation Phases

| Phase | Spec | Deliverable | Effort |
|-------|------|-------------|--------|
| 1 | vb-store.md | VBStore class | Medium |
| 2 | vb-service.md + go-convention.md | VBService class + /go/ docs | Small-Medium |
| 3 | notification-wc.md | Banner mode | Small |
| 4 | notification-wc.md | Panel mode | Medium-Large |
| 5 | page-watch.md | Page watch | Medium |
| 6 | vb-store.md + vb-service.md | Migrate existing components | Medium |
| 7 | service-contracts.md | Endpoint contracts + reference implementations | Medium |

GoodURL phases are independent and defined in `admin/GOODURL.md`.

## Key Decisions

- **URL namespace**: `/go/` with reserved service names + shortlinks (documented, not enforced)
- **Storage**: Unified VBStore class — all components use it, single swap point
- **Service transport**: VBService wraps fetch independently of html-star
- **Service Worker**: No /go/ involvement yet — stays on static assets
- **GoodURL integration**: Digest items are a notification type, not a separate widget
