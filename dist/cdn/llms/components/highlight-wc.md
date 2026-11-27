# <highlight-wc>

Text highlighting with localStorage persistence. Inside <selection-menu> it renders a highlighter button + colour palette for the selection; standalone it renders no UI and exposes a JS API and events

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/highlight-wc/
- Vanilla Breeze 0.7.4

## Example

```html
<article id="post">
  <h2>My Article</h2>
  <p>Select any text to highlight it.</p>
</article>

<selection-menu for="post">
  <highlight-wc></highlight-wc>
  <note-wc></note-wc>
</selection-menu>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `for` | string |  | Standalone mode: ID of the element to annotate (defaults to the first child element). Ignored inside <selection-menu>, which highlights its own targets |
| `colors` | string | `yellow,green,blue,pink` | Comma-separated palette colour names; each needs a --highlight-{name} token |
| `readonly` | boolean |  | Render stored highlights but disable creating new ones. Inside <selection-menu> no highlighter button is rendered |
| `storage-key` | string |  | Custom storage key suffix (default: page pathname) |
| `data-label-button` | string | `Highlight selection` | Accessible name of the highlighter button (selection-menu mode) |
| `data-label-palette` | string | `Highlight color` | Accessible name of the colour palette group (selection-menu mode) |
| `data-label-annotation` | string | `You highlighted` | Margin annotation text; forwarded to the target as data-highlights-label-annotation |
| `data-label-added` | string | `Highlight added` | Screen-reader announcement when a highlight is created; forwarded as data-highlights-label-added |
| `data-label-removed` | string | `Highlight removed` | Screen-reader announcement when a highlight is removed; forwarded as data-highlights-label-removed |

## Structure

| Child | Description |
| --- | --- |
| `<article>` | Standalone mode: content to annotate (when not using for=) |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `highlights:added` | `{ id, text, color, note }` | A highlight was created. Dispatched on the target element and bubbles |
| `highlights:removed` | `{ id }` | A highlight was removed via removeHighlight(). Dispatched on the target and bubbles |
| `highlights:unplaced` | `{ highlights }` | Stored highlights were loaded and the text of one or more is no longer in the target. They stay in storage and are tried again on the next load. Dispatched on the target and bubbles |
| `highlights:selected` | `{ text, rect }` | Text was selected inside an interactive target — hook for a custom UI in standalone mode. Dispatched on the target and bubbles |
| `highlights:clicked` | `{ id, highlight }` | An existing highlight or its margin annotation was clicked. Dispatched on the target and bubbles |
| `highlights:note-changed` | `{ id, note }` | A note was saved (via <note-wc>). Dispatched on the target and bubbles |

## Methods

| Method | Description |
| --- | --- |
| `highlightSelection(color?)` | Highlight the current text selection in the given palette colour (default: last used). No-op when readonly or the colour is not in the palette |
| `getHighlights()` | Array of { id, startOffset, endOffset, text, prefix, suffix, color, note, created } records. Inside <selection-menu> the methods act on the most recently highlighted target (initially the first) |
| `removeHighlight(id)` | Remove one highlight by id |
| `clearAll()` | Remove every highlight on the target |
| `exportHighlights()` | JSON string { version: 1, highlights: [...] } |
| `importHighlights(json)` | Replace the highlights from an exported string or object. Records with a bad shape, offsets outside the text or a colour not in the palette are dropped. Returns { imported, rejected } |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--highlight-yellow` | Yellow highlight wash (light-dark() pair) |
| `--highlight-green` | Green highlight wash (light-dark() pair) |
| `--highlight-blue` | Blue highlight wash (light-dark() pair) |
| `--highlight-pink` | Pink highlight wash (light-dark() pair) |
| `--highlight-ink` | Text colour of highlighted text (light-dark() pair); per-colour override --highlight-{name}-ink |

## Accessibility

- Pattern: Disclosure
- The component manages: `aria-expanded`, `aria-controls`, `aria-pressed`, `aria-label`, `aria-hidden`, `role="group"`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Open the colour palette and focus the current colour | Native behaviour of button (the highlighter button) |
| `Escape` | Close the colour palette and return focus to the highlighter button | The palette is open |
