# <glossary-wc>

Searchable, categorized, cross-linked glossary that progressively enhances a definition list

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/glossary-wc/
- Vanilla Breeze 0.7.4

## Example

```html
<glossary-wc data-title="Project Glossary" searchable>
  <dl>
    <div data-category="Domain" data-term-id="velocity">
      <dt>Velocity</dt>
      <dd>The amount of work a team can complete in a sprint,
        measured in story points.</dd>
    </div>
    <div data-category="Domain" data-term-id="epic">
      <dt>Epic</dt>
      <dd>A large body of work broken down into stories.
        See also: <a href="#velocity">velocity</a>.</dd>
    </div>
    <div data-category="Technical" data-term-id="api-gateway">
      <dt>API Gateway</dt>
      <dd>Single entry point for all client requests.</dd>
    </div>
  </dl>
</glossary-wc>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-title` | string |  | Glossary heading, rendered as a real heading (the title attribute is not used). Observed. |
| `data-heading-level` | number | `2` | Heading level (1-6) for data-title. Observed. |
| `src` | string |  | URL to JSON term data: { title?, terms: [{ id, term, definition, category?, seeAlso?, definitionHtml? }] }. Fetched once per URL; an inline <dl> renders as the fallback while loading and if the fetch fails. Observed. |
| `searchable` | boolean |  | Adds a search input (inside a <search> landmark) that filters terms by name and definition. Observed. |
| `compact` | boolean |  | Reduced spacing variant. CSS only. |
| `data-state` | `loading`, `ready`, `error` |  | Set in src mode: loading while fetching, ready after the data renders, error when the fetch fails (an error message is shown and the fallback <dl> is kept). |
| `data-label-search` | string | `Search glossary terms` | Accessible name of the search input. |
| `data-label-search-placeholder` | string | `Search terms…` | Search input placeholder. |
| `data-label-terms` | string | `Glossary terms` | Accessible name of the terms region. |
| `data-label-alphabet` | string | `Alphabet navigation` | Accessible name of the jump-bar nav. |
| `data-label-found-one` | string | `{count} term found` | Search announcement for the Intl.PluralRules "one" category ({count} is replaced). Any category works: data-label-found-few, -many, -zero, -two. |
| `data-label-found-other` | string | `{count} terms found` | Search announcement for the "other" category and the fallback for unset categories. |
| `data-label-all-one` | string | `Showing {count} term` | Announcement when the search is cleared ("one" category; other categories as for found). |
| `data-label-all-other` | string | `Showing all {count} terms` | Announcement when the search is cleared ("other" category and fallback). |
| `data-label-uncategorized` | string | `Uncategorized` | Category label for terms without data-category. |
| `data-label-see-also` | string | `See also:` | Prefix for seeAlso links generated from JSON / .terms data. |
| `data-label-error` | string | `Could not load the glossary terms.` | Message shown when src fails to load. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-category` | div | string |  | Category label for grouping terms |
| `data-term-id` | div | string |  | Unique term identifier, set as the div's id (fragment anchor). Jump-bar letters link to the first term of each letter. |

## Structure

| Child | Description |
| --- | --- |
| `dl` | Source definition list (optional with src: rendered as the fallback). Kept in place, hidden, while upgraded; restored on teardown. |
| `div[data-term-id]` | One per term inside the dl, wrapping its dt and dd |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `glossary-wc:ready` | `{ termCount, categories }` | After every render (upgrade, reconnect, observed attribute change, .terms assignment, src load). Not fired while src is loading. |
| `glossary-wc:search` | `{ query, matchCount }` | After the (debounced) search input is applied |
| `glossary-wc:terms-changed` | `{ terms, source: 'property' }` | After .terms assignment (fires after the render's ready) |
| `glossary-wc:error` | `{ url, error }` | When src fails to load (HTTP error, invalid JSON, or no terms array) |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `terms` | `Array<{ id, term, definition, category?, seeAlso?, definitionHtml? }>` | Get the parsed terms ({ id, term, definition, category, seeAlso? }; definition is text), or assign to rebuild. Assigned entries are written into the source <dl>, so they survive moves and re-renders. definition is rendered as text; definitionHtml is an explicit opt-in passed through VB's HTML sanitizer. |

## Accessibility

- Pattern: Disclosure
- You provide: A <dl> of terms (or a src) with text in every <dt>
- The component manages: `role="region"`, `role="status"`, `role="alert"`, `role="link"`, `aria-label`, `aria-controls`, `aria-expanded`, `aria-disabled`, `aria-hidden`, `aria-live`, `aria-atomic`, `hidden`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Expand or collapse a category | Native behaviour of button (the category toggle) |
