-- Vanilla Breeze Analytics — add `day` column to daily_uniques so rows
-- can be pruned by day as salts rotate.
--
-- The original schema used only `day_hash` as the primary key, which made
-- it impossible to know when a hash was written. Without that, cleanup
-- had to either be global (losing in-flight uniqueness marks) or rely on
-- a separate scheduled Worker matching hashes against current salts.
--
-- The new shape lets cleanup be a simple `DELETE WHERE day < ?` that
-- runs amortised into the normal ingest path (see functions/api/analytics/hit.js).
--
-- daily_uniques is ephemeral by design (yesterday's hashes can never
-- match today's hash output because the salt has rotated), so DROP +
-- recreate is safe — no user-meaningful data is lost.

DROP TABLE IF EXISTS daily_uniques;
CREATE TABLE IF NOT EXISTS daily_uniques (
  day       TEXT NOT NULL,   -- 'YYYY-MM-DD' UTC of first sighting
  day_hash  TEXT NOT NULL,   -- two-level SHA-256 hash
  PRIMARY KEY (day, day_hash)
);
CREATE INDEX IF NOT EXISTS idx_daily_uniques_day ON daily_uniques (day);
