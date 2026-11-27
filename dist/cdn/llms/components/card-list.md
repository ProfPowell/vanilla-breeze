# <card-list>

Template-based list rendering with safe data binding: property paths only, sanitized HTML, and URL-checked attribute bindings

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/card-list/
- Vanilla Breeze 0.7.4

## Example

```html
<card-list data-layout="grid" data-items='[
  {"id": 1, "name": "Headphones", "price": "$249", "inStock": true},
  {"id": 2, "name": "Keyboard", "price": "$159", "inStock": true},
  {"id": 3, "name": "Monitor", "price": "$449", "inStock": false}
]' data-key="id">
  <template>
    <layout-card>
      <header><h3 data-field="name"></h3></header>
      <section>
        <p data-field="price"></p>
      </section>
      <footer>
        <button data-field-if="inStock">Add to Cart</button>
        <span data-field-unless="inStock">Out of Stock</span>
      </footer>
    </layout-card>
  </template>
</card-list>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | string |  | URL to fetch JSON items from (an array, or an object with items/data). Fetched once on upgrade and on change; a newer src aborts the older request. |
| `data-items` | string |  | Inline JSON array of items. Takes priority over src. |
| `data-key` | string | `id` | Item property used as the unique key for the keyed diff. Missing or duplicated keys fall back to the item index. |
| `data-loading` | boolean |  | Present while a src fetch is in flight (with aria-busy="true"). |
| `data-error` | string |  | Error message of the last failed src fetch; cleared when a new fetch starts. Also announced via the role="status" child. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-field` | template descendant | string |  | Set the element's text content from a property path (e.g. user.name). |
| `data-field-attr` | template descendant | string |  | Comma-separated 'attribute: path' pairs. on* attributes, style and srcdoc are refused; URL attributes (href, src, action, formaction, poster, srcset, ...) only accept http(s), mailto, tel, relative or fragment URLs. null/undefined removes the attribute. |
| `data-field-html` | template descendant | string |  | Set innerHTML from a property path, passed through the shared sanitizer. |
| `data-field-if` | template descendant | string |  | Element is [hidden] unless the property value is truthy. |
| `data-field-unless` | template descendant | string |  | Element is [hidden] when the property value is truthy. |
| `data-fallback` | direct child | boolean |  | Static no-JS content; removed on the first successful render. |

## Structure

| Child | Description |
| --- | --- |
| `template` | Card template cloned per item. A single root element enables the keyed diff. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `card-list:rendered` | `{ count }` | Fired after items are rendered or reconciled. |
| `card-list:items-changed` | `{ items, source: 'attribute' \| 'api' }` | Fired when the items change. source is 'attribute' for data-items, src and data-key, 'api' for the .items setter. |
| `card-list:upgraded` |  | Fired once the component has found its template and upgraded. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `items` | `Array<object>` | Get the current items, or assign an array to re-render via the keyed diff (cancels an in-flight src fetch). setItems()/getItems() were removed. |

## Accessibility

- Pattern: Live region
- You provide: A <template> whose markup is accessible on its own (headings, link text, alt text)
- The component manages: `role="status"`, `aria-busy`, `hidden`
