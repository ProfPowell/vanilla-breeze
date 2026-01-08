# Fake Product Command

Generate realistic product data for e-commerce prototypes.

Shortcut for `/fake-content product`.

## Usage

```
/fake-product [count]
```

## Arguments

- `$ARGUMENTS` - Optional count (default: 1)

## Examples

```
/fake-product
/fake-product 5
/fake-product 12
```

## Generated Data

Each product includes:

| Field | Example |
|-------|---------|
| Name | "Ergonomic Steel Chair" |
| Description | "The slim & simple design..." |
| Price | "$149.99" |
| Category | "Electronics" |
| SKU | "A3K9M2X1" |
| Rating | "4.5" |
| Reviews | "127" |

## Steps to Execute

### 1. Parse Count

Extract count from arguments:
- Default: 1
- Maximum recommended: 20

### 2. Generate Products

```javascript
import { faker } from '@faker-js/faker';

const products = faker.helpers.multiple(
  () => ({
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: faker.commerce.price({ min: 19.99, max: 299.99, dec: 2 }),
    category: faker.commerce.department(),
    sku: faker.string.alphanumeric(8).toUpperCase(),
    rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
    reviews: faker.number.int({ min: 5, max: 500 })
  }),
  { count: requestedCount }
);
```

### 3. Insert HTML

For each product, insert:

```html
<product-card sku="[sku]">
  <img src="/.assets/images/placeholder/product-400x400.svg"
       alt="[name]"/>
  <h3>[name]</h3>
  <p>[description]</p>
  <data class="price" value="[price]">$[price]</data>
  <p class="category">[category]</p>
  <p class="rating">[rating] stars ([reviews] reviews)</p>
</product-card>
```

## Notes

- Prices are realistic ($19.99 - $299.99)
- Ratings are 3.5 - 5.0 stars
- Review counts vary (5 - 500)
- Each product gets unique data
