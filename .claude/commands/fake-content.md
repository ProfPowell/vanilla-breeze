# Fake Content Command

Generate realistic fake content for HTML prototypes.

## Usage

```
/fake-content <type> [count]
```

## Arguments

- `$ARGUMENTS` - Content type and optional count

## Content Types

| Type | Description |
|------|-------------|
| `person` | Name, email, phone, job title, bio |
| `product` | Name, price, description, category, SKU |
| `testimonial` | Quote, author, company, role |
| `article` | Title, author, date, excerpt, body |
| `company` | Name, catchphrase, address, contact |
| `event` | Title, date, location, description, price |
| `faq` | Question and answer pairs |

## Examples

```
/fake-content person
/fake-content product 5
/fake-content testimonial 3
/fake-content article
/fake-content faq 8
```

## Steps to Execute

### 1. Invoke the fake-content skill

This command uses the `fake-content` skill for patterns and templates.

### 2. Parse Arguments

Determine content type and count from arguments:
- Default count: 1
- Supported types: person, product, testimonial, article, company, event, faq

### 3. Generate Content

Use faker.js patterns from the skill to generate realistic content.

**Example for product:**

```javascript
import { faker } from '@faker-js/faker';

const product = {
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  price: faker.commerce.price({ min: 19.99, max: 299.99, dec: 2 }),
  category: faker.commerce.department(),
  sku: faker.string.alphanumeric(8).toUpperCase()
};
```

### 4. Insert HTML

Insert the generated content at the cursor location or replace selection.

Use the HTML templates from the fake-content skill.

## Notes

- Content is contextually appropriate, not lorem ipsum
- Use seed for reproducible results: `faker.seed(12345)`
- For multiple items, generate unique data for each
- Match content language to page's `lang` attribute when possible
