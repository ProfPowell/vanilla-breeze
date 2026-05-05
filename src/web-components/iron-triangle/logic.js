/**
 * <iron-triangle> — Project-shape constraint surface with deformable
 * SVG visualization.
 *
 * Light-DOM, form-associated. Reads named inputs the author writes
 * (matching VB conventions: <fieldset> + <form-field> + <label>/<input>),
 * computes capacityPoints from the default formula
 *   ceil(sprintWeeks × sprintCount × teamFTE × focusFactor)
 * and renders an inline <svg> triangle into a `[data-iron-triangle-viz]`
 * child whose vertices stretch from the centroid based on each
 * constraint's relative magnitude. Capacity number anchors at the
 * centroid; the triangle itself communicates project shape balance.
 *
 * Authoring shape — see static.html. The component owns no chrome it
 * doesn't have to: layout comes from data-layout, controls come from
 * <form-field>, sections come from <fieldset>. The component only:
 *   - Reads input values by `name="time.*"` / `cost.*"` / `scope.*"`
 *   - Computes capacity + the JSON snapshot (form-associated value)
 *   - Renders the SVG into [data-iron-triangle-viz] (site-map-wc pattern)
 *   - Emits iron-triangle:change / :revise / :mode
 *
 * See spec.md for the full API surface.
 */

import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import {
  defaultFormula,
  defaultFormulaText,
  triangleHash,
} from './_capacity.js';
import {
  triangleVertices,
  buildTriangleSvg,
} from './_triangle-geometry.js';

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
    this.#readAllInputs();
    this.#syncManualVisibilityFromMarkup();
    this.#recompute({ source: 'init' });

    this.listen(this, 'input',  (e) => this.#onInput(e));
    this.listen(this, 'change', (e) => this.#onInput(e));
    this.listen(this, 'click',  (e) => this.#onClick(e));
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

  get value() {
    return JSON.parse(JSON.stringify({ ...this.#value, revisionLog: this.#revisionLog }));
  }
  get capacityPoints()  { return this.#value.capacityPoints; }
  get capacitySource()  { return this.#value.capacitySource; }
  get hash()            { return this.#value.hash; }
  get revisionLog()     { return JSON.parse(JSON.stringify(this.#revisionLog)); }

  revise(field, newValue, reason) {
    if (!field || typeof reason !== 'string' || reason.length < 10) {
      throw new Error('iron-triangle: revise() requires field and a reason of at least 10 characters');
    }
    const from = this.#getField(field);
    this.#setField(field, newValue);
    const change = { field, from, to: newValue, reason };
    this.#revisionLog.push({ revisedAt: new Date().toISOString(), changes: [change] });
    this.dispatchEvent(new CustomEvent('iron-triangle:revise', {
      bubbles: true, composed: true, detail: change,
    }));
    this.#recompute({ source: 'revise' });
  }

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
    this.#syncModeUi();
    this.#recompute({ source: 'manual' });
  }

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
    this.#syncModeUi();
    this.#recompute({ source: 'formula' });
  }

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

  #onClick(event) {
    const toggle = event.target.closest?.('[data-iron-triangle-mode-toggle]');
    if (!toggle || !this.contains(toggle)) return;
    event.preventDefault();
    if (this.#value.capacitySource === 'manual') {
      this.setFormula();
    } else {
      const seed = Math.max(1, this.#value.capacityPoints || 1);
      const input = this.querySelector('[data-iron-triangle-manual-input]');
      if (input) input.value = String(seed);
      this.setManual(seed);
    }
  }

  #hasOwnedField(name) {
    return SECTIONS.some(section => name.startsWith(`${section}.`));
  }

  #captureField(input) {
    const [section, key] = input.name.split('.');
    if (!section || !key) return;
    if (!this.#value[section]) this.#value[section] = {};
    const raw = input.value;
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

  #syncManualVisibilityFromMarkup() {
    // The author's static markup may flip the toggle button's pressed
    // state for read-only / locked review pages. Honor it.
    const toggle = this.querySelector('[data-iron-triangle-mode-toggle]');
    if (toggle?.getAttribute('aria-pressed') === 'true') {
      const seed = Number(this.querySelector('[data-iron-triangle-manual-input]')?.value) || 1;
      this.setManual(seed);
    } else {
      this.setState('formula', true);
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

    this.#renderViz();
    this.#renderReadoutFallback(points, formulaText);
    this.#syncStateFlags();
    this.#publishFormValue();

    this.dispatchEvent(new CustomEvent('iron-triangle:change', {
      bubbles: true, composed: true,
      detail: { ...this.value, source, field },
    }));
  }

  #renderViz() {
    const host = this.querySelector('[data-iron-triangle-viz]');
    if (!host) return;
    const vertices = triangleVertices(this.#value);
    const svg = buildTriangleSvg({
      vertices,
      capacityPoints: this.#value.capacityPoints,
      capacitySource: this.#value.capacitySource,
    });
    const existing = host.querySelector('svg');
    if (existing) existing.replaceWith(svg);
    else host.prepend(svg);
  }

  #renderReadoutFallback(points, formulaText) {
    // The <output>/<small> in the figcaption are pre-upgrade fallbacks
    // and screen-reader anchors. Keep them in sync with the visual.
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

  #syncModeUi() {
    const toggle = this.querySelector('[data-iron-triangle-mode-toggle]');
    const field = this.querySelector('[data-iron-triangle-manual-input-field]');
    const isManual = this.#value.capacitySource === 'manual';
    if (toggle) toggle.setAttribute('aria-pressed', String(isManual));
    if (field) {
      if (isManual) field.removeAttribute('hidden');
      else field.setAttribute('hidden', '');
    }
  }

  #publishFormValue() {
    try {
      this.#internals.setFormValue(JSON.stringify(this.value));
    } catch {
      // Older Safari may not support JSON-string form values; ignore.
    }
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
