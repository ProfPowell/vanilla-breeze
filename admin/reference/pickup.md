# Pickup: where Vanilla Breeze stands and how to resume

Living doc. Rewrite the **Status** and **Queue** sections at the end of every
working session; keep **Resume** and **How the repo works** current as the
mechanics change. Last rewritten **2026-09-01**.

## Status (2026-09-01)

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
- **Beads:** 56 open, 49 ready, nothing in progress. The active thread is
  the epic **3lac** "Quality tightening: layout + core", 10 of 25 done.

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

## Resume in five minutes

```bash
cd ~/src/vanilla-breeze
git checkout work/next && git pull --rebase
bd ready                 # 49 ready; see Queue below for the order
npm ci && (cd site && npm ci)
npm run build            # CDN bundles + doc site → site/dist/pages
npm test                 # 968 unit tests, ~12s
```

Local docs at https://vb.test (Caddy). Playwright suites need the build
above; they run against `scripts/test-server.mjs` on :8123 (Playwright
starts it). Never run two Playwright invocations at once.

## Queue (recommended order)

1. **t8ao** (P2, design) — themes are unlayered / in the tokens layer; make
   them use the `bundle-theme` layer. Load-bearing for everything after.
2. **aoku** (P2) — merge the 8 element/attribute layout CSS forks via
   `:is()`. Watch specificity: `:is()` takes the max of its arguments (bit
   the `[data-container]` override once already).
3. Then the epic's P3s: 6xxy, jhku, tfcw, dtw6, 822u, 7371, iocg, j1hi,
   p0wn, hl9c, vqw8, qoi8, vjpn.
4. Outside the epic, the P2s worth a look: kdkb (vendor `marked`), iwuq
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
- **Typecheck runs three tsconfigs** (`src`, `scripts`, `tests`) chained
  with `&&`; an error in the first hides the rest.

## Pointers

- `admin/INDEX.md` — topic map of plans / research / shipped / reference
- `admin/reference/build-and-deploy.md` — the deploy chain, byte for byte
- `admin/reference/syntax.md` — element / attribute catalog
- `CHANGELOG.md` — release notes; 0.3.1 is the top entry
- Claude memory for this project: `~/.claude/projects/-Users-tpowell-src-vanilla-breeze/memory/MEMORY.md`
