# Pickup: where Vanilla Breeze stands and how to resume

Living doc. Rewrite the **Status** and **Queue** sections at the end of every
working session; keep **Resume** and **How the repo works** current as the
mechanics change. Last rewritten **2026-09-02**.

## Status (2026-09-02)

- **Version:** 0.3.1 on npm (published 2026-07-07). Nothing released since;
  the 0.3.x → next changes are all on `main` unreleased.
- **Live site:** https://vanilla-breeze.com (Cloudflare Pages, builds from
  `main` via `scripts/cf-pages-build.sh`). Serving the current tree as of
  this session, with its own canonical URLs (they pointed at the old GitHub
  mirror until today).
- **CI:** `.github/workflows/ci.yml` is green on `main`. It had been red
  since 2026-07-25 (typecheck), and the informational `quality-report` job
  had been red for longer (missing site install). Both fixed.
- **GitHub Pages:** retired as a mirror. `profpowell.github.io/vanilla-breeze`
  now serves a redirect page that forwards any old deep link to the same
  path on vanilla-breeze.com (`.github/pages-redirect/`, deployed by
  `pages-redirect.yml` only when that folder changes).
- **Branches:** `work/next` is the working branch and is level with `main`.
  All other local and remote branches were deleted (all merged). Stash is
  empty. Tree is clean.
- **Beads:** 36 open, 31 ready, nothing in progress. The epic **3lac** is
  closed. Follow-ups it spawned that remain: **o4tj** (components derive
  hover/active/subtle states locally instead of reading the theme-set
  `--color-*-hover/-active/-subtle` tokens — wire or prune, verify with the
  theme-surfaces spec).

### Landed this session

