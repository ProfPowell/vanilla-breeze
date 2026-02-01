# Wireframe Mode Enhancement Roadmap

This document outlines potential future enhancements for the wireframe mode feature. These ideas range from quick wins to more ambitious features.

## Current State (v1.0)

**Implemented:**
- Three fidelity levels: lo-fi (sketch), mid-fi (blocks), hi-fi (preview)
- Wireframe fonts: Redacted Script, Flow Block, Flow Circular, Flow Rounded
- Element labeling via `data-wf-label` attribute
- Image placeholders with X-pattern and labels from alt text
- Dark mode support
- JavaScript API for programmatic control

---

## Phase 1: Content Abstraction

### 1.1 Lorem Ipsum Generator

Replace actual text content with placeholder text while preserving structure.

```javascript
// API concept
wireframe.abstractContent({
  mode: 'lorem',      // 'lorem' | 'redacted' | 'blocks'
  preserveLength: true,
  preserveStructure: true
});
```

**Modes:**
- `lorem` - Replace with lorem ipsum text matching approximate length
- `redacted` - Replace with █████ block characters
- `blocks` - Replace with gray rectangles (pure CSS)

**Implementation considerations:**
- Store original content for restoration
- Handle dynamic content (SPAs)
- Respect `data-wf-preserve` attribute to keep certain content visible

### 1.2 Smart Content Detection

Automatically identify and label content types:

| Content Type | Detection Method | Label |
|--------------|------------------|-------|
| Hero text | Large heading + subtext pattern | "Hero Copy" |
| CTA buttons | Button near hero | "Call to Action" |
| Navigation | `<nav>` or role="navigation" | "Navigation" |
| Card content | Repeated similar structures | "Card Content" |
| Form fields | `<input>`, `<textarea>` | "Form Input" |
| Pricing | Currency symbols, `/mo`, `/yr` | "Pricing" |

### 1.3 Placeholder Data Sets

Pre-built content replacement sets:

```javascript
wireframe.useDataSet('ecommerce'); // Product names, prices, descriptions
wireframe.useDataSet('blog');      // Article titles, excerpts, dates
wireframe.useDataSet('dashboard'); // Metrics, chart labels, table data
wireframe.useDataSet('social');    // Usernames, posts, timestamps
```

---

## Phase 2: Visual Enhancements

### 2.1 Grid Overlay

Show underlying grid structure:

```css
[data-wireframe][data-show-grid] {
  background-image:
    repeating-linear-gradient(
      90deg,
      var(--wireframe-accent) 0,
      var(--wireframe-accent) 1px,
      transparent 1px,
      transparent var(--grid-column-width)
    );
}
```

**Features:**
- Toggle column grid visibility
- Show baseline grid for typography
- Highlight grid gaps and gutters
- Display responsive breakpoint indicators

### 2.2 Spacing Visualization

Visualize margins, padding, and gaps:

```javascript
wireframe.showSpacing({
  margins: true,   // Red overlay
  padding: true,   // Green overlay
  gaps: true       // Blue overlay
});
```

**Inspiration:** Browser DevTools box model visualization

### 2.3 Rough Borders Integration

Combine with existing `rough-borders` extension for sketch aesthetic:

```html
<html data-wireframe="lo" data-rough-borders>
```

**Enhancements:**
- Hand-drawn style borders in lo-fi mode
- Wobbly lines for that napkin-sketch feel
- SVG filter for pencil texture

### 2.4 Color Palette Modes

Different color schemes for wireframes:

| Mode | Description |
|------|-------------|
| `mono` | Black and white only (current lo-fi) |
| `grayscale` | Shades of gray (current mid-fi) |
| `blueprint` | Blue and white technical drawing style |
| `sepia` | Warm brown tones, vintage feel |
| `neon` | Dark background with bright outlines |

```html
<html data-wireframe="mid" data-wf-palette="blueprint">
```

---

## Phase 3: Annotation & Documentation

### 3.1 Interactive Annotations

Add notes and callouts to elements:

```javascript
wireframe.annotate('.hero', {
  note: 'Hero should be 60vh minimum',
  type: 'requirement',  // 'requirement' | 'question' | 'todo'
  author: 'Designer'
});
```

**Visual treatment:**
- Numbered callout badges
- Connecting lines to annotated elements
- Sidebar panel with all annotations
- Export annotations as markdown

### 3.2 Component Boundaries

Visualize component/section boundaries:

```css
[data-wireframe="annotate"] [data-component] {
  outline: 2px dashed var(--wireframe-accent);
  outline-offset: 4px;
}

[data-wireframe="annotate"] [data-component]::before {
  content: attr(data-component);
  /* Component name badge */
}
```

### 3.3 Responsive Breakpoint Preview

Show how layout changes at different breakpoints:

```javascript
wireframe.previewBreakpoints({
  show: ['mobile', 'tablet', 'desktop'],
  side: 'right',  // Breakpoint indicator position
  highlight: true // Flash elements that change
});
```

---

## Phase 4: Export & Integration

### 4.1 Screenshot Export

Capture wireframe state as images:

