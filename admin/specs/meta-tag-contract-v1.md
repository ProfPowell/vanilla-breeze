# Vanilla Breeze Meta-Tag Contract — v1.2

> **Status:** stable, 2026-04-27
> **Owner:** VB document-provenance initiative
> **Consumers:** `<page-info>`, `<change-set>`, lens component family, analytics subsystem
> **Source of truth:** this file.

**v1.1 — 2026-04-27.** Replaces `vb:topic` (single dotted-path string) with `concepts: []` frontmatter and repeated `<meta name="concept">` tags pointing into a SKOS `vocabulary.json`. Authored as a breaking change while VB is pre-release; no compat shim. See `admin/r-n-d/evaluate/decisions.md` for the adoption rationale and the SKOS Foundation bead (`vanilla-breeze-ii2k`).

**v1.2 — 2026-11-14.** Corrects the consumer columns to what is built (no component reads JSON-LD, `article:tag` has no reader, `<site-index>` and `<time-index>` do not read page meta tags) and states the verifier's trust rules: the signing key must be same-origin, `metadata.expires` in the JWK is enforced, and `vb:hash` is checked when present. See the changelog in §G.

This is the public contract between VB components and the HTML documents they consume. It defines which `<meta>` tags, `<link>` relationships, and `data-*` attributes VB reads at runtime, how their values are interpreted, and the JSON-LD mirror publishers emit alongside them.

**The contract is stack-agnostic.** VB does not ship an 11ty plugin, a Cook SSG integration, or a VanillaPress integration from its core. Any site — hand-authored static HTML, Cook SSG, VanillaPress, Astro, Hugo, WordPress — that emits the tags described here will light up the VB components that consume them.

---

## Principle: public-first, `vb:*` private only

Where an open-standard name exists for a field (Schema.org, Open Graph, HTML5 semantics), VB reads the open name. The `vb:*` namespace is used **only** for VB-specific extensions with no adequate public equivalent. JSON-LD is the canonical machine-readable mirror of the entire contract.

This rule is load-bearing: crawlers, social tools, and future provenance standards (C2PA, VC, etc.) should be able to extract meaningful metadata from a VB-authored page without knowing anything about VB.

---

## Section A — Public-standard fields (adopted directly)

VB reads these names as authoritative. Authors SHOULD emit them via whatever build pipeline they use.

### Identity

| Field | Source | Consumers |
|---|---|---|
| `<meta name="author" content="…">` | HTML5 | `<page-info>` summary line |
| `<meta property="article:author" content="…">` | Open Graph Article | JSON-LD mirror |
| `<link rel="author" href="…">` | HTML5 | `<page-info>` author link |

### Temporal

| Field | Source | Consumers |
|---|---|---|
| `<meta name="last-modified" content="YYYY-MM-DD">` | HTML convention | `<page-info>` "Updated" line, `<page-stats>` last-modified line, signed canonical document |
| `<meta property="article:published_time" content="ISO-8601">` | Open Graph Article | JSON-LD `datePublished` |
| `<meta property="article:modified_time" content="ISO-8601">` | Open Graph Article | JSON-LD `dateModified` |

### Classification

| Field | Source | Consumers |
|---|---|---|
| `<meta name="keywords" content="term, term, …">` | HTML5 | `<page-info>` keywords line, signed canonical document |
| `<meta property="article:tag" content="…">` (repeated) | Open Graph Article | crawlers and social tools (no VB reader) |

**Not implemented:** cross-page aggregation of `keywords` or `article:tag`. `<site-index>` enhances an authored index (or one loaded from its `src` JSON) and does not read page meta tags. A build step that wants a keyword index writes that markup or JSON itself.

### License

| Field | Source | Consumers |
|---|---|---|
| `<meta name="license" content="CC BY 4.0">` | De facto web | `<page-info>` license line |
| `<link rel="license" href="…">` | HTML5 | `<page-info>` license link |

### Version

| Field | Source | Consumers |
|---|---|---|
| `<meta itemprop="version" content="1.4.0">` | Microdata | `<page-info>` version line, signed canonical document |

**Not implemented:** `<time-index>` does not read `last-modified` or `itemprop="version"`. It groups by the version marked on each of its own entries, and its recently-updated feed comes from the JSON named by `updates-src`.

