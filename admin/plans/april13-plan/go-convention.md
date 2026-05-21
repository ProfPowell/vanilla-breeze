# The /go/ Convention

**Date**: 2026-04-13  
**Status**: Spec  
**Dependencies**: None (foundational)  
**Referenced by**: vb-service.md, GOODURL.md, notification-wc.md, service-contracts.md, page-watch.md

---

## Overview

`/go/` is a single URL namespace on Vanilla Breeze sites serving two purposes:

- **Reserved names** → service relay endpoints (finite, documented list)
- **Link facades** → outbound link management via GoodURL (see `GOODURL.md`)
- **Everything else** → shortlink redirects (`/go/32adad`, `/go/my-article`)

Additionally, `/rss` is reserved at the site root for RSS feeds, and `/p/{id}` is reserved for GoodURL's permalink system.

---

## Reserved Service Names

These slugs are reserved for VB service endpoints. They **must not** be used as GoodURL curated link slugs or shortlink keywords.

| Path | Service | Purpose |
|------|---------|---------|
| `/go/notify` | Notifications | Push/poll notification delivery |
| `/go/email` | Email | Transactional email (contact forms, watch alerts, GoodURL digests) |
| `/go/feed` | Content Feed | Changelog, what's new, release notes (JSON format) |
| `/go/newsletter` | Newsletter | Newsletter subscription management |
| `/go/search` | Search | Site search relay (Algolia, Meilisearch, Pagefind, etc.) |
| `/go/ai` | AI/LLM | AI chat relay (keeps API keys server-side) |
| `/go/chat` | Chat | Live chat relay (Intercom, Crisp, custom) |
| `/go/webhook` | Webhooks | Incoming webhook receiver |
| `/go/auth` | Authentication | OAuth/session management relay |
| `/go/analytics` | Analytics | First-party analytics endpoint |
| `/go/storage` | Storage | File upload/asset management relay |

### Other Reserved Paths

| Path | Purpose |
|------|---------|
| `/rss` | RSS/Atom feed (root-level, not under /go/) |
| `/p/{id}` | GoodURL permalink system (permanent page identifiers) |

---

## Routing Priority

When a request arrives at `/go/{slug}`, the router resolves in this order:

1. **Reserved service name?** → Route to service handler (returns JSON)
2. **GoodURL link facade?** → 301 redirect to destination URL (from KV registry)
3. **Shortlink?** → 301 redirect to target
4. **None of the above** → 404

Reserved service names always win. This means GoodURL's auto-discovery and curated link registration must reject reserved names. The CI build should fail if a curated slug collides with a reserved name.

### How Services Differ from Facades

| Aspect | Service endpoint | Link facade |
|--------|-----------------|-------------|
| Response type | JSON (200) | 301 redirect |
| Accept header | `application/json` | Any |
| Purpose | API call from VBService | User navigation |
| Registration | Reserved list (this document) | GoodURL link registry |
| Example | `GET /go/notify/messages` | `GET /go/wcag-2.2` → 301 |

The router can distinguish by checking the reserved list first (fast, finite set). Alternatively, the Accept header (`application/json`) can serve as a signal, but the reserved list check is the primary mechanism.

---

## Why /go/?

- **Short, memorable, verb-like** — "go do this thing for me"
- **Doubles as link management home** — GoodURL facades, curated shortlinks, and service endpoints in one namespace
- **Won't collide with content** — `/services/` is common for org pages, `/api/` for API docs/endpoints
- **Precedent** — go-links at Google, Slack, and many organizations

### Why Not Separate Prefixes?

We considered `/api/` for services and `/go/` for links. The problem: developers who also serve an API would collide with `/api/`. Having one namespace is simpler — the reserved list is small and published. Everything else is shortlinks or link facades.

---

## Enforcement Policy

**Documentation only.** The reserved list is published in VB docs. VB does not enforce it in code at the component level. However:

- GoodURL's CI should reject curated link slugs that match reserved names
- A future link-shortener component should warn on collision but not block
- VBService.resolve() uses the reserved list for URL construction

---

## Developer Setup

The developer implements whatever lives behind each `/go/` endpoint. VB provides:

1. **This convention** — URL patterns and reserved names
2. **VBService** — client-side fetch abstraction (see `vb-service.md`)
3. **Service contracts** — JSON request/response schemas per endpoint (see `service-contracts.md`)
4. **Reference implementations** — Cloudflare Worker and Express stubs
5. **GoodURL** — full link stewardship system for the facade/redirect side (see `GOODURL.md`)

VB is agnostic to what's behind the endpoint — Sendgrid, Postmark, self-hosted SMTP, a Lambda, a Worker. That's the whole point.

### The Lock-in Problem This Solves

Modern web dev ties projects directly to third-party services. Changing email providers means finding every `fetch('https://api.sendgrid.com/...')` in your codebase. The /go/ convention + VBService creates one indirection layer:

```
Component → VBService('email') → /go/email → [your implementation] → Sendgrid/Postmark/SES
```

The component never knows or cares what's behind `/go/email`. The developer implements it once, swaps the implementation when needed.

---

## Cross-References

- `vb-service.md` — Client-side class that resolves against /go/ URLs
- `GOODURL.md` — Link stewardship system that owns /go/ facade routing
- `service-contracts.md` — JSON schemas for each reserved service endpoint
- `notification-wc.md` — Notification component that consumes /go/notify
- `page-watch.md` — Page watch that subscribes via /go/notify
