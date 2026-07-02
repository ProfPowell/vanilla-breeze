---
title: Kawaii Pack Refactor — Analysis & Plan
description: Slim the kawaii aesthetic pack (and memphis) the way the journal theme was built — CSS-only, Google-Fonts @import, shared effects — and consider leveraging bg-wc / border-wc.
status: proposed (handoff for a future session)
date: 2026-06-01
related:
  - admin/research/journal-theme/journal-theme.html        # the journal reference demo
  - src/packs/journal/journal.effects.css                  # the "v2" pack precedent (CSS-only, in-budget)
  - src/packs/kawaii/                                       # the pack this plan refactors
  - src/packs/memphis/                                      # parallel candidate (same issues)
---

# Kawaii Pack Refactor — Analysis & Plan

## Why this doc

While building the **journal** theme (token theme + recipe pack + showcase), the
**kawaii** pack was used as the structural precedent for the journal recipe
pack. Journal deliberately diverged from kawaii in ways that turned out cleaner
and lighter. This doc captures that comparison, answers three specific questions
about kawaii, and lays out a concrete refactor plan for a future session.

The north-star precedent is **`src/packs/journal/`**: a CSS-only pack, fonts
loaded via `@import` from the theme, tokens kept DRY in the on-demand theme
file, **13.5 KB / 3.3 KB gzip, in budget**.

## Current state of the kawaii pack

Files in `src/packs/kawaii/`:

| File | Role |
|------|------|
| `kawaii.theme.css` | tokens + `@font-face` (local woff2) + `@import` Nunito; `@layer bundle-theme` |
| `kawaii.effects.css` | CSS effects (`starburst`, `sparkle`, `bounce`, `wiggle`) via `data-effect~="…"`; `@layer bundle-effects` |
| `kawaii.effects.js` | one line: `import './effects/particles.js'` |
| `effects/particles.js` | 89-line floating-sparkle emitter (`VB.effect('particles', …)`) |
| `kawaii.bundle.js` | pack manifest (name/effects/tokenOverrides) |
| `fonts/CherryBombOne-Regular.woff2` (77 KB), `fonts/Coiny-Regular.woff2` (47 KB) | bundled display fonts |
| `kawaii.budget.json` | reports **`total_theme_kb: 368.98`, `font_bytes: 358240`, `within_theme_budget: false`** |

Build classifies it as an "aesthetic pack" (`scripts/build-cdn.js` → no
`kawaii.js`, so it builds `kawaii.theme.css` + `kawaii.effects.css` →
`kawaii.full.css`, plus the JS). It's a registered `PACK_THEME`
(`src/lib/theme-loader.js` `PACK_THEMES = {kawaii, memphis}`) and listed in
`src/lib/theme-data.js` `BUNDLE_THEMES`, so the loader also pulls its pack JS.

**Key fact:** the pack is *far* over the 50 KB theme budget, and the overage is
**almost entirely bundled fonts**. The actual JS surface is tiny — a single
effect.

## The three questions, answered

### 1. Does kawaii make sense as a pack?
**Yes, structurally** — tokens + CSS effects + a display font + one JS effect is
a legitimate aesthetic pack, and the pack format is the right home. **But it is
much heavier than it needs to be** (369 KB, over budget), entirely because it
self-hosts fonts. The journal pack proves the same shape can be ~13 KB and in
budget. So: keep it a pack, but slim it.

### 2. Can the JavaScript be handled by other things / bg-wc / border-wc?
The only JS is **`particles`** (`effects/particles.js`): a per-element emitter
that appends floating ✦✧⋆♡☆ glyph `<span>`s inside an element, animated by a CSS
keyframe on a `setInterval`, with a `prefers-reduced-motion` static fallback and
a `cleanup()`. (starburst/sparkle/bounce/wiggle are already pure CSS.)

- **It does not need bg-wc or border-wc — different shapes.**
  - `bg-wc` is a full-area **canvas/WebGL background layer behind content**
    (presets `sparks`, `confetti`, `stars`, `particles`). Great for a kawaii
    **hero/section sparkle background**, but a poor swap for a per-element inline
    flourish — you'd mount a canvas + web component on every decorated element
    (heavier, and semantically a background, not a fill scatter).
  - `border-wc` is an **edge/perimeter** effect (it has a `sparks` effect, but on
    the border). Kawaii's particles is an interior fill, not an edge — not a fit.
