/**
 * x-accordion: Collapsible content panels with optional single-open mode
 *
 * Built on native <details>/<summary> for progressive enhancement.
 * Uses shared name attribute for single-open mode in supporting browsers.
 *
 * @attr {boolean} data-single - Only allow one panel open at a time
 * @attr {boolean} data-bordered - Add borders between items
 *
 * @example
 * <x-accordion data-single>
 *   <details name="faq">
 *     <summary>Question 1</summary>
 *     <div>Answer 1</div>
 *   </details>
 *   <details name="faq">
 *     <summary>Question 2</summary>
 *     <div>Answer 2</div>
 *   </details>
 * </x-accordion>
 */
class XAccordion extends HTMLElement {
  #details;
  #summaries;

  connectedCallback() {
    this.#details = [...this.querySelectorAll(':scope > details')];
    this.#summaries = this.#details.map(d => d.querySelector('summary'));

    if (this.#details.length === 0) return;

    this.#setup();
  }

  #setup() {
    this.#details.forEach((detail, i) => {
      const summary = this.#summaries[i];
      const panel = detail.querySelector(':scope > :not(summary)');

      if (!summary || !panel) return;

      // Generate IDs for accessibility
      const headingId = summary.id || `accordion-heading-${crypto.randomUUID().slice(0, 8)}`;
      const panelId = panel.id || `accordion-panel-${crypto.randomUUID().slice(0, 8)}`;

      summary.id = headingId;
      panel.id = panelId;

      // Set ARIA attributes
      summary.setAttribute('aria-expanded', detail.open ? 'true' : 'false');
      summary.setAttribute('aria-controls', panelId);
      panel.setAttribute('aria-labelledby', headingId);
      panel.setAttribute('role', 'region');

      // Keyboard navigation
      summary.addEventListener('keydown', (e) => this.#handleKey(e, i));

      // Handle toggle events for single mode and ARIA updates
      detail.addEventListener('toggle', () => this.#handleToggle(detail, i));
    });
  }

  #handleToggle(toggledDetail, index) {
    const summary = this.#summaries[index];
    summary.setAttribute('aria-expanded', toggledDetail.open ? 'true' : 'false');

    // Single-open mode: close others when one opens
    // This is a polyfill for browsers that don't support name attribute on details
    if (this.hasAttribute('data-single') && toggledDetail.open) {
      this.#details.forEach((detail, i) => {
        if (i !== index && detail.open) {
          detail.open = false;
          this.#summaries[i].setAttribute('aria-expanded', 'false');
        }
      });
    }

    this.dispatchEvent(new CustomEvent('accordion-toggle', {
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
    if (index >= 0 && index < this.#details.length) {
      this.#details[index].open = true;
    }
  }

  /**
   * Close a specific panel by index
   * @param {number} index - Panel index (0-based)
   */
  close(index) {
    if (index >= 0 && index < this.#details.length) {
      this.#details[index].open = false;
    }
  }

  /**
   * Toggle a specific panel by index
   * @param {number} index - Panel index (0-based)
   */
  toggle(index) {
    if (index >= 0 && index < this.#details.length) {
      this.#details[index].open = !this.#details[index].open;
    }
  }

  /**
   * Open all panels (only works when not in single mode)
   */
  openAll() {
    if (!this.hasAttribute('data-single')) {
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

customElements.define('x-accordion', XAccordion);

export { XAccordion };
