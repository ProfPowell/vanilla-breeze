# <note-wc>

Private reader notes on highlights: a note action inside selection-menu, a page-level button with for="id", and the note panel itself. Also opens the panel for margin-annotation clicks (it listens for highlights:request-note on document).

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/note-wc/
- Vanilla Breeze 0.7.4

## Example

```html
<selection-menu for="my-article">
  <highlight-wc></highlight-wc>
  <note-wc></note-wc>
</selection-menu>

<article id="my-article">
  <p>Select text, click the note icon to highlight and add a note.</p>
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `for` | string |  | ID of the target article (page-level mode). The button opens the panel for the first noted, else first, highlight on it. Without for and outside selection-menu, note-wc renders no button and only hosts the panel. |
| `data-label-add` | string | `Add private note` | Accessible name of the button inside selection-menu. |
| `data-label-view` | string | `View notes` | Accessible name of the page-level (for="id") button. |
| `data-label-dialog` | string | `Private note` | Accessible name of the note panel dialog. |
| `data-label-heading` | string | `Private note` | Visible panel heading (uppercased by CSS). |
| `data-label-placeholder` | string | `Add a note…` | Textarea placeholder. |
| `data-label-textarea` | string | `Note for highlighted text` | Textarea accessible name. |
| `data-label-save` | string | `Save` | Save button text. |
| `data-label-cancel` | string | `Cancel` | Cancel button text. |

## Methods

| Method | Description |
| --- | --- |
| `openFor` | openFor(highlight, controller, opener?) opens the note panel for a highlight record on a highlights controller (from initHighlights). Focus returns to opener (default: the element focused when it opened) on close. The highlights:request-note document event calls this on the first connected note-wc. |

## Accessibility

- Pattern: Dialog (non-modal)
- The component manages: `role="dialog"`, `aria-label`, `aria-hidden`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Escape` | Close the note panel without saving and return focus to the opener (or the highlight when the opener is gone) | Focus in the note panel |
| `Ctrl+Enter` / `Meta+Enter` | Save the note and close the panel | Focus in the note textarea |
