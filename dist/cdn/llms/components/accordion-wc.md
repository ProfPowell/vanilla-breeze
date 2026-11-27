# <accordion-wc>

Accordion built on native details/summary with exclusive mode and transitions

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/accordion/
- Vanilla Breeze 0.7.4

## Example

```html
<accordion-wc>
  <details>
    <summary>What is Vanilla Breeze?</summary>
    <p>Vanilla Breeze is a layered HTML component system...</p>
  </details>
  <details>
    <summary>How does progressive enhancement work?</summary>
    <p>Components work without JavaScript first...</p>
  </details>
</accordion-wc>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `single` | boolean |  | Only allow one panel open at a time |
| `bordered` | boolean |  | Add borders between panels |
| `flush` | boolean |  | Remove inline padding on summaries and panels so content aligns with surrounding text |
| `compact` | boolean |  | Reduce spacing |
| `indicator` | `plus-minus`, `none`, `custom` |  | Expand/collapse indicator style |
| `transition` | `fade`, `slide`, `scale` |  | Panel transition animation |

## Structure

| Child | Description |
| --- | --- |
| `<details>` | One per accordion panel — native disclosure element |
| `<summary>` | Panel heading inside each <details> |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `accordion-wc:toggle` | `{ index, open }` | Fired when a panel opens or closes |
| `accordion-wc:panels-changed` | `{ panels, source: 'property' }` | Fired after the panels property rebuilds the accordion |

## Methods

| Method | Description |
| --- | --- |
| `open(index)` | Open the panel at index (out-of-range indexes are ignored) |
| `close(index)` | Close the panel at index |
| `toggle(index)` | Toggle the panel at index |
| `openAll()` | Open every panel (no-op in single mode) |
| `closeAll()` | Close every panel |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `panels` | `Array<{ id?, summary, content, open? }>` | Get the panel set as data, or assign one to rebuild the accordion |

## Accessibility

- Pattern: Accordion
- You provide: A <details> element with a <summary> for each panel; panels are region landmarks only when there are six or fewer
- The component manages: `role="region"`, `aria-expanded`, `aria-controls`, `aria-labelledby`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Open or close the panel | Native behaviour of <summary> |
| `ArrowDown` | Move focus to the next panel header, wrapping to the first | Focus on a panel header |
| `ArrowUp` | Move focus to the previous panel header, wrapping to the last | Focus on a panel header |
| `Home` | Move focus to the first panel header | Focus on a panel header |
| `End` | Move focus to the last panel header | Focus on a panel header |
