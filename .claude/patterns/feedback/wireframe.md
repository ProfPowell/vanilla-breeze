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

## Three-Tier Overlay Model

| System | Attribute | Purpose | Pseudo/Element | Position |
|--------|-----------|---------|----------------|----------|
| **Labels** | `data-wf-label` | "What this IS" — structural name | `::before` badge | Top-left inside |
| **Annotations** | `data-wf-annotate` | "What tag this uses" — developer ref | `::after` monospace | Top-right outside |
| **Callouts** | `data-wf-callout` | "What a reviewer thinks" — design comments | Injected `<mark>` | Top-right corner + footnote panel |

All three can be active simultaneously without collision.

## Fidelity Levels

| Level | Fonts | Borders | Colors | Best For |
|-------|-------|---------|--------|----------|
| `lo` | Redacted Script (scribble) | Rough dashed | Pure B&W | Early concept sketches |
| `mid` (default) | Flow Block | Dashed | Grayscale | Layout review |
| `hi` | System fonts | Subtle | Near-production | Content review, stakeholder demos |
| `annotate` | System fonts | Labeled | Grayscale + labels | Design specs, developer handoff |

## Variants

| Variant | Use Case |
|---------|----------|
| `data-wireframe` | Standard wireframe mode (same as mid) |
| `data-wireframe="lo"` | Sketch-like lo-fi wireframe |
| `data-wireframe="mid"` | Block-font wireframe |
| `data-wireframe="hi"` | Near-production preview |
| `data-wireframe="annotate"` | Shows element labels for HTML structure review |
| `data-wf-annotate` | Composable annotation layer (works with any fidelity) |
| `data-wf-callout="text"` | Design review comment with numbered marker |

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

## JavaScript API

The JS API is available via `VanillaBreeze.wireframe` when `dev.js` is loaded.

```javascript
// Toggle wireframe on/off (returns boolean)
VanillaBreeze.wireframe.toggle();
VanillaBreeze.wireframe.toggle('lo'); // toggle with specific fidelity

// Set fidelity directly
VanillaBreeze.wireframe.setFidelity('hi');
VanillaBreeze.wireframe.setFidelity(''); // disable

// Query state
VanillaBreeze.wireframe.isActive();   // → true/false
VanillaBreeze.wireframe.getFidelity(); // → 'lo'|'mid'|'hi'|'annotate'|null

// Label elements
VanillaBreeze.wireframe.labelElements(); // auto-label all
VanillaBreeze.wireframe.label('.hero', 'Hero Banner'); // manual

// Composable annotations (layers on top of any fidelity)
VanillaBreeze.wireframe.toggleAnnotations();

// Callouts — design review comments
VanillaBreeze.wireframe.addCallout('.hero', 'Needs larger CTA');
VanillaBreeze.wireframe.renderCallouts();
VanillaBreeze.wireframe.renderCalloutPanel();
VanillaBreeze.wireframe.toggleCallouts();
VanillaBreeze.wireframe.removeCallout('.hero');
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
