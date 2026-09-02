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
- **Beads:** 52 open, 46 ready, nothing in progress. The active thread is
  the epic **3lac** "Quality tightening: layout + core", 14 of 26 done.

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

## Resume in five minutes

```bash
cd ~/src/vanilla-breeze
git checkout work/next && git pull --rebase
bd ready                 # 46 ready; see Queue below for the order
npm ci && (cd site && npm ci)
npm run build            # CDN bundles + doc site → site/dist/pages
npm test                 # 968 unit tests, ~12s
```

Local docs at https://vb.test (Caddy). Playwright suites need the build
above; they run against `scripts/test-server.mjs` on :8123 (Playwright
starts it). Never run two Playwright invocations at once.

## Queue (recommended order)

1. The epic's P3s: 6xxy, jhku, tfcw, dtw6, 822u, 7371, iocg, j1hi,
   p0wn, hl9c, vjpn. Natural next ones: **butz** (per-layout vocabulary
   keying for vb/layout-attr-value — the layout api.json manifests now give
   it the per-element map), **iocg** (charts-standalone unlayered — reuse the
   CDN layer-order prefix from `scripts/build-cdn.js`), **dtw6** (selector
   rules out of the tokens layer), **vjpn** (theme cursor hook). Small:
   **zzdy** (tab-set api.json claims aria-selected; `check:api-drift` is
   red on it and is not in the CI gate).
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
