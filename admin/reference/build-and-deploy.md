# Build & Deploy Process

Two deploys live off this repo. Each is locked to a specific script or
workflow file — do not edit their build command outside of what's
committed here or drift will land on production silently.

## 1. Local dev (`vb.test`)

Caddy (homebrew `/opt/homebrew/etc/Caddyfile`) serves:

| Path      | Document root              |
|-----------|----------------------------|
| `/cdn/*`  | `dist/cdn/`                |
| `/src/*`  | repo root                  |
| `/*`      | `site/dist/pages/`         |

Build once with `npm run build`. `cd site && node scripts/setup-preview.js`
(the last step in `npm run build`) creates the symlinks that make demos
appear under `site/dist/pages/docs/`.

For an iteration loop while editing CSS/JS:

- **Source files (`src/**`)** are served directly — reload the browser.
- **`dist/cdn/**`** requires `npm run build:cdn` to rebundle.
- **Cook-authored HTML (`site/src/**`)** requires `cd site && npm run build`.
- **Full matching of prod layout** — run `npm run build`.

## 2. Cloudflare Pages (`vanilla-breeze.com`)

The CF Pages project is connected to this git repo. **Build command is
`./scripts/cf-pages-build.sh`.** Output directory is `site/dist/pages`
(matches `wrangler.toml` → `pages_build_output_dir`). If the dashboard
shows a different build command, update it — do not edit the script
behaviour in the dashboard.

`scripts/cf-pages-build.sh` runs the full chain:

1. `npm ci` (+ `cd site && npm ci`)
2. `npm run build:api` — api manifest
3. `npm run build:feed` — CHANGELOG → JSON feed
4. `npm run build:cdn` — CSS + JS bundles → `dist/cdn/`
5. `npm run build:demos` — copy demos with path rewrites → `dist/demos/`
6. `cd site && npm run build` — Cook SSG → `site/dist/pages/docs/**`
7. `npm run build:site-assets`:
   - copies `dist/cdn/*` → `site/dist/pages/cdn/`
   - copies `src/**` → `site/dist/pages/src/` (for demos referencing `/src/...`)
   - copies `dist/demos/*` → `site/dist/pages/docs/{snippets,examples,patterns,alpenglow}/...`
   - `generate-sitemap.js` writes `site/dist/pages/sitemap.xml`

Skipping step 7 is why `/docs/alpenglow/` returned the home page on
production while it worked locally — alpenglow lives in `demos/alpenglow/`
and is only placed into the deploy tree by `build:site-assets`.

## Retired: GitHub Pages mirror

`profpowell.github.io/vanilla-breeze` was a sub-path mirror deployed by the
old `deploy.yml` workflow with a `build:fix-paths` URL rewrite. It was
retired in September 2026: it broke visibly on GitHub whenever a gate
failed, while Cloudflare kept serving the real site, and it leaked into
`site.url` (canonical + `og:url` on vanilla-breeze.com itself). The
workflow is now `.github/workflows/ci.yml` — quality gate and reports
only, no deploy. Public references (README, `package.json` homepage,
`site/data/site.js`) point at `https://vanilla-breeze.com`. The Pages site
itself now serves only `.github/pages-redirect/` — an `index.html` and a
`404.html` that forward any old deep link to the same path on
vanilla-breeze.com — published by `.github/workflows/pages-redirect.yml`
whenever that folder changes.

## Caching strategy

`_headers` at repo root → copied to `site/dist/pages/_headers` by
`assemble-site.js` → applied by Cloudflare on every response.

- `/cdn/vanilla-breeze*.{css,js}` and friends: `max-age=60,
  stale-while-revalidate=3600` — a new deploy lands for users within
  ~1 min; worst-case stale serve bounded at 1h.
- `/cdn/sw.js`: `max-age=0, must-revalidate` — SW never served stale.
- HTML: `max-age=0, must-revalidate`.
- Fonts, icons: long-cache / immutable.

## Service worker

Opt-in per page via `<meta name="vb-service-worker" content="true">`.
Registers `/cdn/sw.js`. `CACHE_NAME` is `vb-${__VB_VERSION__}` where the
version is built from `pkg.version` + the build timestamp (set in
`scripts/build-cdn.js`). That means every deploy yields a unique cache
name; on `activate`, the SW deletes any `vb-*` cache that doesn't match
current — so stale CSS/JS is evicted automatically on first page load
after a new deploy.

### If a user reports "my old CSS is stuck"

1. Run `npm run audit:deploy` to prove whether prod actually has the fix
   (matches local hash). If it does, the issue is client cache.
2. Have the user hard-reload (Cmd-Shift-R). That bypasses the SW for
   navigation assets.
3. If still stuck: DevTools → Application → Service Workers → Unregister.
   Next page load will install the new versioned SW and evict old caches.

## Audit script

`npm run audit:deploy` fetches a list of critical assets from
`SITE_URL` (default `https://vanilla-breeze.com`) and compares their
sha256 against the local `site/dist/pages/*`. If every hash matches,
prod === local. A mismatch means either CF's build didn't run the full
chain, the edge cache is stale, or source/dist has diverged locally
without a rebuild.

```sh
npm run audit:deploy
# or a staging URL:
SITE_URL=https://staging.vanilla-breeze.com npm run audit:deploy
```

Add new assets to the `ASSETS` list in
`scripts/audit-deploy-parity.js` whenever a new deploy-drift class
surfaces.
