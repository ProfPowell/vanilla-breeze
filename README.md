# Vanilla Breeze

> Last updated: 2026-01-10

## Overview

Vanilla Breeze is a **platform-first component system** built on semantic HTML, CSS layers, and progressive enhancement. This document consolidates the project's current state, architecture decisions, and future roadmap.

---
## Design Principles

1. **HTML-first**: Semantic markup works without CSS/JS
2. **CSS-second**: Styling via layers, no build step required
3. **JS-third**: Enhancement only, never required for core functionality
4. **Less is more**: Prefer native elements + data-attributes over custom elements
5. **Zero deployed dependencies**: Works in any environment
6. **Limited tooling and project dependencies**: The repository and related tooling are limited and focused to avoid complexity and maintenance burden

---

## Project Dependencies

These components enhance documentation but are **not part of the core library**. They remain standalone npm packages used as dev dependencies.

### code-block (github.com/ProfPowell/code-block)

**Purpose**: Syntax-highlighted code display with copy, line highlighting, multi-file tabs

### browser-window (github.com/ProfPowell/browser-window)

**Purpose**: Safari-style browser chrome for demo showcasing


---

##  Roadmap and Ideas

### Missing Components and Explorations

* Drawer - Can use dialog with CSS positioning
* copy-Button - Useful for examples |
* Popover exploration.  Make sure we are utilizing popover where it can
* table improvements - address most common goals for table with sort, zebra stripping, pagination, and simple filtering Data Table.  Make sure to address sticky headers and columns.  Resizing may be a wrapper component or data- modifier with JavaScript but many things can be done with CSS alone now 
* tree view -  Modify lists to work with tree structure may be a wrapper component or data- modifier.  The main issue is likely state management of the tree and that may call for JavaScript

Consult the file 
[component-taxonomy.md](component-taxonomy.md) for information about the components that exist and relation to HTML and vanilla-breeze solutions

### Theme Builder

Write an interactive tool for building custom themes based on the current token set. The user should be able to select a base theme and customize the colors, spacing, and typography, and then export it to use in their project.

### Examples - Full Pages and Partials

Develop a set of example pages and partials to demonstrate component usage and provide a bank of copy-pasteable snippets.

Connect .claude/patterns with Vanilla Breeze components.

- Migrate pattern examples to use VB elements
- Create pattern gallery in docs
- Add copy-to-clipboard for pattern code
- Document pattern → component mapping

### Astro and Eleventy Integration

Add components for easy integration with static site generators

### Wireframe Mode for Design Iteration Markup First

Create a CSS layer for rapid prototyping with a sketch-like aesthetic.

- Toggle via `data-wireframe` attribute on `<html>`
- Grayscale palette with rough borders
- Hand-drawn style fonts (optional)
- Placeholder imagery patterns

