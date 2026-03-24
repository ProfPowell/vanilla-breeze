/**
 * slide-accept: Slide-to-confirm interaction
 *
 * A draggable handle users slide across a track to confirm an action.
 * Uses pointer capture for reliable drag, springs back if released early,
 * and fires `slide-accept:accept` on activation.
 *
 * No-JS fallback: the element's text content is displayed as a readable
 * label inside a styled pill. JavaScript replaces this with the
 * interactive track + handle.
 *
 * @attr {string}  label           - Track label text (default: "Slide to confirm")
 * @attr {string}  activated-label - Label after activation (default: "Confirmed!")
 * @attr {string}  attention       - Attention animation: "shimmer" | "pulse"
 * @attr {number}  threshold       - Activation threshold 0-100 (default: 90)
 *
 * @fires slide-accept:accept - Handle reached threshold
 * @fires slide-accept:reset  - After reset() called
 *
 * @example
 * <slide-accept label="Slide to confirm">
 *   Slide to confirm
 * </slide-accept>
 */
import { registerComponent } from '../../lib/bundle-registry.js';

class SlideAccept extends HTMLElement {
  #handle;
  #label;
  #track;
  #dragging = false;
  #position = 0;       // 0-100
  #startX = 0;
  #startPos = 0;
  #activated = false;
  #setupDone = false;

  get activated() {
    return this.#activated;
  }

  get #threshold() {
    const thresholdAttr = this.getAttribute('threshold');
    const val = Number(thresholdAttr);
    return thresholdAttr !== null && !isNaN(val) ? Math.min(100, Math.max(0, val)) : 90;
  }

  connectedCallback() {
    if (this.hasAttribute('data-upgraded')) return;

    if (!this.#setupDone) {
      this.#build();
      this.#setupDone = true;
    }

    this.#handle.addEventListener('pointerdown', this.#onPointerDown);
    this.#handle.addEventListener('keydown', this.#onKeyDown);
    this.#handle.addEventListener('transitionend', this.#onTransitionEnd);
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    this.removeAttribute('data-upgraded');
    if (this.#handle) {
      this.#handle.removeEventListener('pointerdown', this.#onPointerDown);
      this.#handle.removeEventListener('keydown', this.#onKeyDown);
      this.#handle.removeEventListener('transitionend', this.#onTransitionEnd);
    }
  }

  #build() {
    this.#track = document.createElement('div');
    this.#track.className = 'slide-track';

    this.#label = document.createElement('span');
    this.#label.className = 'slide-label';
    this.#label.textContent = this.getAttribute('label') || 'Slide to confirm';

    this.#handle = document.createElement('div');
    this.#handle.className = 'slide-handle';
    this.#handle.setAttribute('role', 'slider');
    this.#handle.setAttribute('aria-valuemin', '0');
    this.#handle.setAttribute('aria-valuemax', '100');
    this.#handle.setAttribute('aria-valuenow', '0');
    this.#handle.setAttribute('aria-label', this.getAttribute('label') || 'Slide to confirm');
    this.#handle.setAttribute('tabindex', '0');
    this.#handle.innerHTML = '<icon-wc name="chevrons-right" size="sm"></icon-wc>';

    this.#track.append(this.#label, this.#handle);

    // Clear text content (progressive enhancement fallback) and inject track
    this.textContent = '';
    this.appendChild(this.#track);

    this.#setPosition(0);
  }

  reset() {
    this.#activated = false;
    this.removeAttribute('data-activated');
    this.#label.textContent = this.getAttribute('label') || 'Slide to confirm';
    this.#handle.removeAttribute('aria-disabled');
    this.#handle.setAttribute('tabindex', '0');
    this.#setPosition(0);
    this.dispatchEvent(new CustomEvent('slide-accept:reset', { bubbles: true }));
  }

  #onPointerDown = (e) => {
    if (this.#activated) return;
    e.preventDefault();

    // Cancel any in-progress spring-back transition
    if (this.hasAttribute('transitioning')) {
      // Read the current animated position using the same property the CSS animates
      const handleRect = this.#handle.getBoundingClientRect();
      const trackRect = this.#track.getBoundingClientRect();
      const handleInset = parseFloat(getComputedStyle(this.#track).getPropertyValue('--_handle-inset') || '0');
      const handleSize = this.#handle.offsetWidth;
      const maxTravel = trackRect.width - handleSize - (handleInset * 2);
      const currentOffset = handleRect.left - trackRect.left - handleInset;
      this.removeAttribute('transitioning');
      this.#position = maxTravel > 0 ? Math.max(0, Math.min(100, (currentOffset / maxTravel) * 100)) : 0;
      // Apply immediately so handle stays where it was
      this.#setPosition(this.#position);
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
    this.removeAttribute('transitioning');
  };

  #activate() {
    this.#activated = true;
    this.#setPosition(100);
    this.setAttribute('data-activated', '');
    this.#label.textContent = this.getAttribute('activated-label') || 'Confirmed!';
    this.#handle.setAttribute('aria-disabled', 'true');
    this.#handle.removeAttribute('tabindex');
    this.dispatchEvent(new CustomEvent('slide-accept:accept', { bubbles: true }));
  }

  #springBack() {
    this.setAttribute('transitioning', '');
    this.#setPosition(0);

    // Safety net: if transitionend doesn't fire (e.g. reduced motion,
    // duration: 0s, or display: none), clean up after a timeout
    setTimeout(() => {
      if (this.hasAttribute('transitioning')) {
        this.removeAttribute('transitioning');
      }
    }, 500);
  }

  #setPosition(percent) {
    this.#position = percent;
    this.style.setProperty('--_slide-position', String(percent));
    this.#handle.setAttribute('aria-valuenow', String(Math.round(percent)));
  }
}

registerComponent('slide-accept', SlideAccept);

export { SlideAccept };
