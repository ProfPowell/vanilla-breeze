# Sidebar Layout

## Description

Two-column layout with primary content and a sidebar. Supports left or right sidebar placement, collapsible sidebar on mobile, and sticky sidebar option.

## Anatomy

- **container**: Wrapper element for the layout
- **sidebar**: Secondary content area (navigation, filters, table of contents)
- **content**: Primary content area

## States

| State | Description |
|-------|-------------|
| Default | Both columns visible (desktop) |
| Sidebar Open | Sidebar visible (mobile) |
| Sidebar Closed | Sidebar hidden (mobile) |

## Variants

### Position

**Attribute:** `data-sidebar`
**Values:** `start`, `end`

### Sticky

**Attribute:** ``
**Values:** (boolean attribute)

## Baseline HTML

```html
<div class="layout-sidebar">
  <aside>
    <nav aria-label="Section">
      <ul>
        <li><a href="#intro">Introduction</a></li>
        <li><a href="#usage">Usage</a></li>
        <li><a href="#api">API</a></li>
      </ul>
    </nav>
  </aside>

  <main>
    <h1>Page Title</h1>
    <section id="intro">...</section>
    <section id="usage">...</section>
    <section id="api">...</section>
  </main>
</div>
```

## Enhanced HTML

```html
<layout-sidebar  >
  <button commandfor="sidebar" command="toggle-popover" aria-label="Toggle sidebar" data-sidebar-toggle>
    <x-icon name="menu" />
  </button>

  <aside id="sidebar" popover>
    <nav aria-label="Section">
      <ul>
        <li><a href="#intro">Introduction</a></li>
        <li><a href="#usage" aria-current="true">Usage</a></li>
        <li><a href="#api">API</a></li>
      </ul>
    </nav>
  </aside>

  <main>
    <article>
      <h1>Page Title</h1>
      <section id="intro">...</section>
      <section id="usage">...</section>
      <section id="api">...</section>
    </article>
  </main>
</layout-sidebar>
```

## CSS

```css
@layer components {
  layout-sidebar {
    --sidebar-width: 16rem;

    display: grid;
    grid-template-columns: var(--sidebar-width) 1fr;
    gap: var(--size-xl);
    min-height: 100%;

    /* Sidebar */
    & > aside {
      padding: var(--size-l);
      background: var(--surface-alt);
      border-inline-end: 1px solid var(--border);
    }

    & > aside nav ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--size-2xs);
    }

    & > aside nav a {
      display: block;
      padding: var(--size-xs) var(--size-m);
      color: var(--text);
      text-decoration: none;
      border-radius: var(--radius-md);
      transition: background var(--transition-fast);

      &:hover {
        background: var(--overlay-light);
      }

      &[aria-current="true"] {
        background: var(--primary-subtle);
        color: var(--primary);
        font-weight: var(--font-weight-medium);
      }
    }

    /* Main content */
    & > main {
      padding: var(--size-l);
      max-width: var(--prose-max-width, 65ch);
    }

    /* Sidebar toggle - hidden on desktop */
    & [data-sidebar-toggle] {
      display: none;
    }

    /* End sidebar variant */
    &[data-side="end"] {
      grid-template-columns: 1fr var(--sidebar-width);

      & > aside {
        order: 1;
        border-inline-end: none;
        border-inline-start: 1px solid var(--border);
      }
    }

    /* Sticky sidebar */
    &[] > aside {
      position: sticky;
      top: var(--size-l);
      align-self: start;
      max-height: calc(100vh - var(--size-l) * 2);
      overflow-y: auto;
    }
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    layout-sidebar {
      display: block;

      & [data-sidebar-toggle] {
        display: flex;
        position: fixed;
        bottom: var(--size-l);
        right: var(--size-l);
        z-index: var(--z-fixed);
        width: 3rem;
        height: 3rem;
        align-items: center;
        justify-content: center;
        background: var(--primary);
        color: var(--primary-contrast);
        border: none;
        border-radius: var(--radius-full);
        box-shadow: var(--shadow-lg);
        cursor: pointer;
      }

      & > aside {
        position: fixed;
        inset-block: 0;
        inset-inline-start: 0;
        width: var(--sidebar-width);
        z-index: var(--z-modal);
        border-inline-end: 1px solid var(--border);

        &:not(:popover-open) {
          display: none;
        }

        &:popover-open {
          display: block;
        }
      }

      & > main {
        padding: var(--size-m);
      }

      &[data-side="end"] > aside {
        inset-inline-start: auto;
        inset-inline-end: 0;
        border-inline-start: 1px solid var(--border);
        border-inline-end: none;
      }
    }
  }
}
```

## Accessibility

- **Landmark**: Uses `<aside>` for complementary landmark
- **Navigation Label**: `aria-label` on nav element
- **Current Section**: `aria-current="true"` on active link
- **Mobile Toggle**: Labeled button for sidebar toggle
- **Keyboard**: All links and toggle focusable

## Examples

### Documentation Sidebar

```html
<layout-sidebar  >
  <aside>
    <nav aria-label="Documentation">
      <h2>Getting Started</h2>
      <ul>
        <li><a href="#intro">Introduction</a></li>
        <li><a href="#install">Installation</a></li>
      </ul>
      <h2>API Reference</h2>
      <ul>
        <li><a href="#methods">Methods</a></li>
        <li><a href="#events">Events</a></li>
      </ul>
    </nav>
  </aside>
  <main>
    <!-- Documentation content -->
  </main>
</layout-sidebar>
```

### Filters Sidebar (E-commerce)

```html
<layout-sidebar >
  <aside>
    <form aria-label="Filters">
      <fieldset>
        <legend>Category</legend>
        <!-- Filter options -->
      </fieldset>
      <fieldset>
        <legend>Price Range</legend>
        <!-- Price filter -->
      </fieldset>
    </form>
  </aside>
  <main>
    <!-- Product grid -->
  </main>
</layout-sidebar>
```

### Right Sidebar (Table of Contents)

```html
<layout-sidebar data-side="end" >
  <main>
    <!-- Article content -->
  </main>
  <aside>
    <nav aria-label="Table of contents">
      <!-- TOC links -->
    </nav>
  </aside>
</layout-sidebar>
```

## Related Patterns

- [layout-stack.page](./layout-stack.md)
- [nav-menu](../navigation/nav-menu.md)
- [table-of-contents](../navigation/table-of-contents.md)
