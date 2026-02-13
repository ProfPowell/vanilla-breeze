/**
 * slide-accept-wc: Slide-to-confirm interaction
 *
 * A draggable handle users slide across a track to confirm an action.
 * Uses pointer capture for reliable drag, springs back if released early,
 * and fires `slide-accept` on activation.
 *
 * @attr {string}  data-label           - Track label text (default: "Slide to confirm")
 * @attr {string}  data-activated-label - Label after activation (default: "Confirmed!")
 * @attr {string}  data-attention       - Attention animation: "shimmer" | "pulse"
 * @attr {number}  data-threshold       - Activation threshold 0-100 (default: 90)
 *
 * @fires slide-accept - Handle reached threshold
 * @fires slide-reset  - After reset() called
 *
 * @example
 * <slide-accept-wc data-label="Slide to confirm">
 *   Slide to confirm
 * </slide-accept-wc>
 */
class SlideAcceptWc extends HTMLElement {
  #handle;
  #label;
  #track;
  #dragging = false;
  #position = 0;       // 0-100
  #startX = 0;
  #startPos = 0;
  #activated = false;

  get activated() {
    return this.#activated;
  }

  get #threshold() {
    return Number(this.dataset.threshold) || 90;
  }

  connectedCallback() {
    // Build internal DOM
    this.#track = document.createElement('div');
    this.#track.className = 'slide-track';

    this.#label = document.createElement('span');
    this.#label.className = 'slide-label';
    this.#label.textContent = this.dataset.label || 'Slide to confirm';

    this.#handle = document.createElement('button');
    this.#handle.className = 'slide-handle';
    this.#handle.setAttribute('role', 'slider');
    this.#handle.setAttribute('aria-valuemin', '0');
    this.#handle.setAttribute('aria-valuemax', '100');
    this.#handle.setAttribute('aria-valuenow', '0');
    this.#handle.setAttribute('aria-label', this.dataset.label || 'Slide to confirm');
    this.#handle.setAttribute('tabindex', '0');
    this.#handle.innerHTML = '<icon-wc name="chevrons-right" size="sm"></icon-wc>';

    this.#track.append(this.#label, this.#handle);

    // Clear text content (progressive enhancement fallback) and inject track
    this.textContent = '';
    this.appendChild(this.#track);

    this.#setPosition(0);

    // Events
    this.#handle.addEventListener('pointerdown', this.#onPointerDown);
    this.#handle.addEventListener('keydown', this.#onKeyDown);
    this.#handle.addEventListener('transitionend', this.#onTransitionEnd);
  }

  disconnectedCallback() {
    if (this.#handle) {
      this.#handle.removeEventListener('pointerdown', this.#onPointerDown);
      this.#handle.removeEventListener('keydown', this.#onKeyDown);
      this.#handle.removeEventListener('transitionend', this.#onTransitionEnd);
    }
  }

  reset() {
    this.#activated = false;
    this.removeAttribute('data-activated');
    this.#label.textContent = this.dataset.label || 'Slide to confirm';
    this.#handle.disabled = false;
    this.#setPosition(0);
    this.dispatchEvent(new CustomEvent('slide-reset', { bubbles: true }));
  }

  #onPointerDown = (e) => {
    if (this.#activated) return;
    e.preventDefault();

    // Cancel any in-progress spring-back transition
    if (this.hasAttribute('data-transitioning')) {
      const computed = getComputedStyle(this.#handle);
      const left = parseFloat(computed.left);
      const trackWidth = this.#track.getBoundingClientRect().width - this.#handle.offsetWidth;
      this.removeAttribute('data-transitioning');
      this.#position = trackWidth > 0 ? (left / trackWidth) * 100 : 0;
    }

    this.#dragging = true;
    this.#startX = e.clientX;
    this.#startPos = this.#position;
    this.#handle.setPointerCapture(e.pointerId);
    this.setAttribute('data-dragging', '');

    this.#handle.addEventListener('pointermove', this.#onPointerMove);
    this.#handle.addEventListener('pointerup', this.#onPointerUp);
    this.#handle.addEventListener('pointercancel', this.#onPointerUp);
  };

  #onPointerMove = (e) => {
    if (!this.#dragging) return;
    const trackWidth = this.#track.getBoundingClientRect().width - this.#handle.offsetWidth;
    if (trackWidth <= 0) return;
    const deltaX = e.clientX - this.#startX;
    const deltaPct = (deltaX / trackWidth) * 100;
    const newPos = Math.min(100, Math.max(0, this.#startPos + deltaPct));
    this.#setPosition(newPos);
  };

  #onPointerUp = (e) => {
    if (!this.#dragging) return;
    this.#dragging = false;
    this.removeAttribute('data-dragging');
    this.#handle.releasePointerCapture(e.pointerId);
    this.#handle.removeEventListener('pointermove', this.#onPointerMove);
    this.#handle.removeEventListener('pointerup', this.#onPointerUp);
    this.#handle.removeEventListener('pointercancel', this.#onPointerUp);

    if (this.#position >= this.#threshold) {
      this.#activate();
    } else {
      this.#springBack();
    }
  };

  #onKeyDown = (e) => {
    if (this.#activated) return;

    const step = e.shiftKey ? 20 : 5;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.#setPosition(Math.min(100, this.#position + step));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.#setPosition(Math.max(0, this.#position - step));
    } else if (e.key === 'End') {
      e.preventDefault();
      this.#activate();
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.#setPosition(0);
    }

    // Check activation on key release position
    if ((e.key === 'ArrowRight') && this.#position >= this.#threshold) {
      this.#activate();
    }
  };

  #onTransitionEnd = () => {
    this.removeAttribute('data-transitioning');
  };

  #activate() {
    this.#activated = true;
    this.#setPosition(100);
    this.setAttribute('data-activated', '');
    this.#label.textContent = this.dataset.activatedLabel || 'Confirmed!';
    this.#handle.disabled = true;
    this.dispatchEvent(new CustomEvent('slide-accept', { bubbles: true }));
  }

  #springBack() {
    this.setAttribute('data-transitioning', '');
    this.#setPosition(0);
  }

  #setPosition(percent) {
    this.#position = percent;
    this.style.setProperty('--_slide-position', String(percent));
    this.#handle.setAttribute('aria-valuenow', String(Math.round(percent)));
  }
}

customElements.define('slide-accept-wc', SlideAcceptWc);

export { SlideAcceptWc };
