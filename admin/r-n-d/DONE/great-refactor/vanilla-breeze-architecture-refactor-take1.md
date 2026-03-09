---
title: Vanilla Breeze — Architectural Refactor Plan
description: A framework for thinking about core, bundles, contexts, and the path to an open platform
date: 2026-03-05
status: draft
---

# Vanilla Breeze — Architectural Refactor Plan

Vanilla Breeze is at an inflection point. The foundation is solid — web-platform-native, zero production dependencies, progressive enhancement throughout. The question is no longer *can it work* but *how does it scale to multiple contexts without becoming the next Bootstrap or React problem*: either frozen in time or so opinionated it creates lock-in.

This document defines the architecture needed to deliver an open, composable platform that does 80% of the work for any context while never penalising developers for the 80% they don't need.

## Table of Contents

- [The Core Problem](#the-core-problem)
- [Vocabulary](#vocabulary)
- [The Core Layer](#the-core-layer)
- [Context Model](#context-model)
- [The Bundle System](#the-bundle-system)
- [The Extension API](#the-extension-api)
- [Distribution Strategy](#distribution-strategy)
- [The Design Tooling Context (Prototype)](#the-design-tooling-context-prototype)
- [Versioning and Stability](#versioning-and-stability)
- [Phased Roadmap](#phased-roadmap)
- [Non-Goals](#non-goals)

---

## The Core Problem

Adding features is easy. Knowing which features belong to *everyone* is hard.

Currently, Vanilla Breeze ships a single bundle (`vanilla-breeze-core`) that includes everything: the theme picker UI, 40+ brand themes, extensions system, service worker wiring, sound effects, motion toggles, and layout components. A developer building a tightly-branded corporate intranet pays the cost of features they will never use and must actively fight against opinions that contradict their context.

The goal is a **layered architecture** where:

- The core is small, universal, and stable
- Contexts are opinionated presets that compose on top of the core
- Bundles are distributable, versioned packages of functionality for a context
- Extensions are the public API for third-party and community additions

---

## Vocabulary

| Term | Meaning |
|------|---------|
| **Core** | The irreducible minimum — tokens, reset, native elements, layout, theme system API |
| **Context** | A named use case with different expectations: `prototype`, `site`, `blog`, `app` |
| **Bundle** | A versioned, distributable CSS+JS package targeting a context |
| **Pack** | A named group of features within a bundle (e.g. `legal-pack`, `analytics-pack`) |
| **Extension** | A third-party or community add-on following the Extension API contract |
| **Widget** | A self-contained custom element + styles, portable across contexts |

---

## The Core Layer

The core must be safe to ship in every context without compromise. If a feature serves *most* contexts but not all, it does not belong in the core.

### What belongs in core

- **Design tokens** — the full CSS custom property system (colors, spacing, typography, motion)
- **Reset and base** — normalization, box model, OKLCH color system
- **Native element styles** — the 37 native HTML elements, unstyled by context-specific opinion
- **Layout custom elements** — the 15 layout elements (`layout-stack`, `layout-sidebar`, etc.)
- **Theme system API** — the `ThemeManager` object, `setMode()`, `setBrand()`, but not the picker UI
- **Core web components** — `icon-wc`, `heading-links`, and the handful of universally needed interactives

### What leaves core

| Feature | Current location | New location |
|---------|-----------------|--------------|
| Theme picker UI (`theme-picker` web component) | core | `ui-pack` |
| 40+ brand themes | core | `themes-pack` |
| Sound effects system | core | `app-pack` |
| Service worker wiring | core | `app-pack` or `site-pack` |
| Extensions toggle UI | core | `ui-pack` |
| Wireframe/blueprint styles | (not yet built) | `prototype-pack` |
| Legal components | (not yet built) | `site-pack` |
| CMS integration hooks | (not yet built) | `site-pack` |

The result: a core that a developer can ship with confidence that they are paying only for what they use.

---

## Context Model

Four primary contexts cover the realistic space of Vanilla Breeze use:

### 1. Prototype

Used during design and wireframing. The goal is fast, collaborative ideation — not production code.

**Characteristics:**
- Blueprint/architectural drawing aesthetic is appropriate
- Placeholder images, annotation elements, user story/persona/journey pages
- Site map system with page-type icons
- Color/type specimen pages, brand treatment sheets
- Commenting and approval widgets
- Heavy tooling, zero production burden

**Bundled with:** `prototype-bundle` (prototype-pack + wireframe-pack + design-system-pack)

### 2. Site

Content-first websites: corporate, organizational, product marketing, documentation.

**Characteristics:**
- Single (or dual light/dark) theme reflecting brand — not user-switchable to arbitrary themes
- Strong metadata, SEO, structured data, data provenance
- Legal components: privacy, disclosure, terms
- Analytics integration (first-party, privacy-respecting — informed by Triton patterns)
- CMS and SSG friendly
- Accessibility modes (high contrast, reader mode, agent-accessible plain text)
- Service worker for performance, not offline-first

**Bundled with:** `site-bundle` (site-pack + analytics-pack + legal-pack + a11y-pack)

### 3. Blog / Personal

Expressive, author-driven sites. Theme flexibility is a feature, not a bug.

**Characteristics:**
- Multiple themes for mood, content type, time-of-day or seasonal contexts
- Dramatic visual modes (time/place, locale, season)
- Community widget/theme discovery and loading
- Author controls for presenting content in context
- SSG-friendly; no server required

**Bundled with:** `blog-bundle` (blog-pack + theme-gallery-pack + community-pack)

### 4. App

Interactive web applications: SaaS, PWAs, Electron-wrapped, internal tools.

**Characteristics:**
- OS-aware or context-aware theming (matches system UI when appropriate)
- Rich widget library (data tables, modals, command palettes, toasts, etc.)
- Strict version management — breaking changes must be explicit
- A/B testing hooks and error analytics
- User preference controls scoped to accessibility and light/dark, not arbitrary themes
- PWA manifest, service worker, offline-first patterns

**Bundled with:** `app-bundle` (app-pack + widgets-pack + pwa-pack + analytics-pack)

---

## The Bundle System

A bundle is a versioned, opinionated composition of the core plus packs. It is the thing a developer installs or references via CDN.

### Bundle anatomy

```
vanilla-breeze-[context]-bundle/
├── index.css          # Core + context CSS, layered
├── index.js           # Core + context JS, tree-shakeable
├── packs/             # Individual packs for partial adoption
│   ├── analytics.css
│   ├── analytics.js
│   ├── legal.css
│   └── ...
└── manifest.json      # Declares: version, dependencies, packs included
```

### Composition via CSS layers

Bundles extend the core layer order rather than replacing it:

```css
/* core layers */
@layer tokens, reset, native-elements, custom-elements, web-components, utils;

/* site-bundle adds: */
@layer tokens, reset, native-elements, custom-elements, web-components,
       site-components, legal, analytics-hooks, utils;
```

This means the core is never forked — the site bundle imports core and adds layers on top. A developer who wants *only* legal components can import `packs/legal.css` directly.

### Zero opinion enforcement

A bundle provides defaults. It does not prevent overrides. Every bundle opinion is expressed through the cascade layer system — consumer code at `utils` layer or inline styles always wins.

---

## The Extension API

Community extensions are the long-term health of the platform. The extension API must be:

- **Declarative**: a manifest file describes what an extension provides and requires
- **Self-registering**: drop a `<script>` or `import` and the extension activates
- **Sandboxed by convention**: extensions use namespaced CSS custom properties and namespaced JS, reducing collision risk
- **Discoverable**: a public registry (even a simple GitHub topic or JSON index) allows discovery

### Extension manifest contract

```json
{
  "name": "vb-retro-theme",
  "version": "1.2.0",
  "type": "theme",
  "requires": { "vanilla-breeze": ">=2.0.0" },
  "provides": {
    "themes": ["retro-crt", "retro-80s"],
    "tokens": "./tokens.css",
    "components": []
  },
  "entry": {
    "css": "./retro.css",
    "js": "./retro.js"
  }
}
```

### Extension types

| Type | Provides | Example |
|------|---------|---------|
| `theme` | CSS token overrides, new brand entries | `vb-corporate-theme` |
| `widget` | Custom elements + styles | `vb-kanban-board` |
| `pack` | Groups of components for a domain | `vb-ecommerce-pack` |
| `integration` | Adapter for a CMS or framework | `vb-contentful` |

### Widget portability

Widgets are the primitive unit of community sharing. A widget must:

1. Be a Web Component (custom element) — the browser is the runtime, no framework dependency
2. Import its own styles scoped to its shadow DOM or use core tokens via CSS custom properties
3. Declare its extension manifest
4. Work with the core alone — no bundle dependency

---

## Distribution Strategy

### CDN-first for adoption

```html
<!-- Core only -->
<link rel="stylesheet" href="https://cdn.vanillabreeze.dev/v2/core.css">
<script type="module" src="https://cdn.vanillabreeze.dev/v2/core.js"></script>

<!-- Or a full context bundle -->
<link rel="stylesheet" href="https://cdn.vanillabreeze.dev/v2/site-bundle.css">
<script type="module" src="https://cdn.vanillabreeze.dev/v2/site-bundle.js"></script>
```

### NPM for build-tool users

For developers using Vite, Rollup, etc., the package structure matches the CDN layout:

```javascript
import 'vanilla-breeze/core.css';
import 'vanilla-breeze/packs/legal.css';
import { ThemeManager } from 'vanilla-breeze';
```

### No build step required

Both paths must work. The CDN path is not a fallback — it is a first-class distribution mechanism. This is a core commitment.

---

## The Design Tooling Context (Prototype)

The prototype context deserves specific attention because it is the entry point for most projects. It is also the context most likely to contain tooling that would be embarrassing to ship to production.

### Prototype-specific features

**Wireframe mode** — activated via `data-wireframe` on `<html>`:
- Blueprint colour palette (Architects Daughter font, indigo/blue backgrounds, sketch-style borders)
- All images replaced with `<placeholder-image>` components showing dimensions and type
- All navigation links show as `[link]` indicators
- Form elements show field labels and types without styling

**Site map system**:
- A `<site-map>` custom element renders a spatial tree of pages
- Page nodes are clickable — navigate to the wireframe for that page
- Page type icons indicate: landing, content, form, data, error
- Draws on architectural blueprint aesthetics

**Design artifact pages** — dedicated page templates:
- `data-page="user-story"` — structured user story format
- `data-page="user-journey"` — journey map with stages and emotion curve
- `data-page="user-persona"` — persona card format
- `data-page="type-specimen"` — full typographic scale with annotations
- `data-page="color-swatch"` — token color swatches with OKLCH values
- `data-page="brand-sheet"` — complete brand treatment on one page

**Annotation elements**:
- `<design-note>` — floating sticky note attached to an element
- `<approval-badge>` — stamp-style approved/needs-revision state
- `<component-status>` — shows spec status: `draft | review | approved | built`

These features are isolated in the `prototype-bundle`. Zero bytes of this ships to production by design.

---

## Versioning and Stability

The extension and bundle system only works if developers can trust that upgrading core doesn't break their packs.

### Semver commitment

- **Core** follows strict semver. No breaking changes in minor or patch.
- **Bundles** follow core's version range in their manifest.
- **Extension API** (the manifest contract and self-registration hook) is versioned separately and changes only with a major bump.

### Stability tiers

| Tier | Commitment |
|------|-----------|
| **Stable** | Semver guaranteed, deprecation cycle before removal |
| **Beta** | Available, may change, not in stable bundle |
| **Experimental** | Behind `data-experimental` flag or explicit opt-in import |

Design tooling features (site map, annotation elements) ship as **beta** until community use patterns emerge. The core CSS layer order is **stable** from v2.0 onward.

---

## Phased Roadmap

### Phase 1 — Core extraction (immediate priority)

> Separate what is universal from what is contextual.

- [ ] Audit current `vanilla-breeze-core` — tag each feature with its context
- [ ] Extract theme picker UI out of core into `ui-pack`
- [ ] Extract 30+ non-essential brand themes into `themes-pack`
- [ ] Extract extensions toggle, sound system, service worker wiring
- [ ] Publish `vanilla-breeze-core` v2 as the new baseline
- [ ] Verify: a plain `<link>` to core.css + core.js produces a clean, usable site with zero extra features

### Phase 2 — Bundle definitions

> Codify the four contexts with opinionated bundles.

- [ ] Define `site-bundle`: core + site-pack scaffold
- [ ] Define `app-bundle`: core + app-pack scaffold
- [ ] Define `blog-bundle`: core + blog-pack + theme-gallery scaffold
- [ ] Each bundle ships a `manifest.json` declaring its packs and version range
- [ ] Documentation site uses `site-bundle` to demonstrate eating our own cooking

### Phase 3 — Prototype bundle

> Enable the design phase as a first-class part of the workflow.

- [ ] Design and implement `wireframe` mode (`data-wireframe`)
- [ ] Build `<site-map>` component
- [ ] Build artifact page templates (persona, journey, story, specimen, swatches, brand sheet)
- [ ] Build annotation elements (`design-note`, `approval-badge`, `component-status`)
- [ ] Create a sample project that takes a site from wireframe → final build using the same core

### Phase 4 — Extension API

> Open the platform.

- [ ] Define and document the extension manifest contract
- [ ] Implement the self-registration hook in core JS
- [ ] Build 2–3 reference extensions (a theme, a widget, a pack)
- [ ] Publish contributing guide: how to write, test, and distribute an extension
- [ ] Create minimal public registry (GitHub topic `vanilla-breeze-extension` + JSON index)

### Phase 5 — Community and documentation

> Make the 100% easy, not just the 80%.

- [ ] Comprehensive bundle authoring guide
- [ ] Context-specific starter templates (site, app, blog, prototype)
- [ ] Showcase site with real examples in each context
- [ ] Interactive extension browser in docs
- [ ] Migration guide from Bootstrap, from plain HTML projects

---

## Non-Goals

These are explicitly out of scope, to keep the framework honest:

- **No JavaScript framework adapter layer** — Vanilla Breeze works with any framework as-is; no React or Vue wrappers are first-party
- **No CSS-in-JS** — ever
- **No mandatory build step** — the CDN path is always first-class
- **No component logic duplication** — if the web platform provides it natively, we use it rather than reinvent it
- **No centralized theme marketplace** (yet) — the extension registry is a community mechanism, not a monetized platform

---

> The measure of success: a developer can use `<link>` to vanilla-breeze-core, get a clean, accessible, well-styled site, and never encounter a feature they didn't ask for. Every additional capability is a deliberate, legible choice.
