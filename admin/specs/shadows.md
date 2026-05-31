---
title: Shadows — vanilla-breeze Token + Effects Layer (as built)
description: Why shadows are tokens, not a web component, and the elevation ramp + data-shadow effects that shipped. This records the as-built system; user-facing docs live at /docs/concepts/shadows/.
author: handoff for Claude Code
date: 2026-05-30
status: as-built
tags:
  - vanilla-breeze
  - shadows
  - tokens
  - decorated-layers
---

# Shadows — vanilla-breeze Token + Effects Layer

This started as a design question — **should there be a `shadow-wc`?** No. Shadows have no runtime behaviour to encapsulate, so a web component adds lifecycle cost for zero payoff. They ship as a **token + utility layer** instead. That conclusion was already true of VB (shadows were tokens), so the build was a *trimmed* version of the original exploration. This document records what actually shipped and corrects the early draft's mismatches with the codebase.

> 💡 **Canonical reference:** the user-facing docs are at [`/docs/concepts/shadows/`](../../site/src/pages/docs/concepts/shadows.html). This spec is the rationale + where-things-live record.

## Table of contents

- [Why not a web component](#why-not-a-web-component)
- [What shipped](#what-shipped)
- [Elevation scale](#elevation-scale)
- [The data-shadow effects](#the-data-shadow-effects)
- [box-shadow vs drop-shadow](#box-shadow-vs-drop-shadow)
- [Presets are themes, not element attributes](#presets-are-themes-not-element-attributes)
- [Files](#files)
- [What was cut from the original draft](#what-was-cut-from-the-original-draft)
- [Acceptance](#acceptance)
- [Clangs](#clangs)

## Why not a web component

`border-wc` earns its JS: SVG/canvas overlays, perimeter geometry, `offset-path` animation, `ResizeObserver` refitting, teardown. Run the same test on shadows:

| Capability a WC provides | Does a shadow need it? |
|--------------------------|------------------------|
| DOM overlay / SVG / canvas | No — `box-shadow`/`drop-shadow`/`text-shadow` paint with the box |
| Perimeter geometry | No — shadows auto-derive from the box |
| Resize refitting | No — shadows scale with the element automatically |
| Per-frame animation | No — the few animated cases are CSS `@keyframes`/`transition` |
| Teardown of injected nodes | No — there are no nodes |

Every effect is a static CSS declaration. A custom element would wrap *nothing*. Shadows are a **value system**, and CSS custom properties are the right primitive.

> 💡 **Tip:** Keep the Decorated Layers mental model — surface (`bg-wc`) · edge (`border-wc`) · **depth (vanilla-breeze tokens + `data-shadow`)**. The depth layer just happens to need no component.

## What shipped

1. A **realism upgrade** to the elevation ramp (`--shadow-lg/xl/2xl` enriched to layered, multi-stop shadows, in place).
2. A **`data-shadow` effects layer** — `tint`, `material`, `shape`, `glow` (with an optional gated `flicker`).
3. A **demo** and a **concept doc**.

## Elevation scale

The scale already existed in `src/tokens/shadows.css` as a t-shirt ramp. The realism upgrade enriched the **upper steps in place** so the default theme reads with real depth, while keeping the low steps (xs/sm/md, ~58 consumers) unchanged. The file uses `oklch` to match the themes.

```css
/* src/tokens/shadows.css — low steps unchanged, high steps layered */
--shadow-xs:  0 1px 2px 0 oklch(0 0 0 / 0.05);
--shadow-md:  0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -2px oklch(0 0 0 / 0.1);
--shadow-2xl: 0 1px 2px 0 oklch(0 0 0 / 0.05),
              0 4px 8px -2px oklch(0 0 0 / 0.06),
              0 10px 20px -4px oklch(0 0 0 / 0.08),
              0 20px 36px -8px oklch(0 0 0 / 0.11),
              0 34px 58px -12px oklch(0 0 0 / 0.14);
```

The numeric aliases `--shadow-1`…`--shadow-6` map onto the t-shirt names for Open Props compatibility and are left untouched.

> 🚨 **Do not** add a separate `--shadow-1..6` "photographic" ramp (as the original draft proposed). Those names already exist as aliases, so a parallel definition collides; and they have **zero consumers**, so there is nothing to gain. Enrich the t-shirt tokens in place instead — every `var(--shadow-lg/xl/2xl)` consumer benefits automatically. Themes override these tokens, so per-pack shadow languages (brutalist, clay, neumorphism, …) are unaffected.

## The data-shadow effects

Opt-in, composable, theme-aware — the depth-layer sibling of `data-border-effect`. Space-separated tokens on `[data-shadow~="…"]`.

| Token | Essence |
|-------|---------|
| `tint` | Luminous drop shadow from `--color-accent` via `color-mix` (≥ ~50% transparent so the hue survives busy backgrounds). Re-tints with the theme. |
| `material` | Rests at `--shadow-md`, raises to `--shadow-xl` + `translateY(-4px)` on `:hover`/`:focus-visible`. Reduced-motion drops the lift/transition, keeps the elevation feedback. |
| `shape` | `filter: drop-shadow()` — alpha-true, not the border-box rectangle. Apply directly to a transparent PNG/SVG/text; for a `clip-path` shape apply it to a **wrapper** (see clangs). |
| `glow` | Soft accent halo. Static by default; add `flicker` for a pulse gated behind `prefers-reduced-motion: no-preference`. |

```css
/* src/tokens/extensions/shadow-effects.css */
@layer bundle-effects {
  [data-shadow~="tint"] {
    box-shadow:
      0 10px 26px color-mix(in oklch, var(--color-accent), transparent 55%),
      0 3px 7px   color-mix(in oklch, var(--color-accent), transparent 66%);
  }
  [data-shadow~="material"] { box-shadow: var(--shadow-md); transition: box-shadow .25s, transform .25s; }
  [data-shadow~="material"]:hover { box-shadow: var(--shadow-xl); transform: translateY(-4px); }
  [data-shadow~="shape"] { filter: drop-shadow(0 4px 6px oklch(0 0 0 / 0.34)); }
}
```

> ⚠️ **Layer wiring matters.** The effects file declares `@layer bundle-effects` internally and is imported at the **top level** of `src/main.css` and `src/main-core.css` (beside `animated-borders-effects.css`) — **not** via a `layer(tokens)` import. That puts the rules in the top-level `bundle-effects` layer so an opt-in effect wins over a component's own `box-shadow`, and lets the `@keyframes` register globally.

> ⚠️ Use the VB token names: `--color-accent`, `--color-surface` — **not** `--accent` / `--surface` (which don't exist and would silently fall back to a hardcoded default, breaking theme-awareness).

## box-shadow vs drop-shadow

The single most useful thing to teach. `box-shadow` paints the **border-box** (always a rectangle); `filter: drop-shadow()` paints the element's **alpha** (follows a `clip-path`, transparent PNG, SVG, or text). Authors reach for `box-shadow` on a clipped shape and get a rectangle — the `shape` effect exists to make the right tool a one-attribute opt-in.

## Presets are themes, not element attributes

The original draft proposed `neumorphism` and `clay` as per-element `data-shadow` presets. **These already ship as full themes** — `_extreme-neumorphism.css` and `_extreme-claymorphism.css` — and were intentionally **not** re-shipped as element attributes. Reason: soft-UI only reads correctly when `--surface` matches the page behind it, which a theme controls globally but a per-element attribute cannot guarantee (the original draft's own "neumorphism needs surface match" clang). `material` was kept as an element effect because it is theme-agnostic; `neumorphism`/`clay` belong to the theme system.

## Files

```text
src/tokens/shadows.css                         # elevation ramp (tokens layer) — realism upgrade
src/tokens/extensions/shadow-effects.css       # NEW — data-shadow rules (@layer bundle-effects)
src/main.css, src/main-core.css                # @import shadow-effects.css at TOP LEVEL
demos/examples/demos/shadows.html              # NEW — ramp + effects demo
site/src/pages/docs/concepts/shadows.html      # NEW — concept doc (canonical user docs)
site/src/pages/docs/concepts/index.html        # + Shadows card
```

## What was cut from the original draft

- **`--shadow-1..6` ramp** — collides with the existing aliases (see above); cut.
- **`neumorphism` / `clay` element-presets** — already themes; cut.
- **`.elevation-1..6` utility classes** — VB favours tokens + `data-*`; the realism upgrade to the tokens delivers the same quality everywhere, so no class utilities were added.

## Acceptance

- [x] `--shadow-lg/xl/2xl` are layered ramps; `xs/sm/md` unchanged; `--shadow-1..6` aliases intact.
- [x] `data-shadow="tint"` derives from `--color-accent` and re-tints when it changes.
- [x] `material` raises on hover; `shape` uses `drop-shadow`; `glow` flicker gated by `prefers-reduced-motion`.
- [x] Effect rules land in `@layer bundle-effects`. No JavaScript, no custom element.

## Clangs

- **Neumorphism needs surface match.** It only reads as soft-UI when `--surface` equals the page behind it — which is exactly why it stayed a theme, not an element attribute.
- **Tinted shadows can muddy on busy backgrounds.** `color-mix` transparency over a textured surface loses the hue; keep transparency ≥ ~50%.
- **`clip-path` clips its own `drop-shadow`.** `clip-path` is applied *after* the filter in the render pipeline, so a `filter: drop-shadow()` on the same clipped element gets cut away (the shape shows no shadow). Apply `data-shadow="shape"` to a **wrapper** of the clipped element. Transparent PNG/SVG/text carry intrinsic alpha and take it directly. (This was a real bug in the first demo/doc draft.)
- **`drop-shadow` and an SVG-overlay border don't compose.** A `clip-path`'d element has no border box for an overlay to stroke — shape-shadow and border-wc overlays are mutually exclusive.
