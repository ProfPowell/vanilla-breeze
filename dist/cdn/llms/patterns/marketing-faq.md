# FAQ Patterns

FAQ section patterns for landing pages and marketing sites. Accordion, grid, and categorized layouts for displaying frequently asked questions.

- Documentation: https://vanilla-breeze.com/docs/patterns/marketing/faq/
- Vanilla Breeze 0.7.4

## Overview

FAQ sections help users find answers quickly without contacting support. These patterns use the `<accordion-wc>` component and native `<details>` elements, providing accessible expand/collapse behavior with zero custom JavaScript.

Key features:
- Built on `<accordion-wc>` for keyboard navigation, ARIA, and indicator styles
- No custom CSS required for accordion behavior
- Responsive grid layout for scan-friendly variant
- Categorized layout for large FAQ lists
- Progressive enhancement &mdash; works without JavaScript

## Accordion

The standard FAQ accordion wraps `<details>` elements in `<accordion-wc>`. The component handles the chevron indicator, marker hiding, keyboard navigation, and ARIA attributes &mdash; no custom CSS needed. Put the answer straight after the `<summary>`; the component wraps it in its own content panel.

FAQ accordion with accordion-wc:

```html
<accordion-wc single>
  <details name="faq" open>
    <summary>What is Vanilla Breeze?</summary>
    <p>A lightweight CSS framework built on modern web standards...</p>
  </details>
  <details name="faq">
    <summary>How do I get started?</summary>
    <p>Include via CDN or install via npm...</p>
  </details>
  <!-- More items... -->
</accordion-wc>
```

## Two-Column Grid

A grid layout that displays all FAQ items at once, arranged in two columns on wider screens. Best for shorter lists (4&ndash;8 items) where users benefit from scanning all questions at a glance. Question-and-answer pairs are a description list: each `<dl-item>` groups a `<dt>` question with its `<dd>` answer, and `data-layout="grid"` goes straight on the `<dl>`.

Two-column FAQ grid:

```html
<dl data-layout="grid" data-layout-min="xl" data-layout-gap="xl">
  <dl-item>
    <dt>What is Vanilla Breeze?</dt>
    <dd>A lightweight CSS framework...</dd>
  </dl-item>
  <dl-item>
    <dt>How do I get started?</dt>
    <dd>Include via CDN or install via npm...</dd>
  </dl-item>
  <!-- More items... -->
</dl>
```

## Categorized

For large FAQ lists, group questions by topic. Each category is a `<section>` with an `<h2>` and icon, followed by its own `<accordion-wc>`. This scales well to dozens of questions without overwhelming users.

One rule tints the category icons:

Categorized FAQ with grouped accordions:

```html
<layout-stack data-layout-gap="2xl">
  <section data-layout="stack" data-layout-gap="s">
    <h2><icon-wc name="rocket" size="sm"></icon-wc> Getting Started</h2>
    <accordion-wc>
      <details>
        <summary>What is Vanilla Breeze?</summary>
        <p>Answer...</p>
      </details>
      <details>
        <summary>How do I get started?</summary>
        <p>Answer...</p>
      </details>
    </accordion-wc>
  </section>

  <section data-layout="stack" data-layout-gap="s">
    <h2><icon-wc name="settings" size="sm"></icon-wc> Technical</h2>
    <accordion-wc>
      <details>
        <summary>What browsers are supported?</summary>
        <p>Answer...</p>
      </details>
      <!-- More items... -->
    </accordion-wc>
  </section>
</layout-stack>
```

Category heading styles:

```css
section > h2 > icon-wc {
  color: var(--color-interactive);
}
```

## Usage Notes

- Accordion vs Grid: Use accordion for longer FAQ lists (6+ items) to save vertical space. Use the grid for shorter lists where scanning all questions at once is helpful.
- Single-open mode: Add `single` to `<accordion-wc>` so only one answer is visible at a time. Good for long lists where context switching between answers is unlikely.
- Bordered variant: Add `bordered` for a contained look with dividers between items. Works well when the FAQ sits alongside other card-based content.
- Indicator styles: Use `indicator="plus-minus"` for a +/&minus; style instead of the default chevron. See accordion-wc for all options.
- Open by default: Add the `open` attribute to a `<details>` element to have it expanded on page load.
- Question length: Keep questions concise (under 80 characters). Move complex details to the answer section.
- Answer formatting: Use paragraphs, lists, and links within answers. Avoid deeply nested content.
- Grouping: For large FAQ lists (12+ items), the categorized pattern with section headings helps users navigate by topic.
- SEO: Consider adding FAQPage schema markup if your site is eligible for rich results.

## Related

Accordion component with variants, keyboard nav, and ARIA

Responsive grid layout element

Icon component for category headings

Feature section patterns
