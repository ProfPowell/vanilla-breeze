/**
 * compare-surface: Before/after image comparison slider
 *
 * Two children overlay each other. CSS clip-path reveals one side.
 * JS adds the drag handle and pointer events.
 * Without JS, both children display side-by-side.
 *
 * Expects exactly two content children. Extra children are hidden once
 * upgraded (CSS) and a console warning is logged.
 *
 * Position model (direction-aware): `position` is the percentage from the
 * inline-start edge. In LTR that is from the left, in `dir="rtl"` from the
 * right. The first child shows on the inline-start side of the divider,
 * the second on the inline-end side. Arrow keys follow the visual
 * direction (ArrowRight always moves the divider right).
 *
 * Position is an integer 0-100. User changes (drag, keyboard) reflect to
 * the host attribute and fire `compare-surface:change`; setting the
 * attribute or the `position` property updates the slider silently,
 * like a native input. Setup never rewrites the author's attribute.
 *
 * @attr {number} position - Slider position (0-100) from the inline-start edge, default 50.
 * @attr {string} label - Accessible name for the slider handle, default "Comparison slider".
 *
 * @fires compare-surface:change - detail: { position: number } (integer, user changes only)
 *
 * @example
 * <compare-surface>
 *   <img src="before.jpg" alt="Before" />
 *   <img src="after.jpg" alt="After" />
 * </compare-surface>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const DEFAULT_LABEL = 'Comparison slider';

/** @param {string | null} raw */
function parsePosition(raw) {
  if (raw === null || raw.trim() === '') return 50;
  const n = Number(raw);
  return Number.isNaN(n) ? 50 : Math.min(100, Math.max(0, n));
}

class CompareSurface extends VBElement {
  static observedAttributes = ['position', 'label', 'aria-label'];

  /** @type {HTMLElement | null} */
  #divider = null;
  #dragging = false;
  #reflecting = false;
  /** Integer position currently applied. */
  #position = 50;

  setup() {
    const children = [...this.children].filter((c) => !c.classList.contains('comparison-divider'));
    if (children.length < 2) return false;

    if (children.length > 2) {
      console.warn('[compare-surface] Expected exactly 2 children; extra children are hidden.');
    }

    this.#divider = document.createElement('div');
    this.#divider.className = 'comparison-divider';
    this.#divider.setAttribute('role', 'slider');
    this.#divider.setAttribute('aria-valuemin', '0');
    this.#divider.setAttribute('aria-valuemax', '100');
    this.#divider.setAttribute('aria-orientation', 'horizontal');
    this.#divider.setAttribute('tabindex', '0');
    this.#syncLabel();
    this.appendChild(this.#divider);

    // Apply the author's position without reflecting or dispatching.
    this.#apply(parsePosition(this.getAttribute('position')));

    this.listen(this.#divider, 'pointerdown', this.#onPointerDown);
    this.listen(this.#divider, 'pointermove', this.#onPointerMove);
    this.listen(this.#divider, 'pointerup', this.#endDrag);
    this.listen(this.#divider, 'pointercancel', this.#endDrag);
    this.listen(this.#divider, 'lostpointercapture', this.#endDrag);
    this.listen(this.#divider, 'keydown', this.#onKeyDown);
    return true;
  }

  teardown() {
    this.#divider?.remove();
    this.#divider = null;
    this.#dragging = false;
  }

  /**
   * @param {string} name
   * @param {string | null} oldVal
   * @param {string | null} newVal
   */
  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.#divider || oldVal === newVal) return;
    if (name === 'position') {
      if (this.#reflecting) return;
      this.#apply(parsePosition(newVal));
    } else {
      this.#syncLabel();
    }
  }

  #syncLabel() {
    if (!this.#divider) return;
    const label = this.getAttribute('label') || this.getAttribute('aria-label') || DEFAULT_LABEL;
    this.#divider.setAttribute('aria-label', label);
  }

  get #isRtl() {
    return getComputedStyle(this).direction === 'rtl';
  }

  /** @param {PointerEvent} e */
  #onPointerDown = (e) => {
    e.preventDefault();
    this.#dragging = true;
    this.#divider?.setPointerCapture(e.pointerId);
  };

  /** @param {PointerEvent} e */
  #onPointerMove = (e) => {
    if (!this.#dragging) return;
    const rect = this.getBoundingClientRect();
    if (!rect.width) return;
    const fromStart = this.#isRtl ? rect.right - e.clientX : e.clientX - rect.left;
    this.#userSet((fromStart / rect.width) * 100);
  };

  /** @param {PointerEvent} e */
  #endDrag = (e) => {
    if (!this.#dragging) return;
    this.#dragging = false;
    if (this.#divider?.hasPointerCapture(e.pointerId)) {
      this.#divider.releasePointerCapture(e.pointerId);
    }
  };

  /** @param {KeyboardEvent} e */
  #onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 1;
    // ArrowLeft/Right follow the visual direction; in RTL "right" is toward inline-start.
    const visual = this.#isRtl ? -1 : 1;
    const current = this.#position;
    /** @type {number | undefined} */
    let next;
    switch (e.key) {
      case 'ArrowRight': next = current + step * visual; break;
      case 'ArrowLeft': next = current - step * visual; break;
      case 'ArrowUp': next = current + step; break;
      case 'ArrowDown': next = current - step; break;
      case 'PageUp': next = current + 10; break;
      case 'PageDown': next = current - 10; break;
      case 'Home': next = 0; break;
      case 'End': next = 100; break;
      default: return;
    }
    e.preventDefault();
    this.#userSet(next);
  };

  /**
   * User-driven change: apply, reflect to the attribute, dispatch if changed.
   * @param {number} percent
   */
  #userSet(percent) {
    const prev = this.#position;
    this.#apply(Math.min(100, Math.max(0, percent)));
    if (this.#position === prev) return;
    this.#reflecting = true;
    try {
      this.setAttribute('position', String(this.#position));
    } finally {
      this.#reflecting = false;
    }
    this.dispatchEvent(new CustomEvent('compare-surface:change', {
      detail: { position: this.#position },
      bubbles: true,
    }));
  }

  /**
   * Apply a position to CSS and ARIA. No reflection, no event.
   * @param {number} percent - already clamped 0-100
   */
  #apply(percent) {
    this.#position = Math.round(percent);
    // CSS keeps the exact value so dragging stays smooth on wide surfaces.
    this.style.setProperty('--_position', `${percent}%`);
    if (this.#divider) {
      this.#divider.setAttribute('aria-valuenow', String(this.#position));
      this.#divider.setAttribute('aria-valuetext', `${this.#position}%`);
    }
  }

  /**
   * Current position (integer 0-100, percent from the inline-start edge).
   * @returns {number}
   */
  get position() {
    return this.#divider ? this.#position : Math.round(parsePosition(this.getAttribute('position')));
  }

  /**
   * Set position programmatically. Reflects to the attribute; does not fire
   * compare-surface:change (like a native input's value setter).
   * @param {number} val
   */
  set position(val) {
    const n = Number(val);
    const clamped = Math.round(Math.min(100, Math.max(0, Number.isNaN(n) ? 0 : n)));
    this.setAttribute('position', String(clamped));
  }
}

registerComponent('compare-surface', CompareSurface);

export { CompareSurface };
