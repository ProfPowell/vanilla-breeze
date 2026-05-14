---
title: activity-feed Component Plan
description: Timeline of user actions with relative timestamps. Author authors entries as `<article data-activity>` children; component wires `time-relative`, optional grouping by date, and an optional "load more" hook. Presentational and immutable per entry.
tags:
  - web-components
  - specification
  - social
  - vanilla-breeze
date: 2026-05-14
status: draft
---

# activity-feed Component Plan

## Why this exists

A vertical timeline of user actions ("Alice commented on issue #482, 2 hours ago"). Read-only, immutable per entry, often paginated. The component handles relative-time rendering, optional date grouping, and a "load more" event hook so authors can wire infinite scroll or a pagination button.

| Adjacent | Why not this |
|----------|--------------|
| `<comment-thread>` | Threaded discussion with replies + reactions + edit/delete. Activity is one-way and immutable. |
| `<recently-visited>` | Navigation-history specifically (browser-side). activity-feed is server-driven. |
| `<time-index>` | Changelog / version timeline with version filtering. activity-feed is per-user actions, not releases. |
| `<chat-thread>` (custom) | Real-time chat with grouping by sender. activity-feed is action-shaped (actor + verb + object). |

## Author API

```html
<activity-feed
  aria-label="Recent activity"
  data-group="day"      <!-- none (default) | day | week — date-based section headers -->
>
  <article data-activity data-time="2026-05-14T10:00:00Z">
    <a data-activity-actor href="/users/ada">Ada Lovelace</a>
    <span data-activity-verb>commented on</span>
    <a data-activity-object href="/issues/482">issue #482</a>
  </article>

  <article data-activity data-time="2026-05-14T09:30:00Z">
    <a data-activity-actor href="/users/bob">Bob</a>
    <span data-activity-verb>opened</span>
    <a data-activity-object href="/issues/485">issue #485</a>
  </article>

  <article data-activity data-time="2026-05-13T17:00:00Z">
    <a data-activity-actor href="/users/carol">Carol</a>
    <span data-activity-verb>merged</span>
    <a data-activity-object href="/pull/120">PR #120</a>
  </article>
</activity-feed>
```

Author owns the entry markup — VB doesn't dictate the verb vocabulary or object shapes. The component:

1. Adds a relative-time badge after each entry's content via `time-relative`
2. Optionally groups consecutive entries under date headings (data-group="day"|"week")
3. Optionally renders an actor avatar on the left (if a child has `data-activity-avatar` or the actor is a `<user-avatar>` element)
4. Wires keyboard nav between entries (arrow keys focus next/previous entry)
5. Emits `activity-feed:load-more` when an infinite-scroll sentinel comes into view (opt-in via `data-infinite`)

### Optional attributes

| Attribute | Purpose |
|-----------|---------|
| `data-group` | `none` (default) \| `day` \| `week` — date-based headings between entries |
| `data-infinite` | Adds an IntersectionObserver sentinel; emits `activity-feed:load-more` when reached |
| `data-empty-text` | Text shown when the feed has zero entries (default: "No recent activity") |

### Per-entry attributes

| Attribute | Purpose |
|-----------|---------|
| `data-time` | ISO-8601 timestamp; required |
| `data-activity-avatar` | Optional avatar URL (renders `<user-avatar>` on the left) |
| `data-activity-icon` | Optional `icon-wc` name (alternative to avatar) |

The `data-activity-actor` / `data-activity-verb` / `data-activity-object` attributes on inner elements are **descriptive only** — used for ARIA derivations, not required for rendering. Authors can structure entries however they like.

## Events

- `activity-feed:load-more` — fires when the infinite-scroll sentinel enters viewport. Author appends new entries; the sentinel re-arms automatically.

## Programmatic API

```js
const feed = document.querySelector('activity-feed');

feed.addEntry({
  time: '2026-05-14T13:00:00Z',
  html: '<a href="/users/dan">Dan</a> closed <a href="/issues/482">issue #482</a>',
  avatar: '/users/dan.jpg',  // optional
}, { prepend: true });

feed.removeEntry(articleEl);
feed.clear();
```

Authors who prefer can also just append `<article data-activity>` to the host directly — the component observes mutations and decorates new entries automatically.

## Accessibility

- Host: `role="feed"` per [WAI-ARIA Feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/)
- Each entry: `role="article"` (native) with `aria-posinset` + `aria-setsize` set by the component (so AT can announce "article 1 of 50")
- Date group headings: `role="heading"` `aria-level="3"`
- Time badges: `<time datetime>` with full timestamp in `title`
- Keyboard: ArrowDown/ArrowUp move focus between entries; PageDown/PageUp jump 5; Home/End jump to first/last (per WAI-ARIA Feed pattern)
- `prefers-reduced-motion`: any entrance animation falls back to a no-op fade

## CSS architecture

- Layer: `@layer components`
- Vertical stack of entries with optional left-rail (avatar / icon / connector line)
- Date headings sticky-by-default within the feed (configurable via custom prop)
- Tokens: `--color-surface`, `--color-border`, `--color-text-muted`, `--space-*`, `--radius-m`
- Print: relative-time badges show absolute time in print stylesheet

## Composition

- **Sidebar in a dashboard**: drop a feed with `data-infinite`, paginate via the event
- **User profile page**: scope to a single actor via the data the author renders
- **Mixed avatars + icons**: per-entry `data-activity-avatar` or `data-activity-icon` controls the left-rail visual

## File structure

```
src/web-components/activity-feed/
├── api.json
├── logic.js
├── styles.css
└── static.html
```

## Implementation checklist

- [ ] Scaffold; VBElement subclass
- [ ] On setup, scan `:scope > article[data-activity]`; decorate with relative-time badges via `time-relative`
- [ ] MutationObserver on direct children → decorate newly added entries
- [ ] `data-group="day"|"week"` inserts date headings between entries grouped by that resolution
- [ ] Optional `<user-avatar>` / `icon-wc` left-rail rendering when entry has `data-activity-avatar` / `data-activity-icon`
- [ ] WAI-ARIA Feed pattern: `role="feed"`, `aria-posinset` / `aria-setsize` per entry
- [ ] Keyboard nav: ArrowDown/Up, PageDown/Up, Home/End
- [ ] `data-infinite`: IntersectionObserver sentinel emitting `activity-feed:load-more`
- [ ] `addEntry` / `removeEntry` / `clear` imperative API
- [ ] Empty state with `data-empty-text`
- [ ] Register in `src/web-components/index.js` + `index.css` (full bundle, not core)
- [ ] Demo at `demos/examples/demos/activity-feed-dashboard.html` with `data-infinite` + mocked load-more
- [ ] Doc page with adjacency table (vs `comment-thread`, `recently-visited`, `time-index`, `chat-thread`)

## Open questions

- **Verb vocabulary** — should the component ship a recommended set of verbs (commented, opened, merged, etc.)? **No** — vocabulary is domain-specific. Cite a reference list in the doc page.
- **Server-rendered vs client-rendered entries** — both work via the MutationObserver path. No special API needed.
- **Long-form entries (e.g., a code-diff inside an entry)** — entries can contain anything; the component doesn't constrain the body.

## References

- `src/web-components/recently-visited/` — adjacent timeline (different scope)
- `src/web-components/time-index/` — adjacent timeline (different scope)
- `src/lib/time-relative.js` — relative-time formatting
- WAI-ARIA Feed Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/feed/
