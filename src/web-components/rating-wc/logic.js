/**
 * rating-wc: Form-associated star rating web component
 *
 * Generates a data-rating fieldset internally and participates in
 * native form submission via ElementInternals. Supports half-stars,
 * read-only display, custom icons, and form validation.
 *
 * @attr {string} name - Form field name (omit for read-only)
 * @attr {string} value - Current rating value (default: 0)
 * @attr {string} max - Number of stars (default: 5)
 * @attr {string} label - Legend text (default: "Rating")
 * @attr {boolean} data-half - Enable half-star increments
 * @attr {boolean} data-readonly - Display-only mode
 * @attr {string} data-icon - Lucide icon name for icon-wc (default: star text ★)
 * @attr {boolean} required - Makes rating required for form validation
 *
 * @example
 * <rating-wc name="rating" label="Rate this product"></rating-wc>
 * <rating-wc value="4.2" data-readonly label="Average rating"></rating-wc>
 */
class RatingWc extends HTMLElement {
  static formAssociated = true;

  #internals;
  #initialValue;

  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  connectedCallback() {
    const value = Number(this.getAttribute('value') || 0);
    this.#initialValue = value;
    const max = Number(this.getAttribute('max') || 5);
    const label = this.getAttribute('label') || 'Rating';
    const isHalf = this.hasAttribute('data-half');
    const isReadonly = this.hasAttribute('data-readonly');
    const iconName = this.getAttribute('data-icon');
    const name = this.getAttribute('name') || 'rating';

    if (isReadonly) {
      this.#renderReadonly(value, max, label, iconName);
    } else {
      this.#renderInteractive(value, max, label, name, isHalf, iconName);
    }

    this.#syncFormValue(value);
    this.#validate();
  }

  #renderInteractive(value, max, label, name, isHalf, iconName) {
    const fieldset = document.createElement('fieldset');
    fieldset.setAttribute('data-rating', '');
    if (isHalf) fieldset.setAttribute('data-rating-half', '');

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
        leftRadio.name = name;
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
        rightRadio.name = name;
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
        radio.name = name;
        radio.value = String(i);
        radio.setAttribute('aria-label', `${i} ${i === 1 ? 'star' : 'stars'}`);
        if (value === i) radio.checked = true;
        lbl.appendChild(radio);
        lbl.append(this.#createIcon(iconName));
        fieldset.appendChild(lbl);
      }
    }

    this.appendChild(fieldset);

    // Listen for rating-change from rating-init.js
    fieldset.addEventListener('rating-change', (e) => {
      this.#syncFormValue(e.detail.value);
      this.#validate();
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
        // Full star
        span.style.color = 'var(--color-warning, oklch(75% 0.15 85))';
      } else if (i === fullStars + 1 && fraction > 0) {
        // Partial star via clip-path
        span.style.position = 'relative';
        span.style.color = 'var(--color-border, oklch(75% 0 0))';

        const filled = document.createElement('span');
        filled.style.position = 'absolute';
        filled.style.inset = '0';
        filled.style.clipPath = `inset(0 ${(1 - fraction) * 100}% 0 0)`;
        filled.style.color = 'var(--color-warning, oklch(75% 0.15 85))';
        filled.append(this.#createIcon(iconName));
        span.appendChild(filled);
      } else {
        // Empty star
        span.style.color = 'var(--color-border, oklch(75% 0 0))';
      }

      span.append(this.#createIcon(iconName));
      container.appendChild(span);
    }

    this.appendChild(container);
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
      const fieldset = this.querySelector('fieldset');
      const checked = fieldset?.querySelector('input[type="radio"]:checked');
      if (!checked) {
        this.#internals.setValidity(
          { valueMissing: true },
          'Please select a rating',
          fieldset || this
        );
      } else {
        this.#internals.setValidity({});
      }
    } else {
      this.#internals.setValidity({});
    }
  }

  formResetCallback() {
    const fieldset = this.querySelector('fieldset');
    if (!fieldset) return;

    // Uncheck all radios
    fieldset.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = false; });

    // Re-check initial value if set
    if (this.#initialValue > 0) {
      const target = fieldset.querySelector(`input[value="${this.#initialValue}"]`);
      if (target) target.checked = true;
    }

    this.#syncFormValue(this.#initialValue);
    this.#validate();
  }

  formStateRestoreCallback(state) {
    if (!state) return;
    const fieldset = this.querySelector('fieldset');
    if (!fieldset) return;

    const target = fieldset.querySelector(`input[value="${state}"]`);
    if (target) {
      target.checked = true;
      this.#syncFormValue(Number(state));
      this.#validate();
    }
  }

  get value() {
    const fieldset = this.querySelector('fieldset');
    if (!fieldset) return Number(this.getAttribute('value') || 0);
    const checked = fieldset.querySelector('input[type="radio"]:checked');
    return checked ? Number(checked.value) : 0;
  }

  set value(val) {
    const fieldset = this.querySelector('fieldset');
    if (!fieldset) return;

    fieldset.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = false; });

    const numVal = Number(val);
    if (numVal > 0) {
      const target = fieldset.querySelector(`input[value="${numVal}"]`);
      if (target) target.checked = true;
    }

    this.#syncFormValue(numVal);
    this.#validate();
  }
}

customElements.define('rating-wc', RatingWc);

export { RatingWc };
