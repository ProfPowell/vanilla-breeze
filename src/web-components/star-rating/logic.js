/**
 * star-rating: Form-associated star rating web component
 *
 * Layer 3 convenience wrapper that generates a data-rating fieldset
 * (Layer 1 CSS) and opts it into the rating effect (Layer 2 JS,
 * `data-effect="rating"`) for clear/unrate and rating:change events.
 *
 * Participates in native form submission via ElementInternals: FormData
 * holds exactly one entry (`name=value`). The generated radios are detached
 * from the owner form (`form` attribute pointing at no element) so they never
 * submit their own entry, while a per-instance group name keeps native
 * arrow-key navigation.
 *
 * @attr {string}  name       - Form field name (omit for read-only)
 * @attr {string}  value      - Rating value; also the reset default (default: 0)
 * @attr {string}  max        - Number of stars (default: 5)
 * @attr {string}  label      - Legend text (default: "Rating")
 * @attr {boolean} allow-half - Enable half-star increments
 * @attr {boolean} readonly   - Display-only mode
 * @attr {string}  icon       - Lucide icon name for icon-wc (default: star text)
 * @attr {boolean} required   - Makes rating required for form validation
 * @attr {string}  data-label-one      - Radio label, CLDR "one" category (default "{n} star")
 * @attr {string}  data-label-other    - Radio label, other categories (default "{n} stars")
 * @attr {string}  data-label-readonly - Read-only summary (default "{label}: {value} out of {max}")
 * @attr {string}  data-label-required - Validation message (default "Please select a rating")
 * @attr {string}  data-label-cleared  - Clear announcement (default "Rating cleared")
 *
 * All attributes are observed: changing them after upgrade re-renders.
 * Setting `.value` before the element connects is kept and applied on build.
 *
 * @example
 * <star-rating name="rating" label="Rate this product"></star-rating>
 * <star-rating value="4.2" readonly label="Average rating"></star-rating>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/** Radios carry form="<id of nothing>" so their form owner is null. */
const DETACHED_FORM = '_star-rating-detached';
const STRUCTURAL = new Set(['max', 'label', 'readonly', 'allow-half', 'icon',
  'data-label-one', 'data-label-other', 'data-label-readonly', 'data-label-cleared']);
const DEFAULT_LABELS = {
  one: '{n} star',
  other: '{n} stars',
  readonly: '{label}: {value} out of {max}',
  required: 'Please select a rating',
};

let instanceCount = 0;

/** @param {unknown} v */
function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

class StarRating extends VBElement {
  static formAssociated = true;

  static get observedAttributes() {
    return ['value', 'required', ...STRUCTURAL];
  }

