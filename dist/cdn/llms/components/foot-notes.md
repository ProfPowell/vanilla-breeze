# <foot-notes>

Progressive enhancement for footnotes: collects the <foot-note> elements that precede it into a labelled doc-endnotes list (or margin sidenotes), with doc-noteref references, doc-backlink return links, shared notes for repeat citations and a hover/focus preview.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/footnotes/
- Vanilla Breeze 0.7.4

## Example

```html
<p>
  The Vanilla Breeze framework<foot-note>Vanilla Breeze is an experimental
  component library.</foot-note> provides a layered approach.
</p>

<foot-notes></foot-notes>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-mode` | `sidenotes` |  | Omit for a collected notes list; "sidenotes" places each note in the margin beside its reference (notes with data-side="false" still go to the list). Observed: changing it re-renders. |
| `data-label-back` | string | `Back to content` | Accessible name of the backlinks; a note cited several times gets " (a)", " (b)" … appended. Observed at runtime. |
| `data-label-ref` | string | `Footnote {n}` | Accessible name of each reference link; {n} is replaced by the note number. Observed at runtime. |
| `data-label-heading` | string | `Notes` | Text of the generated, visually hidden heading that labels the doc-endnotes section. Ignored when the author supplies a heading child (h1–h6), which is used as the label instead. Observed at runtime. |
| `data-preview` | `false` |  | "false" disables the hover / keyboard-focus preview popover on references. Observed at runtime. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-side` | foot-note | string |  | "false" opts a note out of sidenote placement in data-mode="sidenotes"; it is collected into the list instead. |
| `data-ref` | foot-note | string |  | Id of an earlier or later <foot-note> collected by the same <foot-notes>: this element becomes another citation of that note (no content of its own) and the note gets one backlink per citation (a, b, …). |

## Structure

| Child | Description |
| --- | --- |
| `<foot-note>` | Inline note anywhere BEFORE the <foot-notes> in document order (not necessarily a child). Phrasing content; without JS it renders in parentheses. Enhanced: its content nodes are moved (not copied) into the note, and it holds a superscript <a role="doc-noteref"> (id fnref-I-N, fnref-I-N-b for repeat citations). |
| `<h1>–<h6> (optional)` | A heading child of <foot-notes> labels the generated <section role="doc-endnotes">; otherwise a visually hidden <h2> with data-label-heading is generated. |

## Accessibility

- Pattern: Footnote links (DPUB-ARIA)
- The component manages: `role="doc-noteref"`, `role="doc-endnotes"`, `role="doc-backlink"`, `role="note"`, `aria-label`, `aria-labelledby`, `aria-hidden`, `inert`, `hidden`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Escape` | Hide the note preview popover | A preview is showing |
