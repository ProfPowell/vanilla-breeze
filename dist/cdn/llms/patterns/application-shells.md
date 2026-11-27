# App Shells

Application shell layouts for web apps, dashboards, and admin interfaces. Header, sidebar, and content area patterns.

- Documentation: https://vanilla-breeze.com/docs/patterns/application/shells/
- Vanilla Breeze 0.7.4

## Overview

App shells define the overall structure of your application, organizing navigation, content areas, and auxiliary panels. Choose a layout based on your application's navigation needs and content complexity.

Key features:
- Semantic HTML5 structure with header, nav, main, and aside
- Responsive layouts that adapt to different screen sizes
- Flexible content areas using layout primitives
- Accessible navigation patterns with proper ARIA labels

## Stacked Layout

The traditional layout with a header on top and main content below. Best for content-focused applications where vertical space is important.

A button holding only an `<icon-wc>` plus an `aria-label` is squared automatically; no extra class is needed.

shell-stacked.html:

```html
<body data-page-layout="stack" data-layout-gap="none">
  <header data-layout="cluster" data-layout-justify="between">
    <a href="/"><brand-mark>AppName</brand-mark></a>
    <nav class="horizontal pills" aria-label="Main navigation">
      <ul>
        <li><a href="/dashboard" aria-current="page">Dashboard</a></li>
        <li><a href="/projects">Projects</a></li>
        <li><a href="/reports">Reports</a></li>
        <li><a href="/settings">Settings</a></li>
      </ul>
    </nav>
    <layout-cluster data-layout-gap="s">
      <button type="button" class="button small" aria-label="Notifications">
        <icon-wc name="bell"></icon-wc>
      </button>
      <button type="button" class="button small" aria-label="User menu">
        <icon-wc name="user"></icon-wc>
      </button>
    </layout-cluster>
  </header>

  <main>
    <layout-center data-layout-max="wide" data-layout-gap="l">
      <h1>Dashboard</h1>
      <!-- Page content here -->
    </layout-center>
  </main>

  <footer>
    <p>&copy; 2026 AppName. All rights reserved.</p>
  </footer>
</body>
```

## Sidebar + Content

A fixed sidebar navigation with a main content area. Ideal for dashboards and admin interfaces with many navigation items.

shell-sidebar.html:

```html
<body data-page-layout="sidebar-left" data-layout-gap="none" data-layout-sidebar-width="narrow">
  <nav class="vertical" data-layout="stack" data-layout-gap="l" data-layout-sticky aria-label="Main navigation">
    <a href="/"><brand-mark>AppName</brand-mark></a>
    <ul>
      <li><a href="/dashboard" aria-current="page">
        <icon-wc name="home"></icon-wc> Dashboard
      </a></li>
      <li><a href="/projects">
        <icon-wc name="folder"></icon-wc> Projects
      </a></li>
      <li><a href="/team">
        <icon-wc name="users"></icon-wc> Team
      </a></li>
      <li><a href="/reports">
        <icon-wc name="chart-bar"></icon-wc> Reports
      </a></li>
      <li><a href="/settings">
        <icon-wc name="cog"></icon-wc> Settings
      </a></li>
    </ul>
  </nav>

  <main data-layout="stack" data-layout-gap="none">
    <header data-layout="cluster" data-layout-justify="between">
      <h1>Dashboard</h1>
      <layout-cluster data-layout-gap="s">
        <input type="search" placeholder="Search..." aria-label="Search" />
        <button type="button" class="button" aria-label="User menu">
          <icon-wc name="user"></icon-wc>
        </button>
      </layout-cluster>
    </header>

    <section data-layout="stack" data-layout-gap="l">
      <!-- Page content here -->
    </section>
  </main>
</body>
```

## Multi-Column Layout

A three-column layout with sidebar navigation, main content, and a right panel. Perfect for email clients, chat applications, or content management systems.

The message list is this recipe's own look. It needs no classes: the rules select the list by position and the selected message by `aria-current`.

shell-multi-column.html:

