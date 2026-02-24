# Themes (Current Status + Future Ideas)

This replaces the older notes in `theme-enhancement.md` and `theme-futures.md` with a current snapshot of what Vanilla Breeze themes already do and what is still worth building.

## Current Status (as of February 24, 2026)

### 1) Theme architecture is already broad and production-grade

- Token-first theme system (OKLCH-based colors, semantic color tokens, typography/shape/shadow/motion tokens).
- `data-theme` supports space-separated composition (for example: `forest a11y-high-contrast`).
- `data-mode="light|dark"` plus `auto` mode via system preference.
- Smooth hue transitions via CSS `@property` on `--hue-*`.
- `ThemeManager` handles persistence, mode/theme application, fluid mode, border style and icon hints, and emits `theme-change`.

### 2) Theme catalog is much larger than the old notes assumed

- Registry currently defines 55 selectable themes:
- 11 `color` entries (including `default`).
- 3 `personality` entries.
- 38 `extreme` entries.
- 3 `accessibility` entries.
- Decorative themes are externalized for the core bundle:
- 51 individual CSS files (10 accent color + 3 personality + 38 extreme) built to `dist/cdn/themes/*.css`.
- `theme-loader` loads theme CSS on demand using `dist/cdn/themes/manifest.json`.
- Core themes are always available without extra requests: `default`, `a11y-high-contrast`, `a11y-large-text`, `a11y-dyslexia`.

### 3) Most "future themes" from the old docs are already implemented

- Developer-culture themes: Nord, Solarized, Dracula, Gruvbox, Tokyo Night, Rose Pine, Catppuccin flavors.
- Design movement themes: Art Deco, Bauhaus, Vaporwave, Memphis, Glassmorphism, Neumorphism, Cottagecore, Claymorphism.
- Industry/domain themes: Clinical, Financial, Government, Startup.
- Mood/time themes: Dawn, Dusk, Midnight, High Noon.

### 4) Theme extensions are already real, not hypothetical

- Border style system (`data-border-style`) with multiple presets (`sharp`, `soft`, `sketch`, `pixel`, `neon`, `organic`, etc.).
- Surfaces extension tokens (textures, gradients, glass tokens).
- Motion extensions (`--motion-*` hover/enter/stagger tokens and keyframes).
- Font extension tokens.
- Rough-border utilities and SVG filter support.
- Optional sound effects exist (`SoundManager`) and are wired into settings controls.

### 5) Theme tooling is already strong

- `theme-picker` ships with full swatch grid for color/personality/extreme themes, mode controls, accessibility toggles, fluid sizing controls, and extension toggles.
- `settings-panel` provides a second UI surface for coordinated theme/a11y/extensions/fluid controls.
- Theme Composer tool is live at `/docs/tools/theme-composer/` with live preview + CSS export across colors, typography, spacing, fluid, shape, borders, icons, surfaces, shadows, and motion.
- Theme Lab tool is live for comparing themes, border styles, icon sets, and surfaces.

## What Is Still Missing (Good Future Work)

### 1) Layered theme composition (not just one `brand` value)

Not implemented yet:
- `data-theme-color=...`
- `data-theme-typography=...`
- `data-theme-shape=...`
- `data-theme-motion=...`
- `data-theme-surface=...`

Why it matters:
- Would let users mix domains directly instead of only selecting a full bundled theme identity.

### 2) Metadata-driven semantic page context

Not implemented as a formal system:
- `data-page-type`, `data-task`, `data-audience`, `data-journey` -> centralized token mapping.

Why it matters:
- Reduces page-specific selector sprawl and keeps components token-driven.

### 3) User override layer and governance

Not implemented:
- Dedicated `@layer user` override policy.
- Programmatic token override API in `ThemeManager`.
- Lint rule to prevent page-context selectors inside component CSS.

Why it matters:
- Keeps long-term design-system hygiene and easier enterprise customization.

### 4) Theme quality scoring and validation

Not implemented:
- Automated contrast/completeness/motion compliance scoring.
- Theme badges/quality metadata.

Why it matters:
- Helps maintain quality as theme count grows.

### 5) Brand extraction + advanced generation

Not implemented:
- Upload logo / infer palette / generate theme.
- Marketplace-style install flow.

Why it matters:
- Useful for agencies and product teams adopting VB quickly.

### 6) Transition presets are only partially formalized

Implemented now:
- Hue transitions via `@property` + token transitions.

Not implemented:
- A first-class transition preset API like `data-theme-transition="morph|fade|instant"`.

## Practical Near-Term Priorities

1. Fix docs/runtime drift so docs always reflect actual registry and picker options.
2. Implement layered theme composition (color/shape/type/motion/surface) behind backward-compatible APIs.
3. Add a small CSS lint rule for component isolation from page-context selectors.
4. Add a lightweight theme QA script (contrast + token completeness) in CI.
5. Explore metadata-driven page-context tokens in `r-n-d` before committing to framework-wide adoption.

## Current Documentation Drift To Address

- `theme-picker` docs still show only a small brand subset in examples/API narrative.
- Some docs copy still references old counts (for example "43 built-in themes"), while registry now has 55 entries.
- Theme system behavior is distributed across registry, picker, manager, and tools; docs should pull from one source of truth to avoid mismatch.

## Key Source Files For Ongoing Work

- `src/lib/theme-manager.js`
- `src/lib/theme-loader.js`
- `src/tokens/colors.css`
- `src/tokens/themes/index.css`
- `src/tokens/themes/_theme-template.css`
- `src/tokens/extensions/index.css`
- `src/web-components/theme-picker/logic.js`
- `src/web-components/settings-panel/logic.js`
- `11ty-site/src/_data/themeRegistry.js`
- `11ty-site/src/pages/docs/themes/index.njk`
- `11ty-site/src/pages/docs/elements/web-components/theme-picker.njk`
- `11ty-site/src/pages/lab/experiments/theme-composer.njk`
- `scripts/build-cdn.js`
