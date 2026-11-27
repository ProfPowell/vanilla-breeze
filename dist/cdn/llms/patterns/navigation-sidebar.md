# Sidebar Navigation

Vertical sidebar navigation patterns with icons, sections, and collapsible groups.

- Documentation: https://vanilla-breeze.com/docs/patterns/navigation/sidebar/
- Vanilla Breeze 0.7.4

## Overview

Sidebar navigation provides vertical navigation typically used in application shells. These patterns use semantic `<nav>` elements with `<icon-wc>` for visual icons.

VB's native `<nav>` styles provide CSS variables for link colors, hover, and active states &mdash; so sidebar patterns only need to set variables and add layout-specific rules like `display: flex` and `gap`.

Key features:
- Semantic HTML with proper ARIA attributes
- Active page indication via `aria-current="page"`
- Icons from Lucide set via `<icon-wc>`
- Grouped sections with headings for organization
- Collapsible sections using native `<details>`/`<summary>` &mdash; VB automatically resets borders and padding for `<details>` inside `<nav>`

## Simple Sidebar

A basic vertical navigation with icon-labeled links. Uses `aria-current="page"` to indicate the active page.

Simple sidebar navigation:

```html
<aside class="sidebar">
  <nav aria-label="Main navigation">
    <ul data-layout="stack" data-layout-gap="xs">
      <li><a href="/dashboard/" aria-current="page">
        <icon-wc name="home"></icon-wc>
        Dashboard
      </a></li>
      <li><a href="/projects/">
        <icon-wc name="folder"></icon-wc>
        Projects
      </a></li>
      <li><a href="/team/">
        <icon-wc name="users"></icon-wc>
        Team
      </a></li>
      <li><a href="/calendar/">
        <icon-wc name="calendar"></icon-wc>
        Calendar
      </a></li>
      <li><a href="/reports/">
        <icon-wc name="chart-bar"></icon-wc>
        Reports
      </a></li>
    </ul>
  </nav>
</aside>
```

## Grouped Sections

Navigation organized into labeled sections using headings. Each section has its own `<nav>` element with a descriptive `aria-label` for accessibility.

Section headings use uppercase text with muted color to visually separate groups:

Grouped sidebar sections:

```html
<aside class="sidebar" data-layout="stack" data-layout-gap="l">
    <!-- Main Section -->
    <nav aria-label="Main navigation">
      <h3>Main</h3>
      <ul data-layout="stack" data-layout-gap="xs">
        <li><a href="/dashboard/" aria-current="page">
          <icon-wc name="home"></icon-wc>
          Dashboard
        </a></li>
        <li><a href="/projects/">
          <icon-wc name="folder"></icon-wc>
          Projects
        </a></li>
        <li><a href="/team/">
          <icon-wc name="users"></icon-wc>
          Team
        </a></li>
      </ul>
    </nav>

    <!-- Settings Section -->
    <nav aria-label="Settings navigation">
      <h3>Settings</h3>
      <ul data-layout="stack" data-layout-gap="xs">
        <li><a href="/settings/">
          <icon-wc name="cog"></icon-wc>
          General
        </a></li>
        <li><a href="/security/">
          <icon-wc name="shield-check"></icon-wc>
          Security
        </a></li>
      </ul>
    </nav>

    <!-- Support Section -->
    <nav aria-label="Support navigation">
      <h3>Support</h3>
      <ul data-layout="stack" data-layout-gap="xs">
        <li><a href="/help/">
          <icon-wc name="circle-help"></icon-wc>
          Help Center
        </a></li>
        <li><a href="/contact/">
          <icon-wc name="message-circle"></icon-wc>
          Contact Us
        </a></li>
      </ul>
    </nav>
</aside>
```

Section heading styles:

```css
.sidebar h3 {
  margin: 0;
  padding: var(--size-xs) var(--size-m);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}
```

## Collapsible Sections

Navigation with expandable/collapsible groups using native `<details>`/`<summary>` elements. No JavaScript required &mdash; the browser handles the toggle behavior and VB provides the chevron indicator automatically via `summary::after`.

VB's base nav styles reset `<details>` borders and content padding inside `<nav>`, so collapsible sidebar sections only need minimal summary styling.

VB handles the chevron indicator and border reset natively. You only need to style the summary text appearance and hover state:

Collapsible sidebar sections:

```html
<aside class="sidebar">
  <nav aria-label="Main navigation" data-layout="stack" data-layout-gap="xs">
      <!-- Projects Section -->
      <details open>
        <summary>Projects</summary>
        <ul data-layout="stack" data-layout-gap="2xs">
          <li><a href="/projects/" aria-current="page">
            <icon-wc name="folder"></icon-wc>
            All Projects
          </a></li>
          <li><a href="/projects/favorites/">
            <icon-wc name="star"></icon-wc>
            Favorites
          </a></li>
          <li><a href="/projects/archived/">
            <icon-wc name="archive"></icon-wc>
            Archived
          </a></li>
        </ul>
      </details>

      <!-- Team Section -->
      <details open>
        <summary>Team</summary>
        <ul data-layout="stack" data-layout-gap="2xs">
          <li><a href="/team/members/">
            <icon-wc name="users"></icon-wc>
            Members
          </a></li>
          <li><a href="/team/invitations/">
            <icon-wc name="user-plus"></icon-wc>
            Invitations
          </a></li>
        </ul>
      </details>
  </nav>
</aside>
```

Collapsible section styles:

```css
/* VB resets details borders inside nav automatically.
   Only override summary appearance and hover. */
.sidebar details summary {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  padding: var(--size-s) var(--size-m);
  border-radius: var(--radius-m);
}

.sidebar details summary:hover {
  background: var(--color-surface-raised);
}
```

## Base Sidebar Styles

These base styles are shared across all sidebar variants. Instead of writing custom `:hover` and `[aria-current]` rules, set VB's nav CSS variables and the base nav handles the rest:

Base sidebar styles:

```css
.sidebar {
  inline-size: 260px;
  min-block-size: 100vh;
  background: var(--color-surface);
  border-inline-end: 1px solid var(--color-border);
  padding: var(--size-l);
}

/* Override nav CSS variables for sidebar styling */
.sidebar nav {
  --_link-color: var(--color-text-muted);
  --_hover-bg: var(--color-surface-raised);
  --_hover-color: var(--color-text);
  --_active-bg: var(--color-interactive-muted);
  --_active-color: var(--color-interactive);
}

/* Only what CSS variables can't cover */
.sidebar nav a {
  display: flex;
  align-items: center;
  gap: var(--size-s);
  border-radius: var(--radius-m);
}

.sidebar nav a[aria-current="page"] {
  font-weight: var(--font-weight-medium);
}
```

## Configuration

Sidebar navigation is composed from layout primitives. Here are the key styling considerations:

## Usage Notes

- Accessibility: Always use `aria-label` on `<nav>` elements to identify their purpose
- Active state: Use `aria-current="page"` on the link representing the current page
- Multiple navs: When using grouped sections, give each `<nav>` a unique `aria-label`
- Icons: Ensure icons have sufficient contrast and are paired with text labels
- Width: Keep sidebar width between 200-280px for optimal readability
- Collapsible state: Use `open` attribute on `<details>` to set initial expanded state

## Related

Horizontal header navigation patterns

Full application layout patterns with sidebars

Icon web component documentation

Vertical stacking layout primitive
