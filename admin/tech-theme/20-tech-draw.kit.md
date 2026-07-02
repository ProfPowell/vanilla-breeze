---
title: Technical Order — tech-draw Drawing Kit
description: Static-SVG helpers (callout, dimension, scale bar, title block, reference numeral, hatch, revision flag) for composing technical figures.
author: handoff for Claude Code
date: 2026-05-29
tags:
  - tech-draw
  - svg
  - technical-order
  - web-components
---

# Technical Order — tech-draw Drawing Kit

The drawing half of the family: a small kit that decorates an **author-drawn SVG** with engineering annotations — leader callouts, dimension lines, a title block, reference numerals, a scale bar, section hatching, a revision flag. The author draws the part; the kit adds the technical layer.

Mirrors the `border-wc` helper philosophy: **provide annotation helpers, not pre-baked art.** Everything works in the SVG's `viewBox` space, so figures scale as a unit — **no `ResizeObserver`, no runtime loop, optionally build-time.**

## Table of contents

- [Why not custom elements inside SVG](#why-not-custom-elements-inside-svg)
- [Functional core](#functional-core)
- [Declarative wrapper](#declarative-wrapper)
- [Coordinate model](#coordinate-model)
- [Accessibility](#accessibility)
- [Files to add or edit](#files-to-add-or-edit)
- [Acceptance criteria](#acceptance-criteria)
- [Clangs](#clangs)

## Why not custom elements inside SVG

Autonomous custom elements nested inside `<svg>` are not reliably upgraded across engines (SVG content model + the HTML parser disagree). So the kit is a **functional core** that appends standard SVG elements to an author's `<svg>`, with a thin **light-DOM custom element** wrapper (`<tech-figure>`) for declarative authoring that reads attribute-bearing child markers and calls the core. Functional core, imperative shell.

## Functional core

`tech-draw.js` exports pure-ish helpers. Each takes the target `<svg>` (or a `<g>`) and an options object in viewBox units, appends SVG, and returns the created node(s). No global state; no observers.

```js
import { dimension, callout, refNum, scaleBar, titleBlock, sectionHatch, revFlag, ensureDefs }
  from 'tech-draw';

// author draws the part first…
const svg = figure.querySelector('svg');           // viewBox="0 0 520 330"

// …then annotates it:
dimension(svg, { x1:120, y1:60, x2:360, y2:60, value:'240' });        // extension + arrows + label
callout(svg,   { at:[150,120], to:[470,96], label:'MOUNTING BOSS' }); // leader from label to point
refNum(svg,    { at:[150,120], to:[478,96], n:1 });                   // circled numeral
scaleBar(svg,  { x:600, y:300, steps:5, step:22, units:'CM' });
revFlag(svg,   { x:548, y:96, n:2 });
sectionHatch(svg, { x:182, y:60, w:46, h:48, angle:45, gap:10 });
```

Signatures:

```bnf
dimension(svg, { x1, y1, x2, y2, value, offset=0, units })
callout(svg,   { at:[x,y], to:[x,y], label, anchor="start"|"middle"|"end" })
refNum(svg,    { at:[x,y], to:[x,y], n })            ; circled number + leader
scaleBar(svg,  { x, y, steps=5, step=22, units })    ; alternating filled ticks + labels
titleBlock(svg|el, { rows:[ {label, value, span?} … ], corner="br" })
sectionHatch(svg, { x, y, w, h, angle=45, gap=10 })
revFlag(svg,   { x, y, n })                          ; triangle + number
ensureDefs(svg)                                      ; injects the shared arrowhead marker once
```

All helpers read CSS custom properties for color so they retone with the dialect:

```js
// inside a helper
const ink = getComputedStyle(svg).getPropertyValue('--doc-ink').trim() || 'currentColor';
```

So a blueprint figure (`--doc-ink:#eaf2ff`) draws white annotations; a manual figure draws black — no per-call color.

> 💡 **Tip:** Because everything is appended in viewBox units, the figure scales with its container automatically. Do **not** add resize handling. This is the platform-first payoff — the kit can even run at build time and ship as static SVG.

### Arrowheads

One shared marker, injected once via `ensureDefs`:

```js
function ensureDefs(svg){
  if (svg.querySelector('#td-ar')) return;
  const NS='http://www.w3.org/2000/svg';
  const defs=document.createElementNS(NS,'defs');
  defs.innerHTML = `<marker id="td-ar" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
    <path d="M0 0 L6 3 L0 6 Z" fill="context-stroke"/></marker>`;
  svg.prepend(defs);
}
```

`fill="context-stroke"` ties the arrowhead to the line's stroke (falls back to a resolved ink color where unsupported).

## Declarative wrapper

`<tech-figure>` is a light-DOM custom element (no shadow, per house style). It wraps one `<svg>`, scans for annotation markers in child markup, calls the core, then removes the markers. Authors write HTML; no imperative calls.

```html
<tech-figure aria-label="Thruster mount, dimensioned">
  <svg viewBox="0 0 520 330"> … author's part drawing … </svg>
  <dim x1="120" y1="60" x2="360" y2="60" value="240"></dim>
  <callout at="150,120" to="470,96" label="MOUNTING BOSS"></callout>
  <refnum at="150,120" to="478,96" n="1"></refnum>
  <scalebar x="600" y="300" steps="5" units="CM"></scalebar>
</tech-figure>
```

Lifecycle: `connectedCallback` → find `svg` → `ensureDefs` → for each marker call the matching core fn → markers removed. Idempotent (guard against double-upgrade). No teardown work needed beyond the standard (nothing observes).

## Coordinate model

- All inputs are **viewBox units**, never pixels. The author owns the `viewBox`; the kit never reads `getBoundingClientRect`.
- Callout/refNum take `at` (the point on the part) and `to` (where the label sits); the helper draws the leader `to → at`.
- `dimension` draws extension lines from the measured points out to an offset dimension line with arrowheads and a centered label.

## Accessibility

- `<tech-figure>` (or the `<svg>`) MUST carry `role="img"` and an `aria-label` summarizing the figure.
- Callout **labels are real `<text>`** — readable content, not decoration. Good.
- Dimension lines, hatching, arrowheads are decorative; mark the generated annotation group `aria-hidden="true"` except the callout/refnum text.
- Provide a visually-hidden parts list near the figure for screen-reader users (the same data as ref numerals).

## Files to add or edit

```text
tech-draw/                     # NEW small package (or under web-component-rnd)
  src/tech-draw.js             # functional core (this doc)
  src/tech-figure.js           # <tech-figure> light-DOM wrapper
  src/index.js                 # re-exports
  demos/figures.html           # console / bracket / blueprint strut figures
  test/tech-draw.spec.js       # core unit + upgrade tests
  custom-elements.json         # for <tech-figure>
  README.md
```

## Acceptance criteria

- [ ] `dimension`, `callout`, `refNum`, `scaleBar`, `titleBlock`, `sectionHatch`, `revFlag` each append correct SVG in viewBox units.
- [ ] Annotations read `--doc-ink`/`--doc-accent`, so the same figure draws black under `nasa` and white under `blueprint` with no code change.
- [ ] `<tech-figure>` upgrades declarative markers and is idempotent (no double-draw on re-connect).
- [ ] A composed figure scales with its container with **no** resize code.
- [ ] Arrowhead marker is injected once per SVG; figure has `role="img"` + `aria-label`.
- [ ] No runtime dependencies; helpers usable at build time (Node DOM shim) to emit static SVG.

## Clangs

- **`context-stroke` support varies.** Where unsupported, the arrowhead falls back to a resolved ink fill — acceptable, but test in the target engines.
- **Leaders can cross the part.** The kit draws straight `to → at`; it does not route around geometry. Authors place `to` to avoid crossings (same as real drafting).
- **Title block can be CSS instead.** For document-only contexts (vellum, blueprint) the corner title block is reproducible in pure CSS (a bordered grid). Use the SVG `titleBlock` only when it must live inside the drawing; otherwise prefer the CSS version from the document tier.
- **No auto-layout.** The kit does not pack callouts or avoid overlaps — it's a drafting aid, not a constraint solver. Deliberate.
