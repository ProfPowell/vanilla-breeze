# Timeline Pattern

Vertical and horizontal timeline displays for chronological events, status tracking, and activity feeds. Perfect for order tracking, project history, and notifications.

- Documentation: https://vanilla-breeze.com/docs/patterns/data/timeline/
- Vanilla Breeze 0.7.4

## Overview

Timeline patterns display chronological sequences of events with visual connectors. They help users understand the progression of activities, track status changes, and review historical data.

Key features:
- Semantic `<ol>`/`<li>` structure for ordered events
- Scoped CSS with `@scope` for clean namespacing
- Vertical and horizontal layout options
- Status indicators via `data-status` attributes
- Integration with `activity-feed`, `tool-tip`, and `layout-reel`
- Semantic `<time>` elements for dates
- CSS custom properties for easy theming

## Simple Vertical Timeline

A clean vertical timeline with dots connecting each event. Uses semantic `<ol>`/`<li>` markup and CSS pseudo-elements for the line and markers. Ideal for project history, milestones, or changelog displays.

Timeline HTML structure:

```html
<ol class="timeline" aria-label="Project timeline">
  <li>
    <time datetime="2024-01-15">January 15, 2024</time>
    <h3>Project Launched</h3>
    <p>Initial release deployed to production with core features.</p>
  </li>

  <li>
    <time datetime="2024-02-01">February 1, 2024</time>
    <h3>Version 1.1 Released</h3>
    <p>Added user authentication and dashboard improvements.</p>
  </li>

  <li>
    <time datetime="2024-02-20">February 20, 2024</time>
    <h3>API Integration Complete</h3>
    <p>Third-party API integrations added for payment processing.</p>
  </li>
</ol>
```

Timeline CSS with @scope:

```css
.timeline {
  --timeline-line-color: var(--color-border);
  --timeline-dot-color: var(--color-interactive);
  --timeline-dot-size: 0.75rem;
  position: relative;
  padding-inline-start: var(--size-xl);
  list-style: none;
  margin: 0;
}

.timeline::before {
  content: '';
  position: absolute;
  left: calc(var(--timeline-dot-size) / 2);
  top: var(--size-2xs);
  bottom: var(--size-2xs);
  width: 2px;
  background: var(--timeline-line-color);
}

@scope (.timeline) {
  li {
    position: relative;
    padding-block-end: var(--size-l);
  }

  li::before {
    content: '';
    position: absolute;
    left: calc(-1 * var(--size-xl) + (var(--timeline-dot-size) / 2) - (var(--timeline-dot-size) / 2));
    top: var(--size-2xs);
    width: var(--timeline-dot-size);
    height: var(--timeline-dot-size);
    background: var(--timeline-dot-color);
    border-radius: 50%;
    border: 2px solid var(--color-surface);
    box-shadow: 0 0 0 2px var(--timeline-dot-color);
  }

  time { font-size: var(--font-size-s); color: var(--color-text-muted); }
  h3 { font-weight: var(--font-weight-semibold); margin: 0; }
  p { color: var(--color-text-muted); margin-block-start: var(--size-2xs); }
}
```

## Timeline with Status Icons

Each timeline entry displays a status icon instead of a simple dot. Uses `data-status` attributes for styling variants and `title` + `data-tooltip` on icons to show completion details on hover. Without JS, the native browser tooltip provides a fallback. Great for order tracking and process workflows.

Timeline with icons and tooltips:

```html
<ol class="timeline">
  <li>
    <span data-status="completed" aria-label="Completed"
          tabindex="0" title="Completed on March 20, 2024 at 9:00 AM" data-tooltip>
      <icon-wc name="check" size="sm"></icon-wc>
    </span>
    <layout-stack data-layout-gap="2xs">
      <time datetime="2024-03-20T09:00">March 20, 9:00 AM</time>
      <h3>Order Placed</h3>
      <p>Your order #12345 has been confirmed.</p>
    </layout-stack>
  </li>

  <li>
    <span data-status="pending" aria-label="Pending"
          tabindex="0" title="Expected delivery on March 24, 2024" data-tooltip>
      <icon-wc name="clock" size="sm"></icon-wc>
    </span>
    <layout-stack data-layout-gap="2xs">
      <time datetime="2024-03-24">Expected March 24</time>
      <h3>Out for Delivery</h3>
      <p>Package will be delivered to your address.</p>
    </layout-stack>
  </li>
</ol>
```

Status icon styles with data attributes:

```css
@scope (.timeline) {
  span[data-status] {
    position: absolute;
    left: calc(-1 * (var(--timeline-icon-size) + var(--size-m)));
    top: 0;
    width: var(--timeline-icon-size);
    height: var(--timeline-icon-size);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface);
    border: 2px solid var(--color-border);
  }

  span[data-status="completed"] {
    background: var(--color-success);
    border-color: var(--color-success);
    color: white;
  }

  span[data-status="pending"] {
    background: var(--color-warning);
    border-color: var(--color-warning);
    color: white;
  }

  span[data-status="warning"] {
    background: var(--color-error);
    border-color: var(--color-error);
    color: white;
  }

  span[data-status="scheduled"] {
    background: var(--color-interactive);
    border-color: var(--color-interactive);
    color: white;
  }
}
```

