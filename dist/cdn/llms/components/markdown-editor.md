# <markdown-editor>

Side-by-side markdown editor with live preview. Adopts the authored textarea and composes markdown-viewer.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/markdown-editor/
- Vanilla Breeze 0.7.4

## Example

```html
<label for="notes">Notes</label>
<markdown-editor>
  <textarea id="notes"># Hello world

Start editing to see a live preview.</textarea>
</markdown-editor>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `placeholder` | string |  | Textarea placeholder; overrides the textarea's own. No default placeholder |
| `rows` | number | `10` | Textarea rows; overrides the textarea's own rows |
| `highlight` | boolean |  | Pass highlight attribute to the preview viewer (markdown-viewer:highlight per code block) |
| `data-tab-indent` | boolean |  | Tab inserts two spaces instead of moving focus. Escape then Tab moves focus; Shift+Tab is never captured. Read at upgrade |
| `data-auto-mermaid` | boolean |  | Upgrade ```mermaid fences in the live preview to diagram-wc (loads the mermaid bridge) |
| `data-theme` | string |  | Theme propagated to the preview pane |
| `data-label-source` | string | `Markdown source` | Accessible name of the source pane; also names the textarea when nothing else does |
| `data-label-preview` | string | `Rendered preview` | Accessible name of the preview pane |
| `data-label-tab-hint` | string | `Tab inserts spaces. Press Escape, then Tab, to move focus.` | Description read with the textarea when data-tab-indent is set |
| `data-editing` | boolean |  | Present when textarea is focused |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | textarea | string |  | Form field name. Goes on the textarea, so the value submits with or without JavaScript |
| `required` | textarea | boolean |  | Native constraint validation (also minlength, maxlength, readonly, form) |
| `id` | textarea | string |  | Kept on upgrade, so a <label for> keeps naming the textarea |
| `dir` | textarea | string |  | Base direction for the source and the preview (default auto) |

## Structure

| Child | Description |
| --- | --- |
| `textarea` | The editable source. Adopted and moved into the source pane with its attributes; created when absent |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `markdown-editor:input` | `{ value }` | Fired on each keystroke. Bubbles, composed |
| `markdown-editor:change` | `{ value, source }` | source "user": on blur after the content changed. source "api": when .value is assigned (the next blur does not repeat it). Not fired by form reset. Bubbles, composed |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `value` | `string` | Get/set the markdown. Setting updates the preview immediately and fires markdown-editor:change with source "api" |
| `textarea` | `HTMLTextAreaElement` | The backing textarea: the authored one when provided. Stable across reconnects |

## Accessibility

- Pattern: Native form controls
- You provide: A <label for> pointing at the authored <textarea>; without one the textarea is named "Markdown source"
- The component manages: `role="group"`, `aria-label`, `aria-describedby`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Tab` | Insert two spaces instead of moving focus | Focus in the textarea with data-tab-indent set |
| `Escape` | Release the next Tab press so it moves focus out of the textarea | Focus in the textarea with data-tab-indent set |
