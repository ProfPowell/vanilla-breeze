---
title: Technical Order — bg-wc Technical Surfaces
description: The drawing grounds for the engineering dialects — blueprint grid, vellum, phosphor, warm-white paper — extending the shared surface library.
author: handoff for Claude Code
date: 2026-05-29
tags:
  - bg-wc
  - surfaces
  - technical-order
---

# Technical Order — bg-wc Technical Surfaces

The dialects need grounds: the blueprint grid, vellum paper, the control-room phosphor grid, and the warm-white manual paper. These extend the surface library introduced in the washi handoff (`../washi-handoff/30-washi.bg-wc.md`) — same conventions, same canonical-token discipline. Build first; the document and drawing tiers sit on these.

## Table of contents

- [Surfaces](#surfaces)
- [Tokens](#tokens)
- [Sharing convention](#sharing-convention)
- [Files to add or edit](#files-to-add-or-edit)
- [Acceptance criteria](#acceptance-criteria)
- [Clangs](#clangs)

## Surfaces

Each is a `background` recipe, no JS. Add to `bg-wc` alongside `paper`/`dots`/`grid`/`lines`/`kraft` from the washi handoff.

| Surface | Dialect | Recipe (essence) |
|---------|---------|------------------|
| `paper-warm` | techorder, nasa | flat `--surface-paper` warm white + global grain overlay |
| `blueprint` | blueprint | Prussian-blue fill + **two** white grids: coarse 64px + fine 16px (low alpha) |
| `vellum` | vellum | warm tan fill + faint grain; optional very-faint ruled grid |
| `phosphor` | control | near-black fill + faint green grid 18px + a CRT scanline overlay |
| `datasheet` | datasheet | flat white; no pattern (the tables carry the look) |

```css
[data-surface="blueprint"]{
  background-color: var(--blueprint-bg, #15356b); color: var(--blueprint-ink, #eaf2ff);
  background-image:
    linear-gradient(var(--blueprint-ink) 1px, transparent 1px),
    linear-gradient(90deg, var(--blueprint-ink) 1px, transparent 1px),
    linear-gradient(var(--blueprint-ink) 1px, transparent 1px),
    linear-gradient(90deg, var(--blueprint-ink) 1px, transparent 1px);
  background-size: 64px 64px, 64px 64px, 16px 16px, 16px 16px;
  /* dim the grids — set ink to a low-alpha color or layer with opacity */
}

[data-surface="phosphor"]{
  background-color:#07100f; color: oklch(0.86 0.16 150);
  background-image:
    linear-gradient(oklch(0.86 0.16 150 / .05) 1px, transparent 1px),
    linear-gradient(90deg, oklch(0.86 0.16 150 / .05) 1px, transparent 1px);
  background-size: 18px 18px;
}
[data-surface="phosphor"]::after{   /* CRT scanline — decorative */
  content:""; position:absolute; inset:0; pointer-events:none;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,.25) 0 1px, transparent 1px 3px);
  mix-blend-mode: multiply;
}
```

> 📝 **Note:** The blueprint double-grid uses two stacked sizes (coarse + fine) at low alpha — that's the whole authenticity of the look. Keep the fine grid faint enough to read as paper texture, not as content.

## Tokens

```css
:root{
  --surface-paper: oklch(0.965 0.018 88);   /* warm white */
  --blueprint-bg:  #15356b;  --blueprint-ink: #eaf2ff;
  --vellum-bg:     oklch(0.9 0.04 92);
  --phosphor-bg:   #07100f;  --phosphor-ink: oklch(0.86 0.16 150);
}
```

These mirror the `--doc-bg`/`--doc-ink` values the document tier uses, so a surface and its dialect agree. Where both apply to the same element, the dialect token bundle wins (documents set their own `--doc-bg`); the surface is for full-bleed page grounds behind documents/figures.

## Sharing convention

Same as the washi handoff: pattern primitives are canonical in `vanilla-breeze` (`patterns.css`); `bg-wc` embeds a copy with the sync header. The blueprint/phosphor grids are surface-specific and live in `bg-wc`'s `surfaces.css`. Do not duplicate the dot/stripe primitives — reference `--pattern-*`.

## Files to add or edit

```text
bg-wc/
  src/surfaces.css        # EDIT — add paper-warm, blueprint, vellum, phosphor, datasheet
  src/<registry>.*        # register new surfaces if bg-wc uses a registry
  demos/surfaces.html     # EDIT — add the technical grounds
```

## Acceptance criteria

- [ ] `data-surface="blueprint"` renders the coarse+fine white grid on Prussian blue.
- [ ] `data-surface="phosphor"` renders the green grid + scanline; scanline is decorative and `pointer-events:none`.
- [ ] `vellum`/`paper-warm` read warm and carry the global grain.
- [ ] Surfaces reuse `--pattern-*` where applicable; no duplicated primitives.
- [ ] No JS for any surface.

## Clangs

- **Scanline + `prefers-reduced-motion` is fine (it's static)** but scanline over text reduces contrast on `phosphor`; keep it subtle and never behind long-form body copy.
- **Blueprint grid tiles from origin**, so it won't register across separately-padded elements — acceptable for a ground, noted for anyone expecting alignment.
- **Grain overlay stacks with the document grain.** If a document `.doc` sits on a grained surface, you get double grain; have the document tier suppress the surface grain inside `.doc` (solid `--doc-bg`).