  #internals;
  /** Reset target: the `value` attribute. */
  #defaultValue = 0;
  /** @type {HTMLFieldSetElement | null} */
  #fieldset = null;
  /** Value set while no fieldset exists (property set before connect, rebuild). */
  /** @type {number | null} */
  #pendingValue = null;
  #readonlyValue = 0;
  /** Per-instance radio group name: never collides across instances/forms. */
  #groupName = `_sr_${++instanceCount}`;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this._adoptInternals(this.#internals);
  }

  setup() {
    // Reconnect: reuse the fieldset we built (DOM survives disconnect), but
    // always re-wire listeners below — listen() handlers were released.
    const existing = /** @type {HTMLFieldSetElement | null} */ (
      this.querySelector(':scope > fieldset[data-rating]')
    );
    // Only reuse the fieldset THIS instance built. One from a clone or from
    // serialized markup carries another instance's group name (sharing it
    // would merge the radio groups), so replace it, keeping its value.
    if (!existing || existing !== this.#fieldset) {
      if (existing) {
        const checked = /** @type {HTMLInputElement | null} */ (existing.querySelector('input:checked'));
        if (checked) this.#pendingValue ??= toNumber(checked.value);
        existing.remove();
      }
      this.#build();
    }

    const fs = this.#fieldset;
    if (fs && !this.#isReadonly()) {
      // From the rating effect (also covers clear-to-0).
      this.listen(fs, 'rating:change', () => this.#commit());
      // Resilient fallback when the effect layer is not loaded.
      this.listen(fs, 'change', (e) => {
        const t = /** @type {HTMLInputElement} */ (e.target);
        if (t.type === 'radio' && t.checked) this.#commit();
      });
    }
    this.#commit();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'value') this.#defaultValue = toNumber(newVal);
    // Before the first build, setup() reads every attribute itself.
    if (!this.#fieldset) return;

    if (name === 'value') this.value = toNumber(newVal);
    else if (name === 'required') this.#validate();
    else this.#rebuild(this.value);
  }

  // ── Build ───────────────────────────────────────────────────────────

  #isReadonly() {
    return this.hasAttribute('readonly');
  }

  #build() {
    this.#defaultValue = toNumber(this.getAttribute('value'));
    const value = this.#pendingValue ?? this.#defaultValue;
    this.#pendingValue = null;

    const max = Math.max(1, Math.round(toNumber(this.getAttribute('max')) || 5));
    const label = this.getAttribute('label') || 'Rating';
    const iconName = this.getAttribute('icon');

    if (this.#isReadonly()) {
      this.#readonlyValue = value;
      this.#renderReadonly(value, max, label, iconName);
    } else {
      this.#renderInteractive(value, max, label, this.hasAttribute('allow-half'), iconName);
    }
  }

  /** Throw away the generated DOM and build again, keeping `value`. */
  #rebuild(value) {
    this.#fieldset?.remove();
    this.#fieldset = null;
    this.#pendingValue = value;
    // Connected + upgraded: rebuild now. Otherwise setup() builds on connect.
    if (this.hasAttribute('data-upgraded')) this._reinit();
  }

  #renderInteractive(value, max, label, isHalf, iconName) {
    const fieldset = document.createElement('fieldset');
    fieldset.setAttribute('data-rating', '');
    if (isHalf) fieldset.setAttribute('data-rating-half', '');
    // Opt into the rating effect (Layer 2)
    fieldset.setAttribute('data-effect', 'rating');
    const cleared = this.getAttribute('data-label-cleared');
    if (cleared) fieldset.setAttribute('data-label-cleared', cleared);

    const legend = document.createElement('legend');
    legend.textContent = label;
    fieldset.appendChild(legend);

    const addRadio = (/** @type {number} */ v, /** @type {string | null} */ half) => {
      const lbl = document.createElement('label');
      if (half) lbl.setAttribute('data-half', half);
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = this.#groupName;
      radio.setAttribute('form', DETACHED_FORM);
      radio.value = String(v);
      radio.setAttribute('aria-label', this.#countLabel(v));
      if (value === v) radio.checked = true;
      lbl.appendChild(radio);
      lbl.append(this.#createIcon(iconName));
      fieldset.appendChild(lbl);
    };

    for (let i = 1; i <= max; i++) {
      if (isHalf) {
        addRadio(i - 0.5, 'left');
        addRadio(i, 'right');
      } else {
        addRadio(i, null);
      }
    }

    this.appendChild(fieldset);
    this.#fieldset = fieldset;
  }

  #renderReadonly(value, max, label, iconName) {
    const container = document.createElement('fieldset');
    container.setAttribute('data-rating', '');
    container.setAttribute('data-rating-readonly', '');
    container.setAttribute('role', 'img');
    const tpl = this.getAttribute('data-label-readonly') ?? DEFAULT_LABELS.readonly;
    container.setAttribute('aria-label', tpl
      .replaceAll('{label}', label)
      .replaceAll('{value}', this.#formatNumber(value))
      .replaceAll('{max}', this.#formatNumber(max)));

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
    return document.createTextNode('★');
  }

  // ── i18n ────────────────────────────────────────────────────────────

  #locale() {
    return /** @type {HTMLElement | null} */ (this.closest('[lang]'))?.lang || undefined;
  }

  /** @param {number} n */
  #formatNumber(n) {
    try { return new Intl.NumberFormat(this.#locale()).format(n); } catch { return String(n); }
  }

  /** @param {number} n */
  #countLabel(n) {
    let cat = 'other';
    try { cat = new Intl.PluralRules(this.#locale()).select(n); } catch { /* keep other */ }
    const tpl = this.getAttribute(`data-label-${cat}`)
      ?? this.getAttribute('data-label-other')
      ?? (cat === 'one' ? DEFAULT_LABELS.one : DEFAULT_LABELS.other);
    return tpl.replaceAll('{n}', this.#formatNumber(n));
  }

  // ── Form value + validity ───────────────────────────────────────────

  #commit() {
    const v = this.value;
    this.#internals.setFormValue(v > 0 ? String(v) : null);
    this.#validate();
  }

  #validate() {
    const fs = this.#fieldset;
    if (this.hasAttribute('required') && !this.#isReadonly() && fs
        && !fs.querySelector('input[type="radio"]:checked')) {
      const anchor = /** @type {HTMLElement | null} */ (fs.querySelector('input[type="radio"]'));
      this.#internals.setValidity(
        { valueMissing: true },
        this.getAttribute('data-label-required') || DEFAULT_LABELS.required,
        anchor || fs,
      );
    } else {
      this.#internals.setValidity({});
    }
  }

  /** Check the radio for `numVal` (0 = none) without firing events. */
  #check(numVal) {
    const fs = this.#fieldset;
    if (!fs) return;
    for (const r of /** @type {NodeListOf<HTMLInputElement>} */ (fs.querySelectorAll('input[type="radio"]'))) {
      r.checked = numVal > 0 && Number(r.value) === numVal;
    }
  }

  formResetCallback() {
    this.value = this.#defaultValue;
  }

  formStateRestoreCallback(state) {
    if (typeof state === 'string') this.value = toNumber(state);
  }

  get value() {
    const fs = this.#fieldset;
    if (!fs) return this.#pendingValue ?? toNumber(this.getAttribute('value'));
    if (this.#isReadonly()) return this.#readonlyValue;
    const checked = /** @type {HTMLInputElement | null} */ (
      fs.querySelector('input[type="radio"]:checked')
    );
    return checked ? Number(checked.value) : 0;
  }

  set value(val) {
    const numVal = toNumber(val);
    if (!this.#fieldset) {
      // Not built yet (property set before connect): apply on build.
      this.#pendingValue = numVal;
      return;
    }
    if (this.value === numVal) return;
    if (this.#isReadonly()) {
      this.#rebuild(numVal);
      return;
    }
    this.#check(numVal);
    this.#commit();
  }
}

registerComponent('star-rating', StarRating);

export { StarRating };
