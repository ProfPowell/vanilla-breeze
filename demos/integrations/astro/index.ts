/**
 * Vanilla Breeze Astro Integration
 *
 * This module provides Astro-specific components and layouts
 * for building sites with Vanilla Breeze.
 *
 * Components:
 * - BaseHead: Standard head setup with meta tags
 * - ThemeToggle: Theme switcher button
 * - NavTree: Tree navigation from data
 * - PageToc: Auto-generated table of contents
 * - Card: layout-card wrapper
 * - FormField: form-field wrapper
 * - CodeBlock: Syntax-highlighted code
 * - BrowserWindow: Demo frame component
 *
 * Layouts:
 * - BaseLayout: Minimal page structure
 * - DocsLayout: Documentation with sidebar nav
 * - BlogLayout: Blog post with metadata
 * - LandingLayout: Marketing page structure
 *
 * Usage:
 *
 * ```astro
 * ---
 * import { BaseLayout } from 'vanilla-breeze/astro';
 * ---
 *
 * <BaseLayout title="Home" description="Welcome to our site">
 *   <h1>Hello World</h1>
 * </BaseLayout>
 * ```
 */

// Re-export components
export { default as BaseHead } from './components/BaseHead.astro';
export { default as ThemeToggle } from './components/ThemeToggle.astro';
export { default as NavTree } from './components/NavTree.astro';
export { default as PageToc } from './components/PageToc.astro';
export { default as Card } from './components/Card.astro';
export { default as FormField } from './components/FormField.astro';
export { default as CodeBlock } from './components/CodeBlock.astro';
export { default as BrowserWindow } from './components/BrowserWindow.astro';

// Re-export layouts
export { default as BaseLayout } from './layouts/BaseLayout.astro';
export { default as DocsLayout } from './layouts/DocsLayout.astro';
export { default as BlogLayout } from './layouts/BlogLayout.astro';
export { default as LandingLayout } from './layouts/LandingLayout.astro';

// Types
export interface NavItem {
  label: string;
  href?: string;
  children?: NavItem[];
}

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}
