# Page Info, Provenance & Content Trust
## Specification for Vanilla Breeze

A system for declaring, displaying, and cryptographically verifying who made content,
how it was made, and whether it has been tampered with since publication. Designed to
rebuild visitor trust in an era of AI-generated content proliferation.

---

## Table of Contents

- [The Problem](#the-problem)
- [Architecture Overview](#architecture-overview)
- [Head Metadata Layer](#head-metadata-layer)
- [AI Provenance Vocabulary](#ai-provenance-vocabulary)
- [The `page-info` Component](#the-page-info-component)
- [Content Signing & Verification](#content-signing--verification)
- [Trust Tier Model](#trust-tier-model)
- [CMS Data Model](#cms-data-model)
- [Web Component: `page-info`](#web-component-page-info)

---

## The Problem

AI content generation is reducing the cost of publishing to near-zero. As a result:

- Visitors can no longer assume human authorship
- Content farms can produce convincing but inaccurate material at scale
- Attribution and revision history are routinely stripped
- There is no standard way for honest publishers to *prove* their content is what they say it is

This system doesn't solve the problem for bad actors — it gives *honest* publishers
a way to signal trustworthiness to visitors who care enough to check.

---

## Architecture Overview

Three layers, each independently useful but designed to work together:

```
┌─────────────────────────────────────────────────────────┐
│  HEAD METADATA (machine-readable)                       │
│  Open Graph, Schema.org, provenance meta,               │
│  content hash, author key link                          │
├─────────────────────────────────────────────────────────┤
│  page-info COMPONENT (human-readable)                   │
│  Author, dates, version, provenance declaration,        │
│  trust badge, expandable detail panel                   │
├─────────────────────────────────────────────────────────┤
│  CRYPTO VERIFICATION (cryptographically assured)        │
│  ECDSA signature, Web Crypto API verification,          │
│  public key at .well-known, signable content regions    │
└─────────────────────────────────────────────────────────┘
```

The layers are additive. A site can adopt Layer 1 with zero JS, add Layer 2 as a
static HTML component, and graduate to Layer 3 when signing infrastructure is in place.

---

## Head Metadata Layer

### Standard metadata (existing)

```html
<head>
  <meta name="author" content="Jane Doe">
  <meta name="last-modified" content="2025-03-15">

  <meta property="og:title" content="Building Accessible Forms">
  <meta property="og:type" content="article">
  <meta property="og:image" content="https://example.com/og/accessible-forms.jpg">

  <meta property="article:published_time" content="2025-01-10T00:00:00Z">
  <meta property="article:modified_time" content="2025-03-15T00:00:00Z">
  <meta property="article:author" content="https://example.com/team/jane">

  <link rel="author" href="/team/jane">
</head>
```

### Provenance metadata (new)

```html
<head>

  <!-- Content provenance declaration -->
  <meta name="content-provenance" content="human-ai-assisted">
  <meta name="ai-tools" content="Claude Sonnet 4">
  <meta name="ai-role" content="research,drafting">
  <meta name="human-review" content="substantial-edit">

  <!-- Content version (links to changelog entry) -->
  <meta name="content-version" content="1.4.0">
  <meta name="content-version-url" content="/changelog#v1-4-0">

  <!-- License declaration -->
  <meta name="license" content="CC BY 4.0">
  <meta name="license-url" content="https://creativecommons.org/licenses/by/4.0/">

  <!-- Verification — populated at build/publish time -->
  <meta name="content-hash" content="sha256-[base64-encoded-hash]">
  <meta name="content-signature" content="[base64-encoded-signature]">
  <meta name="signature-algorithm" content="ECDSA-P256-SHA256">

  <!-- Author's public key location -->
  <link rel="author-key"
        href="/.well-known/content-keys/jane-doe.jwk"
        data-key-id="jane-2025-01">

  <!-- C2PA manifest (emerging standard for AI provenance) -->
  <!-- <link rel="c2pa-manifest" href="/manifests/accessible-forms.c2pa"> -->

</head>
```

### Schema.org JSON-LD

This is the richest machine-readable layer — search engines, AI crawlers, and
verification tools all read it.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "Building Accessible Forms",
  "url": "https://example.com/docs/forms",
  "datePublished": "2025-01-10",
  "dateModified": "2025-03-15",
  "version": "1.4.0",
  "author": {
    "@type": "Person",
    "name": "Jane Doe",
    "url": "https://example.com/team/jane",
    "sameAs": "https://github.com/janedoe"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Example Inc",
    "url": "https://example.com"
  },
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "isAccessibleForFree": true,

  "creativeWorkStatus": "Published",

  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "contentProvenance",
      "value": "human-ai-assisted"
    },
    {
      "@type": "PropertyValue",
      "name": "aiTools",
      "value": "Claude Sonnet 4"
    },
    {
      "@type": "PropertyValue",
      "name": "humanReview",
      "value": "substantial-edit"
    }
  ]
}
</script>
```

---

## AI Provenance Vocabulary

A controlled vocabulary for `content-provenance` values. Ordered from
most human-controlled to least.

| Value | Meaning | Display label |
|-------|---------|---------------|
| `human` | Entirely human-authored | Human written |
| `human-ai-assisted` | Human wrote, AI provided research/suggestions/grammar help | Human-written, AI-assisted |
| `ai-human-edited` | AI generated a substantial draft; human rewrote or substantially restructured | AI draft, human edited |
| `ai-human-reviewed` | AI generated; human read, approved, and may have made minor changes | AI-generated, human-reviewed |
| `ai-generated` | AI generated; published with minimal or no human intervention | AI-generated |
| `synthesized` | Aggregated or summarized from cited sources | Synthesized from sources |
| `translated` | Translated from another language (cite source with `translation-source`) | Translated |
| `migrated` | Content moved from another system; may have been reformatted | Migrated content |

### `ai-role` values (comma-separated)

When `content-provenance` is `human-ai-assisted`:

| Value | Meaning |
|-------|---------|
| `research` | AI used for research and fact-gathering |
| `drafting` | AI produced initial draft text |
| `editing` | AI suggested edits, grammar, style |
| `summarizing` | AI summarized longer source material |
| `translation` | AI translated from another language |
| `code` | AI generated code blocks within the content |
| `images` | AI generated images used in content |

### `human-review` values

| Value | Meaning |
|-------|---------|
| `none` | No human review (honest disclosure, not recommended) |
| `basic-check` | Human skimmed for obvious errors |
| `fact-checked` | Human verified factual claims |
| `substantial-edit` | Human made significant content changes |
| `full-rewrite` | Human rewrote using AI output as research only |

### Display rules

The component uses these values to produce honest, human-readable labels.
The combination of `content-provenance` + `human-review` determines the
trust badge color:

| Provenance | Review | Badge color |
|------------|--------|-------------|
| `human` | any | `--color-success` |
| `human-ai-assisted` | `substantial-edit` or `full-rewrite` | `--color-success` |
| `human-ai-assisted` | `fact-checked` or `basic-check` | `--color-info` |
| `ai-human-edited` | any | `--color-info` |
| `ai-human-reviewed` | any | `--color-warning` |
| `ai-generated` | `none` | `--color-warning` |
| none declared | — | `--color-text-muted` (neutral) |

---

## The `page-info` Component

### Semantic HTML structure

The component renders as an `<aside>` since it's supplementary metadata about
the page, not primary content. `<details>/<summary>` provides progressive
disclosure without JavaScript.

```html
<!-- Minimal — static HTML, no JS needed -->
<aside class="page-info" aria-label="Page information">
  <details>
    <summary class="page-info-summary">
      <!-- The "trust bar" — compact one-line display -->
      <span class="page-info-author">
        <img src="/team/jane/avatar.jpg" alt="" width="20" height="20"
             class="page-info-avatar">
        <a href="/team/jane" rel="author">Jane Doe</a>
      </span>

      <span class="page-info-sep" aria-hidden="true">·</span>

      <time datetime="2025-03-15" data-relative class="page-info-date">
        15 March 2025
      </time>

      <span class="page-info-sep" aria-hidden="true">·</span>

      <!-- Trust badge — updated by web component to reflect verification state -->
      <span class="page-info-badge"
            data-provenance="human-ai-assisted"
            data-trust="declared"
            aria-label="Content provenance: human-written, AI-assisted. Verification: declared only.">
        Human-written, AI-assisted
      </span>
    </summary>

    <!-- Expanded detail panel -->
    <div class="page-info-panel">

      <!-- Authorship -->
      <section aria-labelledby="page-info-authors">
        <h2 id="page-info-authors" class="page-info-section-heading">Authors</h2>
        <ul class="page-info-author-list">
          <li>
            <address>
              <a href="/team/jane" rel="author">
                <img src="/team/jane/avatar.jpg" alt="Jane Doe" width="40" height="40">
                Jane Doe
              </a>
              <span class="page-info-role">Lead author</span>
            </address>
          </li>
        </ul>
      </section>

      <!-- Dates & version -->
      <section aria-labelledby="page-info-history">
        <h2 id="page-info-history" class="page-info-section-heading">History</h2>
        <dl>
          <div>
            <dt>Published</dt>
            <dd><time datetime="2025-01-10">10 January 2025</time></dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>
              <time datetime="2025-03-15" data-relative>15 March 2025</time>
            </dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>
              <a href="/changelog#v1-4-0" class="version-tag">v1.4.0</a>
            </dd>
          </div>
          <div>
            <dt>Reading time</dt>
            <dd data-reading-time>~8 min</dd>
          </div>
        </dl>
      </section>

      <!-- Content provenance -->
      <section aria-labelledby="page-info-provenance">
        <h2 id="page-info-provenance" class="page-info-section-heading">
          How this was made
        </h2>
        <dl>
          <div>
            <dt>Authorship</dt>
            <dd>Human-written with AI assistance</dd>
          </div>
          <div>
            <dt>AI tools used</dt>
            <dd>Claude Sonnet 4 — research and drafting</dd>
          </div>
          <div>
            <dt>Human review</dt>
            <dd>Substantial edit — author rewrote the AI draft</dd>
          </div>
          <div>
            <dt>Sources</dt>
            <dd>
              <ul>
                <li><cite><a href="https://www.w3.org/TR/WCAG22/">WCAG 2.2</a></cite></li>
                <li><cite><a href="https://www.w3.org/TR/wai-aria/">ARIA Authoring Practices</a></cite></li>
              </ul>
            </dd>
          </div>
          <div>
            <dt>License</dt>
            <dd>
              <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">
                CC BY 4.0
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <!-- Verification — enhanced by JS; static fallback shown -->
      <section aria-labelledby="page-info-verification"
               data-verification-section>
        <h2 id="page-info-verification" class="page-info-section-heading">
          Verification
        </h2>

        <!-- Static fallback — JS replaces this with live result -->
        <p data-verification-status="pending">
          <strong>Signature present.</strong>
          Enable JavaScript to verify content integrity.
        </p>

        <dl class="page-info-verification-detail">
          <div>
            <dt>Author key</dt>
            <dd>
              <a href="/.well-known/content-keys/jane-doe.jwk"
                 class="verification-key-link">
                jane-doe · published at example.com
              </a>
            </dd>
          </div>
          <div>
            <dt>Signed</dt>
            <dd>
              <time datetime="2025-03-15T14:30:00Z">15 March 2025, 14:30 UTC</time>
            </dd>
          </div>
          <div>
            <dt>Algorithm</dt>
            <dd>ECDSA P-256 / SHA-256</dd>
          </div>
        </dl>

        <p class="page-info-verify-note">
          <small>
            Verification checks that this page's content matches the author's
            cryptographic signature. It cannot verify the accuracy of claims
            within the content.
          </small>
        </p>
      </section>

    </div>
  </details>
</aside>
```

### CSS

```css
@layer web-components {

  /* Container */
  .page-info {
    border-block-start: var(--border-width-thin) solid var(--color-border);
    margin-block-start: var(--size-2xl);
    padding-block-start: var(--size-m);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  /* Summary / trust bar */
  .page-info-summary {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--size-xs);
    list-style: none;
    cursor: pointer;
    padding-block: var(--size-xs);
  }

  .page-info-summary::-webkit-details-marker { display: none; }

  /* Author identity in trust bar */
  .page-info-author {
    display: flex;
    align-items: center;
    gap: var(--size-xs);
  }

  .page-info-avatar {
    border-radius: 50%;
    display: inline-block;
    vertical-align: middle;
  }

  /* Separator dot */
  .page-info-sep {
    color: var(--color-text-disabled);
  }

  /* Trust badge */
  .page-info-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--size-2xs);
    padding-inline: var(--size-xs);
    padding-block: var(--size-3xs);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);

    /* Default: neutral */
    background: var(--color-surface-raised);
    border: var(--border-width-thin) solid var(--color-border);
    color: var(--color-text-muted);
  }

  /* Badge colors by trust tier */
  .page-info-badge[data-trust="verified"] {
    background: oklch(from var(--color-success) l c h / 0.12);
    border-color: oklch(from var(--color-success) l c h / 0.3);
    color: var(--color-success);
  }

  .page-info-badge[data-trust="domain-anchored"] {
    background: oklch(from var(--color-info) l c h / 0.12);
    border-color: oklch(from var(--color-info) l c h / 0.3);
    color: var(--color-info);
  }

  .page-info-badge[data-trust="declared"] {
    background: oklch(from var(--color-warning) l c h / 0.1);
    border-color: oklch(from var(--color-warning) l c h / 0.25);
    color: oklch(55% 0.12 70);
  }

  .page-info-badge[data-trust="failed"] {
    background: oklch(from var(--color-error) l c h / 0.1);
    border-color: oklch(from var(--color-error) l c h / 0.3);
    color: var(--color-error);
  }

  /* Expanded panel */
  .page-info-panel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--size-l);
    padding-block: var(--size-m);
  }

  .page-info-section-heading {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wider);
    color: var(--color-text-disabled);
    margin-block-end: var(--size-s);
  }

  /* DL pairs in panel */
  .page-info-panel dl {
    display: flex;
    flex-direction: column;
    gap: var(--size-xs);
  }

  .page-info-panel dl > div {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--size-s);
    align-items: baseline;
  }

  .page-info-panel dt {
    font-size: var(--font-size-xs);
    color: var(--color-text-disabled);
    white-space: nowrap;
  }

  .page-info-panel dd {
    margin: 0;
    color: var(--color-text);
  }

  /* Author list */
  .page-info-author-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--size-s);
  }

  .page-info-author-list address {
    display: flex;
    align-items: center;
    gap: var(--size-s);
    font-style: normal;
  }

  .page-info-author-list img {
    border-radius: 50%;
    flex-shrink: 0;
  }

  .page-info-role {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  /* Verification status states */
  [data-verification-status="verified"] {
    color: var(--color-success);
  }

  [data-verification-status="failed"] {
    color: var(--color-error);
  }

  [data-verification-status="pending"],
  [data-verification-status="key-unavailable"] {
    color: var(--color-text-muted);
  }

  .page-info-verify-note {
    margin-block-start: var(--size-s);
    padding: var(--size-xs) var(--size-s);
    background: var(--color-surface-raised);
    border-radius: var(--radius-s);
    border-inline-start: var(--border-width-medium) solid var(--color-border);
    color: var(--color-text-muted);
  }

  /* Open Graph / social preview hint (shown in panel) */
  .page-info-og-preview {
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-m);
    overflow: hidden;
    font-size: var(--font-size-xs);
  }

  .page-info-og-preview img {
    width: 100%;
    aspect-ratio: 1200 / 630;
    object-fit: cover;
    display: block;
  }

  .page-info-og-caption {
    padding: var(--size-xs) var(--size-s);
    background: var(--color-surface-raised);
    color: var(--color-text-muted);
  }
}
```

---

## Content Signing & Verification

### The signing problem

You cannot sign raw HTML — layout changes, class renames, or whitespace
normalization all break the hash. Instead, sign a **canonical content
document**: a stable JSON representation of the content that is independent
of presentation.

### Marking signable content

The CMS adds `data-signable` to elements whose text forms the signed corpus.
These are the elements that *matter* — not navigation, not sidebars, not the
`page-info` component itself.

```html
<main>
  <article data-signable>
    <h1 data-signable>Building Accessible Forms</h1>
    <p data-signable>A form is accessible when...</p>
    <!-- All descendant text is included -->
  </article>
