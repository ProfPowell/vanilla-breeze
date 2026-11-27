# <social-feed>

One stream of posts from the site's Bluesky, Mastodon and GitHub accounts in a scrolling region. Cook writes the first batch, a "More on" line and a state script inside it at build time; with JavaScript the element refreshes once per page view from the services' public APIs and loads more as the list scrolls. Without JavaScript the built entries are the whole feature.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/social-feed/
- Vanilla Breeze 0.7.4

## Example

```html
<social-feed accounts="bluesky:example.bsky.social,github:example" items="8" height="24rem"></social-feed>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `accounts` | string |  | Comma-separated account keys (service:handle, for example bluesky:example.bsky.social); default every visible Bluesky, Mastodon and GitHub account. A hidden account named here is included. Read by Cook at build time. |
| `tags` | string |  | Comma-separated hashtags without #, matched case-insensitively. Filters Bluesky and Mastodon; a block with tags shows no GitHub items. Read by Cook at build time. |
| `items` | number | `12` | First batch size, a whole number from 1 to 50; also the size of each batch loaded on scroll |
| `height` | string | `32rem` | Height of the scrolling list: a rem, em, px or vh length. Cook writes it as --social-feed-height. |
| `hide-counts` | boolean |  | Leave out reply, repost and like counts |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-id` | article[data-activity] | string |  | The item id (service:native id) used to dedupe entries and update counts |
| `data-service` | article[data-activity] | string |  | The entry's service: bluesky, mastodon or github |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `refreshed` | `Promise<void>` | Settles when this page view's refresh from the services has finished |

## Accessibility

- Pattern: A labelled, focusable scrolling region holding a WAI-ARIA feed (activity-feed) of articles
- The component manages: `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Tab` | Focus the scrolling list, then scroll it with the arrow keys | The activity-feed is in the tab order |
| `PageDown` / `PageUp` | Move between entries | Focus is on an entry (activity-feed) |
