/**
 * <diagram-wc> — Declarative diagram renderer (Mermaid in v1)
 *
 * Light DOM component that progressively enhances a fenced code block of
 * diagram source into a rendered SVG figure. Without JS the page shows the
 * source as a readable code block; with JS the source is replaced by an SVG
 * <figure>, optionally captioned.
 *
 * Mermaid is loaded via dynamic import only when a `<diagram-wc>` reaches
 * setup, so the library never lands in the core or pack bundles.
 *
 * Theme integration: VB design tokens are read at render time and mapped to
 * Mermaid's themeVariables (see src/lib/diagram-tokens.js). The component
 * subscribes to `vb:theme-change` on window and re-renders so theme switches
 * propagate without authoring.
 *
 * @attr {string}  type            - Backend selector. v1 only supports "mermaid"
 * @attr {string}  src             - URL of a diagram source file (e.g. .mmd)
 * @attr {string}  caption         - Rendered as <figcaption>
 * @attr {string}  loading         - "lazy" defers render until in viewport
 * @attr {string}  data-theme-base - Mermaid base theme: base|default|dark|forest|neutral. Default "base".
 * @attr {string}  min-height      - CSS length reserved before render (prevents layout shift)
 *
 * @fires diagram-wc:ready          - { svg, type, source }
 * @fires diagram-wc:error          - { error, source, type }
 * @fires diagram-wc:source-changed - { source }
 *
 * @example
 * <diagram-wc type="mermaid">
 *   <pre><code class="language-mermaid">flowchart LR
 *     A --> B --> C
 *   </code></pre>
 * </diagram-wc>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { buildMermaidConfig } from '../../lib/diagram-tokens.js';

/**
 * Mermaid is loaded from a CDN URL at runtime so it never lands in VB's
 * bundles. Authors can override by setting `window.VB_MERMAID_URL` before
 * any `<diagram-wc>` runs setup, or by setting `data-mermaid-src` on a
 * specific element.
 *
 * URL imports are treated as external by esbuild — they pass through the
 * bundler unchanged, which is exactly what we want for an optional dep.
 */
const DEFAULT_MERMAID_URL = 'https://cdn.jsdelivr.net/npm/mermaid@11.14.0/dist/mermaid.esm.min.mjs';

/** @type {Map<string, Promise<any>>} URL → module promise (so each unique URL is loaded once) */
const mermaidPromises = new Map();

function loadMermaid(url) {
  const u = url || (typeof window !== 'undefined' && window.VB_MERMAID_URL) || DEFAULT_MERMAID_URL;
  let p = mermaidPromises.get(u);
  if (!p) {
    p = import(/* @vite-ignore */ /* webpackIgnore: true */ u).then((m) => m.default || m);
    mermaidPromises.set(u, p);
  }
  return p;
}

class DiagramWc extends VBElement {
  static #idCounter = 0;

  /** @type {string|null} */
  #source = null;
  /** @type {HTMLTemplateElement|null} */
  #fallbackTpl = null;
  /** @type {HTMLElement|null} */
  #figure = null;
  /** @type {IntersectionObserver|null} */
  #io = null;
  /** @type {number|null} */
  #themeRerenderTimer = null;
  /** @type {boolean} */
  #rendered = false;

  setup() {
    if (!this.hasAttribute('type')) this.setAttribute('type', 'mermaid');

    const minHeight = this.getAttribute('min-height');
    if (minHeight) this.style.minBlockSize = minHeight;

    // Capture the inner authoring fallback (a <pre><code>) into a hidden template
    // so teardown can restore it on disconnect.
    const pre = this.querySelector(':scope > pre');
    if (pre) {
      this.#fallbackTpl = document.createElement('template');
      this.#fallbackTpl.appendChild(pre.cloneNode(true));
      this.#source = this.#extractSourceFromPre(pre);
    }

    // Listen for theme changes — re-render with fresh tokens, debounced
    this.listen(window, 'vb:theme-change', () => {
      if (this.#themeRerenderTimer) clearTimeout(this.#themeRerenderTimer);
      this.#themeRerenderTimer = setTimeout(() => {
        if (this.#rendered) this.#render();
      }, 50);
    });

    // src= takes priority if present; else use inner source; else nothing yet
    const src = this.getAttribute('src');
    if (src) {
      this.#loadSrc(src).then(() => this.#scheduleRender());
    } else if (this.#source) {
      this.#scheduleRender();
    }
  }

