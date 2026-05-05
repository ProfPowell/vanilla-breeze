/**
 * <iron-triangle> — Project-shape constraint surface.
 *
 * Captures Time × Cost × Scope, computes a single integer
 * `capacityPoints` budget, and exposes it to other Planning Pack
 * components (notably <nfr-compass>) via property, attribute mirror
 * (`data-capacity-points`), and the `iron-triangle:change` event.
 *
 * Default capacity formula:
 *   capacityPoints = ceil(sprintWeeks × sprintCount × teamFTE × focusFactor)
 * Default focusFactor = 0.6 (override via `data-focus-factor`).
 *
 * Two operator paths:
 *   1. Formula (default) — capacity computes from T/C/S inputs.
 *   2. Manual — toggle reveals an integer input; T/C/S still saved.
 *
 * Light DOM: the user's fieldsets/inputs live directly inside the
 * element. The component reads them by `name="time.sprintWeeks"`-style
 * dotted attributes, computes capacity, writes the live readout into
 * the `<output name="capacityPoints">` and `<small name="capacityFormula">`
 * placeholders, and exposes the JSON value to the surrounding form via
 * ElementInternals.setFormValue().
 *
 * See spec.md for the full API surface and pedagogy.
 */

import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import {
  defaultFormula,
  defaultFormulaText,
  triangleHash,
} from './_capacity.js';

const SECTIONS = ['time', 'cost', 'scope'];
const NUMERIC_FIELDS = new Set([
  'time.sprintWeeks', 'time.sprintCount', 'time.hoursPerWeek',
  'cost.teamFTE', 'cost.contractorBudget',
  'scope.mustHaveCount', 'scope.shouldHaveCount',
]);

class IronTriangle extends VBElement {
  static formAssociated = true;
  static get observedAttributes() {
    return ['data-focus-factor', 'data-min-capacity', 'disabled', 'locked'];
  }

