# View Transitions (Current Status + Gaps)

This replaces `view-transitions-roadmap.md` with an implementation-accurate snapshot of what Vanilla Breeze currently does.

## Current Status

## 1) Core building blocks are in place

- `src/utils/view-transitions.css` provides cross-document View Transitions (`@view-transition { navigation: auto; }`), named regions (`data-vt`), shared-element naming helpers (`data-vt-name`), and preset animation classes (`data-vt-class`).
- `src/utils/view-transition-init.js` auto-assigns `style.viewTransitionName` from `data-vt-name` and observes dynamically-added nodes.
- `src/utils/swap-transition.js` is a shared helper that wraps DOM mutations in `document.startViewTransition()` when supported, and falls back to direct mutation when not.

## 2) Same-document VT is already implemented in components

This is no longer just R&D.

- `content-swap`
  - Uses `startSwapTransition()` around state changes.
  - Assigns unique `view-transition-name` per instance.
  - Keeps CSS transition effects as baseline behavior.
- `tab-set`
  - `data-transition="fade|slide|scale"` enables VT panel switching.
  - Uses directional animation via `data-vt-direction` on `:root`.
  - Falls back to instant switch when VT is unavailable.
- `accordion-wc`
  - `data-transition="fade|slide|scale"` enables VT on open/close.
  - Composes with native `::details-content` height animation.
  - Falls back to native details behavior.
- `carousel-wc`
  - `data-transition="fade|slide|scale"` switches from scroll-snap mode to stacked-grid VT mode.
  - Uses directional animation state for prev/next navigation.
  - Falls back to scroll-snap carousel behavior.

## 3) Cross-document VT is opt-in (not global default)

- Cross-document transitions are enabled by importing `utils/view-transitions.css`.
- Core bundle CSS (`src/main.css`) does not import this file by default.
- The docs site currently wires it conditionally via site config (`site.viewTransitionsCss`), rather than treating it as always-on core behavior.

## Roadmap Check vs Previous File

The old roadmap said:
- same-document VT was not used yet
- tabs/accordion/carousel were future candidates

That is now outdated. Those component-level same-document implementations are already present.

## What Is Missing / Needs Cleanup

## 1) Shared animation dependency is implicit

Component VT styles (`tab-set`, `accordion-wc`, `carousel-wc`) reference shared keyframe names (`vt-fade-in`, `vt-slide-in-left`, etc.) that are defined in `utils/view-transitions.css`.

Implication:
- If a consumer uses component `data-transition` features but does not also include `utils/view-transitions.css`, VT keyframe animation behavior may be incomplete.

## 2) Docs are not fully synchronized

- `docs/attributes/view-transitions` still frames same-document usage mostly as manual SPA API usage, while components now provide built-in same-document VT enhancements.
- Browser support messaging is inconsistent across docs pages (some pages mention Firefox support levels, one table still says pending).
- `content-swap` docs do not clearly call out that state changes are already wrapped in same-document VT when supported.

## 3) No explicit test coverage for VT pathways

- There is no clear automated test coverage for:
  - VT-enabled branch behavior
  - unsupported-browser fallback behavior
  - reduced-motion behavior with VT + component-specific transitions

## 4) No single “VT contract” doc for component authors

- There is no central internal guide for:
  - naming strategy for `view-transition-name`
  - when to use `view-transition-class`
  - direction-state conventions (`data-vt-direction`)
  - fallback requirements

## Recommended Next Steps

1. Decide whether shared VT keyframes live in core component styles or remain in `utils/view-transitions.css` with explicit dependency docs.
2. Update docs to reflect current reality: same-document VT is already integrated in multiple components.
3. Align browser support statements across all VT docs.
4. Add a small test matrix for supported/unsupported/reduced-motion paths.
5. Add a concise contributor guideline for implementing VT in future components.
