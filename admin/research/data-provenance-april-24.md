# Data Provenance — State of Play, 24 Apr 2026

> Assessment snapshot + open-question inventory before any further build.
> Pairs with `admin/r-n-d/data-provenance/{document-provenance,page-info-provenance-spec,nav-content-patterns-spec}.md`.

---

## 1. What the three specs actually propose

The three documents under `admin/r-n-d/data-provenance/` describe one loose family of features but were written at different times with partially overlapping scope. Reading them side-by-side:

### `document-provenance.md`
- `data-trust` attribute with tokens: **human · ai-assisted · ai-generated · editor-reviewed · draft**
- Enhanced `<ins>` / `<del>` with block variant + `data-author`, `data-reason`, `data-ticket`
- `<change-set>` element (view toggle: tracking / final / original)
- `<page-meta>` component (JSON-LD injection from a `<dl>`)
- Three-phase delivery: CSS foundation → web components → JSON-LD/tooling
- Explicitly **out-of-scope**: server-side tracking, diff computation, crypto signing, C2PA/VC

### `page-info-provenance-spec.md`
- Much larger ambition: three additive layers (metadata → `<page-info>` → crypto verification)
- A different vocabulary for `data-trust` values: **undeclared · declared · domain-anchored · verified · failed · key-unavailable** (this is the *verification tier*, not authorship)
- A separate `content-provenance` vocabulary for authorship: **human · human-ai-assisted · ai-human-edited · ai-human-reviewed · ai-generated · synthesized · translated · migrated**
- ECDSA P-256 signing, `/.well-known/content-keys/{id}.jwk`, `/.well-known/content-authenticity.json`
- Canonical-document JSON for signing (`[data-signable]` descendants, normalized)
- `<page-info>` web component with `data-auto` rendering from `<meta>` tags

### `nav-content-patterns-spec.md`
- Four adjacent page types: **glossary · site-index · changelog/timeline · sitemap**
- Matching components: `glossary-index`, `site-index`, `time-index`, `site-map`
- Per-page **version history** `<aside>`, `<time data-relative>`, `/recently-updated.json`
- Shared concerns: CSS layer, URL conventions, `<link rel="glossary|index|sitemap">`, RSS

The three documents treat each other as loose neighbours rather than a single coherent system. They overlap on: (a) `data-trust`, (b) the `page-meta` / `page-info` component(s), (c) `<time>` relative rendering, (d) version tags that link back to a changelog.

---

## 2. What already exists in the codebase

Considerably more than the specs assume. The following are **registered, non-stub** implementations today:

| Area | Where it lives | Status |
|---|---|---|
| Doc site build | `site/` runs on **Cook SSG 2.1.0** (not 11ty, contrary to an earlier mis-survey). Publishes locally to vb.test and live to vanilla-breeze.com on Cloudflare. | ✅ live |
| `@layer` order (`tokens, reset, native-elements, custom-elements, web-components, utils, bundle-theme, bundle-effects, bundle-components`) | `src/main.css`, `src/main-core.css` | ✅ canonical |
| `<ins>` / `<del>` styling incl. `.block`, `data-author`, `data-reason` | `src/native-elements/inline-semantics/styles.css` | ✅ shipped |
| `<time>` incl. `.relative`, `[data-badge]`, `data-relative` | same file | ✅ shipped |
| `<dfn>` / `<abbr>` / `<dl>` (+ `data-striped`) | `inline-semantics/styles.css`, `lists/styles.css` | ✅ shipped |
| `[data-trust]` element styling with `human / ai-assisted / ai-generated / editor-reviewed / draft` and `.labeled` | `src/native-elements/provenance/styles.css` | ✅ shipped — matches `document-provenance.md` vocabulary |
| `native-elements/glossary/` · `timeline/` · `sitemap/` · `site-index/` styles | each has `styles.css` | ✅ at least base layer |
| `<page-meta>` (218 lines? no — 102 lines logic) | `src/web-components/page-meta/` | ✅ registered |
| `<page-info>` (218 lines logic) | `src/web-components/page-info/` | ✅ registered |
| `<change-set>` (95 lines) | `src/web-components/change-set/` | ✅ registered |
| `<time-index>` (138), `<glossary-index>` (117), `<site-index>` (418), `<site-map>` (143), `<site-map-wc>` variant | each in `src/web-components/…/` | ✅ registered |
| Adjacent: `<heading-links>`, `<foot-notes>`, `<page-toc>`, `<page-stats>`, `<page-tools>` | `src/web-components/` | ✅ registered |
| Token coverage: `--color-{success,warning,error,info,interactive,surface-raised,text-muted,border,…}`, full `--size-*`, full `--radius-*` | `src/tokens/*.css` | ✅ complete |
| Conformance rules | `scripts/quality/vb-conformance.js` | ✅ in CI |

