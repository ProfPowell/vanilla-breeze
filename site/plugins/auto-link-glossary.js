/**
 * @file auto-link-glossary.js
 * @description Build-time auto-linking of vocabulary terms in article prose.
 *
 * For each docs HTML page:
 *   - First occurrence of any concept's prefLabel wraps with
 *     <dfn><a href="/glossary/#term-{id}" data-concept="{id}">term</a></dfn>
 *   - First occurrence of an opted-in altLabel wraps with
 *     <abbr title="{prefLabel}"><a href="..." data-concept="{id}">match</a></abbr>
 *   - Subsequent occurrences in the same page get a bare <a>.
 *   - One link per paragraph max (visual-noise guard).
 *
 * Opt-outs (three layers, decreasing scope):
 *   1. Page frontmatter `autolink: false`
 *   2. Any ancestor element with `data-no-glossary`
 *   3. Manual `<a data-concept="{id}">` already in the page suppresses
 *      auto-linking of THAT concept everywhere in the page.
 *
 * Protected regions never auto-link, regardless of opt-outs:
 *   <a>, <code>, <pre>, <dfn>, <abbr>, <h1>-<h6>, <script>, <style>,
 *   <template>.
 *
 * Per-concept opt-in on altLabel via vocabulary.json:
 *   "vb:autoLink": { "prefLabel": true, "altLabel": false }
 *
 * Defaults when "vb:autoLink" is absent or partially specified:
 *   prefLabel: true    — auto-link the canonical name
 *   altLabel:  false   — opt-in only (safe-by-default for common-word
 *                        altLabels like "review", "lens", "index")
 *
 * Spec: admin/r-n-d/evaluate/glossary-system.md (Auto-Linking section)
 * Bead: vanilla-breeze-vlzg
 */

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VOCAB_PATH = resolve(__dirname, '../src/_data/vocabulary.json');

// Only target prose pages. Index pages, layouts, fragments — skip.
const PROSE_PATH_HINTS = [
  '/docs/concepts/',
  '/docs/elements/',
  '/docs/attributes/',
  '/docs/patterns/',
  '/docs/integrations/',
  '/docs/recipes/',
  '/docs/snippets/',
];

// Skip text inside these elements (and any descendants).
const PROTECTED_TAGS = new Set([
  'a', 'code', 'pre', 'dfn', 'abbr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'script', 'style', 'template', 'noscript',
]);

// Module-level cache so we parse vocabulary once per build.
let matchersCache = null;

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Build the matcher list from vocabulary.json. Each matcher is:
 *   { id, label, kind: 'prefLabel'|'altLabel', prefLabel, regex }
 *
 * Sorted by label length DESCENDING so multi-word labels win over single
 * words in greedy scans (e.g. "release notes" beats "release" if both
 * were in the vocab).
 */
async function loadMatchers() {
  if (matchersCache) return matchersCache;
  const raw = await readFile(VOCAB_PATH, 'utf-8');
  const vocab = JSON.parse(raw);
  const matchers = [];
  for (const c of vocab.concepts || []) {
    const id = c['@id'];
    const prefLabel = c['skos:prefLabel'];
    if (!id || !prefLabel) continue;

    const autoLink = c['vb:autoLink'] || {};
    const prefOn = autoLink.prefLabel !== false; // default ON
    const altOn = autoLink.altLabel === true;    // default OFF

    if (prefOn) {
      matchers.push({
        id, label: prefLabel, kind: 'prefLabel', prefLabel,
        regex: new RegExp(`\\b${escapeRegex(prefLabel)}\\b`, 'i'),
      });
    }
    if (altOn) {
      const alts = Array.isArray(c['skos:altLabel'])
        ? c['skos:altLabel']
        : (c['skos:altLabel'] ? [c['skos:altLabel']] : []);
      for (const alt of alts) {
        if (!alt || alt.length < 2) continue; // single-char altLabels too risky
        matchers.push({
          id, label: alt, kind: 'altLabel', prefLabel,
          regex: new RegExp(`\\b${escapeRegex(alt)}\\b`, 'i'),
        });
      }
    }
  }
  matchers.sort((a, b) => b.label.length - a.label.length);
  matchersCache = matchers;
  return matchers;
}

/** True when this element or any ancestor is in the protected set. */
function isProtected(el) {
  let cur = el;
  while (cur && cur.nodeType === 1) {
    const tag = cur.tagName?.toLowerCase();
    if (tag && PROTECTED_TAGS.has(tag)) return true;
    if (cur.hasAttribute?.('data-no-glossary')) return true;
    cur = cur.parentElement;
  }
  return false;
}

/** Closest paragraph-ish ancestor for density tracking. */
function paragraphKey(el) {
  let cur = el;
  while (cur && cur.nodeType === 1) {
    const tag = cur.tagName?.toLowerCase();
    if (tag === 'p' || tag === 'li' || tag === 'td' || tag === 'dd') return cur;
    cur = cur.parentElement;
  }
  return null;
}

/**
 * Render the wrapper HTML for one match.
 * Splits the original text around the match position and returns three
 * pieces: { before, replacementHTML, after } that the caller stitches
 * back as text + element nodes.
 */
function renderWrapper(matcher, matched, isFirst) {
  const href = `/glossary/#term-${escapeAttr(matcher.id)}`;
  const dataAttr = escapeAttr(matcher.id);
  if (!isFirst) {
    return `<a href="${href}" data-concept="${dataAttr}">${matched}</a>`;
  }
  if (matcher.kind === 'altLabel') {
    return `<abbr title="${escapeAttr(matcher.prefLabel)}"><a href="${href}" data-concept="${dataAttr}">${matched}</a></abbr>`;
  }
  return `<dfn><a href="${href}" data-concept="${dataAttr}">${matched}</a></dfn>`;
}

