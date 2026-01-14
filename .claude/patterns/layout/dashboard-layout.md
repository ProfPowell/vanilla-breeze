# Dashboard Layout

## Description

Application shell layout with fixed header, optional sidebar navigation, and scrollable main content area. Designed for data-heavy applications, admin panels, and productivity tools.

## Anatomy

- **container**: The dashboard wrapper (typically body or root)
- **header**: Fixed top navigation bar
- **sidebar**: Collapsible side navigation
- **main**: Scrollable content area
- **footer**: Optional status bar

## States

| State | Description |
|-------|-------------|
| Default | Sidebar expanded |
| Collapsed | Sidebar minimized to icons |
| Mobile | Sidebar hidden, toggle to overlay |

## Variants

### Sidebar Position

**Attribute:** `data-sidebar`
**Values:** `start`, `end`, `none`

### Sidebar State

**Attribute:** `data-sidebar-collapsed`
**Values:** `true`, `false`

### Header Style

**Attribute:** `data-header`
**Values:** `default`, `compact`, `none`

## Baseline HTML

```html
<div class="dashboard-layout">
  <header class="dashboard-header">
    <a href="/">Logo</a>
    <nav>...</nav>
  </header>
  <aside class="dashboard-sidebar">
    <nav>...</nav>
  </aside>
  <main class="dashboard-main">
    Content
  </main>
</div>
```

## Enhanced HTML

```html
<dashboard-layout >
  <header data-header>
    <a href="/" data-logo>AppName</a>
    <nav aria-label="Primary">
      <button data-sidebar-toggle aria-label="Toggle sidebar">
        <x-icon name="menu"></x-icon>
      </button>
    </nav>
    <div data-actions>
      <button data-icon-button aria-label="Notifications">
        <x-icon name="bell"></x-icon>
      </button>
      <button data-avatar>
        <img src="avatar.jpg" alt="User" />
      </button>
    </div>
  </header>

  <aside data-sidebar aria-label="Navigation">
    <nav>
      <a href="/dashboard" data-active>
        <x-icon name="home"></x-icon>
        <span>Dashboard</span>
      </a>
      <a href="/projects">
        <x-icon name="folder"></x-icon>
        <span>Projects</span>
      </a>
      <a href="/settings">
        <x-icon name="settings"></x-icon>
        <span>Settings</span>
      </a>
    </nav>
  </aside>

  <main data-main id="main">
    <h1>Dashboard</h1>
    <!-- Content -->
  </main>
</dashboard-layout>
```

## CSS

