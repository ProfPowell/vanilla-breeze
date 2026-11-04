/**
 * sanitize-html: Shared HTML/SVG/MathML sanitizer for Vanilla Breeze components
 *
 * ## HTML Trust Policy
 *
 * Any component that renders HTML from external sources (API responses, data
 * bindings, fetched partials) MUST follow these rules:
 *
 * 1. **Insert nodes, never re-parse.** Use `sanitizeToFragment(html)` and
 *    insert the returned DocumentFragment (`el.replaceChildren(fragment)`).
 *    Serialising sanitized markup and parsing it again (`innerHTML =
 *    sanitizeHTML(...)`) is how mutation XSS (mXSS) works: the second parse
 *    can build a different tree from the one that was checked. `sanitizeHTML`
 *    still returns a string for serialisation (storage, events, tests) and is
 *    hardened against round-trip mutation, but in-repo code inserts nodes.
 *    Inline SVG from a network source goes through `sanitizeSVG`; MathML
 *    markup goes through `sanitizeMathML`.
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
 *   opts out); covers ai-summary output and markdown-editor previews
 * - `markdown-editable-init` — sanitizes inline markdown edits
 * - `comment-thread` — sanitizes `bodyHtml`
 * - `card-list`      — sanitizes `data-field-html` bindings from JSON data
 * - `include-file`   — sanitizes fetched fragments unless `trusted` is set
 *   (fragment profile: keeps `id`/`name`, safe `style` attributes, popover /
 *   command invokers, `autofocus` and submit buttons as authored)
 * - `glossary-wc`    — sanitizes `definitionHtml` from `src` JSON or `.terms`
 * - `icon-wc`        — `sanitizeSVG` on fetched icon SVG
 * - `math-init`      — `sanitizeMathML` on `data-mathml`
 *
 * ### What this strips (default "untrusted" profile)
 *
 * - Elements: script, style (anywhere, any namespace), iframe, frame,
 *   frameset, object, embed, applet, portal, fencedframe, form, base, link,
 *   meta, noscript, noembed, noframes, xmp, plaintext, title (an SVG
 *   `<title>`/`<desc>` survives only while it holds plain text),
 *   foreignObject, MathML mglyph / malignmark / annotation-xml, elements
 *   outside the HTML/SVG/MathML namespaces, SVG animate/set elements that
 *   target href, and every comment node
 * - Attributes: every `on*` event handler, `srcdoc`, `style` (all of it —
 *   blocks fixed-position overlays and CSS exfiltration), the form-hijack
 *   attributes `form`, `formaction`, `formmethod`, `formtarget`,
 *   `formenctype`, `formnovalidate`, `action`, `method`, the page-reaching
 *   invokers `popovertarget`, `popovertargetaction`, `commandfor`,
 *   `command`, `interestfor`, plus `autofocus` and `ping`
 * - DOM clobbering: `id` and `name` are prefixed with `user-content-` (as on
 *   GitHub). References inside the same fragment are rewritten to match
 *   (`href="#x"`, `for`, `headers`, `list`, `usemap`, `aria-labelledby` and
 *   the other id-reference ARIA attributes, SVG `url(#x)`); id references
 *   that point outside the fragment are dropped. Fragment links to page ids
 *   (`href="#top"`) are left alone.
 * - Buttons and submit/reset/image inputs become `type="button"` so they
 *   cannot submit an ancestor page form
 * - URLs: `javascript:` / `vbscript:` (whitespace/control-char obfuscation
 *   included) on any URL attribute; `data:` on navigation/loader attributes
 *   (href, xlink:href, action, formaction, data, …); on media `src`/`poster`
 *   only `data:image|audio|video|font/…` survives
 * - `<template>` contents are sanitized recursively
 * - Fetch-capable VB elements are neutralised, so sanitized content cannot
 *   pull in more (unsanitized) remote HTML:
 *     - `<include-file>` loses `src` (unless `allowIncludeFile`), and always
 *       loses `trusted`, `allow-scripts`, `allow-cross-origin`
 *     - `<markdown-viewer>` loses `src`, `sanitize` (cannot opt out),
 *       `allow-cross-origin` and `ping`
 * - Remote-loading custom elements (untrusted profile only — the fragment
 *   profile keeps them, since include-file partials are author content):
 *     - Third-party embeds are unwrapped to their (sanitized) fallback
 *       children: `<social-embed>` (platform iframes), `<youtube-player>`
 *       (YouTube thumbnail + iframe), `<geo-map>` (map tiles from any
 *       tile-url host). The authored link / address inside survives.
 *     - Every other custom element (any tag with a hyphen) loses the
 *       attributes VB components fetch or post through: `src`, `src-dark`,
 *       `data-src`, `url`, `endpoint`, `tile-url` — card-list, glossary-wc,
 *       site-map, topic-map, notification-wc, version-switcher, chat-window /
 *       ai-chat / ai-summary (which POST page or user text to `endpoint`) and
 *       any future component. Exception: `<audio-player>`, `<video-player>`,
 *       `<image-map>` and `<brand-mark>`, whose `src` is a media / image URL
 *       exactly like the native `<audio>` / `<video>` / `<img>` it wraps
 *       (still checked as a media URL).
 *
 * What SURVIVES: ordinary formatting markup, links (http(s), relative,
 * mailto, fragment), remote images (tracking pixels are possible), media
 * `data:` URLs, `class`, `data-*`, ARIA, inline SVG and MathML, form
 * controls (inert: no form association, prefixed names, buttons can't
 * submit), `<details>`, tables.
 *
 * This is NOT a full DOMPurify replacement. It covers OWASP top-10 XSS
 * vectors and the known mXSS classes for the component use cases above. If
 * the project starts accepting arbitrary user-generated HTML at scale, adopt
 * DOMPurify or the Sanitizer API (`Element.setHTML`).
 */

