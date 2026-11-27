# <table>

Tables display tabular data with full-width layout, collapsed borders, tabular numerals, and automatic row hover states. Includes data-striped, data-bordered, data-density and minimal variants plus data attributes for density, alignment, sticky headers and columns, responsive card and scroll layouts, and row states.

- Native HTML element with Vanilla Breeze additions.
- Documentation: https://vanilla-breeze.com/docs/elements/native/table/
- Vanilla Breeze 0.7.4

## Example

```html
<table>
  <caption>Quarterly Sales Report</caption>
  <thead>
    <tr>
      <th scope="col">Product</th>
      <th scope="col" data-numeric>Q1</th>
      <th scope="col" data-numeric>Q2</th>
      <th scope="col" data-numeric>Q3</th>
      <th scope="col" data-numeric>Q4</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Widgets</th>
      <td data-numeric>$12,400</td>
      <td data-numeric>$14,200</td>
      <td data-numeric>$13,800</td>
      <td data-numeric>$16,100</td>
    </tr>
    <tr>
      <th scope="row">Gadgets</th>
      <td data-numeric>$8,300</td>
      <td data-numeric>$9,100</td>
      <td data-numeric>$10,500</td>
      <td data-numeric>$11,200</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <th scope="row">Total</th>
      <td data-numeric>$26,300</td>
      <td data-numeric>$29,500</td>
      <td data-numeric>$30,200</td>
      <td data-numeric>$34,700</td>
    </tr>
  </tfoot>
</table>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-striped` | boolean |  |  |
| `data-bordered` | boolean |  |  |
| `data-density` | `compact`, `comfortable` |  |  |
