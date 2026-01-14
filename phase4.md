# Phase 4: Vanilla Breeze Snippets & Starters

## Goals

Create a comprehensive library of vanilla-breeze-native snippets, patterns, and starter templates that:

1. **Follow VB conventions** - Proper token names, layer architecture, data attributes
2. **Support modern SSGs** - First-class Astro and Eleventy integration
3. **Enable rapid prototyping** - Copy-paste ready snippets for common UI patterns
4. **Maintain consistency** - All code follows the same design system

---

## Problem Statement

The existing `.claude/` directory contains patterns and starters from a generic project template. These don't follow vanilla-breeze conventions:

| Issue | Generic Template | Vanilla Breeze |
|-------|-----------------|----------------|
| Token naming | `--spacing-xl`, `--surface` | `--size-xl`, `--color-surface` |
| Styling approach | BEM classes, utility classes | Data attributes, layout elements |
| Color system | `--color-primary-500` | OKLCH with `light-dark()` |
| CSS architecture | Flat files | `@layer` cascade |
| Interactivity | JS-first | Progressive enhancement |

---

## Deliverables

### 1. Core Snippets Library (`/snippets/`)

Ready-to-use code snippets for common patterns:

**HTML Snippets**
- Page shell with proper head setup
- Navigation tree pattern
- Article/content layout with sidebar
- Accessible form with form-field elements
- Responsive card grid
- Hero section using cover layout

**CSS Snippets**
- Minimal token starter
- Layer setup declaration
- Theme switching styles
- Grid configurations
- Typography scale

**Component Snippets**
- Accordion, tabs, dropdown
- Toast notifications
- Modal dialogs

### 2. Astro Integration (`/integrations/astro/`)

**Components**
- BaseHead.astro - Head with VB styles
- ThemeToggle.astro - Theme switcher
- NavTree.astro - Tree navigation
- PageToc.astro - Table of contents
- CodeBlock.astro - Syntax highlighting
- Card.astro - Layout card wrapper
- FormField.astro - Form field wrapper

**Layouts**
- BaseLayout.astro - Minimal page shell
- DocsLayout.astro - Documentation page
- BlogLayout.astro - Blog post
- LandingLayout.astro - Marketing page

**Starters**
- Documentation site
- Blog
- Landing page
- Dashboard

### 3. Eleventy Integration (`/integrations/eleventy/`)

**Includes & Partials**
- base.njk - Base template
- nav-tree.njk - Navigation partial
- page-toc.njk - TOC partial
- code-block.njk - Code highlighting

**Data Files**
- site.json - Site metadata
- navigation.json - Nav structure

**Layouts**
- page.njk, docs.njk, blog.njk

**Starters**
- Documentation site
- Blog
- Portfolio

### 4. Pattern Library Updates

Convert existing `.claude/patterns/` to VB conventions:
- Replace generic tokens with VB tokens
- Replace utility classes with layout elements
- Add proper @layer declarations
- Use data-* attributes for variants
- Apply progressive enhancement

### 5. Automation & Tooling

**CLI Commands**
- `bd scaffold astro` - Create Astro project with VB
- `bd scaffold 11ty` - Create Eleventy project with VB
- `bd add snippet <name>` - Insert snippet
- `bd add component <name>` - Add component

**VS Code Snippets**
- vb-page, vb-stack, vb-grid, vb-card, vb-form, vb-tokens

---

## Success Criteria

- [ ] All snippets use correct VB token names
- [ ] All patterns use layout elements (not utility classes)
- [ ] All interactive components follow progressive enhancement
- [ ] Astro/11ty starters work with `npm install && npm run dev`
- [ ] All code passes WCAG 2.1 AA accessibility
- [ ] Light/dark theme support in all patterns

---

## Implementation Priority

1. **Core snippets** - Foundation for everything else
2. **Astro integration** - Modern SSG, growing ecosystem
3. **Eleventy integration** - Template-based SSG, mature ecosystem
4. **Pattern conversion** - Improve existing resources
5. **Automation** - Developer experience polish

---

## Related Files

- `/snippets/` - New snippets library
- `/integrations/astro/` - Astro components and starters
- `/integrations/eleventy/` - Eleventy templates and starters
- `.claude/patterns/` - Patterns to convert
- `.claude/starters/` - Starters to update
