# <emoji-picker>

Accessible emoji picker with search, a category toolbar, a listbox of emoji, and undoable insertion into a target field

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/emoji-picker/
- Vanilla Breeze 0.7.4

## Example

```html
<label for="msg">Message</label>
<textarea id="msg" rows="3"></textarea>
<emoji-picker for="msg">
  <button data-trigger type="button" aria-label="Insert emoji">😀</button>
</emoji-picker>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `for` | string |  | ID of the input, textarea or contenteditable the emoji is inserted into (at the saved caret, as an undoable edit that fires an insertText input event). Omit to handle emoji-picker:select yourself. |
| `recent-limit` | number | `24` | Maximum number of recently used emoji kept in localStorage (vb-emoji-recent) |
| `data-trigger` | boolean |  | Marks the trigger button (a direct child). Without one the first child <button> is used, else a trigger is created. Hidden until the element is defined (no-JS). |
| `data-label-trigger` | string | `Open emoji picker` | Trigger accessible name, applied only when the trigger has no text and no aria-label |
| `data-label-dialog` | string | `Emoji picker` | Accessible name of the picker panel |
| `data-label-search` | string | `Search emoji` | Accessible name of the search input |
| `data-label-placeholder` | string | `Search emoji…` | Search input placeholder |
| `data-label-categories` | string | `Emoji categories` | Accessible name of the category toolbar |
| `data-label-emoji` | string | `Emoji` | Accessible name of the emoji listbox |
| `data-label-recent` | string | `Recently used` | Name of the recently used group |
| `data-label-empty` | string | `No emoji found` | Empty search message (shown and announced) |
| `data-label-results` | string | `{count} emoji found` | Result-count announcement; {count} is replaced |
| `data-label-smileys` | string | `Smileys & Emotion` | Category name for smileys |
| `data-label-people` | string | `People & Body` | Category name for people |
| `data-label-animals` | string | `Animals & Nature` | Category name for animals |
| `data-label-food` | string | `Food & Drink` | Category name for food |
| `data-label-travel` | string | `Travel & Places` | Category name for travel |
| `data-label-activities` | string | `Activities` | Category name for activities |
| `data-label-objects` | string | `Objects` | Category name for objects |
| `data-label-symbols` | string | `Symbols` | Category name for symbols |
| `data-label-flags` | string | `Flags` | Category name for flags |
| `open` | boolean |  | Reflected state — set by open()/close()/toggle(), not intended as initial markup |

## Structure

| Child | Description |
| --- | --- |
| `<button data-trigger>` | Optional trigger. An emoji-only trigger needs an aria-label. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `emoji-picker:select` | `{ shortcode, emoji, name, keywords }` | Fired when an emoji is selected, after it was inserted into the for target |
| `emoji-picker:open` |  | Fired when the picker opens |
| `emoji-picker:close` |  | Fired when the picker closes |

## Methods

| Method | Description |
| --- | --- |
| `open()` | Open the panel and focus the search input. Queued until the panel is built |
| `close()` | Close the panel (focus is not moved). Before the build it cancels a queued open |
| `toggle()` | Open when closed, close when open. Queued until the panel is built |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `isOpen` | `boolean` | Read-only. Whether the panel is open |
| `ready` | `Promise<void>` | Read-only. Resolves once the panel is built (emoji data loads asynchronously); data-upgraded is set at the same time |

## Accessibility

- Pattern: Non-modal dialog with a listbox
- You provide: A <button data-trigger> with a text label or aria-label (a default name is added when it has no letters)
- The component manages: `role="dialog"`, `role="toolbar"`, `role="listbox"`, `role="group"`, `role="option"`, `role="status"`, `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-label`, `aria-current`, `aria-selected`, `aria-hidden`, `tabindex`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Open the picker and focus the search field, or close it | Native behaviour of button (the trigger) |
| `Escape` | Close the picker and return focus to the trigger |  |
| `ArrowDown` | Move focus to the active or first emoji | Focus on the search field |
| `ArrowRight` / `ArrowLeft` | Move to the next or previous category, wrapping (reversed in right-to-left) | Focus in the category toolbar |
| `Home` / `End` | Move to the first or last category | Focus in the category toolbar |
| `ArrowRight` / `ArrowLeft` | Move to the next or previous emoji (reversed in right-to-left) | Focus in the emoji grid |
| `ArrowDown` | Move to the nearest emoji in the row below | Focus in the emoji grid |
| `ArrowUp` | Move to the nearest emoji in the row above, or to the search field from the first row | Focus in the emoji grid |
| `Home` / `End` | Move to the first or last visible emoji | Focus in the emoji grid |
| `PageDown` | Move to the first emoji of the next group | Focus in the emoji grid |
| `PageUp` | Move to the first emoji of the current group, then of the previous group | Focus in the emoji grid |
