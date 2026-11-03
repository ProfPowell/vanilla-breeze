/**
 * <diagram-wc> — Declarative diagram renderer (Mermaid in v1)
 *
 * Light DOM component that progressively enhances a fenced code block of
 * diagram source into a rendered SVG figure. Without JS the page shows the
 * source as a readable code block; with JS the source is replaced by an SVG
 * <figure>, optionally captioned, that keeps the source reachable in a
 * collapsed <details> as the diagram's text alternative.
 *
 * Mermaid is loaded via dynamic import only when a `<diagram-wc>` renders,
 * so the library never lands in the core or pack bundles.
 *
 * Theme integration: VB design tokens are read at render time and mapped to
 * Mermaid's themeVariables (see src/lib/diagram-tokens.js). The component
 * subscribes to `vb:theme-change` on window and re-renders so theme switches
 * propagate without authoring.
 *
 * Accessibility: the SVG keeps Mermaid's own `graphics-document` role so node
 * text stays reachable. Its name comes from the Mermaid `accTitle` (or the
 * `caption` attribute); its description from `accDescr` plus the source
 * listing. Nothing generic is invented when the author gives no name.
 *
 * @attr {string}  type            - Backend selector. v1 only supports "mermaid"
 * @attr {string}  src             - URL of a diagram source file (e.g. .mmd); takes priority over inline source
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
import { viewTransitionSwap } from '../../lib/vb-view-transition.js';
import { buildMermaidConfig } from '../../lib/diagram-tokens.js';

export { enhanceMermaidFences } from './enhance.js';

/**
 * Mermaid is loaded from a CDN URL at runtime so it never lands in VB's
 * bundles. Only page script may choose a different module URL, by setting
 * `window.VB_MERMAID_URL` before the first diagram renders. There is
 * deliberately NO per-element override: markup (including sanitized
 * markdown, which keeps custom elements and data-* attributes) must never be
 * able to pick the module that gets imported and executed.
 *
 * URL imports are treated as external by esbuild — they pass through the
 * bundler unchanged, which is exactly what we want for an optional dep.
 */
const DEFAULT_MERMAID_URL = 'https://cdn.jsdelivr.net/npm/mermaid@11.14.0/dist/mermaid.esm.min.mjs';

/** @type {Map<string, Promise<any>>} URL → module promise (so each unique URL is loaded once) */
const mermaidPromises = new Map();

function loadMermaid() {
  const u = (typeof window !== 'undefined' && /** @type {any} */ (window).VB_MERMAID_URL) || DEFAULT_MERMAID_URL;
  let p = mermaidPromises.get(u);
  if (!p) {
    p = import(/* @vite-ignore */ /* webpackIgnore: true */ u).then((m) => m.default || m);
    mermaidPromises.set(u, p);
  }
  return p;
}

/**
 * mermaid.initialize() is global state. Every initialize+render pair runs
 * through this queue so two diagrams with different tokens/base themes
 * can't interleave and render with each other's config.
 * @type {Promise<unknown>}
 */
let mermaidQueue = Promise.resolve();

/**
 * @template T
 * @param {() => Promise<T>} job
 * @returns {Promise<T>}
 */
function enqueue(job) {
  const run = mermaidQueue.then(job, job);
  mermaidQueue = run.catch(() => {});
  return run;
}

class DiagramWc extends VBElement {
  static #idCounter = 0;

  /** @type {string|null} Current source — survives teardown so a move keeps a JS-set value */
  #source = null;
  /** @type {string|null} Source the mounted figure was rendered from */
  #renderedSource = null;
  /** @type {string|null} src URL whose contents are in #source */
  #loadedSrc = null;
  /** @type {HTMLElement|null} */
  #figure = null;
  /** @type {IntersectionObserver|null} */
  #io = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #themeRerenderTimer = null;
  /** @type {boolean} */
  #rendered = false;
  /** @type {number} Increments per render so a slow, superseded render is discarded */
  #renderSeq = 0;

