# Analytics viewCount Contract — v1

> **Status:** stable, 2026-04-27
> **Owner:** VB SKOS topic-index initiative
> **Producers:** VB analytics subsystem (Cloudflare Pages + D1 + Analytics Engine), or any analytics backend that can resolve URL view counts to SKOS concept ids
> **Consumers:** the SSG `topic-index.json` generator (see `admin/r-n-d/evaluate/topic-index-system.md`), the `<topic-index>` lens, and any future "Most read" sort surface
> **Source of truth:** this file

This document defines the JSON shape that connects the analytics subsystem to the SKOS topic index. It is the boundary between two systems: producers roll site-wide page views up to per-concept counts and emit this shape; consumers join it with `vocabulary.json` and `pages.json` to render a "Most read" sort dimension.

---

## Principle: a flat map keyed by concept @id

Producers publish a single small JSON document. Consumers fetch it once at build time, key into it by SKOS concept `@id`, and ignore the rest. No per-URL data, no events, no nested shapes — those live behind the analytics ingest surface and are aggregated before they reach this contract.

This contract is intentionally narrower than the analytics backend's full event schema. It exists so the topic-index pipeline does not need to talk to D1 or Analytics Engine directly.

---

## Document shape

```json
{
  "@version": 1,
  "generated": "2026-04-27T00:00:00Z",
  "period": "30d",
  "periodStart": "2026-03-28",
  "periodEnd": "2026-04-27",
  "source": "cloudflare-analytics-engine",
  "views": {
    "progressive-enhancement": 4350,
    "semantic-html": 2100,
    "accessibility": 6200,
    "css-architecture": 980,
    "data-provenance": 1240
  }
}
```

### Field definitions

| Field | Required | Type | Description |
|---|---|---|---|
| `@version` | yes | integer | Contract version. Currently `1`. Consumers MUST verify this and skip documents they cannot read. |
| `generated` | yes | ISO-8601 string | When the producer aggregated this snapshot. Used by consumers to surface a "data as of …" line. |
| `period` | yes | string | Aggregation window token. Recommended values: `7d`, `30d`, `90d`, `1y`, `all`. Free-form is allowed; consumers display it verbatim. |
| `periodStart` | optional | `YYYY-MM-DD` | Inclusive start of the aggregation window. Recommended for any period other than `all`. |
| `periodEnd` | optional | `YYYY-MM-DD` | Inclusive end of the aggregation window. Recommended for any period other than `all`. |
| `source` | optional | string | Producer identifier (e.g. `cloudflare-analytics-engine`, `d1-aggregate`, `synthetic`). Consumers use it for telemetry only. |
| `views` | yes | object | Map of SKOS concept `@id` → integer view count. Keys MUST exist in `vocabulary.json`. Consumers SHOULD ignore unknown keys rather than fail. |

### Aggregation semantics

- Each integer in `views` is the total page-view count, across the period, for **all** content pages whose `concepts: []` array includes that id. The same view is counted once per concept the page declares — a page tagged `[a, b]` viewed 100 times contributes 100 to both `a` and `b`.
- Aggregation up the SKOS `skos:broader` chain is the consumer's responsibility, not the producer's. The producer emits direct counts only. The topic-map lens and the topic-index generator add descendant counts using `vocabulary.json`.
- Concepts with zero views MAY be omitted. Consumers MUST treat absence as `0`.
- Bot traffic SHOULD be excluded by the producer. If it cannot be excluded reliably, the producer SHOULD declare that in `source` (e.g. `source: "raw-server-logs"`).

---

## Canonical location

The default URL is `/.well-known/analytics/views.json` on the same origin as the site. This keeps the contract first-party and discoverable, sits under an existing well-known root used elsewhere in VB (`/.well-known/content-keys/`, `/.well-known/content-authenticity.json`), and signals "machine-readable, framework-defined" rather than user-facing content.

Consumers MAY accept any URL via configuration. The S3 topic-index generator reads it from `analyticsViewsUrl` in site config; clients (e.g. a future `<topic-index>` web component) read it from `data-views-src` with a default of `/.well-known/analytics/views.json`.

---

## Optional, future: multiple periods in one document

A producer MAY emit several aggregation windows in one fetch by promoting `views` into `viewsByPeriod`:

```json
{
  "@version": 1,
  "generated": "2026-04-27T00:00:00Z",
  "viewsByPeriod": {
    "7d":  { "period": "7d",  "views": { "progressive-enhancement": 980, … } },
    "30d": { "period": "30d", "views": { "progressive-enhancement": 4350, … } },
    "all": { "period": "all", "views": { "progressive-enhancement": 18420, … } }
  }
}
```

This is **optional in v1**. Consumers MUST first check for `viewsByPeriod` and fall back to the single-period shape. Producers MAY emit either. Adding `viewsByPeriod` does not bump the version because the simpler shape is still valid v1.

---

## Absence is fine

This contract is optional end-to-end. If the file does not exist, returns 4xx, returns invalid JSON, or arrives with `@version` greater than the consumer understands:

- The topic-index generator omits `viewCount` from `topic-index.json` entries (or sets it to `0`).
- The `<topic-index>` page hides the "Most read" sort button (per the rule in `admin/r-n-d/evaluate/topic-index-system.md` § Sort Controls).
- The `<topic-map>` lens degrades silently — counts from `pages.json` are unaffected.

The system MUST function without this data. Popularity sort is enrichment, not a dependency.

---

## Producer responsibilities

A producer that emits this document MUST:

1. Resolve view events to concept ids by reading the `<meta name="concept">` tags on each page (or the `concepts: []` array in `pages.json`) — same source as the rest of the SKOS pipeline.
2. Emit only ids that resolve against `vocabulary.json`. Pages with concept ids that are not in the vocabulary SHOULD be counted under their resolvable ids only; if a page has none, it is not counted.
3. Set `@version: 1` and a sensible `generated` timestamp.
4. Update on a build cadence (daily or weekly is typical). The contract is a snapshot, not a live feed.
5. Serve with `Content-Type: application/json` and a cache header reflecting the cadence.

---

## Consumer responsibilities

A consumer that reads this document MUST:

1. Verify `@version` and refuse to interpret unknown majors.
2. Treat unknown keys as `0` rather than failing.
3. Roll descendant counts up the SKOS hierarchy itself if it needs broader-concept totals.
4. Render the "as of" line from `generated`/`period`/`periodEnd` when surfacing popularity to readers.
5. Hide popularity-driven UI when no view data is available, rather than showing "0 views" everywhere.

---

## Versioning

This contract is **v1**. Future revisions:

- **Backward-compatible additions** (new optional fields, new period tokens, the `viewsByPeriod` shape) keep `@version: 1`.
- **Breaking changes** (renaming `views`, changing the keying from `@id` to URL, embedding raw events) increment to `@version: 2` and ship under a new file name (`analytics-viewcount-v2.md`). Consumers will see the bump and skip.

### Changelog

- **v1 (2026-04-27)** — Initial contract. Authored as part of the SKOS topic-index sequence (S4: `topic-map` upgrade, consumed by S3: topic-index). See `admin/r-n-d/evaluate/decisions.md`.
