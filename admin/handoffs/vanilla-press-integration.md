# Integrating with Vanilla Breeze — Handoff for Vanilla Press

> **Audience:** another Claude instance (or developer) working in the **vanilla-press** repo who needs to understand what Vanilla Breeze (VB) ships *today*, what conventions VanillaPress-authored documents must follow, and where to look for what.
>
> **Last verified:** 2026-04-24 against commit `13e93ba0` (provenance Stage 4 shipped). Re-verify when this date is more than ~2 weeks stale.

---

## Orientation in 60 seconds

- **Vanilla Breeze (VB)** is an HTML-first CSS + Web Component framework. It styles native HTML, ships ~60 web components, ~30 layout/utility custom elements, 50 themes, and a deep progressive-enhancement layer. No build step required for consumers.
- **Vanilla Press (this project)** is the editor / CMS that *produces* HTML documents. The documents it emits are consumed by VB at render time.
- **The interface between them is HTML.** VB does NOT ship a VanillaPress-specific integration. VanillaPress just needs to emit the right elements, attributes, and meta tags — defined by stable contracts in `admin/specs/`.
- **Pre-release status:** VB is at `0.1.1`. Breaking changes still acceptable; the meta-tag contract and canonical-document format are versioned (`v1`) and stable.

---

## What VB ships (current cutoff)

| Surface | Where | Authority |
|---|---|---|
| Native HTML element styling | `src/native-elements/` | `admin/syntax.md` §2 |
| Layout primitives (`<layout-stack>`, `<layout-cluster>`, etc.) and form/UI custom elements (`<form-field>`, `<status-message>`, etc.) | `src/custom-elements/` | `admin/syntax.md` §3 |
| 60 declared web components | `src/web-components/` | `custom-elements.json` (auto-generated CEM, **authoritative**) and `admin/syntax.md` §4 |
| Charts | `src/charts/` | `admin/syntax.md` §6 |
| Layout system (`data-layout` attributes) | `src/custom-elements/layout-attributes.css` | `admin/syntax.md` §5 |
| Token system (spacing, typography, color, motion, etc.) | `src/tokens/` | `admin/syntax.md` §1 |
| Theme variants (50, brand + extreme + accessibility) | `src/tokens/themes/` | `src/tokens/themes/` |
| Progressive enhancement utilities | `src/utils/`, `src/effects/` | `admin/syntax.md` §7–§8 |
| **Document provenance contract** | `admin/specs/meta-tag-contract-v1.md` | **v1.0 stable** |
| **Canonical-document format (signing)** | `admin/specs/canonical-document-v1.md` | **v1.0 stable** |
| Lens pages (changelog, glossary, sitemap, keyword index) | `site/src/pages/{changelog,glossary,sitemap,index-of}` | Built via Cook SSG metadata pipeline |

**Two canonical reference docs you should treat as truth:**

1. **`admin/syntax.md`** — definitive catalog of every element, attribute, class, and `data-*`. Machine-readable for codegen.
2. **`custom-elements.json`** at the repo root — auto-generated from JSDoc. Use this for precise web-component APIs (attributes, events, slots).

---

## What VanillaPress must emit (the rules)

### 1. Semantic HTML, not divs

The single most-quoted convention in this repo (`CLAUDE.md`, `CONVENTIONS.md`, scattered demos):

- Don't reach for `<div>` and `<span>` — use semantic HTML elements (`<article>`, `<section>`, `<aside>`, `<header>`, `<footer>`, `<main>`, `<nav>`, `<figure>`, `<address>`, `<search>`, `<menu>`, `<hgroup>`).
- For repeating cards, use `<article>` not `<div class="card">`.
- For native-element variants, use short class names with element scoping (e.g. `<form class="stacked">`, `<table class="striped compact">`) — see `CONVENTIONS.md`.
- Custom elements use `data-*` attributes for configuration and state — never classes for dynamic state.
- Use logical CSS properties (`inline-size`, `block-size`, not `width`, `height`).

### 2. Layout via attributes, not wrapper components

