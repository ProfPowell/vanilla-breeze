---
title: Semantic Typography Enhancement — `<b>` and `<i>` Elements
description: Progressive font loading and variable font treatment for presentational HTML elements in Vanilla Breeze
author: Vanilla Breeze Project
date: 2026-03-06
tags:
  - typography
  - progressive-enhancement
  - fonts
  - vanilla-breeze
status: draft
---

# Semantic Typography Enhancement — `<b>` and `<i>` Elements

A small but meaningful upgrade to how Vanilla Breeze treats `<b>` and `<i>`. These elements cannot and should not disappear — they carry legitimate semantic weight in the HTML spec. The goal is to ensure they render with typographic quality that matches their intent, without any authoring burden.

## Table of Contents

- [Rationale](#rationale)
- [Spec Alignment](#spec-alignment)
- [CSS Layer](#css-layer)
- [JavaScript Enhancement](#javascript-enhancement)
- [Font Pairing Recommendations](#font-pairing-recommendations)
- [Custom Property API](#custom-property-api)
- [Non-Goals](#non-goals)

## Rationale

Browser defaults for `<b>` and `<i>` are typographically lazy:

- `<b>` → `font-weight: bold` — often a synthesized bold, not a true weight
- `<i>` → `font-style: italic` — often an oblique slant, not a true italic cut

Synthesized bold adds stroke weight artificially. Synthesized italic merely skews the roman. Both are visually degraded compared to purpose-drawn typefaces. With variable fonts now mainstream, there is no reason to tolerate this.

Vanilla Breeze handles this transparently at the framework level. Authors write `<b>` and `<i>` as they always have. The framework ensures the best available rendering.

## Spec Alignment

Per the HTML living standard:

- `<b>` — "bring attention to" text: keywords, product names, lead sentences. Not importance (that's `<strong>`).
- `<i>` — idiomatic offset text: technical terms, foreign phrases, taxonomic names, ship names, thoughts. Not decoration (that's CSS).

This distinction informs context-sensitive styling. A `<b>` inside a `<code>` block has different visual needs than a `<b>` in editorial prose.

## CSS Layer

Defined in `@layer base.typography`.

```css
@layer base.typography {

  b, strong {
    font-weight: var(--font-weight-bold, 700);
    font-synthesis: none;
    font-optical-sizing: auto;
  }

  i, em {
    font-style: italic;
    font-synthesis: none;
    font-optical-sizing: auto;
  }

  /* Context-sensitive treatment — zero specificity cost */
  :where(code b, code strong, pre b) {
    font-weight: var(--font-weight-bold, 700);
    background-color: var(--code-highlight-bg, transparent);
    border-radius: 2px;
  }

  :where(blockquote i, blockquote em) {
    font-style: normal;
    font-weight: var(--font-weight-medium, 500);
  }

  /* True combined cut when available */
  :where(b i, i b, strong em, em strong) {
    font-weight: var(--font-weight-bold, 700);
    font-style: italic;
    font-synthesis: none;
  }

}
```

The critical rule is `font-synthesis: none`. This tells the browser: do not fake a weight or slant — use what the font actually provides. Paired with a variable font, this is a feature. Without one, the JS layer compensates.

## JavaScript Enhancement

`typography-enhance.js` — part of the Vanilla Breeze optional enhancement bundle.

### Detection

```js
function supportsVariableFonts() {
  return window.CSS?.supports('font-variation-settings', '"wght" 700')
}
```

### Lazy Face Loading

If variable fonts are unavailable, load only the faces the document actually needs.

```js
async function loadFontFace(name, url, descriptors = {}) {
  const face = new FontFace(name, `url(${url}) format('woff2')`, descriptors)
  await face.load()
  document.fonts.add(face)
}

async function enhanceTypography(config = {}) {
  const {
    family       = 'Body',
    boldSrc      = '/fonts/body-700.woff2',
    italicSrc    = '/fonts/body-italic.woff2',
    boldWeight   = '700',
    italicStyle  = 'italic',
  } = config

  if (supportsVariableFonts()) return  // CSS handles it

  const hasBold   = !!document.querySelector('b, strong')
  const hasItalic = !!document.querySelector('i, em')

  const loads = []

  if (hasBold) {
    loads.push(loadFontFace(family, boldSrc, { weight: boldWeight }))
  }

  if (hasItalic) {
    loads.push(loadFontFace(family, italicSrc, { style: italicStyle }))
  }

  await Promise.all(loads)
}
```

### Dynamic Content Support

For content injected after load (rich text editors, AI responses, chat UIs):

```js
function observeForFontNeeds(config = {}) {
  if (supportsVariableFonts()) return

  let boldLoaded   = !!document.querySelector('b, strong')
  let italicLoaded = !!document.querySelector('i, em')

  const observer = new MutationObserver(() => {
    if (!boldLoaded && document.querySelector('b, strong')) {
      boldLoaded = true
      loadFontFace(config.family, config.boldSrc, { weight: config.boldWeight })
    }
    if (!italicLoaded && document.querySelector('i, em')) {
      italicLoaded = true
      loadFontFace(config.family, config.italicSrc, { style: config.italicStyle })
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
}
```

### Initialization

```js
// Vanilla Breeze boot
document.addEventListener('DOMContentLoaded', () => {
  enhanceTypography({
    family:      'Body',
    boldSrc:     '/fonts/body-700.woff2',
    italicSrc:   '/fonts/body-italic.woff2',
    boldWeight:  '700',
    italicStyle: 'italic',
  })
  observeForFontNeeds({ /* same config */ })
})
```

## Font Pairing Recommendations

Vanilla Breeze ships with recommendations for variable font stacks that provide true weight and italic axes. Authors may substitute any variable font that covers the axes below.

| Role | Recommended Font | Axes Required |
|------|-----------------|---------------|
| Body | [Inter Variable](https://rsms.me/inter/) | `wght`, `ital` |
| Body | [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4) | `wght`, `ital`, `opsz` |
| Body | [Literata](https://fonts.google.com/specimen/Literata) | `wght`, `ital`, `opsz` |
| Mono | [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | `wght` |

The `opsz` (optical size) axis is a bonus — where available it refines letterform detail at small and large sizes automatically via `font-optical-sizing: auto`.

### Preferred `<b>` Weight

Do not default to `700`. Consider:

- `700` — conventional bold, works everywhere
- `750`–`800` — noticeably bolder in variable fonts, better contrast in body text
- `900` — for display or emphasis-heavy contexts

Set via `--font-weight-bold` at `:root` or within a theme bundle.

## Custom Property API

```css
:root {
  --font-weight-bold:    750;      /* b, strong */
  --font-weight-medium:  500;      /* contextual use */
  --font-italic-style:   italic;   /* i, em */
  --code-highlight-bg:   hsl(50 100% 93%);
}
```

Living Themes may override any of these. The base layer never hard-codes values.

## Non-Goals

- This spec does not address `<strong>` or `<em>` semantics — those are covered in the accessibility layer.
- This is not a type scale or fluid typography spec — that is `spec-typography-scale.md`.
- No opinion is expressed on font licensing or CDN vs self-hosting. That is a project-level decision.
- This spec does not introduce new HTML attributes or custom elements. It enhances native elements only.