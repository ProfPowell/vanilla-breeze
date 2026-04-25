# Vanilla Breeze Canonical Document Format — v1.0

> **Status:** stable, 2026-04-24
> **Owner:** VB document-provenance initiative
> **Consumers:** `src/lib/canonicalize.js` (signer + verifier), Stage 4 signing reference, `<page-info>` verifier
> **Source of truth:** this file. Changes that alter the byte output require a new major version (v2, v3…). Verifiers SHOULD support the previous major version for one release cycle.

This spec defines the deterministic, byte-stable representation of a published HTML document used as input to ECDSA signing and SHA-256 hashing. The canonical document is a JSON object. Identical input HTML MUST produce byte-identical output across signer (Node, build-time) and verifier (browser, runtime).

The format is a **floor**, not a ceiling — it is intentionally minimal so that future versions can add fields without breaking v1 readers, and so that mature standards (C2PA, VC) can be layered on top once they have HTML bindings.

---

## Section A — Principle: signs what the reader sees

The canonical document represents the **final published content the reader sees**, not the audit trail. Editorial history (`<del>`, version notes, change-set diff views) is not part of the canonical form. The signer attests "this is the content I published"; the verifier attests "this is the content currently rendered."

This means:
- `<del>` is **excluded** (deleted text is no longer part of the document).
- `<ins>` is **included** (inserted text is the current content).
- Reader-controllable surfaces (analytics panels, comment forms, layout switchers) are excluded by their host elements, not by attribute opt-out.
- Pure presentation (images, decorative SVG, `<style>`, `<script>`) is excluded.

A signer that wishes to attest to *editorial provenance* (who edited what) should sign a separate change-set artifact, outside the scope of this document.

---

## Section B — Marking signable content

The author or build pipeline marks one or more elements with `data-signable`. Every descendant of a `data-signable` element contributes to the canonical text — minus the exclusions in §C.

**Recommended placement:** a single `data-signable` on `<article>` or `<main>` covering the entire content region.

```html
<main>
  <article data-signable>
    <h1>Migration Guide</h1>
    <p>Upgrade to Node.js 20 LTS or later.</p>
  </article>
</main>
```

`data-signable` MAY be applied to multiple sibling regions; each contributes independently in source order. Nesting is harmless — duplicates are deduplicated by the walker (an element wholly contained in another `data-signable` ancestor is not walked twice).

**Opt-out:** the attribute `data-signable="false"` on any descendant excludes that element and its subtree from the canonical text. Use sparingly; prefer choosing the right `data-signable` root.

---

## Section C — Excluded elements

The following elements and their entire subtrees are **excluded** regardless of `data-signable` placement, because they represent navigation, editorial UI, presentation, or audit metadata rather than published content:

```
script, style, template, noscript,
nav, aside, header, footer,
figcaption,
page-info, change-set, page-toc, page-tools, page-stats,
site-map, site-index, glossary-index, time-index, content-lens,
button, dialog, menu, form,
[hidden], [aria-hidden="true"],
[data-signable="false"]
```

**Excluded inline elements (text dropped, surrounding text continues):**

```
del
```

**Notes:**
- `<header>` and `<footer>` are excluded at the page level (site chrome). A `<header>` *inside* an `<article>` carries the article's own headline content; this v1 excludes those too. v2 may distinguish via host-element matching.
- `<figcaption>` is excluded because captions are presentational; the figure's content is captured if it contains text.
- `<button>`, `<form>`, and `<dialog>` are excluded because they are interactive surfaces, not published prose.
- The lens components (`<page-info>`, `<change-set>`, `<page-toc>`, etc.) are excluded because they render derived views of metadata that is itself part of the canonical fields.
- `<ins>` is **included** by exception — its text is the current content. Only `<del>` is excluded among the editorial-marker pair.

---

## Section D — Walk order

Document order, depth-first, as a TreeWalker / pre-order DFS over the live DOM. For each `data-signable` root in source order:

1. Start at the root element.
2. Visit its children in left-to-right order.
3. For each child:
   - If the child matches an excluded selector (§C): skip its entire subtree.
   - If the child is a text node: emit its normalized text (§E).
   - If the child is an element: descend recursively.
   - When ascending out of a **block-level** element, emit a paragraph break (§F).

`data-signable` roots that contain other `data-signable` descendants do not double-count the descendants — the walker uses the outermost root's subtree as the unit, and inner `data-signable` markers are informational only.

---

## Section E — Whitespace and Unicode normalization

### E-1. Per-text-node normalization

For each text node *not inside a preformatted element* (see §E-3):