</main>
```

The simplest approach: `data-signable` on `<article>` or `<main>` alone,
collecting all descendant `textContent`. Exclude `<aside>`, `<nav>`,
`<figure>` captions, and the `page-info` component itself.

### Canonical document format

The content to be signed is a JSON object serialized with `JSON.stringify`
(no pretty-print, keys in this exact order):

```json
{
  "title": "Building Accessible Forms",
  "path": "/docs/forms",
  "author": "jane-doe",
  "published": "2025-01-10",
  "modified": "2025-03-15",
  "version": "1.4.0",
  "content": "Building Accessible Forms\n\nA form is accessible when..."
}
```

Where `content` is the concatenated `textContent` of all `[data-signable]`
elements, trimmed and with internal whitespace normalized to single spaces,
joined with `\n\n` between elements.

### Key format

ECDSA P-256 keys stored as JWK at `/.well-known/content-keys/{author-id}.jwk`:

```json
{
  "kty": "EC",
  "crv": "P-256",
  "use": "sig",
  "kid": "jane-2025-01",
  "x": "[base64url-encoded x coordinate]",
  "y": "[base64url-encoded y coordinate]",
  "metadata": {
    "owner": "Jane Doe",
    "domain": "example.com",
    "created": "2025-01-01",
    "expires": "2026-01-01",
    "contact": "https://example.com/team/jane"
  }
}
```

The `/.well-known/` path matters: it proves the key is controlled by the same
party that controls the domain. This is the domain-anchoring trust property.

### Signing at publish time (CMS / build tool)

```javascript
// Pseudocode — runs in CMS or build script, has access to private key
async function signPage(canonicalDocument, privateKeyJwk) {
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const content = new TextEncoder().encode(JSON.stringify(canonicalDocument));

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    content
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
```

The base64-encoded signature goes into:
```html
<meta name="content-signature" content="[signature]">
<meta name="content-hash" content="sha256-[hash]">
```

### Client-side verification (Web Crypto API)

The `page-info` web component runs this verification when it connects:

```javascript
async function verifyPageContent() {
  // 1. Read signature and key URL from <meta> / <link>
  const signature = document
    .querySelector('meta[name="content-signature"]')
    ?.content;
  const keyUrl = document
    .querySelector('link[rel="author-key"]')
    ?.href;

  if (!signature || !keyUrl) return 'declared'; // no verification possible

  // 2. Fetch public key
  let publicKey;
  try {
    const jwk = await fetch(keyUrl).then(r => r.json());
    publicKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
  } catch {
    return 'key-unavailable'; // can't reach the key endpoint
  }

  // 3. Reconstruct canonical document from current DOM
  const canonical = buildCanonicalDocument();

  // 4. Verify
  const contentBuffer = new TextEncoder().encode(JSON.stringify(canonical));
  const signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

  const isValid = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    signatureBuffer,
    contentBuffer
  );

  return isValid ? 'verified' : 'failed';
}