  setup() {
    if (!this.hasAttribute('type')) this.setAttribute('type', 'mermaid');

    const minHeight = this.getAttribute('min-height');
    if (minHeight) this.style.minBlockSize = minHeight;

    // First connection reads the authored <pre><code>. On reconnect the
    // current source (possibly set from JS) is kept.
    const pre = /** @type {HTMLPreElement | null} */ (this.querySelector(':scope > pre'));
    if (this.#source === null && pre) {
      this.#source = this.#extractSourceFromPre(pre);
    }

    // Adopt a primed figure if one was injected before connection (see the
    // markdown-mermaid-bridge cache). Treating it as a prior render means
    // transient parse errors during typing won't blank the diagram —
    // #showError keeps the prior figure visible when #rendered is true.
    if (!this.#figure) {
      const primed = /** @type {HTMLElement | null} */ (this.querySelector(':scope > .dwc-figure'));
      if (primed) {
        this.#decorateFigure(primed, this.#source || '');
        this.#figure = primed;
        this.#rendered = true;
      }
    }

    // Hide the source until the SVG mounts. CSS:
    // diagram-wc[data-rendering] > pre { display:none } (also :defined > pre)
    if (!this.#rendered && (this.#source || this.hasAttribute('src'))) {
      this.setAttribute('data-rendering', '');
    }

    // Listen for theme changes — re-render with fresh tokens, debounced
    this.listen(window, 'vb:theme-change', () => {
      if (this.#themeRerenderTimer) clearTimeout(this.#themeRerenderTimer);
      this.#themeRerenderTimer = setTimeout(() => {
        if (this.#rendered) this.#render();
      }, 50);
    });

    // src= takes priority if present (fetched once per URL); else the
    // inline/JS-set source. A reconnect with an up-to-date figure is a no-op.
    const src = this.getAttribute('src');
    if (src && src !== this.#loadedSrc) {
      this.#loadSrc(src).then((ok) => { if (ok) this.#scheduleRender(); });
    } else if (this.#source && this.#source !== this.#renderedSource) {
      this.#scheduleRender();
    }
  }