  /** @type {ElementInternals} */
  #internals;
  /** @type {{ time: object, cost: object, scope: object, capacityPoints: number, capacitySource: 'formula' | 'manual', hash: string }} */
  #value = {
    time: {}, cost: {}, scope: {},
    capacityPoints: 0,
    capacitySource: 'formula',
    hash: '',
  };
  /** @type {number | null} */
  #manualPoints = null;
  /** @type {Array<{revisedAt: string, changes: Array<{field: string, from: any, to: any, reason: string}>}>} */
  #revisionLog = [];

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this._adoptInternals(this.#internals);
  }

  setup() {
    this.#ensureModeRow();
    this.#readAllInputs();
    this.#recompute({ source: 'init' });

    this.listen(this, 'input',  (e) => this.#onInput(e));
    this.listen(this, 'change', (e) => this.#onInput(e));
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'data-focus-factor' || name === 'data-min-capacity') {
      this.#recompute({ source: 'attribute' });
    }
    if (name === 'disabled' || name === 'locked') {
      this.#syncDisabledLocked();
    }
  }

  // ── Public API ────────────────────────────────────────────────────

  /** Snapshot of the current triangle value (read-only copy). */
  get value() {
    return JSON.parse(JSON.stringify({ ...this.#value, revisionLog: this.#revisionLog }));
  }

  get capacityPoints()  { return this.#value.capacityPoints; }
  get capacitySource()  { return this.#value.capacitySource; }
  get hash()            { return this.#value.hash; }
  get revisionLog()     { return JSON.parse(JSON.stringify(this.#revisionLog)); }

  /**
   * Apply a single revision. `field` is a dotted path (e.g. "cost.teamFTE")
   * or "capacityPoints". `reason` must be ≥ 10 chars (matches schema).
   */
  revise(field, newValue, reason) {
    if (!field || typeof reason !== 'string' || reason.length < 10) {
      throw new Error('iron-triangle: revise() requires field and a reason of at least 10 characters');
    }
    const from = this.#getField(field);
    this.#setField(field, newValue);
    const change = { field, from, to: newValue, reason };
    this.#revisionLog.push({
      revisedAt: new Date().toISOString(),
      changes: [change],
    });
    this.dispatchEvent(new CustomEvent('iron-triangle:revise', {
      bubbles: true, composed: true, detail: change,
    }));
    this.#recompute({ source: 'revise' });
  }

  /** Switch to manual capacity mode with a fixed integer value. */
  setManual(integer) {
    const n = Math.max(1, Math.floor(Number(integer) || 0));
    this.#manualPoints = n;
    const previous = this.#value.capacitySource;
    this.#value.capacitySource = 'manual';
    if (previous !== 'manual') {
      this.dispatchEvent(new CustomEvent('iron-triangle:mode', {
        bubbles: true, composed: true, detail: { from: previous, to: 'manual' },
      }));
    }
    this.setState('manual', true);
    this.setState('formula', false);
    this.#recompute({ source: 'manual' });
  }

  /** Switch back to formula mode. (Custom formula strings are out of scope v1.) */
  setFormula(/* formulaString */) {
    this.#manualPoints = null;
    const previous = this.#value.capacitySource;
    this.#value.capacitySource = 'formula';
    if (previous !== 'formula') {
      this.dispatchEvent(new CustomEvent('iron-triangle:mode', {
        bubbles: true, composed: true, detail: { from: previous, to: 'formula' },
      }));
    }
    this.setState('manual', false);
    this.setState('formula', true);
    this.#recompute({ source: 'formula' });
  }

  /** Recompute capacity and re-emit; useful after externally mutating inputs. */
  recalc() {
    this.#readAllInputs();
    this.#recompute({ source: 'recalc' });
  }

  // ── Internal: input wiring ────────────────────────────────────────

  #onInput(event) {
    const target = /** @type {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} */ (event.target);
    if (!target) return;
    if (target.matches?.('[data-iron-triangle-manual-input]')) {
      this.setManual(target.value);
      return;
    }
    if (!target.name || !this.#hasOwnedField(target.name)) return;
    this.#captureField(target);
    this.#recompute({ source: 'input', field: target.name });
  }

  #hasOwnedField(name) {
    return SECTIONS.some(section => name.startsWith(`${section}.`));
  }

  #captureField(input) {
    const [section, key] = input.name.split('.');
    if (!section || !key) return;
    if (!this.#value[section]) this.#value[section] = {};
    const raw = input.value;
    // Empty string means "not set"; drop the key so the snapshot
    // doesn't carry empties that downstream JSON-Schema validators
    // (rightly) reject for typed fields like number/integer/date.
    if (input.type !== 'checkbox' && (raw === '' || raw == null)) {
      delete this.#value[section][key];
      return;
    }
    let value;
    if (input.type === 'checkbox') {
      value = input.checked;
    } else if (NUMERIC_FIELDS.has(input.name)) {
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        delete this.#value[section][key];
        return;
      }
      value = n;
    } else {
      value = raw;
    }
    this.#value[section][key] = value;
  }

  #readAllInputs() {
    for (const section of SECTIONS) this.#value[section] = {};
    const inputs = this.querySelectorAll('input[name], select[name], textarea[name]');
    for (const input of inputs) {
      if (input.matches('[data-iron-triangle-manual-input]')) continue;
      if (this.#hasOwnedField(input.name)) this.#captureField(input);
    }
  }

  // ── Internal: capacity ────────────────────────────────────────────

  #recompute({ source, field } = {}) {
    const focusFactor = Number(this.dataset.focusFactor ?? 0.6);
    const minCapacity = Number(this.dataset.minCapacity ?? 1);

    let points;
    let formulaText;
    if (this.#value.capacitySource === 'manual' && this.#manualPoints != null) {
      points = this.#manualPoints;
      formulaText = `Manual capacity: ${points} points`;
    } else {
      points = defaultFormula(this.#value.time, this.#value.cost, focusFactor);
      formulaText = defaultFormulaText(this.#value.time, this.#value.cost, focusFactor);
    }

    if (Number.isFinite(minCapacity) && points > 0 && points < minCapacity) {
      points = minCapacity;
    }

    this.#value.capacityPoints = points;
    this.#value.hash = triangleHash(this.#value);

    this.#renderReadout(points, formulaText);
    this.#syncStateFlags();
    this.#publishFormValue();

    this.dispatchEvent(new CustomEvent('iron-triangle:change', {
      bubbles: true, composed: true,
      detail: { ...this.value, source, field },
    }));
  }

  #renderReadout(points, formulaText) {
    const out = this.querySelector('output[name="capacityPoints"]');
    if (out) out.textContent = points > 0 ? String(points) : '—';
    const small = this.querySelector('small[name="capacityFormula"]');
    if (small) small.textContent = formulaText;
    this.dataset.capacityPoints = String(points);
    this.dataset.capacitySource = this.#value.capacitySource;
  }

  #syncStateFlags() {
    this.setState('formula', this.#value.capacitySource === 'formula');
    this.setState('manual',  this.#value.capacitySource === 'manual');
    this.setState('unbudgeted', !(this.#value.capacityPoints > 0));

    const deadline = this.#value.time?.deadline;
    let overDeadline = false;
    if (deadline) {
      const target = new Date(deadline).getTime();
      if (Number.isFinite(target)) overDeadline = target < Date.now();
    }
    this.setState('over-deadline', overDeadline);
  }

  #publishFormValue() {
    try {
      this.#internals.setFormValue(JSON.stringify(this.value));
    } catch {
      // Older Safari may not support JSON-string form values; ignore.
    }
  }

  // ── Internal: mode toggle UI ──────────────────────────────────────

  #ensureModeRow() {
    if (this.querySelector('.iron-triangle-mode-row')) return;
    const capacityField = this.querySelector('fieldset[name="capacity"]');
    if (!capacityField) return;

    const row = document.createElement('div');
    row.className = 'iron-triangle-mode-row';
    row.innerHTML = `
      <button type="button" class="iron-triangle-mode-toggle" aria-pressed="false"
              data-iron-triangle-mode-toggle>Use manual capacity</button>
      <label class="iron-triangle-manual-input">
        <span>Manual points</span>
        <input type="number" min="1" step="1" data-iron-triangle-manual-input>
      </label>
    `;
    capacityField.append(row);

    const button = row.querySelector('[data-iron-triangle-mode-toggle]');
    this.listen(button, 'click', () => {
      const next = this.#value.capacitySource === 'manual' ? 'formula' : 'manual';
      if (next === 'manual') {
        const input = row.querySelector('[data-iron-triangle-manual-input]');
        const seed = Math.max(1, this.#value.capacityPoints || 1);
        input.value = String(seed);
        this.setManual(seed);
        button.setAttribute('aria-pressed', 'true');
      } else {
        this.setFormula();
        button.setAttribute('aria-pressed', 'false');
      }
    });

    this.setState('formula', true);
  }

  #syncDisabledLocked() {
    const off = this.hasAttribute('disabled') || this.hasAttribute('locked');
    for (const el of this.querySelectorAll('input, select, textarea, button')) {
      el.disabled = off;
    }
  }

  // ── Internal: field accessors for revise() ───────────────────────

  #getField(path) {
    if (path === 'capacityPoints') return this.#value.capacityPoints;
    const [section, key] = path.split('.');
    return section && key ? this.#value[section]?.[key] : undefined;
  }

  #setField(path, value) {
    if (path === 'capacityPoints') {
      this.setManual(value);
      return;
    }
    const [section, key] = path.split('.');
    if (!section || !key) return;
    if (!this.#value[section]) this.#value[section] = {};
    this.#value[section][key] = value;
    const input = this.querySelector(`[name="${CSS.escape(path)}"]`);
    if (input) input.value = value ?? '';
  }
}

registerComponent('iron-triangle', IronTriangle);

export { IronTriangle };
