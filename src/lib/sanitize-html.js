/**
 * sanitize-html: Shared HTML/SVG sanitizer for Vanilla Breeze components
 *
 * ## HTML Trust Policy
 *
 * Any component that renders HTML from external sources (API responses, data
 * bindings, fetched partials) MUST follow these rules:
 *
 * 1. **Use this sanitizer.** Import `sanitizeHTML` and pass all untrusted HTML
 *    through it before assigning to `innerHTML` or `insertAdjacentHTML`.
 *    Inline SVG from a network source goes through `sanitizeSVG`.
 *
 * 2. **Prefer textContent.** If the content is plain text, use `textContent`
 *    or `createTextNode` — never `innerHTML`. The sanitizer is for cases
 *    where the content is intentionally HTML (rich text, formatted responses).
 *
 * 3. **Trust is an explicit author opt-in.** `<include-file>` sanitizes fetched
 *    HTML unless the author sets `trusted`; scripts only re-run with
 *    `trusted allow-scripts`. `<markdown-viewer>` sanitizes unless
 *    `sanitize="off"`. Never derive trust from the content itself.
 *
 * 4. **No ad-hoc sanitizers.** Do not write per-component sanitization logic.
 *    If this sanitizer is missing a case, fix it here so all consumers benefit.
 *
 * ### Current consumers
 *
 * - `chat-window`    — sanitizes endpoint responses before rendering bubbles
 * - `markdown-viewer` — sanitizes parsed markdown by default (`sanitize="off"`
 *   opts out); covers ai-summary output and comment-box content
 * - `markdown-editable-init` — sanitizes inline markdown edits
 * - `comment-thread` — sanitizes `bodyHtml`
 * - `card-list`      — sanitizes `data-field-html` bindings from JSON data
 * - `include-file`   — sanitizes fetched fragments unless `trusted` is set
 * - `glossary-wc`    — sanitizes `definitionHtml` from `src` JSON or `.terms`
 * - `icon-wc`        — `sanitizeSVG` on fetched icon SVG
 *
 * ### What this strips
 *
 * - Elements: script, iframe, frame, frameset, object, embed, applet, portal,
 *   fencedframe, form, base, link, meta (incl. http-equiv), noscript,
 *   foreignObject; SVG animate/set elements that target href; `<style>`
 *   elements carrying script URLs, expression(), bindings or CSS imports
 * - Attributes: every `on*` event handler, `srcdoc`, `style` values carrying
 *   expression()/javascript:/bindings
 * - URLs: `javascript:` / `vbscript:` (whitespace/control-char obfuscation
 *   included) on any URL attribute; `data:` on navigation/loader attributes
 *   (href, xlink:href, action, formaction, data, …); on media `src`/`poster`
 *   only `data:image|audio|video|font/…` survives
 * - `<template>` contents are sanitized recursively
 * - Fetch-capable VB elements are neutralised, so sanitized content cannot
 *   pull in more (unsanitized) remote HTML:
 *     - `<include-file>` loses `src` (unless `allowIncludeFile`), and always
 *       loses `trusted`, `allow-scripts`, `allow-cross-origin`
 *     - `<markdown-viewer>` loses `src`, `sanitize` (cannot opt out) and `ping`
 *
 * This is NOT a full DOMPurify replacement. It covers OWASP top-10 XSS
 * vectors for the component use cases above. If the project starts accepting
 * arbitrary user-generated HTML at scale, adopt DOMPurify or the Sanitizer API.
 */

/** Elements removed outright (compared on lower-cased localName). */
const DANGEROUS_ELEMENTS = new Set([
  'script', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet',
  'portal', 'fencedframe', 'form', 'base', 'link', 'meta', 'noscript',
  'foreignobject',
]);

/** SVG animation elements that can rewrite an href to a script URL. */
const ANIMATION_ELEMENTS = new Set(['animate', 'set', 'animatemotion', 'animatetransform']);

/** Attributes whose value is a URL that can navigate or load a document. */
const NAV_URL_ATTRS = new Set([
  'href', 'xlink:href', 'action', 'formaction', 'data', 'codebase', 'cite',
  'background', 'longdesc', 'manifest', 'to', 'from', 'values', 'by',
]);

/** Attributes whose value is a media URL (data:image etc. allowed). */
const MEDIA_URL_ATTRS = new Set(['src', 'poster', 'srcset']);

/**
 * Fetch-capable VB elements: attributes stripped so sanitized content cannot
 * make them load (and render) further remote HTML or opt out of sanitizing.
 * `src` on include-file is handled separately (allowIncludeFile option).
 */
const NEUTRALISE = /** @type {Record<string, string[]>} */ ({
  'include-file': ['trusted', 'allow-scripts', 'allow-cross-origin'],
  'markdown-viewer': ['src', 'sanitize', 'ping'],
});

