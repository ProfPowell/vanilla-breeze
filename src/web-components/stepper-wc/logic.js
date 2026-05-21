/**
 * stepper-wc: Stepper for values <input type="number"> + data-stepper cannot reach.
 *
 * Modes (auto-detected from attributes, first match wins):
 *   1. enum       — data-options="…" (JSON array or csv)
 *   2. token      — data-values="…"  (csv)
 *   3. formatted  — data-format="…"  OR data-suffix="…"
 *   4. numeric    — fallback (logs a console hint pointing at data-stepper)
 *
 * Plain numeric stepping should use `<input type="number" data-stepper>`.
 * See admin/shipped/stepper-wc.md for the full plan.
 *
 * @attr {string}  value          - Current value (string; reflected)
 * @attr {string}  name           - Form field name (form participation)
 * @attr {string}  data-min       - Numeric min (numeric/formatted modes)
 * @attr {string}  data-max       - Numeric max (numeric/formatted modes)
 * @attr {string}  data-step      - Step increment (default 1)
 * @attr {string}  data-values    - Token-snap values, csv
 * @attr {string}  data-options   - Enum options: JSON [{value,label}] or csv
 * @attr {string}  data-format    - number | currency | percent | duration | bytes
 * @attr {string}  data-currency  - ISO 4217 code, for data-format=currency
 * @attr {string}  data-suffix    - Static suffix, e.g. "px"
 * @attr {boolean} data-show-label- In token mode, show token name (strip leading --)
 * @attr {boolean} data-accelerate- Enable long-press acceleration on +/- buttons
 * @attr {boolean} disabled
 * @attr {boolean} readonly
 *
 * @example Formatted-unit
 *   <stepper-wc data-min="0" data-max="100" data-suffix="px" value="12"></stepper-wc>
 *   <stepper-wc data-format="currency" data-currency="USD" data-step="0.5" value="5"></stepper-wc>
 *
 * @example Token-snap
 *   <stepper-wc data-values="0,4,8,12,16,24,32" data-suffix="px" value="16"></stepper-wc>
 *
 * @example Enum
 *   <stepper-wc data-options="low,medium,high,critical" value="medium"></stepper-wc>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const MINUS_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const PLUS_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

/** Parse data-options as JSON array of {value,label} or csv shorthand. */
function parseOptions(raw) {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      return arr.map((o) => ({ value: String(o.value), label: String(o.label ?? o.value) }));
    } catch {
      return [];
    }
  }
  return trimmed.split(',').map((s) => {
    const v = s.trim();
    return { value: v, label: v };
  });
}

