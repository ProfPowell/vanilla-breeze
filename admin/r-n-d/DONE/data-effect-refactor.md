---
title: Vanilla Breeze Declarative Effects System
description: Specification for data-* attribute-driven effects, triggers, transitions and theming
author: Thomas Powell
date: 2026-03-05
tags:
  - vanilla-breeze
  - specification
  - effects
  - progressive-enhancement
draft: false
---

# Vanilla Breeze Declarative Effects System

A declarative, attribute-driven system for effects, transitions, and theming built on the web platform. No framework concepts — just HTML attributes, CSS selectors, and a thin JS routing layer.

## Table of Contents

- [Philosophy](#philosophy)
- [Attribute Grammar](#attribute-grammar)
- [Effect Vocabulary](#effect-vocabulary)
- [Compositing](#compositing)
- [Override Hierarchy](#override-hierarchy)
- [The VB API](#the-vb-api)
- [Theme Scoping](#theme-scoping)
- [Progressive Enhancement Tiers](#progressive-enhancement-tiers)
- [View Transitions](#view-transitions)

---

## Philosophy

The system separates concerns across attribute types:

| Attribute | Purpose | Example |
|---|---|---|
| `class` | Visual variants and identity | `class="card card--featured"` |
| `data-effect` | Behavior and animation | `data-effect="fade-in glow"` |
| `data-trigger` | When effects activate | `data-trigger="scroll"` |
| `data-transition` | State-change transitions | `data-transition="morph"` |
| `data-theme` | Bundled visual token sets | `data-theme="organic"` |

Classes stay in style-space. `data-*` attributes stay in behavior-space. They compose at the CSS selector level — no new abstraction required.

---

## Attribute Grammar

### `data-effect`

Space-separated effect names. Space-separation is intentional — it maps directly to CSS `~=` attribute selectors and CSS `animation` shorthand composition.

```html
<!-- Single effect -->
<p data-effect="fade-in">

<!-- Layered (simultaneous) effects -->
<p data-effect="fade-in slide-up">

<!-- Named custom effect -->
<p data-effect="hero-entrance">
```

> **Note:** Commas are avoided intentionally. `[attr~="value"]` treats comma-separated values as a single token, breaking CSS word-matching. Space-separation is the correct platform primitive here.

### `data-trigger`

When the effect activates. Space-separated for composing triggers. Colon syntax carries a parameter within a single token — safe for `~=` matching.

```html
<p data-effect="fade-in" data-trigger="scroll">
<p data-effect="glow"    data-trigger="hover">
<p data-effect="pop"     data-trigger="click">
<p data-effect="fade-in" data-trigger="time:2000">

<!-- Composed: scroll-triggered with a delay -->
<p data-effect="fade-in slide-up" data-trigger="scroll time:500">
```

| Trigger | Implementation | Notes |
|---|---|---|
| `hover` | CSS `:hover` | No JS needed |
| `click` | CSS or minimal JS | Prefer native where possible |
| `scroll` | `IntersectionObserver` | JS required |
| `time:n` | `setTimeout` | JS required, `n` in ms |

> **Note:** Navigation transitions are not a trigger — they are handled by `data-transition` + `VB.swap()` directly. See the [View Transitions](#view-transitions) section.

### `data-stagger`

Applied to a parent. Cascades timing to children for staggered entrance.

```html
<ul data-effect="fade-in slide-up" data-trigger="scroll" data-stagger="80ms">
  <li>One</li>
  <li>Two</li>
  <li>Three</li>
</ul>
```

CSS reads the value directly via typed `attr()`:

```css
[data-stagger] > * {
  --_index: 0; /* set per-child by JS */
  animation-delay: calc(var(--_index) * attr(data-stagger type(<time>), 80ms));
}
```

### `data-transition`

Marks elements participating in View Transitions. Separate from `data-effect` — it describes state-change moments, not ambient animation.

```html
<div data-transition="morph">     <!-- element morphs between states -->
<ul  data-transition="stagger">   <!-- children reorder with transition -->
<main data-transition="slide">    <!-- page-level slide -->
```

---

## Effect Vocabulary

Built-in named effects. Core effects are pure CSS at the basic tier. JS-enhanced effects use `VB.effect()` for initialization and progressively enhance from a CSS base.

### Entrance

```html
<p data-effect="fade-in">     <!-- opacity 0 → 1 -->
<p data-effect="slide-up">    <!-- translate Y + fade -->
<p data-effect="slide-in">    <!-- respects dir attribute for RTL -->
<p data-effect="pop">         <!-- scale 0.8 → 1 -->
<p data-effect="reveal">      <!-- clip-path wipe (JS-enhanced: word/line splitting) -->
<p data-effect="blur-reveal"> <!-- word/line blur-to-clear entrance (JS-enhanced) -->
```

### Attention

```html
<p data-effect="pulse">       <!-- subtle scale loop -->
<p data-effect="bounce">      <!-- vertical bounce -->
<p data-effect="shake">       <!-- horizontal shake — error state -->
<p data-effect="glow">        <!-- filter + outline -->
```

### Decoration

```html
<p data-effect="shadow">      <!-- elevated box-shadow -->
<p data-effect="float">       <!-- gentle Y-axis loop -->
<p data-effect="shimmer">     <!-- loading skeleton pattern -->
```

### Exit

```html
<p data-effect="fade-out">
<p data-effect="slide-out">
<p data-effect="collapse">    <!-- height → 0 -->
```

### Text Effects

Effects targeting text rendering and typography. Mix of CSS-only and JS-enhanced.

```html
<span data-effect="typewriter">         <!-- character-by-character typing (JS) -->
<span data-effect="scramble">           <!-- decode/unscramble reveal (JS) -->
<data data-effect="ticker">             <!-- animated number count-up (JS) -->
<span data-effect="gradient-text">      <!-- gradient coloring (.sunset .ocean .forest .neon .animate) -->
<span data-effect="text-3d">            <!-- 3D extruded text (.red .gold .green .purple .black .deep .animate) -->
<span data-effect="outline">            <!-- stroke/outline text (.thick .ultra .glow) -->
<span data-effect="hard-shadow">        <!-- flat offset shadow (.double .long .red .blue .gold .green) -->
```

### Visual Effects

Effects targeting visual presentation, emphasis, and interactive decoration.

```html
<mark data-effect="highlight">          <!-- draw-in underline/box/circle (.underline .box .circle) -->
<span data-effect="blur-reveal">        <!-- word/line blur-to-clear reveal (JS) -->
<img  data-effect="animate-image">      <!-- play/pause control for animated images (JS) -->
<span data-effect="rating">             <!-- star/icon rating display (JS) -->
<div  data-effect="marquee">            <!-- continuous scroll (.reverse .slow .fast .pause .hover-pause) -->
<span data-effect="flipboard">          <!-- split-flap / Solari departure board (JS) -->
<span data-effect="stamp">              <!-- rubber stamp (.red .blue .green .black .gold .straight .slight .heavy) -->
<span data-effect="rainbow">            <!-- cycling hue rotation (.slow .fast) -->
<span data-effect="glitch">             <!-- chromatic aberration glitch (CSS + JS init) -->
```

### Pack Effects

Themed effect packs extend the vocabulary with curated effect sets.

#### Retro Pack

Nostalgic, analog-inspired effects loaded via `retro.bundle.js`.

```html
<span data-effect="blink">             <!-- classic cursor blink (.slow .fast) -->
<span data-effect="neon">              <!-- neon sign glow (.pink .cyan .green .amber .red) -->
<span data-effect="text-3d">           <!-- 3D extruded text (also in core) -->
<span data-effect="outline">           <!-- stroke text (also in core) -->
<span data-effect="hard-shadow">       <!-- flat offset shadow (also in core) -->
<span data-effect="stamp">             <!-- rubber stamp (also in core) -->
<span data-effect="rainbow">           <!-- hue cycling (also in core) -->
<span data-effect="marquee">           <!-- continuous scroll (also in core) -->
<span data-effect="flipboard">         <!-- split-flap display (JS) -->
```

#### Kawaii Pack

Soft, playful effects loaded via `kawaii.bundle.js`.

```html
<span data-effect="starburst">         <!-- pastel starburst background -->
<span data-effect="sparkle">           <!-- animated sparkle overlay -->
<span data-effect="bounce">            <!-- bouncy hover (kawaii variant) -->
<span data-effect="wiggle">            <!-- wiggle animation (.hover trigger) -->
<span data-effect="particles">         <!-- floating particle overlay (JS) -->
```

#### Effects Pack

The general-purpose effects pack (`effects.full.js`) bundles the JS-enhanced effects — glitch, blur-reveal, scramble, ticker, typewriter, highlight, reveal, animate-image, and rating — as a single import. CSS for these effects is included in the core stylesheet.

---

## Compositing

### Simultaneous layers — CSS handles it

Each effect is independently defined. The compound selector handles composition:

```css
[data-effect~="fade-in"] {
  animation: fade-in var(--vb-duration, 300ms) forwards;
}

[data-effect~="slide-up"] {
  animation: slide-up var(--vb-duration, 300ms) forwards;
}

/* Compound: when both present, declare both animations */
[data-effect~="fade-in"][data-effect~="slide-up"] {
  animation:
    fade-in  var(--vb-duration, 300ms) forwards,
    slide-up var(--vb-duration, 300ms) forwards;
}
```

```html
<p data-effect="fade-in slide-up">  <!-- browser composites both -->
```

### Sequences — use named effects

Complex sequences live in CSS `@keyframes` or a JS effect registry — not in the attribute string. The attribute carries a name, not a definition.

```css
/* Define a multi-step sequence as a single named effect */
@keyframes hero-entrance {
  0%   { opacity: 0; translate: 0 40px; filter: blur(8px); }
  60%  { filter: blur(0); }
  100% { opacity: 1; translate: 0 0; }
}

[data-effect~="hero-entrance"] {
  animation: hero-entrance 800ms cubic-bezier(.16,1,.3,1) forwards;
}
```

```html
<h1 data-effect="hero-entrance">Welcome</h1>
```

---

## Override Hierarchy

The platform cascade handles overrides. No special VB mechanism needed.

```html
<!-- Level 1: built-in default -->
<p data-effect="fade-in">

<!-- Level 2: class modulates via custom property -->
<p data-effect="fade-in" class="slow">

<!-- Level 3: inline style pushes further -->
<p data-effect="fade-in" class="slow" style="--vb-duration: 2s; --vb-delay: 500ms">

<!-- Level 4: data-* params for JS effects -->
<p data-effect="scroll-counter" data-to="500" data-duration="1500">
```

```css
/* Built-in exposes custom properties for every tunable value */
[data-effect~="fade-in"] {
  --vb-duration: 300ms;
  --vb-delay: 0ms;
  --vb-easing: ease-out;
  animation: fade-in var(--vb-duration) var(--vb-easing) var(--vb-delay) forwards;
}

/* Class variants modulate tokens */
.slow   { --vb-duration: 900ms; }
.bouncy { --vb-easing: cubic-bezier(.68,-0.55,.27,1.55); }
.once   { /* JS reads this class — don't replay on re-enter */ }

/* Compound: class only applies when effect present */
[data-effect~="fade-in"].dramatic {
  --vb-duration: 1200ms;
  --vb-easing: ease-in-out;
}
```

---

## The VB API

### Public surface

```js
const VB = {
  // Registration
  effect(name, handler) {},     // (el, params) => cleanup?
  trigger(name, handler) {},    // (el, run) => cleanup?
  transition(name, handler) {}, // (el, update) => void
  theme(name, tokens) {},       // { '--vb-token': value }

  // Lifecycle
  observe(root = document) {},  // boots MutationObserver, wires all elements
  disconnect() {},              // full teardown

  // Utilities
  uid(el) {},                        // stable id for view-transition-name
  params(el) {},                     // CSS custom property reader → { get, getNumber, hasClass }
  emit(el, name, detail) {},         // CustomEvent wrapper
  swap(update) {},                   // View Transition wrapper (startViewTransition or fallback)
  applyTheme(name, scope) {},        // apply registered theme tokens to a scope element
  prefersReducedMotion() {},         // returns boolean for motion preference
}
```

### Handler signatures

```js
// Effect handler
VB.effect('my-effect', (el, params) => {
  // el     — the element
  // params — VB.params(el), pre-parsed and typed

  return () => { /* cleanup on disconnect or attribute removal */ }
})

// Trigger handler
VB.trigger('scroll', (el, run) => {
  // el  — the element
  // run — call when condition is met

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) run()
  }, { threshold: 0.2 })

  observer.observe(el)
  return () => observer.disconnect()
})
```

### `VB.params()` — CSS custom property reader

Returns an object with methods for reading `--vb-*` custom properties from the element's computed style. This integrates with the CSS cascade, media queries, and themes — the source of truth is always CSS, not data attributes.

```js
const params = VB.params(el)

params.get('duration')           // reads --vb-duration, returns trimmed string
params.getNumber('delay', 0)     // reads --vb-delay, parses as float (fallback if empty)
params.hasClass('once')          // checks el.classList.contains('once')
```

```js
VB.effect('reveal', (el) => {
  const params = VB.params(el)
  const delay = params.get('blur-reveal-delay') || '80ms'
  // Values come from CSS — a theme or media query can override them
  // without the effect handler needing to know
})
```

### `VB.emit()` — effect → author communication

```js
VB.effect('scroll-counter', (el) => {
  const { to } = VB.params(el)
  runCounter(el, to, () => {
    VB.emit(el, 'vb:complete', { effect: 'scroll-counter', value: to })
  })
})
```

```js
// Author listens with standard DOM events
el.addEventListener('vb:complete', (e) => {
  console.log(e.detail) // { effect: 'scroll-counter', value: 1000 }
})
```

### JS control — just the platform

VB watches attribute mutations. Authors control behavior by changing attributes and properties directly:

```js
// Toggle an effect on/off
el.dataset.effect = 'shake'
el.dataset.effect = ''

// Add to existing effects
el.dataset.effect += ' glow'

// Trigger programmatically
el.dataset.trigger = 'now'  // VB.trigger('now') calls run() immediately

// Swap theme
el.dataset.theme = 'organic'

// Modulate timing via custom property
el.style.setProperty('--vb-duration', '600ms')

// Toggle class variant
el.classList.toggle('slow')
el.classList.add('once')
```

**Real example — form validation:**

```js
input.addEventListener('invalid', () => {
  input.dataset.effect = 'shake'
  input.classList.add('error')

  input.addEventListener('animationend', () => {
    input.dataset.effect = '' // reset, ready to fire again
  }, { once: true })
})
```

```html
<!-- starts neutral, JS writes state -->
<input data-effect="" class="">
```

---

## Theme Scoping

### The approach — composable flat selectors

The implementation chose simplicity and composability over strict isolation. Themes are applied via space-separated names in `data-theme`, matched with flat `[data-theme~="name"]` selectors. This enables theme composition — multiple themes can be active on the same element, with later declarations winning via normal CSS cascade order.

```html
<!-- Single theme -->
<body data-theme="forest">

<!-- Composed themes — forest provides base tokens, a11y-high-contrast overlays adjustments -->
<body data-theme="forest a11y-high-contrast">

<!-- Scoped to a section -->
<section data-theme="swiss">
```

### Flat `~=` selectors

Each theme targets a single word in the `data-theme` attribute:

```css
[data-theme~="forest"] {
  --hue-primary: 145;
  --color-bg: oklch(97% 0.01 145);
  --color-text: oklch(20% 0.02 145);
}

[data-theme~="a11y-high-contrast"] {
  --color-bg: #000;
  --color-text: #fff;
  /* overrides forest's colors, keeps forest's hue */
}
```

Composition works because `~=` matches individual space-separated tokens. When `data-theme="forest a11y-high-contrast"`, both selectors match. The cascade determines which token wins — later declaration order or higher specificity.

### `@property` — inheritance is intentional

All registered custom properties use `inherits: true`:

```css
@property --hue-primary   { syntax: "<number>"; inherits: true; initial-value: 260; }
@property --hue-secondary { syntax: "<number>"; inherits: true; initial-value: 200; }
@property --hue-accent    { syntax: "<number>"; inherits: true; initial-value: 30; }
@property --radius-s      { syntax: "<length>"; inherits: true; initial-value: 4px; }
```

Inheritance is how themes cascade through the DOM. A `data-theme` on `<body>` sets tokens that all descendants inherit — child elements don't need to repeat the attribute. A nested `data-theme` on a `<section>` overrides tokens for that subtree without requiring explicit reset.

### `@layer bundle-theme` — single shared layer

All themes live in one cascade layer:

```css
@layer tokens, reset, native-elements, custom-elements, web-components, utils, bundle-theme, bundle-effects, bundle-components;

@layer bundle-theme {
  [data-theme~="forest"] { /* ... */ }
  [data-theme~="swiss"]  { /* ... */ }
  [data-theme~="retro"]  { /* ... */ }
}
```

A single `bundle-theme` layer keeps themes at a consistent cascade position — above utilities, below effects and components. Author stylesheets (unlayered) always win.

### JS registration via `VB.theme()`

Themes can also be registered programmatically and applied to a scope:

```js
VB.theme('brand', {
  '--hue-primary': '220',
  '--color-bg': 'oklch(98% 0.01 220)',
})

VB.applyTheme('brand', document.querySelector('main'))
```

### Design rationale

| Decision | Why |
|---|---|
| Flat `~=` selectors | Enables composable themes (`data-theme="forest a11y-high-contrast"`) |
| `inherits: true` | Themes cascade through the DOM — set once on a parent, inherited by all children |
| No reset layer | Simpler mental model; nested themes override only the tokens they set |
| Single `bundle-theme` layer | Predictable cascade position; author styles always win |

---

## Progressive Enhancement Tiers

This is the core Vanilla Breeze pattern applied to effects.

### Basic — pure HTML, no author CSS/JS needed

```html
<p data-effect="fade-in">
<p data-effect="fade-in" data-trigger="scroll">
<p data-effect="glow"    data-trigger="hover">
```

Works from VB's built-in stylesheet. Nothing to configure.

### Intermediate — CSS defines or modifies

Override built-in timing:

```css
@layer vb.effects.custom {
  [data-effect~="fade-in"] {
    animation: fade-in var(--vb-duration, 300ms) var(--vb-easing, ease-out);
  }

  [data-effect~="fade-in"].slow     { --vb-duration: 900ms; }
  [data-effect~="fade-in"].dramatic { --vb-duration: 1200ms; }
}
```

Define a custom named effect:

```css
@keyframes hero-entrance {
  0%   { opacity: 0; translate: 0 40px; filter: blur(8px); }
  60%  { filter: blur(0); }
  100% { opacity: 1; translate: 0 0; }
}

[data-effect~="hero-entrance"] {
  animation: hero-entrance 800ms cubic-bezier(.16,1,.3,1) forwards;
}
```

```html
<h1 data-effect="hero-entrance" class="slow">Welcome</h1>
```

### Advanced — JS registers complex behavior

```js
VB.effect('scroll-counter', (el) => {
  const { to, duration = 2000 } = VB.params(el)

  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return
    runCounter(el, to, duration)
    observer.disconnect()
  })

  observer.observe(el)
  return () => observer.disconnect()
})
```

```html
<span data-effect="scroll-counter" data-to="1000" data-duration="1500">0</span>
```

Effects and triggers are always registered independently and composed in HTML — an effect never cares what triggered it.

---

## View Transitions

### The mental model

Authors declare *intent*, not implementation:

| Intent | Attribute | Moment |
|---|---|---|
| Ambient animation | `data-effect` | Scroll, hover, load |
| State change | `data-transition` | DOM updates, navigation |

```html
<!-- Ambient: decorative, repeatable -->
<p data-effect="fade-in" data-trigger="scroll">

<!-- State change: meaningful, navigational -->
<div data-transition="morph">
<ul  data-transition="stagger">
<main data-transition="slide">
```

### Implementation — graceful fallback built in

```js
VB.transition('morph', (el, update) => {
  el.style.viewTransitionName = 'morph-' + (el.id || VB.uid(el))

  if (!document.startViewTransition) return update() // fallback

  document.startViewTransition(() => update())
})
```

### Author can still override the animation

```css
/* Same override model as data-effect */
::view-transition-old(morph-hero) {
  animation: fade-out 200ms ease-in;
}
::view-transition-new(morph-hero) {
  animation: fade-in 300ms ease-out;
}
```

### Full element example

```html
<section
  data-effect="fade-in slide-up"   <!-- simultaneous layers, scroll-revealed -->
  data-trigger="scroll"             <!-- IntersectionObserver -->
  data-transition="morph"           <!-- View Transitions on state change -->
  data-stagger="80ms"               <!-- children cascade -->
  data-theme="brand"                <!-- visual token bundle -->
  class="dramatic once"             <!-- CSS variants -->
  style="--vb-delay: 200ms"         <!-- inline override -->
>
```

Every attribute has one job. The platform does the compositing. VB is the thin routing layer between declaration and platform API.