```css
@layer layout {
  dashboard-layout,
  .dashboard-layout {
    --dashboard-header-height: 4rem;
    --dashboard-sidebar-width: 16rem;
    --dashboard-sidebar-collapsed-width: 4rem;

    display: grid;
    grid-template-areas:
      "header header"
      "sidebar main";
    grid-template-columns: var(--dashboard-sidebar-width) 1fr;
    grid-template-rows: var(--dashboard-header-height) 1fr;
    min-height: 100vh;
    min-height: 100dvh;
  }

  /* No sidebar variant */
  dashboard-layout[data-sidebar="none"],
  .dashboard-layout[data-sidebar="none"] {
    grid-template-areas:
      "header"
      "main";
    grid-template-columns: 1fr;
  }

  /* End sidebar variant */
  dashboard-layout[data-side="end"],
  .dashboard-layout[data-side="end"] {
    grid-template-areas:
      "header header"
      "main sidebar";
    grid-template-columns: 1fr var(--dashboard-sidebar-width);
  }

  /* Collapsed sidebar */
  dashboard-layout[data-sidebar-collapsed="true"],
  .dashboard-layout[data-sidebar-collapsed="true"] {
    grid-template-columns: var(--dashboard-sidebar-collapsed-width) 1fr;
  }

  /* Header */
  dashboard-layout [data-header],
  .dashboard-layout .dashboard-header {
    grid-area: header;
    display: flex;
    align-items: center;
    gap: var(--size-m);
    padding-inline: var(--size-l);
    background: var(--surface, white);
    border-block-end: 1px solid var(--border, oklch(0.85 0 0));
    position: sticky;
    top: 0;
    z-index: 100;
  }

  dashboard-layout [data-logo],
  .dashboard-layout [data-logo] {
    font-size: var(--text-xl, 1.25rem);
    font-weight: var(--font-weight-bold, 700);
    color: var(--primary, oklch(0.55 0.2 250));
    text-decoration: none;
  }

  dashboard-layout [data-header] nav,
  .dashboard-layout .dashboard-header nav {
    display: flex;
    align-items: center;
    gap: var(--size-xs);
  }

  dashboard-layout [data-actions],
  .dashboard-layout [data-actions] {
    display: flex;
    align-items: center;
    gap: var(--size-xs);
    margin-inline-start: auto;
  }

  dashboard-layout [data-sidebar-toggle],
  .dashboard-layout [data-sidebar-toggle] {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: var(--radius-md, 0.5rem);
    cursor: pointer;
    color: var(--text-muted, oklch(0.5 0 0));
  }

  dashboard-layout [data-sidebar-toggle]:hover,
  .dashboard-layout [data-sidebar-toggle]:hover {
    background: var(--overlay-light, oklch(0 0 0 / 0.05));
    color: var(--text, oklch(0.2 0 0));
  }

  /* Sidebar */
  dashboard-layout [data-sidebar],
  .dashboard-layout .dashboard-sidebar {
    grid-area: sidebar;
    display: flex;
    flex-direction: column;
    background: var(--surface-alt, oklch(0.98 0 0));
    border-inline-end: 1px solid var(--border, oklch(0.85 0 0));
    overflow-y: auto;
    position: sticky;
    top: var(--dashboard-header-height);
    height: calc(100vh - var(--dashboard-header-height));
    height: calc(100dvh - var(--dashboard-header-height));
  }

  dashboard-layout [data-sidebar] nav,
  .dashboard-layout .dashboard-sidebar nav {
    display: flex;
    flex-direction: column;
    padding: var(--size-m);
    gap: var(--size-2xs);
  }

  dashboard-layout [data-sidebar] nav a,
  .dashboard-layout .dashboard-sidebar nav a {
    display: flex;
    align-items: center;
    gap: var(--size-xs);
    padding: var(--size-xs) var(--size-m);
    color: var(--text-muted, oklch(0.5 0 0));
    text-decoration: none;
    border-radius: var(--radius-md, 0.5rem);
    font-weight: var(--font-weight-medium, 500);
    transition: background var(--transition-fast, 150ms ease), color var(--transition-fast, 150ms ease);
  }

  dashboard-layout [data-sidebar] nav a:hover,
  .dashboard-layout .dashboard-sidebar nav a:hover {
    background: var(--overlay-light, oklch(0 0 0 / 0.05));
    color: var(--text, oklch(0.2 0 0));
  }

  dashboard-layout [data-sidebar] nav a[data-active],
  .dashboard-layout .dashboard-sidebar nav a[data-active] {
    background: var(--primary, oklch(0.55 0.2 250));
    color: var(--primary-contrast, white);
  }

  /* Collapsed sidebar - hide text */
  dashboard-layout[data-sidebar-collapsed="true"] [data-sidebar] nav a span,
  .dashboard-layout[data-sidebar-collapsed="true"] .dashboard-sidebar nav a span {
    display: none;
  }

  dashboard-layout[data-sidebar-collapsed="true"] [data-sidebar] nav a,
  .dashboard-layout[data-sidebar-collapsed="true"] .dashboard-sidebar nav a {
    justify-content: center;
    padding: var(--size-xs);
  }

  /* Main content */
  dashboard-layout [data-main],
  .dashboard-layout .dashboard-main {
    grid-area: main;
    padding: var(--size-l);
    overflow-y: auto;
    background: var(--surface, white);
  }

  /* Mobile: overlay sidebar */
  @media (max-width: 47.999rem) {
    dashboard-layout,
    .dashboard-layout {
      grid-template-areas:
        "header"
        "main";
      grid-template-columns: 1fr;
    }

    dashboard-layout [data-sidebar],
    .dashboard-layout .dashboard-sidebar {
      position: fixed;
      top: var(--dashboard-header-height);
      left: 0;
      bottom: 0;
      width: var(--dashboard-sidebar-width);
      transform: translateX(-100%);
      transition: transform var(--transition-normal, 200ms ease);
      z-index: 90;
      box-shadow: var(--shadow-lg, 0 10px 15px -3px oklch(0 0 0 / 0.1));
    }

    dashboard-layout[data-sidebar-open="true"] [data-sidebar],
    .dashboard-layout[data-sidebar-open="true"] .dashboard-sidebar {
      transform: translateX(0);
    }

    /* Backdrop */
    dashboard-layout[data-sidebar-open="true"]::before,
    .dashboard-layout[data-sidebar-open="true"]::before {
      content: "";
      position: fixed;
      inset: var(--dashboard-header-height) 0 0 0;
      background: oklch(0 0 0 / 0.3);
      z-index: 80;
    }
  }
}
```

