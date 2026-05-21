# Service Contracts — /go/ Endpoint Schemas

**Date**: 2026-04-13  
**Status**: Spec  
**Dependencies**: go-convention.md  
**Referenced by**: notification-wc.md, page-watch.md

---

## Overview

JSON request/response contracts for each `/go/` service endpoint. These define the API surface that VBService calls and that backend implementations must fulfill. VB provides the contracts and reference implementations; the developer chooses the backend.

---

## /go/notify — Notification Service

### GET /go/notify/messages

Fetch notifications for the current user/session.

**Query params**:
| Param | Type | Default | Purpose |
|-------|------|---------|---------|
| `since` | ISO datetime | none | Only return notifications after this timestamp |
| `type` | string | none | Filter by type (`update`, `alert`, `watch`, `stewardship`, etc.) |
| `unread` | boolean | none | Only return unread notifications |
| `limit` | number | 50 | Max items to return |

**Response** (200):
```json
{
  "items": [
    {
      "id": "release-3.0",
      "type": "update",
      "title": "v3.0 Released",
      "body": "New notification system.",
      "url": "/changelog#v3",
      "date": "2026-04-10T00:00:00Z",
      "read": false,
      "priority": "normal",
      "expires": null
    }
  ],
  "total": 12,
  "unread": 3
}
```

### PATCH /go/notify/messages/:id

Mark a notification as read or dismissed.

**Request**:
```json
{ "read": true }
```
or
```json
{ "dismissed": true }
```

**Response** (200):
```json
{ "id": "release-3.0", "read": true }
```

### POST /go/notify/subscribe

Subscribe to page watch or topic notifications.

**Request**:
```json
{
  "url": "/docs/getting-started",
  "type": "page-watch",
  "notify": ["panel"],
  "email": "user@example.com"
}
```

**Response** (201):
```json
{ "id": "sub_abc123", "status": "active" }
```

### DELETE /go/notify/subscribe/:id

Unsubscribe from a watch or topic.

**Response** (200):
```json
{ "status": "removed" }
```

### GET /go/notify/subscribe

List active subscriptions.

**Response** (200):
```json
{
  "subscriptions": [
    {
      "id": "sub_abc123",
      "url": "/docs/getting-started",
      "type": "page-watch",
      "notify": ["panel"],
      "createdAt": "2026-04-13T16:00:00Z"
    }
  ]
}
```

---

## /go/feed — Content Feed / Changelog

### GET /go/feed

Fetch changelog/what's-new entries. Returns the same data that could power `/rss` in a different format.

**Query params**:
| Param | Type | Default | Purpose |
|-------|------|---------|---------|
| `since` | ISO datetime | none | Only return entries after this date |
| `limit` | number | 20 | Max items |

**Response** (200):
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

`/rss` serves the same content as an RSS/Atom feed for feed readers. `/go/feed` serves it as JSON for the notification panel. Same data source, different formats. The developer can generate both from a changelog markdown file, CMS, or database.

---

## /go/newsletter — Newsletter Subscriptions

### POST /go/newsletter/subscribe

```json
{
  "email": "user@example.com",
  "lists": ["weekly-digest", "release-notes"]
}
```

**Response** (201):
```json
{ "status": "subscribed", "lists": ["weekly-digest", "release-notes"] }
```

### POST /go/newsletter/unsubscribe

```json
{
  "email": "user@example.com",
  "lists": ["weekly-digest"]
}
```

**Response** (200):
```json
{ "status": "unsubscribed", "lists": ["weekly-digest"] }
```

### GET /go/newsletter/preferences

**Query params**: `email` (required)

**Response** (200):
```json
{
  "subscriptions": ["release-notes"],
  "available": ["weekly-digest", "release-notes", "security-alerts"]
}
```

---

## /go/email — Transactional Email

### POST /go/email

Send a transactional email. Used by page-watch alerts, GoodURL digests, contact forms, etc.

**Request**:
```json
{
  "to": "user@example.com",
  "template": "page-watch-update",
  "data": {
    "pageTitle": "Getting Started",
    "pageUrl": "/docs/getting-started",
    "changeDescription": "Section 3 rewritten"
  }
}
```

**Response** (202):
```json
{ "status": "queued", "id": "msg_xyz" }
```

### Templates

The `template` field references a named template on the backend. VB defines template names and expected data fields; the developer implements rendering:

| Template | Data Fields | Used By |
|----------|-------------|---------|
| `page-watch-update` | pageTitle, pageUrl, changeDescription | Page watch (page-watch.md) |
| `goodurl-digest` | items, score, trend | GoodURL daily digest (GOODURL.md) |
| `contact-form` | name, email, message, subject | Contact forms |
| `newsletter-welcome` | email, lists | Newsletter subscription |

---

## Reference Implementations

VB provides starter implementations for common platforms:

### Cloudflare Workers

Each service maps to a Worker or Worker route. KV for storage, Email Workers for sending, Analytics Engine for metrics.

Location: `admin/reference-implementations/cloudflare/`

### Express Middleware

Each service maps to an Express router. Any database for storage, Nodemailer for email.

Location: `admin/reference-implementations/express/`

### Minimal Stubs

For development/testing: a single Node.js script that serves all `/go/` endpoints with in-memory storage. No persistence, no external services — just enough to develop against.

Location: `admin/reference-implementations/dev-stub/`

---

## Error Responses

All `/go/` service endpoints use consistent error responses:

```json
{
  "error": "not_found",
  "message": "Subscription sub_abc123 not found",
  "status": 404
}
```

Standard HTTP status codes. VBServiceError (see `vb-service.md`) wraps these into a consistent client-side error.

---

## Cross-References

- `go-convention.md` — Defines the /go/ URL namespace and reserved names
- `vb-service.md` — Client-side class that calls these endpoints
- `notification-wc.md` — Consumes /go/notify and /go/feed
- `page-watch.md` — Uses /go/notify/subscribe
- `GOODURL.md` — GoodURL digest uses /go/email for delivery
