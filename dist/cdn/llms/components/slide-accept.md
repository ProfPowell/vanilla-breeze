# <slide-accept>

Slide-to-confirm interaction. The inner .slide-handle is a role="slider" (aria-valuenow/-valuetext, aria-describedby hint); a tap, Enter, Space or End also confirms (WCAG 2.5.7 single-pointer alternative)

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Form-associated: takes part in form submission and validation.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/slide-accept/
- Vanilla Breeze 0.7.4

## Example

```html
<!-- The text content is the no-JS fallback and the default label -->
<slide-accept activated-label="Confirmed!">
  Slide to confirm
</slide-accept>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `label` | string |  | Track label and handle accessible name. Default: the authored text content, else "Slide to confirm". Observed |
| `activated-label` | string |  | Label (and handle aria-valuetext) after activation, announced through a polite live region (default: "Confirmed!"). Observed |
| `data-label-hint` | string |  | Screen-reader hint wired with aria-describedby (default: "Press Enter to confirm"). Observed |
| `data-label-required` | string |  | Validation message when required and not confirmed; {label} is replaced by the label (default: "{label} to continue."). Observed |
| `attention` | `shimmer`, `pulse` |  | Attention animation (off under reduced motion) |
| `threshold` | number | `90` | Drag activation threshold 0-100 |
| `name` | string |  | Form field name; the value is submitted only once activated |
| `value` | string | `on` | Submitted value once activated |
| `required` | boolean |  | valueMissing until activated, so the form cannot submit |
| `disabled` | boolean |  | Blocks drag, tap and keys (a disabled fieldset does the same); handle gets aria-disabled |
| `data-activated` | boolean |  | Present once confirmed |
| `data-dragging` | boolean |  | Present while the handle is being dragged |
| `transitioning` | boolean |  | Internal: present during the spring-back transition |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `slide-accept:accept` |  | Fired once on activation (drag past threshold, tap, Enter, Space or End) |
| `slide-accept:reset` |  | Fired after reset() (also on form reset when activated) |

## Methods

| Method | Description |
| --- | --- |
| `reset()` | Return the handle to the start, restore the label, clear the form value |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `activated` | `boolean` | Whether the component has been confirmed |

## Accessibility

- Pattern: Slider
- You provide: Text content that names the action; it becomes the slider's accessible name
- The component manages: `role="slider"`, `role="status"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`, `aria-label`, `aria-describedby`, `aria-disabled`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowRight` / `ArrowUp` | Move the handle forward by 5%, accepting once it passes the threshold (ArrowRight and ArrowLeft reversed in right-to-left) | Focus on the handle |
| `ArrowLeft` / `ArrowDown` | Move the handle back by 5% | Focus on the handle |
| `Shift+ArrowRight` / `Shift+ArrowUp` | Move the handle forward by 20% | Focus on the handle |
| `Shift+ArrowLeft` / `Shift+ArrowDown` | Move the handle back by 20% | Focus on the handle |
| `End` / `Enter` / `Space` | Accept immediately | Focus on the handle |
| `Home` | Return the handle to the start | Focus on the handle |