- **Best move: promote `particles` to VB's shared effects library.** It is
  already written against the generic `VB.effect()` API (not a kawaii-specific
  framework), and "floating particles" is reusable. Moving it to `src/effects/`
  (registered like `glitch`/`reveal`/`scramble` via `main.js`) makes
  `data-effect~="particles"` available to **any** theme and leaves the kawaii
  pack **CSS-only** — exactly the journal model.
- **Where bg-wc / border-wc *do* help kawaii** (enrichment, not replacement):
  a sparkly/confetti animated background via `<bg-wc preset="sparks|confetti">`,
  and cute scalloped/scooped edges via `<border-wc effect="scallop|scoop">`.
  These could replace bespoke kawaii CSS for those *specific* looks, but are
  additive capabilities — not substitutes for the inline-sparkle effect.

### 3. Are Cherry Bomb One / Coiny loadable from Google Fonts?
**Yes — both are open-source Google Fonts.** Verified live:
`https://fonts.googleapis.com/css2?family=Cherry+Bomb+One` and `…?family=Coiny`
both return `200` with `@font-face`. So kawaii can `@import` them (the journal
pattern with Shantell Sans / Newsreader / JetBrains Mono) and **delete the
bundled woff2**, removing the budget overage. (Nunito is already `@import`ed.)

**Tradeoff to decide:** self-hosted woff2 is privacy-friendly and works offline;
a Google `@import` adds a third-party request and a FOUT window. If self-hosting
is a hard requirement, the alternative is subsetting the woff2 (display fonts
used only for headings can be heavily subset) rather than dropping them.

## Recommended target ("kawaii v2", mirroring journal)

1. **CSS-only pack** — promote `particles` to a shared VB effect; kawaii keeps no
   pack JS (`kawaii.effects.js` / `effects/` removed; `bundle.js` `js: []`).
2. **Fonts via `@import`** from Google Fonts — drop `fonts/` and the local
   `@font-face` blocks; `kawaii.theme.css` `@import`s Cherry Bomb One + Coiny +
   Nunito. Brings the pack from 369 KB → within the 50 KB budget.
3. **Keep tokens DRY** — tokens live in `src/tokens/themes/_extreme-kawaii.css`
   (the on-demand theme); verify `kawaii.theme.css` isn't duplicating them
   (journal avoided this; kawaii currently keeps a pack copy — decide whether the
   pack `theme.css` should remain or be reduced to just the `@import`s).
4. **(Optional) Adopt bg-wc / border-wc** for the heavy flourishes (sparkle
   background, cute borders) instead of bespoke CSS/JS.

## Plan for a future session

> Run through the normal **brainstorm → spec → plan → subagent-driven build**
> flow (this doc is the brainstorm input). Work in `~/src/vanilla-breeze` in an
> isolated worktree off `origin/main`; the maintainer's working copy is usually
> on a `work/*` branch with dirty `dist/`, so do not disturb it.

### Phase 0 — Decide the open questions (with the maintainer)
- Self-host (subset) vs Google `@import` for Cherry Bomb One / Coiny.
- Promote `particles` to shared `src/effects/` (recommended) vs keep in pack.
- Whether to also adopt bg-wc/border-wc for kawaii flourishes (separate scope).

### Phase 1 — Promote `particles` to a shared effect
- Move `src/packs/kawaii/effects/particles.js` → `src/effects/particles.js`;
  fix the import to `../lib/vb.js` (it currently imports `../../../lib/vb.js`).
- Register it: add `import './effects/particles.js';` to the effects block in
  `src/main.js` (alongside `glitch`, `reveal`, `scramble`, … around lines 66–74)
  and wherever `main-autoload.js` wires effects.
- The keyframe `vb-kawaii-particle` injected by the effect should be renamed
  generic (e.g. `vb-particle`) since it's no longer kawaii-specific.
- Remove `kawaii.effects.js` and the `effects/` dir from the pack; set
  `js: []` in `kawaii.bundle.js` and drop `particles` from its `effects[]` (or
  re-point it to the shared effect). Remove `kawaii` from `PACK_THEMES` in
  `src/lib/theme-loader.js` **only if** it no longer ships pack JS (verify
  nothing else depends on the pack-JS path).
