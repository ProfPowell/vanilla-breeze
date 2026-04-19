# Analytics Ingest — Cloudflare Pages Functions

First-cut ingest + stats endpoints. Implements Phase 4 of
[`admin/r-n-d/analytics/analytics-spec.md`](../../../admin/r-n-d/analytics/analytics-spec.md)
against Cloudflare Pages Functions + D1.

## Endpoints

| Method | Path                      | File       | Purpose                                       |
| ------ | ------------------------- | ---------- | --------------------------------------------- |
| `POST` | `/api/analytics/hit`      | `hit.js`   | Page views and named `Analytics.track()` events |
| `POST` | `/api/analytics/click`    | `click.js` | Outbound link clicks (ping + beacon fallback) |
| `POST` | `/api/analytics/events`   | `events.js`| Batched events from the sessionStorage buffer |
| `GET`  | `/api/analytics/stats`    | `stats.js` | JSON aggregate for the dashboard              |

`/api/analytics/hit`, `/click`, and `/events` are exempt from the Basic
Auth middleware (they accept unauthenticated beacons). `/api/analytics/stats`
stays behind the gate so dashboard access requires the site password.

## One-time Cloudflare setup

These are manual steps — Claude can't do them for you.

1. **Create the D1 database:**
   ```bash
   npx wrangler d1 create vanilla-breeze-analytics
   ```
   Copy the `database_id` from the output.

2. **Paste the ID into [`wrangler.toml`](../../../wrangler.toml)** (the commented `database_id` line) so local `wrangler pages dev` works.

3. **Apply the schema migration:**
   ```bash
   npx wrangler d1 migrations apply vanilla-breeze-analytics
   # For local dev add: --local
   ```

4. **Bind the database in the Cloudflare dashboard:**
   - Pages → your project → **Settings** → **Functions** → **D1 database bindings**.
   - Variable name: either `DB` (short) or `vanilla_breeze_analytics` (descriptive — matches `wrangler.toml`). Functions accept either via the `getDB(env)` helper in `functions/_lib/sanitize.js`.
   - Database: `vanilla-breeze-analytics`.
   - Save and redeploy (push any commit or use the dashboard's "Retry deployment").

5. **Client transport.** The docs site's base layout (`site/src/includes/head.html`) already sets:

   ```html
   <script>
     window.vbAnalyticsConfig = {
       siteId: 'vb-docs',
       transport: 'beacon',
       endpoint: '/api/analytics',
     };
   </script>
   ```

   Change `transport` to `'console'` to log events to devtools instead, or `'disabled'` to turn analytics off entirely. Any site consuming the VB CDN can define `window.vbAnalyticsConfig` before `vanilla-breeze-core.js` loads to override the library defaults.

6. **Visit `/stats/`** to see the dashboard. Empty tables until beacons start arriving.

## Local development with Pages Functions

Caddy + `vb.test` serves the static site but does not execute Pages Functions. For local end-to-end testing:

```bash
# Build the site once:
npm run build

# Serve with Functions enabled:
npx wrangler pages dev site/dist/pages --d1=DB --local
```

The `--local` flag uses a SQLite file in `.wrangler/` for the D1 binding,
so you can validate ingest and stats without touching the production database.

## Schema

See [`db/migrations/0001_init.sql`](../../../db/migrations/0001_init.sql). Tables:

- `hits` — page views and named events (one row per `Analytics.track()` call)
- `clicks` — outbound link clicks
- `daily_salts` — per-UTC-day rotating salt for the visitor hash
- `daily_uniques` — seen-today hash entries, used as a race-safe unique counter

## Privacy contract

- IPs never written to D1 — they feed the daily hash and are discarded.
- The daily hash itself is written to `daily_uniques` just long enough to detect same-day repeats, then truncated at salt rotation.
- Geo uses `request.cf.country` (no MaxMind required).
- Event props are JSON-stringified verbatim — the client library scrubs raw user text (see `src/utils/analytics-init.js` — filter values become `{ hasValue, length }`).
