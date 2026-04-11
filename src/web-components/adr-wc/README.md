---
title: "ADR Record Specification"
component: adr-record
version: 1.0.0
status: stable
---

# ADR Record

MADR-format Architectural Decision Record card with status tracking and cross-referencing.

## Purpose

Renders architectural decisions in a structured card format following the MADR (Markdown Architectural Decision Records) convention. Each card displays the decision context, the decision itself, and its consequences. ADR cards can be chained together via `supersedes` and `superseded-by` attributes to show decision evolution over time.

Part of the **UX Planning Pack**. Works standalone or inside `<kanban-board>`, `<story-map>`, or layout primitives.

## Static HTML Form

```html
<adr-record
  adr-id="ADR-001"
  title="Use PostgreSQL for persistence"
  status="accepted"
  date="2026-01-15"
  superseded-by="ADR-003">
  <p slot="context">We need a relational database for complex queries.</p>
  <p slot="decision">Use PostgreSQL 16 with pgvector extension.</p>
  <ul slot="consequences">
    <li>Good: mature ecosystem, strong SQL support</li>
    <li>Bad: operational overhead vs managed NoSQL</li>
  </ul>
</adr-record>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `adr-id` | string | -- | ADR identifier (also sets HTML `id`) |
| `title` | string | -- | Decision title |
| `status` | string | `"proposed"` | `proposed`, `accepted`, `deprecated`, `superseded` |
| `date` | string | -- | ISO date string |
| `supersedes` | string | -- | Comma-separated ADR IDs this supersedes |
| `superseded-by` | string | -- | Comma-separated ADR IDs that supersede this |
| `detail` | string | `"full"` | `full`, `compact`, `minimal` |
| `compact` | boolean | -- | Alias for `detail="compact"` |
| `src` | string | -- | JSON data URL |

## Slots

| Slot | Description |
|------|-------------|
| `context` | Why the decision was needed |
| `decision` | What was decided |
| `consequences` | Outcomes (positive and negative) |

## Events

| Event | Detail |
|-------|--------|
| `adr-record:ready` | `{ adrId, title, status }` |

## Status Colors

| Status | Color | Use Case |
|--------|-------|----------|
| `proposed` | Blue (#3b82f6) | Decision under discussion |
| `accepted` | Green (#22c55e) | Decision approved and active |
| `deprecated` | Amber (#f59e0b) | Decision no longer recommended |
| `superseded` | Gray (#6b7280) | Replaced by a newer decision |

## Cross-References

- `supersedes` links to older ADR elements via fragment anchors
- `superseded-by` links to newer ADR elements via fragment anchors
- `adr-id` is auto-set as the HTML `id` for inbound cross-referencing
