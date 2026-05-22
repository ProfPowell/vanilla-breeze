# CodyHouse Scroll Effects → VB Coverage Audit

**Date:** 2026-05-22
**Beads:** vanilla-breeze-b238
**Status:** Coverage matrix + recommendation

## TL;DR

VB has **broad coverage** for CodyHouse's scroll-effect territory. The IntersectionObserver-based `data-trigger="scroll"` + the `data-effect` slot system + `data-parallax`, `data-scroll-hide`, `data-sticky`, and `<reading-progress>` collectively cover ~all of CodyHouse's named scroll-effect components.

The one **substantive capability gap** is **CSS scroll-driven animation timelines** (`animation-timeline: view()` / `scroll()`). VB's current scroll trigger is binary (fires once on intersection); it can't do *continuous* scroll-linked animations (e.g. a section that fades in proportionally to scroll position). Modern Chromium browsers ship this natively now; it would be a clean declarative add via a new `data-trigger` value.

The remaining gaps are **doc-recipes** for specific composition patterns CodyHouse ships as templates: sticky hero with scale, pinned card stack, scroll-down indicator, horizontal scroll section.

## Methodology

- WebFetched CodyHouse `/ds/components/effects/scroll` and sitemap.xml.
- The Effects > Scroll subcategory (13 components) is mostly Pro and lazy-loaded — individual component names did not enumerate cleanly. Sitemap surfaced the canonical scroll-related URL pool (smooth-scrolling, parallax-image, sticky-hero, sticky-sharebar, sticky-headers-table, reading-progressbar, reveal-effects, revealing-hero, hiding-navigation, plus variants).
- Cross-referenced against `src/effects/`, `src/packs/effects/`, `src/lib/vb-triggers.js`, `src/utils/scroll-hide-init.js`, `src/custom-elements/layout-attributes.css` (parallax), `src/web-components/reading-progress/`, and `site/src/pages/docs/attributes/data-effect.html`.

## VB's scroll-effect surface today

### Trigger system (`src/lib/vb-triggers.js`)

Binary triggers that flip `data-effect-active` on/off:

| Trigger | Behavior |
|---|---|
| `data-trigger="scroll"` | IntersectionObserver, fires once at 10% intersection. |
| `data-trigger="intersect"` | Alias of `scroll` (fires once). |
| `data-trigger="intersect:once"` | Explicit one-shot. |
| `data-trigger="intersect:toggle"` | Toggles on enter / leave — bridges entrance and continuous decoration. |
| `data-trigger="hover"` / `click` / `time:N` / `media:(...)` / `event:NAME` / `vt` | Non-scroll triggers. |

Honors `prefers-reduced-motion` (activates immediately, skips the animation).

### `data-effect` catalog organized by slot

| Slot | Effects |
|---|---|
| entrance | `fade-in`, `slide-up`, `slide-in`, `pop`, `shadow`, `blur-reveal`, `reveal` (word-by-word), `scramble`, `typewriter` |
| attention | `shake`, `pulse`, `bounce`, `blink` |
| decoration | `neon`, `outline.glow`, `text-3d.animate`, `rainbow`, `gradient-text.animate`, `shimmer`, `glow`, `float`, `glitch`, `sparkle`, `starburst`, `wiggle` |
| exit | `fade-out`, `collapse`, `slide-out` |

Plus pack-specific decorations (memphis, kawaii). `data-stagger` distributes effects across children with per-child delays. Lifecycle hooks (`VB.onPhaseEnd`) chain effects.

### Dedicated scroll primitives

| Feature | Where |
|---|---|
| **Parallax** (section-local transform-only depth) | `data-parallax` + `data-parallax-group` (`src/custom-elements/layout-attributes.css`). Demo: `parallax-hero.html`. |
| **Scroll-hide header** | `header[data-scroll-hide]` with hysteresis (`src/utils/scroll-hide-init.js`). |
| **Sticky header / footer / table** | `header[data-sticky]`, `footer[data-sticky]`, `table[data-sticky="header|column|both"]`. |
| **Reading progress** | `<reading-progress>` component. |
| **Stagger** | `data-stagger="<delay>"` on a parent. |
| **View Transitions** | `data-trigger="vt"` + the `data-transition` system; entrance effects defer until VT commits. |

## Coverage matrix (CodyHouse → VB)

CodyHouse scroll components found via sitemap + the Effects > Scroll subcategory (13 components, mostly Pro variants of these themes):

| CodyHouse | VB equivalent | Status |
|---|---|---|
| smooth-scrolling | native CSS `scroll-behavior: smooth` | Covered (platform). |
| parallax-image | `data-parallax` + `data-parallax-group` | Covered. |
| sticky-hero | `data-sticky` + CSS composition | Covered (no canonical "sticky hero" recipe doc though). |
| sticky-hero --scale | `data-sticky` + would need scroll-driven scale | **Partial.** Best done with `animation-timeline: view()`. |
| sticky-hero --overlay-layer | Layering + sticky | Covered by composition (no recipe). |
| sticky-sharebar | `position: sticky` recipe | Covered by composition (no canonical recipe). |
| sticky-headers-table | `table[data-sticky="header"]` | Covered. |
| reading-progressbar | `<reading-progress>` | Covered. |
| reveal-effects | `data-effect="reveal\|fade-in\|slide-up\|…"` + `data-trigger="scroll"` | Covered, with depth. |
| revealing-hero | composition of entrance effects | Covered by composition. |
| hiding-navigation | `header[data-scroll-hide]` | Covered. |
| hiding-navigation --sub-nav | composition | Covered by composition. |
| hiding-navigation --fixed | `position: fixed` + `data-scroll-hide` | Covered by composition. |
| Cards scrolling / overscroll gallery (Pro) | `<carousel-wc>` + `layout-reel` + scroll-snap | **Partial.** Lacks a canonical "pinned card stack" recipe. |
| Scroll-driven animations (Pro) | `data-trigger="scroll"` fires once; no continuous | **Real gap.** See below. |
| Scroll-down indicator (animated chevron) | — | **Minor gap.** CSS recipe, not a primitive. |

