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
  static #vtCounter = 0;

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
      // Hide the source immediately to prevent the fallback from flashing
      // before the SVG mounts. CSS rule: diagram-wc[data-rendering] > pre { display:none }
      this.setAttribute('data-rendering', '');
    }

    // Adopt a primed figure if one was injected before connection (see the
    // markdown-mermaid-bridge cache). Treating it as a prior render means
    // transient parse errors during typing won't blank the diagram —
    // #showError keeps the prior figure visible when #rendered is true.
    const primed = this.querySelector(':scope > .dwc-figure');
    if (primed) {
      this.#figure = primed;
      this.#rendered = true;
      this.removeAttribute('data-rendering');
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
      this.removeAttribute('data-rendering');
      this.removeAttribute('data-error');
      // A successful render clears any stale parse-error pill from a
      // transient state (typical during live editing).
      this.querySelector(':scope > .dwc-error')?.remove();

      this.dispatchEvent(new CustomEvent('diagram-wc:ready', {
        bubbles: true,
        detail: { svg, type, source: this.#source },
      }));
    } catch (error) {
      this.removeAttribute('data-rendering');
      // Only flip to source-fallback mode if no diagram has rendered yet.
      // For transient parse errors during live editing we keep the prior
      // figure visible (see #showError).
      if (!this.#rendered) this.setAttribute('data-error', '');
      this.#showError(/** @type {Error} */ (error));
    }
  }

  #mountSvg(svg) {
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

    const prior = this.#figure;

    // Single, atomic swap. Wrapped in document.startViewTransition where
    // supported (Chromium, Safari) so the browser captures the prior
    // pixels, performs the DOM swap, captures the new pixels, and
    // crossfades between them — no flash or layout thrash during theme
    // changes or content edits. Falls through to a plain swap on browsers
    // without view-transition support (e.g. Firefox today).
    const swap = () => {
      if (prior && prior.isConnected) {
        prior.replaceWith(fig);
      } else {
        this.appendChild(fig);
      }
      this.querySelector(':scope > pre')?.remove();
      this.#figure = fig;
    };

    if (prior?.isConnected
        && 'startViewTransition' in document
        && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Pin the same view-transition-name on prior and new so the browser
      // captures only this diagram's region, not the whole document.
      const name = `dwc-vt-${++DiagramWc.#vtCounter}`;
      prior.style.viewTransitionName = name;
      fig.style.viewTransitionName = name;
      const tx = document.startViewTransition(swap);
      tx.finished.finally(() => {
        // Clean up so a subsequent transition gets a fresh name.
        fig.style.viewTransitionName = '';
      });
    } else {
      swap();
    }
  }

  #showError(err) {
    // Live-editing UX: if we already rendered a valid diagram once, keep it
    // visible so transient parse errors during typing don't blank the
    // canvas. We only fall back to <pre> when there is no figure to show.
    if (!this.#rendered) {
      if (!this.querySelector(':scope > pre') && this.#fallbackTpl) {
        const node = this.#fallbackTpl.content.firstElementChild;
        if (node) this.appendChild(node.cloneNode(true));
      }
      if (this.#figure) { this.#figure.remove(); this.#figure = null; }
    }

    // Replace any prior error rather than stacking them up.
    this.querySelector(':scope > .dwc-error')?.remove();

    const msg = document.createElement('p');
    msg.className = 'dwc-error';
    msg.setAttribute('role', 'status');
    // Keep just the headline of Mermaid's parser error — the full token
    // dump is in the event detail for callers who want it. Headline is the
    // first line up to a reasonable cap.
    const headline = (err.message || String(err)).split('\n')[0].slice(0, 240);
    msg.textContent = `Diagram syntax error: ${headline}`;
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