function buildCanonicalDocument() {
  const signableElements = [...document.querySelectorAll('[data-signable]')];
  const content = signableElements
    .map(el => el.textContent.trim().replace(/\s+/g, ' '))
    .join('\n\n');

  return {
    title: document.querySelector('meta[property="og:title"]')?.content
      ?? document.title,
    path: new URL(window.location.href).pathname,
    author: document.querySelector('meta[name="author"]')?.content ?? '',
    published: document.querySelector('meta[property="article:published_time"]')?.content ?? '',
    modified: document.querySelector('meta[name="last-modified"]')?.content ?? '',
    version: document.querySelector('meta[name="content-version"]')?.content ?? '',
    content
  };
}
```

### What verification does and does not prove

**Verification proves:**
- The content in `[data-signable]` elements has not been altered since the author signed it
- The signature was made by whoever controls the key at the author-key URL
- The key is hosted on the same domain as the page (domain anchoring)

**Verification does not prove:**
- That the content is accurate or factual
- That the author is who they claim to be (identity)
- That AI wasn't used (only provenance declaration does that, and it's self-reported)
- That the key hasn't been compromised

This is honest and important to surface in the UI (see `page-info-verify-note`).

---

## Trust Tier Model

| Tier | `data-trust` value | Badge label | What it means |
|------|--------------------|-------------|---------------|
| 0 | `undeclared` | — (neutral) | No provenance metadata present |
| 1 | `declared` | Declared | Provenance claimed in meta tags; no verification |
| 2 | `domain-anchored` | Key found | Public key reachable at author's domain |
| 3 | `verified` | Content verified | DOM content matches cryptographic signature |
| — | `failed` | Verification failed | Signature present but content doesn't match |
| — | `key-unavailable` | Key unavailable | Signature present but key URL unreachable |

### Tier progression

Tiers 0–1 are purely CMS/markup concerns — no crypto infrastructure needed.
Tier 2 requires publishing a JWK file. Tier 3 requires a signing step at
publish time. Most sites can realistically achieve Tier 3.

`failed` is the most important state to surface clearly — it means content
*may have been modified after signing*, which is distinct from "no signature present".

---

## CMS Data Model

```yaml
# page.yaml — provenance and signing fields added to existing frontmatter
title: Building Accessible Forms
path: /docs/forms
published: 2025-01-10
modified: 2025-03-15
version: 1.4.0