  teardown() {
    if (this.#io) { this.#io.disconnect(); this.#io = null; }
    if (this.#themeRerenderTimer) { clearTimeout(this.#themeRerenderTimer); this.#themeRerenderTimer = null; }
    if (this.#figure) { this.#figure.remove(); this.#figure = null; }
    if (this.#fallbackTpl) {
      const restore = this.#fallbackTpl.content.firstElementChild;
      if (restore && !this.querySelector(':scope > pre')) this.appendChild(restore.cloneNode(true));
    }
    this.#rendered = false;
  }

  // ── Rendering ───────────────────────────────────────

  #scheduleRender() {
    if (this.getAttribute('loading') !== 'lazy') {
      this.#render();
      return;
    }
    if (!('IntersectionObserver' in window)) {
      this.#render();
      return;
    }
    this.#io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          this.#io?.disconnect();
          this.#io = null;
          this.#render();
          break;
        }
      }
    }, { rootMargin: '200px' });
    this.#io.observe(this);
  }

  async #render() {
    if (!this.#source) return;
    const type = this.getAttribute('type') || 'mermaid';
    if (type !== 'mermaid') {
      this.#showError(new Error(`Unsupported diagram type "${type}". v1 supports "mermaid" only.`));
      return;
    }

    try {
      const mermaid = await loadMermaid(this.dataset.mermaidSrc);
      const cfg = buildMermaidConfig(this, { themeBase: this.dataset.themeBase || 'base' });
      mermaid.initialize(cfg);

      const id = `diagram-wc-${++DiagramWc.#idCounter}`;
      const { svg } = await mermaid.render(id, this.#source);
      this.#mountSvg(svg);
      this.#rendered = true;

      this.dispatchEvent(new CustomEvent('diagram-wc:ready', {
        bubbles: true,
        detail: { svg, type, source: this.#source },
      }));
    } catch (error) {
      this.#showError(/** @type {Error} */ (error));
    }
  }

  #mountSvg(svg) {
    // Remove the existing fallback <pre> and any prior figure
    this.querySelector(':scope > pre')?.remove();
    if (this.#figure) this.#figure.remove();

    const fig = document.createElement('figure');
    fig.className = 'dwc-figure';
    fig.setAttribute('role', 'img');
    const aria = this.getAttribute('caption') || `${this.getAttribute('type') || 'diagram'} diagram`;
    fig.setAttribute('aria-label', aria);
    // Mermaid returns serialized SVG markup
    fig.innerHTML = svg;

    const caption = this.getAttribute('caption');
    if (caption) {
      const fc = document.createElement('figcaption');
      fc.className = 'dwc-caption';
      fc.textContent = caption;
      fig.appendChild(fc);
    }

    this.appendChild(fig);
    this.#figure = fig;
  }

  #showError(err) {
    // Restore the <pre> fallback so the source is at least readable
    if (!this.querySelector(':scope > pre') && this.#fallbackTpl) {
      const node = this.#fallbackTpl.content.firstElementChild;
      if (node) this.appendChild(node.cloneNode(true));
    }
    if (this.#figure) { this.#figure.remove(); this.#figure = null; }

    const msg = document.createElement('p');
    msg.className = 'dwc-error';
    msg.setAttribute('role', 'alert');
    msg.textContent = `Diagram render failed: ${err.message}`;
    this.appendChild(msg);

    this.dispatchEvent(new CustomEvent('diagram-wc:error', {
      bubbles: true,
      detail: { error: err, source: this.#source, type: this.getAttribute('type') },
    }));
  }

  /** @param {HTMLPreElement} pre */
  #extractSourceFromPre(pre) {
    const code = pre.querySelector('code');
    return (code ? code.textContent : pre.textContent) || '';
  }

  async #loadSrc(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.#source = await res.text();
    } catch (err) {
      this.#showError(/** @type {Error} */ (err));
    }
  }

  // ── JS API ─────────────────────────────────────────

  /** @returns {string} */
  get source() {
    return this.#source || '';
  }

  /** @param {string} value */
  set source(value) {
    const next = String(value || '');
    if (next === this.#source) return;
    this.#source = next;
    // Clear prior render and redraw
    if (this.#figure) { this.#figure.remove(); this.#figure = null; }
    this.querySelector(':scope > .dwc-error')?.remove();
    this.dispatchEvent(new CustomEvent('diagram-wc:source-changed', {
      bubbles: true,
      detail: { source: next },
    }));
    this.#render();
  }

  /** @returns {string} */
  get svg() {
    return this.#figure?.querySelector('svg')?.outerHTML || '';
  }
}

registerComponent('diagram-wc', DiagramWc);
export { DiagramWc };