const NS_HTML = 'http://www.w3.org/1999/xhtml';
const NS_SVG = 'http://www.w3.org/2000/svg';
const NS_MATHML = 'http://www.w3.org/1998/Math/MathML';
const KNOWN_NS = new Set([NS_HTML, NS_SVG, NS_MATHML]);

/** Prefix applied to `id` / `name` in untrusted content (DOM clobbering). */
export const USER_CONTENT_PREFIX = 'user-content-';

/** Elements removed outright (compared on lower-cased localName). */
const DANGEROUS_ELEMENTS = new Set([
  'script', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet',
  'portal', 'fencedframe', 'form', 'base', 'link', 'meta', 'noscript',
  'foreignobject',
  // Raw-text / legacy elements: their contents serialise unescaped, the
  // classic mXSS carriers. <style> also injects page-global CSS.
  'style', 'xmp', 'noembed', 'noframes', 'plaintext',
  // MathML parser-confusion gadgets
  'mglyph', 'malignmark', 'annotation-xml',
]);

/**
 * Text-integration elements kept only in SVG and only while they hold plain
 * text (SVG <title>/<desc> carry accessible names for inline icons).
 */
const TEXT_ONLY_SVG = new Set(['title', 'desc']);

/** SVG animation elements that can rewrite an href to a script URL. */
const ANIMATION_ELEMENTS = new Set(['animate', 'set', 'animatemotion', 'animatetransform']);

/** Attributes whose value is a URL that can navigate or load a document. */
const NAV_URL_ATTRS = new Set([
  'href', 'xlink:href', 'action', 'formaction', 'data', 'codebase', 'cite',
  'background', 'longdesc', 'manifest', 'to', 'from', 'values', 'by',
]);

/** Attributes whose value is a media URL (data:image etc. allowed). */
const MEDIA_URL_ATTRS = new Set(['src', 'poster', 'srcset']);

/** Removed in every profile: iframe documents, form hijacking, beacons. */
const ALWAYS_DROP_ATTRS = new Set([
  'srcdoc', 'form', 'formaction', 'formmethod', 'formtarget', 'formenctype',
  'formnovalidate', 'action', 'method', 'ping',
]);

/**
 * Removed in the untrusted profile only: invokers that can reach page
 * elements by id, and focus stealing. The fragment profile (keepIds) keeps
 * them — its ids are verbatim, so a partial's own popovers keep working.
 */
const UNTRUSTED_DROP_ATTRS = new Set([
  'popovertarget', 'popovertargetaction', 'commandfor', 'command',
  'interestfor', 'autofocus',
]);

/** Attributes whose value is a space-separated list of id references. */
const IDREF_ATTRS = new Set([
  'for', 'headers', 'list', 'aria-labelledby', 'aria-describedby',
  'aria-controls', 'aria-owns', 'aria-flowto', 'aria-details',
  'aria-errormessage', 'aria-activedescendant',
]);

/**
 * Fetch-capable VB elements: attributes stripped so sanitized content cannot
 * make them load (and render) further remote HTML or opt out of sanitizing.
 * `src` on include-file is handled separately (allowIncludeFile option).
 */
