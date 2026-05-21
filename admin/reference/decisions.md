# Evaluate: Decisions

This file records standing decisions on the R&D specs in `admin/r-n-d/evaluate/`. Each spec links here from a `## Status` header so future readers know whether a spec is a green-light or still under review.

| Spec | Status | Decided | Notes |
|---|---|---|---|
| [glossary-system.md](../shipped/glossary-system.md) | **Adopted** | 2026-04-27 | SKOS Foundation + Glossary tracks (S1–S2) |
| [topic-index-system.md](../shipped/topic-index-system.md) | **Adopted** | 2026-04-27 | SKOS Topic Index + topic-map upgrade (S3–S4) |

---

## Decision: Adopt the SKOS vocabulary layer

**Stance.** Adopt both `glossary-system.md` and `topic-index-system.md` as written. SKOS is the right model and the project is in the right window to take it.

**Rationale.**

1. **The standard is sound.** SKOS is a W3C recommendation, JSON-LD compatible (so it composes with the JSON-LD already in `meta-tag-contract-v1.md`), and strictly more expressive than the dotted-path strings currently encoded in `<meta name="vb:topic">`. `topic-map` will get a real concept graph (`broader`/`narrower`/`related`) instead of string-split heuristics.
2. **Pre-release window.** Vanilla Breeze is pre-release; breaking changes are explicitly cheap right now (see `project_prerelease.md`). The doc corpus is small — five pages in `pages.json` as of this decision. The frontmatter migration touches a single-digit number of files.
3. **Cost grows with corpus.** Every page added before adoption is one more page to migrate later. Every consumer of the dotted-path `vb:topic` shape that ships before adoption is one more consumer to update. The window for clean adoption is now.
4. **No compat shims needed.** Pre-release status removes the usual reason to dual-emit `vb:topic` alongside `concepts: []`. Replace, don't bridge.

## Deltas vs current shipped state

| Concern | Today | Spec proposes |
|---|---|---|
| Glossary page | Handcrafted `site/src/pages/glossary/index.html` | Build-generated from `vocabulary.json` |
| Glossary enhancement | `glossary-index` web component (search + scroll-spy) | Keep enhancement; add vanilla `definition-popover.js` |
| Definitions data | Inline in glossary markup | `vocabulary.json` (SKOS source) → `definitions.json` (client cache) |
| Inline term refs | None | `<dfn><a data-concept="id">` first use, plain `<a data-concept>` after |
| Topic taxonomy | `<meta name="vb:topic">` single dotted path | `concepts: [id, …]` frontmatter array; flat SKOS IDs with `skos:broader` |
| Topic index page | None | `/topics/index.html` with multi-dim sort |
| Topic detail pages | None | `/topics/{slug}/index.html` per concept |
| Article tag footer | None (`rel="tag"` count = 0) | `<footer data-article-tags>` with `rel="tag"` |
| Page aggregation | `generate-pages-json.js` reads meta tags | Consumes `concepts:` array; feeds `topic-index.json` |
| Meta-tag contract | v1 stable; defines `vb:topic` only | Requires v1.1 revision |
| `topic-map` | Builds tree from dotted paths in `pages.json` | Consumes SKOS broader/narrower/related from `vocabulary.json` |

## Sequencing

Four sequence beads, no compat shims, no dual-emit window.

```
S1 (Foundation) ──┬─→ S2 (Glossary)
                  ├─→ S4 (topic-map upgrade) ──→ S3 (Topic Index)
                  └─→ S3 (Topic Index)
```

- **S1 — SKOS Foundation.** Author `vocabulary.json` from the existing handcrafted glossary (~20 seed concepts with broader/narrower/related where obvious). Revise `meta-tag-contract` to v1.1: replace `vb:topic` with `concepts: []` frontmatter + repeated `<meta name="concept">`. Migrate the five existing doc pages.
- **S2 — SKOS Glossary.** `definitions.json` generator, `definition-popover.js` (Popover API, feature-detect, sessionStorage cache), regenerated `/glossary` page from vocabulary, authoring pattern documented and proven on 1–2 pages.
- **S4 — `topic-map` SKOS upgrade.** Replace dotted-path tree builder with SKOS broader/narrower/related consumption. Includes the analytics `viewCount` contract definition that S3 also consumes.
- **S3 — SKOS Topic Index.** `<footer data-article-tags>` in default article layout, `topic-index.json` generator, `/topics/index.html` + `topic-sort.js`, `/topics/{slug}/index.html` detail pages.

S2 and S4 run in parallel after S1; S3 runs last because it consumes S4's analytics contract and the topic-map upgrade as its companion view.

## Spawned beads

Created from `vanilla-breeze-ba61` on 2026-04-27. See `bd show <id>` for current status and dependency edges.

- **S1** `vanilla-breeze-ii2k` — SKOS Foundation: vocabulary.json + meta-tag contract v1.1 + frontmatter migration
- **S2** `vanilla-breeze-05bu` — SKOS Glossary: generated `/glossary` + definition popover + authoring pattern (depends on S1)
- **S3** `vanilla-breeze-a84m` — SKOS Topic Index: `<footer data-article-tags>` + `topic-index.json` + `/topics` pages (depends on S1, S4)
- **S4** `vanilla-breeze-ihdx` — `topic-map` SKOS upgrade + analytics viewCount contract (depends on S1)

## Open dependencies

- **Analytics `viewCount` contract** is owned by S4 and consumed by S3. The analytics subsystem (Cloudflare Pages + D1 + Analytics Engine) exists but the spec's `viewCount` shape is not yet a defined output. S4 is the place to land that contract.
- **`meta-tag-contract` v1.1** is part of S1's scope. The `vb:topic` deprecation needs to be reflected in `admin/specs/meta-tag-contract-v1.md` (or a new `meta-tag-contract-v1-1.md`, decided during S1).
