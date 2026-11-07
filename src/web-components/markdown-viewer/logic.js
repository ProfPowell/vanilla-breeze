/**
 * markdown-viewer: Render markdown content with progressive enhancement
 *
 * A platform-native markdown viewer that resolves content from four slot types
 * (in priority order): `src` attribute, `<script type="text/markdown">`,
 * `<template data-md>`, or `<pre>` (recommended for progressive enhancement).
 *
 * The default parser is the vendored `marked` (src/vendor/marked) with GFM
 * and VB callout blocks (`:::note|info|tip|warning|danger [title]` … `:::`).
 * Supply a custom parser via the `.parser` property to bypass it entirely.
 *
 * Trust boundary: parsed HTML (from marked or a custom `.parser`) is passed
 * through the shared sanitizer (src/lib/sanitize-html.js, untrusted profile)
 * and the cleaned nodes are inserted directly — never serialised and parsed
 * again. Sanitising is ON by default because the viewer renders model output
 * (ai-summary) and user comments (comment-box → markdown-editor).
 * `sanitize="off"` writes the parser output with innerHTML: only for fully
 * trusted first-party markdown, and never together with a cross-origin or
 * user-influenced `src`.
 *
 * `src` is same-origin by default (http(s) only, redirects re-checked);
 * `allow-cross-origin` opts in to other origins — the same policy as
 * `<include-file>`.
 *
 * @attr {string} src - URL of external markdown file (same-origin unless allow-cross-origin)
 * @attr {boolean} allow-cross-origin - Permit `src` on another origin (still sanitized unless sanitize="off")
 * @attr {string} sanitize - Sanitise rendered HTML. On by default (bare attribute or any value); "off"/"false" disables
 * @attr {boolean} highlight - Fire per-block highlight events after render
 * @attr {string} ping - URL to ping with render metadata
 * @attr {string} data-theme - Theme propagated to .md-content
 * @attr {string} data-label-error - Text of the load-failure message (default "Failed to load markdown")
 * @attr {boolean} data-auto-mermaid - Upgrade ```mermaid fences to <diagram-wc> (loads the bridge)
 *
 * State attributes (set by component):
 * @attr {boolean} data-rendered - Present after successful render
 * @attr {boolean} data-loading - Present while fetching external content
 * @attr {boolean} data-error - Present if fetch or parse fails
 *
 * @fires markdown-viewer:fetch - Dispatched when external fetch begins. Detail: { src }
 * @fires markdown-viewer:rendered - Dispatched after parse and render. Detail: { src, node }
 * @fires markdown-viewer:highlight - Per code block when highlight attr set. Detail: { node, language }
 * @fires markdown-viewer:error - Dispatched on fetch or parse failure. Detail: { error }
 *
 * @example
 * <markdown-viewer>
 *   <pre>
 * # Hello world
 *
 * This is **inline** markdown with a graceful fallback.
 *   </pre>
 * </markdown-viewer>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { Marked } from '../../vendor/marked/marked.esm.js';
import { sanitizeToFragment } from '../../lib/sanitize-html.js';

const DEFAULT_ERROR_LABEL = 'Failed to load markdown';
const CALLOUT_RE = /^:::[ \t]*(note|info|tip|warning|danger)(?:[ \t]+([^\n]*?))?[ \t]*\n([\s\S]*?)\n?^:::[ \t]*(?:\n+|$)/m;

/** @param {string} s */
const escapeHTML = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * VB callout blocks: `:::warning Optional title` … `:::`. Rendered as the
 * shared callout primitive — `<aside data-callout="kind" role="note">` (styled
 * by src/shapes/callouts.css, not by this component) — with a visible
 * `[data-callout-title]` so the kind is not conveyed by colour alone.
 */
const calloutExtension = {
  name: 'vbCallout',
  level: /** @type {const} */ ('block'),
  /** @param {string} src */
  start(src) { return src.match(/^:::[ \t]*(?:note|info|tip|warning|danger)\b/m)?.index; },
  /** @param {string} src */
  tokenizer(src) {
    const m = CALLOUT_RE.exec(src);
    if (!m || m.index !== 0) return undefined;
    const kind = m[1];
    const title = (m[2] || '').trim() || kind[0].toUpperCase() + kind.slice(1);
    const token = { type: 'vbCallout', raw: m[0], kind, title, tokens: [] };
    this.lexer.blockTokens(m[3], token.tokens);
    return token;
  },
  /** @param {{ kind: string, title: string, tokens: any[] }} token */
  renderer(token) {
    return `<aside data-callout="${token.kind}" role="note">`
      + `<p data-callout-title><strong>${escapeHTML(token.title)}</strong></p>`
      + `${this.parser.parse(token.tokens)}</aside>\n`;
  },
};

