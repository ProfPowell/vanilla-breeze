/**
 * canonicalize: Deterministic canonical-document representation for signing.
 *
 * Implementation of admin/specs/canonical-document-v1.md. Importable from
 * Node (signer / build tooling) and modern browsers (verifier inside
 * <page-info>). The walk and serialization are pure DOM operations — no
 * I/O, no globals beyond the document passed in. SHA-256 uses Web Crypto,
 * which is global in browsers and Node 20+.
 *
 * Stability contract: identical input MUST produce byte-identical output
 * across signer and verifier. Changes to walk order, whitespace handling,
 * field order, or excluded selectors require a new major spec version (v2).
 */

const SPEC_VERSION = 1;
const SPEC_CONTEXT = 'https://vanilla-breeze.com/specs/canonical-document-v1';

/* §C — Excluded element tag names. Subtree dropped entirely.
   Note: content-host lens components (time-index, glossary-index,
   site-index, site-map) are NOT excluded — they wrap the published
   prose and enhance it; their light-DOM children ARE the content
   to be signed. Only derived-view components (page-info, page-toc,
   change-set, page-tools, page-stats, content-lens) are excluded
   because they render metadata about the page itself. */
const EXCLUDED_TAGS = new Set([
  'SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT',
  'NAV', 'ASIDE', 'HEADER', 'FOOTER',
  'FIGCAPTION',
  'PAGE-INFO', 'CHANGE-SET', 'PAGE-TOC', 'PAGE-TOOLS', 'PAGE-STATS', 'CONTENT-LENS',
  'BUTTON', 'DIALOG', 'MENU', 'FORM',
  'DEL'
]);

/* §F — Block-level tag names. Emit \n\n on element exit. */
const BLOCK_TAGS = new Set([
  'ARTICLE', 'SECTION', 'ASIDE', 'NAV', 'HEADER', 'FOOTER',
  'DIV', 'MAIN', 'HGROUP',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'P', 'BLOCKQUOTE', 'PRE', 'HR',
  'OL', 'UL', 'LI', 'DL', 'DT', 'DD',
  'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TD', 'TH', 'CAPTION',
  'FIGURE', 'DETAILS', 'SUMMARY', 'ADDRESS',
  'FORM', 'FIELDSET', 'LEGEND'
]);

/* §E-3 — Preformatted contexts. Whitespace preserved verbatim. */
const PREFORMATTED_TAGS = new Set(['PRE', 'TEXTAREA']);

/**
 * Decide whether an element is excluded per §C.
 */
function isExcluded(el) {
  if (!el || el.nodeType !== 1) return false;
  if (EXCLUDED_TAGS.has(el.tagName)) return true;
  if (el.hasAttribute('hidden')) return true;
  if (el.getAttribute('aria-hidden') === 'true') return true;
  if (el.getAttribute('data-signable') === 'false') return true;
  return false;
}

/**
 * Walk a subtree and append normalized text to the buffer. The buffer is
 * a small stateful object so block-boundary collapsing works across calls.
 */
function walk(el, buf, preformatted) {
  if (isExcluded(el)) return;

  const isBlock = BLOCK_TAGS.has(el.tagName);
  const inPre = preformatted || PREFORMATTED_TAGS.has(el.tagName);

  for (const child of el.childNodes) {
    if (child.nodeType === 3) { /* text node */
      const raw = child.nodeValue || '';
      if (!raw) continue;
      if (inPre) {
        appendText(buf, raw.normalize('NFC'));
      } else {
        const normalized = raw.normalize('NFC').replace(/\s+/g, ' ');
        if (normalized === '') continue;
        if (normalized === ' ' && (buf.text === '' || buf.text.endsWith(' ') || buf.text.endsWith('\n'))) {
          continue;
        }
        appendText(buf, normalized);
      }
    } else if (child.nodeType === 1) { /* element */
      if (child.tagName === 'BR') {
        appendBreak(buf, '\n');
        continue;
      }
      walk(child, buf, inPre);
    }
    /* comments (8) and others — ignored */
  }

  if (isBlock) {
    appendBreak(buf, '\n\n');
  }
  if (el.tagName === 'HR') {
    appendBreak(buf, '\n\n');
  }
}

function appendText(buf, s) {
  buf.text += s;
}

function appendBreak(buf, marker) {
  if (buf.text.endsWith(marker)) return;
  /* Collapse \n\n + \n -> \n\n; \n + \n\n -> \n\n */
  if (marker === '\n\n' && buf.text.endsWith('\n')) {
    buf.text = buf.text.replace(/\n+$/, '') + '\n\n';
    return;
  }
  if (marker === '\n' && buf.text.endsWith('\n\n')) {
    return;
  }
  buf.text += marker;
}

/**
 * Walk every [data-signable] root in document order and produce the
 * canonical text per §D–F.
 */
