# Navbar Patterns

Header navigation patterns with dropdowns, search, and mobile responsive menus.

- Documentation: https://vanilla-breeze.com/docs/patterns/navigation/navbar/
- Vanilla Breeze 0.7.4

## Overview

Navigation bars are the primary way users navigate your site. These patterns use `header.site` for the base layout (flex, padding, border) and `nav.horizontal` with `<ul>`/`<li>` for horizontal link spacing with list semantics. VB's `header.site nav` automatically provides muted, compact link styling — no custom CSS needed for most navbars.

Key features:
- Semantic HTML with proper ARIA attributes
- Active page indication via `aria-current="page"`
- Dropdown menus using `drop-down` component
- Mobile-responsive menu with the `<mobile-menu>` element and a native popover
- Sticky header variant with `data-sticky` attribute

## Simple Horizontal Nav

A basic navigation bar with horizontal links. Uses `header.site` for layout and `aria-current="page"` to indicate the active page. Zero custom CSS required — all styling comes from VB's `header.site` and `nav` styles.

Simple horizontal nav:

```html
<header class="site">
  <a href="/"><brand-mark>Acme Co</brand-mark></a>
  <nav class="horizontal" aria-label="Main navigation">
    <ul>
      <li><a href="/products/">Products</a></li>
      <li><a href="/pricing/">Pricing</a></li>
      <li><a href="/about/" aria-current="page">About</a></li>
      <li><a href="/contact/">Contact</a></li>
    </ul>
  </nav>
</header>
```

## With Dropdown Menus

Navigation with dropdown submenus using the `drop-down` component. Dropdowns are keyboard accessible and close on outside click or Escape. The `no-flip` attribute prevents menus from flipping upward in constrained viewports.

Nav with dropdown menus:

```html
<header class="site">
  <a href="/"><brand-mark>Acme Co</brand-mark></a>
  <nav class="horizontal" aria-label="Main navigation">
    <ul>
      <li>
        <drop-down no-flip>
          <button data-trigger class="ghost">Products</button>
          <menu>
            <li><a href="/products/software/">Software</a></li>
            <li><a href="/products/hardware/">Hardware</a></li>
            <li><a href="/products/services/">Services</a></li>
          </menu>
        </drop-down>
      </li>
      <li><a href="/pricing/">Pricing</a></li>
      <li>
        <drop-down no-flip>
          <button data-trigger class="ghost">Resources</button>
          <menu>
            <li><a href="/docs/">Documentation</a></li>
            <li><a href="/blog/">Blog</a></li>
            <li><a href="/support/">Support</a></li>
          </menu>
        </drop-down>
      </li>
      <li><a href="/contact/">Contact</a></li>
    </ul>
  </nav>
</header>
```

## With Search

Navigation bar with an integrated search field. The `<search>` element uses the `.with-icon` class for positioned `<icon-wc>` icons.

One small override to constrain the search input width in nav context:

Nav with search field:

```html
<header class="site">
  <a href="/"><brand-mark>Acme Co</brand-mark></a>
  <nav class="horizontal" aria-label="Main navigation">
    <ul>
      <li><a href="/products/">Products</a></li>
      <li><a href="/pricing/">Pricing</a></li>
      <li><a href="/about/">About</a></li>
    </ul>
  </nav>
  <search class="header with-icon rounded">
    <icon-wc name="search" size="sm"></icon-wc>
    <input type="search" placeholder="Search..." aria-label="Search site" />
  </search>
</header>
```

Search width override:

```css
/* Search input width override for nav context */
header.site search input {
  min-inline-size: 180px;
  inline-size: auto;
}
```

## Mobile Responsive

A responsive navbar that swaps the desktop links for a menu button on smaller screens. The `<mobile-menu>` element watches the viewport: at or below its `breakpoint` it hides the sibling `<nav>` and shows its own trigger. The panel is a native `popover`, so opening, closing, Esc and light dismiss need no script of your own, and no custom CSS.

