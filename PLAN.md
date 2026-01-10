# Vanilla Breeze Strategic Plan

> Last updated: 2026-01-09

## Overview

Vanilla Breeze is a **platform-first component system** built on semantic HTML, CSS layers, and progressive enhancement. This document consolidates the project's current state, architecture decisions, and future roadmap.

---

## Current State

### Completed Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1-3 | Core token system (spacing, typography, colors, borders, shadows, motion) | Complete |
| 4 | Native element coverage (~36 HTML elements with variants) | Complete |
| 5 | Extended layout components (layout-cover, layout-switcher, layout-imposter, layout-reel) + utility attributes ([data-loading], [data-media]) | Complete |
| 6 | Interactive web components (tabs-wc, accordion-wc, dialog-wc, tooltip-wc, toast-wc, dropdown-wc, footnotes-wc) | Complete |
| 7 | Token alignment with Open Props (numeric aliases) | Complete |

### Architecture

```css
@layer tokens, reset, native-elements, custom-elements, web-components, utils;
```

| Category | Count | Naming Convention | Example |
|----------|-------|-------------------|---------|
| Design Tokens | 7 files | `--size-*`, `--color-*`, `--font-*` | `--size-m`, `--color-text` |
| Native Elements | ~36 | Short classes + element scoping | `button.secondary` |
| Custom Elements | 14 | `layout-*` for layout primitives | `<layout-stack>` |
| Web Components | 7 | `*-wc` suffix for JS-enhanced | `<tabs-wc>` |
| Utility Attributes | 2 | `[data-*]` on any element | `[data-loading]`, `[data-media]` |

### Design Principles

1. **HTML-first**: Semantic markup works without CSS/JS
2. **CSS-second**: Styling via layers, no build step required
3. **JS-third**: Enhancement only, never required for core functionality
4. **Less is more**: Prefer native elements + data-attributes over custom elements
5. **Zero dependencies**: Works in any environment

---

## Platform Comparison

| System | Approach | Vanilla Breeze Differentiator |
|--------|----------|------------------------------|
| **Tailwind CSS** | Utility-first, build required | VB: Semantic-first, no build |
| **Bootstrap** | Component library, jQuery legacy | VB: Native elements, no JS deps |
| **Pico CSS** | Classless, semantic | VB: More granular control via data-attrs |
| **Open Props** | Token library only | VB: Full component system |
| **Shoelace** | Web Components, heavy JS | VB: CSS-first, progressive JS |
| **Lit** | Web Component framework | VB: Vanilla JS, no framework |

---

## External Components (Documentation Dependencies)

These components enhance documentation but are **not part of the core library**. They remain standalone npm packages used as dev dependencies.

### code-block (github.com/ProfPowell/code-block)

**Purpose**: Syntax-highlighted code display with copy, line highlighting, multi-file tabs

| Criterion | Assessment |
|-----------|------------|
| Progressive Enhancement | Good - Falls back to semantic `<code>` |
| Accessibility | ARIA labels, keyboard navigation |
| Dependencies | Requires highlight.js |
| Fit | Documentation enhancement |

**Recommendation**: **USE AS DEPENDENCY** (not embedded)

**Integration**:
- Add as npm dev dependency for docs
- Import in docs pages that need enhanced code display
- Keep library core dependency-free

### browser-window (github.com/ProfPowell/browser-window)

**Purpose**: Safari-style browser chrome for demo showcasing

| Criterion | Assessment |
|-----------|------------|
| Progressive Enhancement | Moderate - Visual wrapper without JS |
| Accessibility | Theming via CSS custom properties |
| Dependencies | None |
| Fit | Documentation enhancement |

**Recommendation**: **USE AS DEPENDENCY** (not embedded)

**Integration**:
- Add as npm dev dependency for docs
- Wrap live component previews in docs
- Keep library core dependency-free

---

## Remaining Roadmap

### Phase 8: Wireframe Mode

Create a CSS layer for rapid prototyping with a sketch-like aesthetic.

- Toggle via `data-wireframe` attribute on `<html>`
- Grayscale palette with rough borders
- Hand-drawn style fonts (optional)
- Placeholder imagery patterns

### Phase 9: Documentation Enhancement

Improve the documentation site using the integrated components.

- Replace all `<pre><code>` with `<code-block-wc>`
- Wrap live examples in `<browser-window-wc>`
- Add interactive playground pages
- Improve kitchen sink with all variants

### Phase 10: Starter Integration

Update the .claude/starters to use Vanilla Breeze.

- Create "vanilla-breeze-starter" template
- Update existing starters with VB integration
- Write integration guides for Astro and Eleventy
- Add VB to design-system starter

### Phase 11: Pattern Library Expansion

Connect .claude/patterns with Vanilla Breeze components.

- Migrate pattern examples to use VB elements
- Create pattern gallery in docs
- Add copy-to-clipboard for pattern code
- Document pattern → component mapping

---

## Token Reference

### Spacing Scale

| Semantic | Numeric | Value |
|----------|---------|-------|
| `--size-3xs` | - | 0.125rem (2px) |
| `--size-2xs` | `--size-1` | 0.25rem (4px) |
| `--size-xs` | `--size-2` | 0.5rem (8px) |
| `--size-s` | - | 0.75rem (12px) |
| `--size-m` | `--size-3` | 1rem (16px) |
| `--size-l` | `--size-5` | 1.5rem (24px) |
| `--size-xl` | `--size-7` | 2rem (32px) |
| `--size-2xl` | `--size-8` | 3rem (48px) |
| `--size-3xl` | `--size-9` | 4rem (64px) |

### Color Tokens

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--color-text` | gray-900 | gray-100 |
| `--color-text-muted` | gray-600 | gray-400 |
| `--color-surface` | white | gray-900 |
| `--color-border` | gray-200 | gray-700 |
| `--color-interactive` | oklch(50% 0.2 260) | oklch(70% 0.15 260) |

### Typography Scale

| Semantic | Numeric | Value |
|----------|---------|-------|
| `--font-size-xs` | `--font-size-0` | 0.75rem (12px) |
| `--font-size-sm` | `--font-size-1` | 0.875rem (14px) |
| `--font-size-md` | `--font-size-2` | 1rem (16px) |
| `--font-size-lg` | - | 1.125rem (18px) |
| `--font-size-xl` | `--font-size-3` | 1.25rem (20px) |
| `--font-size-2xl` | `--font-size-4` | 1.5rem (24px) |
| `--font-size-5xl` | `--font-size-7` | 3rem (48px) |

---

## Session Invariants

To prevent drift across development sessions:

1. **No `<div>` elements** - Always use semantic HTML
2. **No `.is-*` classes** - State via `data-*` attributes only
3. **No inline styles** - All styling through CSS layers
4. **No framework dependencies** - Vanilla JS only
5. **Logical properties only** - `inline-size` not `width`
6. **OKLCH colors** - Modern color format throughout

---

## Success Criteria

- [ ] All native HTML elements styled consistently
- [ ] Layout components cover common patterns
- [ ] Web components enhance without breaking without JS
- [ ] Documentation is comprehensive and searchable
- [ ] Tokens align with Open Props naming
- [ ] Starters demonstrate real-world usage
- [ ] Pattern library integrates with component system
