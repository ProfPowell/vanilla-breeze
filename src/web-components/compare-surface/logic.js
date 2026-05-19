/**
 * compare-surface: Before/after image comparison slider
 *
 * Two children overlay each other. CSS clip-path reveals one side.
 * JS adds the drag handle and pointer events.
 * Without JS, both children display side-by-side.
 *
 * Expects exactly two child elements. Extra children are ignored.
 * Position reflects back to the host attribute on every change.
 *
 * @attr {number} position - Slider position (0-100), default 50. Reflected on change.
 *
 * @example
 * <compare-surface>
 *   <img src="before.jpg" alt="Before" />
 *   <img src="after.jpg" alt="After" />
 * </compare-surface>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class CompareSurface extends VBElement {
  #divider;
  #dragging = false;

  setup() {
    const children = [...this.children];
    if (children.length < 2) return false;

    // Warn if more than two content children
    if (children.length > 2) {
      console.warn('[compare-surface] Expected exactly 2 children; extra children will be ignored.');
    }

    // Parse position — use nullish check so position="0" works
    const posAttr = this.getAttribute('position');
    const position = posAttr !== null ? Number(posAttr) : 50;
    const clamped = Math.min(100, Math.max(0, isNaN(position) ? 50 : position));

    // Inject the divider handle
    this.#divider = document.createElement('div');
    this.#divider.className = 'comparison-divider';
    this.#divider.setAttribute('role', 'slider');
    this.#divider.setAttribute('aria-label', 'Comparison slider');
    this.#divider.setAttribute('aria-valuemin', '0');
    this.#divider.setAttribute('aria-valuemax', '100');
    this.#divider.setAttribute('aria-valuenow', String(Math.round(clamped)));
    this.#divider.setAttribute('tabindex', '0');
    this.appendChild(this.#divider);

    this.#setPosition(clamped);

    // Pointer events on divider
    this.listen(this.#divider, 'pointerdown', this.#onPointerDown);
    this.listen(this.#divider, 'keydown', this.#onKeyDown);
    return true;
  }

  teardown() {
    if (this.#divider) {
      this.#divider.remove();
      this.#divider = null;
    }
    this.#dragging = false;
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
    const rounded = Math.round(percent);
    this.style.setProperty('--_position', `${percent}%`);
    if (this.#divider) {
      this.#divider.setAttribute('aria-valuenow', String(rounded));
      this.#divider.style.left = `${percent}%`;
    }

    // Reflect position to host attribute
    this.setAttribute('position', String(rounded));

    this.dispatchEvent(new CustomEvent('compare-surface:change', {
      detail: { position: percent },
      bubbles: true
    }));
  }

  /** Get current position (0-100) */
  get position() {
    return Number(this.getAttribute('position')) || 0;
  }

  /** Set position programmatically */
  set position(val) {
    const clamped = Math.min(100, Math.max(0, Number(val) || 0));
    this.#setPosition(clamped);
  }
}

registerComponent('compare-surface', CompareSurface);

export { CompareSurface };
