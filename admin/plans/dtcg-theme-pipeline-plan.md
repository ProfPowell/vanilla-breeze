# Plan: DTCG-based theme pipeline for Vanilla Breeze

> Status: draft, ready to break into beads issues
> Companion doc: [dtcg-tokens-rnd.md](../research/dtcg-tokens-rnd.md)
> Authored: 2026-05-14

## Goal

Make Vanilla Breeze themes a first-class participant in the DTCG
ecosystem — export, import, distribute, and remix. Build it as a web
experience inside the Theme Composer; **no CLI** in scope.

The pipeline ties together three things VB already has but does not
fully connect:

1. The `src/tokens/themes/` library (50 hand-authored themes).
2. The Theme Composer (`<palette-generator>` → `<semantic-palette>` →
   editable specimens → `<theme-export>`).
3. The `demos/alpenglow/themes/` brand experiments (McDonald's,
   Starbucks, IBM, Anthropic) which are stranded outside the main theme
   library.

After this work, all three live on the same rails: a theme is a DTCG
artifact that can be exported, edited in any DTCG-aware tool, re-imported,
or seeded from a public token set.

## Non-goals

- Replacing the runtime CSS token system. CSS custom properties +
  OKLCH + relative-color + `light-dark()` remain how themes execute.
- Building a CLI. All authoring happens in the browser.
- Wholesale migration of `src/tokens/themes/*.css` to JSON files.
  Themes stay CSS-authored; DTCG is a sibling representation, not a
  source-of-truth replacement.
- Multi-platform code generation (iOS/Android/Flutter). Out of scope —
  if a consumer wants that, they can run our DTCG output through Style
  Dictionary themselves.

## Pipeline overview

```
              ┌────────────────────────────────────────────┐
              │                                            │
              │   Theme Composer (web UI in /docs/tools)   │
              │                                            │
              │   ┌─────────┐   ┌──────────┐   ┌───────┐  │
              │   │ Public  │   │ Editable │   │ VB    │  │
              │   │ token   │──▶│ live     │◀──│ theme │  │
              │   │ catalog │   │ specimens│   │ index │  │
              │   └─────────┘   └────┬─────┘   └───────┘  │
              │                      │                     │
              │            ┌─────────┴─────────┐           │
              │            ▼                   ▼           │
              │   ┌──────────────┐    ┌────────────────┐  │
              │   │ DTCG export  │    │ DTCG import    │  │
              │   │ (.tokens.json│    │ (file/URL/paste│  │
              │   │  + CSS)      │    │  → CSS + scope)│  │
              │   └──────────────┘    └────────────────┘  │
              │                                            │
              └────────────────────────────────────────────┘
                          │                ▲
                          │                │
                          ▼                │
              ┌─────────────────┐   ┌────────────────────┐
              │ dist/cdn/themes/│   │ Public token sets  │
              │ *.tokens.json   │   │ Material, Carbon,  │
              │ (50 themes)     │   │ Salesforce, etc.   │
              └─────────────────┘   └────────────────────┘
```

## Phases

### Phase 1 — DTCG export from `<theme-export>`

Add a `format="dtcg"` option to the existing `<theme-export>` component
(`src/web-components/theme-export/logic.js`). The collection logic
(walking inline-style custom properties, filtering by prefix) stays
unchanged; only the serializer is new.

**Serializer responsibilities**

- Group tokens by prefix into a DTCG group tree:
  - `--color-*` → `color/*`
  - `--hue-*`, `--lightness-*`, `--chroma-*` → `color/seeds/*`
  - `--font-family`, `--font-sans`, `--font-heading` → `typography/family/*`
  - `--font-size-*` → `typography/size/*`
  - `--font-weight-*` → `typography/weight/*`
  - `--line-height-*` → `typography/lineHeight/*`
  - `--letter-spacing-*` → `typography/letterSpacing/*`
  - `--size-*` → `spacing/*`
  - `--radius-*` → `border/radius/*`
  - `--border-width-*` → `border/width/*`
  - `--shadow-*` → `effect/shadow/*`
  - `--duration-*` → `motion/duration/*`
  - `--ease-*` → `motion/easing/*`