function buildCanonicalText(doc) {
  const roots = [...doc.querySelectorAll('[data-signable]')];

  /* Drop nested roots — only walk outermost ancestors per §D. */
  const outermost = roots.filter((root) => {
    return !roots.some((other) => other !== root && other.contains(root));
  });

  const buf = { text: '' };
  for (const root of outermost) {
    walk(root, buf, false);
  }

  /* §E-4: trim leading whitespace and collapse trailing whitespace. */
  return buf.text.replace(/^\s+/, '').replace(/\s+$/, '');
}

/* ─────────────────────────────────────────── meta-tag readers (§G-3) ── */

function meta(doc, name) {
  return doc.querySelector(`meta[name="${cssEscape(name)}"]`)?.getAttribute('content') || '';
}
function prop(doc, name) {
  return doc.querySelector(`meta[property="${cssEscape(name)}"]`)?.getAttribute('content') || '';
}
function itemprop(doc, name) {
  return doc.querySelector(`meta[itemprop="${cssEscape(name)}"]`)?.getAttribute('content') || '';
}
function linkHref(doc, rel) {
  return doc.querySelector(`link[rel="${cssEscape(rel)}"]`)?.getAttribute('href') || '';
}

/* Conservative CSS attribute-value escape — only handles the values we'll
   ever pass (alphanumerics + : - _ /). No quotes, no backslashes. */
function cssEscape(s) {
  return String(s).replace(/[^a-zA-Z0-9:_\-/]/g, '');
}

/* §G-1 — URL canonicalization. */
function canonicalUrl(rawUrl) {
  if (!rawUrl) return '';
  try {
    const url = new URL(rawUrl);
    url.search = '';
    url.hash = '';
    /* Strip default ports — URL constructor already does this for http/https. */
    let out = `${url.protocol}//${url.hostname.toLowerCase()}`;
    if (url.port) out += `:${url.port}`;
    out += url.pathname;
    return out;
  } catch {
    return rawUrl;
  }
}

/* §G-2 — Date canonicalization to YYYY-MM-DD. */
function canonicalDate(value) {
  if (!value) return '';
  const m = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

/* §G-3 — Title source: og:title || document.title. */
function getTitle(doc) {
  return prop(doc, 'og:title') || (doc.title || '');
}

function getKeywords(doc) {
  const raw = meta(doc, 'keywords');
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function getLicense(doc) {
  return linkHref(doc, 'license') || meta(doc, 'license');
}

/**
 * Build the canonical document JSON object per §G. Keys inserted in the
 * exact order required — JSON.stringify preserves string-key insertion
 * order in all conforming ES engines.
 */
export function buildCanonicalDocument(doc, opts = {}) {
  const url = opts.url ?? doc?.location?.href ?? '';
  const published = canonicalDate(prop(doc, 'article:published_time'));
  const modified = canonicalDate(meta(doc, 'last-modified') || prop(doc, 'article:modified_time'));

  return {
    '@context': SPEC_CONTEXT,
    '@version': SPEC_VERSION,
    url: canonicalUrl(url),
    title: getTitle(doc),
    author: meta(doc, 'author'),
    authorUrl: prop(doc, 'article:author') || linkHref(doc, 'author'),
    published,
    modified,
    version: itemprop(doc, 'version'),
    keywords: getKeywords(doc),
    topic: meta(doc, 'vb:topic'),
    provenance: meta(doc, 'vb:provenance'),
    review: meta(doc, 'vb:review'),
    status: meta(doc, 'vb:status'),
    license: getLicense(doc),
    content: buildCanonicalText(doc)
  };
}

/**
 * Serialize the canonical document to the byte-stable JSON form per §G.
 * No indentation, no trailing newline. Single line of JSON.
 */
export function serializeCanonical(canonical) {
  return JSON.stringify(canonical);
}

/**
 * SHA-256 of the canonical JSON. Returns base64 (no `sha256-` prefix —
 * callers prepend that when emitting the meta tag). Uses Web Crypto,
 * which is global in browsers and Node ≥20.
 */
export async function canonicalHash(canonicalJson) {
  const data = new TextEncoder().encode(canonicalJson);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64Encode(new Uint8Array(digest));
}

function base64Encode(bytes) {
  /* Cross-runtime: Node 20+ has globalThis.btoa via Buffer-backed polyfill;
     browsers have native btoa. Both accept a binary string. */
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

/**
 * Internal — exported for tests only. Not part of the public spec contract.
 */
export const _internal = {
  buildCanonicalText,
  canonicalUrl,
  canonicalDate,
  EXCLUDED_TAGS,
  BLOCK_TAGS,
  PREFORMATTED_TAGS,
  SPEC_VERSION,
  SPEC_CONTEXT
};
