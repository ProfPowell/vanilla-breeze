# <content-swap>

Two-face content toggle with accessible state management. The hidden face is made inert; with no [data-swap] triggers a real toggle button is generated (visually hidden until focused) and surface clicks swap for pointer users. Also available as the [data-swap] attribute form on any element with [data-face] children.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/content-swap/
- Vanilla Breeze 0.7.4

## Example

```html
<content-swap transition="flip">
  <div data-face="front">
    <p>Front content visible by default.</p>
  </div>
  <div data-face="back">
    <p>Back content revealed on swap.</p>
  </div>
</content-swap>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `transition` | `flip`, `flip-vertical`, `fade`, `slide-left`, `slide-up`, `scale` | `flip` | Transition effect between faces. The attribute form uses data-transition. |
| `swapped` | boolean |  | Showing the back face. Reflected by the runtime; may be set or removed by authors at any time and inert follows it. The attribute form uses data-swapped. |
| `card` | boolean |  | Apply layout-card visual shell (pair with data-variant: elevated, outlined, ghost) |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-face` | direct child | `front`, `back` |  | Marks the front and back faces |
| `data-swap` | button (any descendant) | boolean |  | Explicit swap trigger. When present, the surface is not clickable and no toggle is generated. |
| `data-swap-toggle` | button (direct child) | boolean |  | Toggle used when there are no data-swap triggers; generated with the text "Show back" if absent. Author one to set the label. Receives aria-pressed. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `content-swap:swap` | `{ swapped: boolean, source: 'pointer' \| 'keyboard' \| 'api' }` | Fired after the faces swap; source is what caused it |

## Methods

| Method | Description |
| --- | --- |
| `flip()` | Show the back face |
| `unflip()` | Show the front face |
| `toggle()` | Toggle between faces |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `swapped` | `boolean` | Get or set whether the back face is showing |
| `flipped` | `boolean` | Alias for swapped |

## Accessibility

- Pattern: Button
- You provide: Explicit [data-swap] triggers should be <button> elements with a text label (any other element is given role="button" and tabindex="0"); without triggers a "Show back" toggle button is generated
- The component manages: `inert`, `aria-pressed`, `role="button"`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Swap faces and move focus to the first control on the face now showing | Focus on a [data-swap] trigger (native behaviour of a button or link; handled by the component on other elements) |
| `Enter` / `Space` | Swap faces and keep focus on the toggle | Native behaviour of button (the generated or authored data-swap-toggle) |
