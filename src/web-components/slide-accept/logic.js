/**
 * slide-accept: Slide-to-confirm interaction
 *
 * A draggable handle users slide across a track to confirm an action.
 * Uses pointer capture for reliable drag, springs back if released early,
 * and fires `slide-accept:accept` on activation.
 *
 * Single-pointer alternative (WCAG 2.5.7): a tap or click on the handle
 * (press and release without dragging) confirms too, as do Enter, Space and
 * End on the focused handle. Dragging is never the only way to confirm.
 *
 * No-JS fallback: the element's text content is displayed as a readable
 * label inside a styled pill. JavaScript replaces this with the
 * interactive track + handle, and the authored text becomes the default
 * label (the `label` attribute still wins).
 *
 * Form-associated: with `name`, the element submits `value` (default "on")
 * once activated; `required` makes it invalid until activated. Form reset
 * calls reset(); `disabled` (or a disabled fieldset) blocks interaction.
 *
 * @attr {string}  label           - Track label text (default: authored text, else "Slide to confirm")
 * @attr {string}  activated-label - Label after activation (default: "Confirmed!")
 * @attr {string}  data-label-hint - Screen-reader hint (default: "Press Enter to confirm")
 * @attr {string}  attention       - Attention animation: "shimmer" | "pulse"
 * @attr {number}  threshold       - Activation threshold 0-100 (default: 90)
 * @attr {string}  name            - Form field name
 * @attr {string}  value           - Submitted value once activated (default: "on")
 * @attr {boolean} required        - Invalid (valueMissing) until activated
 * @attr {boolean} disabled        - Blocks interaction
 *
 * @fires slide-accept:accept - Handle reached threshold, or tap / Enter / Space / End
 * @fires slide-accept:reset  - After reset() called
 *
 * @example
 * <slide-accept>Slide to confirm</slide-accept>
 */
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const DEFAULT_LABEL = 'Slide to confirm';
const DEFAULT_ACTIVATED = 'Confirmed!';
const DEFAULT_HINT = 'Press Enter to confirm';
/** Pointer travel (px) under which a press-release counts as a tap. */
const TAP_SLOP = 6;

class SlideAccept extends VBElement {
  static formAssociated = true;
  static observedAttributes = ['label', 'activated-label', 'data-label-hint', 'required', 'value'];

