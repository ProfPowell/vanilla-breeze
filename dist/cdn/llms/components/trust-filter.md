# <trust-filter>

Provenance lens: filter pages.json by vb:provenance, vb:review, vb:status and whether a signature is declared (not verified). OR within a dimension, AND across. Only the count is a live region.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/trust-filter/
- Vanilla Breeze 0.7.4

## Example

```html
<trust-filter data-lens-src="/pages.json"></trust-filter>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-lens-src` | string |  | URL to pages.json (or compatible source). Read at setup; forwarded by content-lens. |
| `src` | string |  | Alias for data-lens-src. |
| `data-label-form` | string | `Filter pages` | Accessible name of the controls form. |
| `data-label-provenance` | string | `How was it made` | Legend of the provenance group. |
| `data-label-review` | string | `Review` | Legend of the review group. |
| `data-label-status` | string | `Status` | Legend of the status group. |
| `data-label-signed` | string | `Has signature` | Legend of the signature group. pages.json signed means a vb:signature meta is present, not that it verified. |
| `data-label-yes` | string | `Yes` | Signature group "yes" option text. |
| `data-label-no` | string | `No` | Signature group "no" option text. |
| `data-label-clear` | string | `Clear all` | Reset button text. |
| `data-label-page` | string | `{count} of {total} page` | Count template when Intl.PluralRules selects "one" for {total}. |
| `data-label-pages` | string | `{count} of {total} pages` | Count template for every other plural category. |
| `data-label-has-signature` | string | `has signature` | Result-row note for pages that declare a signature. |
| `data-label-error` | string | `Pages could not be loaded.` | Message when the source fails (detail goes to console.warn, never rendered). |
| `data-label-no-source` | string | `No data source set.` | Message when neither data-lens-src nor src is set. |

## Structure

| Child | Description |
| --- | --- |
| `form[data-trust-filter-controls]` | Generated. One fieldset[data-dim] per dimension with nested label > input[type=checkbox][data-dim] (no ids), plus a reset button. Rebuilt unchecked on every setup, and the selection is cleared with it. |
| `output[data-trust-filter-count]` | Generated polite live region holding only "N of M pages"; filled on first render without an announcement. |
| `ul[data-trust-filter-results]` | Generated results list, a sibling of the count (not a live region); hidden when empty. Links that are not http(s) or relative render as plain text. |
| `span.trust-filter-prov[data-provenance]` | Generated provenance chip; coloured per token (~=) with theme tokens. |
| `p[data-trust-filter-error]` | Rendered when there is no source or the source fails to load. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `trust-filter:change` | `{ selected, count }` | Fires when the reader ticks, unticks or clears a filter. selected is a per-dimension array of values. Not fired on the initial render or on reconnect. |

## Accessibility

- Pattern: Native form controls
- The component manages: `aria-label`, `aria-live`, `hidden`
