# <topic-map>

SKOS-aware hierarchical view of site concepts. Joins vocabulary.json (skos:broader/narrower edges) with pages.json (each page's concepts:[] array) to render a nested <details> tree rooted at top concepts. Counts are distinct pages per subtree; page links are scheme-checked; cyclic edges are skipped. Built by JavaScript (no-JS shows only authored fallback content).

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/topic-map/
- Vanilla Breeze 0.7.4

## Example

```html
<topic-map data-lens-src="/pages.json"></topic-map>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-lens-src` | string |  | URL to pages.json. Each page record must expose a concepts:[] array (per meta-tag-contract v1.1). Read at setup; forwarded by content-lens. |
| `src` | string |  | Alias for data-lens-src. |
| `data-vocabulary-src` | string | `/vocabulary.json` | URL to the SKOS vocabulary.json. Provides concept @id, skos:prefLabel, and skos:broader/narrower/hasTopConcept edges used to build the tree. |
| `expand-all` | boolean |  | Render with every level expanded. Default opens only the top-level concepts. Read at render (not observed). |
| `data-heading-level` | number | `2` | Heading level 1-6 for the panel heading; 0 renders no heading (e.g. inside content-lens, which already labels the lens). |
| `data-label-heading` | string | `Topics` | Heading text. |
| `data-label-page` | string | `{count} page` | Count template used when Intl.PluralRules selects "one"; {count} is the formatted number. |
| `data-label-pages` | string | `{count} pages` | Count template for every other plural category. |
| `data-label-uncategorized` | string | `Uncategorized` | Label of the node holding pages whose concepts are not in the vocabulary. |
| `data-label-topic-link` | string | `{label} topic page` | Text of the /topics/{id}/ link inside each node; {label} is the concept prefLabel. |
| `data-label-error` | string | `Topics could not be loaded.` | Message when a data source fails to load or the tree cannot be built (detail goes to console.warn, never rendered). |

## Structure

| Child | Description |
| --- | --- |
| `h2.topic-map-heading` | Generated heading (level from data-heading-level; omitted when 0) with the total page count in <small>. |
| `details[data-topic-node]` | Generated. One <details> per concept node. data-topic-node carries the concept @id (or '__uncategorized'). Top level opens by default. |
| `summary > .topic-name` | Generated. Concept prefLabel as plain text (the summary holds no link, so it only toggles). |
| `summary > .topic-count` | Generated. Distinct pages tagged with the concept or any descendant, with unit ("5 pages"). |
| `p.topic-link > a` | Generated. Link to /topics/{id}/, first item in the disclosure body. |
| `ul.topic-pages > li > a` | Generated. Pages tagged directly with this concept, in source order. URLs that are not http(s) or relative render as plain text. |
| `p[data-topic-map-error]` | Rendered when either data source fails to load; authored fallback content is kept below it. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `topic-map:data-changed` | `{ pages, vocabulary, source: 'property' }` | Fires after the data property is assigned and the tree re-rendered. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `data` | `{ pages: object[], vocabulary: object } \| null` | Assign in-memory payloads to bypass the fetch path (takes precedence over data-lens-src while set). Reading returns the assigned payload, or null when the tree came from src. |

## Accessibility

- Pattern: Native details/summary

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Open or close a topic | Native behaviour of summary |
