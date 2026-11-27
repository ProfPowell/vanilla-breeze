# <share-wc>

Social share component: native Web Share button (falls back to copying the link), platform buttons, or enhanced slotted links; inside selection-menu, shares or copies the selected text as a quote.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/share/
- Vanilla Breeze 0.7.4

## Example

```html
<share-wc></share-wc>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `url` | string |  | URL to share (default: <link rel=canonical>, then location.href) |
| `title` | string |  | Share title (default: og:title, then document.title). Read from the attribute; the JS property is shareTitle. |
| `text` | string |  | Share description (default: meta description, then og:description) |
| `platforms` | string | `x,linkedin,bluesky,mastodon,whatsapp,email,copy` | Comma-separated platform list (x, twitter, facebook, linkedin, whatsapp, telegram, bluesky, mastodon, email, copy) or "native-only" |
| `variant` | `icon`, `label`, `icon-label` | `icon-label` | Icon only (label visually hidden but still the name), label only, or both |
| `size` | `s`, `m`, `l` | `m` | Button size |
| `label` | string | `Share` | Visible label (and accessible name) of the native share button |
| `color` | boolean |  | Brand colours on each platform button's border and icon (label text stays --color-text) |
| `mastodon-instance` | string | `mastodon.social` | Mastodon instance |
| `tier` | `native`, `platforms` |  | Force a tier instead of auto-detecting navigator.share (native without support resolves to hidden) |
| `data-tier-resolved` | `native`, `platforms`, `hidden`, `selection` |  | The tier the component rendered |
| `data-label-share-page` | string | `Share this page` | Accessible name of the share button group |
| `data-label-share-on` | string | `Share on {platform}` | Platform button name; {platform} is replaced by the platform label |
| `data-label-copy` | string | `Copy link` | Copy button label |
| `data-label-copied` | string | `Copied!` | Copy button label for 2s after copying |
| `data-label-link-copied` | string | `Link copied to clipboard` | Announced after the link is copied |
| `data-label-share-selection` | string | `Share selection` | Selection-menu button name |
| `data-label-selection-copied` | string | `Selection copied` | Announced after a selection quote is copied |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-platform` | a, button (slotted) | string |  | Marks a slotted link/button as a platform; "copy" copies the URL. {url}, {title}, {text} tokens in href are substituted (encoded). |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `share-wc:open` | `{ platform: string }` | A share was started (platform id or 'native') |
| `share-wc:success` | `{ platform: string }` | A share window opened, the native share resolved, or the link was copied ('copy') |
| `share-wc:error` | `{ platform: string, error?: Error }` | Native share failed (not cancelled) or the clipboard write failed |

## Methods

| Method | Description |
| --- | --- |
| `share` | Native tier: open the share sheet (copying the link if it fails). Other tiers: copy the link. Resolves true when shared or copied. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `url` | `string` | Shared URL; setting it wins over the attribute, re-substitutes slotted {url} tokens and survives reconnect |
| `shareTitle` | `string` | Shared title (named to avoid shadowing HTMLElement.title); same override rules as url |
| `text` | `string` | Shared description; same override rules as url |

## Accessibility

- Pattern: Native buttons in a named group
- The component manages: `role="group"`, `aria-label`, `aria-hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Share to the platform, copy the link or open the system share sheet | Native behaviour of button |