  /** @type {ElementInternals} */
  #internals;
  /** @type {HTMLElement} */ #handle;
  /** @type {HTMLElement} */ #label;
  /** @type {HTMLElement} */ #hint;
  /** @type {HTMLElement} */ #track;
  #dragging = false;
  #position = 0;       // 0-100
  #startX = 0;
  #startPos = 0;
  #maxTravel = 0;      // furthest pointer travel (px) during this press
  #activated = false;
  #disabled = false;
  #setupDone = false;
  #authoredLabel = '';
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #springTimer;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this._adoptInternals(this.#internals);
  }

  get activated() {
    return this.#activated;
  }

  get #threshold() {
    const thresholdAttr = this.getAttribute('threshold');
    const val = Number(thresholdAttr);
    return thresholdAttr !== null && thresholdAttr.trim() !== '' && !isNaN(val)
      ? Math.min(100, Math.max(0, val)) : 90;
  }

  get #labelText() {
    return this.getAttribute('label') || this.#authoredLabel || DEFAULT_LABEL;
  }

  get #activatedText() {
    return this.getAttribute('activated-label') || DEFAULT_ACTIVATED;
  }

  get #rtl() {
    return getComputedStyle(this).direction === 'rtl';
  }

  setup() {
    if (!this.#setupDone) {
      this.#build();
      this.#setupDone = true;
    }

    this.listen(this.#handle, 'pointerdown', this.#onPointerDown);
    this.listen(this.#handle, 'keydown', this.#onKeyDown);
    this.listen(this.#handle, 'transitionend', this.#onTransitionEnd);
  }

  teardown() {
    if (this.#dragging) this.#endDrag();
    clearTimeout(this.#springTimer);
    this.removeAttribute('transitioning');
  }

  /**
   * @param {string} name
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.#setupDone) return;
    this.#syncText();
    if (name === 'required' || name === 'value') this.#syncForm();
  }

  #build() {
    // The authored text (progressive-enhancement fallback) is the default
    // label, so <slide-accept>Deslizar</slide-accept> stays in its language.
    this.#authoredLabel = (this.textContent || '').replace(/\s+/g, ' ').trim();

    this.#track = document.createElement('div');
    this.#track.className = 'slide-track';

    this.#label = document.createElement('span');
    this.#label.className = 'slide-label';
    // Polite live region: the switch to activated-label is announced.
    this.#label.setAttribute('role', 'status');

    this.#hint = document.createElement('span');
    this.#hint.className = 'visually-hidden slide-hint';
    this.#hint.id = `slide-hint-${Math.random().toString(36).slice(2, 9)}`;

    this.#handle = document.createElement('div');
    this.#handle.className = 'slide-handle';
    this.#handle.setAttribute('role', 'slider');
    this.#handle.setAttribute('aria-valuemin', '0');
    this.#handle.setAttribute('aria-valuemax', '100');
    this.#handle.setAttribute('aria-describedby', this.#hint.id);
    this.#handle.setAttribute('tabindex', '0');
    this.#handle.innerHTML = '<icon-wc name="chevrons-right" size="sm"></icon-wc>';

    this.#track.append(this.#label, this.#handle);

    // Clear text content (progressive enhancement fallback) and inject track
    this.textContent = '';
    this.append(this.#track, this.#hint);

    this.#syncText();
    this.#setPosition(0);
    this.#syncForm();
  }

  #syncText() {
    const label = this.#labelText;
    this.#label.textContent = this.#activated ? this.#activatedText : label;
    this.#handle.setAttribute('aria-label', label);
    this.#hint.textContent = this.getAttribute('data-label-hint') || DEFAULT_HINT;
    this.#syncValueText();
  }

  #syncValueText() {
    this.#handle.setAttribute('aria-valuetext', this.#activated
      ? this.#activatedText
      : `${Math.round(this.#position)}%`);
  }

  #syncForm() {
    const value = this.getAttribute('value') || 'on';
    this.#internals.setFormValue(this.#activated ? value : null);
    if (this.hasAttribute('required') && !this.#activated) {
      this.#internals.setValidity({ valueMissing: true }, `${this.#labelText} to continue.`, this.#handle);
    } else {
      this.#internals.setValidity({});
    }
  }

  reset() {
    this.#activated = false;
    this.removeAttribute('data-activated');
    this.#handle.removeAttribute('aria-disabled');
    this.#syncAriaDisabled();
    this.#setPosition(0);
    this.#syncText();
    this.#syncForm();
    this.dispatchEvent(new CustomEvent('slide-accept:reset', { bubbles: true }));
  }

  formResetCallback() {
    if (this.#activated || this.#position !== 0) this.reset();
  }

  /** @param {boolean} disabled */
  formDisabledCallback(disabled) {
    this.#disabled = disabled;
    if (disabled && this.#dragging) {
      this.#endDrag();
      this.#springBack();
    }
    this.#syncAriaDisabled();
  }

  #syncAriaDisabled() {
    if (!this.#handle) return;
    if (this.#activated || this.#disabled) this.#handle.setAttribute('aria-disabled', 'true');
    else this.#handle.removeAttribute('aria-disabled');
  }

  #onPointerDown = (/** @type {PointerEvent} */ e) => {
    if (this.#activated || this.#disabled) return;
    if (e.button !== 0) return;
    e.preventDefault();
    this.#handle.focus({ preventScroll: true });

    // Cancel any in-progress spring-back transition
    if (this.hasAttribute('transitioning')) {
      // Read the current animated position from the handle's inline-start edge
      const handleRect = this.#handle.getBoundingClientRect();
      const trackRect = this.#track.getBoundingClientRect();
      const handleInset = parseFloat(getComputedStyle(this.#track).getPropertyValue('--_handle-inset') || '0');
      const handleSize = this.#handle.offsetWidth;
      const maxTravel = trackRect.width - handleSize - (handleInset * 2);
      const currentOffset = this.#rtl
        ? trackRect.right - handleRect.right - handleInset
        : handleRect.left - trackRect.left - handleInset;
      this.removeAttribute('transitioning');
      clearTimeout(this.#springTimer);
      this.#setPosition(maxTravel > 0 ? Math.max(0, Math.min(100, (currentOffset / maxTravel) * 100)) : 0);
    }

    this.#dragging = true;
    this.#startX = e.clientX;
    this.#startPos = this.#position;
    this.#maxTravel = 0;
    try { this.#handle.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    this.setAttribute('data-dragging', '');

    this.#handle.addEventListener('pointermove', this.#onPointerMove);
    this.#handle.addEventListener('pointerup', this.#onPointerUp);
    this.#handle.addEventListener('pointercancel', this.#onPointerCancel);
  };

  #onPointerMove = (/** @type {PointerEvent} */ e) => {
    if (!this.#dragging) return;
    const trackWidth = this.#track.getBoundingClientRect().width - this.#handle.offsetWidth;
    if (trackWidth <= 0) return;
    const rawDelta = e.clientX - this.#startX;
    this.#maxTravel = Math.max(this.#maxTravel, Math.abs(rawDelta));
    // Inline-start is the right edge in RTL, so travel runs leftwards.
    const deltaX = this.#rtl ? -rawDelta : rawDelta;
    const deltaPct = (deltaX / trackWidth) * 100;
    this.#setPosition(Math.min(100, Math.max(0, this.#startPos + deltaPct)));
  };

  /** @param {PointerEvent} [e] */
  #endDrag(e) {
    this.#dragging = false;
    this.removeAttribute('data-dragging');
    if (e) {
      try { this.#handle.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    }
    this.#handle.removeEventListener('pointermove', this.#onPointerMove);
    this.#handle.removeEventListener('pointerup', this.#onPointerUp);
    this.#handle.removeEventListener('pointercancel', this.#onPointerCancel);
  }

  #onPointerUp = (/** @type {PointerEvent} */ e) => {
    if (!this.#dragging) return;
    const tapped = this.#maxTravel < TAP_SLOP && Math.abs(e.clientX - this.#startX) < TAP_SLOP;
    this.#endDrag(e);

    // A press-release without dragging is the single-pointer alternative.
    if (tapped || this.#position >= this.#threshold) {
      this.#activate();
    } else {
      this.#springBack();
    }
  };

  #onPointerCancel = (/** @type {PointerEvent} */ e) => {
    if (!this.#dragging) return;
    this.#endDrag(e);
    this.#springBack();
  };

  #onKeyDown = (/** @type {KeyboardEvent} */ e) => {
    if (this.#activated || this.#disabled) return;

    const step = e.shiftKey ? 20 : 5;
    // Forward = towards inline-end: ArrowLeft in RTL.
    const rtl = this.#rtl;
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';

    if (e.key === forward || e.key === 'ArrowUp') {
      e.preventDefault();
      this.#setPosition(Math.min(100, this.#position + step));
      if (this.#position >= this.#threshold) this.#activate();
    } else if (e.key === back || e.key === 'ArrowDown') {
      e.preventDefault();
      this.#setPosition(Math.max(0, this.#position - step));
    } else if (e.key === 'End' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.#activate();
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.#setPosition(0);
    }
  };

  #onTransitionEnd = () => {
    this.removeAttribute('transitioning');
  };

  #activate() {
    if (this.#activated) return;
    this.#activated = true;
    this.#setPosition(100);
    this.setAttribute('data-activated', '');
    // The handle keeps focus (and stays in the tab order) with aria-disabled,
    // so keyboard users are not dropped to <body>; the label live region
    // announces the activated text.
    this.#syncAriaDisabled();
    this.#syncText();
    this.#syncForm();
    this.dispatchEvent(new CustomEvent('slide-accept:accept', { bubbles: true }));
  }

  #springBack() {
    this.setAttribute('transitioning', '');
    this.#setPosition(0);

    // Safety net: if transitionend doesn't fire (e.g. reduced motion,
    // duration: 0s, or display: none), clean up after a timeout
    clearTimeout(this.#springTimer);
    this.#springTimer = setTimeout(() => {
      this.removeAttribute('transitioning');
    }, 500);
  }

  /** @param {number} percent */
  #setPosition(percent) {
    this.#position = percent;
    this.style.setProperty('--_slide-position', String(percent));
    this.#handle.setAttribute('aria-valuenow', String(Math.round(percent)));
    this.#syncValueText();
  }
}

registerComponent('slide-accept', SlideAccept);

export { SlideAccept };
