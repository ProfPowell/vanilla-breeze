# <brand-mark>

Brand/logo display. Authored content is never modified; the src attribute adds one owned <picture data-brand-mark-img> logo with optional dark-mode and compact variants

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/brand-mark/
- Vanilla Breeze 0.7.4

## Example

```html
<brand-mark>
  <img src="/logo.svg" alt="" />
  Acme Inc
</brand-mark>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | string |  | Logo image URL (light mode / default). Inserts an owned <picture data-brand-mark-img>; removing it removes only that element |
| `src-dark` | string |  | Dark-mode logo URL; follows <html data-mode>, then the resolved color-scheme, then prefers-color-scheme |
| `src-compact` | string |  | Compact/icon logo URL, used while compact-media matches (a <source> in the owned <picture>) |
| `compact-media` | string |  | Media query for src-compact (default: (width < 48rem), the --bp-m breakpoint) |
| `alt` | string |  | Logo text alternative. Image-only: becomes the accessible name and authored content is hidden from AT. Otherwise used only when there is no authored text |
| `wordmark` | boolean |  | Show authored content alongside the src logo (without it, authored content is visually hidden but stays the accessible name) |
| `height` | string |  | Logo height: a number (px) or a CSS length; sets --brand-mark-height |
| `data-size` | `s`, `l`, `xl` |  | Size variant |
| `data-stack` | boolean |  | Stack logo, name and tagline vertically |
| `data-brand-mark-img` |  |  | Marks the <picture> the component owns (inserted from src) |

## Accessibility

- Pattern: Image with text alternative
- You provide: Text content naming the brand, or an alt attribute when the logo image stands alone
- The component manages: `alt`