```javascript
await wireframe.export({
  format: 'png',        // 'png' | 'svg' | 'pdf'
  selector: '.main',    // Optional: specific section
  scale: 2,             // Retina support
  filename: 'homepage-wireframe'
});
```

### 4.2 Design Tool Export

Export structure for design tools:

**Figma:**
- Generate Figma-compatible JSON
- Preserve layer hierarchy
- Include auto-layout hints

**Sketch:**
- Export as Sketch file
- Map HTML structure to artboards

### 4.3 Specification Document

Auto-generate design specs:

```javascript
wireframe.generateSpec({
  include: ['typography', 'spacing', 'colors', 'components'],
  format: 'markdown',  // 'markdown' | 'html' | 'pdf'
  output: './design-spec.md'
});
```

Output includes:
- Typography scale and usage
- Spacing values used
- Color palette
- Component inventory with dimensions

### 4.4 Diff View

Compare wireframe states:

```javascript
wireframe.diff({
  before: 'snapshot-v1',
  after: 'current',
  highlight: true  // Highlight changed areas
});
```

---

## Phase 5: Workflow Integration

### 5.1 Site Scaffolding Integration

Include wireframe mode in site template wizard:

```bash
npx vanilla-breeze create my-site --wireframe
```

**Features:**
- Start with wireframe mode enabled
- Pre-labeled semantic sections
- Placeholder content ready to replace
- Easy toggle to production styles

### 5.2 Component Library Preview

Wireframe mode for component documentation:

```html
<!-- In Storybook or component docs -->
<component-preview data-wireframe="mid">
  <my-card>...</my-card>
</component-preview>
```

### 5.3 A/B Layout Testing

Quick layout variation testing:

```javascript
wireframe.layouts({
  'Layout A': { /* CSS overrides */ },
  'Layout B': { /* CSS overrides */ },
  'Layout C': { /* CSS overrides */ }
});
// Creates toggle UI to switch between layouts
```

### 5.4 Accessibility Audit Integration

Combine wireframe view with accessibility checks:

```javascript
wireframe.audit({
  showLandmarks: true,    // Highlight ARIA landmarks
  showHeadings: true,     // Show heading hierarchy
  showTabOrder: true,     // Display focus order
  showAltText: true       // Show image alt as labels (already done!)
});
```

---

## Phase 6: Advanced Features

### 6.1 Animation Preview

Visualize animations and transitions:

```css
[data-wireframe][data-show-motion] [data-motion] {
  /* Show motion paths */
  /* Indicate timing/easing */
  /* Ghost states for start/end */
}
```

### 6.2 Content Priority Mapping

Visualize content hierarchy with heat map:

```javascript
wireframe.showPriority({
  method: 'viewport',  // 'viewport' | 'semantic' | 'visual'
  // viewport: Distance from top
  // semantic: Heading level
  // visual: Size/contrast
});
```

### 6.3 Performance Hints

Show potential performance issues:

- Large images without lazy loading
- Too many DOM elements in section
- Complex CSS selectors
- Layout shift indicators

### 6.4 Collaborative Mode

Real-time collaboration on wireframes:

- Shared annotation layer
- Cursor presence
- Comments and reactions
- Version history

---

## Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| High | Lorem ipsum generator | Medium | High |
| High | Grid overlay | Low | Medium |
| High | Screenshot export | Medium | High |
| Medium | Rough borders integration | Low | Medium |
| Medium | Color palette modes | Low | Medium |
| Medium | Spacing visualization | Medium | Medium |
| Medium | Interactive annotations | High | High |
| Low | Design tool export | High | Medium |
| Low | Collaborative mode | Very High | High |

---

## Technical Considerations

### Performance

- Use CSS containment for wireframe overlays
- Lazy-load annotation UI
- Debounce resize handlers for responsive preview
- Use IntersectionObserver for large documents

### Browser Support

- Core features: All modern browsers
- SVG filters (rough borders): Chrome, Firefox, Safari
- CSS `@layer`: Chrome 99+, Firefox 97+, Safari 15.4+
- View Transitions (for layout switching): Chrome 111+

### Accessibility

- Wireframe mode should not break screen reader navigation
- Annotations should be in accessible format
- Color modes should maintain WCAG contrast
- Provide keyboard shortcuts for common actions

---

## Related Files

- `src/utils/wireframe.css` - Core wireframe styles
- `src/utils/wireframe-fonts.css` - Google Fonts imports
- `src/lib/wireframe.js` - JavaScript utilities
- `site/pages/lab/experiments/wireframe-mode.astro` - Demo page

---

## References

- [Redacted Font](https://github.com/christiannaths/Redacted-Font) - Inspiration for text abstraction
- [Flow Font](https://fonts.google.com/specimen/Flow+Block) - Google's wireframe fonts
- [Balsamiq](https://balsamiq.com/) - Sketch-style wireframe aesthetic
- [Excalidraw](https://excalidraw.com/) - Hand-drawn diagram style
- [Figma Dev Mode](https://www.figma.com/dev-mode/) - Design-to-code workflow
