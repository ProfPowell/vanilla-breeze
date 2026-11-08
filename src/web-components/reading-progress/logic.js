/**
 * reading-progress: Scroll progress indicator bar
 *
 * Fixed-position bar that tracks reading progress through the document
 * (default) or a specific element (data-for). Joins the doc-side family
 * with <page-stats>, <page-toc>, <page-info>.
 *
 * The bar is decorative: the scroll position is already exposed to
 * assistive technology by the scrollable document itself, so the child
 * <progress> is aria-hidden. (A progressbar on the CSS-driven path would
 * otherwise announce a stale 0% forever.)
 *
 * Progressive enhancement layers:
 *   1. HTML: an optional child <progress> (aria-hidden) for SSR.
 *   2. CSS:  modern browsers animate the bar via animation-timeline:
 *            scroll(root block) — no JS required when tracking the
 *            whole document.
 *   3. JS:   fallback for browsers without scroll-timeline support, and
 *            the only path that honors data-for (target-bounded ratio).
 *            A data-for whose target is missing falls back to document
 *            progress and keeps looking for the target until it appears.
 *
 * @attr {string} data-for      - ID of the target element. Without it,
 *                                tracks document scroll. Observed.
 * @attr {string} data-position - 'top' (default) or 'bottom'. Observed (CSS).
 *
 * @example Document scroll (CSS-driven in modern browsers)
 * <reading-progress></reading-progress>
 *
 * @example Target a specific article
 * <reading-progress data-for="article-content" data-position="bottom"></reading-progress>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class ReadingProgress extends VBElement {

  static get observedAttributes() { return ['data-for']; }

  /** @type {HTMLProgressElement | null} */
  bar = null;
  /** @type {HTMLElement | null} */
  target = null;

  #rafId = 0;
  /** @type {MutationObserver | null} */
  #lookup = null;

  setup() {
    /* SSR adoption: keep an existing <progress>, otherwise create one */
    this.bar = this.querySelector('progress');
    if (!this.bar) {
      this.bar = document.createElement('progress');
      this.bar.max = 100;
      this.bar.value = 0;
      this.appendChild(this.bar);
    }
    // Decorative; see the module note
    this.bar.setAttribute('aria-hidden', 'true');

    const targetId = this.dataset.for;
    this.target = targetId ? document.getElementById(targetId) : null;

    /* Modern browsers drive the visual via scroll-timeline when tracking
       the document (no data-for attribute). Skip the scroll listener. */
    const cssDriven = !targetId
      && CSS.supports('animation-timeline', 'scroll(root block)');
    if (cssDriven) return;

    if (targetId && !this.target) this.#watchForTarget(targetId);

    this.#update();
    const onScroll = () => {
      if (this.#rafId) return;
      this.#rafId = requestAnimationFrame(() => {
        this.#rafId = 0;
        this.#update();
      });
    };
    this.listen(window, 'scroll', onScroll, { passive: true });
    this.listen(window, 'resize', onScroll, { passive: true });
  }

  teardown() {
    if (this.#rafId) cancelAnimationFrame(this.#rafId);
    this.#rafId = 0;
    this.#lookup?.disconnect();
    this.#lookup = null;
  }

  /**
   * @param {string} _name
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(_name, oldValue, newValue) {
    if (oldValue === newValue || !this.hasAttribute('data-upgraded')) return;
    this._reinit();
  }

  /** Target rendered after upgrade: re-resolve once it exists. */
  #watchForTarget(id) {
    this.#lookup = new MutationObserver(() => {
      const el = document.getElementById(id);
      if (!el) return;
      this.#lookup?.disconnect();
      this.#lookup = null;
      this.target = el;
      this.#update();
    });
    this.#lookup.observe(document.documentElement, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['id'],
    });
  }

  #update() {
    const ratio = this.target ? this.#targetRatio() : this.#documentRatio();
    const clamped = Math.min(1, Math.max(0, ratio));
    this.style.setProperty('--vb-reading-progress', clamped.toFixed(4));
    if (this.bar) this.bar.value = Math.round(clamped * 100);
  }

  #documentRatio() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max : 0;
  }

  #targetRatio() {
    if (!this.target) return 0;
    const rect = this.target.getBoundingClientRect();
    const span = rect.height - window.innerHeight;
    if (span <= 0) {
      return rect.bottom <= window.innerHeight ? 1 : 0;
    }
    return -rect.top / span;
  }
}

registerComponent('reading-progress', ReadingProgress);

export { ReadingProgress };