# Authorship
authors:
  - id: jane-doe
    name: Jane Doe
    role: Lead author
    url: /team/jane
    avatar: /team/jane/avatar.jpg

# Provenance
provenance:
  type: human-ai-assisted      # controlled vocabulary value
  aiTools:
    - name: Claude Sonnet 4
      role: [research, drafting]
  humanReview: substantial-edit
  sources:
    - title: WCAG 2.2
      url: https://www.w3.org/TR/WCAG22/
    - title: ARIA Authoring Practices
      url: https://www.w3.org/TR/wai-aria/

# License
license:
  name: CC BY 4.0
  url: https://creativecommons.org/licenses/by/4.0/

# Signing (populated by build tooling, not hand-authored)
signing:
  authorKeyId: jane-2025-01
  authorKeyUrl: /.well-known/content-keys/jane-doe.jwk
  algorithm: ECDSA-P256-SHA256
  signedAt: 2025-03-15T14:30:00Z
  contentHash: sha256-[hash]
  signature: [base64-signature]
```

### CMS responsibilities

- Render all provenance fields as `<meta>` tags in `<head>`
- Generate Schema.org JSON-LD `additionalProperty` entries from provenance fields
- At publish time: invoke signing tool, write `signing.*` fields back to frontmatter
- Add `data-signable` to `<article>` (or `<main>`) in the page template
- Render the `<page-info>` component from page frontmatter
- Key rotation: when a new key is published, re-sign all pages signed with the old key

---

## Web Component: `page-info`

```html
<!-- Usage — all provenance data read from <meta> tags automatically -->
<page-info>
  <!-- Static markup (see above) — rendered by CMS template -->