- For each token:
  - Detect type from prefix (color/dimension/duration/cubicBezier/etc.).
  - For OKLCH colors, parse the `oklch(L C H / A)` literal and emit
    `{ "colorSpace": "oklch", "components": [L, C, H], "alpha": A }`.
  - For relative-color expressions (`oklch(from var(--…) calc(l - 0.08) c h)`),
    emit the *resolved* value (read via `getComputedStyle`) so other
    tools see a real color, and stash the original expression under
    `$extensions["com.vanilla-breeze.expression"]` for VB-aware
    round-trip.
  - For `light-dark(a, b)` values, emit a `$root`/`light`/`dark` variant
    triplet per the stable spec; preserve the literal under
    `$extensions["com.vanilla-breeze.lightDark"]`.
  - For dimensions, parse unit (`px`/`rem`/`em`) and emit
    `{ "value": N, "unit": "rem" }`; emit `em` under
    `$extensions["com.vanilla-breeze.unit"]` since DTCG only specs px/rem.
  - For composite-shaped values (multi-stop shadows), parse and emit a
    DTCG `shadow` array. If parsing fails, fall back to the raw string
    in `$extensions`.
- Emit a top-level `$extensions["com.vanilla-breeze"]` block with:
  - `spec: "2025.10"` (DTCG version targeted)
  - `vbVersion`: VB version that produced the file
  - `seedDerivation: true` if any seed-derived tokens were detected
- Pretty-print with 2-space indent.

**UI surface**

- `format="dtcg"` is a third radio in the existing toolbar.
- The textarea shows the DTCG JSON.
- Copy / Download buttons work as today (download as `theme.tokens.json`).
- Add a small inline "Validate" button that round-trips the JSON through
  a DTCG schema check (use `ajv` + the published JSON schema; bundle
  the schema as a static asset).

**Tests**

- Unit: serializer fixture tests for each token type.
- Visual: the existing `<theme-export>` page rendered with `format=dtcg`
  on each of the 50 themes (snapshot count, not full diff).
- Round-trip: feed every theme through export → parse → assert no
  parse errors and every token appears.

**Done when**

- `<theme-export format="dtcg">` produces valid stable-2025.10 DTCG JSON.
- Output round-trips cleanly through Style Dictionary v4 (`sd build`
  produces CSS without errors).
- Output imports into Tokens Studio without errors (manual smoke test).

---

### Phase 2 — Publish 50 themes as DTCG artifacts

Once Phase 1's serializer exists, add a build step that runs the
serializer over every theme in `src/tokens/themes/` and emits a
`.tokens.json` next to the `.css` in `dist/cdn/themes/`.

**Approach**

- Headless: spin up a JSDOM (or Playwright headless page) that loads
  each theme and runs the serializer against `:root`.
- Output structure:
  ```
  dist/cdn/themes/
    brand-modern.css
    brand-modern.tokens.json
    extreme-dracula.css
    extreme-dracula.tokens.json
    …
  ```
- Add a `dist/cdn/themes/manifest.json` listing all themes with their
  CDN URLs, types (brand/extreme/access), and DTCG file presence.
- Generate a per-theme `dark` variant file too: `brand-modern-dark.tokens.json`.

**UI surface**

- Update `<theme-picker>` to expose a "Download as DTCG" link per
  theme.
- A new docs page at `/docs/tools/theme-library/` listing every theme
  with download links for both CSS and DTCG, plus a copy-link for the
  CDN URL.

**Tests**

- Build-time: every theme produces a `.tokens.json`; no theme is missing.
- Validate every output against the DTCG schema in CI.
- Snapshot the manifest.

**Done when**

- `npm run build` emits 50 `.tokens.json` files in `dist/cdn/themes/`.
- Manifest is published.
- A user can `curl https://vanilla-breeze.com/cdn/themes/extreme-dracula.tokens.json`
  and get valid DTCG.
