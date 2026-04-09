---
title: "Work Item Specification"
component: work-item
version: 1.0.0
status: stable
---

# Work Item

General-purpose work unit card for tasks, bugs, chores, spikes, and features.

## Purpose

The engineering sibling of `<user-story>`. While user stories express product needs in agile format ("As a... I want... so that..."), work items represent the engineering work that implements those stories — or standalone work that doesn't map to any story (tech debt, bugs, ops, research).

Part of the **UX Planning Pack**. Works as a child of `<kanban-board>`, `<story-map>`, `<impact-effort>`, or standalone.

## Static HTML Form

```html
<work-item
  item-id="PROJ-42"
  title="Implement search API"
  type="task"
  status="in-progress"
  priority="high"
  assignee="Sarah Chen"
  estimate="5"
  story-ids="PROJ-101,PROJ-102">
  <p slot="description">Build the search endpoint.</p>
  <ul slot="checklist">
    <li>Schema design</li>
    <li>Implementation</li>
    <li>Tests</li>
  </ul>
</work-item>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `item-id` | string | — | Unique identifier (also sets HTML `id`) |
| `title` | string | — | Work item title |
| `type` | string | `"task"` | `task`, `bug`, `chore`, `spike`, `feature` |
| `priority` | string | `"medium"` | `critical`, `high`, `medium`, `low` |
| `status` | string | `"backlog"` | `backlog`, `to-do`, `in-progress`, `review`, `done`, `blocked` |
| `estimate` | string | — | Effort estimate |
| `assignee` | string | — | Assignee name (shown with avatar) |
| `story-ids` | string | — | Comma-separated linked story IDs |
| `detail` | string | `"full"` | `full`, `compact`, `minimal` |
| `compact` | boolean | — | Alias for `detail="compact"` |
| `src` | string | — | JSON data URL |

## Slots

| Slot | Description |
|------|-------------|
| `description` | Work item description |
| `checklist` | Subtasks or checklist |
| `notes` | Additional notes |

## Events

| Event | Detail |
|-------|--------|
| `work-item:ready` | `{ itemId, title, type, priority, status }` |
| `work-item:status` | `{ status, itemId }` |
| `work-item:priority` | `{ priority, itemId }` |

## Item Types

| Type | Icon | Use Case |
|------|------|----------|
| `task` | Checkbox square | Engineering implementation work |
| `bug` | Bug icon | Defect that needs fixing |
| `chore` | Wrench | Tech debt, maintenance, ops |
| `spike` | Lightbulb | Research, investigation, PoC |
| `feature` | Circle check | New user-facing capability |

## Cross-References

- `story-ids` links to `<user-story>` elements via fragment anchors
- `item-id` is auto-set as the HTML `id` for inbound cross-referencing
- Can be referenced by `<gantt-chart>` via `data-task-id` matching `item-id`
