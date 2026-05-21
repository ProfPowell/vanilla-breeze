---
title: Overrides, Tweaks, and Plain CSS in Vanilla Breeze
description: How to override a theme locally, adjust theme tokens for a specific context, and use plain CSS and utility classes alongside the framework.
tags:
  - theming
  - overrides
  - css
  - utilities
  - reference
---

# Overrides, Tweaks, and Plain CSS in Vanilla Breeze

Vanilla Breeze is designed to step aside. You should never need to fight the framework to get what you want. This document covers the three practical ways to deviate from defaults: switching to a different named theme locally, adjusting token values without changing themes, and writing plain CSS or using utility classes as direct overrides.

## Table of Contents

- [How the Cascade Contract Works](#how-the-cascade-contract-works)
- [Level 1: Named Theme Override](#level-1-named-theme-override)
- [Level 2: Token Tweaks Within a Theme](#level-2-token-tweaks-within-a-theme)
- [Level 3: Plain CSS Overrides](#level-3-plain-css-overrides)
- [Level 4: Utility Classes](#level-4-utility-classes)
- [Combining Levels](#combining-levels)
- [What Not to Do](#what-not-to-do)
- [Decision Guide](#decision-guide)

---

## How the Cascade Contract Works

Vanilla Breeze ships all framework CSS inside `@layer` blocks:

```css
@layer reset, base, theme, components, utilities;
```

This one architectural decision is what makes everything else in this document work. Any CSS you write **outside** a layer — a plain class, an ID rule, anything unlayered — automatically wins over all layered CSS, regardless of specificity. You never need `!important` to override the framework.

```css
/* Framework — inside @layer, always loses to unlayered CSS */
@layer components {
  .card { background: var(--color-surface); }
}

/* Your CSS — unlayered, always wins */
.card { background: hotpink; }  /* wins with no !important needed */
```

This is the guarantee. Everything below builds on it.

---

## Level 1: Named Theme Override

Switch to a completely different theme for a section of the page by setting `data-theme` on any element. All descendants inherit the new theme's tokens.

### Basic usage

```html
<!-- Page uses Swiss -->
<html data-theme="swiss">

  <!-- This section switches to Cyber -->
  <section data-theme="cyber">
    <h1>Cyber Heading</h1>
    <p>All tokens — colour, type, spacing — come from the Cyber theme here.</p>
  </section>

  <!-- Back to Swiss -->
  <section>
    <p>Swiss again.</p>
  </section>

</html>
```

### How it works

Each `[data-theme]` block redefines the custom properties at that element. CSS custom properties inherit down the DOM tree, so every child picks up the redefined values automatically.

```css
[data-theme="swiss"] {
  --color-primary:  #e63312;
  --color-bg:       #ffffff;
  --color-text:     #111111;
  --font-body:      "Helvetica Neue", sans-serif;
  --radius-md:      2px;
}

[data-theme="cyber"] {
  --color-primary:  #00ff9f;
  --color-bg:       #0d0d0d;
  --color-text:     #e0e0e0;
  --font-body:      "Share Tech Mono", monospace;
  --radius-md:      0px;
}
```

### Nesting themes

Nesting works to any depth. The nearest ancestor `data-theme` wins for any given element.

```html
<body data-theme="swiss">
  <main>
    <section data-theme="cyber">
      <aside data-theme="swiss">
        <!-- Swiss again inside Cyber -->
      </aside>
    </section>
  </main>
</body>
```

### Watch-outs with named overrides

Token inheritance is free. Direct property rules are not. If the framework writes:

```css
[data-theme="swiss"] h1 { color: #e63312; }
```

...then a nested `[data-theme="cyber"]` section does *not* automatically restyle `h1`, because that rule targets `[data-theme="swiss"] h1` specifically. The correct pattern is to write component rules that consume tokens:

```css
/* Good — responds to any theme */
h1 { color: var(--color-primary); }

/* Bad — locked to Swiss, nested themes can't override */
[data-theme="swiss"] h1 { color: #e63312; }
```

Vanilla Breeze components always use `var()` for this reason. If you find a component that uses hardcoded values inside a `[data-theme]` selector, that is a bug.

---

## Level 2: Token Tweaks Within a Theme

Stay in a theme but adjust specific token values for a section or element. This is the most surgical option — you keep all the theme's decisions except the ones you override.

### Scope a token to an element or section

Set custom properties directly on any element. Everything inside that element consumes the adjusted values.

```css
/* Quiet variant of Swiss — muted accent, more breathing room */
#editorial-section {
  --color-primary: #555555;   /* Swiss red → neutral grey */
  --leading:       1.9;       /* tighter default → more air */
  --text-base:     1.0625rem; /* nudge the body size */
}
```

```html
<section id="editorial-section">
  <h1>Still Swiss, Just Quieter</h1>
  <p>The accent is grey, leading is looser. Everything else is untouched.</p>
</section>
```

### Opt out of a specific component behaviour

Some theme decisions are component-level rather than token-level. Drop-caps are a good example — a Swiss theme might enable them by convention, but you may not want them everywhere.

The cleanest approach is a modifier class that resets the relevant properties:

```css
/* Unlayered — beats @layer components where drop-cap is defined */
.no-drop-cap p:first-of-type::first-letter {
  font-size:   inherit;
  font-weight: inherit;
  float:       none;
  color:       inherit;
  margin:      0;
}
```

```html
<article class="no-drop-cap">
  <p>No drop cap here, even though the theme enables them by default.</p>
</article>
```

This works without `!important` because the framework drop-cap rule is inside `@layer components` and `.no-drop-cap` is unlayered.

### Adjust colour within a theme

Suppose you want Swiss but with a different brand accent on a promotional block:

```css
#promo-block {
  --color-primary: #ff6b00;  /* orange instead of Swiss red */
  --color-accent:  #ff6b00;
}
```

No theme change. No class proliferation. Every component inside `#promo-block` that uses `var(--color-primary)` picks up orange automatically.

### Adjust spacing for a dense UI section

```css
.data-table-section {
  --space-4: 0.5rem;  /* tighten padding token for dense rows */
  --text-base: 0.875rem;
}
```

### Token fallbacks

Tokens can define fallbacks so tweaks are safe:

```css
.card {
  padding: var(--card-padding, var(--space-4));
}
```

If `--card-padding` is never set, it falls back to `--space-4`. You can override the specific token without touching the general one.

---

## Level 3: Plain CSS Overrides

Write CSS. That's it. Because the framework uses `@layer`, your rules win automatically. This is for cases where token tweaks aren't sufficient — you want to change a specific property on a specific element, add a behaviour the theme doesn't model, or just express something in plain CSS.

### Basic property override

```css
/* No layer, no !important — just CSS */
.pull-quote {
  font-size:   1.5rem;
  font-style:  italic;
  border-left: 4px solid var(--color-primary);
  padding-left: var(--space-4);
  color:        var(--color-text-secondary);
}
```

You can still use framework tokens inside your own rules. The token values will respond to whatever theme is active at that element's position in the DOM.

### ID-level override for a unique element

```css
#site-hero {
  min-height:      80svh;
  display:         grid;
  place-items:     center;
  background:      var(--color-bg);
  letter-spacing: -0.03em;
}
```

### Pseudo-element override

Framework pseudo-elements are inside `@layer`. Yours are not, so they win:

```css
/* Override framework's ::before on section dividers */
.plain-section::before {
  display: none;
}

/* Add your own */
.fancy-section::after {
  content:    '';
  display:    block;
  height:     2px;
  background: linear-gradient(to right, var(--color-primary), transparent);
  margin-top: var(--space-6);
}
```

### Writing in a user layer

If you want explicit ordering among your own overrides, declare a user layer after the framework:

```css
/* After framework import */
@layer user-base, user-components, user-overrides;

@layer user-components {
  .my-card { ... }
}

@layer user-overrides {
  .my-card.featured { ... }
}
```

Unlayered CSS still beats all of these. This is only useful if you have your own multi-file project where layer order matters internally.

---

## Level 4: Utility Classes

Vanilla Breeze ships a `@layer utilities` with token-connected single-purpose classes. These are opt-in helpers, not the primary API. Use them when a one-liner class is the most direct solution.

### Token-connected utilities

Unlike Tailwind utilities which bake in values at build time, VB utilities reference tokens. They respond to the active theme.

```css
@layer utilities {
  /* Colour */
  .bg-primary    { background: var(--color-primary); }
  .bg-surface    { background: var(--color-surface); }
  .bg-surface-alt { background: var(--color-surface-alt); }
  .text-primary  { color: var(--color-primary); }
  .text-muted    { color: var(--color-text-muted); }
  .text-inverse  { color: var(--color-text-inverse); }

  /* Typography */
  .text-sm   { font-size: var(--text-sm); }
  .text-base { font-size: var(--text-base); }
  .text-lg   { font-size: var(--text-lg); }
  .text-xl   { font-size: var(--text-xl); }
  .font-bold { font-weight: var(--font-weight-bold); }
  .font-mono { font-family: var(--font-mono); }

  /* Spacing */
  .p-2  { padding: var(--space-2); }
  .p-4  { padding: var(--space-4); }
  .p-6  { padding: var(--space-6); }
  .px-4 { padding-inline: var(--space-4); }
  .py-4 { padding-block:  var(--space-4); }
  .m-0  { margin: 0; }
  .mt-4 { margin-block-start: var(--space-4); }
  .mb-4 { margin-block-end:   var(--space-4); }
  .gap-4 { gap: var(--space-4); }

  /* Layout */
  .flex         { display: flex; }
  .flex-col     { flex-direction: column; }
  .flex-wrap    { flex-wrap: wrap; }
  .align-center { align-items: center; }
  .align-start  { align-items: flex-start; }
  .justify-between { justify-content: space-between; }
  .justify-center  { justify-content: center; }
  .grid         { display: grid; }
  .block        { display: block; }
  .inline       { display: inline; }
  .hidden       { display: none; }

  /* Visual */
  .rounded    { border-radius: var(--radius-md); }
  .rounded-sm { border-radius: var(--radius-sm); }
  .rounded-lg { border-radius: var(--radius-lg); }
  .shadow-sm  { box-shadow: var(--shadow-sm); }
  .shadow-md  { box-shadow: var(--shadow-md); }
  .border     { border: 1px solid var(--color-border); }
  .sr-only    {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border: 0;
  }
}
```

### Theme-aware utility behaviour

This is the key difference from Tailwind. The same class produces different results depending on theme context:

```html
<section data-theme="swiss">
  <p class="text-primary">Swiss red text</p>
</section>

<section data-theme="cyber">
  <p class="text-primary">Cyber green text — same class</p>
</section>
```

### Overriding utilities

Utilities are in `@layer utilities`. Your unlayered CSS overrides them:

```css
/* Your override — wins over @layer utilities */
.text-primary { color: #ff6b00; }  /* for when you need it hardcoded */
```

### Using utilities for layout composition

Utilities work well for layout that doesn't belong to a specific component:

```html
<div class="flex align-center gap-4 p-4 border rounded">
  <img src="avatar.jpg" alt="User avatar" class="rounded">
  <div>
    <p class="font-bold">Jane Smith</p>
    <p class="text-muted text-sm">Product Designer</p>
  </div>
</div>
```

This is appropriate — layout assembly, not visual definition. The component's visual identity comes from the theme; utilities handle positioning and minor typographic adjustments.

---

## Combining Levels

All four levels compose cleanly. Here is a realistic example using all of them on one page:

```html
<!DOCTYPE html>
<html data-theme="swiss">
<head>
  <link rel="stylesheet" href="vanilla-breeze.css">
  <style>
    /* ── Your CSS (unlayered — always wins) ───────────── */

    /* Token tweak: quieter accent for editorial sections  */
    #long-read {
      --color-primary: #444;
      --leading:       1.85;
    }

    /* Plain CSS: custom component not in the framework    */
    .author-byline {
      display:     flex;
      align-items: center;
      gap:         var(--space-3);
      font-size:   var(--text-sm);
      color:       var(--color-text-muted);
      border-top:  1px solid var(--color-border);
      padding-top: var(--space-4);
    }

    /* Opt out of drop caps for this article type          */
    .no-drop-cap p:first-of-type::first-letter {
      font-size: inherit; float: none; color: inherit;
    }
  </style>
</head>
<body>

  <!-- Swiss, full defaults -->
  <header>
    <h1>Magazine Title</h1>
    <nav>...</nav>
  </header>

  <!-- Swiss, token-tweaked for quieter editorial feel -->
  <article id="long-read">
    <h2>The Long Read</h2>
    <p>Drop cap here — theme default applies.</p>
    <p>Body copy in the tweaked leading.</p>

    <!-- Opt out of drop cap for a specific sub-section -->
    <section class="no-drop-cap">
      <h3>Sidebar Context</h3>
      <p>No drop cap. Still in the tweaked token scope.</p>
    </section>

    <!-- Plain CSS component + utility classes for layout -->
    <footer class="author-byline">
      <img src="avatar.jpg" alt="" class="rounded shadow-sm">
      <div>
        <p class="font-bold">Jane Smith</p>
        <p class="text-muted">March 2026</p>
      </div>
    </footer>
  </article>

  <!-- Named theme override for a promotional callout -->
  <aside data-theme="cyber">
    <h2>Subscribe</h2>
    <p>Full Cyber treatment — different colour, type, everything.</p>
    <button>Get Access</button>
  </aside>

</body>
</html>
```

---

## What Not to Do

### Do not use `!important` to override the framework

It is never needed. If your rule isn't winning, check that it is unlayered (not inside `@layer`). Unlayered CSS always wins.

```css
/* Wrong */
.card { background: hotpink !important; }

/* Right — just write the rule */
.card { background: hotpink; }
```

### Do not write overrides inside framework layer names

If you declare `@layer components` in your own stylesheet, rules in it compete with framework component rules by source order — not a reliable override mechanism.

```css
/* Wrong — fights with framework, unpredictable */
@layer components {
  .card { background: hotpink; }
}

/* Right — unlayered, always wins */
.card { background: hotpink; }
```

### Do not hardcode values when a token exists

If the framework has `--color-primary`, use it. Hardcoding breaks theme inheritance.

```css
/* Wrong — won't respond to theme changes */
.button { background: #e63312; }

/* Right — inherits from active theme */
.button { background: var(--color-primary); }
```

### Do not use high-specificity selectors in the framework

This is a framework authoring note. Using `[data-theme="swiss"] .card { ... }` in component rules locks styles to a specific theme and prevents nested theme overrides. Framework component rules should be low-specificity, consuming tokens only.

---

## Decision Guide

When you want to deviate from defaults, pick the right level:

| Situation | Approach |
|---|---|
| Entire section needs a different visual identity | `data-theme` attribute on the section |
| Same theme but accent colour is different here | Token override on the element: `--color-primary: ...` |
| Same theme but drop caps don't belong here | Unlayered modifier class: `.no-drop-cap` |
| One-off layout or component not in the framework | Unlayered CSS class with your own rules |
| Repeated one-liner visual adjustment | Utility class from `@layer utilities` |
| Need `!important` to win | Something is wrong — check layer architecture first |

The cascade flows downward through these levels. You can mix all four on the same page. The architecture is designed to make every level composable without conflict.