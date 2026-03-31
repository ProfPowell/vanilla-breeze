# Vanilla Breeze Docs Performance Review

Date: 2026-03-30

## Executive Summary

This pass is materially better than the last one. The docs shell is no longer in the "400+ requests, multi-megabyte by accident" state. The big fixes landed:

- the global docs shell no longer pulls `extras`, `effects`, and `prototype`
- demo surfaces are no longer pulling `/src/main.css` and `/src/main.js`
- `icon-wc` now uses `/cdn/icons` and dedupes inflight fetches
- `browser-window` no longer eagerly fetches source content

The site is now in a more normal range for a docs site:

| Page | Requests | Transfer |
| --- | ---: | ---: |
| `/` | 39 | 1.27 MB |
| `/docs/` | 20 | 992 KB |
| `/docs/performance/` | 20 | 1.30 MB |
| `/docs/elements/web-components/site-search/` | 24 | 1.44 MB |
| `/docs/tools/theme-lab/surfaces/home-preview.html` | 6 | 619 KB |

These numbers came from a local built export served from `site/dist/pages` and measured in Playwright with a cold ephemeral browser profile. Because this was a local simple server, transfer sizes should be treated as relative first-load body sizes, not exact CDN bytes. Request counts and hotspots are trustworthy.

The remaining problems are now narrower and more actionable:

1. `doc-extras.js` is still loaded by shared docs layouts even when a page has no `code-block` or `browser-window`.
2. Theme-lab preview surfaces are still importing raw `/src/lib/theme-manager.js` and `/src/lib/theme-loader.js`.
3. The global docs shell still carries a heavy fixed cost from `core.css`, `core.js`, fonts, and sometimes `doc-extras.js`.
4. The current budget tooling still under-reports real page cost, so regressions can slip through.

This is no longer a crisis. It is a tightening problem.

## What Improved Since The Earlier Audit

- `site/src/includes/head.html` now loads only the core CSS, font pack, and UI pack CSS globally.
- `site/src/layouts/base.html` and `site/src/layouts/docs.html` now load only `core.js` and `ui.full.js` globally.
- The old docs/demo fan-out from `/src/main.css` and `/src/main.js` is gone.
- `src/sw.js` now caches themes, packs, icons, and `doc-extras.js` with stale-while-revalidate, which is better for repeat visits.
- `icon-wc` no longer creates the old `/src/icons` duplication problem.

The important conclusion: the docs site is now paying for real features, not accidental shell mistakes. The review should therefore focus on fixed-cost trimming and regression control.

## Current Measurements

### 1. Docs landing page is much healthier, but still heavier than it looks

`/docs/` currently loads 20 requests and transfers about 992 KB.

Largest contributors:

- `/cdn/vanilla-breeze-core.css`: about 378 KB transferred locally
- `/cdn/vanilla-breeze-core.js`: about 202 KB
- `/cdn/doc-extras.js`: about 169 KB
- foundation fonts: about 153 KB
- docs CSS and icons: small by comparison

The key problem is not the page HTML. It is the shared shell.

### 2. The homepage is still the heaviest representative page

`/` currently loads 39 requests and transfers about 1.27 MB.

Largest contributors:

- `/cdn/vanilla-breeze-core.css`
- `/cdn/vanilla-breeze-core.js`
- foundation fonts, including `recursive-variable.woff2`
- homepage-specific docs assets
- theme-lab preview surface requests

The homepage is paying extra because it includes multiple SSR `code-block` / `browser-window` examples and the theme-lab iframe.

### 3. Example-heavy docs still carry large HTML and font cost

`/docs/elements/web-components/site-search/` lands at 24 requests and about 1.44 MB.

Two different costs combine here:

- a heavy fixed shell
- large HTML documents from SSR code examples and demo chrome

The site-search page document itself is about 163 KB before CSS, JS, and fonts are counted.

### 4. Theme-lab preview surfaces are still a real leak

The homepage iframe points to:

- `/docs/tools/theme-lab/surfaces/home-preview.html`

In the built export, that path is a symlink:

- `site/dist/pages/docs/tools/theme-lab/surfaces -> dist/demos/tools/theme-lab/surfaces`

The built `home-preview.html` still imports:

- `/src/lib/theme-manager.js`
- `/src/lib/theme-loader.js`
- `/src/lib/theme-data.js`

Measured directly, that surface loads 6 requests and about 619 KB, including about 35 KB of raw `/src/lib/*` theme runtime on top of `core.css` and `core.js`.

This is now one of the clearest remaining export-contract problems in the site.

## Findings