/**
 * Normalise a URL attribute value the way browsers do before scheme parsing:
 * strip ASCII whitespace / C0 + C1 controls anywhere, lower-case.
 * @param {string} value
 */
function normaliseUrl(value) {
  return String(value).replace(/[\u0000- \u007f-\u009f]/g, '').toLowerCase();
}

/**
 * @param {string} value
 * @param {boolean} media - true for src/poster/srcset (data: media allowed)
 * @returns {boolean}
 */
export function isDangerousUrl(value, media = false) {
  const v = normaliseUrl(value);
  if (!media) return /^(javascript|vbscript|livescript|data):/.test(v);
  // Media attributes may hold a srcset-style list: check every candidate
  if (/(^|,)(javascript|vbscript|livescript):/.test(v)) return true;
  if (/(^|,)data:/.test(v)) {
    // Every data: candidate must be a plain media type
    const parts = v.split(/(?=data:)/).filter((p) => p.startsWith('data:'));
    return parts.some((p) => !/^data:(image|audio|video|font)\//.test(p));
  }
  return false;
}

/** @param {string} css */
function isDangerousCss(css) {
  const v = String(css)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\\/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
  return /expression\(|javascript:|vbscript:|-moz-binding|behavior:|@import/.test(v);
}

/**
 * Strip dangerous attributes from one element (mutates).
 * @param {Element} el
 */
function cleanAttributes(el) {
  for (const attr of [...el.attributes]) {
    const name = attr.name.toLowerCase();

    if (name.startsWith('on') || name === 'srcdoc') {
      el.removeAttribute(attr.name);
      continue;
    }
    if (name === 'style') {
      if (isDangerousCss(attr.value)) el.removeAttribute(attr.name);
      continue;
    }
    if (NAV_URL_ATTRS.has(name) || name.endsWith(':href')) {
      if (isDangerousUrl(attr.value, false)) el.removeAttribute(attr.name);
      continue;
    }
    if (MEDIA_URL_ATTRS.has(name)) {
      if (isDangerousUrl(attr.value, true)) el.removeAttribute(attr.name);
    }
  }
}

/**
 * Sanitize every element under (and optionally including) `root` in place.
 * @param {Element | DocumentFragment} root
 * @param {{ allowIncludeFile?: boolean, includeRoot?: boolean }} opts
 */
function sanitizeTree(root, opts) {
  const list = /** @type {Element[]} */ ([...root.querySelectorAll('*')]);
  if (opts.includeRoot) list.unshift(/** @type {Element} */ (root));

  for (const el of list) {
    const name = String(el.localName || el.tagName || '').toLowerCase();

    if (DANGEROUS_ELEMENTS.has(name)) { el.remove(); continue; }

    if (ANIMATION_ELEMENTS.has(name)) {
      const target = (el.getAttribute('attributeName') || el.getAttribute('attributename') || '').toLowerCase();
      if (target.includes('href')) { el.remove(); continue; }
    }

    if (name === 'style' && isDangerousCss(el.textContent || '')) { el.remove(); continue; }

    if (name === 'template') {
      const content = /** @type {HTMLTemplateElement} */ (el).content;
      if (content) sanitizeTree(content, { ...opts, includeRoot: false });
    }

    cleanAttributes(el);

    const neutralise = NEUTRALISE[name];
    if (neutralise) for (const a of neutralise) el.removeAttribute(a);
    if (name === 'include-file' && !opts.allowIncludeFile) el.removeAttribute('src');
  }
}

/**
 * Sanitize an HTML string.
 *
 * @param {string} html - Raw HTML string
 * @param {{ allowIncludeFile?: boolean }} [options]
 *   allowIncludeFile — keep `src` on nested `<include-file>` (used by
 *   include-file itself: nested includes stay same-origin + sanitized because
 *   their trust attributes are still stripped). Off for every other consumer.
 * @returns {string} Sanitized HTML safe for innerHTML
 */
export function sanitizeHTML(html, options = {}) {
  if (!html || typeof html !== 'string') return '';

  const template = document.createElement('template');
  template.innerHTML = html;
  sanitizeTree(template.content, { allowIncludeFile: !!options.allowIncludeFile });
  return template.innerHTML;
}

/**
 * Sanitize an SVG element in place (the element itself and all descendants):
 * removes script, foreignObject, iframe/object/embed and the other elements
 * above, href-targeting animate/set, every on* handler, and javascript:/data:
 * hrefs. Call it on a parsed-but-not-yet-inserted SVG (e.g. from DOMParser or
 * a <template>) before adopting it into the document.
 *
 * @template {Element} T
 * @param {T} svg
 * @returns {T} The same element, sanitized.
 */
export function sanitizeSVG(svg) {
  if (!svg || typeof svg !== 'object' || !('attributes' in svg)) return svg;
  sanitizeTree(svg, { includeRoot: true });
  return svg;
}