/**
 * Scan a single text node for the first matching concept (longest-first
 * order). Returns { matcher, index, matched } or null.
 */
function findFirstMatch(textNode, matchers, suppressed, usedFirst) {
  const text = textNode.data;
  if (!text || !text.trim()) return null;
  for (const m of matchers) {
    if (suppressed.has(m.id)) continue;
    // For density: skip if this paragraph already had a link.
    const para = paragraphKey(textNode.parentNode);
    if (para && para.__glossaryLinked) continue;
    m.regex.lastIndex = 0;
    const match = m.regex.exec(text);
    if (match) {
      return { matcher: m, index: match.index, matched: match[0] };
    }
  }
  return null;
}

/**
 * Mutate one text node by replacing the first match with a wrapped <a>
 * (and a <dfn> or <abbr> if this is the first occurrence of the concept
 * in the document).
 */
function applyMatch(document, textNode, { matcher, index, matched }, usedFirst) {
  const text = textNode.data;
  const before = text.slice(0, index);
  const after = text.slice(index + matched.length);
  const isFirst = !usedFirst.has(matcher.id);
  const wrapperHTML = renderWrapper(matcher, matched, isFirst);
  usedFirst.add(matcher.id);

  // Mark the paragraph as having received a link (density guard).
  const para = paragraphKey(textNode.parentNode);
  if (para) para.__glossaryLinked = true;

  // Build replacement nodes: textBefore + parsedWrapper + textAfter
  const tpl = document.createElement('template');
  tpl.innerHTML = wrapperHTML;
  const wrapperNode = tpl.content?.firstChild ?? tpl.firstChild;
  // linkedom's <template> shape can differ; fall back to a fragment.
  let inserted;
  if (wrapperNode) {
    inserted = wrapperNode;
  } else {
    const span = document.createElement('span');
    span.innerHTML = wrapperHTML;
    inserted = span.firstChild;
  }

  const parent = textNode.parentNode;
  if (before) parent.insertBefore(document.createTextNode(before), textNode);
  parent.insertBefore(inserted, textNode);
  if (after) parent.insertBefore(document.createTextNode(after), textNode);
  parent.removeChild(textNode);
}

/**
 * Walk all text nodes under root, returning them in document order.
 * (linkedom's TreeWalker support is limited, so we do this manually.)
 */
function collectTextNodes(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    if (node.nodeType === 3) {
      out.push(node);
      continue;
    }
    if (node.nodeType !== 1) continue;
    // Push children in reverse so we pop in document order.
    const kids = node.childNodes;
    for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
  }
  // Reverse to actually get document order (we pushed-reverse, pop-undo).
  return out.reverse();
}

export class AutoLinkGlossary {
  constructor({ file }) {
    this.file = file;
  }

  async init() {
    const file = this.file;
    if (!file?.src || !file.path?.endsWith('.html')) return;

    // Only target docs prose pages.
    const path = file.path.replaceAll('\\', '/');
    if (!PROSE_PATH_HINTS.some((hint) => path.includes(hint))) return;

    // Per-page opt-out via frontmatter.
    if (file.frontMatter?.autolink === false) return;

    // Skip if Cook has already wrapped this fragment in the layout
    // (some pipelines re-invoke per-file plugins on templated output).
    // Source pages at this stage are plain fragments — they don't start
    // with <!doctype> or <html>.
    const head = file.src.trimStart().slice(0, 16).toLowerCase();
    if (head.startsWith('<!doctype') || head.startsWith('<html')) return;

    const matchers = await loadMatchers();
    if (!matchers.length) return;

    // Strip frontmatter before parsing. By the time this plugin runs,
    // generate-provenance-meta has already parsed file.frontMatter, but
    // the raw YAML is still at the top of file.src. If we left it in,
    // common words like "attribute" or "vocabulary" would match inside
    // YAML values (e.g. `layout: attribute`) and corrupt the front
    // matter — downstream plugins then choke when they re-parse.
    const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;
    const frontMatterMatch = file.src.match(FRONTMATTER_RE);
    const frontMatter = frontMatterMatch ? frontMatterMatch[0] : '';
    const body_src = file.src.slice(frontMatter.length);

    // Wrap-and-unwrap pattern: linkedom's parseHTML doesn't put fragment
    // content into <body> automatically — it leaves <body> empty and
    // dumps stray content elsewhere — so we wrap the source in a body
    // shell before parsing. That gives us a real <body> tree to walk
    // and re-serialize, then we strip the shell back off.
    const { document } = parseHTML(
      `<!doctype html><html><body>${body_src}</body></html>`
    );
    const body = document.body;
    if (!body) return;

    // Find concepts the author already mentioned manually. Those concepts
    // are entirely suppressed for this page — author's manual choices win.
    const suppressed = new Set();
    for (const a of body.querySelectorAll('a[data-concept]')) {
      const id = a.getAttribute('data-concept');
      if (id) suppressed.add(id);
    }

    // Walk text nodes; for each, find first match and apply.
    const usedFirst = new Set();
    let changed = false;
    const textNodes = collectTextNodes(body);
    for (const tn of textNodes) {
      if (!tn.parentNode || tn.nodeType !== 3) continue;
      if (isProtected(tn.parentNode)) continue;
      const hit = findFirstMatch(tn, matchers, suppressed, usedFirst);
      if (!hit) continue;
      applyMatch(document, tn, hit, usedFirst);
      changed = true;
    }

    if (!changed) return;
    // Unwrap: re-attach the frontmatter, then the body's inner HTML.
    file.src = frontMatter + body.innerHTML;
  }
}