- Theme library docs page is live with downloads.

---

### Phase 3 — DTCG importer in the Theme Composer

A new component, `<theme-import>` (sibling of `<theme-export>`), that
accepts DTCG JSON via three input modes and writes the resolved tokens
back to the Theme Composer's preview scope.

**Input modes**

1. **Paste** — textarea + "Apply" button. Triggers parse + apply.
2. **File** — `<input type="file" accept=".json,.tokens,.tokens.json">`.
3. **URL** — input + fetch button. CORS-permitted hosts only; surface a
   clear error otherwise. Useful for grabbing public token sets by URL
   (Phase 4 catalog clicks land here).

**Apply pipeline**

- Parse JSON; validate against DTCG schema (warn but don't block on
  schema violations — many real-world files diverge in small ways).
- Walk the token tree and produce a flat map of `{ cssVarName: value }`.
- Reverse the prefix mapping from Phase 1 (DTCG `color/primary` →
  `--color-primary`; `border/radius/m` → `--radius-m`).
- For composite types: unpack into VB scalars
  (`typography/heading` → `--font-heading`, `--font-size-heading`,
  `--font-weight-heading`, etc.).
- For variants (`$root`/`light`/`dark`): prefer `$root`; if absent,
  pick the variant matching the current `data-mode`.
- For colors not in OKLCH: convert via the browser
  (`new Option().style.color = '<hex>'; getComputedStyle(...)` trick or
  CSS `color()` direct) and store as OKLCH.
- For VB extensions (`$extensions["com.vanilla-breeze.expression"]`):
  if present, prefer the original CSS expression (round-trip lossless).
- Write resolved values onto the Theme Composer's preview scope (not
  `:root` directly — preview scope is configurable, default `#preview`).
- Fire `theme-import:applied` with the count + a list of tokens
  recognized vs. dropped.

**Conflict / safety**

- Importer reports any DTCG tokens it could not map to a VB token in a
  collapsible "ignored" panel (so a designer can see what was lost).
- Importer never writes new VB token names — only known-good ones from
  the prefix map. Unknown DTCG tokens are surfaced, not blindly applied.
  This preserves the "themes override existing tokens only" contract
  from `src/tokens/index.css`.

**UI surface**

- Add `<theme-import>` to the Theme Composer page (`docs/tools/theme-composer`)
  beside the existing export panel.
- Use VB primitives: `<form-field>` for inputs; `<data-layout>` for the
  three-mode tab strip; native `<input type="file">` and `<input type="url">`.
- "Reset to base tokens" button clears the preview scope.

**Tests**

- Unit: prefix reverse-map round-trips for every token type.
- Round-trip: every Phase-2 output file imports cleanly and produces
  CSS that matches the original theme (small tolerance for
  computed-style precision).
- A11y: axe-clean; all controls are keyboard-reachable.

**Done when**

- A user can paste a `.tokens.json` and see the preview area re-theme.
- A user can fetch a public DTCG URL (e.g. one we publish for Material
  Tokens) and apply it.
- Tokens Studio output applies correctly against a smoke fixture.

---

### Phase 4 — Public token-set catalog

A small curated catalog of well-known design systems published as DTCG.
Each entry is a "click to import" tile in the Theme Composer that calls
through to the Phase 3 importer.

**Catalog entries (initial)**

| System | Source | Notes |
|---|---|---|
| Material Design 3 | Google Material's published tokens | Use canonical Google export if available; otherwise vendor a snapshot |
| IBM Carbon | Carbon design tokens | DTCG-aligned; vendor or fetch live |
| Salesforce Lightning | Lightning Design System tokens | Established SLDS export |
| GOV.UK | GOV.UK Design System | Public tokens, plain palette |
| Atlassian | Atlassian Design Tokens | Published DTCG-shaped JSON |
| Tailwind defaults | Curated subset | Useful as a "neutral starting point" |
| Bootstrap defaults | Curated subset | Same purpose |
| Catppuccin (4 flavors) | Already in our extreme themes | Round-trip via DTCG to validate parity |