### Social preview

| Field | Source | Consumers |
|---|---|---|
| `<meta property="og:title" content="…">` | Open Graph | social previews (no VB reader) |
| `<meta property="og:description" content="…">` | Open Graph | same |
| `<meta property="og:image" content="…">` | Open Graph | same |
| `<meta property="og:type" content="article">` | Open Graph | same |

### JSON-LD mirror

Publishers SHOULD emit a `<script type="application/ld+json">` containing a Schema.org `Article` or `TechArticle` object. The object is the canonical machine-readable representation for crawlers and other tools, and should mirror all of the above plus provenance extensions. Example in §D.

**Not implemented:** no VB component reads JSON-LD. Components read the meta tags, links and attributes in this contract; the publisher keeps the JSON-LD block in step with them.

---

## Section B — `vb:*` namespace (VB-private extensions)

VB-specific fields with no adequate public equivalent. The namespace is **shared with the analytics subsystem**, which reads `document.querySelectorAll('meta[name^="vb:"]')` and folds all `vb:*` tags into its event envelope.

### Provenance & trust

| Field | Values | JSON-LD mirror | Consumers |
|---|---|---|---|
| `<meta name="vb:provenance" content="…">` | `human`, `ai-assisted`, `ai-generated` (core); `translated`, `synthesized`, `migrated` (extensions, space-separated to compose) | `creditText` (rendered to human-readable) | `<page-info>`, `<trust-filter>` lens |
| `<meta name="vb:review" content="…">` | `unreviewed`, `fact-checked`, `editor-reviewed` | `additionalProperty` | `<page-info>` |
| `<meta name="vb:status" content="…">` | `draft`, `published`, `archived` | `creativeWorkStatus` | `<page-info>`, default view filtering |
| `<meta name="vb:ai-tools" content="Claude, GPT-5, …">` | Comma-separated tool names | `additionalProperty` | `<page-info>` "How this was made" section |

**Defaults if absent:** `vb:provenance` defaults to `human`. `vb:review` defaults to `unreviewed`. `vb:status` defaults to `published`. Absence is never a badge — badges only render for non-default values unless `.labeled` is applied.

### Concept taxonomy (shared with analytics)

Pages declare their topics as a list of SKOS concept IDs that resolve against the site's `vocabulary.json`. Each concept ID is emitted as a separate `<meta name="concept">` tag (repeating allowed) and as a `<link rel="tag">` pointing to the concept's topic detail page.

| Field | Values | JSON-LD mirror | Consumers |
|---|---|---|---|
| `<meta name="concept" content="data-provenance">` (repeated) | SKOS concept `@id` from `vocabulary.json` | `about` (array of `DefinedTerm`) | `<topic-map>`, topic-index lens, analytics envelope |
| `<link rel="tag" href="/topics/{id}">` (repeated) | URL of the topic detail page | — | crawlers, microformat consumers |
| `<link rel="glossary" href="/glossary">` | URL of the glossary page | — | hint to clients/crawlers |

Concept IDs are flat slugs (kebab-case). Hierarchy is expressed in `vocabulary.json` via `skos:broader` / `skos:narrower` rather than in the meta-tag value. A page may declare multiple concepts; the order is the author's preferred relevance order.

**Replaced fields (v1.0 → v1.1):** `<meta name="vb:topic" content="a.b.c">` and the analogous `topic:` frontmatter key are removed. Consumers that previously parsed dotted paths should read `concept` meta tags and resolve hierarchy from `vocabulary.json`.

### Version reference

| Field | Values | Consumers |
|---|---|---|
| `<meta name="vb:version-url" content="/changelog#v1-4-0">` | URL to changelog entry for this page's version | `<page-info>` version link — links out to the changelog's anchor for this version |
| `<meta name="vb:versions-manifest" content="/data/versions/page-id.json">` | URL of a JSON manifest listing every version of this page (release versions or per-page edit history) | `<version-switcher>` data-source fallback — fetched when no inline `data-versions` is provided |

No public equivalent exists for "link from a page to its release record." `vb:version-url` complements the open-standard `meta[itemprop="version"]` (the semver) with the anchor.