  teardown() {
    // Keep #source, #figure and the rendered DOM: a move should not revert a
    // JS-set source, refetch src, or re-run Mermaid.
    if (this.#io) { this.#io.disconnect(); this.#io = null; }
    if (this.#themeRerenderTimer) { clearTimeout(this.#themeRerenderTimer); this.#themeRerenderTimer = null; }
  }

  // ── Rendering ───────────────────────────────────────

  #scheduleRender() {
    if (this.getAttribute('loading') !== 'lazy' || !('IntersectionObserver' in window)) {
      this.#render();
      return;
    }
    if (this.#io) return;
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
    const source = this.#source;
    if (!source) return;
    const seq = ++this.#renderSeq;
    const type = this.getAttribute('type') || 'mermaid';
    if (type !== 'mermaid') {
      this.removeAttribute('data-rendering');
      if (!this.#rendered) this.setAttribute('data-error', '');
      this.#showError(new Error(`Unsupported diagram type "${type}". v1 supports "mermaid" only.`));
      return;
    }

    try {
      const mermaid = await loadMermaid();
      const themeBase = this.dataset.themeBase || 'base';
      const id = `diagram-wc-${++DiagramWc.#idCounter}`;
      // Config is built and applied inside the queue, immediately before
      // this element's render, so tokens can't leak between diagrams.
      const svg = await enqueue(async () => {
        mermaid.initialize(buildMermaidConfig(this, { themeBase }));
        const out = await mermaid.render(id, source);
        return out.svg;
      });
      if (seq !== this.#renderSeq) return; // superseded by a newer render

      await this.#mountSvg(svg, source);
      if (seq !== this.#renderSeq) return;
      this.#rendered = true;
      this.#renderedSource = source;
      this.removeAttribute('data-rendering');
      this.removeAttribute('data-error');
      // A successful render clears any stale parse-error pill from a
      // transient state (typical during live editing).
      this.querySelector(':scope > .dwc-error')?.remove();

      this.dispatchEvent(new CustomEvent('diagram-wc:ready', {
        bubbles: true,
        detail: { svg, type, source },
      }));
    } catch (error) {
      if (seq !== this.#renderSeq) return;
      this.removeAttribute('data-rendering');
      // Only flip to source-fallback mode if no diagram has rendered yet.
      // For transient parse errors during live editing we keep the prior
      // figure visible (see #showError).
      if (!this.#rendered) this.setAttribute('data-error', '');
      this.#showError(/** @type {Error} */ (error));
    }
  }

  /**
   * Wire names/descriptions onto a rendered figure and append the source
   * listing + caption. Used for fresh renders and for primed figures.
   * @param {HTMLElement} fig
   * @param {string} source
   */
  #decorateFigure(fig, source) {
    fig.classList.add('dwc-figure');
    // Earlier versions (and old primed caches) put role="img" on the figure,
    // which hides every node label from assistive tech.
    fig.removeAttribute('role');
    fig.removeAttribute('aria-label');
    fig.querySelectorAll(':scope > .dwc-source, :scope > .dwc-caption').forEach((n) => n.remove());

    const uid = `dwc-${++DiagramWc.#idCounter}`;
    const svg = fig.querySelector('svg');

    const details = document.createElement('details');
    details.className = 'dwc-source';
    const summary = document.createElement('summary');
    summary.textContent = 'Diagram source';
    const pre = document.createElement('pre');
    pre.id = `${uid}-src`;
    const code = document.createElement('code');
    code.className = `language-${this.getAttribute('type') || 'mermaid'}`;
    code.textContent = source;
    pre.appendChild(code);
    details.append(summary, pre);
    fig.appendChild(details);

    const caption = this.getAttribute('caption');
    let captionId = '';
    if (caption) {
      const fc = document.createElement('figcaption');
      fc.className = 'dwc-caption';
      fc.id = captionId = `${uid}-cap`;
      fc.textContent = caption;
      fig.appendChild(fc);
    }

    if (svg) {
      // Mermaid labels the SVG from accTitle/accDescr (<title>/<desc> plus
      // aria-labelledby/-describedby). Fall back to the caption for the
      // name; append the source listing to the description.
      if (!svg.getAttribute('aria-labelledby') && !svg.getAttribute('aria-label') && captionId) {
        svg.setAttribute('aria-labelledby', captionId);
      }
      // Drop a stale source id from an earlier decoration of this figure.
      const described = (svg.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter((t) => t && !/^dwc-\d+-src$/.test(t));
      described.push(pre.id);
      svg.setAttribute('aria-describedby', described.join(' '));
    }
  }

  /**
   * Resolves once the new figure is in the DOM (after the view transition's
   * update callback, not its animation).
   * @param {string} svg
   * @param {string} source
   * @returns {Promise<void>}
   */
  async #mountSvg(svg, source) {
    const fig = document.createElement('figure');
    // Mermaid returns serialized SVG markup (securityLevel: 'strict')
    fig.innerHTML = svg;
    this.#decorateFigure(fig, source);

    const prior = this.#figure;
    const priorMounted = !!prior && prior.parentNode === this;

    // Single, atomic swap. Wrapped in a view transition where supported so
    // the browser crossfades old and new pixels (no flash during theme
    // changes or content edits).
    const swap = () => {
      if (prior && prior.parentNode === this) {
        prior.replaceWith(fig);
      } else {
        this.appendChild(fig);
      }
      this.querySelector(':scope > pre')?.remove();
      this.#figure = fig;
    };

    // Only crossfade a re-render; the first render just appears.
    // viewTransitionSwap handles support, reduced motion and naming.
    if (priorMounted && this.isConnected) {
      const tx = viewTransitionSwap(this, swap, 'dwc-vt');
      if (tx) await tx.updateCallbackDone.catch(() => {});
      if (this.#figure !== fig) swap();
    } else {
      swap();
    }
  }

  #showError(err) {
    // Live-editing UX: if we already rendered a valid diagram once, keep it
    // visible so transient parse errors during typing don't blank the
    // canvas. With nothing rendered, show the current source as a <pre>.
    if (!this.#rendered) {
      let pre = /** @type {HTMLPreElement | null} */ (this.querySelector(':scope > pre'));
      if (!pre && this.#source !== null) {
        pre = document.createElement('pre');
        const code = document.createElement('code');
        code.className = `language-${this.getAttribute('type') || 'mermaid'}`;
        pre.appendChild(code);
        this.prepend(pre);
      }
      if (pre && this.#source !== null && this.#extractSourceFromPre(pre) !== this.#source) {
        const code = pre.querySelector('code') || pre;
        code.textContent = this.#source;
      }
    }

    // Replace any prior error rather than stacking them up.
    this.querySelector(':scope > .dwc-error')?.remove();

    const msg = document.createElement('p');
    msg.className = 'dwc-error';
    msg.setAttribute('role', 'status');
    // Keep just the headline of Mermaid's parser error — the full token
    // dump is in the event detail for callers who want it.
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

  /**
   * @param {string} url
   * @returns {Promise<boolean>}
   */
  async #loadSrc(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.#source = await res.text();
      this.#loadedSrc = url;
      return true;
    } catch (err) {
      this.removeAttribute('data-rendering');
      if (!this.#rendered) this.setAttribute('data-error', '');
      this.#showError(/** @type {Error} */ (err));
      return false;
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
    this.dispatchEvent(new CustomEvent('diagram-wc:source-changed', {
      bubbles: true,
      detail: { source: next },
    }));
    // The prior figure stays until the new one is ready: #mountSvg swaps it
    // (with a crossfade), and a parse error keeps it on screen.
    if (this.isConnected && this.hasAttribute('data-upgraded')) this.#render();
  }

  /** @returns {string} */
  get svg() {
    return this.#figure?.querySelector('svg')?.outerHTML || '';
  }
}

registerComponent('diagram-wc', DiagramWc);
export { DiagramWc };
