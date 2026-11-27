# <reaction-bar>

GitHub-style emoji reaction picker. Persistent bar of reaction chips with counts + a trigger that opens a curated palette popover. Composes pop-over for the palette surface.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/reaction-bar/
- Vanilla Breeze 0.7.4

## Example

```html
<reaction-bar aria-label="Reactions to comment 482">
  <button data-reaction="thumbsup" data-label="Thumbs up" data-count="3" data-mine>👍</button>
  <button data-reaction="rocket"   data-label="Rocket"    data-count="2">🚀</button>
  <template data-palette>
    <button data-reaction="thumbsup"   data-label="Thumbs up">👍</button>
    <button data-reaction="thumbsdown" data-label="Thumbs down">👎</button>
    <button data-reaction="laugh"      data-label="Laugh">😄</button>
    <button data-reaction="hooray"     data-label="Hooray">🎉</button>
    <button data-reaction="confused"   data-label="Confused">😕</button>
    <button data-reaction="heart"      data-label="Heart">❤️</button>
    <button data-reaction="rocket"     data-label="Rocket">🚀</button>
    <button data-reaction="eyes"       data-label="Eyes">👀</button>
  </template>
</reaction-bar>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `aria-label` | string |  | Toolbar label (default: data-label-toolbar, then "Reactions"). Also names the palette group. |
| `data-trigger-icon` | string |  | Text/emoji content of the trigger button (default "😀") |
| `data-trigger-label` | string |  | aria-label for the trigger (default "Add reaction") |
| `data-label-toolbar` | string |  | Default toolbar label when no aria-label is authored (default "Reactions") |
| `data-label-dialog` | string |  | aria-label of the palette dialog (default "Choose a reaction") |
| `data-label-count-one` | string |  | Count phrase in chip names for the Intl.PluralRules "one" category; {count} is replaced by the Intl.NumberFormat count (default "{count} reaction"). Any CLDR category works: data-label-count-zero, -two, -few, -many. |
| `data-label-count-other` | string |  | Count phrase for every category without its own data-label-count-* (default "{count} reactions"). Locale comes from the closest [lang]. |
| `data-disabled` | boolean |  | Read-only mode, observed: chips get aria-disabled and do not toggle, the trigger is disabled and leaves the roving tab order, an open palette closes |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-reaction` | button | string |  | Stable identifier sent to the backend (e.g. thumbsup, heart) |
| `data-count` | button | number |  | Current count (≥ 1 to show; 0 removes the chip) |
| `data-mine` | button | boolean |  | Whether the current user has this reaction (exposed as aria-pressed) |
| `data-label` | button | string |  | Accessible name of the reaction (e.g. "Thumbs up"), on chips and palette buttons; an authored aria-label works too. Falls back to the emoji. |
| `data-pending` | button | boolean |  | Output: a toggle for this chip is in flight (also aria-busy); further clicks are ignored until setCount() |
| `data-palette` | template | boolean |  | Marks a <template> child as the available-reactions palette |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `reaction-bar:toggle` |  | Fires when a chip or palette option is clicked. detail: { reaction, action: 'add'\|'remove', count, mine } — count and mine are the values BEFORE the toggle. The chip is then data-pending until setCount() is called for that reaction. |
| `reaction-bar:palette-open` |  | Fires when the palette popover opens |
| `reaction-bar:palette-close` |  | Fires when the palette popover closes |

## Methods

| Method | Description |
| --- | --- |
| `setCount(reaction, count, { mine })` | Update a chip after the server confirms (call it on failure too, with the old values, to roll back). Clears the pending state, creates the chip from the palette template button (keeping its data-label) if missing, and removes the chip at count 0 — focus moves to a neighbour if the chip had it. |
| `openPalette()` | Open the palette popover (no-op while data-disabled) |
| `closePalette()` | Close the palette popover |

## Accessibility

- Pattern: Toolbar
- You provide: A data-label or aria-label on each reaction button that names the emoji
- The component manages: `role="toolbar"`, `aria-label`, `tabindex`, `aria-pressed`, `aria-busy`, `aria-disabled`, `aria-haspopup`, `aria-expanded`, `role="dialog"`, `role="group"`, `aria-hidden`, `popovertarget`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowRight` | Move to the next chip or the add-reaction trigger, wrapping (reversed in right-to-left) | Focus in the toolbar |
| `ArrowLeft` | Move to the previous chip or the add-reaction trigger, wrapping (reversed in right-to-left) | Focus in the toolbar |
| `ArrowRight` / `ArrowDown` | Move to the next palette option, wrapping (left and right reversed in right-to-left) | Focus in the palette |
| `ArrowLeft` / `ArrowUp` | Move to the previous palette option, wrapping (left and right reversed in right-to-left) | Focus in the palette |
| `Home` | Move to the first item of the toolbar or palette |  |
| `End` | Move to the last item of the toolbar or palette |  |
| `Escape` | Close the palette | Native behaviour of popover |
