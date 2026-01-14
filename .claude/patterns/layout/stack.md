# Stack

## Description

Vertical layout utility that adds consistent spacing between child elements. A foundational layout primitive for building component and page layouts.

## Anatomy

- **container**: The stack wrapper
- **items**: Any child elements (spaced vertically)

## States

| State | Description |
|-------|-------------|
| Default | Consistent vertical gap between children |

## Variants

### Gap

**Attribute:** `data-gap`
**Values:** `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`

### Recursive

**Attribute:** `data-recursive`
**Values:** `true` (applies to all descendants)

### Split After

**Attribute:** `data-split`
**Values:** Element index to push remaining items to bottom

## Baseline HTML

```html
<div class="stack">
  <h2>Title</h2>
  <p>Paragraph one</p>
  <p>Paragraph two</p>
</div>
```

## Enhanced HTML

```html
<layout-stack data-gap="l">
  <h2>Section Title</h2>
  <p>First paragraph with consistent spacing below.</p>
  <p>Second paragraph with same spacing.</p>
  <a href="/more">Learn more</a>
</layout-stack>
```

## CSS

```css
@layer layout {
  layout-stack,
  .stack {
    --stack-gap: var(--size-m);

    display: flex;
    flex-direction: column;
  }

  /* Owl selector for spacing */
  layout-stack > * + *,
  .stack > * + * {
    margin-block-start: var(--stack-gap);
  }

  /* Alternative using gap (simpler but different behavior with margins) */
  layout-stack[data-use-gap],
  .stack[data-use-gap] {
    gap: var(--stack-gap);
  }

  layout-stack[data-use-gap] > * + *,
  .stack[data-use-gap] > * + * {
    margin-block-start: 0;
  }

  /* Gap variants */
  layout-stack[data-gap="none"],
  .stack[data-gap="none"] {
    --stack-gap: 0;
  }

  layout-stack[data-gap="xs"],
  .stack[data-gap="xs"] {
    --stack-gap: var(--size-2xs);
  }

  layout-stack[data-gap="s"],
  .stack[data-gap="s"] {
    --stack-gap: var(--size-xs);
  }

  layout-stack[data-gap="m"],
  .stack[data-gap="m"] {
    --stack-gap: var(--size-m);
  }

  layout-stack[data-gap="l"],
  .stack[data-gap="l"] {
    --stack-gap: var(--size-l);
  }

  layout-stack[data-gap="xl"],
  .stack[data-gap="xl"] {
    --stack-gap: var(--size-xl);
  }

  layout-stack[data-gap="2xl"],
  .stack[data-gap="2xl"] {
    --stack-gap: var(--size-2xl);
  }

  /* Recursive - applies to nested stacks too */
  layout-stack[data-recursive] *,
  .stack[data-recursive] * {
    margin-block: 0;
  }

  layout-stack[data-recursive] * + *,
  .stack[data-recursive] * + * {
    margin-block-start: var(--stack-gap);
  }

  /* Split after - push items after nth-child to bottom */
  layout-stack[data-split],
  .stack[data-split] {
    justify-content: flex-start;
  }

  layout-stack[data-split="1"] > :nth-child(2),
  .stack[data-split="1"] > :nth-child(2) {
    margin-block-start: auto;
  }

  layout-stack[data-split="2"] > :nth-child(3),
  .stack[data-split="2"] > :nth-child(3) {
    margin-block-start: auto;
  }

  layout-stack[data-split="3"] > :nth-child(4),
  .stack[data-split="3"] > :nth-child(4) {
    margin-block-start: auto;
  }

  /* Exception: elements that should have no gap */
  layout-stack [data-no-gap],
  .stack [data-no-gap] {
    margin-block-start: 0 !important;
  }

  /* Custom gap on specific item */
  layout-stack [data-gap-above],
  .stack [data-gap-above] {
    margin-block-start: var(--size-2xl);
  }
}
```

## Accessibility

- **Semantic Neutral**: Pure layout utility
- **DOM Order**: Visual order matches source order

## Examples

### Article Content

```html
<article>
  <layout-stack data-gap="l">
    <h1>Article Title</h1>
    <p class="lead">Introduction paragraph with larger text.</p>
    <p>Body paragraph one.</p>
    <p>Body paragraph two.</p>
    <figure>
      <img src="illustration.jpg" alt="Illustration" />
      <figcaption>Figure caption</figcaption>
    </figure>
    <p>Continuing the article...</p>
  </layout-stack>
</article>
```

### Card Content

```html
<div class="card">
  <layout-stack data-gap="s">
    <h3>Card Title</h3>
    <p>Card description text goes here.</p>
    <a href="/details">View Details</a>
  </layout-stack>
</div>
```

### Form Layout

```html
<form>
  <layout-stack data-gap="m">
    <label>
      Name
      <input type="text" name="name" />
    </label>
    <label>
      Email
      <input type="email" name="email" />
    </label>
    <label>
      Message
      <textarea name="message"></textarea>
    </label>
    <button type="submit">Send</button>
  </layout-stack>
</form>
```

### Split Layout (Card with Footer)

```html
<div class="card" style="min-height: 20rem;">
  <layout-stack data-gap="m" data-split="2">
    <h3>Card Title</h3>
    <p>Card content that should stay at top.</p>
    <!-- Everything after this pushed to bottom -->
    <footer>
      <button>Action</button>
    </footer>
  </layout-stack>
</div>
```

### Nested Stacks

```html
<layout-stack data-gap="xl">
  <section>
    <layout-stack data-gap="m">
      <h2>Section One</h2>
      <p>Content for section one.</p>
    </layout-stack>
  </section>

  <section>
    <layout-stack data-gap="m">
      <h2>Section Two</h2>
      <p>Content for section two.</p>
    </layout-stack>
  </section>
</layout-stack>
```

## Related Patterns

- [cluster](./cluster.md)
- [content-width](./content-width.md)
- [spacer](./spacer.md)
