# Page Shell

## Description

Standard page layout container providing consistent structure with header, main content area, and footer. Handles sticky header, scroll behavior, and responsive layout.

## Anatomy

- **skip-link**: Hidden link to skip to main content (accessibility)
- **header**: Site header slot (uses site-header pattern)
- **main**: Primary content area with landmark role
- **footer**: Site footer slot (uses site-footer pattern)

## States

| State | Description |
|-------|-------------|
| Default | Standard page layout |
| Scrolled | Header in sticky mode after scroll |

## Variants

### Layout

**Attribute:** `data-layout`
**Values:** `standard`, `full-width`, `centered`

## Baseline HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Page Title</title>
</head>
<body>
  <a href="#main" class="skip-link">Skip to main content</a>

  <header>
    <!-- site-header content -->
  </header>

  <main id="main">
    <!-- page content -->
  </main>

  <footer>
    <!-- site-footer content -->
  </footer>
</body>
</html>
```

## Enhanced HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Page Title</title>
</head>
<body>
  <layout-stack class="page">
    <skip-link href="#main">Skip to main content</skip-link>

    <site-header data-sticky>
      <!-- header content -->
    </site-header>

    <main id="main">
      <article>
        <!-- page content -->
      </article>
    </main>

    <site-footer>
      <!-- footer content -->
    </site-footer>
  </layout-stack>
</body>
</html>
```

## CSS

```css
@layer components {
  layout-stack.page {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;

    /* Main content grows to fill space */
    & > main {
      flex: 1;
      width: 100%;
    }

    /* Standard layout - centered content */
    &[data-layout="standard"] > main {
      max-width: var(--content-max-width, 75rem);
      margin-inline: auto;
      padding-inline: var(--size-l);
    }

    /* Full width - edge to edge */
    &[data-layout="full-width"] > main {
      max-width: none;
      padding-inline: 0;
    }

    /* Centered - narrower content */
    &[data-layout="centered"] > main {
      max-width: var(--prose-max-width, 45rem);
      margin-inline: auto;
      padding-inline: var(--size-l);
    }
  }

  /* Skip link */
  skip-link,
  .skip-link {
    position: absolute;
    top: 0;
    left: 0;
    z-index: var(--z-modal);
    padding: var(--size-xs) var(--size-m);
    background: var(--primary);
    color: var(--primary-contrast);
    text-decoration: none;
    transform: translateY(-100%);
    transition: transform var(--transition-fast);

    &:focus {
      transform: translateY(0);
    }
  }

  /* Ensure header and footer span full width */
  layout-stack.page > site-header,
  layout-stack.page > header,
  layout-stack.page > site-footer,
  layout-stack.page > footer {
    width: 100%;
  }
}

/* Body reset when using layout-stack.page */
@layer base {
  body:has(layout-stack.page) {
    margin: 0;
    padding: 0;
  }
}
```

## Accessibility

- **Skip Link**: Provides keyboard shortcut to bypass navigation
- **Landmarks**: Uses semantic `<header>`, `<main>`, `<footer>` elements
- **Focus Management**: Skip link visible on focus
- **Scroll Restoration**: Browser handles scroll position on navigation

## Examples

### Standard Page

```html
<layout-stack class="page">
  <skip-link href="#main">Skip to main content</skip-link>

  <site-header data-sticky>
    <a href="/">Logo</a>
    <nav aria-label="Main">
      <ul>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  </site-header>

  <main id="main">
    <h1>Page Title</h1>
    <p>Page content goes here.</p>
  </main>

  <site-footer>
    <div data-legal>
      <p>&copy; 2025 Company</p>
    </div>
  </site-footer>
</layout-stack>
```

### Full Width Layout

```html
<layout-stack class="page">
  <!-- For landing pages, dashboards with full-width sections -->
</layout-stack>
```

### Centered Content Layout

```html
<layout-stack class="page">
  <!-- For blog posts, documentation, articles -->
</layout-stack>
```

## Related Patterns

- [site-header](../navigation/site-header.md)
- [site-footer](../navigation/site-footer.md)
- [skip-link](../navigation/skip-link.md)
- [layout-sidebar](./layout-sidebar.md)
