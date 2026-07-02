---
title: Technical Order — Theme Family Handoff
description: Architecture, dialects, layer split, and build order for the drafting/engineering design-world family across vanilla-breeze, bg-wc, and the tech-draw kit.
author: handoff for Claude Code
date: 2026-05-29
tags:
  - design-worlds
  - technical-order
  - vanilla-breeze
  - bg-wc
  - tech-draw
---

# Technical Order — Theme Family Handoff

A **design-world family** drawn from drafting and engineering graphics: the technical manual, the blueprint, the patent figure, the datasheet — and their text counterparts: memos, docs pages, RFCs, changelogs, status reports. The thesis: these are **one shared vocabulary retuned by token**, not a pile of skins. Read this before touching code; it sets the split the other docs assume.

Hand these to Claude Code in [build order](#build-order). Each component doc is self-contained with its own acceptance criteria.

## Table of contents

- [The thesis](#the-thesis)
- [Dialects](#dialects)
- [The shared vocabulary](#the-shared-vocabulary)
- [Layer split](#layer-split)
- [Two axes: documents vs drawings](#two-axes-documents-vs-drawings)
- [Build order](#build-order)
- [Global acceptance criteria](#global-acceptance-criteria)
- [Clangs](#clangs)
- [Sources & IP](#sources--ip)
- [Component docs](#component-docs)

## The thesis

One component set — document band, leader callout, dimension line, dot-leader list, title block, numbered article, conformance table — rendered through different **dialects**. `data-theme="blueprint"` and `data-theme="techorder"` swap color, type, and line treatment; the widgets are identical. Ship a *family*, not six bespoke themes. This is also the most *useful* retro direction: dashboards, monitoring, docs, changelogs, and status pages are real software surfaces.

## Dialects

Each dialect is a token bundle (color + a type axis). Live in vanilla-breeze theme bundles (lazy-loaded, per the existing theming architecture).

| Dialect | `data-theme` | Color | Type axis (demo subs) | Use |
|---------|--------------|-------|------------------------|-----|
| Technical Order | `techorder` | ink on warm white + spec swatches | wide Eurostile (Michroma) + OCR (Share Tech Mono) | manuals, memos, docs |
| Engineering Manual | `nasa` | black on white, restrained | grotesque (Archivo) + OCR | dimensioned drawings, specs |
| Blueprint | `blueprint` | white line on Prussian blue | OCR/mono throughout | reprographic drawings |
| Patent | `patent` | black line on bond | plain caps + numerals | figures, claims |
| Vellum | `vellum` | graphite on warm tan | condensed (Saira) + mono | drafting-table sketches |
| Datasheet | `datasheet` | dense black on white | grotesque + mono | component specs, pinouts |
| Control Room | `control` | phosphor green on black | mono, glow | status pages, incidents |

> ⚠️ **Type is load-bearing and partly unfree.** Eurostile/Microgramma and OCR-A carry the identity; the demo substitutes Michroma + Share Tech Mono (good, not exact). Each bundle needs a documented font axis with licensed or near-match fallbacks, hosted by the variable-font/lazy-bundle theming system.

## The shared vocabulary

Twelve widgets cover both the drawings and the documents. Note which tier owns each.

| Widget | Tier | Used by |
|--------|------|---------|
| Document-control band (TM no · title · authenticated date · TO code) | CSS | all docs |
| Ruled metadata grid (TO/FROM/REV/SHEET) | CSS | memo, manual header |
| Numbered article / clause | CSS | docs page, RFC |
| Marginal note (sidenote) | CSS | docs page |
| Dot-leader list | CSS | particulars, index, distribution |
| Conformance table / ruled table | CSS | RFC, datasheet |
| Stamp (ROUTINE / DRAFT) | CSS | memo, RFC |
| Revision mark (△ / tag) | CSS | changelog, blueprint |
| Spec / material key (swatch + code) | CSS | technical order |
| Leader callout (label + line → point) | SVG (kit) | drawings |
| Dimension line (extension + arrows + value) | SVG (kit) | drawings |
| Title block (corner grid) | SVG **or** CSS | drawings, drafting |

## Layer split

| Concern | Package | Tier | Why here |
|---------|---------|------|----------|
| Dialect color/type bundles | **vanilla-breeze** | theme bundles (lazy) | existing theme architecture |
| Document components + shared doc chrome | **vanilla-breeze** | CSS | pure CSS; no runtime |
| Technical surfaces (blueprint grid, vellum, phosphor) | **bg-wc** | CSS tokens | extends the surface library |
| Drawing helpers (callout, dimension, title block, ref-num, scale bar, hatch, rev-flag) | **tech-draw** | static SVG generators | author-time SVG fragments; no runtime observers |

## Two axes: documents vs drawings

The family has two halves with very different cost:

- **Documents are pure CSS.** Memo, docs page, RFC, changelog, index, incident — band, meta grid, numbered articles, conformance table, dot leaders, float sidenotes, stamps. No SVG, no JS. Cheap; ship first.
- **Drawings are static SVG.** Callouts, dimensions, title blocks, reference numerals. Authored in the SVG's `viewBox` space, so the whole figure scales as a unit — **no `ResizeObserver`, no per-frame work, optionally build-time.** The kit is fragment-generators, not a runtime engine.

> 💡 **Tip:** Both halves are intentionally near-zero-JS. That's the platform-first win — say so in the docs. The only code is small SVG-fragment helpers that can even run at build time.

## Build order

1. **bg-wc — technical surfaces** ([`30-tech-surfaces.bg-wc.md`](./30-tech-surfaces.bg-wc.md)). Extends the washi-handoff surfaces with blueprint grid, vellum, phosphor. Dialects need their grounds first.
2. **vanilla-breeze — dialect tokens + document tier** ([`10-tech-doc.vanilla-breeze.md`](./10-tech-doc.vanilla-breeze.md)). The big, cheap deliverable: theme bundles + the memo/article/RFC/changelog/index/incident components and shared chrome.
3. **tech-draw — drawing kit** ([`20-tech-draw.kit.md`](./20-tech-draw.kit.md)). Callout/dimension/title-block/ref-num/scale-bar helpers for figures.

## Global acceptance criteria

- [ ] A docs page renders with **zero JS**: band, numbered articles, float sidenotes, dot-leader footer.
- [ ] Switching `data-theme` from `techorder` to `blueprint` retones the **same** document markup (color + type + line treatment) with no markup change.
- [ ] The Incident Report renders identical widgets (severity, timeline, lamps) under `control` that the manual uses under `techorder` — proving theming, not duplication.
- [ ] A figure composed with the tech-draw kit scales with its container without script (viewBox space).
- [ ] Sidenotes collapse to inline notes below a breakpoint (no overlap on narrow screens).
- [ ] No new runtime dependencies. Pure web platform.

## Clangs

- **Sidenote floats collide.** Two marginal notes near the same line overlap. The component MUST fall back to inline footnotes below ~640px and SHOULD detect crowding. Stated in the tech-doc doc.
- **Custom elements inside `<svg>` are unreliable.** The kit appends standard SVG elements via a functional core, not autonomous custom elements nested in SVG. See the kit doc.
- **Drawings need text alternatives.** Callout labels are real text (good); the figure still needs `role="img"` + `aria-label`. Dimensions are decorative.
- **Font substitution shifts metrics.** Eurostile vs Michroma differ in width; titles tuned to one may reflow in the other. Set width/letter-spacing per bundle.
- **`control` dialect is dark + glowing.** Don't reuse light-dialect shadow tokens there; phosphor uses text-shadow glow, not drop shadows.

## Sources & IP

Drawings, part numbers, agency names, and document text are **original**. The Technical Order dialect is an homage to the drafting style of Franz Joseph's *Star Fleet Technical Manual* (1975) and to NASA/mil-spec engineering graphics — an influence credit, **not** a reproduction. Do not paste the *Articles of Federation* text or the manual's drawings into any artifact.

## Component docs

- [Technical surfaces (bg-wc)](./30-tech-surfaces.bg-wc.md)
- [Dialect tokens + document tier (vanilla-breeze)](./10-tech-doc.vanilla-breeze.md)
- [Drawing kit (tech-draw)](./20-tech-draw.kit.md)
- See also the washi family: `../washi-handoff/00-WASHI-HANDOFF.md` (shares the bg-wc surface library and the canonical-token convention).