### What is **not** present
- `data-provenance`, `data-signable`, `content-provenance` / `ai-tools` / `human-review` `<meta>` tags, `<link rel="author-key">`, `/.well-known/content-keys/*`, `/.well-known/content-authenticity.json` — nothing yet
- No site-wide changelog page, glossary page, HTML sitemap page, or keyword index page in `site/src/pages/`
- No 11ty frontmatter pipeline for `lastModified`, `version`, `authors`, `keywords`, `provenance`
- No RSS/Atom feed output
- No crypto signing tool / build step

### Open beads already tied to this area
- `vanilla-breeze-17mt` (P3, task) — "Improve data-trust attribute and related trust/provenance features"
- `vanilla-breeze-28id` (P3, feature, ready) — "Add JSON-LD structured data support"
- `vanilla-breeze-bknc` (P3, feature, ready) — "Add RSS/Atom feed for changelog"

---

## 3. The conflicts & decisions the specs leave open

Listed as a **design tree** — each node is a decision, children depend on the parent. I will walk these with you one-by-one after this overview.

```
ROOT  What does "provenance" mean in VB and how much of it ships?
│
├── A. Component identity
│     page-meta vs. page-info — same job, two components, both registered today.
│     Merge into one? Keep both with a clear distinction? Rename?
│
├── B. `data-trust` attribute — one dimension or two?
│     • "authorship quality" (human / ai-assisted / ai-generated / editor-reviewed / draft)
│     • "verification tier"  (undeclared / declared / domain-anchored / verified / failed)
│     Spec 1 uses the first. Spec 2 uses the second. Both on the same attribute.
│     → Decide whether to split into `data-trust` (authorship) + `data-verified` (tier),
│       or collapse one of them, or add a third `data-provenance` for authorship.
│
├── C. Authorship vocabulary — which list is canonical?
│     Spec 1: 5 tokens.  Spec 2: 8 tokens incl. synthesized/translated/migrated.
│     → Choose one OR declare a minimal core + optional extended.
│
├── D. Cryptographic signing — in scope for VB, or out?
│     Spec 1 explicitly excludes it. Spec 2 builds a full ECDSA + .well-known pipeline.
│     → A framework-level "no" is legitimate. A "yes" is a multi-quarter commitment
│       (signing tool, CMS hooks, key rotation, failure-state UI).
│
│   └── D1 (if yes). Canonical-document format
│         Spec 2's "concatenate [data-signable] textContent with normalized whitespace"
│         is fragile. Alternatives: stable-stringified JSON from the CMS,
│         a separate `.sig.json` sidecar, or hash-of-pre-rendered-HTML.
│
│   └── D2 (if yes). Who signs, where does the private key live?
│         Build tool? CMS? Author laptop? This drives the whole developer workflow.
│
├── E. CMS / authoring boundary
│     All three specs assume a CMS that knows frontmatter. VB's 11ty site currently
│     has essentially no frontmatter data pipeline.
│     → Decide: is VB (a) a library that ships components others wire up, or
│       (b) also an opinionated 11ty starter with data conventions baked in?
│
├── F. Navigation-pattern pages — part of provenance initiative or parallel?
│     nav-content-patterns-spec (glossary / index / changelog / sitemap) is mostly
│     independent of trust, but shares <time>, version tags, link-rel conventions,
│     and is what you'd use to *consume* a signing/version infrastructure.
│     → Bundle or ship as its own track?
│
├── G. Reconcile existing components vs. spec text
│     5 of the 8 components the specs describe already exist. What the 218 lines
│     of page-info.js actually do may or may not match the spec. Same for others.
│     → Audit pass: for each component, write "spec says X / code does Y / delta is Z".
│     This must happen before anyone rewrites anything.
│
├── H. Dogfood on vb.test itself?
│     VB's doc site has no glossary, no changelog, no HTML sitemap, no page-info block.
│     The strongest spec validation would be: ship it on ourselves first.
│     → In scope for this initiative, or explicit follow-up?
│
└── I. Open standards stance
      C2PA, W3C Verifiable Credentials, Content Authenticity Initiative — all moving.
      Spec 1 says "monitor, don't build". Spec 2 designs an independent system.
      → Where does VB sit on the "invent vs. wait" continuum?
```