## What's missing — and worth building

### 1. CSS scroll-driven animation timelines (substantive)

VB's `data-trigger="scroll"` is binary — it fires once at 10% intersection and activates the effect. There's no way to drive an animation *proportionally* to scroll position or viewport entry/exit progress.

Modern CSS now ships `animation-timeline: view()` and `animation-timeline: scroll()`, which let any CSS animation be driven by scroll progress declaratively, without IntersectionObserver or rAF. Chromium-stable since 115; Safari 26 (partial); Firefox behind a flag.

Adding a new trigger value such as `data-trigger="view-progress"` (and optional companions `view-progress:cover`, `view-progress:entry`, `view-progress:exit`) would extend the effect system into continuous scroll-driven territory without a behavior break in any existing usage. Effects in the `entrance` and `decoration` slots compose naturally: a `fade-in` driven by `view()` becomes a continuous fade-in proportional to entry progress; a `float` driven by `scroll()` becomes a scroll-linked drift.

Implementation skeleton (no JS — pure CSS layer):

```css
[data-effect][data-trigger~="view-progress"] {
  animation-timeline: view();
  animation-range: entry 0% cover 50%;
  /* The effects keep their own keyframes; the timeline replaces the timer */
}

[data-effect][data-trigger~="scroll-progress"] {
  animation-timeline: scroll();
}
```

A `@supports (animation-timeline: view())` guard plus the existing `prefers-reduced-motion` rule keeps the fallback graceful — older browsers see the IntersectionObserver-driven trigger (which still fires) and the entrance plays normally; newer browsers get the continuous version.

This is a **medium-effort, high-value** add. Filed as `vb-XXXX` below.

### 2. Doc-recipes for composition patterns CodyHouse templates

Patterns achievable with existing VB primitives but without a canonical recipe page:

- **Scroll-down indicator** — animated chevron with a `bounce` decoration; CSS-only.
- **Sticky hero with scale-out** — sticky section that scales/fades as it exits; ideal candidate for the scroll-driven timeline above.
- **Pinned card stack** (Apple-style) — sticky cards that stack and offset on scroll.
- **Horizontal scroll section** — sticky vertical container with horizontal-translate child driven by scroll progress.
- **Sticky share bar** — `position: sticky` + offset composition.
- **Revealing hero** — entrance effect composition recipe.

These bundle into one "scroll recipes" doc PR. Low effort.

### 3. Pack-level scroll catalog page

The data-effect doc page covers slots, lifecycle, and individual effects, but doesn't have a section that specifically catalogs scroll-driven combos (e.g. "all entrance effects work with scroll trigger; here's the gallery"). One screenshot-able demo page that walks through every entrance effect under `data-trigger="scroll"` would close a discoverability gap rather than a capability one.

## What's *not* worth building

- **A scroll-jacking framework** (lock scroll while running an animation): CodyHouse's "overscroll gallery" and some Pro components do this. It's hostile to readers, fights browser scroll physics, and breaks accessibility. Skip.
- **Reimplementing `position: sticky` as a JS component.** Native CSS is fine.
- **Smooth-scroll JS.** `scroll-behavior: smooth` covers it; `scroll-padding-top` handles header offset.

## Recommended follow-ups (file as new beads if pursued)

1. **P2 — `vb-8zc6` — Add CSS scroll-driven timeline support to `data-trigger`.** New trigger values (`view-progress`, `scroll-progress`) layered over the existing `data-effect` slot system via CSS, with `@supports` guard and reduced-motion fallback. Demos for `fade-in`, `slide-up`, `blur-reveal`, `float` under the new trigger. Update `data-trigger` doc.
2. **P3 — `vb-i4uw` — Scroll-recipes doc bundle.** Single PR adding `/docs/patterns/scroll/` (or extending `/docs/patterns/feedback/` peer) with five recipes: scroll-down indicator, sticky hero, pinned card stack, horizontal scroll section, sticky share bar. Each gets a `<browser-window>` demo.
3. **P4 — `vb-acz9` — Scroll-effect gallery demo.** Single demo page exercising every entrance effect under `data-trigger="scroll"`, linked from the data-effect doc.

## Methodology caveats

- CodyHouse's Effects > Scroll page (13 components) is mostly Pro and didn't enumerate individually via WebFetch. The coverage matrix is based on the sitemap-exposed scroll-related URLs (which are app-template versions of the same patterns) plus public Pro names I could glean from the index page ("Cards Scrolling Effects", "Scrolling Animations", "Overscroll Gallery").
- I did not enumerate the 13 individual Pro components inside `effects/scroll/`. If a deeper per-component dive is wanted later, the right approach is targeted: scrape the Pro tier individually or proxy-fetch each component URL. Given CodyHouse's pattern of versioned variants (Steps v3, Feature v20), the 13 are likely 4–5 distinct techniques with multiple stylistic variants, all reducible to the patterns covered above.
