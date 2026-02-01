# Vanilla Breeze Review (Feb 1, 2026)

## Scope and Method
- Reviewed repository sources under `src/`, `site/`, `docs/`, `r-n-d/`, and build/config files.
- Attempted to review the published site at `https://vb.test`, but access was blocked by a 403 (forbidden) response from this environment, so site observations are limited to local source files.

## Philosophy
- **Three-layer architecture:** HTML (always), CSS (optional), JS (optional), with progressive enhancement as the core design principle. The docs and overview repeatedly emphasize usable content with no JS and no build step. See `vanilla-breeze-overview.md` and `site/pages/docs/principles.astro`.
- **Semantic-first:** Strong preference for native HTML elements, meaningful tags, and semantic naming over framework abstractions. Conventions reinforce element-scoped classes and data-attribute configuration (`CONVENTIONS.md`).
- **Token-driven design:** Extensive use of CSS custom properties for colors, typography, spacing, motion, and themes, with OKLCH color usage and layered CSS cascade (`src/tokens/*`, `src/main.css`).
- **Low-dependency ethos:** “Zero deployed dependencies” and minimal tooling; the package exports built CSS/JS bundles and avoids runtime libraries (`package.json`, `vanilla-breeze-overview.md`).

## Features (Evidence in Repo)
- **Layered CSS system** with predictable override order and a single entry point (`src/main.css`).
- **Design tokens & themes** (core tokens + brand themes + accessibility themes) in `src/tokens/` and `src/tokens/themes/`.
- **Native element styling** for a broad HTML surface area: buttons, inputs, tables, navigation, typography, multimedia, etc. (`src/native-elements/*`).
- **Custom layout elements** as CSS-only structural components: stack, grid, cluster, sidebar, cover, reel, switcher, etc. (`src/custom-elements/*`).
- **Web components** for interactive UI: accordion, tabs, toast, tooltip, dropdown, footnotes, table, icons, heading links, page toc (`src/web-components/*`).
- **Theme system** with light/dark/auto and brand switching, persisted in localStorage and broadcast via `theme-change` events (`src/lib/theme-manager.js`).
- **Charting system** that renders charts from semantic tables with CSS-only visuals and optional JS helpers (`src/charts/*`, `src/lib/charts.js`).
- **Docs + examples** with extensive demos, snippets, and integrations for Astro and Eleventy (`site/`, `docs/`, `integrations/`).
- **Search indexing** via pagefind in build workflow (`pagefind.yml`, `package.json` scripts).

## Holes / Gaps
- **Published site visibility:** The public URL `https://vb.test` is not accessible from this environment (403). This blocks validation of real deployment behavior, performance, and UX in the live site.
- **Root README missing:** There is no repository `README.md`, which makes first-run onboarding, installation, or contribution flow harder from the repo root. The docs are strong, but discoverability starts at root.
- **HTML lint coverage mismatch:** `npm run lint:html` targets `demo/**/*.html`, but the repo’s examples live in `docs/examples/` and `docs/snippets/`. There is no `demo/` directory. That likely means linting is not covering the actual HTML surface (`package.json`, repo tree).
- **Testing strategy not visible:** No test harness, unit tests, or CI config were found. That leaves regressions in CSS, web components, and docs UI unguarded.
- **SSR safety ambiguity:** The default JS entry (`src/main.js`) immediately touches `document`/`window` and registers custom elements. If users import `vanilla-breeze` in SSR contexts without client-only guards, this can break. There is no explicit SSR-safe entry point in `package.json` exports.
- **Chart JS feature gaps documented in R&D:** `r-n-d/chart-status-feb1.md` notes missing support for line/area in `charts.create()`, missing axis labels, and incomplete stacked/grouped chart behavior.

## Opportunities to Evolve and Improve
- **Add a root README and contribution doc** that points to the docs site, quick start, and conventions. This is the lowest-effort onboarding win.
- **Align linting with actual content** by updating `lint:html` to cover `docs/examples/**/*.html`, `docs/snippets/**/*.html`, and any generated demo output. Consider adding a lightweight CSS lint pass for tokens and component styles.
- **Introduce minimal test scaffolding** for web components and critical CSS regressions (e.g., Playwright visual checks for key docs pages, or DOM-based tests for accordion/tabs behaviors).
- **Provide SSR-safe entry points** (or explicit guidance) such as `vanilla-breeze/css` for CSS-only usage and a `vanilla-breeze/client` export that guarantees browser-only execution.
- **Expand charting maturity** based on the existing R&D: add JS support for line/area `--start`/`--end`, multi-series lines, axis labels, and finish stacked/grouped chart modes (`r-n-d/chart-status-feb1.md`).
- **Codify the “theme metadata” direction** from `r-n-d/theme-enhancement.md` into a formal proposal or lab experiment. It aligns with the token system and could become a signature capability.
- **Publish a compatibility matrix** (browsers, features like `light-dark()` and `oklch()`), so adopters know when to add fallbacks.
- **Clarify the build outputs vs source usage** in docs: when to consume `dist/cdn/*` vs `src/*`, and how to avoid double-including styles or JS.

## Closing Notes
- The repository clearly expresses a platform-first design philosophy, with a cohesive layering model and a strong “native HTML” bias.
- The largest unlocks for the next iteration are a tighter onboarding loop (README + lint coverage), clearer SSR guidance, and advancing the chart system from R&D to stable APIs.
