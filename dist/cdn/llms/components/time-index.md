# <time-index>

Interactive changelog/timeline component: relative dates, an order select, a version filter and a recently-updated-pages feed

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/time-index/
- Vanilla Breeze 0.7.4

## Example

```html
<time-index>
  <ol class="changelog-entries">
    <li>
      <h3 class="version-header">
        <span class="version-tag">v2.1.0</span>
        <time datetime="2026-03-15">March 15, 2026</time>
      </h3>
      <ul>
        <li><mark class="new">New</mark> Added glossary-index component</li>
        <li><mark class="change">Change</mark> Updated theme picker layout</li>
        <li><mark class="fix">Fix</mark> Corrected nav scroll offset</li>
      </ul>
    </li>
    <li>
      <h3 class="version-header">
        <span class="version-tag">v2.0.0</span>
        <time datetime="2026-02-01">February 1, 2026</time>
      </h3>
      <ul>
        <li><mark class="new">New</mark> Launched site-map component</li>
        <li><mark class="remove">Remove</mark> Dropped legacy grid system</li>
      </ul>
    </li>
  </ol>
</time-index>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `versions` | boolean |  | Add a version filter select. Options come from each entry's data-version, own .version-tag text, or a v2-1-0 style id. |
| `updates-src` | string |  | URL of a JSON array of { title, href \| url, modified \| date } rendered as a recently-updated-pages feed. Only http(s) and relative links are kept. |
| `data-label-controls` | string | `Timeline controls` | Accessible name of the injected controls nav. |
| `data-label-order` | string | `Order` | Visible label of the order select |
| `data-label-newest` | string | `Newest first` | Order option for the authored order (taken to be newest first) |
| `data-label-oldest` | string | `Oldest first` | Order option for the reversed order |
| `data-label-version` | string | `Version` | Visible label of the version select |
| `data-label-filter` | string | `Filter by version` | Accessible name of the version select. |
| `data-label-all` | string | `All versions` | Text of the select's show-everything option. |
| `data-label-status` | string | `Showing {count} of {total} entries for {version}` | Polite live-region text after filtering; {count}, {total} and {version} are replaced. |
| `data-label-status-all` | string | `Showing all {total} entries` | Live-region text when the filter is cleared; {total} is replaced. |
| `data-label-recent` | string | `Recently updated pages` | Heading of the recently-updated-pages feed. |
| `data-timeline-controls` |  |  | Marks the injected controls nav |
| `data-recent-pages` |  |  | Marks the injected recently-updated-pages section |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-version` | li, article, section | string |  | Explicit version of an entry or release for the filter (wins over .version-tag text and the id convention). |

## Structure

| Child | Description |
| --- | --- |
| `.changelog-entries` | One container: its li/article/section children are the entries. One per release: the host's top-level children holding them are the releases. |

## Accessibility

- Pattern: Native form controls
- The component manages: `role="status"`, `aria-live`, `aria-label`, `aria-labelledby`, `hidden`