Theme the panel with the `--mobile-menu-*` tokens listed on the mobile-menu page. The default breakpoint is `52rem`; a custom value such as `48rem` needs JavaScript, so without it the desktop nav stays visible.

Mobile responsive nav:

```html
<header class="site">
  <a href="/"><brand-mark>Acme Co</brand-mark></a>
  <nav class="horizontal" aria-label="Main navigation">
    <ul>
      <li><a href="/products/">Products</a></li>
      <li><a href="/pricing/">Pricing</a></li>
      <li><a href="/about/" aria-current="page">About</a></li>
      <li><a href="/contact/">Contact</a></li>
    </ul>
  </nav>
  <mobile-menu breakpoint="48rem">
    <button type="button" data-trigger popovertarget="site-menu" aria-label="Menu">
      <icon-wc name="menu"></icon-wc>
    </button>
    <nav popover id="site-menu" class="mobile-menu-panel" aria-label="Site menu">
      <button type="button" class="mobile-menu-close" popovertarget="site-menu"
              popovertargetaction="hide" aria-label="Close menu">
        <icon-wc name="x"></icon-wc>
      </button>
      <ul>
        <li><a href="/products/">Products</a></li>
        <li><a href="/pricing/">Pricing</a></li>
        <li><a href="/about/" aria-current="page">About</a></li>
        <li><a href="/contact/">Contact</a></li>
      </ul>
    </nav>
  </mobile-menu>
</header>
```

## Sticky Header

A navigation bar that stays fixed at the top of the viewport as the user scrolls. Add `data-sticky` to the header for position, z-index, and background, then enhance with a backdrop blur.

Sticky header nav:

```html
<header data-sticky class="site">
  <a href="/"><brand-mark>Acme Co</brand-mark></a>
  <nav class="horizontal" aria-label="Main navigation">
    <ul>
      <li><a href="/products/">Products</a></li>
      <li><a href="/pricing/">Pricing</a></li>
      <li><a href="/about/">About</a></li>
      <li><a href="/contact/">Contact</a></li>
      <li><a href="/get-started/" class="button small">Get Started</a></li>
    </ul>
  </nav>
</header>
```

Sticky header enhancement:

```css
/* Backdrop blur enhancement for sticky header */
header.site[data-sticky] {
  backdrop-filter: blur(8px);
  background: oklch(from var(--color-surface) l c h / 0.9);
}
```

## Built-in Styles

VB handles all base navbar styling automatically — no custom CSS needed for the simple, dropdown, or sticky variants:

What VB provides (no custom CSS needed):

```css
/* No custom header/nav CSS needed!
 * header.site provides: flex layout, padding, border
 * header.site nav overrides: muted link color, compact padding
 * nav a handles: text-decoration, transitions, hover/active states
 * aria-current="page" gets: interactive color + medium weight */
```

## Usage Notes

- Layout: `header.site` provides flex layout with `justify-content: space-between` — brand-mark left, nav right, automatically
- Nav styling: `header.site nav` sets muted link color, compact padding, and hover transitions via CSS custom properties
- List semantics: Always use `<ul>`/`<li>` inside `<nav>` — screen readers announce "navigation, list, 4 items" which helps users understand the scope
- Accessibility: Always use `aria-label` on `<nav>` to identify its purpose (e.g., "Main navigation")
- Active state: Use `aria-current="page"` on the link representing the current page
- Dropdowns: The `drop-down` component handles keyboard navigation and ARIA automatically. Use `no-flip` in constrained viewports
- Mobile menu: Give the popover `<nav>` an `aria-label` so it is a named navigation landmark, and keep a close button inside it with `popovertargetaction="hide"`. `popovertarget` gives the trigger `aria-expanded` automatically
- Sticky: Add `data-sticky` to `header.site` for position/z-index/background, then add backdrop-filter for a polished effect
- Skip links: Add a skip-to-content link before the nav for keyboard users

## Related

Native navigation element documentation

Dropdown web component documentation

Vertical sidebar navigation patterns

Dropdown menu snippets and examples
