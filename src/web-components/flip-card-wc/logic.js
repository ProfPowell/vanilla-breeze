/**
 * flip-card-wc: Accessible flip card with front/back faces
 *
 * Toggles between front and back content with 3D flip animation.
 * Manages `inert` on the hidden face so screen readers only see visible content.
 *
 * @attr {string} data-orientation - Flip axis: "horizontal" (default) or "vertical"
 * @attr {string} data-duration - Animation speed: "fast", "normal" (default), or "slow"
 * @attr {boolean} data-flipped - Reflects flip state
 *
 * Child attributes:
 * @attr {string} data-face - "front" or "back" on child elements
 * @attr {boolean} data-flip - Marks an element as a flip trigger
 *
 * @example
 * <flip-card-wc>
 *   <div data-face="front">Front content</div>
 *   <div data-face="back">Back content</div>
 * </flip-card-wc>
 */
class FlipCardWc extends HTMLElement {
  #front;
  #back;
  #triggers;
  #isWholeCardTrigger = false;

  connectedCallback() {
    this.#front = this.querySelector(':scope > [data-face="front"]');
    this.#back = this.querySelector(':scope > [data-face="back"]');

    if (!this.#front || !this.#back) return;

    this.#triggers = [...this.querySelectorAll('[data-flip]')];
    this.#isWholeCardTrigger = this.#triggers.length === 0;

    this.#setup();
    this.#syncState();
  }

  #setup() {
    if (this.#isWholeCardTrigger) {
      this.setAttribute('role', 'button');
      this.setAttribute('tabindex', '0');
      if (!this.getAttribute('aria-label')) {
        this.setAttribute('aria-label', 'Flip card');
      }
      this.addEventListener('click', () => this.toggle());
      this.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggle();
        }
      });
    } else {
      this.#triggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggle();
        });
      });
    }
  }

  #syncState() {
    const flipped = this.hasAttribute('data-flipped');
    this.#front.inert = flipped;
    this.#back.inert = !flipped;
  }

  /** Flip to show the back face */
  flip() {
    if (this.hasAttribute('data-flipped')) return;
    this.setAttribute('data-flipped', '');
    this.#syncState();
    this.#dispatchEvent();
    this.#moveFocus(this.#back);
  }

  /** Flip to show the front face */
  unflip() {
    if (!this.hasAttribute('data-flipped')) return;
    this.removeAttribute('data-flipped');
    this.#syncState();
    this.#dispatchEvent();
    this.#moveFocus(this.#front);
  }

  /** Toggle between front and back */
  toggle() {
    if (this.hasAttribute('data-flipped')) {
      this.unflip();
    } else {
      this.flip();
    }
  }

  /** @returns {boolean} Whether the card is currently flipped */
  get flipped() {
    return this.hasAttribute('data-flipped');
  }

  set flipped(value) {
    if (value) {
      this.flip();
    } else {
      this.unflip();
    }
  }

  #dispatchEvent() {
    this.dispatchEvent(new CustomEvent('flip-card-flip', {
      detail: { flipped: this.hasAttribute('data-flipped') },
      bubbles: true
    }));
  }

  #moveFocus(face) {
    const focusTarget = face.querySelector('[autofocus], [data-flip], button, a, input, select, textarea');
    if (focusTarget) {
      focusTarget.focus();
    }
  }
}

customElements.define('flip-card-wc', FlipCardWc);

export { FlipCardWc };