| Commit theme | What |
|---|---|
| CI unblock (nnqp) | 2 typecheck errors in settings-panel/site-search teardown + 14 strict-null errors in two test files + 1 lint:html error |
| Pipeline (lcm2) | deploy.yml → ci.yml (gate + report, no deploy); README rewritten; homepage/site.url/sample → vanilla-breeze.com; fix-paths script removed |
| quality-report | `cd site && npm ci` added — the job had never installed Cook |
| Pages redirect | index.html + 404.html forwarders, one-shot workflow |
| 3pyj | Reconnect DOM duplication: guards in content-lens, time-index, comment-wc; reconnect spec extended (10/10) |
| Admin tidy | Shipped layout-vocabulary plan moved to `shipped/`; CLAUDE.md doc paths fixed; stale r-n-d copies removed |
| aynl (closed, not a bug) | comment-wc does autoload on built pages, locally and live; the reconnect spec now covers it (12/12) and waits for `attached`, not visible |
| t8ao | All 55 theme files in `@layer bundle-theme`; entries import the barrel unlayered; CDN themes carry the layer-order prefix; dyslexia `!important` dropped; `demos/docs.css` moved to `@layer utils`; gate test; 68/70 like-for-like screenshots identical (2 dyslexia diffs intended). Follow-ups 1v63, ijls |
| aoku | 8 layouts + typographic core merged to one `:is(element, attribute)` rule set each; 509 lines out of `layout-attributes.css`; drift fixed both ways (cover dvh/only-child, center `prose` + gap-guard overflow, cluster gaps, semantic sidebar, container fallbacks dropped); 12 visual baselines refreshed on purpose |
| 1v63 | Menu-item theme resets moved from JS inline styles to component CSS `!important`; nav `!important` kept with corrected rationale (38 themes colour bare links); neumorphism `!important` dropped |
| ijls | Every `display:` in every theme inventoried; NES/Win9x redundant summary/dialog display rules dropped; bauhaus/editorial/dyslexia exemptions documented; rule 3 clarified for pseudo boxes |
| vqw8 | Layout API consistency, decided with the user: full gap scale everywhere, 16rem sidebar everywhere, `narrow\|normal\|wide\|prose` max keywords, flow = `data-layout-*` / surfaces = bare `data-*` (canvas → `data-max`/`data-padding`), `data-layout-min` kept per axis. Spec amendment recorded |
| n3ky | wizard/contact code examples corrected to `data-max` on layout-card |
| qoi8 | api.json for all 14 layouts, CSS-derived and gated (`layout-manifests.test.js`); 12 wrong overrides entries removed; registry emits `omit: true`; all 14 doc tables regenerated; the now-correct registry caught 42 imposter `data-position`/`data-margin` sites (fixed) |
| butz | `vb/layout-attr-value` keyed per layout (element's own tag, across lines, escaped markup ignored); found 30 `data-layout-ratio` no-ops on `[data-media]` (reads `data-ratio`), fixed |
| zzdy | drift check's hardcoded ARIA table expected `aria-selected` on tab-set; it manages `aria-expanded` by design |
| lp55 | meta/link, output and svg conformance guards scoped to the examined tag; every class attribute on a line is now checked (+5 real warnings) |
| iocg | charts add-on layered into `web-components` (layer() on every import, CDN prefix via shared `prefixLayerOrder()`); chart-wc hidden-table overrides locked against utils; a sparkline demo's own height rule finally wins |
| dtw6 | tokens graph is custom-properties only, gated; backdrop/scrollbars/border-styles/spotlight split into tokens + `src/utils/` application files, opentype moved, external-components imported from utils; backdrop regions now render centered with the canvas gap |
| vjpn | 169 hardcoded `cursor: pointer` → `var(--cursor-custom-pointer, pointer)` (gate: `cursor-hook.test.js`); backdrop breakpoint → `--bp-s`; heading weights tokenised. Follow-up s3hy for 6 other px media queries |
| tfcw | `layout-attributes.css` 1294 → 760 lines: density → `utils/density.css`, scroll effects → `utils/scroll-driven.css`, canvas → `layout-canvas/styles.css`; legacy `data-layout="body-*"` deleted (demo migrated, region container names re-pointed to page-layout); dormant identity rules scoped. layout-badge keeps its tag |
| 822u | Dead files deleted (`charts/index.css`, `vb-extensions.js`), `data-hero-overlay` + `data-layout-nospace` removed, stale barrel headers / pointer no-op / build comment fixed |
| jhku | Both web-components CSS barrels are import-only (gate); shared rules once in `web-components/_shared/`; core's 7 drifted rules reconciled to index; built-bundle declaration diff proved it |
| 7371 | youtube-player / social-embed self-declared layer wrappers stripped |
| 6xxy | VB effects runtime is a per-document singleton that boots its own observer (core-only pages now activate late effects; Playwright spec); chunk splitting measured and rejected (standalone files are a contract) |
| j1hi | Scale spelling normalised to `s/m/l` (font-size, shadow, bp), 1394 occurrences in 484 files, no aliases; DTCG fixtures + vendored catalogs follow |
| p0wn | 72 dead tokens pruned (all Open Props numeric aliases); `token-usage.test.js` gate; 28 unread-but-set/documented tokens tracked (z1im) |
| hl9c | native-elements contract amended (element-scoped modifier classes + init-module classes); 7 dead classes pruned; hex fallbacks dropped, highlight colours oklch; `native-element-classes.test.js` gate |
| CI | `validate:api` + `check:api-drift` in the quality gate; calendar-wc's phantom `size` manifest entry removed |
| s3hy | 5 px width media queries → `--bp-s/l`; gate against px widths |
| z1im | 28 unread tokens decided: 19 kept as categorised public API, 5 theme-state tokens tracked in o4tj, 4 pruned everywhere |
| iwuq | `theme-surfaces.spec.js`: surfaces demo under all 55 themes light+dark + form-validation per theme, 156 desktop baselines; old themes.spec.js retired |

## Resume in five minutes

```bash
cd ~/src/vanilla-breeze
git checkout work/next && git pull --rebase
bd ready                 # 31 ready; see Queue below for the order
npm ci && (cd site && npm ci)
npm run build            # CDN bundles + doc site → site/dist/pages
npm test                 # 968 unit tests, ~12s
```

Local docs at https://vb.test (Caddy). Playwright suites need the build
above; they run against `scripts/test-server.mjs` on :8123 (Playwright
starts it). Never run two Playwright invocations at once.

## Queue (recommended order)

1. **o4tj** (P3, design) — wire the theme-set state colours into the
   components that map to a semantic colour, or prune them; the new
   theme-surfaces spec shows the blast radius per theme.
2. The P2s: **kdkb** (vendor `marked`), **d2wz** (verify and close),
   **7yiy** (GoodURL phase 1). Small leftovers: native-elements sub-index
   chained imports (jhku note), a base `--page-bg-color` definition and the
   spacing/sizing filename swap (p0wn notes).
2. Outside the epic, the P2s worth a look: kdkb (vendor `marked`), iwuq
   (theme visual coverage), d2wz (mobile-menu nav-bar redeploy — verify it
   is not already moot now that main deploys), 7yiy (GoodURL phase 1).

Alternative thread if the quality epic feels done enough: the analytics
work is fully specced in `admin/plans/analytics/` (v0.4, Cloudflare Pages
+ D1) and the Phase 1–4 first cut is already in the tree.

## How the repo works (the non-obvious parts)

- **Branch flow.** Work on `work/next`, then fast-forward `main` with
  `git push origin work/next:main`. Local `main` is checked out in a
  beads-managed worktree (`.git/beads-worktrees/main`), so do not
  `git checkout main` here; sync it with
  `git -C .git/beads-worktrees/main merge --ff-only origin/main`.
- **Every push to main cancels the in-flight CI run** (concurrency group).
  Batch pushes or expect "cancelled" on the superseded run; the gate job
  usually finishes before the cancel, the Playwright report job rarely does.
- **Two deploys, not three.** Cloudflare is the only host; CI deploys
  nothing. Details in `build-and-deploy.md`.
- **Beads.** `bd dolt push` is a no-op (no remote); issues are versioned
  through `.beads/issues.jsonl` in git, so commit that file with your work.
- **Reconnect idempotency.** `VBElement` clears `data-upgraded` on
  disconnect and re-runs `setup()` on reconnect. Any component that builds
  DOM in `setup()` needs a `node?.parentNode === this` guard or a real
  `teardown()`. The check that matters is
  `tests/components/reconnect-idempotency.spec.js` (remove + reinsert,
  assert child count). A lexical grep for unguarded appends flags 13 of 74
  and 10 are false positives — use it as a report, not a gate.
- **Built pages load the autoload bundle, not main.js.** Two loading paths:
  utils and effects init modules come from the guard table in
  `src/lib/lazy-guards*.js` (a missing guard ships the feature dead on built
  pages); components come from `cdn/components/manifest.json`, which
  `scripts/build-cdn.js` generates for every `web-components/*/logic.js`
  that registers a tag, and the autoloader fetches on demand. A component
  hidden until interaction (comment-wc inside selection-menu's pop-over)
  is upgraded but not visible, so probe with `state: 'attached'`.
- **Theme cascade.** Every `src/tokens/themes/_*.css` self-declares
  `@layer bundle-theme`; the barrel is imported by both entries WITHOUT a
  `layer()` directive, and `tokens/index.css` must not import it. The CDN
  build prefixes each standalone theme with the layer-order statement
  because the docs boot script links the saved theme BEFORE core.css and
  first appearance sets layer order. Unlayered site CSS beats themes, so
  docs chrome lives in `@layer utils` (`demos/docs.css`);
  `demos/homepage.css` is still unlayered. Gate: `bundle-parity.test.js`.
  To prove a cascade change safe, capture before/after in one session by
  serving the old CSS from git through Playwright route interception, then
  diff computed styles for anything that differs (memory note has the recipe).
- **Theme visual suite.** `tests/visual/theme-surfaces.spec.js` runs the
  surfaces demo under every theme in light and dark (desktop only, 156
  baselines). Run it before and after any cascade, theme or token change
  and refresh only the intended diffs with `--update-snapshots -g`.
- **Token gates.** Scale spelling is `s/m/l` everywhere. `token-usage.test.js`
  rejects unread core tokens (allowlist `UNREAD_BUT_KEPT`, tracked by z1im);
  `native-element-classes.test.js` rejects dead classes in native-elements
  (a class counts as used if corpus HTML has it or a framework JS module
  writes it). A token rename must also update the DTCG test fixtures and
  `src/data/theme-catalog/*.json` keys. Verifying a rename needs a full HEAD
  site build served on a second port, not the CSS route-interception trick.
- **Barrels are import-only.** `web-components/index.css` and `core.css`
  hold `@import` lines only (gate in `bundle-parity.test.js`); shared rule
  sets live in `src/web-components/_shared/` and core imports the core
  subset. To prove a barrel or bundle refactor is a no-op, build both
  entries in memory from HEAD (`git stash -u`) and from the tree, strip
  comments, diff the declaration sets.
- **Cascade gates now in `bundle-parity.test.js`:** themes self-declare
  `bundle-theme`; charts imports carry `layer(web-components)`; the tokens
  import graph holds custom properties only (exceptions: `color-scheme`,
  `interpolate-size`, `:root` token `transition`). `cursor-hook.test.js`:
  no hardcoded `cursor: pointer` in framework CSS — write
  `var(--cursor-custom-pointer, pointer)`. Standalone CSS artifacts get the
  layer-order prefix from `prefixLayerOrder()` in `scripts/build-cdn.js`.
- **Conformance scanner.** `scripts/quality/vb-conformance.js` is
  line-based; rules needing element context read the opening tag with
  `tagAround(offset)`, which only resolves when the match sits inside a real
  tag (escaped samples in `<pre>`/`<code-block>` fall back to the merged
  vocabulary). `vb/layout-attr-value` validates per layout via
  `readLayoutVocabularyByLayout()`. Never write a "line contains <x>" guard.
- **Layout manifests.** `src/custom-elements/layout-*/api.json` are derived
  from the CSS (`readLayoutVocabularyByElement` in
  `scripts/quality/layout-vocabulary.js`) with hand-written descriptions;
  `tests/unit/layout-manifests.test.js` fails on drift. `""` in an enum =
  bare form allowed (registry → html-validate `omit: true`). The overrides
  file must carry no `layout-*` entries. Doc attribute tables were
  regenerated from the manifests once; regenerate again after a vocabulary
  change rather than hand-editing.
- **Layouts live once.** `src/custom-elements/layout-<name>/styles.css`
  holds `:is(layout-x, [data-layout="x"])` for the 8 dual-form layouts;
  `layout-attributes.css` keeps only attribute-only layouts, grid identity
  and container plumbing. Do not add `[data-layout="x"]` blocks there for a
  layout that has an element file. `layout-*/` inside a CSS comment closes
  the comment (esbuild only warns) — write `layout-<name>/`. Verify layout
  or cascade changes by running `tests/visual/demos.spec.js` before and
  after and diffing the failing sets (4 baselines were already stale:
  calendar-wc-multi-month, effects-kitchen-sink, layout-attributes-refactored,
  layout-comparison), then like-for-like captures for the delta.
- **Typecheck runs three tsconfigs** (`src`, `scripts`, `tests`) chained
  with `&&`; an error in the first hides the rest.

## Pointers

- `admin/INDEX.md` — topic map of plans / research / shipped / reference
- `admin/reference/build-and-deploy.md` — the deploy chain, byte for byte
- `admin/reference/syntax.md` — element / attribute catalog
- `CHANGELOG.md` — release notes; 0.3.1 is the top entry
- Claude memory for this project: `~/.claude/projects/-Users-tpowell-src-vanilla-breeze/memory/MEMORY.md`
