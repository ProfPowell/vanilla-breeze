# <icon-wc>

Inline SVG icon: fetches one sanitized SVG file per icon from <base-path>/<set>/<name>.svg, sized by preset and labelled for assistive tech

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/icons/
- Vanilla Breeze 0.7.4

## Example

```html
<icon-wc name="home"></icon-wc>
<icon-wc name="settings"></icon-wc>
<icon-wc name="user"></icon-wc>
<icon-wc name="search"></icon-wc>
<icon-wc name="mail"></icon-wc>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `name` | string |  | Icon name (required): the SVG filename without .svg |
| `set` | string |  | Icon set directory (lucide, phosphor, tabler, mage, bold, custom). Defaults to the nearest data-icon-set on the element, an ancestor or <html>, then lucide. Icons missing from the set fall back to Lucide. |
| `size` | `xs`, `sm`, `md`, `lg`, `xl`, `2xl` | `md` | Size preset relative to the font size: 1em, 1.25em, 1.5em, 2em, 2.5em, 3em |
| `label` | string |  | Accessible name for a meaningful icon (role="img"). Without it the icon is decorative (aria-hidden). Adding or removing it updates the icon live. |
| `base-path` | string |  | Icon base URL for this icon. Defaults to <html data-icon-path>, then the icons/ folder beside the Vanilla Breeze bundle the page loaded (so a CDN or subpath install needs no setting), then /cdn/icons. |
| `data-flip-rtl` | boolean |  | Mirror the glyph horizontally when the icon is in a right-to-left context (directional icons such as arrows and chevrons) |
| `data-animate` | `spin` |  | Spins the icon while an ancestor has [data-loading] (disabled under prefers-reduced-motion) |
| `data-error` | boolean |  | Present when the icon could not be loaded from the requested set or the Lucide fallback; light-DOM content is shown instead |
| `data-upgraded` | boolean |  | Present while the element is connected and upgraded |

## Structure

| Child | Description |
| --- | --- |
| `light-DOM content` | Optional fallback shown until the SVG loads and when it fails (data-error) |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | The name attribute |
| `set` | `string` | Resolved set: set attribute, else nearest data-icon-set, else lucide |
| `size` | `string` | The size attribute (default md) |
| `label` | `string \| null` | The label attribute |
| `basePath` | `string` | Resolved base URL: base-path attribute, else <html data-icon-path>, else /cdn/icons |
| `iconPath` | `string` | URL of the requested icon file (before any Lucide fallback) |

## Accessibility

- Pattern: Image
- You provide: A label attribute when the icon conveys meaning on its own; without it the icon is hidden from assistive technology
- The component manages: `role="img"`, `aria-label`, `aria-hidden`