</page-info>

<!-- Minimal usage — component reads all data from <head> -->
<page-info data-auto>
  <!-- component renders itself entirely from meta tags -->
</page-info>
```

### Component behaviours

On `connectedCallback`:
1. Reads `meta[name="content-signature"]` and `link[rel="author-key"]`
2. Runs `verifyPageContent()` asynchronously
3. Updates `[data-verification-status]` and `[data-trust]` on the badge
4. Applies `data-relative` relative time rendering to all `<time>` elements
5. Computes reading time from `[data-signable]` word count → updates `[data-reading-time]`
6. If `data-auto`: renders the entire component from `<meta>` tag values

### `data-auto` rendering

When the CMS cannot easily render the full static markup, `data-auto` makes
the component self-contained. It reads the following `<meta>` tags:

```
meta[name="author"]                   → author name
meta[property="article:author"]       → author URL
meta[name="last-modified"]            → date
meta[name="content-version"]          → version
meta[name="content-version-url"]      → version link
meta[name="content-provenance"]       → provenance type
meta[name="ai-tools"]                 → AI tool names
meta[name="human-review"]             → review level
meta[name="license"]                  → license name
meta[name="license-url"]              → license URL
meta[name="content-signature"]        → signature
link[rel="author-key"]                → key URL
```

### Events

```javascript
// Fired when verification completes
document.addEventListener('page-info:verified', (e) => {
  console.log(e.detail.status); // 'verified' | 'failed' | 'key-unavailable' | 'declared'
  console.log(e.detail.tier);   // 0 | 1 | 2 | 3
});
```

### Open Graph preview mode

When `data-show-og-preview` is set, the expanded panel shows a
preview card of how the page will appear when shared on social platforms:

```html
<page-info data-show-og-preview>
  <!-- ... -->