## JavaScript Enhancement

```javascript
class DashboardLayout extends HTMLElement {
  connectedCallback() {
    this.toggleBtn = this.querySelector('[data-sidebar-toggle]');
    this.sidebar = this.querySelector('[data-sidebar]');

    this.toggleBtn?.addEventListener('click', () => this.toggleSidebar());

    // Close sidebar on mobile when clicking backdrop
    this.addEventListener('click', (e) => {
      if (e.target === this && this.getAttribute('data-sidebar-open') === 'true') {
        this.closeSidebar();
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.getAttribute('data-sidebar-open') === 'true') {
        this.closeSidebar();
      }
    });
  }

  toggleSidebar() {
    const isOpen = this.getAttribute('data-sidebar-open') === 'true';
    if (isOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  openSidebar() {
    this.setAttribute('data-sidebar-open', 'true');
  }

  closeSidebar() {
    this.removeAttribute('data-sidebar-open');
  }

  collapseSidebar() {
    this.setAttribute('data-sidebar-collapsed', 'true');
  }

  expandSidebar() {
    this.removeAttribute('data-sidebar-collapsed');
  }
}

customElements.define('dashboard-layout', DashboardLayout);
```

## Accessibility

- **Landmarks**: Proper header, nav, main landmarks
- **Keyboard**: Sidebar toggle accessible via keyboard
- **Focus Management**: Focus trapped in mobile sidebar overlay
- **Skip Link**: Include skip-link to main content

## Examples

### Standard Dashboard

```html
<dashboard-layout >
  <header data-header>
    <a href="/" data-logo>Admin</a>
    <nav>
      <button data-sidebar-toggle aria-label="Toggle navigation">☰</button>
    </nav>
    <div data-actions>
      <button>Profile</button>
    </div>
  </header>

  <aside data-sidebar aria-label="Main navigation">
    <nav>
      <a href="/dashboard" data-active>Dashboard</a>
      <a href="/users">Users</a>
      <a href="/settings">Settings</a>
    </nav>
  </aside>

  <main data-main id="main">
    <h1>Dashboard</h1>
    <div class="stats-grid">
      <!-- Stats cards -->
    </div>
    <div class="data-table">
      <!-- Table -->
    </div>
  </main>
</dashboard-layout>
```

### No Sidebar (Simple App)

```html
<dashboard-layout data-sidebar="none">
  <header data-header>
    <a href="/" data-logo>SimpleApp</a>
    <nav>
      <a href="/home">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>

  <main data-main id="main">
    <h1>Welcome</h1>
  </main>
</dashboard-layout>
```

## Related Patterns

- [layout-sidebar](../navigation/layout-sidebar.md)
- [site-header](../navigation/site-header.md)
- [layout-stack](../navigation/layout-stack.md)