`vb:versions-manifest` is the index complement to `vb:version`: where `vb:version` declares the *current* version of this URL, `vb:versions-manifest` points at the list of *all* versions. The manifest schema is documented in `<version-switcher>`'s reference (`{ id, label?, url?, date?, author?, summary?, archived?, draft?, current?, versionUrl? }[]`).

### Content integrity (signing)

| Field | Values | Consumers |
|---|---|---|
| `<meta name="vb:hash" content="sha256-…">` | Base64 SHA-256 of the canonical document. Optional. | `<page-info>` verifier, external tools |
| `<meta name="vb:signature" content="…">` | Base64 ECDSA signature over the canonical document | `<page-info>` verifier |
| `<meta name="vb:signature-algorithm" content="ECDSA-P256-SHA256">` | Algorithm identifier | `<page-info>` verifier |
| `<link rel="author-key" href="/.well-known/content-keys/…jwk" data-key-id="…">` | Pointer to signing key (JWK). Must resolve to the page's own origin. | `<page-info>` verifier |

**Verifier rules.** The `<page-info>` verifier applies these in order and stops at the first that fails:

1. `vb:signature-algorithm`, when present, must be `ECDSA-P256-SHA256` (else `failed`, reason `unsupported-algorithm:…`).
2. `link rel="author-key"` must be present (else `failed`, reason `missing-author-key`).
3. The key URL, resolved against the document base, must have the same origin as the page (else `failed`, reason `key-origin`). A cross-origin key is not fetched. This contract defines no mechanism for allowing another origin.
4. The key must be fetchable and importable (else `key-unavailable`).
5. The key must not be expired per §E (else `failed`, reason `key-expired`).
6. `vb:hash`, when present, must equal `sha256-` plus the base64 SHA-256 of the canonical document (else `failed`, reason `hash-mismatch`). The signature covers the same bytes, so the hash adds no security of its own; it lets tools without the key compare a page against a known value.
7. The signature must verify over the canonical document (else `failed`, reason `mismatch`).

The `link rel="author-key"` claims the rel name for this purpose. See `canonical-document-v1.md` (Stage 3) for canonicalization rules. The `.well-known/content-keys/*.jwk` and `.well-known/content-authenticity.json` files are described in §E.

### Already-claimed (co-owned with analytics)

| Field | Documented in |
|---|---|
| `vb:persona`, `vb:activity`, `vb:content`, `vb:stage`, `vb:series` | `admin/r-n-d/analytics/analytics-spec.md` |

These are available for lens components to consume but are **owned by the analytics subsystem**, not the provenance initiative. Changes to their vocabulary belong in the analytics spec.

### Reading-history switches (configuration, not taxonomy)

| Field | Values | Consumer |
|---|---|---|
| `vb:track-history` | `on` | `src/utils/recently-visited-init.js` — opts the page in to local reading history (a `<recently-visited>` on the page also opts in) |
| `vb:track-history-params` | space-separated query parameter names | same — query strings are stripped unless listed here |
| `vb:no-track-history` | any | same — this page is never recorded |

`<html data-vb-no-track>` also blocks recording site-wide. These are runtime switches: analytics excludes them from its event taxonomy.

---

## Section C — DOM attributes (not meta tags)

Applied to block-level content elements (articles, sections, asides), sometimes to inline elements. Three orthogonal dimensions:

| Attribute | Answers | Example | Controlled by |
|---|---|---|---|
| `data-author` | Who made this specific edit? | `<ins data-author="tpowell">fix</ins>` | Free-form person identifier |
| `data-provenance` | How was this content made? | `<article data-provenance="ai-assisted">` | Vocabulary as in §B `vb:provenance` |
| `data-review` | What review did it receive? | `<article data-review="fact-checked">` | Vocabulary as in §B `vb:review` |
| `data-status` | What's its publication state? | `<article data-status="draft">` | Vocabulary as in §B `vb:status` |
| `data-trust` | **Verification tier** (on `.page-info-badge` only) | `<span data-trust="verified">` | `undeclared`, `declared`, `verified`, `failed`, `key-unavailable` |