**Storage**

- Vendored copies in `src/web-components/theme-import/catalog/`
  (committed) so the catalog works offline / behind firewalls.
- Each entry is a `{slug}.tokens.json` plus a `manifest.json` with
  metadata (name, source URL, license, attribution string,
  last-synced date).
- A `npm run sync:tokens` script (run manually, not in CI) refreshes
  the vendored copies from upstream sources where they publish DTCG.

**UI surface**

- New panel in the Theme Composer: "Start from a known system."
- Tiles per catalog entry with name, license, "Apply" button.
- Selecting one runs the Phase 3 importer with the vendored file.
- Attribution string surfaced near the preview as a reminder.

**Licensing diligence**

- Each entry's license recorded in the manifest.
- Catalog page documents that imported tokens carry their original
  license; VB doesn't relicense them.
- For sources without DTCG export (Tailwind, Bootstrap), we synthesize
  a DTCG file from their published values and document the conversion.

**Tests**

- Snapshot each catalog entry imported → exported back to DTCG; assert
  stable output.
- License manifest is complete (every entry has `license`, `source`,
  `attribution`).

**Done when**

- 8+ public systems are importable in one click.
- License attribution is correct and visible.
- Manual smoke: import each, eyeball the preview area, save as a custom
  VB theme via Phase 1 export.

---

### Phase 5 — Promote brand experiments to first-class themes

The `demos/alpenglow/themes/` brand themes (McDonald's, Starbucks, IBM,
Anthropic) are stranded outside the main theme system. Use them as the
**validation case** for the pipeline: run each through DTCG export →
import → check parity → if it round-trips cleanly, promote it.

**Workflow per brand**

1. Open the brand's CSS in the Theme Composer (load via `<theme-picker>`
   pointed at the demo theme URL).
2. Phase 1 export: produce `mcdonalds.tokens.json`.
3. Phase 3 import the same file into a fresh preview scope; visually
   compare against the original.
4. Resolve any drift (likely: a few hardcoded hex values needing OKLCH
   conversion; some non-standard tokens that live outside the standard
   prefix list).
5. Either promote the cleaned file to `src/tokens/themes/_brand-{name}.css`
   (joining the official theme library), or — if the round-trip exposes
   a real architectural mismatch — file a beads issue and adjust the
   serializer/importer.
6. Add the brand to the catalog (Phase 4) so others can start from it.

**Catalog additions from this phase**

- `brand-mcdonalds`, `brand-starbucks`, `brand-ibm`, `brand-anthropic`
  as first-class themes in `src/tokens/themes/`.
- Logo SVGs (`mcdonalds-logo.svg` etc.) move to a sibling assets dir
  (or stay in demos with a documented relationship).
