# <activity-feed>

WAI-ARIA Feed timeline of user actions. Author renders <article data-activity> children timestamped with data-time or an authored <time datetime> child; component decorates with relative-time badges, optional date grouping, optional infinite-scroll sentinel (aria-busy + done() handshake), and per-entry avatar / icon left-rail.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/activity-feed/
- Vanilla Breeze 0.7.4

## Example

```html
<activity-feed aria-label="Recent activity">
  <article data-activity data-time="2026-05-14T10:00:00Z">
    <a href="/users/ada">Ada</a> commented on <a href="/issues/482">issue #482</a>
  </article>
  <article data-activity data-time="2026-05-14T09:30:00Z">
    <a href="/users/bob">Bob</a> opened <a href="/issues/485">issue #485</a>
  </article>
</activity-feed>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `aria-label` | string |  | Region label (default "Recent activity") |
| `data-group` | string |  | none (default) \| day \| week — date headings between entries |
| `data-infinite` | boolean |  | Adds an IntersectionObserver sentinel; emits activity-feed:load-more when reached and sets aria-setsize="-1" on entries. Remove the attribute to end the feed (sentinel removed, real aria-setsize, aria-busy cleared). |
| `data-empty-text` | string |  | Text shown when the feed has zero entries (default "No recent activity") |
| `role` |  |  | Managed: "feed" while the feed has entries, "group" while empty (so the empty-state text is a valid child). An author-set role other than feed/group is left alone. |
| `aria-busy` | string |  | Managed: "true" from activity-feed:load-more until detail.done() is called, new entries arrive, or data-infinite is removed. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-activity` | article | boolean |  | Marks an article as a feed entry |
| `data-time` | article | string |  | ISO-8601 timestamp; renders as relative time. Alternatively author a direct-child <time datetime> (works without JS and is upgraded in place); data-time wins if both are present |
| `data-activity-avatar` | article | string |  | Avatar URL — renders <user-avatar> in the left rail |
| `data-activity-icon` | article | string |  | icon-wc name — renders <icon-wc> in the left rail (alternative to avatar) |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `activity-feed:load-more` | `{ done: () => void }` | Fires when the infinite-scroll sentinel comes into view (at most one outstanding request). detail.done() ends the busy state and re-arms the sentinel; appending entries or removing data-infinite also ends it. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `addEntry` | `(data, opts?) => HTMLElement` | Append (or prepend) an entry from data |
| `removeEntry` | `(entry) => void` | Remove a single entry element |
| `clear` | `() => void` | Remove every entry |
| `entries` | `HTMLElement[]` | Snapshot array of the current entry elements (a new array on each read, not live) |
| `loading` | `boolean` | Read-only. True while a load-more is outstanding (mirrors aria-busy) |

## Accessibility

- Pattern: Feed
- You provide: An <article data-activity> for each entry, and an aria-label on the feed when the default "Recent activity" does not describe it
- The component manages: `role="feed"`, `role="group"`, `aria-label`, `aria-busy`, `aria-labelledby`, `aria-describedby`, `aria-posinset`, `aria-setsize`, `aria-hidden`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `PageDown` | Move focus to the next entry | Focus on or inside an entry |
| `PageUp` | Move focus to the previous entry | Focus on or inside an entry |
| `Ctrl+End` | Move focus to the first focusable element after the feed | Focus on or inside an entry |
| `Ctrl+Home` | Move focus to the last focusable element before the feed | Focus on or inside an entry |