**`data-trust` is reserved for the verification badge.** Do not use it for authorship. Authorship is `data-provenance`. The two attributes answer different questions:
- `data-provenance` — claim about how the content was made (author-declared, unverifiable on its own)
- `data-trust` — verification result produced by the runtime (computed by `<page-info>` at connectedCallback)

**Space-separated composition** on `data-provenance` allows combining extension tokens with a core value:

```html
<article data-provenance="ai-generated translated">
```

CSS selectors use `[data-provenance~="ai-generated"]` to match individual tokens.

**Page-level defaults** can be declared on `<html data-provenance="…">`. Section-level declarations override the page default.

---

## Section D — Complete authored example

A single page demonstrating every field VB consumes:

```html
<!DOCTYPE html>
<html lang="en" data-provenance="ai-assisted" data-status="published">
<head>
  <meta charset="utf-8">
  <title>Migration Guide — Example Inc</title>

  <!-- Public standards (Section A) -->
  <meta name="author" content="Thomas A. Powell">
  <meta property="article:author" content="https://example.com/team/tpowell">
  <link rel="author" href="/team/tpowell">

  <meta name="last-modified" content="2026-02-20">
  <meta property="article:published_time" content="2026-01-10T00:00:00Z">
  <meta property="article:modified_time" content="2026-02-20T00:00:00Z">

  <meta name="keywords" content="migration, upgrade, node, api">
  <meta name="license" content="CC BY 4.0">
  <link rel="license" href="https://creativecommons.org/licenses/by/4.0/">
  <meta itemprop="version" content="2.1.0">

  <meta property="og:type" content="article">
  <meta property="og:title" content="Migration Guide">
  <meta property="og:description" content="How to upgrade to v2">
  <meta property="og:image" content="https://example.com/og/migration.jpg">

  <!-- VB namespace (Section B) -->
  <meta name="vb:provenance" content="ai-assisted">
  <meta name="vb:review" content="editor-reviewed">
  <meta name="vb:status" content="published">
  <meta name="vb:ai-tools" content="Claude Opus 4.7">
  <meta name="concept" content="migration">
  <meta name="concept" content="upgrade-guide">
  <link rel="tag" href="/topics/migration">
  <link rel="tag" href="/topics/upgrade-guide">
  <link rel="glossary" href="/glossary">
  <meta name="vb:version-url" content="/changelog#v2-1-0">
  <meta name="vb:versions-manifest" content="/data/versions/migration.json">

  <!-- Signing (Section B integrity) -->
  <meta name="vb:hash" content="sha256-abc123…">
  <meta name="vb:signature" content="MEUCIQC…">
  <meta name="vb:signature-algorithm" content="ECDSA-P256-SHA256">
  <link rel="author-key" href="/.well-known/content-keys/tpowell.jwk" data-key-id="tpowell-2026-01">

  <!-- JSON-LD mirror (Section A) -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "Migration Guide",
    "author": {
      "@type": "Person",
      "name": "Thomas A. Powell",
      "url": "https://example.com/team/tpowell"
    },
    "datePublished": "2026-01-10",
    "dateModified": "2026-02-20",
    "version": "2.1.0",
    "keywords": "migration, upgrade, node, api",
    "about": [
      { "@type": "DefinedTerm", "termCode": "migration", "inDefinedTermSet": "/vocabulary.json" },
      { "@type": "DefinedTerm", "termCode": "upgrade-guide", "inDefinedTermSet": "/vocabulary.json" }
    ],
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "creativeWorkStatus": "Published",
    "creditText": "AI-Assisted — Written with Claude Opus 4.7, reviewed by Thomas A. Powell",
    "additionalProperty": [
      { "@type": "PropertyValue", "name": "contentProvenance", "value": "ai-assisted" },
      { "@type": "PropertyValue", "name": "humanReview",       "value": "editor-reviewed" },
      { "@type": "PropertyValue", "name": "aiTools",           "value": "Claude Opus 4.7" }
    ]
  }
  </script>
</head>
<body>
  <article data-signable>
    <h1>Migration Guide</h1>

    <page-info>
      <!-- <page-info> renders its internal <dl> from the meta tags above
           when the auto attribute is set, or from its own light-DOM <dl> otherwise -->
    </page-info>

    <p>
      Upgrade to
      <del data-author="claude" data-reason="correction">Node.js 16</del>
      <ins data-author="tpowell" data-reason="review">Node.js 20 LTS</ins>
      or later.
    </p>
  </article>
</body>
</html>
```

