# <qr-code>

QR code generator: black-on-white canvas with quiet zone, author children kept as the caption

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/qr-code/
- Vanilla Breeze 0.7.4

## Example

```html
<qr-code value="https://vanilla-breeze.com" data-caption="visible">
  <a href="https://vanilla-breeze.com">vanilla-breeze.com</a>
</qr-code>

<!-- No value attribute: the text content is encoded -->
<qr-code data-caption="visible">Hello, World!</qr-code>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `value` | string |  | The text/URL to encode. Falls back to the element's original text content. Reactive; removing it falls back to the text again. |
| `size` | number | `200` | Edge of the drawn box in CSS pixels, quiet zone included. Modules are a whole number of device pixels. Reactive. |
| `color` | string | `#000` | Module colour (any CSS colour). Opt-in; logs a console warning when the pair is inverted, low-contrast or translucent. Reactive. |
| `background` | string | `#fff` | Background colour, always painted, including the 4-module quiet zone. Reactive. |
| `error-correction` | `l`, `m`, `q`, `h`, `0`, `1`, `2`, `3` | `m` | Error-correction level: L (7%), M (15%, default), Q (25%), H (30%), or 0-3. Letters are case-insensitive (listed lower-case because html-validate matches enums lower-cased); other values warn and use M. Reactive. |
| `data-caption` | `visible` |  | Show the caption (the element's children) under the code. By default it is visually hidden but read by screen readers, and shown while a link inside it has focus. A plain-text caption that only repeats the value is hidden from screen readers while the canvas name carries the value. |
| `data-label-prefix` | string |  | Accessible name of the canvas (role=img). Without it the name is "QR code: " followed by the encoded value (cut to 200 characters with an ellipsis when longer). With it, this text is the name and the encoded value is the canvas's aria-description. |
| `data-label-copied` | string | `QR code copied` | Screen-reader announcement after copy() succeeds. |
| `data-error` | `capacity`, `encoding` |  | Set when no code could be drawn (the text is longer than the level holds, or cannot be encoded). The caption is then shown. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `qr-code:error` | `{ reason: 'capacity' \| 'encoding', value, errorCorrection: 'L' \| 'M' \| 'Q' \| 'H', message }` | Fired when the value cannot be encoded. No code is drawn and the caption (fallback) stays visible. |
| `qr-code:upgraded` |  | Fired once the element has upgraded (canvas and caption in place). |

## Methods

| Method | Description |
| --- | --- |
| `toDataURL(type?)` | Returns the code as a data URL (default image/png): opaque, quiet zone included. '' when no code is drawn. |
| `copy(options?)` | Copies the code to the clipboard as text/plain (the encoded value) + image/png. Falls back to text-only without ClipboardItem support. options.button gets data-state="copied" and a copy event. Resolves false when no code is drawn. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `value` | `string` | The encoded text. Setting it sets the value attribute; '' or null removes it. |

## Accessibility

- Pattern: Image
- You provide: A data-label-prefix when the code needs a name of its own; the encoded value is then its description
- The component manages: `role="img"`, `aria-label`, `aria-description`, `aria-hidden`, `hidden`
