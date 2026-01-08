# Fake Testimonial Command

Generate realistic customer testimonials for prototypes.

Shortcut for `/fake-content testimonial`.

## Usage

```
/fake-testimonial [count]
```

## Arguments

- `$ARGUMENTS` - Optional count (default: 1)

## Examples

```
/fake-testimonial
/fake-testimonial 3
/fake-testimonial 6
```

## Generated Data

Each testimonial includes:

| Field | Example |
|-------|---------|
| Quote | "The product exceeded our expectations..." |
| Author | "Sarah Johnson" |
| Role | "Senior Product Manager" |
| Company | "Acme Industries" |
| Avatar | (URL to avatar image) |

## Steps to Execute

### 1. Parse Count

Extract count from arguments:
- Default: 1
- Recommended for layouts: 3-6

### 2. Generate Testimonials

```javascript
import { faker } from '@faker-js/faker';

const testimonials = faker.helpers.multiple(
  () => ({
    quote: faker.lorem.sentences({ min: 2, max: 4 }),
    author: faker.person.fullName(),
    role: faker.person.jobTitle(),
    company: faker.company.name(),
    avatar: faker.image.avatar()
  }),
  { count: requestedCount }
);
```

### 3. Insert HTML

For each testimonial, insert:

```html
<blockquote class="testimonial">
  <p>"[quote]"</p>
  <footer>
    <img src="[avatar]" alt="[author]"/>
    <cite>[author]</cite>
    <span class="role">[role], [company]</span>
  </footer>
</blockquote>
```

## Variations

**Simple (no avatar):**

```html
<blockquote class="testimonial">
  <p>"[quote]"</p>
  <footer>
    <cite>[author]</cite>, [role] at [company]
  </footer>
</blockquote>
```

**Card layout:**

```html
<div class="testimonial-card">
  <img src="[avatar]" alt="[author]" class="avatar"/>
  <blockquote>
    <p>"[quote]"</p>
  </blockquote>
  <p class="author">[author]</p>
  <p class="role">[role], [company]</p>
</div>
```

## Notes

- Quotes are 2-4 sentences
- Use consistent styling across testimonials
- Avatar URLs point to placeholder services
- Consider using placeholder images instead for offline work
