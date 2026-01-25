# Wireframe Mode

## Description

Wireframe mode provides a sketch-like aesthetic for rapid HTML prototyping. Add `data-wireframe` to `<html>` or any container to instantly convert your page to a low-fidelity wireframe view. This helps focus on structure and layout without visual distractions.

## Anatomy

- **Grayscale filter**: Removes all color from the page
- **Dashed borders**: All structural elements get sketch-like borders
- **Placeholder images**: Images display as boxes with X patterns
- **Mode indicator**: Fixed badge shows "WIREFRAME" in corner

## States

| State | Description |
|-------|-------------|
| Off | Normal page rendering |
| On | Full wireframe mode with grayscale |
| Annotate | Wireframe with element labels visible |

## Variants

| Variant | Use Case |
|---------|----------|
| `data-wireframe` | Standard wireframe mode |
| `data-wireframe="annotate"` | Shows element labels for HTML structure review |

## Baseline HTML

Apply to entire page:

```html
<html lang="en" data-wireframe>
  <body>
    <!-- All content renders as wireframe -->
  </body>
</html>
```

Apply to specific container:

```html
<html lang="en">
  <body>
    <main data-wireframe>
      <!-- Only this section is wireframed -->
    </main>
  </body>
</html>
```

## CSS

The wireframe styles are automatically included via `src/utils/wireframe.css`:

```css
/* Key wireframe variables */
[data-wireframe] {
  --wireframe-stroke: oklch(40% 0 0);
  --wireframe-fill: oklch(95% 0 0);
  --wireframe-text: oklch(25% 0 0);
  --wireframe-border: 2px dashed var(--wireframe-stroke);
}

/* Apply grayscale to entire page */
html[data-wireframe] {
  filter: grayscale(1);
}

/* Structural elements get dashed borders */
[data-wireframe] :is(article, section, aside, nav, header, footer) {
  border: var(--wireframe-border) !important;
  background: var(--wireframe-fill) !important;
}
```

## JavaScript (Optional)

Toggle wireframe mode dynamically:

```javascript
// Enable wireframe mode
document.documentElement.setAttribute('data-wireframe', '');

// Enable with annotations
document.documentElement.setAttribute('data-wireframe', 'annotate');

// Disable wireframe mode
document.documentElement.removeAttribute('data-wireframe');
```

Keyboard shortcut example:

```javascript
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Shift + W toggles wireframe
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'W') {
    e.preventDefault();
    const html = document.documentElement;
    if (html.hasAttribute('data-wireframe')) {
      html.removeAttribute('data-wireframe');
    } else {
      html.setAttribute('data-wireframe', '');
    }
  }
});
```

## Accessibility

- **Reduced motion**: All animations and transitions are disabled in wireframe mode
- **No content changes**: Wireframe mode only affects visual presentation, not content structure
- **Screen readers**: Content remains fully accessible regardless of visual mode

## Examples

### Basic Usage

```html
<!doctype html>
<html lang="en" data-wireframe>
<head>
  <link rel="stylesheet" href="/src/main.css"/>
</head>
<body>
  <header>
    <h1>Site Title</h1>
    <nav>
      <a href="#">Home</a>
      <a href="#">About</a>
    </nav>
  </header>
  <main>
    <article>
      <h2>Article Title</h2>
      <p>Content here...</p>
    </article>
  </main>
  <footer>
    <p>Footer content</p>
  </footer>
</body>
</html>
```

### With Toggle Button

```html
<button onclick="document.documentElement.toggleAttribute('data-wireframe')">
  Toggle Wireframe
</button>
```

### Scoped to Container

```html
<div data-wireframe>
  <!-- Only this section shows as wireframe -->
  <layout-card>
    <h3>Card Title</h3>
    <p>Card content</p>
  </layout-card>
</div>
```

### Development Workflow

Use wireframe mode during early prototyping:

1. Build HTML structure with semantic elements
2. Enable `data-wireframe` to focus on layout
3. Iterate on structure without visual distractions
4. Remove `data-wireframe` to see final styled result

## Related Patterns

- [Skeleton Loader](./skeleton.md) - For loading states
- [Debug Mode](../layout/README.md) - For layout debugging
