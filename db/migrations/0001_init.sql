-- Vanilla Breeze Analytics — D1 initial schema (v0.4)
--
-- Apply with:
--   wrangler d1 migrations apply <database-name>
--
-- All statements are idempotent (CREATE TABLE IF NOT EXISTS) so re-running
-- against a partially-migrated database is safe.

-- ── hits ─────────────────────────────────────────────────────────────
-- One row per page view (name = 'page.view') OR per named event fired via
-- Analytics.track(). Keeping them in a single table keeps the dashboard
-- queries simple and lets the event catalog evolve without schema churn.
CREATE TABLE IF NOT EXISTS hits (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id     TEXT    NOT NULL,
  event_name  TEXT    NOT NULL DEFAULT 'page.view',
  path        TEXT    NOT NULL,
  referrer    TEXT,
  country     TEXT,
  is_unique   INTEGER NOT NULL DEFAULT 0,
  props       TEXT,     -- JSON-encoded event props (minimal, no raw text)
  persona     TEXT,
  activity    TEXT,
  topic       TEXT,
  content     TEXT,
  stage       TEXT,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hits_site_created ON hits (site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hits_site_event   ON hits (site_id, event_name);
CREATE INDEX IF NOT EXISTS idx_hits_site_path    ON hits (site_id, path);

-- ── clicks ───────────────────────────────────────────────────────────
-- Outbound link clicks (ping + sendBeacon fallback). Deduped at query time.
CREATE TABLE IF NOT EXISTS clicks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id     TEXT    NOT NULL,
  from_page   TEXT    NOT NULL,
  to_domain   TEXT    NOT NULL,
  href        TEXT,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_clicks_site_created ON clicks (site_id, created_at DESC);

-- ── daily_salts ──────────────────────────────────────────────────────
-- One salt per UTC day, used to compute the daily visitor hash. Rotated
-- by a scheduled Worker; old rows deleted after 2 days.
CREATE TABLE IF NOT EXISTS daily_salts (
  day   TEXT PRIMARY KEY,   -- 'YYYY-MM-DD' in UTC
  salt  TEXT NOT NULL
);

-- ── daily_uniques ────────────────────────────────────────────────────
-- Replaces the in-memory Set used in the nginx reference implementation.
-- A row here means the hash has been seen today; INSERT OR IGNORE gives
-- us a race-safe "first hit?" check. Truncated at salt rotation.
CREATE TABLE IF NOT EXISTS daily_uniques (
  day_hash TEXT PRIMARY KEY
);
