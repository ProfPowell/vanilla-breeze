# Breadcrumbs

## Description

Navigation trail showing the user's location within the site hierarchy. Helps with wayfinding and provides quick access to parent pages.

## Anatomy

- **nav**: Container with navigation landmark
- **list**: Ordered list of breadcrumb items
- **item**: Individual breadcrumb link
- **separator**: Visual separator between items (CSS-generated)
- **current**: Current page (not a link)

## States

| State | Description |
|-------|-------------|
| Default | Standard breadcrumb display |
| Truncated | Middle items collapsed for long paths |

## Variants

### Separator

**Attribute:** `data-separator`
**Values:** `slash`, `chevron`, `arrow`

## Baseline HTML

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li><a href="/products/category">Category</a></li>
    <li aria-current="page">Current Page</li>
  </ol>
</nav>
```

## Enhanced HTML

```html
<breadcrumbs data-separator="chevron">
  <nav aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      <li><a href="/products">Products</a></li>
      <li><a href="/products/category">Category</a></li>
      <li aria-current="page">Current Page</li>
    </ol>
  </nav>
</breadcrumbs>
```

## CSS

```css
@layer components {
  breadcrumbs {
    display: block;
    font-size: var(--text-sm);
  }

  breadcrumbs ol {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-xs);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  breadcrumbs li {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  /* Separators */
  breadcrumbs li:not(:last-child)::after {
    content: "/";
    color: var(--text-muted);
  }

  breadcrumbs[data-separator="chevron"] li:not(:last-child)::after {
    content: "›";
  }

  breadcrumbs[data-separator="arrow"] li:not(:last-child)::after {
    content: "→";
  }

  breadcrumbs a {
    color: var(--text-muted);
    text-decoration: none;
    transition: color var(--transition-fast);

    &:hover {
      color: var(--primary);
      text-decoration: underline;
    }
  }

  breadcrumbs [aria-current="page"] {
    color: var(--text);
    font-weight: var(--font-weight-medium);
  }

  /* Truncation for long paths */
  breadcrumbs[data-truncate] li:not(:first-child):not(:last-child):not(:nth-last-child(2)) {
    display: none;
  }

  breadcrumbs[data-truncate] li:nth-child(2)::before {
    content: "...";
    color: var(--text-muted);
    margin-inline-end: var(--spacing-xs);
  }
}

/* Mobile: stack or scroll */
@media (max-width: 480px) {
  breadcrumbs ol {
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  breadcrumbs li {
    flex-shrink: 0;
  }
}
```

## Accessibility

- **Landmark**: Uses `<nav>` with `aria-label="Breadcrumb"`
- **Ordered List**: Uses `<ol>` for semantic hierarchy
- **Current Page**: `aria-current="page"` on current item
- **Not a Link**: Current page is text, not a link (no self-referential links)

## Schema.org Markup

Add structured data for SEO:

```html
<breadcrumbs>
  <nav aria-label="Breadcrumb">
    <ol itemscope itemtype="https://schema.org/BreadcrumbList">
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="/"><span itemprop="name">Home</span></a>
        <meta itemprop="position" content="1" />
      </li>
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="/products"><span itemprop="name">Products</span></a>
        <meta itemprop="position" content="2" />
      </li>
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <span itemprop="name" aria-current="page">Widget</span>
        <meta itemprop="position" content="3" />
      </li>
    </ol>
  </nav>
</breadcrumbs>
```

## Examples

### Basic Breadcrumbs

```html
<breadcrumbs>
  <nav aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      <li><a href="/docs">Documentation</a></li>
      <li aria-current="page">Getting Started</li>
    </ol>
  </nav>
</breadcrumbs>
```

### Chevron Separator

```html
<breadcrumbs data-separator="chevron">
  <nav aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      <li><a href="/shop">Shop</a></li>
      <li><a href="/shop/clothing">Clothing</a></li>
      <li aria-current="page">T-Shirts</li>
    </ol>
  </nav>
</breadcrumbs>
```

### Truncated Long Path

```html
<breadcrumbs data-truncate>
  <nav aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      <li><a href="/a">Category</a></li>
      <li><a href="/a/b">Subcategory</a></li>
      <li><a href="/a/b/c">Sub-subcategory</a></li>
      <li aria-current="page">Current Page</li>
    </ol>
  </nav>
</breadcrumbs>
```

## Related Patterns

- [site-header](./site-header.md)
- [page-shell](../layout/page-shell.md)
- [nav-menu](./nav-menu.md)
