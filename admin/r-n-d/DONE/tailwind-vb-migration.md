---
title: Vanilla Breeze for Tailwind Users
description: How Vanilla Breeze's approach differs from Tailwind, and how to think about the shift.
tags:
  - migration
  - tailwind
  - guide
---

# Vanilla Breeze for Tailwind Users

If you're coming from Tailwind, Vanilla Breeze will feel philosophically backwards at first. That's intentional. This guide explains the shift, maps familiar patterns to VB equivalents, and shows where you gain leverage you didn't have before.

## Table of Contents

- [The Core Difference](#the-core-difference)
- [Build-Up vs. Opt-Out](#build-up-vs-opt-out)
- [Utility Classes: You Still Get Them](#utility-classes-you-still-get-them)
- [Theming: Tokens vs. Config](#theming-tokens-vs-config)
- [Responsive Design](#responsive-design)
- [Overrides and One-offs](#overrides-and-one-offs)
- [What You Give Up](#what-you-give-up)
- [What You Gain](#what-you-gain)
- [Cheat Sheet](#cheat-sheet)

---

## The Core Difference

Tailwind starts with a reset — a blank slate — and you build everything up with classes. Every visual property is expressed in markup.

Vanilla Breeze starts with sensible defaults and steps aside. The HTML is clean. CSS does its job. You only write styles when you need to *change* something.

```html
<!-- Tailwind -->
<button class="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500">
  Submit
</button>

<!-- Vanilla Breeze -->
<button>Submit</button>
```

The VB button has full styling — colours, spacing, focus ring, hover state — because the theme defines it. You write classes when you need to deviate, not to construct from nothing.

## Build-Up vs. Opt-Out

| Tailwind | Vanilla Breeze |
|----------|----------------|
| No styles by default | Styled by default |
| Add classes to build up | Override tokens or classes to change |
| Style lives in HTML | Style lives in CSS |
| Purge unused classes at build time | No build step required |

This isn't anti-utility. It's proportional. Most elements on a page should look like the theme. Classes are for exceptions.

## Utility Classes: You Still Get Them

Vanilla Breeze ships a utilities layer. The key difference: VB utilities are **token-connected**, not value-baked.

```css
/* Tailwind (value baked in at build) */
.bg-blue-600 { background-color: #2563eb; }

/* Vanilla Breeze (token-connected) */
.bg-primary { background: var(--color-primary); }
```

The VB version changes meaning depending on theme context. Inside a `[data-theme="cyber"]` section, `.bg-primary` gives you *cyber*'s primary colour, not a hardcoded hex. Tailwind cannot do this — its utility values are fixed at build time.

```html
<section data-theme="swiss">
  <div class="bg-primary">Swiss red</div>
</section>

<section data-theme="cyber">
  <div class="bg-primary">Cyber green</div>  <!-- same class, different value -->
</section>
```

## Theming: Tokens vs. Config

In Tailwind you extend `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: { brand: '#e63312' }
  }
}
```

In Vanilla Breeze, tokens are CSS custom properties — live, runtime, inheritable:

```css
[data-theme="swiss"] {
  --color-primary: #e63312;
  --font-heading: "Helvetica Neue", sans-serif;
  --radius-md: 2px;
}
```

No config file. No rebuild when you change a value. Themes can be swapped at runtime with a single attribute change. You can scope themes to any element, not just the document root.

## Responsive Design

Tailwind uses breakpoint prefixes in class names:

```html
<div class="text-sm md:text-base lg:text-lg">...</div>
```

Vanilla Breeze uses media queries in CSS, typically adjusting tokens:

```css
@media (width >= 48rem) {
  :root {
    --text-base: 1.125rem;
    --leading: 1.6;
  }
}
```

Everything using `--text-base` responds automatically. You change one token, not dozens of class names scattered across markup.

## Overrides and One-offs

When you need something different in one place, Tailwind has you add more classes. VB gives you three levers:

**1. Token override — stay in the system**

```css
#hero { --color-primary: #ff6b00; }
```

**2. Utility class — if it covers your case**

```html
<p class="text-muted">Secondary content</p>
```

**3. Custom class — you're in plain CSS, just write it**

```css
/* No @layer needed — unlayered CSS always wins */
.pull-quote { font-size: 1.5rem; border-left: 4px solid var(--color-accent); }
```

Because the framework is inside `@layer`, your CSS wins without `!important`. This is the guarantee.

## What You Give Up

- **Instant prototyping from markup alone.** Tailwind is genuinely fast for greenfield UI. VB requires you to define a theme first, then markup flows from it.
- **PurgeCSS-style dead-code elimination.** VB ships a complete theme. Tree-shaking CSS is harder than tree-shaking JS. For most projects this is not a real problem.
- **The Tailwind ecosystem** — plugins, component libraries, IntelliSense autocomplete tied to config values.

## What You Gain

- **Themes that actually work** — scoped to any element, runtime-swappable, no rebuild.
- **Clean HTML** — markup expresses structure, not style.
- **No build step** — link a stylesheet, done.
- **Native CSS** — what you write is what ships. No abstraction layer to debug.
- **Upgradable components** — update the theme CSS, every component using those tokens updates automatically.
- **Readable diffs** — a PR changing a button style touches CSS, not hundreds of HTML files.

## Cheat Sheet

| Tailwind pattern | Vanilla Breeze equivalent |
|---|---|
| `class="bg-blue-600"` | `class="bg-primary"` (token-connected) or default styling |
| `class="p-4 mx-auto"` | Default spacing from theme; `class="padded centered"` if needed |
| `tailwind.config.js` color | `--color-primary` in `[data-theme]` block |
| `dark:` prefix | `[data-theme="dark"]` scoped tokens |
| `md:text-lg` breakpoint | Token adjusted in `@media` block |
| `!important` utility override | Unlayered CSS class — no `!important` needed |
| Component `@apply` in CSS | Component class consuming tokens via `var()` |
| Purge/JIT build step | No build step |

## Related

- [Theming Architecture](./theming.md)
- [Layer Architecture](./cascade-layers.md)