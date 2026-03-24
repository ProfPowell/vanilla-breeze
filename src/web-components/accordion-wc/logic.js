/**
 * accordion-wc: Collapsible content panels with optional single-open mode
 *
 * Built on native <details>/<summary> for progressive enhancement.
 * Uses shared name attribute for single-open mode in supporting browsers.
 *
 * @attr {boolean} single - Only allow one panel open at a time
 * @attr {boolean} bordered - Add borders between items
 * @attr {boolean} flush - Remove inline padding
 * @attr {boolean} compact - Use smaller padding
 * @attr {string}  indicator - Indicator style: "plus-minus", "none", "custom"
 * @attr {string}  transition - View Transition type: "fade" (default), "slide", "scale"
 *
 * @example
 * <accordion-wc single>
 *   <details name="faq">
 *     <summary>Question 1</summary>
 *     <div>Answer 1</div>
 *   </details>
 *   <details name="faq">
 *     <summary>Question 2</summary>
 *     <div>Answer 2</div>
 *   </details>
 * </accordion-wc>
 */
import { startSwapTransition } from '../../utils/swap-transition.js';
import { registerComponent } from '../../lib/bundle-registry.js';

let accordionVtId = 0;

class AccordionWc extends HTMLElement {
  #details = [];
  #summaries = [];
  #panels = [];
  #vtEnabled = false;
  #cleanups = [];

  connectedCallback() {
    // Guard: don't double-setup on reconnect
    if (this.hasAttribute('data-upgraded')) return;

    this.#details = [...this.querySelectorAll(':scope > details')];
    this.#summaries = this.#details.map(d => d.querySelector('summary'));

    if (this.#details.length === 0) return;

    this.#ensurePanelWrappers();
    this.#setup();
    this.#initVT();
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    // Remove all tracked listeners
    for (const cleanup of this.#cleanups) cleanup();
    this.#cleanups = [];
    this.#details = [];
    this.#summaries = [];
    this.#panels = [];
    this.#vtEnabled = false;
    this.removeAttribute('data-upgraded');
  }

  /**
   * Ensure each <details> has a single panel wrapper after <summary>.
   * If there are multiple siblings after summary, wrap them in a <div>.
   * This gives VT and ARIA a stable single target per panel.
   */
  #ensurePanelWrappers() {
    this.#panels = this.#details.map(detail => {
      const summary = detail.querySelector('summary');
      if (!summary) return null;

      const afterSummary = [...detail.children].filter(c => c !== summary);

      if (afterSummary.length === 1) {
        // Already a single wrapper — use it
        return afterSummary[0];
      }

      if (afterSummary.length > 1) {
        // Multiple siblings — wrap them
        const wrapper = document.createElement('div');
        for (const child of afterSummary) {
          wrapper.appendChild(child);
        }
        detail.appendChild(wrapper);
        return wrapper;
      }

      return null;
    });
  }

  #initVT() {
    if (!this.hasAttribute('transition') || !document.startViewTransition) return;

    this.#vtEnabled = true;
    const id = ++accordionVtId;
    const type = this.getAttribute('transition') || 'fade';
    const vtClass = type === 'slide' ? 'vt-accordion-slide' : type === 'scale' ? 'vt-accordion-scale' : 'vt-accordion';

    this.#panels.forEach((panel, i) => {
      if (!panel) return;
      panel.style.viewTransitionName = `accordion-${id}-${i}`;
      panel.style.viewTransitionClass = vtClass;
    });
  }

  #vtToggle(detail) {
    startSwapTransition(() => {
      detail.open = !detail.open;
    });
  }

  /** Track an event listener for cleanup on disconnect */
  #listen(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    this.#cleanups.push(() => target.removeEventListener(event, handler, options));
  }

  #setup() {
    this.#details.forEach((detail, i) => {
      const summary = this.#summaries[i];
      const panel = this.#panels[i];

      if (!summary) return;

      // Generate IDs for accessibility (only if panel exists)
      if (panel) {
        const headingId = summary.id || `accordion-heading-${crypto.randomUUID().slice(0, 8)}`;
        const panelId = panel.id || `accordion-panel-${crypto.randomUUID().slice(0, 8)}`;

        summary.id = headingId;
        panel.id = panelId;

        summary.setAttribute('aria-expanded', detail.open ? 'true' : 'false');
        summary.setAttribute('aria-controls', panelId);
        panel.setAttribute('aria-labelledby', headingId);
        panel.setAttribute('role', 'region');
      } else {
        summary.setAttribute('aria-expanded', detail.open ? 'true' : 'false');
      }

      // VT click interception
      this.#listen(summary, 'click', (e) => {
        if (!this.#vtEnabled) return;
        e.preventDefault();
        this.#vtToggle(detail);
      });

      // Keyboard navigation
      this.#listen(summary, 'keydown', (e) => this.#handleKey(e, i));

      // Handle toggle events for single mode and ARIA updates
      this.#listen(detail, 'toggle', () => this.#handleToggle(detail, i));
    });
  }

  #handleToggle(toggledDetail, index) {
    const summary = this.#summaries[index];
    summary.setAttribute('aria-expanded', toggledDetail.open ? 'true' : 'false');

    // Single-open mode: close others when one opens
    // Polyfill for browsers that don't support name attribute on details
    if (this.hasAttribute('single') && toggledDetail.open) {
      this.#details.forEach((detail, i) => {
        if (i !== index && detail.open) {
          detail.open = false;
          this.#summaries[i].setAttribute('aria-expanded', 'false');
        }
      });
    }

    this.dispatchEvent(new CustomEvent('accordion-wc:toggle', {
      detail: { index, open: toggledDetail.open },
      bubbles: true
    }));
  }

  #handleKey(e, currentIndex) {
    const { key } = e;
    let newIndex;

    switch (key) {
      case 'ArrowDown':
        newIndex = (currentIndex + 1) % this.#details.length;
        break;
      case 'ArrowUp':
        newIndex = (currentIndex - 1 + this.#details.length) % this.#details.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = this.#details.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    this.#summaries[newIndex].focus();
  }

  /**
   * Open a specific panel by index
   * @param {number} index - Panel index (0-based)
   */
  open(index) {
    if (index < 0 || index >= this.#details.length) return;
    if (this.#vtEnabled && !this.#details[index].open) {
      startSwapTransition(() => { this.#details[index].open = true; });
    } else {
      this.#details[index].open = true;
    }
  }

  /**
   * Close a specific panel by index
   * @param {number} index - Panel index (0-based)
   */
  close(index) {
    if (index < 0 || index >= this.#details.length) return;
    if (this.#vtEnabled && this.#details[index].open) {
      startSwapTransition(() => { this.#details[index].open = false; });
    } else {
      this.#details[index].open = false;
    }
  }

  /**
   * Toggle a specific panel by index
   * @param {number} index - Panel index (0-based)
   */
  toggle(index) {
    if (index < 0 || index >= this.#details.length) return;
    if (this.#vtEnabled) {
      this.#vtToggle(this.#details[index]);
    } else {
      this.#details[index].open = !this.#details[index].open;
    }
  }

  /**
   * Open all panels (only works when not in single mode)
   */
  openAll() {
    if (!this.hasAttribute('single')) {
      this.#details.forEach(d => { d.open = true; });
    }
  }

  /**
   * Close all panels
   */
  closeAll() {
    this.#details.forEach(d => { d.open = false; });
  }
}

registerComponent('accordion-wc', AccordionWc);

export { AccordionWc };
