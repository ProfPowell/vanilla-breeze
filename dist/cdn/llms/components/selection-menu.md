# <selection-menu>

Floating toolbar that appears on text selection (pointer or keyboard). Moves its authored action children into a generated <pop-over data-mode="manual" role="toolbar"> in the top layer; Alt+F10 focuses it, arrow keys rove, Escape returns focus and the selection.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/selection-menu/
- Vanilla Breeze 0.7.4

## Example

```html
<selection-menu for="my-article">
  <highlight-wc></highlight-wc>
  <share-wc></share-wc>
  <note-wc></note-wc>
  <comment-wc></comment-wc>
</selection-menu>

<article id="my-article">
  <p>Select text here to see the toolbar.</p>
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `for` | string |  | ID of a single target element to watch for text selection. When the menu also has an id, the target is marked data-selection-menu="<id>". |
| `id` | string |  | When set, every element with data-selection-menu="<id>" is a target (many-to-one); targets added or changed later are picked up. |
| `data-label` | string | `Text selection actions` | Accessible name of the toolbar (aria-label on the composed pop-over) |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-selection-menu` | any element | string |  | On a target element: the id of the selection-menu that serves it |

## Structure

| Child | Description |
| --- | --- |
| `<pop-over data-selection-menu-host role="toolbar">` | Generated toolbar surface; setup() moves the authored children into it. Style this node, not the host (the host is display: contents). |
| `<highlight-wc>` | Text highlighting with color palette |
| `<share-wc>` | Share or copy the selected text as a quote (detected via closest('selection-menu')) |
| `<note-wc>` | Private note on highlight |
| `<comment-wc>` | Inline comment on a review-surface (from @profpowell/vb-project-planning) |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `selection-menu:select` | `{ range: Range, text: string, target: Element }` | A selection inside a target opened (or moved) the toolbar |
| `selection-menu:dismiss` |  | The toolbar was hidden (outside pointerdown, Escape, dismiss(), selection collapsed from the keyboard, or scrolled out of view) |
| `selection-menu:actions-changed` | `{ actions: Array<{ tag, attrs?, html? }>, source: 'property' }` | The actions property replaced the toolbar children |

## Methods

| Method | Description |
| --- | --- |
| `getSelection` | The selection the toolbar is showing for (a cloned range), or null when hidden |
| `dismiss` | Hide the toolbar; focus inside it returns to the selection's target |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `actions` | `Array<{ tag: string, attrs?: object, html?: string } \| Element>` | Toolbar children as plain data; setting it replaces them and fires selection-menu:actions-changed |

## Accessibility

- Pattern: Toolbar
- You provide: Child buttons or links that each have an accessible name
- The component manages: `role="toolbar"`, `aria-orientation`, `aria-label`, `aria-keyshortcuts`, `tabindex`, `popover`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Alt+F10` | Open the toolbar for the current selection if needed and focus its first item | Text is selected |
| `Escape` | Close the toolbar; if focus was in it, return focus and the selection to the text | Toolbar open |
| `ArrowRight` | Move to the next item, wrapping (reversed in right-to-left) | Focus in the toolbar |
| `ArrowLeft` | Move to the previous item, wrapping (reversed in right-to-left) | Focus in the toolbar |
| `Home` | Move to the first item | Focus in the toolbar |
| `End` | Move to the last item | Focus in the toolbar |
