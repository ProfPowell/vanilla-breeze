# Skip Link

## Description

Hidden link that becomes visible on focus, allowing keyboard users to skip repetitive navigation and jump directly to main content. Essential accessibility feature.

## Anatomy

- **link**: Anchor element targeting main content area

## States

| State | Description |
|-------|-------------|
| Hidden | Visually hidden but accessible to screen readers |
| Focused | Visible when focused via keyboard |

## Baseline HTML

```html
<a href="#main" class="skip-link">Skip to main content</a>
<!-- ... navigation ... -->
<main id="main">
  <!-- content -->
</main>
```

## Enhanced HTML

```html
<skip-link href="#main">Skip to main content</skip-link>
<!-- ... navigation ... -->
<main id="main" tabindex="-1">
  <!-- content -->
</main>
```

## CSS

```css
@layer components {
  skip-link,
  .skip-link,
  a[href="#main"]:first-child {
    position: absolute;
    top: 0;
    left: 0;
    z-index: var(--z-modal, 1000);
    padding: var(--size-xs) var(--size-m);
    background: var(--primary, #0066cc);
    color: var(--primary-contrast, #ffffff);
    font-weight: var(--font-weight-medium, 500);
    text-decoration: none;
    border-radius: 0 0 var(--radius-md, 0.375rem) 0;

    /* Hidden by default */
    transform: translateY(-100%);
    transition: transform var(--transition-fast, 150ms) ease-in-out;

    /* Visible on focus */
    &:focus {
      transform: translateY(0);
      outline: 2px solid var(--focus-ring, currentColor);
      outline-offset: 2px;
    }
  }
}

/* Alternative: sr-only until focused */
@layer utilities {
  .skip-link-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;

    &:focus {
      position: fixed;
      top: var(--size-xs);
      left: var(--size-xs);
      z-index: var(--z-modal);
      width: auto;
      height: auto;
      padding: var(--size-xs) var(--size-m);
      margin: 0;
      overflow: visible;
      clip: auto;
      white-space: normal;
      background: var(--primary);
      color: var(--primary-contrast);
      border-radius: var(--radius-md);
    }
  }
}
```

## Accessibility

- **Focus Management**: Link is focusable and visible on focus
- **Target Element**: Main content should have `tabindex="-1"` to receive focus
- **Screen Readers**: Always accessible to assistive technology
- **First Element**: Should be first focusable element on page
- **Clear Label**: Descriptive text explains the link's purpose

## JavaScript Enhancement

Optional: Smooth scroll and focus management:

```javascript
// Skip link with smooth scroll and focus
document.querySelector('skip-link, .skip-link')?.addEventListener('click', (e) => {
  const target = document.querySelector(e.target.getAttribute('href'));
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
    target.focus();
  }
});
```

## Examples

### Basic Skip Link

```html
<!DOCTYPE html>
<html lang="en">
<head>...</head>
<body>
  <a href="#main" class="skip-link">Skip to main content</a>

  <header>
    <nav>
      <!-- 20+ navigation links -->
    </nav>
  </header>

  <main id="main" tabindex="-1">
    <h1>Page Title</h1>
    <!-- content -->
  </main>
</body>
</html>
```

### Multiple Skip Links

```html
<nav aria-label="Skip links">
  <ul class="skip-links">
    <li><a href="#main">Skip to main content</a></li>
    <li><a href="#nav">Skip to navigation</a></li>
    <li><a href="#search">Skip to search</a></li>
  </ul>
</nav>
```

### With Page Shell

```html
<page-shell>
  <skip-link href="#main">Skip to main content</skip-link>

  <site-header>
    <!-- header with navigation -->
  </site-header>

  <main id="main" tabindex="-1">
    <!-- content -->
  </main>

  <site-footer>
    <!-- footer -->
  </site-footer>
</page-shell>
```

## Testing

1. Load page and press Tab - skip link should be first focusable element
2. Skip link should become visible when focused
3. Pressing Enter should move focus to main content
4. Screen reader should announce "Skip to main content, link"

## Related Patterns

- [page-shell](../layout/page-shell.md)
- [site-header](./site-header.md)