/** Private marked instance: callouts never leak into other marked users. */
const markedLib = new Marked({ gfm: true, extensions: [/** @type {any} */ (calloutExtension)] });

class MarkdownViewer extends VBElement {
  /** @type {Function|null} Custom parser override (md string → html string) */
  #parser = null;
  /** @type {AbortController|null} */
  #abortController = null;
  /** @type {HTMLElement|null} */
  #contentEl = null;
  /** @type {HTMLElement|null} */
  #errorEl = null;
  /** @type {string|null} Programmatic markdown override (wins over slot resolution) */
  #markdownOverride = null;
  /** @type {string|null} Last successfully resolved markdown source */
  #lastResolved = null;
  /** Incremented per render; stale async renders bail out */
  #renderId = 0;

  static get observedAttributes() {
    return ['src', 'sanitize', 'allow-cross-origin'];
  }

  setup() {
    this.#render();
  }

  teardown() {
    this.#abortController?.abort();
    this.removeAttribute('data-rendered');
    this.removeAttribute('data-loading');
  }

  attributeChangedCallback(name, oldVal, newVal) {
    // Initial attributes are handled by setup(); afterwards any change —
    // including removing src (fall back to the slots) — re-renders.
    if (oldVal === newVal || !this.isConnected || !this.hasAttribute('data-upgraded')) return;
    this.#render();
  }

  // ── Public API ──────────────────────────────────────────────

  /**
   * Custom parser function. Set to override the default marked parser.
   *
   * @returns {Function|null} The custom parser function, or null.
   */
  get parser() { return this.#parser; }
  set parser(fn) {
    this.#parser = typeof fn === 'function' ? fn : null;
  }

  /**
   * The current markdown source as a string. Reading returns whatever
   * was either resolved from slots/src or last assigned via this setter.
   *
   * Assigning a string takes over from the slot resolution and triggers
   * an immediate re-render with the new content. Pass `null` or `''` to
   * fall back to the slot pipeline on the next render.
   *
   * @returns {string} The markdown source.
   */
  get markdown() { return this.#markdownOverride ?? this.#lastResolved ?? ''; }
  set markdown(value) {
    const next = value == null ? null : String(value);
    if (this.#markdownOverride === next) return;
    this.#markdownOverride = next;
    this.#render();
  }

  /** Force a re-render from the current content source. */
  async render() {
    await this.#render();
  }

  /** Re-fetch the `src` URL and re-render. */
  async reload() {
    if (this.getAttribute('src')) {
      await this.#render();
    }
  }

  // ── Content resolution ──────────────────────────────────────

  /**
   * Resolve markdown string from the slot priority chain.
   * @returns {string|null}
   */
  #resolveMarkdown() {
    const script = this.querySelector('script[type="text/markdown"]');
    if (script) return script.textContent;

    const template = /** @type {HTMLTemplateElement | null} */ (this.querySelector('template[data-md]'));
    if (template) return template.content.textContent;

    const pre = this.querySelector(':scope > pre');
    if (pre) return pre.textContent;

    return null;
  }

  /**
   * Resolve `src` and apply the origin policy (mirrors include-file).
   * @param {string} src
   * @returns {string} absolute URL
   */
  #resolveUrl(src) {
    let url;
    try {
      url = new URL(src, document.baseURI);
    } catch {
      throw new Error(`Invalid URL: ${src}`);
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error(`Refused ${url.protocol} URL: only http(s) is allowed`);
    }
    this.#checkOrigin(url.href);
    return url.href;
  }

  /** @param {string} href */
  #checkOrigin(href) {
    if (this.hasAttribute('allow-cross-origin')) return;
    if (new URL(href).origin !== location.origin) {
      throw new Error(`Refused cross-origin URL ${href} (add allow-cross-origin to permit)`);
    }
  }

  // ── Render pipeline ─────────────────────────────────────────

  async #render() {
    const id = ++this.#renderId;
    const src = this.getAttribute('src');
    let md;

    // Clear previous state
    this.#abortController?.abort();
    this.#abortController = null;
    this.removeAttribute('data-rendered');
    this.removeAttribute('data-error');
    this.removeAttribute('data-loading');
    this.#errorEl?.remove();
    this.#errorEl = null;

