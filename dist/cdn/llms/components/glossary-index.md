# <glossary-index>

Interactive glossary with search filtering and scroll-spy letter tracking; copyable term permalinks are opt-in

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/glossary-index/
- Vanilla Breeze 0.7.4

## Example

```html
<glossary-index>
  <nav class="glossary-jump" aria-label="Jump to letter">
    <a href="#A">A</a>
    <a href="#B">B</a>
    <a href="#C">C</a>
  </nav>

  <section class="glossary-section" id="A">
    <h2>A</h2>
    <dl>
      <dt><dfn>Accessibility</dfn></dt>
      <dd>The practice of making websites usable by everyone.</dd>

      <dt><dfn>ARIA</dfn></dt>
      <dd>Accessible Rich Internet Applications specification.</dd>
    </dl>
  </section>

  <section class="glossary-section" id="B">
    <h2>B</h2>
    <dl>
      <dt><dfn>Breadcrumb</dfn></dt>
      <dd>A navigation pattern showing the user's location.</dd>
    </dl>
  </section>
</glossary-index>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `placeholder` | string | `Filter terms…` | Placeholder text for the injected search input (a hint, not its label — see data-label-filter) |
| `permalinks` | boolean |  | Add a copy-link # beside each term that has an id. Off by default: a glossary is mostly linked to, from terms in prose |
| `data-label-filter` | string | `Filter glossary terms` | Accessible name of the search input |
| `data-label-matches-one` | string | `{count} term matches` | Polite match-count announcement for the Intl.PluralRules "one" category ({count} is replaced). Any category works: -few, -many, -zero, -two. |
| `data-label-matches-other` | string | `{count} terms match` | Match-count announcement for the "other" category and the fallback for unset categories |
| `data-label-all-one` | string | `Showing {count} term` | Announcement when the filter is cleared ("one" category) |
| `data-label-all-other` | string | `Showing all {count} terms` | Announcement when the filter is cleared ("other" category and fallback) |
| `data-label-empty` | string | `No terms match your filter.` | Visible empty-state message when nothing matches |
| `data-label-permalink` | string | `Copy link to` | Permalink name prefix; the term text is appended |
| `data-label-copied` | string | `Link copied to clipboard` | Screen-reader announcement after a permalink copies the term URL |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | dt | string |  | Term anchor: the target of links from prose and related terms (highlighted on arrival). With permalinks, each dt with an id also gets a # link that follows the fragment and copies the term URL. |

## Structure

| Child | Description |
| --- | --- |
| `nav.glossary-jump` | Letter jump navigation; its fragment links get aria-current="true" for the section in view and aria-disabled while their section is filtered out |
| `section.glossary-section` | One per letter group, with an id the jump links target (section[id^="glossary-"] also matches) |
| `dl` | Terms inside each section: dt/dd groups (several dt per dd, several dd per dt, or div-wrapped groups) |
| `dfn` | The defined term inside dt; used as the filter target when present (otherwise the dt text) |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `glossary-index:filter` | `{ query, matchCount }` | After the filter is applied |

## Accessibility

- Pattern: Landmark navigation
- You provide: A <nav class="glossary-jump"> with an aria-label, and letter sections with ids and headings
- The component manages: `aria-current`, `aria-disabled`, `aria-label`, `aria-hidden`, `role="status"`, `aria-live`, `aria-atomic`, `hidden`, `tabindex`