- Tests: a unit/behavior test for the generic `particles` effect (mirror an
  existing `src/effects/*` test), and confirm the four CSS effects still work.

### Phase 2 — De-bundle the fonts
- In `kawaii.theme.css`, replace the `@font-face` (local woff2) blocks with
  `@import url("https://fonts.googleapis.com/css2?family=Cherry+Bomb+One&family=Coiny&family=Nunito:wght@400..700&display=swap");`
  (one combined import is fine; match the journal pattern).
- Delete `src/packs/kawaii/fonts/`.
- Re-generate the budget: `npm run budget:themes` → confirm
  `src/packs/kawaii/kawaii.budget.json` now shows `within_theme_budget: true`
  and `font_bytes: 0`.
- (If self-hosting is chosen instead: subset the woff2 to the glyphs actually
  used and keep `@font-face` — but that won't reach 0 font bytes.)

### Phase 3 — Build, verify, publish
- `npm run build:cdn` → confirm `dist/cdn/packs/kawaii.full.css` rebuilt and
  smaller; `npm run lint:theme-tokens` → exit 0, no kawaii FAIL.
- Manually verify kawaii still renders (theme switcher → Kawaii) and the effects
  (`data-effect~="sparkle|bounce|wiggle|starburst|particles"`) work, incl.
  reduced-motion.
- Publish only the kawaii dist artifacts (the journal C plan's "publish only
  this theme's dist, discard other churn" approach) and the source changes.

### Phase 4 (optional) — bg-wc / border-wc enrichment
- Replace/augment the sparkle *background* with `<bg-wc preset="sparks">` or
  `confetti` on kawaii hero sections; cute borders with
  `<border-wc effect="scallop">`. Scope as its own spec — it's additive.

### Then: apply the same to **memphis**
`src/packs/memphis/` has the identical problem: `total_theme_kb: 69.3`,
`font_bytes: 70956`, `within_theme_budget: false`, and bundled `fonts/` +
`memphis.effects.js` / `memphis.bundle.js` (its `js_raw_bytes` reads 0 — verify
whether its JS is actually used or can be dropped). Same Phase 1–3 treatment;
check whether its display fonts are on Google Fonts before de-bundling.

## Risks / clangs

- **Google `@import` = third-party dependency + FOUT.** If VB has a no-3rd-party
  or offline requirement for shipped themes, prefer subsetting self-hosted woff2.
  (Note: journal already `@import`s from Google, so this precedent is set.)
- **`PACK_THEME` semantics.** If kawaii is de-JS'd, confirm the loader still
  loads its pack **CSS** correctly. Pack CSS is not auto-loaded by ThemeLoader —
  it's the theme tokens (`themes/kawaii.css`) that load on `data-theme`. Check
  how the kawaii *effects CSS* reaches the page today (full bundle import in
  `main-full.css`? explicit link? pack mechanism?) so the refactor doesn't drop it.
- **Don't double-count the budget.** `font_bytes: 358240` is larger than the two
  bundled woff2 on disk (~124 KB) — confirm what `theme-budget.js` is measuring
  before claiming a specific post-refactor size.
- **Keyframe/global-name collisions** when promoting `particles` (rename the
  injected `@keyframes` and the `<style id>` to non-kawaii names).
- **Theme-registration surface (lesson from journal):** a theme/pack must be
  wired in *six* places to be usable + visible — `scripts/build-cdn.js`,
  `site/data/themeRegistry.js`, `src/lib/theme-data.js`, `src/main-full.css`,
  `src/web-components/theme-picker/static.html`, `site/src/pages/docs/examples/index.html`.
  Don't drop any when touching kawaii.

## References
- Journal precedent (CSS-only, in-budget pack): `src/packs/journal/journal.effects.css`
- Journal specs/plans (in the bg-wc repo): `bg-wc/docs/superpowers/specs|plans/2026-05-31-journal-*`
- Shared effects pattern: `src/effects/*.js` registered in `src/main.js`
- Pack build: `scripts/build-cdn.js` (`buildPacks()`); budgets: `scripts/theme-budget.js` (`npm run budget:themes`)
- Theme loading: `src/lib/theme-loader.js`, `src/lib/theme-manager.js`, `src/lib/theme-data.js`
