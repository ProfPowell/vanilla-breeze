/**
 * comparison-wc: Before/after image comparison slider
 *
 * Two children overlay each other. CSS clip-path reveals one side.
 * JS adds the drag handle and pointer events.
 * Without JS, both children display side-by-side.
 *
 * @attr {number} data-position - Initial slider position (0-100), default 50
 *
 * @example
 * <comparison-wc>
 *   <img src="before.jpg" alt="Before" />
 *   <img src="after.jpg" alt="After" />
 * </comparison-wc>
 */
class ComparisonWc extends HTMLElement {
  #divider;
  #dragging = false;

  connectedCallback() {
    const children = [...this.children];
    if (children.length < 2) return;

    const position = Number(this.dataset.position) || 50;

    // Inject the divider handle
    this.#divider = document.createElement('div');
    this.#divider.className = 'comparison-divider';
    this.#divider.setAttribute('role', 'slider');
    this.#divider.setAttribute('aria-label', 'Comparison slider');
    this.#divider.setAttribute('aria-valuemin', '0');
    this.#divider.setAttribute('aria-valuemax', '100');
    this.#divider.setAttribute('aria-valuenow', String(position));
    this.#divider.setAttribute('tabindex', '0');
    this.appendChild(this.#divider);

    this.#setPosition(position);

    // Pointer events on divider
    this.#divider.addEventListener('pointerdown', this.#onPointerDown);
    this.#divider.addEventListener('keydown', this.#onKeyDown);
  }

  disconnectedCallback() {
    if (this.#divider) {
      this.#divider.removeEventListener('pointerdown', this.#onPointerDown);
      this.#divider.removeEventListener('keydown', this.#onKeyDown);
    }
  }

  #onPointerDown = (e) => {
    e.preventDefault();
    this.#dragging = true;
    this.#divider.setPointerCapture(e.pointerId);
    this.#divider.addEventListener('pointermove', this.#onPointerMove);
    this.#divider.addEventListener('pointerup', this.#onPointerUp);
  };

  #onPointerMove = (e) => {
    if (!this.#dragging) return;
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.min(100, Math.max(0, (x / rect.width) * 100));
    this.#setPosition(percent);
  };

  #onPointerUp = (e) => {
    this.#dragging = false;
    this.#divider.releasePointerCapture(e.pointerId);
    this.#divider.removeEventListener('pointermove', this.#onPointerMove);
    this.#divider.removeEventListener('pointerup', this.#onPointerUp);
  };

  #onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 1;
    const current = Number(this.#divider.getAttribute('aria-valuenow'));

    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.#setPosition(Math.max(0, current - step));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.#setPosition(Math.min(100, current + step));
    }
  };

  #setPosition(percent) {
    this.style.setProperty('--_position', `${percent}%`);
    this.#divider.setAttribute('aria-valuenow', String(Math.round(percent)));
    this.#divider.style.left = `${percent}%`;

    this.dispatchEvent(new CustomEvent('comparison-change', {
      detail: { position: percent },
      bubbles: true
    }));
  }
}

customElements.define('comparison-wc', ComparisonWc);

export { ComparisonWc };
