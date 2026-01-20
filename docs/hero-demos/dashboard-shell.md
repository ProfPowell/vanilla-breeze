# Dashboard App Shell

**Tagline:** "Full app layout. One attribute."

## The Wow Factor

`data-layout="dashboard"` creates a complete app shell with sticky header, sticky sidebar, and mobile drawer animation - all from one data attribute.

## How It Works

### Desktop (> 48rem)
- CSS Grid: header spans full width, sidebar + main below
- Header: sticky at top (z-index: 10)
- Sidebar: sticky below header, independent scroll
- Main: fills remaining space

### Mobile (< 48rem)
- Single column layout
- Sidebar becomes slide-out drawer
- Toggle with `data-nav-open` attribute
- Animated transition (transform + transition)

## Usage

```html
<body data-layout="dashboard">
  <header>Dashboard Header</header>
  <nav>Sidebar Navigation</nav>
  <main>Main Content</main>
</body>

<!-- Toggle mobile drawer -->
<script>
  document.body.toggleAttribute('data-nav-open');
</script>
```

## Available Attributes

| Attribute | Values | Default |
|-----------|--------|---------|
| data-sidebar-width | narrow (12rem), normal (16rem), wide (20rem) | 16rem |
| data-header-height | 3rem, 3.5rem, 4rem | 3.5rem |
| data-nav-open | (boolean) | false |

## Demo Features

- Uses `icon-wc` for navigation icons
- Mobile hamburger menu toggles drawer
- Overlay closes drawer on click
- Escape key closes drawer
- Contained within demo region

## See Also

Link to demo: [View Demo](./dashboard-shell.html)
