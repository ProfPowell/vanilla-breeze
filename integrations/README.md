# Vanilla Breeze Integrations

Framework-specific components and templates for using Vanilla Breeze with popular static site generators.

## Available Integrations

### [Astro](./astro/)

Modern Astro components and layouts:
- 8 components (BaseHead, ThemeToggle, NavTree, PageToc, etc.)
- 4 layouts (Base, Docs, Blog, Landing)
- View transition support
- TypeScript types

### [Eleventy](./eleventy/)

Nunjucks templates and partials:
- Base template with blocks
- 3 layouts (Page, Docs, Blog)
- 6 partials (nav-tree, page-toc, theme-toggle, etc.)
- Shortcodes and filters
- Starter configuration

## Usage

Copy the relevant integration folder into your project and customize as needed.

Each integration includes:
- Components/partials for common UI patterns
- Layouts for different page types
- Configuration files
- Styles for framework-specific overrides
- Documentation

## Design Principles

All integrations follow Vanilla Breeze conventions:
- Use `--size-*` tokens for spacing
- Use `--color-*` tokens for colors
- Use `layout-*` custom elements for layouts
- Use `data-*` attributes for configuration
- Follow progressive enhancement patterns