1. Apply Unicode NFC normalization (`String.prototype.normalize('NFC')`).
2. Replace every run of one or more Unicode whitespace characters (`\s+` in JS regex semantics) with a single ASCII space (`U+0020`).

### E-2. Inter-element whitespace

After per-node normalization, when concatenating text across element boundaries:
- Inline-element boundaries do not insert any extra whitespace. The rendered space between sibling inlines comes from their own text-node content.
- Block-element boundaries insert a paragraph break (`\n\n`) between adjacent runs of text — see §F.

### E-3. Preformatted elements

Inside `<pre>`, `<code>` (only when nested in `<pre>`), `<textarea>`, and any element matching `[data-preformatted]`, whitespace is preserved verbatim. Unicode NFC is still applied. The contents of these elements emit between paragraph breaks (the `<pre>` element is itself block-level) but no internal collapsing occurs.

### E-4. Trim

The final assembled string is trimmed of leading and trailing ASCII whitespace and trailing `\n` runs collapsed to at most a single trailing newline (then trimmed). The intent: a canonical document does not begin or end with blank space.

---

## Section F — Block-boundary markers

A **block-level** element, for the purposes of this spec, is any element matching this fixed list:

```
article, section, aside, nav, header, footer,
div, main, hgroup,
h1, h2, h3, h4, h5, h6,
p, blockquote, pre, hr,
ol, ul, li, dl, dt, dd,
table, thead, tbody, tfoot, tr, td, th, caption,
figure, details, summary, address,
form, fieldset, legend
```

When the walker exits a block-level element, it emits `\n\n` to the output buffer. Consecutive block exits collapse to a single `\n\n` (no `\n\n\n` etc.). The walker tracks a "needs paragraph break" flag rather than literally appending duplicate markers.

`<hr>` emits an additional `\n\n` (it is purely a structural break and has no text content).

`<br>` emits a single `\n` (a soft line break, not a paragraph break).

---

## Section G — Canonical document JSON

The signed object is a UTF-8 JSON encoding with **fixed key order** (no alphabetization, no key omission for empty values — every key is always present, with `""` or `[]` for absent data):

```json
{
  "@context": "https://vanilla-breeze.com/specs/canonical-document-v1",
  "@version": 1,
  "url": "<canonical absolute URL of the page>",
  "title": "<document title>",
  "author": "<author display name>",
  "authorUrl": "<author URL or empty string>",
  "published": "<YYYY-MM-DD or empty string>",
  "modified": "<YYYY-MM-DD or empty string>",
  "version": "<semver string or empty string>",
  "keywords": ["<term>", "..."],
  "topic": "<vb:topic value or empty string>",
  "provenance": "<vb:provenance value or empty string>",
  "review": "<vb:review value or empty string>",
  "status": "<vb:status value or empty string>",
  "license": "<license short name or URL or empty string>",
  "content": "<canonical text per §D-F>"
}
```

**Serialization rules:**
- `JSON.stringify(doc)` with **no** indent, no trailing newline. The output is a single line of JSON (no pretty-printing).
- Keys appear in the order listed above. Implementations MUST construct the object with keys inserted in that order; standard ES engines preserve insertion order for string keys.
- `keywords` is always an array (possibly empty). All other string fields default to `""` when absent.
- The `content` field is the canonical text from §D-F as a single JSON string (newlines encoded as `\n`).

### G-1. URL canonicalization

`url` is the absolute URL of the page including scheme + host + path. Trailing slashes are preserved as published. Query strings and fragments are stripped. Default ports are stripped (`:80`, `:443`). Hostnames are lowercased. No percent-encoding renormalization is performed beyond what the URL parser produces.

### G-2. Date canonicalization

`published` and `modified` are emitted as `YYYY-MM-DD` (UTC date). If the source meta tag carries a full ISO-8601 timestamp, only the date portion is used.

### G-3. Sources for each field

| Field | Source |
|---|---|
| `url` | Page absolute URL with §G-1 normalization |
| `title` | `meta[property="og:title"]` content if present, else `document.title` |
| `author` | `meta[name="author"]` content |
| `authorUrl` | `meta[property="article:author"]` content, else `link[rel="author"]` href |
| `published` | `meta[property="article:published_time"]` content, date portion |
| `modified` | `meta[name="last-modified"]` content, else `meta[property="article:modified_time"]`, date portion |
| `version` | `meta[itemprop="version"]` content |
| `keywords` | `meta[name="keywords"]` content split on `,` and trimmed; empty array if absent |
| `topic` | `meta[name="vb:topic"]` content |
| `provenance` | `meta[name="vb:provenance"]` content |
| `review` | `meta[name="vb:review"]` content |
| `status` | `meta[name="vb:status"]` content |
| `license` | `link[rel="license"]` href if present, else `meta[name="license"]` content |
| `content` | Canonical text walked per §D–F |

