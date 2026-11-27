# <site-index>

Interactive keyword index: one filter box, an A–Z jump strip, a term count per letter and an optional display limit over a hand-authored (or src JSON) index

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/site-index/
- Vanilla Breeze 0.7.4

## Example

```html
<site-index letters="all" limit="5">
  <nav aria-label="Site index">
    <section id="index-a">
      <h2>A</h2>
      <ul>
        <li>
          <span class="index-term">accessibility</span>
          <ul class="index-refs">
            <li><a href="/docs/accessibility">Guide</a></li>
            <li><a href="/docs/elements/native/input#aria">
              Input ARIA</a></li>
          </ul>
        </li>
        <li>
          <span class="index-term">attributes</span>
          <ul class="index-refs">
            <li><a href="/docs/attributes/">Reference</a></li>
            <li><a href="/docs/attributes/data-provenance/">
              data-provenance</a></li>
          </ul>
        </li>
      </ul>
    </section>
  </nav>
</site-index>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `placeholder` | string | `Filter index…` | Placeholder and accessible name of the filter input |
| `letters` | `entries`, `all`, `none` | `entries` | Jump strip: letters that have entries, the full A–Z plus any other letters present (É, Å…), or none |
| `filter` | `all`, `topic` | `all` | What the filter box matches: terms and the titles of the pages they point to, or terms only |
| `limit` | number |  | Max entries per letter before a "Show N more" toggle |
| `src` | string |  | URL of index JSON ([{ term, refs: [{ href, label, type? }] }]) that replaces the authored nav. Strings render as text; only http(s), relative and fragment hrefs become links. |
| `data-label-controls` | string | `Filter the index` | Accessible name of the controls search landmark |
| `data-label-jump` | string | `Jump to letter` | Accessible name of the letter strip |
| `data-label-terms` | string | `{count} terms` | Term count beside each letter heading and as the hover hint on its jump letter ({count} is replaced) |
| `data-label-terms-one` | string | `1 term` | Term count for a letter with one term |
| `data-label-more` | string | `Show {count} more` | Show-more button ({count} is replaced) |
| `data-label-less` | string | `Show less` | Show-less button |
| `data-label-matches` | string | `{count} terms match` | Live filter count ({count} is replaced) |
| `data-label-matches-one` | string | `1 term matches` | Live filter count for one match |
| `data-label-no-matches` | string | `No matches` | Live status when the filter matches nothing |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-index` | nav | boolean |  | Explicitly marks the index nav (otherwise the direct-child nav holding sections is used) |

## Structure

| Child | Description |
| --- | --- |
| `<nav>` | The index: a direct-child <nav> of <section id="index-x"> letter groups (or any <nav data-index>). Any aria-label works. |
| `<section id="index-x">` | One letter group — <h2> plus <ul> of terms. The letter comes from the id, so index-é gives É. |
| `<span class="index-term">` | The term text inside each <li> |
| `<ul class="index-refs">` | Page references for a term |

## Accessibility

- Pattern: Landmark navigation
- You provide: A <nav> with an aria-label holding one <section> per letter, each with an <h2> and a list of terms
- The component manages: `role="status"`, `aria-label`, `aria-current`, `aria-disabled`, `aria-expanded`, `tabindex`, `hidden`