/** Parse data-values csv into a string array (preserves token form). */
function parseValues(raw) {
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

/** Format a duration in seconds as M:SS or H:MM:SS. */
function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** Format bytes (decimal SI: KB, MB, ...). */
function formatBytes(bytes, locale) {
  const n = Number(bytes) || 0;
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let i = 0;
  let v = Math.abs(n);
  while (v >= 1000 && i < units.length - 1) { v /= 1000; i += 1; }
  const fmt = new Intl.NumberFormat(locale, {
    minimumFractionDigits: i === 0 ? 0 : 1,
    maximumFractionDigits: i === 0 ? 0 : 2,
  });
  return `${n < 0 ? '-' : ''}${fmt.format(v)} ${units[i]}`;
}

/** Detect locale from the document. */
function detectLocale() {
  return document.documentElement.lang || undefined;
}

/** Decimal places implied by a step value, for fix-precision step math. */
function decimalsOf(step) {
  const s = String(step);
  const dot = s.indexOf('.');
  return dot < 0 ? 0 : s.length - dot - 1;
}

class StepperWc extends VBElement {
  static formAssociated = true;
  static observedAttributes = ['value', 'disabled', 'readonly'];

  #internals;
  #mode;          // 'enum' | 'token' | 'formatted' | 'numeric'
  #min = -Infinity;
  #max = Infinity;
  #step = 1;
  #values = [];   // token mode
  #options = [];  // enum mode
  #format;        // formatted mode formatter key
  #currency;
  #suffix = '';
  #showLabel = false;
  #accelerate = false;
  #locale;

  #value;         // canonical: number (numeric/formatted) or string (token/enum)
  #initialValue;
  #valueEl;       // outer .stepper-value (carries spinbutton role + aria; grid container)
  #displayEl;     // inner .stepper-value-display (the actual visible text)
  #reservedSet;   // Set<string> of display strings already reserved as hidden grid siblings
  #decBtn;
  #incBtn;
  #intl;          // cached Intl.NumberFormat for number/currency/percent

  // Long-press state
  #holdTimer = 0;
  #holdInterval = 0;
  #holdRamped = false; // true once we entered the held-step phase
  #suppressNextClick = false;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this._adoptInternals(this.#internals);
  }

  setup() {
    this.#detectMode();
    this.#parseConfig();
    this.#build();
    const initial = this.getAttribute('value');
    this.#initialValue = initial;
    this.#applyValue(initial ?? this.#defaultValue(), 'init');
  }

  attributeChangedCallback(name, _old, next) {
    if (!this.isConnected || !this.#valueEl) return;
    if (name === 'value') {
      this.#applyValue(next ?? this.#defaultValue(), 'attr');
    } else if (name === 'disabled' || name === 'readonly') {
      this.#updateDisabled();
    }
  }

  #detectMode() {
    if (this.hasAttribute('data-options')) this.#mode = 'enum';
    else if (this.hasAttribute('data-values')) this.#mode = 'token';
    else if (this.hasAttribute('data-format') || this.hasAttribute('data-suffix')) this.#mode = 'formatted';
    else {
      this.#mode = 'numeric';
      // Console hint, not a blocker — author may have legitimate reasons.
      console.info('[stepper-wc] No mode attribute set. Plain numeric stepping is better served by `<input type="number" data-stepper>`. See /docs/concepts/numeric-inputs/');
    }
  }

  #parseConfig() {
    this.#min = this.hasAttribute('data-min') ? Number(this.getAttribute('data-min')) : -Infinity;
    this.#max = this.hasAttribute('data-max') ? Number(this.getAttribute('data-max')) : Infinity;
    this.#step = Number(this.getAttribute('data-step')) || 1;
    this.#values = parseValues(this.getAttribute('data-values'));
    this.#options = parseOptions(this.getAttribute('data-options'));
    this.#format = this.getAttribute('data-format') || (this.hasAttribute('data-suffix') ? 'number' : null);
    this.#currency = this.getAttribute('data-currency') || 'USD';
    this.#suffix = this.getAttribute('data-suffix') || '';
    this.#showLabel = this.hasAttribute('data-show-label');
    this.#accelerate = this.hasAttribute('data-accelerate');
    this.#locale = detectLocale();
    this.#intl = this.#buildFormatter();
  }

  #buildFormatter() {
    if (!this.#format) return null;
    const decimals = decimalsOf(this.#step);
    if (this.#format === 'number') {
      return new Intl.NumberFormat(this.#locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    if (this.#format === 'currency') {
      return new Intl.NumberFormat(this.#locale, {
        style: 'currency',
        currency: this.#currency,
      });
    }
    if (this.#format === 'percent') {
      return new Intl.NumberFormat(this.#locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    return null; // duration / bytes handled inline
  }

  #defaultValue() {
    if (this.#mode === 'enum') return this.#options[0]?.value ?? '';
    if (this.#mode === 'token') return this.#values[0] ?? '';
    return '0';
  }

  #build() {
    this.replaceChildren(); // owned content only — author should not put children here
    this.#decBtn = document.createElement('button');
    this.#decBtn.type = 'button';
    this.#decBtn.className = 'stepper-dec';
    this.#decBtn.setAttribute('aria-label', 'Decrease');
    this.#decBtn.setAttribute('tabindex', '-1');
    this.#decBtn.innerHTML = MINUS_SVG;

    this.#incBtn = document.createElement('button');
    this.#incBtn.type = 'button';
    this.#incBtn.className = 'stepper-inc';
    this.#incBtn.setAttribute('aria-label', 'Increase');
    this.#incBtn.setAttribute('tabindex', '-1');
    this.#incBtn.innerHTML = PLUS_SVG;

    this.#valueEl = document.createElement('span');
    this.#valueEl.className = 'stepper-value';
    this.#valueEl.setAttribute('role', 'spinbutton');
    this.#valueEl.setAttribute('tabindex', '0');

    this.#displayEl = document.createElement('span');
    this.#displayEl.className = 'stepper-value-display';

    this.#valueEl.appendChild(this.#displayEl);

    // Reserve span set: all candidate display strings live as hidden grid
    // siblings of the display. The grid cell sizes to the widest, regardless
    // of font metrics ('medium' can render wider than 'critical' despite
    // being shorter — length-as-proxy is not safe).
    this.#reservedSet = new Set();
    for (const candidate of this.#initialCandidates()) {
      this.#reserve(candidate);
    }

    this.appendChild(this.#decBtn);
    this.appendChild(this.#valueEl);
    this.appendChild(this.#incBtn);

    this.#bindButton(this.#decBtn, -1);
    this.#bindButton(this.#incBtn, +1);
    this.listen(this.#valueEl, 'keydown', this.#onSpinKey);
    this.#updateDisabled();
  }

  #bindButton(btn, dir) {
    this.listen(btn, 'click', (e) => {
      if (this.#suppressNextClick) {
        this.#suppressNextClick = false;
        e.preventDefault();
        return;
      }
      this.#stepBy(dir, 1);
    });

    if (!this.#accelerate) return;

    this.listen(btn, 'pointerdown', (e) => {
      const pe = /** @type {PointerEvent} */ (e);
      if (pe.pointerType === 'mouse' && pe.button !== 0) return;
      if (this.#disabledOrReadonly()) return;
      this.#holdRamped = false;
      // Start fast-step phase after 500ms hold.
      this.#holdTimer = window.setTimeout(() => {
        this.#holdRamped = true;
        this.#holdInterval = window.setInterval(() => this.#stepBy(dir, 1), 100);
        // After another 1000ms, switch to a faster, larger-step interval.
        this.#holdTimer = window.setTimeout(() => {
          window.clearInterval(this.#holdInterval);
          this.#holdInterval = window.setInterval(() => this.#stepBy(dir, 5), 50);
        }, 1000);
      }, 500);
    });

    const stopHold = () => {
      window.clearTimeout(this.#holdTimer);
      window.clearInterval(this.#holdInterval);
      this.#holdTimer = 0;
      this.#holdInterval = 0;
      if (this.#holdRamped) {
        // We already stepped via interval; suppress the click that pointerup triggers.
        this.#suppressNextClick = true;
      }
    };
    this.listen(btn, 'pointerup', stopHold);
    this.listen(btn, 'pointerleave', stopHold);
    this.listen(btn, 'pointercancel', stopHold);
  }

  #onSpinKey = (e) => {
    if (this.#disabledOrReadonly()) return;
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        e.preventDefault(); this.#stepBy(+1, 1); break;
      case 'ArrowDown':
      case 'ArrowLeft':
        e.preventDefault(); this.#stepBy(-1, 1); break;
      case 'PageUp':
        e.preventDefault(); this.#stepBy(+1, 10); break;
      case 'PageDown':
        e.preventDefault(); this.#stepBy(-1, 10); break;
      case 'Home':
        e.preventDefault(); this.#jumpTo('min'); break;
      case 'End':
        e.preventDefault(); this.#jumpTo('max'); break;
      default:
    }
  };

  #disabledOrReadonly() {
    return this.hasAttribute('disabled') || this.hasAttribute('readonly');
  }

  #updateDisabled() {
    const disabled = this.hasAttribute('disabled');
    this.#decBtn.disabled = disabled;
    this.#incBtn.disabled = disabled;
    this.#valueEl.setAttribute('aria-disabled', String(disabled));
    if (disabled) this.#valueEl.removeAttribute('tabindex');
    else this.#valueEl.setAttribute('tabindex', '0');
  }

  // --- Stepping ---

  #stepBy(direction, multiplier) {
    if (this.#disabledOrReadonly()) return;
    const next = this.#computeNext(direction, multiplier);
    if (next === null || next === this.#value) return;
    this.#applyValue(next, 'step');
  }

  #jumpTo(end) {
    if (this.#mode === 'enum') {
      const idx = end === 'min' ? 0 : this.#options.length - 1;
      this.#applyValue(this.#options[idx]?.value, 'step');
      return;
    }
    if (this.#mode === 'token') {
      const idx = end === 'min' ? 0 : this.#values.length - 1;
      this.#applyValue(this.#values[idx], 'step');
      return;
    }
    const target = end === 'min'
      ? (this.#min === -Infinity ? this.#value : this.#min)
      : (this.#max === Infinity ? this.#value : this.#max);
    this.#applyValue(String(target), 'step');
  }

  #computeNext(direction, multiplier) {
    if (this.#mode === 'enum') {
      const idx = this.#options.findIndex((o) => o.value === this.#value);
      const safeIdx = idx === -1 ? 0 : idx;
      const nextIdx = Math.min(this.#options.length - 1, Math.max(0, safeIdx + direction * multiplier));
      return this.#options[nextIdx]?.value;
    }
    if (this.#mode === 'token') {
      const idx = this.#findTokenIndex(this.#value);
      // off-scale: snap to nearest first, THEN step
      let safeIdx = idx;
      if (safeIdx === -1) safeIdx = this.#nearestTokenIndex(this.#value);
      const nextIdx = Math.min(this.#values.length - 1, Math.max(0, safeIdx + direction * multiplier));
      return this.#values[nextIdx];
    }
    // numeric / formatted
    const current = Number(this.#value) || 0;
    const decimals = decimalsOf(this.#step);
    const raw = current + direction * this.#step * multiplier;
    const fixed = Number(raw.toFixed(decimals));
    const clamped = Math.min(this.#max, Math.max(this.#min, fixed));
    return String(clamped);
  }

  #findTokenIndex(val) {
    if (val == null) return -1;
    const direct = this.#values.indexOf(String(val));
    if (direct !== -1) return direct;
    // numeric match (handles "16" vs "16.0", etc.)
    const n = Number(val);
    if (Number.isFinite(n)) {
      const idx = this.#values.findIndex((v) => Number(v) === n);
      if (idx !== -1) return idx;
    }
    return -1;
  }

  #nearestTokenIndex(val) {
    const n = Number(val);
    if (!Number.isFinite(n)) return 0;
    let bestIdx = 0;
    let bestDist = Infinity;
    this.#values.forEach((v, i) => {
      const vn = Number(v);
      if (!Number.isFinite(vn)) return;
      const d = Math.abs(vn - n);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    return bestIdx;
  }

  // --- Value commit ---

  #applyValue(rawValue, source) {
    const normalized = this.#normalize(rawValue);
    const changed = normalized !== this.#value;
    this.#value = normalized;

    // Reflect attribute without re-entering attributeChangedCallback.
    const attrCurrent = this.getAttribute('value');
    if (attrCurrent !== String(normalized)) {
      this.setAttribute('value', String(normalized));
    }

    this.#renderDisplay();
    this.#updateAria();
    this.#updateButtons();
    this.#syncFormValue();
    this.#syncStates();

    if (changed && source !== 'init') {
      this.dispatchEvent(new Event('input', { bubbles: true }));
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  #normalize(raw) {
    if (raw == null) return this.#defaultValue();
    if (this.#mode === 'enum') {
      const v = String(raw);
      const found = this.#options.find((o) => o.value === v);
      return found ? v : (this.#options[0]?.value ?? '');
    }
    if (this.#mode === 'token') {
      const v = String(raw);
      // Allow off-scale values to be stored as-is (snap happens on first step).
      return v;
    }
    // numeric / formatted
    const n = Number(raw);
    if (!Number.isFinite(n)) return String(this.#min === -Infinity ? 0 : this.#min);
    const decimals = decimalsOf(this.#step);
    return String(Number(Math.min(this.#max, Math.max(this.#min, n)).toFixed(decimals)));
  }

  #renderDisplay() {
    const text = this.#displayText();
    this.#displayEl.textContent = text;
    // Grow reserve monotonically. Unbounded ranges (no data-max) start with a
    // heuristic; if the user steps past it, we add the current display as a
    // reserve sibling so the cell stays at the new width from then on.
    this.#reserve(text);
  }

  #displayText(value = this.#value) {
    if (this.#mode === 'enum') {
      const opt = this.#options.find((o) => o.value === value);
      return opt?.label ?? value ?? '';
    }
    if (this.#mode === 'token') {
      const display = this.#showLabel
        ? String(value).replace(/^--/, '')
        : String(value);
      return this.#suffix ? `${display}${this.#suffix}` : display;
    }
    if (this.#mode === 'formatted') {
      const n = Number(value) || 0;
      if (this.#format === 'duration') return formatDuration(n);
      if (this.#format === 'bytes') return formatBytes(n, this.#locale);
      if (this.#intl) {
        // Intl.NumberFormat with style:percent expects the underlying ratio (0–1).
        // We treat the stored value as the user-visible percentage (0–100), so divide.
        const v = this.#format === 'percent' ? n / 100 : n;
        const formatted = this.#intl.format(v);
        return this.#suffix && this.#format === 'number' ? `${formatted}${this.#suffix}` : formatted;
      }
      return this.#suffix ? `${n}${this.#suffix}` : String(n);
    }
    return String(value ?? '');
  }

  /**
   * Initial set of display candidates to reserve width for. Enum/token modes
   * enumerate every reachable option. Formatted/numeric modes sample bounds,
   * the current value, and digit-boundary heuristics (for unbounded ranges
   * where authors didn't pin data-max).
   */
  #initialCandidates() {
    if (this.#mode === 'enum') {
      return this.#options.map((o) => this.#displayText(o.value));
    }
    if (this.#mode === 'token') {
      return this.#values.map((v) => this.#displayText(v));
    }
    const seen = new Set();
    const push = (n) => { if (Number.isFinite(n)) seen.add(n); };
    if (this.#min !== -Infinity) push(this.#min);
    if (this.#max !== Infinity) push(this.#max);
    push(Number(this.getAttribute('value')) || 0);
    // Unbounded ranges need a heuristic so the cell doesn't start narrow and
    // grow as the user steps up past digit boundaries. The cell can still
    // grow at runtime if it does, but seeding common magnitudes covers the
    // 99% case (single → 4-digit values).
    if (this.#max === Infinity) {
      // Unbounded — seed plausible upper magnitudes so the cell doesn't
      // visibly grow on first overflow past a digit boundary. Tuned to
      // four orders for general numeric/currency/percent (enough for most
      // real ranges; the growing-reserve handles outliers at runtime).
      // Bytes is special: the formatter scales units, so we seed the
      // unit-switch points (KB/MB/GB) explicitly to reserve their widest
      // formatted strings up-front.
      const seed = [10, 100, 1000, 10000];
      for (const n of seed) push(n);
      if (this.#format === 'bytes') {
        // Unit-switch points minus 1: largest formatted string at each unit.
        for (const n of [999, 999_000, 999_000_000, 999_000_000_000]) push(n);
      }
    }
    return [...seen].map((n) => this.#displayText(String(n)));
  }

  /** Add a display string to the reserve set; idempotent. */
  #reserve(text) {
    const t = String(text ?? '');
    if (!t || this.#reservedSet.has(t)) return;
    this.#reservedSet.add(t);
    const span = document.createElement('span');
    span.className = 'stepper-value-reserve';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = t;
    this.#valueEl.appendChild(span);
  }

  /** Public hook for authors who mutate config attributes after upgrade. */
  recomputeWidth() {
    if (!this.#valueEl) return;
    // Drop existing reserves and rebuild from current config.
    this.#valueEl.querySelectorAll('.stepper-value-reserve').forEach((el) => el.remove());
    this.#reservedSet = new Set();
    for (const c of this.#initialCandidates()) this.#reserve(c);
  }

  #updateAria() {
    if (this.#mode === 'enum') {
      const idx = this.#options.findIndex((o) => o.value === this.#value);
      this.#valueEl.setAttribute('aria-valuemin', '1');
      this.#valueEl.setAttribute('aria-valuemax', String(this.#options.length));
      this.#valueEl.setAttribute('aria-valuenow', String((idx === -1 ? 0 : idx) + 1));
      this.#valueEl.setAttribute('aria-valuetext', this.#displayText());
      return;
    }
    if (this.#mode === 'token') {
      const idx = this.#findTokenIndex(this.#value);
      this.#valueEl.setAttribute('aria-valuemin', '1');
      this.#valueEl.setAttribute('aria-valuemax', String(this.#values.length));
      this.#valueEl.setAttribute('aria-valuenow', String((idx === -1 ? 0 : idx) + 1));
      this.#valueEl.setAttribute('aria-valuetext', this.#displayText());
      return;
    }
    const n = Number(this.#value) || 0;
    if (this.#min !== -Infinity) this.#valueEl.setAttribute('aria-valuemin', String(this.#min));
    else this.#valueEl.removeAttribute('aria-valuemin');
    if (this.#max !== Infinity) this.#valueEl.setAttribute('aria-valuemax', String(this.#max));
    else this.#valueEl.removeAttribute('aria-valuemax');
    this.#valueEl.setAttribute('aria-valuenow', String(n));
    this.#valueEl.setAttribute('aria-valuetext', this.#displayText());
  }

  #updateButtons() {
    const atMin = this.#isAtMin();
    const atMax = this.#isAtMax();
    this.#decBtn.disabled = atMin || this.hasAttribute('disabled');
    this.#incBtn.disabled = atMax || this.hasAttribute('disabled');
  }

  #isAtMin() {
    if (this.#mode === 'enum') return this.#value === this.#options[0]?.value;
    if (this.#mode === 'token') {
      const idx = this.#findTokenIndex(this.#value);
      return idx === 0;
    }
    return this.#min !== -Infinity && Number(this.#value) <= this.#min;
  }

  #isAtMax() {
    if (this.#mode === 'enum') return this.#value === this.#options[this.#options.length - 1]?.value;
    if (this.#mode === 'token') {
      const idx = this.#findTokenIndex(this.#value);
      return idx === this.#values.length - 1;
    }
    return this.#max !== Infinity && Number(this.#value) >= this.#max;
  }

  #syncFormValue() {
    this.#internals.setFormValue(String(this.#value ?? ''));
  }

  #syncStates() {
    this.setState('at-min', this.#isAtMin());
    this.setState('at-max', this.#isAtMax());
  }

  // --- Form lifecycle ---

  formResetCallback() {
    this.#applyValue(this.#initialValue ?? this.#defaultValue(), 'reset');
  }

  formStateRestoreCallback(state) {
    if (state != null) this.#applyValue(state, 'restore');
  }

  // --- Public property API ---

  /** The user-visible formatted string (e.g. "$5.00", "2.05 KB", "Medium"). */
  get displayText() { return this.#displayEl?.textContent ?? ''; }

  get value() { return this.#value == null ? '' : String(this.#value); }
  set value(v) {
    if (String(v) === String(this.#value)) return;
    this.#applyValue(v, 'api');
  }

  get form() { return this.#internals.form; }
  get name() { return this.getAttribute('name'); }
  get type() { return this.localName; }
  get validity() { return this.#internals.validity; }
  get validationMessage() { return this.#internals.validationMessage; }
  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() { return this.#internals.reportValidity(); }
}

registerComponent('stepper-wc', StepperWc);

export { StepperWc };