### 1. `doc-extras.js` is still over-included

`doc-extras.js` is still wired directly into shared layouts:

- `site/src/layouts/docs.html`
- `site/src/layouts/guide.html`
- `site/src/layouts/element.html`
- `site/src/layouts/attribute.html`
- `site/src/layouts/pattern.html`

The built scan shows:

- 390 HTML pages actually need `doc-extras.js`
- 416 HTML pages currently load it
- 28 pages load it unnecessarily

Examples of pages that load it without needing it:

- `/docs/`
- `/docs/performance/`
- `/docs/tools/theme-lab/`
- `/docs/examples/`
- `/docs/elements/`

`doc-extras.js` is not gigantic in gzip terms, but it is still a meaningful fixed cost:

- about 42.9 KB gzip in `bundle-budget`
- about 169 KB transferred in the local browser audit

This is now a clean page-selection problem, not a bundling mystery.

### 2. Theme-lab surfaces are bypassing the production contract

The symlinked demo surfaces in `dist/demos/tools/theme-lab/surfaces` still import raw source theme runtime.

That means the docs site is still depending on `/src/lib/*` for a production-facing preview path, even after the rest of the docs shell moved to CDN bundles.

This matters for three reasons:

- it adds requests and bytes to the homepage
- it violates the "production site should not depend on raw `/src` modules" contract
- it can hide pack and tree-shaking progress because the preview path side-steps the packaged runtime

This is the main remaining source-module leak.

### 3. The fixed docs-shell baseline is still expensive

The biggest first-load costs are now predictable:

- `vanilla-breeze-core.css`: 60.6 KB gzip, over its 48 KB budget
- `vanilla-breeze-core.js`: 52.3 KB gzip, over its 50 KB budget
- `doc-extras.js`: no budget at all
- `fonts-foundation.theme.css`: no budget at all

Font behavior deserves special attention:

- `/docs/` downloads `inter-variable.woff2` and `inter-variable-italic.woff2` for about 153 KB total
- `/` also downloads `recursive-variable.woff2`, pushing font transfer to about 458 KB

The docs shell currently loads `fonts-foundation.theme.css` globally from `site/src/includes/head.html`, so the typography upgrade is site-wide whether a page materially benefits from it or not.

This is not necessarily wrong, but it should be a conscious tradeoff.

### 4. HTML payload is still doing real work on example-heavy pages

Pages with SSR `code-block` and `browser-window` can be large before any external assets are counted.

The current example-heavy pages are not primarily request-count failures anymore. They are HTML-weight pages:

- SSR markup
- repeated shadow-root style blocks
- example source content embedded in the page

That is acceptable for some docs pages, but it means first-load performance will not be solved only by trimming JS bundles.

### 5. Icon fetching is no longer broken, but it is still request-heavy

The good news:

- icon fetch duplication appears fixed
- icons now load from `/cdn/icons`

The remaining reality:

- `/docs/` still generates about 10 fetch requests
- `/` generates about 22 fetch requests

Most of that is fine for a docs site, but if request-count minimization becomes a priority, the next step would be an icon sprite or a small inlined docs-shell icon subset.

This is a second-order optimization, not the first thing to do.

### 6. The budget tooling is still not telling the truth

This is the most important process finding.

`scripts/quality/resource-budget.js` still skips root-relative assets:

- `/cdn/*`
- `/docs/*`
- `/pagefind/*`

It does that in `resolveResourcePath()` by returning `null` for any URL that starts with `/`.

The result is a major false negative. Example:

- browser audit for `/docs/`: about 992 KB transferred
- `resource-budget.js` for `site/dist/pages/docs/index.html`: 16.1 KB and "within budget"

That script is not currently usable as a guardrail for the real docs site.

There is a second tooling gap in `scripts/bundle-budget.config.json`:

- no budget for `doc-extras.js`
- no budget for `packs/ui.full.js`
- no budget for `packs/ui.full.css`
- no budget for `fonts-foundation.theme.css`
- no font-file budgets at all

The bundle budget is correctly failing today, but it is still blind to several assets that materially affect docs-site performance.

### 7. Build-mode detection still drifts

`site/data/site.js` uses:

- `ELEVENTY_ENV === 'development'`

But `site/package.json` uses:

- `build`: `MINIFY=false cook build && pagefind`
- `build:prod`: `NODE_ENV=production cook build && pagefind`

That mismatch is an avoidable source of confusion. It makes it easier to get a "production build" that does not actually follow the same runtime branch the site data expects.

Given how many performance questions depend on "did we really build the production asset graph?", this should be cleaned up.

