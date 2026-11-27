# <color-picker>

Form-associated color picker with saturation/lightness area, hue slider, HEX/RGB/HSL/OKLCH inputs, preset swatches, Copy and EyeDropper

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/color-picker/
- Vanilla Breeze 0.7.4

## Example

```html
<form-field>
  <label for="brand">Brand color</label>
  <color-picker>
    <input type="color" id="brand" name="brand" value="#6366f1">
  </color-picker>
</form-field>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `name` | string |  | Form field name. A name on the inner input (the no-JS path) moves here on upgrade so exactly one value submits. |
| `disabled` | boolean |  | Disables the trigger, closes the panel and drops the value from submission. A disabled ancestor fieldset has the same effect. |
| `format` | `hex`, `rgb`, `hsl`, `oklch` | `hex` | Initial input/copy format. The Format selector inside the panel switches it at runtime. |
| `data-label-area-value` | string | `Saturation {s}%, lightness {l}%` | Template for the aria-valuetext of the saturation and lightness area; {s} and {l} are replaced with the saturation and lightness percentages. |
| `open` | boolean |  | Reflected while the panel is open |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | input | string |  | Submission name for the no-JS fallback. Moved to the host on upgrade (the host's own name wins if both are set). |

## Structure

| Child | Description |
| --- | --- |
| `<input type="color">` | Supplies the initial value (its value attribute is the form-reset target) and the no-JS fallback. Its <label for> names the trigger. |
| `<datalist>` | Preset swatches — one <option value="#hex">Name</option> per swatch |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `color-picker:change` | `{ hex, rgb: { r, g, b }, hsl: { h, s, l }, source: 'pointer' \| 'keyboard' \| 'api' \| 'internal' }` | Fired when the color changes. source is 'api' for .value assignments, 'pointer'/'keyboard' for the area and hue slider, 'internal' for text inputs, swatches and the EyeDropper. |
| `color-picker:open` |  | Fired when the panel opens |
| `color-picker:close` |  | Fired when the panel closes |

## Accessibility

- Pattern: Slider
- You provide: An <input type="color"> with a <label>
- The component manages: `role="dialog"`, `role="slider"`, `role="group"`, `aria-haspopup`, `aria-expanded`, `aria-label`, `aria-labelledby`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`, `aria-pressed`, `aria-hidden`, `tabindex`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Open or close the picker panel | Native behaviour of <button> (the trigger) |
| `ArrowRight` | Increase saturation by 1 | Focus on the saturation and lightness area |
| `ArrowLeft` | Decrease saturation by 1 | Focus on the saturation and lightness area |
| `ArrowUp` | Increase lightness by 1 | Focus on the saturation and lightness area |
| `ArrowDown` | Decrease lightness by 1 | Focus on the saturation and lightness area |
| `Home` | Set saturation to 0 | Focus on the saturation and lightness area |
| `End` | Set saturation to 100 | Focus on the saturation and lightness area |
| `PageUp` | Increase lightness by 10 | Focus on the saturation and lightness area |
| `PageDown` | Decrease lightness by 10 | Focus on the saturation and lightness area |
| `ArrowRight` / `ArrowUp` | Increase hue by 1 degree | Focus on the hue slider |
| `ArrowLeft` / `ArrowDown` | Decrease hue by 1 degree | Focus on the hue slider |
| `PageUp` | Increase hue by 10 degrees | Focus on the hue slider |
| `PageDown` | Decrease hue by 10 degrees | Focus on the hue slider |
| `Home` | Set hue to 0 degrees | Focus on the hue slider |
| `End` | Set hue to 360 degrees | Focus on the hue slider |
| `Shift+ArrowRight` / `Shift+ArrowLeft` / `Shift+ArrowUp` / `Shift+ArrowDown` | Change the value by 10 instead of 1 | Focus on either slider |
| `Escape` | Close the panel; focus returns to the trigger when it was inside the panel | Panel open and focus on the trigger or inside the panel |