```html
<section data-layout="stack" data-layout-gap="m">…</section>
<ul data-layout="cluster">…</ul>
<main data-layout="sidebar">…</main>
```

Values: `stack | cluster | center | grid | cover | sidebar | switcher | reel | imposter | text | split | holy-grail | dashboard | regions | media | page-stack`.

`<body data-page-layout="…">` for page-level shells. See `admin/syntax.md` §5.

### 3. Doc-page demo pattern (only relevant if VanillaPress emits doc-style examples)

When showing live HTML examples, the convention is:

```html
<browser-window>
  <code-block>…</code-block>
  <!-- the live demo -->
</browser-window>
```

If VanillaPress is producing prose pages and not framework documentation, this doesn't apply.

### 4. Provenance — the new contract

**Every published page should emit a minimum provenance envelope** so VB lens components and the analytics subsystem light up. The full contract is `admin/specs/meta-tag-contract-v1.md`; this is the floor.

**Public-standard tags VanillaPress should emit:**

```html
<meta name="author" content="Author Name">
<link rel="author" href="/team/handle">
<meta name="last-modified" content="YYYY-MM-DD">
<meta property="article:published_time" content="ISO-8601">
<meta property="article:modified_time" content="ISO-8601">
<meta name="keywords" content="comma, separated, tags">
<meta name="license" content="CC BY 4.0">
<meta itemprop="version" content="1.4.0">
<meta property="og:title" content="…">
<meta property="og:description" content="…">
<meta property="og:image" content="…">
<meta property="og:type" content="article">
```

**`vb:*` namespace (private VB extensions):**

```html
<meta name="vb:provenance" content="human">          <!-- or ai-assisted, ai-generated; space-compose extensions: "ai-generated translated" -->
<meta name="vb:review"     content="unreviewed">     <!-- or fact-checked, editor-reviewed -->
<meta name="vb:status"     content="published">     <!-- or draft, archived -->
<meta name="vb:ai-tools"   content="Claude, GPT-5"> <!-- if applicable -->
<meta name="vb:topic"      content="engineering.web.css">
<meta name="vb:version-url" content="/changelog#v1-4-0">
```

**JSON-LD mirror is canonical for machine readers:**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "…",
  "author": { "@type": "Person", "name": "…" },
  "datePublished": "…",
  "dateModified": "…",
  "creditText": "Human-written, AI-assisted",
  "version": "1.4.0"
}
</script>
```

**DOM-attribute layer for content blocks (NOT meta tags):**

```html
<html lang="en" data-provenance="ai-assisted" data-status="published">
  …
  <article data-provenance="human" data-review="fact-checked">…</article>
  <aside data-provenance="ai-generated translated">…</aside>
  <p>The migration <ins data-author="tpowell" data-provenance="human">was rolled back</ins>.</p>