## Activity Feed

A compact feed-style timeline for notifications and activity logs, built on the `<activity-feed>` component: an icon (or avatar) rail, action descriptions with links, and relative timestamps. Suitable for dashboards and notification centers.

No custom CSS: `<activity-feed>` lays out each entry with its icon rail, turns the authored `<time>` into a relative timestamp (the authored text is the no-JS fallback), and wires the WAI-ARIA feed pattern. Use `data-activity-avatar="URL"` instead of an icon to show the actor's photo, and `data-group="day"` to add date headings.

Activity feed with activity-feed:

```html
<activity-feed aria-label="Recent activity">
  <article data-activity data-activity-icon="message-circle">
    <a href="#"><strong>John Doe</strong></a> added a comment on <a href="#">Issue #423</a>
    <time datetime="2026-07-06T08:30:00Z">Jul 6, 2026</time>
  </article>

  <article data-activity data-activity-icon="upload">
    <a href="#"><strong>Sarah Miller</strong></a> uploaded <a href="/files/design-mockup-v2.fig" download>design-mockup-v2.fig</a> to <a href="#">Project Alpha</a>
    <time datetime="2026-07-06T05:15:00Z">Jul 6, 2026</time>
  </article>
</activity-feed>
```

## Horizontal Timeline

A horizontal scrolling timeline using `layout-reel` for touch-friendly scroll-snap behavior. The `<ol>` uses `display: contents` so `<li>` items participate directly in the reel's flex layout. Ideal for project roadmaps and milestone tracking.

Horizontal timeline with layout-reel:

```html
<layout-reel data-layout-gap="m" data-layout-scrollbar data-layout-padding="s">
  <ol class="timeline horizontal" aria-label="Project milestones">
    <li data-status="completed">
      <time datetime="2024-01-15">Jan 15</time>
      <h3>Kickoff</h3>
      <p>Project initiated</p>
    </li>

    <li data-status="current">
      <time datetime="2024-03-01">Mar 1</time>
      <h3>Development</h3>
      <p>In progress</p>
    </li>

    <li data-status="upcoming">
      <time datetime="2024-04-15">Apr 15</time>
      <h3>Launch</h3>
      <p>Go live</p>
    </li>
  </ol>
</layout-reel>
```

Horizontal timeline styles:

```css
.timeline.horizontal {
  --timeline-dot-size: 0.75rem;
  --timeline-dot-color: var(--color-interactive);
  --timeline-line-color: var(--color-border);
  display: contents;
  list-style: none;
  margin: 0;
  padding: 0;
}

@scope (.timeline.horizontal) {
  li {
    position: relative;
    padding-block-start: calc(var(--timeline-dot-size) + var(--size-m));
    min-width: 12rem;
  }

  /* Connecting line */
  li::after {
    content: '';
    position: absolute;
    top: calc(var(--timeline-dot-size) / 2);
    left: 0;
    right: 0;
    height: 2px;
    background: var(--timeline-line-color);
  }

  /* Timeline dot */
  li::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: var(--timeline-dot-size);
    height: var(--timeline-dot-size);
    background: var(--timeline-dot-color);
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--timeline-dot-color);
    z-index: 1;
  }

  /* Status variants */
  li[data-status="completed"]::before { --timeline-dot-color: var(--color-success); }
  li[data-status="current"]::before { --timeline-dot-color: var(--color-interactive); }
  li[data-status="upcoming"]::before { --timeline-dot-color: var(--color-gray-400); }

  time, h3, p { text-align: center; }
}
```

## CSS Custom Properties

Timeline patterns use CSS custom properties for easy customization:

## Usage Notes

- Semantic markup: Use `<ol>`/`<li>` for ordered timelines - screen readers announce item count and position
- Scoped CSS: Use `@scope` with semantic element selectors (`li`, `time`, `h3`, `p`) instead of classes - cleaner HTML and better maintainability
- Semantic time elements: Always use `<time>` with a `datetime` attribute for machine-readable dates
- Status via data attributes: Use `data-status` instead of classes for state styling - cleaner separation of concerns
- Tooltips: Add `title` + `data-tooltip` to status icons for hover context (progressive enhancement — works without JS)
- User avatars: In an `<activity-feed>`, `data-activity-avatar` renders the actor's photo through `<user-avatar>`
- Horizontal scroll: Use `layout-reel` with `data-layout-scrollbar` for horizontal timelines with visible scrollbar
- Color semantics: Use consistent colors - `--color-success` for completed, `--color-warning` for pending, `--color-error` for issues

## Related

Metric cards and data displays

Horizontal scrolling container

Accessible feed of timestamped user actions

Avatar component with fallbacks

Tooltip web component