---

## Section E — `.well-known/` infrastructure (for signing)

Publishers that sign content publish two files at the root of the domain:

### `/.well-known/content-keys/{author-id}.jwk`

A JSON Web Key (JWK) for the public half of the signing key. Example:

```json
{
  "kty": "EC",
  "crv": "P-256",
  "use": "sig",
  "kid": "tpowell-2026-01",
  "x": "…",
  "y": "…",
  "metadata": {
    "owner": "Thomas A. Powell",
    "domain": "example.com",
    "created": "2026-01-01",
    "expires": "2027-01-01",
    "contact": "https://example.com/team/tpowell"
  }
}
```

The verifier reads `kty`, `crv`, `x`, `y` and `use` to import the key, and `metadata.expires` to decide whether it is still valid. `metadata.expires` is an ISO-8601 date or timestamp; a date-only value means 00:00 UTC at the start of that day. The key is expired when the verifier's clock is at or past that instant (signing time is not recorded, so it is not considered). A key with no `metadata.expires` does not expire; a value that does not parse as a date is treated as expired. The other `metadata` fields are informational and are not checked.

The key file must be served from the same origin as the pages it signs.

### `/.well-known/content-authenticity.json`

A discovery document for crawlers and tools. No VB component reads it, and listing a key here does not make a cross-origin key acceptable to the verifier:

```json
{
  "version": "1.0",
  "publisher": {
    "name": "Example Inc",
    "url": "https://example.com",
    "contact": "trust@example.com"
  },
  "keys": [
    {
      "id": "tpowell-2026-01",
      "owner": "Thomas A. Powell",
      "url": "/.well-known/content-keys/tpowell.jwk",
      "active": true
    }
  ],
  "provenancePolicy": "https://example.com/editorial/ai-policy",
  "algorithmSupport": ["ECDSA-P256-SHA256"]
}
```

---

## Section F — What this contract does NOT cover

- **Canonicalization rules.** See `canonical-document-v1.md` (Stage 3 deliverable).
- **Signing workflows.** See the Stage 4 signing reference script. This contract defines only the meta tags the signer writes and the verifier reads.
- **Authoring UI.** VanillaPress and other CMSes ship their own editor UIs.
- **C2PA interop.** Tracked in the standards watch list — see the project-stance doc.

---

## Section G — Versioning

This contract is **v1.2**. Field additions that are backward-compatible (new optional `vb:*` keys, new tokens in existing vocabularies) increment the minor version. Renames, removals, and re-meanings of tokens normally require a new major version (`v2`); v1.1's removal of `vb:topic` is the one pre-release exception, taken under the adoption decision recorded in `admin/r-n-d/evaluate/decisions.md` while the consumer surface is small enough that no compat shim is warranted.

VB components read v1.x indefinitely unless explicitly updated. A future v2 reader must detect and support v1.x documents for at least one major release cycle.

### Changelog

- **v1.2 (2026-11-14)** — Brought the contract in line with the code. Consumers corrected: no component reads JSON-LD (it is a mirror for external tools); `article:tag` has no VB reader; `<site-index>` does not aggregate `keywords`/`article:tag`; `<time-index>` does not read `last-modified` or `itemprop="version"`; `<page-stats>` added as a `last-modified` reader. These are marked "Not implemented" in §A. Verifier rules added to §B: the author key must be same-origin with the page, `metadata.expires` in the JWK is enforced (§E defines its meaning), and `vb:hash` is checked when present. A page whose key link points at another origin, or whose key has expired, now reports `data-trust="failed"` where v1.1 readers reported `verified`. No field was added, renamed or removed.
- **v1.1 (2026-04-27)** — Replaced `vb:topic` (dotted-path string) with repeated `<meta name="concept">` resolving SKOS concept IDs against `vocabulary.json`. Added `<link rel="tag">` and `<link rel="glossary">`. Updated JSON-LD `about` to use `DefinedTerm` array. Source: SKOS Foundation bead (`vanilla-breeze-ii2k`).
- **v1.0 (2026-04-24)** — Initial contract.
