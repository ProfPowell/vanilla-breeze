# <social-links>

A row of profile links. Cook writes a plain list of links inside it at build time; the element supplies the icons, variants and spacing. An empty element takes no space.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/social-links/
- Vanilla Breeze 0.7.4

## Example

```html
<social-links variant="icon-label">
  <ul>
    <li><a href="https://bsky.app/profile/example.bsky.social"><span class="social-icon" data-service="bluesky" aria-hidden="true"></span><span>Bluesky</span></a></li>
  </ul>
</social-links>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `services` | string |  | Comma-separated service ids to show (bluesky, mastodon, github, linkedin, youtube, link); default all visible accounts. Read by Cook at build time. |
| `variant` | `icon`, `label`, `icon-label` | `icon-label` | Icon only (label visually hidden but still the name), label only, or both |
| `color` | boolean |  | Brand colours on the icons only (label text stays --color-text) |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-service` | span.social-icon | string |  | Service id that selects the icon: bluesky, mastodon, github, linkedin, youtube or link. |

## Accessibility

- Pattern: A list of native links

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` | Follow the link | Native behaviour of a |