Dependency order (approximately):
`G` must happen first (inventory) — without it every other decision is hypothetical.
`A → B → C` is one chain (component shape → attribute shape → vocabulary).
`D → D1 → D2` is the crypto sub-tree, independent of A/B/C but depends on `E`.
`E → F → H` is the authoring/surface chain.
`I` is a stance question that colours `D` and `C`.

---

## 4. Decisions

Resolved one-by-one through a walked-tree interview on 2026-04-24. Entries below are in the order decisions were made (not the logical dependency order). Logical reading order for someone picking this up cold:

1. **G** (audit first?) — No
2. **E** (CMS / authoring boundary) — strict library, sibling-stack dogfood
3. **A** (page-meta vs page-info) — collapse to `<page-info>`
4. **B** (data-trust overload) — three attributes: `data-author` / `data-provenance` / `data-trust`
5. **C** (vocabulary) — core + extensions + separate `data-review` / `data-status`
6. **D** (crypto scope) — D-2 shipped, D-3 reference signer for demo/agency
7. **Meta-tag namespace** — public-first, `vb:*` private
8. **F** (nav patterns) — reframed into lens architecture with metadata substrate
9. **F-1** (data contract) — HTML or JSON, both supported
10. **F-2** (engagement) — device-local + aggregated, layered
11. **F-3** (engagement in page-info) — author opt-in, default off
12. **H** (dogfood plan and cutoff) — all 7 stages through Stage 6
13. **I** (standards stance) — I-3: map externally, build core, watch list

---

### G — Audit first? **No.**
Treat existing code as the trunk ("mostly correct, with gaps"); treat the three specs as incomplete visions we're extending. Reconciliation happens during implementation, not before design.

### B — `data-trust` overload? **Split into three attributes.**
- `data-author` → WHO made this edit (person ID, free-form). Already shipped on `<ins>`/`<del>`. Unchanged.
- `data-provenance` → HOW the content was made (controlled vocabulary, to be finalized in C). **Rename** current `native-elements/provenance/styles.css` selectors from `[data-trust]` to `[data-provenance]`.
- `data-trust` → VERIFICATION state of the rendered content (`undeclared | declared | domain-anchored | verified | failed | key-unavailable`). Keep the existing `page-info/styles.css` + `logic.js` usage; that code is already correct for this role.
- Each attribute answers exactly one question. They compose without collision.
- Doc note: "provenance" is uncommon. Mitigate via existing `.labeled` badges (reader sees "AI-Assisted", never the word "provenance") and by naming the doc section "Content Trust" / "How was this made" with `data-provenance` as the implementation detail.

### C — `data-provenance` vocabulary? **C-3: core + extensions + split off status/review.**

**`data-provenance` core** (small, author picks one as the primary):
- `human`, `ai-assisted`, `ai-generated`

**`data-provenance` extensions** (composable via space-separated tokens; kept in core because corporate sites commonly translate):
- `translated`, `synthesized`, `migrated`