</page-info>
```

The component reads `og:image`, `og:title`, `og:description` and renders
a preview panel. Useful in CMS preview contexts and for authors to verify
their sharing image is correct before publishing.

---

## Integration with Other Patterns

### Changelog / time-index

The `version` field in `page-info` links to the changelog entry (`/changelog#v1-4-0`)
and to the page's own version history aside (`#page-v1-4-0`). See the
nav-content-patterns spec for the full per-page version history pattern.

### Glossary

Glossary term definitions can carry their own provenance — if a definition is AI-generated,
that should be declared at the `<dt>` level, not just the page level:

```html
<dt id="term-quaternion" data-provenance="ai-human-reviewed">
  <dfn>quaternion</dfn>
</dt>
```

The `page-info` component only handles page-level provenance. Term-level
provenance is a CSS/attribute concern.

### `.well-known` infrastructure

At the site level, publish a discovery document:

```json
// /.well-known/content-authenticity.json
{
  "version": "1.0",
  "publisher": {
    "name": "Example Inc",
    "url": "https://example.com",
    "contact": "trust@example.com"
  },
  "keys": [
    {
      "id": "jane-2025-01",
      "owner": "Jane Doe",
      "url": "/.well-known/content-keys/jane-doe.jwk",
      "active": true
    }
  ],
  "provenancePolicy": "https://example.com/editorial/ai-policy",
  "algorithmSupport": ["ECDSA-P256-SHA256"]
}
```

This gives tools and crawlers a single entry point to understand the site's
signing infrastructure without scraping individual pages.