- Each brand keeps its experimental status flagged ("Reference brand
  theme — for demonstration; trademark belongs to its owner").

**Trademark / IP note**

- These brand themes exist as design-system experiments; ship under a
  prominent disclaimer that names and trade dress belong to their
  respective owners.
- If any rights-holder objects, the theme is removable (one file, one
  manifest entry).

**Done when**

- All four brand experiments are first-class themes.
- Each round-trips cleanly through DTCG (export → re-import produces
  the same computed styles).
- Catalog tiles exist; theme picker exposes them.
- Disclaimer copy is in place.

---

### Phase 6 — Future / speculative: URL-inferred theme service

> Not committed. Researched separately.

Concept: paste a URL (`https://example.com`); a service fetches the
page, samples its computed styles, and proposes a VB theme that
approximates the visual identity.

**Why future, not now**

- Requires a server-side component (CORS, JS rendering, computed-style
  extraction) — VB has been entirely static so far. Adding a backend
  is a significant infrastructure expansion that needs its own design
  exercise.
- Quality of inference is uncertain: most sites have hundreds of
  computed colors; reducing to a 3-token brand seed (hue/lightness/
  chroma) is a real ML/heuristics problem, not a "read the CSS" trick.
- Legal grey area: scraping styles to clone visual identity invites
  trademark/trade-dress concerns. The "brand experiments" path with
  intentional, attributed reproductions is safer than an unattended
  scraper.

**Sketch of a future architecture (for context, not commitment)**

1. Cloudflare Worker fronting a headless browser (Browser Rendering API
   or a tiny Puppeteer service).
2. Visit URL, wait for paint, walk all elements computing
   `getComputedStyle`.
3. Cluster colors (k-means in OKLCH space) to find the dominant 3–5
   hues; map those to `--hue-primary`, `--hue-secondary`, `--hue-accent`.
4. Extract dominant font families, border-radius values, shadow depths.
5. Synthesize a VB theme by setting seeds and a small number of overrides.
6. Return as DTCG; user imports into the Theme Composer.
7. Cache aggressively; rate-limit aggressively.

**Open questions for the future-design phase**

- Where does the headless browser live? Cloudflare Workers Browser
  Rendering vs. a small VPS vs. a third-party service.
- How do we surface confidence? An imperfect inference is worse than no
  inference if the user trusts it blindly.
- Attribution: the proposed theme should carry "inspired by example.com
  on YYYY-MM-DD" metadata in `$extensions` so it never gets confused
  with an official brand theme.
- Robots.txt / scraping ethics: only scrape sites whose owners have
  opted in or whose content is unambiguously public CSS.

This phase gets a follow-up R&D doc when (if) we decide to pursue it.
For now: it stays in this plan as a sketch so the upstream phases are
shaped to support it (the importer / DTCG seam are the natural plug-in
points).

---

## Cross-cutting concerns

### Components and naming

| New component | Purpose | Lives in |
|---|---|---|
| `<theme-import>` | DTCG importer with paste / file / URL inputs | `src/web-components/theme-import/` |
| (existing) `<theme-export>` | Gains `format="dtcg"` option | unchanged |
| (existing) `<theme-picker>` | Gains "Download DTCG" link per theme | unchanged |

### Bundle impact

- DTCG schema validator (`ajv` + schema): ~50 KB minified. Lazy-load
  in the importer; not in the core bundle.
- OKLCH parsing / color conversion: vendor a tiny helper (~3 KB) or
  reuse the browser's `CSS.parseColor` if available. Avoid pulling in
  full Color.js (~80 KB).
- Catalog vendored files: ~50 KB total for 8 systems. Ship only the
  manifest in the bundle; fetch individual `.tokens.json` on demand.

### A11y

- All importer UI uses `<form-field>` per VB convention.
- File picker is the native control.
- "Ignored tokens" panel uses native `<details>` for disclosure.
- Error states use `<output>` per VB form patterns.

### Tests

- Unit (Vitest): serializer, parser, prefix-map both directions.
- Integration (Playwright): import a fixture file in the Theme Composer
  page, assert preview area re-themes.
- Round-trip CI gate: every theme in `src/tokens/themes/` exports +
  re-imports without diff.
- Visual: Theme Composer with an imported theme matches a snapshot.

### Documentation

- `/docs/tools/theme-composer` updated with import + export flows.
- New `/docs/tools/theme-library` lists all themes + DTCG downloads.
- `/docs/explore/dtcg` explains what DTCG is, what we support, and
  pointers to the spec + Tokens Studio + Style Dictionary.
- Catalog entries each get a short "About this system" blurb with
  license + attribution.

### Beads issues to file

When this plan is approved, file:

- `epic` — DTCG theme pipeline (umbrella for everything below)
- `feature` — Phase 1: DTCG export from `<theme-export>`
- `feature` — Phase 2: Publish 50 themes as `.tokens.json`
- `feature` — Phase 3: `<theme-import>` component + Theme Composer integration
- `feature` — Phase 4: Public token-set catalog
- `task` — Phase 5: Promote brand experiments (one task per brand, or
  one umbrella with sub-issues per brand)
- `task` — Documentation pass (theme-library page, dtcg explainer, theme-composer updates)

Phase 6 (URL inference) does **not** get a beads issue here. It will
get its own R&D doc and plan when/if we decide to take it on.

## Risks & mitigations

- **DTCG spec evolution.** Stable v1 is the contract; later drafts
  iterate. **Mitigation:** pin to 2025.10 in the export header, treat
  spec bumps as deliberate version migrations.
- **Round-trip lossiness for parametric themes.** Themes with seeds +
  relative-color export resolved values; re-importing them produces a
  hardcoded theme. **Mitigation:** preserve seeds + expressions in
  `$extensions["com.vanilla-breeze.*"]`; document the limitation; offer
  a "convert to seed-based" Theme Composer step in a later iteration.
- **Public-set licensing surprise.** A vendored token set's license
  changes upstream. **Mitigation:** `npm run sync:tokens` is manual,
  not automatic; license is reviewed each sync; remove if anything
  shifts to non-OK terms.
- **Brand-theme trademark pushback.** McDonald's etc. could object.
  **Mitigation:** prominent disclaimer; one-file removal path; consider
  renaming to "fast-food red," "coffee green," etc. if the legal
  exposure is real.
- **DTCG schema drift between tools.** Style Dictionary, Tokens Studio,
  and Penpot may interpret edge cases differently. **Mitigation:**
  smoke-test each major tool during Phase 1; document any
  tool-specific quirks; treat the schema validator as advisory not
  blocking.
- **Theme Composer complexity creep.** Adding import/export/catalog/
  import-results panels makes the UI dense. **Mitigation:** use
  collapsible regions; default to a clean state with import as a
  secondary surface; don't crowd the primary "edit specimens" flow.

## Open questions

1. **Manifest format** for `dist/cdn/themes/manifest.json` — invent our
   own or use a DTCG-blessed convention if one emerges? **Lean:**
   invent a small one with `themes: [{ slug, type, name, css, dtcg,
   variants }]`; revisit if the spec adds a manifest.
2. **Catalog refresh cadence** — manual on demand vs. quarterly batch
   vs. CI nightly? **Lean:** manual on demand; quarterly is cheap to
   add later; nightly invites spec-drift breakage.
3. **Variant strategy for export** — emit `$root`/`light`/`dark`
   triplets (more correct) or only the current-mode resolved values
   (simpler)? **Lean:** triplets; the original `light-dark()`
   expression goes in `$extensions` as the round-trip aid.
4. **Component name for importer** — `<theme-import>` (mirror of
   `<theme-export>`) vs. something more descriptive
   (`<token-import>`, `<dtcg-import>`)? **Lean:**
   `<theme-import>` for symmetry.
5. **Where does the catalog UI live** — embedded in Theme Composer or
   a sibling page (`/docs/tools/theme-library`)? **Lean:** both — the
   library page is the catalog with one-click "open in Theme Composer";
   the Composer also has a compact catalog tile strip for in-flow use.
6. **Should imported themes be saveable to the user's browser?**
   localStorage? **Lean:** yes, behind a "Save draft" button —
   parallels how `meme-maker` will handle drafts. Keep it scoped to
   the Composer; not a global theme manager.

## Definition of done (whole pipeline)

- [ ] `<theme-export format="dtcg">` produces stable-2025.10 DTCG JSON.
- [ ] All 50 themes are published as `.tokens.json` artifacts in
      `dist/cdn/themes/` with a manifest.
- [ ] `<theme-import>` component accepts paste/file/URL inputs and
      applies tokens to a preview scope.
- [ ] Public-set catalog ships with 8+ entries, license-compliant.
- [ ] McDonald's, Starbucks, IBM, Anthropic brand themes are
      first-class members of `src/tokens/themes/`.
- [ ] Round-trip CI gate: every theme exports + re-imports without
      regression.
- [ ] Docs pages live: theme library, theme composer (updated), DTCG
      explainer.
- [ ] Beads issues filed and tracked under one epic.

Phase 6 (URL inference) is **not** part of this Definition of Done.
