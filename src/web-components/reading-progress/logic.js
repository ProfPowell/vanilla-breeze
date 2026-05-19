/**
 * reading-progress: Scroll progress indicator bar
 *
 * Fixed-position bar that tracks reading progress through the document
 * (default) or a specific element (data-for). Joins the doc-side family
 * with <page-stats>, <page-toc>, <page-info>.
 *
 * Progressive enhancement layers:
 *   1. HTML: a child <progress> carries the semantic + AT label.
 *   2. CSS:  modern browsers animate the bar via animation-timeline:
 *            scroll(root block) — no JS required when tracking the
 *            whole document.
 *   3. JS:   fallback for browsers without scroll-timeline support, and
 *            the only path that honors data-for (target-bounded ratio).
 *
 * @attr {string} data-for      - ID of the target element. Without it,
 *                                tracks document scroll.
 * @attr {string} data-position - 'top' (default) or 'bottom'.
 *
 * @example Document scroll (CSS-driven in modern browsers)
 * <reading-progress></reading-progress>
 *
 * @example Target a specific article
 * <reading-progress data-for="article-content" data-position="bottom">
 *   <progress max="100" value="0" aria-label="Reading progress"></progress>
 * </reading-progress>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class ReadingProgress extends VBElement {

  setup() {
    /* SSR adoption: keep an existing <progress>, otherwise create one */
    this.bar = this.querySelector('progress');
    if (!this.bar) {
      this.bar = document.createElement('progress');
      this.bar.max = 100;
      this.bar.value = 0;
      this.bar.setAttribute('aria-label', 'Reading progress');
      this.appendChild(this.bar);
    }

    const targetId = this.dataset.for;
    this.target = targetId ? document.getElementById(targetId) : null;

    /* Modern browsers can drive the visual via scroll-timeline when
       tracking the document. Skip the scroll listener in that case. */
    const cssDriven = !this.target
      && CSS.supports('animation-timeline', 'scroll(root block)');
    if (cssDriven) return;

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

  #rafId = 0;

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
