/**
 * star-rating: Form-associated star rating web component
 *
 * Layer 3 convenience wrapper that generates a data-rating fieldset
 * (Layer 1 CSS) and opts it into the rating enhancement (Layer 2 JS)
 * for clear/unrate behavior and rating:change events.
 *
 * Participates in native form submission via ElementInternals.
 *
 * @attr {string}  name       - Form field name (omit for read-only)
 * @attr {string}  value      - Current rating value (default: 0)
 * @attr {string}  max        - Number of stars (default: 5)
 * @attr {string}  label      - Legend text (default: "Rating")
 * @attr {boolean} allow-half - Enable half-star increments
 * @attr {boolean} readonly   - Display-only mode
 * @attr {string}  icon       - Lucide icon name for icon-wc (default: star text)
 * @attr {boolean} required   - Makes rating required for form validation
 *
 * @example
 * <star-rating name="rating" label="Rate this product"></star-rating>
 * <star-rating value="4.2" readonly label="Average rating"></star-rating>
 */

import { registerComponent } from '../../lib/bundle-registry.js';

class StarRating extends HTMLElement {
  static formAssociated = true;

  #internals;
  #initialValue;
  #fieldset;

  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  connectedCallback() {
    if (this.hasAttribute('data-upgraded')) return;
    this.#build();
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    this.removeAttribute('data-upgraded');
  }

  #build() {
    // Already built (reconnect after disconnect) — skip
    if (this.querySelector('fieldset')) return;

    const value = Number(this.getAttribute('value') || 0);
    this.#initialValue = value;
    const max = Number(this.getAttribute('max') || 5);
    const label = this.getAttribute('label') || 'Rating';
    const isHalf = this.hasAttribute('allow-half');
    const isReadonly = this.hasAttribute('readonly');
    const iconName = this.getAttribute('icon');
    // Use a unique internal radio name per instance to prevent cross-talk
    const name = this.getAttribute('name') || `star-rating-${crypto.randomUUID().slice(0, 8)}`;
    const internalName = `_sr_${name}`;

    if (isReadonly) {
      this.#renderReadonly(value, max, label, iconName);
    } else {
      this.#renderInteractive(value, max, label, internalName, isHalf, iconName);
    }