const NEUTRALISE = /** @type {Record<string, string[]>} */ ({
  'include-file': ['trusted', 'allow-scripts', 'allow-cross-origin'],
  'markdown-viewer': ['src', 'sanitize', 'ping', 'allow-cross-origin'],
});

/**
 * Untrusted profile: custom elements that embed third-party documents or
 * tiles. They are replaced by their own children (the authored fallback).
 */
const EMBED_ELEMENTS = new Set(['social-embed', 'youtube-player', 'geo-map']);

/**
 * Untrusted profile: attributes through which a custom element fetches,
 * embeds or posts to a URL. Stripped from every custom element except
 * MEDIA_SRC_ELEMENTS (include-file keeps its own allowIncludeFile rule).
 */
const REMOTE_ATTRS = ['src', 'src-dark', 'data-src', 'url', 'endpoint', 'tile-url'];

/** Custom elements whose src is a plain media / image URL (native-equivalent). */
const MEDIA_SRC_ELEMENTS = new Set(['audio-player', 'video-player', 'image-map', 'brand-mark']);

/**
 * @typedef {object} SanitizeOptions
 * @property {boolean} [allowIncludeFile] keep `src` on nested `<include-file>`
 *   (used by include-file itself: nested includes stay same-origin +
 *   sanitized because their trust attributes are still stripped)
 * @property {boolean} [keepIds] fragment profile (include-file): keep `id` /
 *   `name` verbatim instead of prefixing them with `user-content-`, and keep
 *   popover/command invokers, `autofocus` and button types as authored
 * @property {boolean} [keepStyle] keep `style` attributes that carry no
 *   script, binding, import or `position: fixed` (fragment profile)
 */

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
  return /expression\(|javascript:|vbscript:|-moz-binding|behavior:|@import|position:fixed/.test(v);
}

/** @param {Element} el */
const nameOf = (el) => String(el.localName || el.tagName || '').toLowerCase();

/** @param {string} v */
const prefixed = (v) => (v.startsWith(USER_CONTENT_PREFIX) ? v : USER_CONTENT_PREFIX + v);

/**
 * Should this element be removed (with its subtree)?
 * @param {Element} el
 * @param {string} name
 */
function isDangerousElement(el, name) {
  if (DANGEROUS_ELEMENTS.has(name)) return true;
  const ns = el.namespaceURI;
  if (ns && !KNOWN_NS.has(ns)) return true;
  if (name === 'title' && ns !== NS_SVG) return true;
  if (TEXT_ONLY_SVG.has(name) && ns === NS_SVG && el.children?.length) return true;
  if (ANIMATION_ELEMENTS.has(name)) {
    const target = (el.getAttribute('attributeName') || el.getAttribute('attributename') || '').toLowerCase();
    if (target.includes('href')) return true;
  }
  return false;
}

/**
 * Strip dangerous attributes from one element (mutates).
 * @param {Element} el
 * @param {SanitizeOptions & { ids: Map<string, string> }} opts
 */
