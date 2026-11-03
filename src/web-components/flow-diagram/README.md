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
<flow-diagram data-title="Login Flow">
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
| `data-title` | string | — | Diagram heading (labels the figure) |
| `data-heading-level` | 1–6 | `2` | Heading level for `data-title` |
| `src` | string | — | JSON data URL (`{ title?, steps }`) |
| `data-direction` | string | `"vertical"` | `vertical` or `horizontal` (follows writing direction) |
| `compact` | boolean | — | Reduced spacing (CSS only) |
| `data-label` | string | `"Flow diagram"` | Figure name when there is no `data-title` |
| `data-label-selected` | string | `"Selected: {text}"` | Live-region text on select |
| `data-label-steps-<plural>` | string | `"{count} step(s)"` | Step-count summary via `Intl.PluralRules` |
| `data-label-type-<type>` | string | `Start`, `Action`, … | Spoken type prefix per node type |

## JavaScript

- `.steps` — `{ type, text, annotation?, branches?: [{ label, steps }] }[]`; assignment writes the source `<ol>` and re-renders.
- Events: `flow-diagram:ready { nodeCount }` (every render), `flow-diagram:select { type, text }`, `flow-diagram:steps-changed { steps, source }`.

## Child Attributes (on `<li>`)

| Attribute | Description |
|-----------|-------------|
| `data-type` | Node type: start, action, decision, process, wait, end |
| `data-annotation` | Note text below the node |
| `data-branch` | Branch label on decision children (e.g., "Yes", "No") |
