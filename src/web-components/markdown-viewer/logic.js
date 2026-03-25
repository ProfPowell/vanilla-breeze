/**
 * markdown-viewer: Render markdown content with progressive enhancement
 *
 * A platform-native markdown viewer that resolves content from four slot types
 * (in priority order): `src` attribute, `<script type="text/markdown">`,
 * `<template data-md>`, or `<pre>` (recommended for progressive enhancement).
 *
 * The default parser is `marked` (loaded lazily via dynamic import). Supply a
 * custom parser via the `.parser` property to bypass the default entirely.
 *
 * Trust boundary: this component injects parsed HTML via innerHTML. It is
 * designed for rendering trusted markdown content. Do not use it with
 * untrusted or user-generated markdown from third-party sources without
 * enabling the `sanitize` attribute (Phase 3).
 *
 * @attr {string} src - URL of external markdown file
 * @attr {string} loading - "eager" (default) or "lazy" (Phase 3)
 * @attr {boolean} highlight - Fire per-block highlight events after render
 * @attr {string} ping - URL to ping with render metadata
 * @attr {string} data-theme - Theme propagated to .md-content
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
import { marked as markedLib } from 'marked';

class MarkdownViewer extends VBElement {
  /** @type {Function|null} Custom parser override (md string → html string) */
  #parser = null;
  /** @type {AbortController|null} */
  #abortController = null;
  /** @type {HTMLElement|null} */
  #contentEl = null;

  static get observedAttributes() {
    return ['src'];
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
    if (name === 'src' && newVal && oldVal !== newVal && this.isConnected) {
      this.#render();
    }
  }

  // ── Public API ──────────────────────────────────────────────

  /** Custom parser function. Set to override the default marked parser. */
  get parser() { return this.#parser; }
  set parser(fn) {
    this.#parser = typeof fn === 'function' ? fn : null;
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
   * Returns null if `src` is set (handled separately via fetch).
   * @returns {string|null}
   */
  #resolveMarkdown() {
    if (this.getAttribute('src')) return null;

    const script = this.querySelector('script[type="text/markdown"]');
    if (script) return script.textContent;

    const template = this.querySelector('template[data-md]');
    if (template) return template.content.textContent;

    const pre = this.querySelector(':scope > pre');
    if (pre) return pre.textContent;

    return null;
  }

  // ── Render pipeline ─────────────────────────────────────────

  async #render() {
    const src = this.getAttribute('src');
    let md;

    // Clear previous state
    this.removeAttribute('data-rendered');
    this.removeAttribute('data-error');

    if (src) {
      // Abort any previous request
      this.#abortController?.abort();
      this.#abortController = new AbortController();

      this.setAttribute('data-loading', '');

      this.#emit('markdown-viewer:fetch', { src });

      try {
        const response = await fetch(src, {
          signal: this.#abortController.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        md = await response.text();
      } catch (err) {
        if (err.name === 'AbortError') return;
        this.removeAttribute('data-loading');
        this.setAttribute('data-error', '');
        this.#emit('markdown-viewer:error', { error: err.message });
        return;
      }

      this.removeAttribute('data-loading');
    } else {
      md = this.#resolveMarkdown();
    }

    if (md == null) return;

    // Parse
    let html;
    try {
      const parse = await this.#getParser();
      html = await parse(md);
    } catch (err) {
      this.setAttribute('data-error', '');
      this.#emit('markdown-viewer:error', { error: err.message });
      return;
    }

    // Render into .md-content
    if (!this.#contentEl) {
      this.#contentEl = document.createElement('div');
      this.#contentEl.className = 'md-content';
      this.#contentEl.setAttribute('part', 'content');
      this.appendChild(this.#contentEl);
    }
    this.#contentEl.innerHTML = html;

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

  // ── Parser ──────────────────────────────────────────────────

  async #getParser() {
    if (this.#parser) return this.#parser;
    return (md) => markedLib.parse(md, { gfm: true });
  }

  // ── Theme ───────────────────────────────────────────────────

  #propagateTheme() {
    if (!this.#contentEl) return;
    const theme = this.dataset.theme
      ?? this.closest('[data-theme]')?.dataset.theme;
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