---

## Section H — Hashing and signing

The SHA-256 hash is computed over the UTF-8 bytes of `JSON.stringify(canonicalDocument)`.

```
hash = SHA-256(UTF8(JSON.stringify(canonicalDocument)))
```

The hash is emitted as a base64-encoded string in `<meta name="vb:hash" content="sha256-{base64}">`.

The ECDSA-P256-SHA256 signature is computed using Web Crypto:

```
signature = ECDSA-Sign(privateKey, UTF8(JSON.stringify(canonicalDocument)))
```

(The `crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'}, ...)` call internally hashes the input with SHA-256 and signs the digest.)

The signature is emitted as a base64-encoded string in `<meta name="vb:signature">`.

The verifier reconstructs the canonical document from the live DOM using the same `canonicalize()` library, recomputes the JSON bytes, then calls `crypto.subtle.verify(...)` against the signature and public key resolved from `<link rel="author-key">`.

---

## Section I — Library contract

`src/lib/canonicalize.js` exports two functions:

```js
/**
 * Build the canonical document JSON object from a Document.
 * Field order matches §G. No I/O. Pure deterministic walk over the DOM.
 *
 * @param {Document} doc - browser document or jsdom/linkedom document
 * @param {object} [opts]
 * @param {string} [opts.url] - explicit URL (overrides doc.location)
 * @returns {{ url, title, author, ..., content }}
 */
export function buildCanonicalDocument(doc, opts);

/**
 * Serialize the object to its canonical UTF-8 JSON byte string.
 * @param {object} canonical - object from buildCanonicalDocument
 * @returns {string} JSON.stringify with §G insertion order, no indent
 */
export function serializeCanonical(canonical);

/**
 * Compute SHA-256 hash of the canonical JSON. Returns base64 (Web Crypto
 * compatible — runs in browser and Node 20+).
 * @param {string} canonicalJson - output of serializeCanonical
 * @returns {Promise<string>} base64-encoded sha256 digest
 */
export async function canonicalHash(canonicalJson);
```

The library MUST be import-compatible with both Node 20+ (test runner, signer) and modern browsers (verifier inside `<page-info>`). It uses `crypto.subtle` for hashing — globally available in both runtimes.

---

## Section J — What this spec does NOT cover

- **Key management.** Key generation, rotation, custody, and revocation are addressed by `meta-tag-contract-v1.md` §E and the Stage 4 signing reference.
- **Signature wire format.** Documented in `meta-tag-contract-v1.md` §B (integrity).
- **C2PA / VC interop.** Tracked on the standards watch list in the project-stance doc.
- **Multi-locale signing.** A single page is signed once. Translations are separate documents with their own signatures.
- **Streaming or chunked signing.** Out of scope for v1.

---

## Section K — Versioning and forward compatibility

This spec is **v1.0**. The following changes require a new major version:

- Renaming, removing, or reordering any field in §G.
- Adding new excluded element selectors that change the walker output.
- Changing whitespace or Unicode rules.
- Changing the hashing or signing algorithm.

The following changes are backward-compatible (minor version bumps):

- Adding new optional fields appended to the end of the §G key order.
- Adding new sources for an existing field (with a documented precedence).
- Clarifying ambiguous prose without changing behaviour.

Verifiers detect the version by the `@version` field in the canonical JSON. A v2 verifier MUST also accept v1 documents for at least one major release cycle to allow gradual migration.

---

## Section L — Open questions and known limitations

Tracked here so future maintainers don't relitigate or quietly diverge:

1. **`<header>` / `<footer>` inside `<article>`**: v1 excludes both. A v2 may distinguish "page chrome header" from "article-byline header" via host matching — but the rule needs to be deterministic across all DOM shapes. Deferred.
2. **`<table>` cell ordering**: v1 walks rows in DOM order, cells in DOM order. CSS `column-reverse` or `flex-direction:row-reverse` does not affect canonical output. Acceptable: signed text matches DOM, not visual order.
3. **Pseudo-element content**: `::before`/`::after` content is invisible to the DOM walker and never contributes. By design — pseudo-elements are presentational.
4. **Shadow DOM**: v1 walks the light DOM only. Slotted content under `data-signable` is in light DOM and contributes; shadow DOM internals do not. Web components that need to sign their shadow content must project it to slots.
5. **`<img alt>` / `<a title>`**: v1 ignores all attribute text. A v2 may include alt text under a separate `media` field. Deferred.
6. **Whitespace inside `<pre>` with mixed tabs and spaces**: preserved verbatim. Authors who care should normalize at source.