function cleanAttributes(el, opts) {
  for (const attr of [...el.attributes]) {
    const name = attr.name.toLowerCase();

    if (name.startsWith('on') || ALWAYS_DROP_ATTRS.has(name)
      || (!opts.keepIds && UNTRUSTED_DROP_ATTRS.has(name))) {
      el.removeAttribute(attr.name);
      continue;
    }
    if (name === 'style') {
      if (!opts.keepStyle || isDangerousCss(attr.value)) el.removeAttribute(attr.name);
      continue;
    }
    if ((name === 'id' || name === 'name') && !opts.keepIds) {
      const next = prefixed(attr.value);
      if (name === 'id') opts.ids.set(attr.value, next);
      else opts.ids.set(`name:${attr.value}`, next);
      el.setAttribute(attr.name, next);
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
 * Buttons and submit-like inputs in untrusted content must not submit an
 * ancestor page form.
 * @param {Element} el
 * @param {string} name
 */
function defuseSubmit(el, name) {
  const type = (el.getAttribute('type') || '').toLowerCase();
  if (name === 'button' && type !== 'button') el.setAttribute('type', 'button');
  if (name === 'input' && /^(submit|reset|image)$/.test(type)) el.setAttribute('type', 'button');
}

/**
 * Second pass (untrusted profile): rewrite id references to the prefixed
 * ids; drop id references that point outside the fragment.
 * @param {Element[]} list
 * @param {Map<string, string>} ids
 */
function rewriteReferences(list, ids) {
  for (const el of list) {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value;
      if ((name === 'href' || name.endsWith(':href')) && value.startsWith('#')) {
        const target = safeDecode(value.slice(1));
        if (ids.has(target)) el.setAttribute(attr.name, `#${ids.get(target)}`);
      } else if (name === 'usemap' && value.startsWith('#')) {
        const next = ids.get(`name:${value.slice(1)}`);
        if (next) el.setAttribute(attr.name, `#${next}`);
        else el.removeAttribute(attr.name);
      } else if (IDREF_ATTRS.has(name)) {
        const tokens = value.split(/\s+/).filter(Boolean)
          .map((t) => ids.get(t) || (t.startsWith(USER_CONTENT_PREFIX) ? t : null))
          .filter(Boolean);
        if (tokens.length) el.setAttribute(attr.name, tokens.join(' '));
        else el.removeAttribute(attr.name);
      } else if (value.includes('url(#')) {
        el.setAttribute(attr.name, value.replace(/url\(#([^)]+)\)/g,
          (m, id) => (ids.has(id) ? `url(#${ids.get(id)})` : m)));
      }
    }
  }
}

/** @param {string} s */
function safeDecode(s) {
  try { return decodeURIComponent(s); } catch { return s; }
}

/**
 * Remove comment nodes (they carry no content and are a parser-confusion
 * vector). Walks childNodes when the tree exposes them.
 * @param {Node} node
 */
function removeComments(node) {
  const kids = /** @type {any} */ (node).childNodes;
  if (!kids) return;
  for (const child of [...kids]) {
    if (child.nodeType === 8) child.remove();
    else if (child.nodeType === 1 || child.nodeType === 11) removeComments(child);
  }
}

/**
 * Sanitize every element under (and optionally including) `root` in place.
 * @param {Element | DocumentFragment} root
 * @param {SanitizeOptions & { includeRoot?: boolean, svgOnly?: boolean }} opts
 */
function sanitizeTree(root, opts) {
  removeComments(root);
  const list = /** @type {Element[]} */ ([...root.querySelectorAll('*')]);
  if (opts.includeRoot) list.unshift(/** @type {Element} */ (root));
  const ids = new Map();
  const kept = [];
  const ctx = { ...opts, ids };

  for (const el of list) {
    // Skip descendants of an element removed earlier in this pass
    if (!isAttachedTo(el, root)) continue;
    const name = nameOf(el);

    if (opts.svgOnly && (TEXT_ONLY_SVG.has(name) || name === 'style')) {
      // sanitizeSVG output is inserted as nodes into icon-wc's shadow root:
      // <title>/<desc> stay, a <style> stays unless it carries script/imports
      if (name === 'style' && isDangerousCss(el.textContent || '')) { el.remove(); continue; }
    } else if (isDangerousElement(el, name)) {
      el.remove();
      continue;
    }

    if (!opts.keepIds && !opts.svgOnly && EMBED_ELEMENTS.has(name)) {
      // Keep the fallback: children move up (and are visited later in this
      // pass — the snapshot is in document order), the embed host goes.
      unwrap(el);
      continue;
    }

    if (name === 'template') {
      const content = /** @type {HTMLTemplateElement} */ (el).content;
      if (content) sanitizeTree(content, { ...opts, includeRoot: false });
    }

    cleanAttributes(el, ctx);
    if (!opts.keepIds) defuseSubmit(el, name);

    const neutralise = NEUTRALISE[name];
    if (neutralise) for (const a of neutralise) el.removeAttribute(a);
    if (name === 'include-file' && !opts.allowIncludeFile) el.removeAttribute('src');
    if (!opts.keepIds && !opts.svgOnly && name.includes('-') && name !== 'include-file'
      && !MEDIA_SRC_ELEMENTS.has(name)) {
      for (const a of REMOTE_ATTRS) el.removeAttribute(a);
    }
    kept.push(el);
  }

  if (!opts.keepIds && ids.size) rewriteReferences(kept, ids);
}

/**
 * Replace an element with its child nodes.
 * @param {Element} el
 */
function unwrap(el) {
  const parent = /** @type {any} */ (el).parentNode;
  if (!parent) return;
  for (const child of [.../** @type {any} */ (el).childNodes]) parent.insertBefore(child, el);
  el.remove();
}

/**
 * Is `el` still inside `root` (i.e. no ancestor was removed)?
 * @param {Element} el
 * @param {Node} root
 */
function isAttachedTo(el, root) {
  /** @type {any} */
  let n = el;
  while (n) {
    if (n === root) return true;
    n = n.parentNode ?? n.parent ?? null;
  }
  return false;
}

/**
 * Sanitize an HTML string into an inert DocumentFragment. Insert the result
 * directly (`el.replaceChildren(fragment)`) — never serialise and re-parse.
 *
 * @param {string} html - Raw HTML string
 * @param {SanitizeOptions} [options]
 * @returns {DocumentFragment}
 */
export function sanitizeToFragment(html, options = {}) {
  const template = document.createElement('template');
  if (html && typeof html === 'string') {
    template.innerHTML = html;
    sanitizeTree(template.content, {
      allowIncludeFile: !!options.allowIncludeFile,
      keepIds: !!options.keepIds,
      keepStyle: !!options.keepStyle,
    });
  }
  return template.content;
}

/**
 * Serialise a fragment / node list to HTML.
 * @param {DocumentFragment} fragment
 */
function serialize(fragment) {
  const t = document.createElement('template');
  t.content.append(fragment);
  return t.innerHTML;
}

/**
 * Sanitize an HTML string and return sanitized markup.
 *
 * Prefer `sanitizeToFragment` and insert nodes. This string form exists for
 * serialisation (storage, event details, tests). It is hardened against
 * round-trip mutation: the output is re-parsed and re-sanitized until it is
 * stable, and an unstable result (a parser mutation) yields ''.
 *
 * @param {string} html - Raw HTML string
 * @param {SanitizeOptions} [options]
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html, options = {}) {
  if (!html || typeof html !== 'string') return '';
  let out = serialize(sanitizeToFragment(html, options));
  for (let i = 0; i < 4; i++) {
    const next = serialize(sanitizeToFragment(out, options));
    if (next === out) return out;
    out = next;
  }
  return '';
}

/**
 * Sanitize an SVG element in place (the element itself and all descendants):
 * removes script, foreignObject, iframe/object/embed and the other elements
 * above, href-targeting animate/set, every on* handler, and javascript:/data:
 * hrefs. `id`s are kept (icons reference their own gradients/symbols),
 * `<title>`/`<desc>` survive, and a `<style>` survives unless it carries
 * script URLs, bindings or imports — the result is meant for a shadow root. Call it on a
 * parsed-but-not-yet-inserted SVG (e.g. from DOMParser or a <template>)
 * before adopting it into the document.
 *
 * @template {Element} T
 * @param {T} svg
 * @returns {T} The same element, sanitized.
 */
export function sanitizeSVG(svg) {
  if (!svg || typeof svg !== 'object' || !('attributes' in svg)) return svg;
  sanitizeTree(svg, { includeRoot: true, keepIds: true, keepStyle: true, svgOnly: true });
  return svg;
}

/** MathML attributes that can never survive the MathML profile. */
const MATHML_DROP_ATTR = /^(on|href$|src$|style$|id$|name$|xlink|xml:|form[a-z])/;

/**
 * Sanitize MathML markup into an inert DocumentFragment holding only
 * MathML-namespace elements: anything else (HTML, SVG, mglyph, malignmark,
 * annotation-xml) is removed with its content, and on*, href, src, style,
 * id, name and namespaced (xlink:/xml:) attributes are stripped. Markup
 * without a `<math>` root is wrapped in one.
 *
 * @param {string} markup
 * @returns {DocumentFragment}
 */
export function sanitizeMathML(markup) {
  const template = document.createElement('template');
  if (!markup || typeof markup !== 'string') return template.content;
  template.innerHTML = markup;
  if (!template.content.querySelector('math')) template.innerHTML = `<math>${markup}</math>`;
  const content = template.content;
  removeComments(content);
  // Top-level nodes: keep <math> elements and whitespace only
  for (const node of [...content.childNodes]) {
    if (node.nodeType === 3 && !node.textContent?.trim()) continue;
    if (node.nodeType !== 1 || /** @type {Element} */ (node).namespaceURI !== NS_MATHML) node.remove();
  }
  for (const el of [...content.querySelectorAll('*')]) {
    if (!content.contains(el)) continue;
    const name = nameOf(el);
    if (el.namespaceURI !== NS_MATHML || DANGEROUS_ELEMENTS.has(name)) { el.remove(); continue; }
    for (const attr of [...el.attributes]) {
      if (MATHML_DROP_ATTR.test(attr.name.toLowerCase())) el.removeAttribute(attr.name);
    }
  }
  return content;
}
