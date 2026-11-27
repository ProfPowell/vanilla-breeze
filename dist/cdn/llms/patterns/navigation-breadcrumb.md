# Breadcrumb Patterns

Breadcrumb navigation helps users understand their location within a site hierarchy and provides quick access to parent pages. Built with semantic HTML and accessible by default.

- Documentation: https://vanilla-breeze.com/docs/patterns/navigation/breadcrumb/
- Vanilla Breeze 0.7.4

## Overview

Breadcrumbs use the semantic `<nav>` element with `aria-label="Breadcrumb"` and an ordered list (`<ol>`) to represent the hierarchical structure. The current page is marked with `aria-current="page"` and rendered as a `<span>` rather than a link.

Key features:
- Semantic HTML with `<nav>` and `<ol>` for proper structure
- Current page indicated with `aria-current="page"`
- CSS-generated separators (no extra markup needed)
- Multiple separator styles: slash, chevron, arrow, dot, pipe
- Collapsed mode for deep hierarchies
- Text truncation for long labels

## Simple Breadcrumb

A basic breadcrumb showing the page hierarchy. Uses the default slash separator. The current page is not a link to avoid self-referential navigation.

Simple breadcrumb:

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/docs/">Documentation</a></li>
    <li><a href="/docs/patterns/">Patterns</a></li>
    <li><span aria-current="page">Breadcrumb</span></li>
  </ol>
</nav>
```

## With Home Icon

Replace the "Home" text with an icon for a more compact design. Include `visually-hidden` text for screen reader accessibility.

Breadcrumb with home icon:

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li>
      <a href="/">
        <icon-wc name="home" size="sm" aria-hidden="true"></icon-wc>
        <span class="visually-hidden">Home</span>
      </a>
    </li>
    <li><a href="/docs/">Documentation</a></li>
    <li><a href="/docs/patterns/">Patterns</a></li>
    <li><span aria-current="page">Breadcrumb</span></li>
  </ol>
</nav>
```

## Collapsed for Deep Hierarchies

When the breadcrumb trail is long, use `data-collapsed` to hide middle items. This shows only the first item, an ellipsis indicator, and the last two items.

Collapsed breadcrumb:

```html
<nav class="breadcrumb" data-collapsed aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/docs/">Documentation</a></li>
    <li><a href="/docs/elements/">Elements</a></li>
    <li><a href="/docs/elements/nav/">Navigation</a></li>
    <li><a href="/docs/patterns/">Patterns</a></li>
    <li><span aria-current="page">Breadcrumb</span></li>
  </ol>
</nav>
```

## Separator Variants

Use `data-separator` to change the separator character. Available options: `chevron`, `arrow`, `dot`, `pipe`.
- Home
- Documentation
- Patterns
- Home
- Documentation
- Patterns

Chevron separator:

```html
<nav class="breadcrumb" data-separator="chevron" aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/docs/">Documentation</a></li>
    <li><span aria-current="page">Patterns</span></li>
  </ol>
</nav>
```

Arrow separator:

```html
<nav class="breadcrumb" data-separator="arrow" aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/docs/">Documentation</a></li>
    <li><span aria-current="page">Patterns</span></li>
  </ol>
</nav>
```

## Truncated Labels

For breadcrumb items with long labels, use `data-truncated` to limit width and show ellipsis.
- Home
- Very Long Category Name That Needs Truncation
- Product

Truncated breadcrumb:

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/products/" data-truncated>Very Long Category Name That Needs Truncation</a></li>
    <li><span aria-current="page">Product</span></li>
  </ol>
</nav>
```

## CSS Reference

The breadcrumb styles are included in Vanilla Breeze. Here is the CSS for reference:

Breadcrumb base styles:

```css
/* Breadcrumb base styles (included in VB) */
nav.breadcrumb > ol {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--size-2xs);
  font-size: var(--font-size-s);
}

nav.breadcrumb li {
  display: flex;
  align-items: center;
  gap: var(--size-2xs);
}

/* Separator (CSS-generated) */
nav.breadcrumb li:not(:last-child)::after {
  content: var(--_separator, "/");
  margin-inline-start: var(--size-2xs);
  color: var(--color-gray-400);
}

/* Links and current page */
nav.breadcrumb a,
nav.breadcrumb span {
  padding: var(--size-xs);
  color: var(--color-text-muted);
  text-decoration: none;
}

nav.breadcrumb a:hover {
  color: var(--color-text);
  text-decoration: underline;
}

nav.breadcrumb [aria-current="page"] {
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
}
```

Separator variant styles:

```css
/* Separator variants */
nav.breadcrumb[data-separator="chevron"] {
  --_separator: "\\203A"; /* › */
}

nav.breadcrumb[data-separator="arrow"] {
  --_separator: "\\2192"; /* → */
}

nav.breadcrumb[data-separator="dot"] {
  --_separator: "\\00B7"; /* · */
}

nav.breadcrumb[data-separator="pipe"] {
  --_separator: "|";
}
```

Collapsed and truncated styles:

```css
/* Collapsed breadcrumb (CSS-only) */
nav.breadcrumb[data-collapsed] li:not(:first-child):not(:last-child):not(:nth-last-child(2)) {
  display: none;
}

nav.breadcrumb[data-collapsed] li:nth-last-child(2)::before {
  content: "...";
  margin-inline-end: var(--size-2xs);
  color: var(--color-gray-400);
}

/* Truncated items */
nav.breadcrumb [data-truncated] {
  max-width: 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

## Usage Notes

- Landmark: Always use `<nav>` with `aria-label="Breadcrumb"` to identify the navigation purpose
- Ordered list: Use `<ol>` to convey hierarchical order to screen readers
- Current page: Mark with `aria-current="page"` and use a `<span>` instead of a link
- Depth limit: Avoid more than 5 levels; use collapsed mode for deep hierarchies
- Mobile: Consider horizontal scrolling or collapsing on small screens
- Schema.org: Add structured data for SEO benefits (see nav element docs)

## Related

Full documentation for the nav element including all breadcrumb variants

Header navigation patterns with dropdowns and mobile menus

Icon web component for home icon and other breadcrumb icons

Screen reader only text utility