### 8. Service worker coverage is better, but it can hide regressions during manual review

The current service worker is better than before. It now caches:

- themes
- component bundles
- packs
- icons
- `doc-extras.js`

The docs site also globally opts in to the service worker in production via `site/config/data.js`.

That is good for repeat visits. It does not improve first-load performance.

It also means manual checks on `vb.test` can look healthier than a cold first visit unless cache and service worker state are reset.

## Recommendations

### Priority 1: Stop loading `doc-extras.js` everywhere

This is the cleanest near-term win.

Recommended approaches:

- Best pragmatic option: gate `doc-extras.js` behind page front matter or a build-time detector
- Good fallback: replace the unconditional script tag with a tiny runtime loader that imports `doc-extras.js` only if `document.querySelector('code-block, browser-window')` matches

Expected benefit:

- removes one large JS asset from 28 pages immediately
- fixes the docs landing page paying for demo chrome it does not use

### Priority 2: Replace raw `/src/lib/*` imports in theme-lab surfaces

The theme-lab preview path should not be a production exception.

Recommended approaches:

- build a tiny bundled `theme-surface-runtime` asset for the demo surfaces
- or move the theme-preview behavior to CDN-backed helpers instead of raw `/src/lib/*`
- or pre-render the small homepage preview set instead of using the general-purpose theme-lab surface runtime

Do not leave the current `/src/lib/theme-manager.js` and `/src/lib/theme-loader.js` imports in the built demo surfaces.

### Priority 3: Split the font story by purpose

The current single "foundation fonts" pack is easy to use but expensive as a default.

Recommended direction:

- keep a lightweight UI font pack for broad docs use
- make mono/code fonts opt-in for pages that actually need them
- consider keeping system fonts on some shell pages if the visual difference is small

The goal is not "never load fonts". The goal is to stop paying for `Recursive` on pages that do not materially benefit from it.

### Priority 4: Fix the page-budget tooling before relying on it

`resource-budget.js` should be updated to:

- resolve root-relative URLs against the built output root
- follow symlinked demo surfaces
- account for external CSS and JS, not just relative local files
- optionally report first-load page budgets per representative route

Until this is fixed, the script is giving false reassurance.

### Priority 5: Add representative browser audits to CI

A bundle budget alone is not enough for a docs site. The real shell cost comes from page composition.

Add a Playwright-based browser budget script that measures at least:

- `/`
- `/docs/`
- `/docs/performance/`
- `/docs/elements/web-components/site-search/`
- `/docs/tools/theme-lab/`

Track:

- request count
- transferred bytes
- document size
- number of `/src/*` requests
- whether unnecessary `doc-extras.js` was loaded

This is the best way to prevent architectural drift from creeping back in.

### Priority 6: Expand bundle budgets to match real site costs

Extend `bundle-budget` to cover:

- `doc-extras.js`
- `packs/ui.full.js`
- `packs/ui.full.css`
- `packs/fonts-foundation.theme.css`
- font binaries in `packs/fonts-foundation/fonts/*.woff2`

Also keep the existing failures visible:

- `vanilla-breeze-core.css`
- `vanilla-breeze-core.js`
- the full library bundles

Those failures are still worth addressing, but the docs site currently gets more value from shell-level fixes than from immediately squeezing a few KB out of core.

### Priority 7: Make the docs site model the package story more clearly

The library story is "do not load everything".

The docs site is improved, but it still does not fully demonstrate that story. A more intentional page-class strategy would help:

- marketing/home pages: smallest shell that still supports the hero interactions
- docs prose pages: core + docs shell + optional `doc-extras`
- demo-heavy pages: add demo-specific assets explicitly

This would align the docs site with the pack and tree-shaking story you want users to adopt.

## Suggested Implementation Order

1. Make `doc-extras.js` conditional.
2. Replace the theme-lab surface `/src/lib/*` imports.
3. Fix `resource-budget.js` so it measures real pages.
4. Add browser-level route budgets in CI.
5. Split the font pack or make the mono font opt-in.
6. Revisit `core.css` and `core.js` budgets once the shell composition is no longer wasting bytes.

## Bottom Line

The docs site is no longer obviously out of control. The previous accidental over-loading story has been largely corrected.

What remains is a tighter set of production-quality issues:

- one over-eager docs bundle (`doc-extras.js`)
- one preview/export leak (`theme-lab` surfaces using `/src/lib/*`)
- one expensive global typography choice
- one page-budget tool that still cannot see the real site

That is a much better place to be. The next pass should focus on fixing those narrow leaks and hardening the guardrails so the performance story stays stable as the library keeps evolving.
