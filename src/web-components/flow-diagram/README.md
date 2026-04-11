---
title: "Flow Diagram Specification"
component: flow-diagram
version: 1.0.0
status: stable
---

# Flow Diagram

User flow and sequence visualization using a progressively enhanced ordered list.

## Purpose

Renders an `<ol>` of steps as a connected node graph with typed shapes (start, action, decision, process, wait, end). Decisions support branching paths. Without JavaScript, the list renders normally.

Part of the **UX Planning Pack**.

## Static HTML Form

```html
<flow-diagram title="Login Flow">
  <ol>
    <li data-type="start">User visits login</li>
    <li data-type="action">Enter credentials</li>
    <li data-type="decision">Valid?
      <ol>
        <li data-branch="Yes">
          <ol>
            <li data-type="end">Dashboard</li>
          </ol>
        </li>
        <li data-branch="No">
          <ol>
            <li data-type="end">Show error</li>
          </ol>
        </li>
      </ol>
    </li>
  </ol>
</flow-diagram>
```

## Node Types

| Type | Shape | Color | Use |
|------|-------|-------|-----|
| `start` | Pill | Green | Entry point |
| `action` | Rounded rect | Blue | User or system action |
| `decision` | Rect | Amber | Yes/no branch point |
| `process` | Rect | Purple | Background process |
| `wait` | Dashed rect | Gray | Delay or pause |
| `end` | Pill | Red | Terminal state |

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Diagram heading |
| `src` | string | — | JSON data URL |
| `data-direction` | string | `"vertical"` | `vertical` or `horizontal` |
| `compact` | boolean | — | Reduced spacing |

## Child Attributes (on `<li>`)

| Attribute | Description |
|-----------|-------------|
| `data-type` | Node type: start, action, decision, process, wait, end |
| `data-annotation` | Note text below the node |
| `data-branch` | Branch label on decision children (e.g., "Yes", "No") |
