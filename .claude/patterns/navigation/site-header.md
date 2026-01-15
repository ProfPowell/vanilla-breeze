# Site Header

## Description

Primary navigation bar for site-wide navigation. Contains logo, main navigation links, and optional utility actions. Responsive with mobile menu support.

## Anatomy

- **header**: Container element with semantic `<header>` role
- **logo**: Site logo/branding linking to homepage
- **nav**: Primary navigation with main links
- **actions**: Optional utility buttons (search, login, cart)
- **mobile-toggle**: Hamburger button for mobile menu (hidden on desktop)

## States

| State | Description |
|-------|-------------|
| Default | Standard header appearance |
| Sticky | Fixed to top when scrolling (`data-sticky`) |
| Mobile Open | Mobile menu expanded |
| Mobile Closed | Mobile menu collapsed (default on mobile) |

## Variants

### Size

**Attribute:** `data-size`
**Values:** `compact`, `default`, `large`

### Style

**Attribute:** `data-style`
**Values:** `transparent`, `solid`, `blur`

## Baseline HTML

```html
<header>
  <a href="/" aria-label="Home">
    <img src="/logo.svg" alt="Site Name" width="120" height="40" />
  </a>

  <nav aria-label="Main">
    <ul>
      <li><a href="/about">About</a></li>
      <li><a href="/products">Products</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>

  <div data-actions>
    <a href="/login">Login</a>
  </div>
</header>
```

## Enhanced HTML

```html
<site-header data-sticky>
  <a href="/" aria-label="Home">
    <img src="/logo.svg" alt="Site Name" width="120" height="40" />
  </a>

  <button commandfor="main-nav" command="toggle-popover" aria-label="Menu" data-mobile-toggle>
    <icon-wc name="menu" size="md" />
  </button>

  <nav id="main-nav" popover aria-label="Main">
    <ul>
      <li><a href="/about">About</a></li>
      <li><a href="/products" aria-current="page">Products</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>

  <div data-actions>
    <a href="/search" aria-label="Search">
      <icon-wc name="search" />
    </a>
    <a href="/cart" aria-label="Cart">
      <icon-wc name="shopping-cart" />
    </a>
  </div>
</site-header>
```

## CSS

```css
@layer components {
  site-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--size-l);
    padding: var(--size-m) var(--size-l);
    background: var(--surface);
    border-block-end: 1px solid var(--border);

    /* Logo */
    & > a:first-child {
      flex-shrink: 0;
    }

    & > a:first-child img {
      display: block;
      height: 2.5rem;
      width: auto;
    }

    /* Navigation */
    & nav ul {
      display: flex;
      gap: var(--size-l);
      list-style: none;
      margin: 0;
      padding: 0;
    }

    & nav a {
      padding: var(--size-xs) var(--size-m);
      color: var(--text);
      text-decoration: none;
      border-radius: var(--radius-md);
      transition: background var(--transition-fast);

      &:hover {
        background: var(--overlay-light);
      }

      &[aria-current="page"] {
        background: var(--overlay-medium);
        font-weight: var(--font-weight-medium);
      }
    }

    /* Actions */
    & [data-actions] {
      display: flex;
      gap: var(--size-xs);
      align-items: center;
    }

    /* Mobile toggle - hidden by default */
    & [data-mobile-toggle] {
      display: none;
    }

    /* Sticky variant */
    &[data-sticky] {
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
    }

    /* Size variants */
    &[data-size="compact"] {
      padding: var(--size-xs) var(--size-m);
    }

    &[data-size="large"] {
      padding: var(--size-l) var(--size-xl);
    }

    /* Style variants */
    &[data-style="transparent"] {
      background: transparent;
      border-block-end: none;
    }

    &[data-style="blur"] {
      background: color-mix(in oklch, var(--surface), transparent 20%);
      backdrop-filter: blur(8px);
    }
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    site-header {
      flex-wrap: wrap;

      & [data-mobile-toggle] {
        display: flex;
        order: 2;
      }

      & nav {
        order: 3;
        width: 100%;

        &:not(:popover-open) {
          display: none;
        }

        &:popover-open {
          display: block;
        }

        & ul {
          flex-direction: column;
          gap: var(--size-xs);
        }
      }

      & [data-actions] {
        order: 1;
        margin-inline-start: auto;
      }
    }
  }
}
```

## Accessibility

- **Landmark**: Uses `<header>` element for banner landmark
- **Navigation Label**: `aria-label="Main"` on nav element
- **Current Page**: `aria-current="page"` on active link
- **Mobile Toggle**: Labeled with `aria-label="Menu"`
- **Keyboard**: All links and buttons focusable with visible focus states

## Examples

### Basic Header

```html
<site-header>
  <a href="/">Company</a>
  <nav aria-label="Main">
    <ul>
      <li><a href="/about">About</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>
</site-header>
```

### Sticky Header with Actions

```html
<site-header data-sticky>
  <a href="/">
    <img src="/logo.svg" alt="Company" width="120" height="40" />
  </a>
  <nav aria-label="Main">
    <ul>
      <li><a href="/products">Products</a></li>
      <li><a href="/pricing">Pricing</a></li>
      <li><a href="/docs">Docs</a></li>
    </ul>
  </nav>
  <div data-actions>
    <a href="/login">Login</a>
    <a href="/signup" data-button="primary">Get Started</a>
  </div>
</site-header>
```

### Transparent Header (for hero sections)

```html
<site-header data-style="transparent">
  <!-- Content -->
</site-header>
```

## Related Patterns

- [site-footer](./site-footer.md)
- [nav-menu](./nav-menu.md)
- [breadcrumbs](./breadcrumbs.md)
- [skip-link](./skip-link.md)