</html>
```

**Critical distinction:**
- `data-provenance` = author claim about how content was made.
- `data-trust` = runtime verification result, **set only by `<page-info>`**. Never author this attribute by hand.
- Page-level defaults on `<html>` are inherited; section-level overrides win.
- `data-provenance` is space-composable: CSS uses `[data-provenance~="ai-generated"]`.

### 5. Optional: cryptographic signing

If VanillaPress wants to publish *signed* documents:

- Mark a `<main>` or wrapper element with `data-signable`.
- Run the signer (Node, currently `scripts/sign-pages.js` is the reference implementation) over built HTML to inject `vb:hash`, `vb:signature`, `vb:signature-algorithm`, and `<link rel="author-key">`.
- Public keys live at `/.well-known/content-keys/{author-id}.jwk` and are indexed by `/.well-known/content-authenticity.json`.
- `<page-info>` verifies live in the browser (ECDSA-P256-SHA256).
- Canonicalization rules: `admin/specs/canonical-document-v1.md` — read carefully if VanillaPress builds its own signer. Identical input HTML must produce byte-identical canonical output across signer and verifier.

Signing is **optional** and orthogonal to the meta-tag contract. The contract works without it.

---

## What VB components consume (matrix)

| Component | Reads |
|---|---|
| `<page-info>` | All public-standard fields, all `vb:*` provenance/integrity fields, JSON-LD mirror. Can run in static mode (enhancing CMS-rendered light DOM) or `auto` mode (rendering panel from `<meta>` tags). |
| `<change-set>` | `data-author`, `data-provenance` on `<ins>`/`<del>` blocks |
| `<site-index>` | `<meta name="keywords">`, `article:tag`, `vb:topic` aggregated across pages |
| `<time-index>` | `last-modified`, `itemprop="version"`, `vb:version-url` |
| Trust/topic lens pages (changelog, glossary, sitemap, keyword index) | Aggregations over `vb:provenance`, `vb:review`, `vb:status`, `vb:topic` |
| Analytics subsystem | All `vb:*` tags via `meta[name^="vb:"]` |

---

## Validation

VanillaPress output should pass these checks before being trusted as VB-compliant:

```bash
npm run lint:html         # html-validate with VB custom-element registry
npm run conformance       # VB conformance checker (demos/examples)
npm run test:components   # Playwright component tests
npm run validate:api      # api.json registry validation
```

For provenance specifically:

- Open the page in a browser; `<page-info auto>` should render an authorship summary with no console errors.
- If signed: open DevTools, check the `page-info:verified` event detail — `status` should be `verified` (not `failed`, `key-unavailable`, or `undeclared`).
- The full test suite (`npm test`) includes integration tests for the meta-tag contract.

---

## Where to look for what

| Question | Source |
|---|---|
| What attributes does `<X>` accept? | `src/web-components/X/api.json` and `custom-elements.json` |
| What's the full `data-*` index? | `admin/syntax.md` §11 |
| What CSS tokens / themes exist? | `admin/syntax.md` §1, `src/tokens/`, `src/tokens/themes/` |
| What native elements does VB style? | `admin/syntax.md` §2, `src/native-elements/` |
| What are VB's HTML/CSS conventions? | `CONVENTIONS.md` and `CLAUDE.md` |
| Provenance contract details | `admin/specs/meta-tag-contract-v1.md` |
| Signing canonicalization | `admin/specs/canonical-document-v1.md` |
| Provenance decision history / rationale | `admin/r-n-d/data-provenance-april-24.md` |
| Project roadmap & current status | `admin/global-vanilla-breeze.md` |
| Cross-project philosophy | `admin/global-overview.md` |
| Active issue tracking | `.beads/` (run `bd ready` / `bd list` from repo root) |

---

## Open questions for VanillaPress to decide

These are NOT VB concerns — they're VanillaPress-side design decisions:

1. **Editor surface for `vb:provenance`** — does the author tag content per-block, or does the page emit a single page-level default? (Both are valid per contract.)
2. **AI-assist disclosure UX** — when the editor includes AI suggestions, does VanillaPress auto-flip `vb:provenance` to `ai-assisted`, prompt the user, or both?
3. **JSON-LD generation** — auto-emit from frontmatter, or require authors to write it? Auto is recommended; the contract treats JSON-LD as the canonical mirror.
4. **Signing** — opt-in per-doc, opt-in per-site, or always-on? Where do authoring keys live? (See `canonical-document-v1.md` §B for `data-signable` placement.)
5. **`<page-info>` mode** — emit pre-rendered light-DOM markup (static mode, server-rendered) or rely on `auto` mode reading `<meta>` tags? Static mode is more robust to JS failure; auto mode is less authoring overhead.
6. **Change-tracking surface** — does VanillaPress emit `<ins>`/`<del>` with `data-author` for change-set views, or does it flatten edits at publish time? VB supports both; it's a content-policy choice.

---

## When this doc is wrong

If you find drift between this doc and reality:

1. Trust the **specs** in `admin/specs/` (versioned, stable contracts).
2. Trust **`custom-elements.json`** for component APIs (auto-generated).
3. Trust the **code** for everything else.
4. Update this file. It's a navigation aid, not a contract — keeping it correct is cheap, and the alternative (silent staleness) is what created the need for this file in the first place.