    if (src) {
      const controller = new AbortController();
      this.#abortController = controller;
      this.setAttribute('data-loading', '');
      this.#emit('markdown-viewer:fetch', { src });

      try {
        const url = this.#resolveUrl(src);
        const response = await fetch(url, { signal: controller.signal });
        // A same-origin URL may redirect elsewhere — apply the policy again
        if (response.url) this.#checkOrigin(response.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        md = await response.text();
      } catch (err) {
        if (err.name === 'AbortError' || id !== this.#renderId) return;
        this.#fail(err);
        return;
      }
      if (id !== this.#renderId) return;

      this.removeAttribute('data-loading');
    } else if (this.#markdownOverride != null) {
      // Programmatic .markdown setter wins over slot resolution.
      md = this.#markdownOverride;
    } else {
      md = this.#resolveMarkdown();
    }

    if (md == null) {
      // Nothing to show (e.g. src removed with no slot): clear stale output
      this.#contentEl?.replaceChildren();
      return;
    }
    this.#lastResolved = md;

    // Parse
    let html;
    try {
      const parse = await this.#getParser();
      html = await parse(md);
    } catch (err) {
      if (id !== this.#renderId) return;
      this.#fail(err);
      return;
    }
    if (id !== this.#renderId) return;

    // Render into .md-content
    if (!this.#contentEl || this.#contentEl.parentNode !== this) {
      this.#contentEl = document.createElement('div');
      this.#contentEl.className = 'md-content';
      this.#contentEl.setAttribute('part', 'content');
      this.appendChild(this.#contentEl);
    }
    // Rendered prose follows its own direction unless the author set one
    if (!this.hasAttribute('dir')) this.#contentEl.setAttribute('dir', 'auto');
    else this.#contentEl.removeAttribute('dir');

    if (this.#shouldSanitize()) {
      // Insert the cleaned nodes themselves — no serialise + re-parse (mXSS)
      this.#contentEl.replaceChildren(sanitizeToFragment(String(html ?? '')));
    } else {
      this.#contentEl.innerHTML = String(html ?? '');
    }

    // Theme propagation
    this.#propagateTheme();

    // Stamp rendered state
    this.setAttribute('data-rendered', '');

    // Ping analytics
    const ping = this.getAttribute('ping');
    if (ping) {
      navigator.sendBeacon?.(ping, JSON.stringify({ src: src || 'inline' }));
    }

    // Emit rendered event
    this.#emit('markdown-viewer:rendered', { src, node: this.#contentEl });

    // Highlight events for code blocks
    if (this.hasAttribute('highlight')) {
      for (const code of this.#contentEl.querySelectorAll('pre > code[class*="language-"]')) {
        const lang = code.className.match(/language-(\S+)/)?.[1] || '';
        this.#emit('markdown-viewer:highlight', { node: code, language: lang });
      }
    }
  }

  /**
   * Stamp the error state; show an announced message when no fallback
   * (`<pre>` slot) is visible.
   * @param {Error} err
   */
  #fail(err) {
    this.removeAttribute('data-loading');
    this.setAttribute('data-error', '');
    this.#contentEl?.replaceChildren();
    if (!this.querySelector(':scope > pre')) {
      const p = document.createElement('p');
      p.setAttribute('role', 'alert');
      p.setAttribute('data-md-error', '');
      p.textContent = this.getAttribute('data-label-error') || DEFAULT_ERROR_LABEL;
      this.append(p);
      this.#errorEl = p;
    }
    this.#emit('markdown-viewer:error', { error: err.message });
  }

  // ── Parser ──────────────────────────────────────────────────

  async #getParser() {
    if (this.#parser) return this.#parser;
    return (md) => markedLib.parse(md);
  }

  /** Sanitising is on unless explicitly disabled with sanitize="off"|"false". */
  #shouldSanitize() {
    const v = this.getAttribute('sanitize');
    if (v == null) return true;
    return !/^(off|false)$/i.test(v.trim());
  }

  // ── Theme ───────────────────────────────────────────────────

  #propagateTheme() {
    if (!this.#contentEl) return;
    const theme = this.dataset.theme
      ?? /** @type {HTMLElement | null} */ (this.closest('[data-theme]'))?.dataset.theme;
    if (theme) {
      this.#contentEl.dataset.theme = theme;
    }
  }

  // ── Events ──────────────────────────────────────────────────

  #emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, {
      detail, bubbles: true, composed: true,
    }));
  }
}

registerComponent('markdown-viewer', MarkdownViewer);

export { MarkdownViewer };