**`data-review`** (new, orthogonal):
- `unreviewed` (default if absent), `fact-checked`, `editor-reviewed`

**`data-status`** (new, orthogonal):
- `draft`, `published` (default if absent), `archived`

Breaking changes to ship:
- `data-provenance="editor-reviewed"` → `data-review="editor-reviewed"` (rename in CSS, any demos)
- `data-provenance="draft"` → `data-status="draft"` (same)
- Rationale: `editor-reviewed` and `draft` never belonged on the same axis as `ai-generated`.

### D — Crypto signing? **D-2 as shipped contract, light D-3 reference signer for agency/demo use.**

**What VB ships (the contract):**
- Verifier inside `<page-info>` — Web Crypto ECDSA-P256 SHA-256, reads `meta[name="content-signature"]` + `link[rel="author-key"]`
- A published **canonicalization JS helper** that *both* signers and verifiers import, byte-for-byte identical output. This is the load-bearing piece that keeps the ecosystem from fragmenting.
- A canonicalization format spec (`admin/specs/canonical-document-v1.md`, semver'd, breaking changes require a new version)
- Full trust-tier UI including `failed` and `key-unavailable` states
- `.well-known/content-keys/*.jwk` + `content-authenticity.json` format documentation

**What VB does NOT ship as a product:**
- A CLI signing tool
- CMS/build integrations beyond the demo
- Key custody tooling

**What VB ships as a demo/reference (not a product):**
- A basic Node signing script under `scripts/` (used to sign vb.test itself, and as a copy-paste reference for Pint's corporate clients)
- Example workflow doc showing how to wire the signer into an 11ty/Astro/whatever build

**Context:** the project is "general for release, internal for use." Corporate customers will typically have the agency (Pint), themselves, or a hired party run the signer — so shipping one as a VB product would be overreach. But having a working reference implementation is necessary both for the demo and for agency delivery.

**Sub-decision deferred (not now): D1 — exact canonical-document format.** The format is a load-bearing spec commitment once published, so it needs its own design pass before signing code is written. Open questions include how to encode block structure, whether deleted text (`<del>`) is part of the canonical form, and Unicode normalization rules.

### E — CMS / authoring boundary? **E-1 (strict library) + staged dogfood in sibling stacks.**

**VB core ships the contract only:**
- Components (`<page-info>`, `<change-set>`, etc.) must work on pure static HTML with hand-authored `<meta>` tags and `<dl>` structures.
- VB publishes the meta-tag contract, the `<page-info>` `<dl>` shape, the canonicalization format spec, and the canonicalization JS helper.
- VB does **not** ship an 11ty integration, a Cook SSG integration, or a VanillaPress integration from within this repo.

**The meta-tag contract (see revised contract in "Meta-tag namespace" decision below).**

**Validation is progressive enhancement at the stack level:**

| Layer | Owner | Test site |
|---|---|---|
| 0. Static HTML with hand-authored meta tags | VB | doc examples in `site/` |
| 1. SSG (Cook SSG) generates markup from frontmatter | Cook SSG + optional `cook-ssg-provenance` sibling plugin | vanilla-breeze.com (live on Cloudflare) |
| 2. CMS (VanillaPress) with editor UI + signing | VanillaPress + optional `vanillapress-provenance` sibling plugin | thomasapowell.com |

Each layer validates the ones beneath it. Layer 0 is always the fallback — VB stands alone.

**Plugins live in separate sibling repos**, not inside `vanilla-breeze`. They share the canonicalization helper VB exports. Created only if concrete pain justifies the organizational overhead.

### F — Nav patterns as a separate track? **Reframed: there is no separate track.**

The premise was wrong. Reading the actual shipped doc pages on vanilla-breeze.com and the `-index` / `-map` / meta component family, the codebase already treats each of these as **one lens over structured content**. Provenance is not a parallel system — it is **one field family in a single metadata substrate that every lens can consume**.

**Architectural commitments:**

1. **Reader sovereignty principle.** *The author defines the exposed view; the reader always has the right to reframe. Even where controls aren't offered, "the nature of the web always allows them to change it"* — so every lens must expose its underlying data (JSON endpoint, JSON-LD, or queryable DOM), not just render pixels.

2. **Metadata substrate (canonical fields, site-wide).**
   - **identity** — author(s), author-url, avatar
   - **temporal** — datePublished, dateModified, version, versionUrl
   - **topic** — keywords[], topic-hierarchy (dotted path)
   - **provenance** — `data-provenance`, `data-review`, `data-status`, ai-tools
   - **integrity** — content-hash, content-signature, signature-algorithm, author-key
   - **engagement** — reading-time, word-count (deterministic); rating (via `<star-rating readonly>`); popularity (site-aggregated, requires a service — scope deferred); device-local analytics (via `<analytics-panel>`, explicitly reader-scoped, not aggregated)
   - **annotation** — reader-contributed via `<review-surface>` (a different layer, surfaces into the `<page-info>` panel if the author opts in)
   - **license** — license, license-url

3. **Lens catalogue (prescriptive components, extended from current).**
   - **Shipped:** `<page-info>`, `<page-meta>` (to retire per A), `<time-index>`, `<site-index>`, `<glossary-index>`, `<site-map>`, `<page-toc>`, `<change-set>`, `<foot-notes>`, `<heading-links>`, `<page-stats>`
   - **Near-term first-party additions:** `<author-index>` (author lens), `<topic-map>` (hierarchical/cluster topic lens), `<trust-filter>` (provenance lens — "show me all AI-generated pages"), `<rating-index>` (aggregated rating lens if/when service exists), `<recently-visited>` (device-local reader history lens via the existing analytics layer)

4. **Universal host: `<content-lens>` (attribute-switchable, reader-controllable).** Matches the `<layout-switcher>` precedent to the layout-family. `<content-lens>` wraps a set of lens components (or consumes a JSON source) and exposes reader controls to switch views. Attribute convention mirrors `data-layout-*`: `data-lens="time|keyword|author|topic|trust|rating"`, `data-lens-default="…"`, `data-lens-controls="on|off"`, `data-lens-src="/pages.json"`.

5. **Provenance slots in as one field family, not a separate track.** Everything in the trust/signing work is now "additional metadata fields that lenses can optionally expose and filter on." The changelog isn't paired with provenance — it's the time-lens consuming `lastModified` and `version`.

### F-1 — Lens data contract? **F-1c: HTML or JSON, both supported.**
- Lens components accept HTML light-DOM (current pattern) for hand-authored sites with no-JS fallback.
- Lens components accept `data-lens-src` (or equivalent) JSON URL for hydrated/switchable use.
- If both are present, HTML is the no-JS fallback and JSON is the hydrated source.
- `<content-lens>` universal host requires JSON (can't switch lenses on hand-authored HTML).

### F-2 — Engagement: device-local vs aggregated? **Both, layered.**
- Aggregated analytics is **already in flight** at `admin/r-n-d/analytics/analytics-master.md` (v0.2). Cloudflare Pages Functions + D1 + Workers Analytics Engine. Endpoints under `functions/api/analytics/*`. Not a deferred future track — actively being built.
- Device-local reader history (via `<analytics-panel>`) ships first as a clear, self-explanatory lens. Reader can clear / opt-out.
- Aggregated lens (`<popularity-index>` / `<rating-index>`) consumes the analytics endpoint when its API is stable. Same component family, different data source.

### F-3 — Engagement in `<page-info>`? **Author opt-in, default off.**
- `<page-info>` gains an optional engagement section (rating via `<star-rating readonly>`, reader-comment count via `<review-surface>`, view-count from analytics if present).
- Default is **collect-don't-expose** — most authors will want analytics gathered without surfacing the numbers to readers.
- Opt-in via attribute, e.g. `<page-info show-engagement="rating views">` (compose which signals to surface).

### Meta-tag namespace — **public-first, `vb:*` only for private extensions.**

**Rule:** adopt the public name when one exists (for interop with crawlers, social tools, Schema.org, etc.). Use `vb:*` only for VB-specific fields with no good public equivalent. JSON-LD is the canonical machine-readable mirror of everything.

**Public names — adopted directly:**
- `meta[name="author"]`, `meta[property="article:author"]`, `link[rel="author"]`
- `meta[property="article:published_time"]`, `meta[property="article:modified_time"]`, `meta[name="last-modified"]`
- `meta[name="keywords"]`, `meta[name="license"]`, `link[rel="license"]`
- `meta[itemprop="version"]` (Microdata) — content semver
- `meta[property="og:*"]` — social preview
- `<script type="application/ld+json">` — Schema.org `Article` / `TechArticle` with `author`, `datePublished`, `dateModified`, `version`, `keywords`, `about`, `creditText`, `creativeWorkStatus`, `license`, etc.

**`vb:*` namespace — VB-private, automatically picked up by the existing `document.querySelectorAll('meta[name^="vb:"]')` analytics reader:**
- `vb:provenance` — authorship provenance vocabulary (mirrored into JSON-LD `creditText`)
- `vb:review` — review level (mirrored into JSON-LD `additionalProperty`)
- `vb:status` — content status (mirrored into JSON-LD `creativeWorkStatus`)
- `vb:ai-tools` — comma-separated tool names (mirrored into JSON-LD `additionalProperty`)
- `vb:topic` — **shared with analytics taxonomy**, dotted-path hierarchy allowed (mirrored into JSON-LD `about`)
- `vb:version-url` — link to changelog entry (no public equivalent)
- `vb:hash`, `vb:signature`, `vb:signature-algorithm` — content integrity (renamed from `vb:content-*` to avoid prefix collision with analytics's `vb:content="tutorial"` usage)

**Already-claimed `vb:*` taxonomy (co-owned with analytics subsystem):**
- `vb:persona`, `vb:activity`, `vb:content`, `vb:stage`, `vb:series` — from `admin/r-n-d/analytics/analytics-spec.md`. These exist today as optional analytics dimensions. They are *available* for lens components to consume but are not owned by the provenance initiative.

**`link[rel="author-key"]`** — claims the rel name for JWK pointer.

### H — Dogfood plan and "shipped" cutoff? **All 7 stages. Pre-release means we go the distance.**

**Terminology lock:** `vb.test` is the local-published Cook SSG build; `vanilla-breeze.com` is the same Cook SSG site published to Cloudflare. Same site, two environments. I'll stop alternating names.

**Priority order and bead map:**

| Stage | Bead | Priority | Depends on | Summary |
|---|---|---|---|---|
| 0 — cleanup + contract spec | **`vanilla-breeze-y9ka`** | P1 | — | Retire `<page-meta>`; rename `data-trust` → `data-provenance`; move `editor-reviewed`/`draft` off; publish `admin/specs/meta-tag-contract-v1.md` |
| 1 — layer-0 static proof | **`vanilla-breeze-s7ie`** | P2 | `y9ka` | Hand-authored static page demonstrating `<page-info>` with zero SSG help |
| 2 — Cook SSG pipeline + site lenses | **`vanilla-breeze-8osc`** | P2 | `s7ie` | Frontmatter → meta tags + JSON-LD; `/changelog/`, `/glossary/`, `/sitemap/`, `/index/` pages; `<page-info>` on every doc page. Absorbs old `28id` (JSON-LD) work. |
| 3 — canonical-document format spec v1 | **`vanilla-breeze-6py9`** | P2 | — | `admin/specs/canonical-document-v1.md` + `src/lib/canonicalize.js` shared helper |
| 4 — signing + live verification | **`vanilla-breeze-ue8h`** | P2 | `6py9`, `8osc` | `scripts/sign-pages.js`; `.well-known/content-keys/vb-release.jwk` + `content-authenticity.json`; CI gate; `<page-info>` verifier fully wired |
| 5 — VanillaPress on thomasapowell.com | **`vanilla-breeze-t1eo`** | P3 | `ue8h` | External sibling repo `vanillapress-provenance`; CMS dogfood. |
| 6 — lens extensions + `<content-lens>` | **`vanilla-breeze-rmoi`** | P3 | `8osc` | `<author-index>`, `<topic-map>`, `<trust-filter>`, `<recently-visited>`, `<popularity-index>`, `<content-lens>` universal host |
| — RSS/Atom feed for changelog | **`vanilla-breeze-bknc`** | P3 | `8osc` | Pre-existing bead, now a follow-up to Stage 2 |

**Migrated / closed:**
- `vanilla-breeze-17mt` (data-trust improvement) — **closed**, superseded by Stage 0.
- `vanilla-breeze-28id` (JSON-LD) — **closed**, absorbed into Stage 2.

**Shipped definition:** all of Stages 0–6 complete, including Stage 5 (VanillaPress/thomasapowell.com) and Stage 6 (lens extensions). Pre-release status means we extend rather than truncate.

### I — Open-standards stance? **I-3: map externally, build our own format for the signing core. Watch, don't wait.**

Stance statement (to be published as `admin/specs/project-stance.md` alongside the canonical-document spec):

> VB builds its own minimal, web-native content-signing format because existing standards (C2PA, Verifiable Credentials) are too heavy or too immature for HTML-first signing. VB maps all external-facing metadata to Schema.org / JSON-LD / OG, and intends to add a C2PA adapter once the standard has mature HTML bindings. The VB format is a floor, not a ceiling.

**Dedicated standards watch list** (to be included in `admin/specs/canonical-document-v1.md`, with periodic review built into whoever owns provenance):

- **C2PA (Coalition for Content Provenance and Authenticity)** — https://c2pa.org/ — binary JUMBF format, designed for images/video; monitor for official HTML bindings.
- **W3C Verifiable Credentials** — https://www.w3.org/TR/vc-data-model-2.0/ — general-purpose credential framework; monitor for content-provenance profiles.
- **Schema.org `creditText` / `creativeWorkStatus` / `additionalProperty`** — https://schema.org/Article — we already map to this; monitor for provenance-specific property additions.
- **Content Authenticity Initiative** — https://contentauthenticity.org/ — C2PA's advocacy arm; monitor for tooling ecosystem signals.
- **IETF HTTP Message Signatures (RFC 9421)** — https://www.rfc-editor.org/rfc/rfc9421 — not a direct fit, but worth watching for in-transit integrity patterns that could complement our at-rest signatures.

**Review model for Stage 3** (canonical-document format spec): collaborative draft — AI drafts, user (tpowell) reviews heavily, no outside reviewers. This is the load-bearing spec so iteration happens in-depth between the two of us before Stage 4 code begins.

### A — `page-meta` vs `page-info`? **Collapse to one: `<page-info>`.**
- `<page-meta>` is retired. The name "meta" collides with HTML `<meta>` and adds no clarity.
- `<page-info>` carries all of: author, dates, version, keywords, license, trust/provenance, sources, verification.
- **Granularity is determined by the content the author supplies, not by component identity** — same way photo EXIF has a minimal always-present core (date, format) and expands from there. A `<page-info>` with only `<time>` inside is valid; one with full trust + sources + verification is also valid.
- Migration cost: retire `src/web-components/page-meta/` (4 files, 102 lines logic), update any demos/docs that reference it.

---

## 5. Proposed interview order

I will start at the trunk and walk down:

1. **G — Inventory audit** (what does the code actually do today?)
2. **A — Component identity** (`page-meta` vs `page-info`)
3. **B — `data-trust` dimension split**
4. **C — Authorship vocabulary**
5. **D — Crypto scope in / out**, then D1/D2 only if in
6. **E — CMS / authoring boundary**
7. **F — Nav patterns track: bundled or parallel?**
8. **H — Dogfood on vb.test?**
9. **I — Standards stance**

Each question gets resolved — concretely, written back here — before moving to the next. That is the "one-by-one dependency resolution" you asked for.