```html
<body data-page-layout="holy-grail" data-layout-gap="none" data-layout-sidebar-width="narrow">
  <nav class="vertical" data-layout="stack" data-layout-gap="m" data-layout-sticky aria-label="Mail folders">
    <a href="/"><brand-mark data-size="l">Mail</brand-mark></a>
    <button type="button" class="button">Compose</button>
    <ul>
      <li><a href="/inbox" aria-current="page">
        <icon-wc name="inbox"></icon-wc> Inbox <layout-badge>12</layout-badge>
      </a></li>
      <li><a href="/sent"><icon-wc name="send"></icon-wc> Sent</a></li>
      <li><a href="/drafts"><icon-wc name="file-text"></icon-wc> Drafts</a></li>
      <li><a href="/trash"><icon-wc name="trash"></icon-wc> Trash</a></li>
    </ul>
  </nav>

  <main data-layout="stack" data-layout-gap="none">
    <header data-layout="cluster" data-layout-justify="between">
      <h1>Inbox</h1>
      <input type="search" placeholder="Search mail..." aria-label="Search mail" />
    </header>
    <ul>
      <li aria-current="true">
        <time>10:32 AM</time>
        <strong>Alice Johnson</strong>
        <p>Project Update: Q1 Goals</p>
        <p>Hi team, I wanted to share a quick update...</p>
      </li>
      <!-- More messages -->
    </ul>
  </main>

  <aside data-layout-sticky>
    <header>
      <h2>Project Update: Q1 Goals</h2>
      <!-- Sender and time -->
    </header>
    <!-- Selected message body -->
    <footer data-layout="cluster" data-layout-gap="s">
      <button type="button" class="button">Reply</button>
    </footer>
  </aside>
</body>
```

Message list CSS:

```css
main > ul {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}
main > ul > li {
  margin: 0;
  padding: var(--size-m) var(--size-l);
  border-block-end: 1px solid var(--color-border);
  background: var(--color-surface);
}
main > ul > li[aria-current] {
  background: var(--color-primary-subtle);
  border-inline-start: 3px solid var(--color-primary);
}
main > ul > li > :is(strong, p) {
  display: block;
  margin: 0 0 var(--size-2xs);
}
main > ul > li > p:last-child {
  margin: 0;
  font-size: var(--font-size-s);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
main > ul > li > time {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  float: inline-end;
}
```

## Collapsible Sidebar

A sidebar that can collapse to icons only, using native `<details>` and `<summary>` elements. Great for maximizing content space while keeping navigation accessible.

`.logo` and `.nav-label` are this recipe's own hooks, not VB classes. The logo stays a plain block link instead of `<brand-mark>` because the collapsed rail shows only its `::first-letter`, which needs a block container (brand-mark is inline-flex). `.nav-label` marks the text the rail hides. The rest selects by element and the `open` state of the `<details>`:

shell-collapsible.html:

```html
<body data-page-layout="sidebar-left" data-layout-gap="none" data-layout-sidebar-width="narrow">
  <nav aria-label="Main navigation">
    <details open>
      <summary>
        <icon-wc name="menu"></icon-wc>
        <span class="visually-hidden">Toggle sidebar</span>
      </summary>
      <layout-stack data-layout-gap="l">
        <a href="#" class="logo">AppName</a>
        <nav class="vertical" aria-label="Sidebar links">
          <ul>
            <li><a href="/dashboard" aria-current="page">
              <icon-wc name="home"></icon-wc>
              <span class="nav-label">Dashboard</span>
            </a></li>
            <!-- more nav items -->
          </ul>
        </nav>
      </layout-stack>
    </details>
  </nav>

  <main data-layout="stack" data-layout-gap="none">
    <header data-layout="cluster" data-layout-justify="between">
      <h1>Dashboard</h1>
      <!-- Header actions -->
    </header>
    <section data-layout="stack" data-layout-gap="xl" aria-label="Overview">
      <!-- Page content here -->
    </section>
  </main>
</body>
```

Collapsible sidebar CSS:

```css
body > nav > details {
  height: 100%;
  background: var(--color-surface);
  border-inline-end: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}
body > nav > details > layout-stack {
  padding: var(--size-m);
  flex: 1;
  overflow-y: auto;
}
.logo {
  display: block;
  font-weight: 600;
  font-size: var(--font-size-l);
  text-decoration: none;
  color: var(--color-text);
}

/* Collapsed: narrow the page-layout sidebar, show icons only */
body:has(> nav > details:not([open])) {
  --_sidebar-width: 4rem;
}
details:not([open]) .logo {
  font-size: 0;
}
details:not([open]) .logo::first-letter {
  font-size: var(--font-size-l);
}
details:not([open]) .nav-label {
  display: none;
}
details:not([open]) nav.vertical a {
  padding: var(--size-s);
  justify-content: center;
}

/* Expanded: icon and label side by side */
details[open] nav.vertical a {
  display: flex;
  align-items: center;
  gap: var(--size-s);
}
```

## Configuration

App shells use these layout elements and attributes:

## Usage Notes

- Full height: `data-page-layout` handles this automatically with `min-height: 100dvh`
- Sticky elements: Use the `data-layout-sticky` attribute on nav or aside elements
- Responsive: `data-page-layout` layouts auto-stack on narrow viewports (< 768px)
- Collapsible sidebar: Use `<details>`/`<summary>` inside `<nav>` for zero-JS collapse
- Accessibility: Include skip links, proper heading hierarchy, and ARIA labels on navigation landmarks

## Related

Stats cards, tables, and chart layouts

Vertical navigation patterns

Settings page with tabs and forms

User profile layouts and cards