    this.#syncFormValue(value);
    this.#validate();
  }

  #renderInteractive(value, max, label, internalName, isHalf, iconName) {
    const fieldset = document.createElement('fieldset');
    fieldset.setAttribute('data-rating', '');
    if (isHalf) fieldset.setAttribute('data-rating-half', '');
    // Opt into the rating enhancement layer
    fieldset.setAttribute('data-effect', 'rating');

    const legend = document.createElement('legend');
    legend.textContent = label;
    fieldset.appendChild(legend);

    if (isHalf) {
      for (let i = 1; i <= max; i++) {
        const halfVal = i - 0.5;

        // Left half
        const leftLabel = document.createElement('label');
        leftLabel.setAttribute('data-half', 'left');
        const leftRadio = document.createElement('input');
        leftRadio.type = 'radio';
        leftRadio.name = internalName;
        leftRadio.value = String(halfVal);
        leftRadio.setAttribute('aria-label', `${halfVal} ${halfVal === 1 ? 'star' : 'stars'}`);
        if (value === halfVal) leftRadio.checked = true;
        leftLabel.appendChild(leftRadio);
        leftLabel.append(this.#createIcon(iconName));
        fieldset.appendChild(leftLabel);

        // Right half (full star)
        const rightLabel = document.createElement('label');
        rightLabel.setAttribute('data-half', 'right');
        const rightRadio = document.createElement('input');
        rightRadio.type = 'radio';
        rightRadio.name = internalName;
        rightRadio.value = String(i);
        rightRadio.setAttribute('aria-label', `${i} ${i === 1 ? 'star' : 'stars'}`);
        if (value === i) rightRadio.checked = true;
        rightLabel.appendChild(rightRadio);
        rightLabel.append(this.#createIcon(iconName));
        fieldset.appendChild(rightLabel);
      }
    } else {
      for (let i = 1; i <= max; i++) {
        const lbl = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = internalName;
        radio.value = String(i);
        radio.setAttribute('aria-label', `${i} ${i === 1 ? 'star' : 'stars'}`);
        if (value === i) radio.checked = true;
        lbl.appendChild(radio);
        lbl.append(this.#createIcon(iconName));
        fieldset.appendChild(lbl);
      }
    }

    this.appendChild(fieldset);
    this.#fieldset = fieldset;

    // Listen for rating:change from the enhancement layer (Layer 2)
    fieldset.addEventListener('rating:change', (e) => {
      this.#syncFormValue(/** @type {CustomEvent} */ (e).detail.value);
      this.#validate();
    });

    // Resilient fallback: also listen for native radio change events
    // in case the enhancement layer doesn't attach
    fieldset.addEventListener('change', (e) => {
      const target = /** @type {HTMLInputElement} */ (e.target);
      if (target.type === 'radio' && target.checked) {
        this.#syncFormValue(Number(target.value));
        this.#validate();
      }
    });
  }

  #renderReadonly(value, max, label, iconName) {
    const container = document.createElement('fieldset');
    container.setAttribute('data-rating', '');
    container.setAttribute('data-rating-readonly', '');
    container.setAttribute('role', 'img');
    container.setAttribute('aria-label', `${label}: ${value} out of ${max}`);

    const legend = document.createElement('legend');
    legend.textContent = label;
    container.appendChild(legend);

    const fullStars = Math.floor(value);
    const fraction = value - fullStars;

    for (let i = 1; i <= max; i++) {
      const span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');

      if (i <= fullStars) {
        span.classList.add('star-filled');
      } else if (i === fullStars + 1 && fraction > 0) {
        span.classList.add('star-partial');
        span.style.setProperty('--_star-fill', `${fraction * 100}%`);

        const filled = document.createElement('span');
        filled.classList.add('star-partial-fill');
        filled.append(this.#createIcon(iconName));
        span.appendChild(filled);
      } else {
        span.classList.add('star-empty');
      }

      span.append(this.#createIcon(iconName));
      container.appendChild(span);
    }

    this.appendChild(container);
    this.#fieldset = container;
  }

  #createIcon(iconName) {
    if (iconName) {
      const icon = document.createElement('icon-wc');
      icon.setAttribute('name', iconName);
      return icon;
    }
    return document.createTextNode('\u2605');
  }

  #syncFormValue(value) {
    const numVal = Number(value);
    if (numVal > 0) {
      this.#internals.setFormValue(String(numVal));
    } else {
      this.#internals.setFormValue(null);
    }
  }

  #validate() {
    if (this.hasAttribute('required')) {
      const checked = this.#fieldset?.querySelector('input[type="radio"]:checked');
      if (!checked) {
        this.#internals.setValidity(
          { valueMissing: true },
          'Please select a rating',
          this.#fieldset || this
        );
      } else {
        this.#internals.setValidity({});
      }
    } else {
      this.#internals.setValidity({});
    }
  }

  formResetCallback() {
    if (!this.#fieldset) return;

    this.#fieldset.querySelectorAll('input[type="radio"]').forEach(
      (/** @type {HTMLInputElement} */ r) => { r.checked = false; }
    );

    if (this.#initialValue > 0) {
      const target = /** @type {HTMLInputElement | null} */ (
        this.#fieldset.querySelector(`input[value="${this.#initialValue}"]`)
      );
      if (target) target.checked = true;
    }

    this.#syncFormValue(this.#initialValue);
    this.#validate();
  }

  formStateRestoreCallback(state) {
    if (!state || !this.#fieldset) return;

    const target = /** @type {HTMLInputElement | null} */ (
      this.#fieldset.querySelector(`input[value="${state}"]`)
    );
    if (target) {
      target.checked = true;
      this.#syncFormValue(Number(state));
      this.#validate();
    }
  }

  get value() {
    if (!this.#fieldset) return Number(this.getAttribute('value') || 0);
    const checked = /** @type {HTMLInputElement | null} */ (
      this.#fieldset.querySelector('input[type="radio"]:checked')
    );
    return checked ? Number(checked.value) : 0;
  }

  set value(val) {
    if (!this.#fieldset) return;

    this.#fieldset.querySelectorAll('input[type="radio"]').forEach(
      (/** @type {HTMLInputElement} */ r) => { r.checked = false; }
    );

    const numVal = Number(val);
    if (numVal > 0) {
      const target = /** @type {HTMLInputElement | null} */ (
        this.#fieldset.querySelector(`input[value="${numVal}"]`)
      );
      if (target) target.checked = true;
    }

    this.#syncFormValue(numVal);
    this.#validate();
  }
}

registerComponent('star-rating', StarRating);

export { StarRating };
