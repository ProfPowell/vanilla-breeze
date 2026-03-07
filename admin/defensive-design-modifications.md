---
title: Vanilla Breeze — Defensive Design Specification
description: 13 concrete improvements to make Vanilla Breeze a defensively designed, resilience-first framework
author: Thomas A. Powell
date: 2026-03-07
tags:
  - vanilla-breeze
  - defensive-design
  - progressive-enhancement
  - architecture
version: 1.0.0
---

# Vanilla Breeze — Defensive Design Specification

Vanilla Breeze is built on a progressive enhancement philosophy. This document codifies 13 concrete improvements that make that philosophy explicit, verifiable, and enforced — turning good intent into structural guarantees. Each item traces directly to a failure mode it prevents.

## Table of Contents

- [Background and Rationale](#background-and-rationale)
- [Priority and Implementation Plan](#priority-and-implementation-plan)
- [Phase 1 — Foundation (Morning)](#phase-1--foundation-morning)
  - [1. Pre-upgrade CSS baseline](#1-pre-upgrade-css-baseline)
  - [2. Mandatory static HTML form per component](#2-mandatory-static-html-form-per-component)
  - [3. Component spec template — Failure Modes section](#3-component-spec-template--failure-modes-section)
- [Phase 2 — Framework Contracts (Mid-day)](#phase-2--framework-contracts-mid-day)
  - [4. `@layer` order codified as framework contract](#4-layer-order-codified-as-framework-contract)
  - [5. Logical properties throughout](#5-logical-properties-throughout)
  - [6. Scripting media query integration](#6-scripting-media-query-integration)
  - [7. Component upgrade gap handling](#7-component-upgrade-gap-handling)
- [Phase 3 — Theme System (Afternoon)](#phase-3--theme-system-afternoon)
  - [8. Theme bundle fallback contract](#8-theme-bundle-fallback-contract)
  - [9. Theme Composer performance budget annotation](#9-theme-composer-performance-budget-annotation)
- [Phase 4 — Documentation and Tooling (Late Afternoon)](#phase-4--documentation-and-tooling-late-afternoon)
  - [10. Component catalog resilience matrix](#10-component-catalog-resilience-matrix)
  - [11. Architecture decision annotations](#11-architecture-decision-annotations)
  - [12. Claude Code validation slash command](#12-claude-code-validation-slash-command)
  - [13. Performance budget constraint file](#13-performance-budget-constraint-file)
- [Component Spec Template](#component-spec-template)
- [Reference: Failure Mode Map](#reference-failure-mode-map)

---

## Background and Rationale

The localhost effect is real: development conditions are always more favorable than user conditions. A framework that only works perfectly in perfect conditions isn't engineered — it's prototyped. Vanilla Breeze's HTML-first architecture is already pointed in the right direction. These 13 items make the defensive posture explicit and enforced rather than incidental.

The guiding principle: **every framework decision should be traceable to a failure mode it prevents.**

---

## Priority and Implementation Plan

Items are sequenced so each phase produces something immediately usable and each later phase builds on prior work. Phases 1 and 2 are the load-bearing work — do not skip ahead.

| # | Item | Phase | Effort | Impact |
|---|------|-------|--------|--------|
| 1 | Pre-upgrade CSS baseline | 1 | Low | High |
| 2 | Static HTML form per component | 1 | Medium | High |
| 3 | Component spec template — Failure Modes | 1 | Low | High |
| 4 | `@layer` order as framework contract | 2 | Low | High |
| 5 | Logical properties audit | 2 | Medium | Medium |
| 6 | Scripting media query integration | 2 | Low | Medium |
| 7 | Upgrade gap / FOUC handling | 2 | Low | High |
| 8 | Theme bundle fallback contract | 3 | Medium | High |
| 9 | Theme Composer budget annotation | 3 | Medium | Medium |
| 10 | Catalog resilience matrix | 4 | Medium | High |
| 11 | Architecture decision annotations | 4 | Low | Medium |
| 12 | Claude Code validation slash command | 4 | Medium | Medium |
| 13 | Performance budget constraint file | 4 | Low | Medium |

**Today's recommended sequence:** 1 → 3 → 2 → 7 → 4 → 6 → 5 → 8 → 9 → 13 → 11 → 10 → 12

---

## Phase 1 — Foundation (Morning)

These three items define what "done" means for a component. Everything else references them. Completing Phase 1 first means all subsequent component work automatically inherits the defensive baseline.

---

### 1. Pre-upgrade CSS baseline

**Failure mode prevented:** Component HTML is parsed and visible in the DOM before JavaScript upgrades it. Without a pre-upgrade style, the raw element may render as an unstyled block, shift layout on upgrade, or be invisible — all of which produce a broken experience for users on slow connections or devices where JS is deferred.

**Implementation:**

Every component's associated CSS file must include a `:not(:defined)` rule block. This is not optional — it is part of the component authoring contract.

```css
/* tab-control.css */

/* Pre-upgrade baseline — rendered before JS upgrade */
tab-control:not(:defined) {
  display: block;
  /* Show all panels; JS will manage visibility after upgrade */
}

tab-control:not(:defined) [role="tabpanel"],
tab-control:not(:defined) tab-panel {
  display: block;
  border-block-start: 2px solid var(--color-border, currentColor);
  padding-block: var(--space-m, 1rem);
}

tab-control:not(:defined) [role="tab"],
tab-control:not(:defined) tab-trigger {
  display: inline-block;
  font-weight: bold;
  padding-inline: var(--space-s, 0.5rem);
}

/* Post-upgrade state — JS adds [data-upgraded] or :defined applies */
tab-control:defined {
  /* enhanced styles here */
}
```

**Rules for pre-upgrade CSS:**

- Content must be readable and logically ordered without upgrade
- No layout shifts should occur between pre and post upgrade states — use `min-height` reservations where necessary
- All content visible by default; JS hides/shows as needed
- Use only design tokens (`var(--*)`) — never hardcoded values
- Place `:not(:defined)` block at the **top** of every component CSS file, before any enhanced styles

**File convention:**

```
components/
  tab-control/
    tab-control.css      ← :not(:defined) block at top
    tab-control.js
    tab-control.html     ← static HTML form (see item 2)
    README.md            ← spec with Failure Modes section (see item 3)
```

---

### 2. Mandatory static HTML form per component

**Failure mode prevented:** Components that have no defined static form cannot be progressively enhanced — they can only degrade. Defining the static HTML first forces the question "what does this do without JavaScript?" before implementation begins, preventing JS-only components from entering the catalog.

**Implementation:**

Every component ships a `[component-name].html` reference file representing the zero-JS, zero-custom-element form. This is the HTML the component enhances *from*.

The static form must:

- Use only standard HTML elements (no custom elements, no Web Components)
- Be fully navigable by keyboard
- Convey the same information and afford the same actions as the enhanced version
- Validate against the W3C HTML validator with no errors

**Example — `tab-control.html` static form:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tab Control — Static Form</title>
</head>
<body>

  <!--
    Static form for <tab-control>.
    No JavaScript required. Navigation via anchor links.
    Each section is a landmark with its own heading.
    JS upgrade converts this into a tabbed interface.
  -->

  <nav aria-label="Section navigation">
    <ul>
      <li><a href="#section-overview">Overview</a></li>
      <li><a href="#section-details">Details</a></li>
      <li><a href="#section-history">History</a></li>
    </ul>
  </nav>

  <section id="section-overview">
    <h2>Overview</h2>
    <p>Content for the overview panel.</p>
  </section>

  <section id="section-details">
    <h2>Details</h2>
    <p>Content for the details panel.</p>
  </section>

  <section id="section-history">
    <h2>History</h2>
    <p>Content for the history panel.</p>
  </section>

</body>
</html>
```

**Static form checklist:**

- [ ] Uses only standard HTML elements
- [ ] Passes W3C validator
- [ ] Keyboard navigable end-to-end
- [ ] All content accessible to a screen reader
- [ ] Visually usable without any CSS
- [ ] Same information and affordances as enhanced version
- [ ] Includes comments explaining the upgrade relationship

---

### 3. Component spec template — Failure Modes section

**Failure mode prevented:** Component specs written without failure mode analysis produce components that work in happy-path conditions only. The spec template enforces defensive thinking at authoring time, before implementation.

**Implementation:**

All component specification markdown files use this template. The **Failure Modes** section is required — a spec without it is incomplete.

```markdown
---
title: [Component Name] Specification
component: [element-name]  # e.g. tab-control
version: 0.1.0
status: draft | review | stable
---

# [Component Name]

One sentence description of what this component does for the user.

## Table of Contents

- [Purpose](#purpose)
- [Static HTML Form](#static-html-form)
- [Enhanced Form](#enhanced-form)
- [Attributes and API](#attributes-and-api)
- [Failure Modes](#failure-modes)
- [Accessibility](#accessibility)
- [CSS Tokens](#css-tokens)
- [Examples](#examples)

## Purpose

What user need does this component address? What content or function does it
present? Describe in terms of user goals, not implementation.

## Static HTML Form

Describe the zero-JS starting structure. Reference the `[component].html` file.
Explain how the static form fulfills the same purpose as the enhanced form.

```html
<!-- minimal static markup here -->
```

## Enhanced Form

Describe the custom element markup. Include all attributes.

```html
<!-- enhanced markup here -->
```

## Attributes and API

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `[attr]`  | string | — | What it controls |

## Failure Modes

This section is **required**. Document the component's behavior under each
condition. Be specific — "not tested" is not acceptable.

### No JavaScript

- **Behavior:** [Describe what the user sees and can do]
- **Implementation:** [What HTML/CSS makes this possible]
- **Acceptable:** Yes / No / Partial — [reason]

### No CSS

- **Behavior:** [Describe the unstyled state — is content logical?]
- **Implementation:** [HTML structure that ensures readable flow without CSS]
- **Acceptable:** Yes / No / Partial — [reason]

### Upgrade Delay (JS loading)

- **Behavior:** [What renders during the gap between parse and upgrade]
- **Implementation:** [`:not(:defined)` CSS rules — reference item 1]
- **Acceptable:** Yes / No / Partial — [reason]

### Keyboard Only

- **Behavior:** [Describe full keyboard path through the component]
- **Tab order:** [Describe expected focus sequence]
- **Key bindings:** [List all keyboard interactions]
- **Acceptable:** Yes / No / Partial — [reason]

### Screen Reader

- **ARIA roles used:** [List roles and why]
- **Live regions:** [Any `aria-live` usage and why]
- **Announced state changes:** [What changes are announced and how]
- **Tested with:** [VoiceOver / NVDA / etc. — or note untested]
- **Acceptable:** Yes / No / Partial — [reason]

### RTL / i18n

- **Behavior:** [Does layout flip correctly with `dir="rtl"`?]
- **CSS approach:** [Logical properties used — reference item 5]
- **Acceptable:** Yes / No / Partial — [reason]

## Accessibility

WCAG 2.1 AA compliance notes. List any known issues and mitigations.

## CSS Tokens

| Token | Default | Purpose |
|-------|---------|---------|
| `--[component]-[property]` | value | Description |

## Examples

Minimal working examples covering common use cases.
```

---

## Phase 2 — Framework Contracts (Mid-day)

These items establish framework-level guarantees that all components inherit automatically. They are one-time investments that pay dividends across every component.

---

### 4. `@layer` order codified as framework contract

**Failure mode prevented:** Without a defined layer order, cascade conflicts are resolved unpredictably. Users cannot reliably override component styles. Theme layers can accidentally overwrite component structure. The layer order is the framework's cascade contract — it must be explicit and documented.

**Implementation:**

The framework entry CSS file defines the canonical layer order. This is the only place layer order is declared. All other files append to declared layers — they never redeclare order.

**`vanilla-breeze.css` (framework entry point):**

```css
/*
 * Vanilla Breeze — Layer Order Declaration
 *
 * This is the canonical cascade contract for the framework.
 * Layers are declared once here in priority order (lowest to highest).
 * All component, theme, and consuming files append to these layers only.
 *
 * Order rationale:
 * - reset/base: normalize cross-browser differences, no opinions
 * - tokens: design system variables, no selectors
 * - elements: bare HTML element styles, no classes
 * - components: custom element and web component styles
 * - patterns: multi-component layout compositions
 * - themes: visual theming — color, typography, surface overrides only
 *            themes MUST NOT change layout, spacing structure, or display
 * - utilities: single-purpose helper classes
 * - overrides: consumer/page-level styles, always win
 */

@layer
  reset,
  base,
  tokens,
  elements,
  components,
  patterns,
  themes,
  utilities,
  overrides;
```

**Rules for layer usage across the framework:**

- `reset` — CSS reset only (e.g. box-sizing, margin: 0). No design opinions.
- `base` — Shared foundational styles: focus rings, scroll behavior, `font-size` on `:root`.
- `tokens` — CSS custom properties only. No selectors that apply styles.
- `elements` — Styles targeting bare HTML elements: `p`, `h1`–`h6`, `a`, `ul`, `table`, etc.
- `components` — All custom element styles. Each component file uses `@layer components { }`.
- `patterns` — Composite layout patterns (e.g. a card grid built from multiple components).
- `themes` — Color, typography, and surface overrides only. Themes **must not** alter layout.
- `utilities` — Single-property helpers: `.visually-hidden`, `.sr-only`, `.truncate`.
- `overrides` — Consumer styles. Anything a page author adds goes here to guarantee it wins.

**Component file pattern:**

```css
/* tab-control.css */

@layer components {
  tab-control:not(:defined) { /* pre-upgrade baseline */ }
  tab-control { /* base component styles */ }
  tab-control [role="tablist"] { /* internal part styles */ }
}
```

**What themes may and may not do:**

```css
/* ALLOWED in @layer themes */
@layer themes {
  :root {
    --color-surface: #1a1a2e;
    --color-text: #e0e0e0;
    --font-heading: "Playfair Display", serif;
  }
}

/* FORBIDDEN in @layer themes — layout changes break defensive baseline */
@layer themes {
  tab-control { display: flex; } /* ❌ never in themes */
  tab-panel { padding: 2rem; }   /* ❌ spacing is component territory */
}
```

---

### 5. Logical properties throughout

**Failure mode prevented:** Physical CSS properties (`margin-left`, `border-right`, `padding-top` when used as block-start) break RTL layouts and non-horizontal writing modes silently — no errors, just wrong layouts for international users.

**Implementation:**

Audit all framework CSS files and replace physical directional properties with logical equivalents. This is a one-time migration with zero functional change for LTR users.

**Migration reference:**

| Physical property | Logical equivalent |
|-------------------|--------------------|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `margin-top` | `margin-block-start` |
| `margin-bottom` | `margin-block-end` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `padding-top` | `padding-block-start` |
| `padding-bottom` | `padding-block-end` |
| `border-left` | `border-inline-start` |
| `border-right` | `border-inline-end` |
| `border-top` | `border-block-start` |
| `border-bottom` | `border-block-end` |
| `left` / `right` (positioned) | `inset-inline-start` / `inset-inline-end` |
| `top` / `bottom` (positioned) | `inset-block-start` / `inset-block-end` |
| `width` (when meaning inline size) | `inline-size` |
| `height` (when meaning block size) | `block-size` |
| `text-align: left` | `text-align: start` |
| `text-align: right` | `text-align: end` |
| `float: left` | `float: inline-start` |
| `float: right` | `float: inline-end` |

**Grep command to find violations during audit:**

```bash
grep -rn "margin-left\|margin-right\|padding-left\|padding-right\|border-left\|border-right\|text-align: left\|text-align: right\|float: left\|float: right" src/css/
```

**Exceptions:** Physical properties are acceptable when the intent is genuinely physical and directionality-independent (e.g., `border-top` on a horizontal rule that has no logical equivalent meaning). Document any intentional exceptions with a comment.

```css
/* Intentionally physical — this border marks vertical rhythm, not direction */
.section-divider {
  border-top: 1px solid var(--color-border);
}
```

---

### 6. Scripting media query integration

**Failure mode prevented:** Components that require JavaScript to be usable show broken or confusing UI when scripting is unavailable. The `@media (scripting: none)` query lets CSS hide JS-dependent affordances before the DOM is touched, without requiring `<noscript>` tags scattered through markup.

**Implementation:**

Add to `base` layer in the framework entry CSS:

```css
/* vanilla-breeze.css — base layer */

@layer base {

  /*
   * Scripting detection
   *
   * Elements with [data-requires-js] are hidden entirely when scripting
   * is unavailable. Use this attribute for controls that have no
   * meaningful static-HTML equivalent (e.g. a live search input that
   * requires fetch, a canvas-based chart).
   *
   * Prefer static HTML fallbacks (item 2) over hiding with this attribute.
   * This is a last resort for genuinely JS-only affordances.
   */

  @media (scripting: none) {
    [data-requires-js] {
      display: none !important;
    }
  }

  /*
   * Components in upgrade pending state hide internal JS-driven controls.
   * The pre-upgrade baseline (item 1) provides the visible content.
   */

  @media (scripting: none) {
    [data-js-enhanced] {
      display: none;
    }
  }

  /*
   * Utility class for content that should only show when scripting is off.
   * Use inside <noscript>-equivalent patterns in component markup.
   */
  .only-no-script {
    display: none;
  }

  @media (scripting: none) {
    .only-no-script {
      display: revert;
    }
  }

}
```

**Component usage pattern:**

```html
<!-- In component markup -->
<tab-control>
  <!-- Static navigation — visible when scripting off -->
  <nav class="only-no-script" aria-label="Section navigation">
    <a href="#tab-1">Overview</a>
    <a href="#tab-2">Details</a>
  </nav>

  <!-- Tab UI — hidden via CSS when scripting off -->
  <div role="tablist" data-js-enhanced>
    <!-- JS populates this -->
  </div>

  <div id="tab-1">...</div>
  <div id="tab-2">...</div>
</tab-control>
```

> **Note:** Browser support for `@media (scripting)` is broad as of 2026 but not universal. The `<noscript>` element remains the robust fallback for critical no-JS messaging. Use both layers.

---

### 7. Component upgrade gap handling

**Failure mode prevented:** The gap between HTML parsing and custom element upgrade produces a Flash of Undefined Content (FOUC) — elements exist in the DOM but their JS class has not yet run. This causes layout shift, invisible or oversized content, and broken interactions during the upgrade window.

**Implementation:**

This is addressed by item 1's `:not(:defined)` CSS, but three additional patterns close the remaining gaps:

**Pattern A — Reserve space before upgrade:**

When a component has a known approximate height, reserve it to prevent layout shift:

```css
@layer components {
  /* Reserve height to prevent layout shift during upgrade */
  media-player:not(:defined) {
    display: block;
    min-block-size: 360px; /* approximate pre-upgrade placeholder height */
    background-color: var(--color-surface-muted, #f0f0f0);
    container-type: inline-size;
  }
}
```

**Pattern B — Suppress animation until upgraded:**

Prevents unstyled elements from animating with default or inherited transitions:

```css
@layer base {
  /*
   * Suppress all transitions on undefined custom elements.
   * Prevents unstyled-to-styled transition flicker during upgrade.
   */
  :not(:defined) {
    transition: none !important;
    animation: none !important;
  }
}
```

**Pattern C — JS adds upgrade marker:**

Components self-mark as upgraded so CSS can key off a stable attribute:

```javascript
// In every component's connectedCallback
connectedCallback() {
  // ... setup work ...
  this.setAttribute('data-upgraded', '');
}

disconnectedCallback() {
  this.removeAttribute('data-upgraded');
}
```

```css
@layer components {
  /* Styles contingent on successful upgrade */
  tab-control[data-upgraded] {
    /* enhanced styles that require JS state */
  }

  /* Graceful pre-upgrade state */
  tab-control:not([data-upgraded]) {
    /* same as :not(:defined) but persists if upgrade fails mid-way */
  }
}
```

**Why both `:not(:defined)` and `[data-upgraded]`:**

- `:not(:defined)` covers the parse → upgrade gap (short, reliable)
- `[data-upgraded]` covers partial or failed upgrades (rare, but defensive)

---

## Phase 3 — Theme System (Afternoon)

---

### 8. Theme bundle fallback contract

**Failure mode prevented:** If a lazy-loaded theme bundle fails to load (404, network timeout, CDN outage), the component renders without any theme tokens — potentially broken colors, missing spacing, or invisible text if the base layer is not self-sufficient.

**Implementation:**

The base token layer must define acceptable values for every token a theme may override. No component may reference a token that lacks a base-layer default.

**`tokens/base.css`:**

```css
@layer tokens {

  /*
   * Base Token Contract
   *
   * Every token defined here is a guaranteed fallback.
   * Theme bundles override these values — they never introduce new tokens.
   * A component rendered with only this file must be visually acceptable.
   *
   * "Acceptable" means: readable, usable, not broken.
   * It does not mean: beautiful or on-brand.
   */

  :root {
    /* Color — functional minimums */
    --color-text: #1a1a1a;
    --color-text-muted: #595959;
    --color-background: #ffffff;
    --color-surface: #f5f5f5;
    --color-surface-muted: #ebebeb;
    --color-border: #cccccc;
    --color-accent: #0066cc;
    --color-accent-text: #ffffff;
    --color-focus: #0066cc;
    --color-error: #cc0000;
    --color-success: #007700;
    --color-warning: #996600;

    /* Typography */
    --font-body: system-ui, sans-serif;
    --font-heading: system-ui, sans-serif;
    --font-mono: ui-monospace, monospace;
    --font-size-base: 1rem;
    --line-height-base: 1.5;
    --line-height-heading: 1.2;

    /* Spacing scale */
    --space-2xs: 0.25rem;
    --space-xs: 0.5rem;
    --space-s: 0.75rem;
    --space-m: 1rem;
    --space-l: 1.5rem;
    --space-xl: 2rem;
    --space-2xl: 3rem;
    --space-3xl: 4rem;

    /* Radii */
    --radius-s: 2px;
    --radius-m: 4px;
    --radius-l: 8px;
    --radius-full: 9999px;

    /* Shadows */
    --shadow-s: 0 1px 3px rgb(0 0 0 / 0.12);
    --shadow-m: 0 4px 8px rgb(0 0 0 / 0.12);
    --shadow-l: 0 8px 24px rgb(0 0 0 / 0.12);

    /* Focus ring */
    --focus-ring: 0 0 0 3px var(--color-focus);

    /* Motion */
    --duration-fast: 150ms;
    --duration-base: 250ms;
    --duration-slow: 400ms;
    --easing-base: ease-in-out;

    /* Transitions — respects prefers-reduced-motion */
    --transition-base: var(--duration-base) var(--easing-base);
  }

  @media (prefers-reduced-motion: reduce) {
    :root {
      --duration-fast: 0ms;
      --duration-base: 0ms;
      --duration-slow: 0ms;
    }
  }

}
```

**Theme bundle contract:**

Theme files may only contain `@layer themes` blocks. They may only set values for tokens already declared in `tokens/base.css`. New tokens introduced in a theme are a contract violation.

```css
/* themes/ocean.css — CORRECT */
@layer themes {
  :root {
    --color-accent: #006B8F;      /* ✅ overrides base token */
    --font-heading: "Playfair Display", serif; /* ✅ overrides base token */
  }
}

/* themes/ocean.css — INCORRECT */
@layer themes {
  :root {
    --ocean-wave-color: #006B8F; /* ❌ new token — breaks contract */
  }
  tab-control { padding: 2rem; } /* ❌ layout change — forbidden in themes */
}
```

**Theme load failure detection:**

```javascript
// theme-loader.js
async function loadTheme(themeName) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `/themes/${themeName}.css`;

  link.onerror = () => {
    // Theme failed to load — base tokens are already active,
    // so the page is still usable. Log and continue.
    console.warn(`[vanilla-breeze] Theme "${themeName}" failed to load. Using base tokens.`);
    document.documentElement.setAttribute('data-theme-status', 'fallback');
  };

  link.onload = () => {
    document.documentElement.setAttribute('data-theme', themeName);
    document.documentElement.setAttribute('data-theme-status', 'loaded');
  };

  document.head.appendChild(link);
}
```

---

### 9. Theme Composer performance budget annotation

**Failure mode prevented:** Theme bundles can silently bloat page weight — large web font subsets, high-resolution background assets, or verbose token overrides. Without a budget check at generation time, the minimalism guarantee erodes one theme at a time.

**Implementation:**

The Theme Composer outputs a `[theme-name].budget.json` alongside every generated theme bundle. This file is checked in with the theme and used in CI.

**`ocean.budget.json` example:**

```json
{
  "theme": "ocean",
  "generated": "2026-03-07T10:00:00Z",
  "targets": {
    "a_plus_carbon": 270,
    "a_carbon": 531,
    "recommended_max_theme": 50
  },
  "measured": {
    "css_raw_bytes": 4210,
    "css_gzip_bytes": 1380,
    "font_bytes": 28400,
    "asset_bytes": 0,
    "total_theme_bytes": 32610,
    "total_theme_kb": 31.85
  },
  "status": {
    "within_theme_budget": true,
    "theme_share_of_page_budget_percent": 11.8,
    "notes": "Font subset covers Latin Extended only. Consider variable font."
  }
}
```

**Budget thresholds:**

| Budget level | Total page transfer | Theme allocation (suggested max) |
|---|---|---|
| A+ carbon rating | ~270 KB | 50 KB |
| A carbon rating | ~531 KB | 100 KB |
| Warning threshold | >531 KB | >100 KB |

The Theme Composer emits a console warning during generation if the theme exceeds its allocation. It does not block generation — the engineer decides the trade-off.

---

## Phase 4 — Documentation and Tooling (Late Afternoon)

---

### 10. Component catalog resilience matrix

**Failure mode prevented:** A catalog that only documents the happy path creates a false sense of completeness. The resilience matrix makes the framework's defensive posture visible and verifiable, and identifies components that need work.

**Implementation:**

Add a resilience matrix table to the component catalog index. Update it as each component is built or audited.

**Status legend:**

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully supported and tested |
| 🟡 | Partially supported — known limitations documented |
| ❌ | Not supported — known failure |
| 🔲 | Not yet assessed |

**Catalog resilience matrix:**

| Component | No-JS | No-CSS | Upgrade Gap | Keyboard | Screen Reader | RTL |
|-----------|-------|--------|-------------|----------|---------------|-----|
| `<tab-control>` | ✅ | ✅ | ✅ | ✅ | 🟡 | 🔲 |
| `<disclosure-widget>` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<data-grid>` | 🟡 | 🟡 | ✅ | 🟡 | ❌ | 🔲 |
| `<media-player>` | 🟡 | ✅ | ✅ | ✅ | 🟡 | ✅ |
| `<geo-map>` | ❌ | ✅ | 🟡 | 🔲 | 🔲 | ✅ |
| `<chat-component>` | ❌ | ✅ | ✅ | 🔲 | 🔲 | 🔲 |

**Column definitions:**

- **No-JS** — Is the component's content and purpose accessible without JavaScript?
- **No-CSS** — Is the HTML structure logical and readable without any stylesheet?
- **Upgrade Gap** — Does `:not(:defined)` CSS prevent layout shift during upgrade?
- **Keyboard** — Is the full feature set operable by keyboard alone?
- **Screen Reader** — Has the component been tested with at least one screen reader?
- **RTL** — Does the component layout correctly with `dir="rtl"`?

The matrix lives in `docs/catalog/README.md` and is updated by convention whenever a component spec is marked `stable`.

---

### 11. Architecture decision annotations

**Failure mode prevented:** Architectural decisions that lack rationale get quietly reversed by future contributors (or future AI-assisted sessions) who see the choice as arbitrary. Annotating decisions with the failure modes they prevent makes the architecture self-defending.

**Implementation:**

Each major architectural choice in the framework gets a brief ADR-style annotation in the architecture documentation. These are not full ADRs — they are one-paragraph explanations embedded in the relevant docs.

**Template for an annotation:**

```
**Decision:** [What was decided]
**Because:** [What failure mode or problem this prevents]
**Trade-off:** [What is given up or complicated by this choice]
```

**Example annotations for existing Vanilla Breeze decisions:**

---

**Decision:** Custom elements must use a hyphen in their name (e.g. `<tab-control>`, not `<tabcontrol>`).

**Because:** The HTML spec reserves unhyphenated names for future standard elements. Using a hyphen prevents collision with any current or future HTML element, ensures the parser routes the element through the custom element registry, and makes third-party component origins visually identifiable in markup.

**Trade-off:** Slightly more verbose tag names. Acceptable given the collision protection and parser guarantee.

---

**Decision:** Component state is communicated via `data-*` attributes, not CSS classes.

**Because:** CSS classes conflate styling concerns with state concerns. `data-*` attributes are queryable via the `dataset` API, can be targeted by CSS attribute selectors without class specificity issues, survive serialization (e.g. server-side rendering produces correct initial state), and are unambiguous in their purpose. A class named `active` could mean anything; `data-state="active"` cannot.

**Trade-off:** Slightly more verbose selectors (`[data-state="active"]` vs `.active`). Acceptable given the clarity and API benefits.

---

**Decision:** `@layer` order is declared once in the framework entry file; no other file may redeclare layer order.

**Because:** Multiple `@layer` order declarations in different files produce unpredictable cascade behavior as load order varies. A single declaration point guarantees deterministic cascade behavior regardless of which stylesheets load first or in what order. This is the CSS equivalent of a single source of truth.

**Trade-off:** All consuming projects must import the framework entry file before any other stylesheet. Documented as a usage requirement.

---

**Decision:** Themes may not change layout, spacing structure, or `display` values — only color, typography, and surface tokens.

**Because:** Layout changes in a theme layer break the component's pre-upgrade CSS baseline, potentially causing the `:not(:defined)` fallback and the upgraded state to have different layout models. This would produce layout shift on upgrade even with item 1 in place.

**Trade-off:** Theme authors have less control. This is intentional — visual identity lives in color and type; structural layout lives in components.

---

### 12. Claude Code validation slash command

**Failure mode prevented:** Drift from the defensive standards happens gradually — a component ships without `:not(:defined)` CSS, a physical property sneaks in, the layer order changes in a file. Manual review catches this inconsistently. A single slash command catches it every time.

**Implementation:**

Add `/validate-component` to the Claude Code slash command registry (`.claude/commands/validate-component.md`):

```markdown
# /validate-component

Run defensive quality checks on a component directory.

Usage: /validate-component [component-name]
Example: /validate-component tab-control

## Checks

Run the following checks on `components/[component-name]/`:

### 1. Pre-upgrade CSS (Item 1)
- Does `[component-name].css` contain a `:not(:defined)` block?
- Is the `:not(:defined)` block before any enhanced styles?
- Does it use only `var(--*)` tokens? (grep for hardcoded hex, px values in color/font properties)

### 2. Static HTML form (Item 2)
- Does `[component-name].html` exist?
- Run W3C validation on the file (use the validator API or local validator)
- Does the file contain only standard HTML elements? (grep for any `-` in tag names)
- Does the file have a comment explaining the upgrade relationship?

### 3. Spec completeness (Item 3)
- Does `README.md` exist?
- Does it contain all required sections: Purpose, Static HTML Form, Enhanced Form,
  Attributes and API, Failure Modes, Accessibility, CSS Tokens, Examples?
- Does the Failure Modes section have entries for: No JavaScript, No CSS,
  Upgrade Delay, Keyboard Only, Screen Reader, RTL?
- Are any fields marked "Not yet assessed" or left blank?

### 4. Layer usage (Item 4)
- Does `[component-name].css` use `@layer components { }` wrapper?
- Are there any bare (unlayered) rules?
- Are there any `@layer themes` blocks? (forbidden in component files)

### 5. Logical properties (Item 5)
- Run grep for physical directional properties:
  `margin-left|margin-right|padding-left|padding-right|border-left|border-right`
- Flag any found. Prompt for intentional exception comment if present.

### 6. Upgrade marker (Item 7)
- Does the JS file call `this.setAttribute('data-upgraded', '')` in connectedCallback?
- Does the JS file call `this.removeAttribute('data-upgraded')` in disconnectedCallback?

## Output

Produce a checklist with ✅ / ❌ / ⚠️ for each check.
List all failures with file and line number where possible.
Suggest fixes for each failure.
Update the catalog resilience matrix entry for this component if all checks pass.
```

---

### 13. Performance budget constraint file

**Failure mode prevented:** Without a concrete budget, performance aspirations remain aspirational. A `budget.json` at the project root makes the constraint machine-readable, enabling CI checks and giving Claude Code sessions a concrete target to optimize against.

**Implementation:**

**`budget.json` (project root):**

```json
{
  "$schema": "./budget.schema.json",
  "description": "Vanilla Breeze performance budget. Targets A+ carbon rating (~270KB transfer for a typical page).",
  "version": "1.0.0",
  "targets": {
    "carbon_a_plus_kb": 270,
    "carbon_a_kb": 531
  },
  "framework": {
    "description": "Framework core — reset, base, tokens, component registry",
    "css_kb": 15,
    "js_kb": 10,
    "note": "Minified and gzipped. Excludes individual component files."
  },
  "per_component": {
    "description": "Budget per individual component (CSS + JS combined)",
    "max_kb": 10,
    "warn_kb": 7,
    "note": "Components are loaded on demand, not as a bundle."
  },
  "fonts": {
    "description": "Web font budget per page",
    "max_kb": 60,
    "warn_kb": 40,
    "note": "Use variable fonts and Latin subset where possible."
  },
  "images": {
    "description": "Total image budget per page (excludes hero/editorial images)",
    "max_kb": 100,
    "warn_kb": 75,
    "note": "Use modern formats (WebP, AVIF). Hero images assessed separately."
  },
  "theme": {
    "description": "Per theme bundle including fonts declared by theme",
    "max_kb": 50,
    "warn_kb": 35
  },
  "demo_site": {
    "description": "Full demo page target (framework + 3 components + 1 theme + content)",
    "max_kb": 270,
    "warn_kb": 200,
    "note": "This is the A+ carbon rating target. The demo site is the showcase — it must hit this."
  }
}
```

**Budget schema (`budget.schema.json`) for editor validation:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Performance Budget",
  "type": "object",
  "required": ["targets", "framework", "per_component"],
  "properties": {
    "targets": {
      "type": "object",
      "properties": {
        "carbon_a_plus_kb": { "type": "number" },
        "carbon_a_kb": { "type": "number" }
      }
    },
    "per_component": {
      "type": "object",
      "required": ["max_kb"],
      "properties": {
        "max_kb": { "type": "number" },
        "warn_kb": { "type": "number" }
      }
    }
  }
}
```

**Usage in Claude Code sessions:**

Reference `budget.json` in implementation tasks: *"New component must stay within the `per_component.max_kb` budget defined in `budget.json`."* The Theme Composer reads this file when generating `[theme].budget.json` annotations (item 9).

---

## Component Spec Template

The canonical template for all component specification files. Copy this to `components/[name]/README.md` when scaffolding a new component.

```markdown
---
title: [Component Name] Specification
component: [element-name]
version: 0.1.0
status: draft
---

# [Component Name]

[One sentence: what does this do for the user?]

## Table of Contents

- [Purpose](#purpose)
- [Static HTML Form](#static-html-form)
- [Enhanced Form](#enhanced-form)
- [Attributes and API](#attributes-and-api)
- [Failure Modes](#failure-modes)
- [Accessibility](#accessibility)
- [CSS Tokens](#css-tokens)
- [Examples](#examples)

## Purpose

## Static HTML Form

## Enhanced Form

## Attributes and API

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|

## Failure Modes

### No JavaScript
- **Behavior:**
- **Implementation:**
- **Acceptable:**

### No CSS
- **Behavior:**
- **Implementation:**
- **Acceptable:**

### Upgrade Delay
- **Behavior:**
- **Implementation:**
- **Acceptable:**

### Keyboard Only
- **Behavior:**
- **Tab order:**
- **Key bindings:**
- **Acceptable:**

### Screen Reader
- **ARIA roles:**
- **Live regions:**
- **Announced state changes:**
- **Tested with:**
- **Acceptable:**

### RTL / i18n
- **Behavior:**
- **CSS approach:**
- **Acceptable:**

## Accessibility

## CSS Tokens

| Token | Default | Purpose |
|-------|---------|---------|

## Examples
```

---

## Reference: Failure Mode Map

Each item traces to the failure modes it prevents.

| Item | Failure Mode Prevented |
|------|----------------------|
| 1. Pre-upgrade CSS | Layout shift, invisible content during JS load gap |
| 2. Static HTML form | JS-only components with no resilient baseline |
| 3. Spec Failure Modes section | Happy-path-only component design, undocumented limitations |
| 4. `@layer` contract | Unpredictable cascade, user overrides failing, theme clobbering components |
| 5. Logical properties | Broken RTL layouts, i18n regressions |
| 6. Scripting media query | JS-dependent UI showing broken state when scripting unavailable |
| 7. Upgrade gap handling | FOUC, layout shift, animation flicker during component upgrade |
| 8. Theme fallback contract | Broken visual state when theme bundle fails to load |
| 9. Budget annotation | Silent theme weight bloat, performance regression per-theme |
| 10. Resilience matrix | Incomplete catalog, false confidence in component quality |
| 11. Architecture annotations | Silent reversal of defensive decisions by future contributors |
| 12. Validation slash command | Gradual drift from defensive standards between sessions |
| 13. Budget constraint file | Performance targets remaining aspirational rather than enforced |