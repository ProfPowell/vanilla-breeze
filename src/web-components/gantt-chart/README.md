---
title: "Gantt Chart Specification"
component: gantt-chart
version: 1.0.0
status: stable
---

# Gantt Chart

HTML-first project schedule visualization using native table, progress, and time elements.

## Purpose

Progressively enhances a semantic `<table>` into an interactive Gantt timeline. Without JavaScript, users see a fully readable data table with progress bars. With JavaScript, the component renders a visual timeline with positioned bars, milestones, groups, and a today marker.

Part of the **UX Planning Pack**.

## Static HTML Form

```html
<gantt-chart title="Q2 Roadmap" show-today show-progress>
  <table>
    <thead>
      <tr><th>Task</th><th>Start</th><th>End</th><th>Progress</th></tr>
    </thead>
    <tbody>
      <tr data-task-id="design" data-group="Design" data-status="in-progress">
        <td>Design system</td>
        <td><time datetime="2026-04-01">Apr 1</time></td>
        <td><time datetime="2026-04-15">Apr 15</time></td>
        <td><progress value="75" max="100">75%</progress></td>
      </tr>
    </tbody>
  </table>
</gantt-chart>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Chart heading |
| `src` | string | — | JSON data URL |
| `view` | string | `"auto"` | `auto`, `day`, `week`, `month`, `quarter` |
| `show-today` | boolean | — | Show today marker |
| `show-progress` | boolean | — | Show progress fill |
| `show-dependencies` | boolean | — | Draw dependency arrows |
| `compact` | boolean | — | Reduced spacing |

### Child Attributes (on `<tr>`)

| Attribute | Type | Description |
|-----------|------|-------------|
| `data-task-id` | string | Unique task ID |
| `data-group` | string | Swim lane group |
| `data-depends` | string | Comma-separated dependency IDs |
| `data-status` | string | `not-started`, `in-progress`, `done`, `blocked` |
| `data-assignee` | string | Assignee name |
| `data-milestone` | boolean | Render as diamond marker |
| `data-color` | string | Custom bar color |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `gantt-chart:ready` | `{ taskCount, dateRange }` | After render |
| `gantt-chart:task-click` | `{ task }` | Bar clicked |

## Failure Modes

- **No JavaScript:** Table renders normally with progress bars and time elements.
- **No CSS:** Table renders as default HTML table.
- **Keyboard Only:** Tab navigates bars; Enter triggers click event.
- **Screen Reader:** Original table is preserved (visually hidden) for full table semantics.

## Accessibility

- Original table stays in DOM (sr-only) for screen reader access
- Bars have `role="img"` with descriptive `aria-label`
- Bars are focusable with `tabindex="0"`
- `aria-live="polite"` region announces task selection
- `prefers-reduced-motion: reduce` disables transitions
- Print shows the original table, hides the visual chart

## CSS Custom Properties

| Token | Description |
|-------|-------------|
| `--gc-task-width` | Left panel width (default: 180px) |
| `--gc-row-height` | Row height (default: 36px) |
| `--gc-bar-color` | Per-bar color override |
