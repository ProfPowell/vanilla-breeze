/**
 * <quality-target> — Polygon-as-UI quality prioritization surface.
 *
 * One component, two roles. The radar polygon IS the picker: each
 * axis is a clickable hit-target that opens a per-ility <dialog>
 * editor (level radio group + rationale textarea). The same SVG
 * also visualizes the chosen vector against the project's capacity
 * envelope (read from a paired <iron-triangle> via data-bind-to or
 * supplied via data-capacity-points).
 *
 * Replaces both <nfr-compass> and <nfr-radar> from earlier rounds.
 *
 * Authoring shape — minimal:
 *
 *   <iron-triangle id="shape" data-quality-href="#quality"></iron-triangle>
 *   <quality-target id="quality" name="quality"
 *                   data-bind-to="shape"></quality-target>
 *
 * Form-associated; serializes the same vector schema (validated by
 * uucd-core's validateQualityVector). Over-budget reveals an inline
 * rationale field in the component footer; checkValidity() returns
 * false until that rationale meets the min-length.
 */

import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import {
  DEFAULT_ILITIES,
  LEVELS,
  LEVEL_LABELS,
  ilityLabel,
  mergeCostWeights,
  criticalSum,
  parseJsonAttr,
  validateVector,
  canSaveAxis,
  buildTargetSvg,
} from './_quality-utils.js';

class QualityTarget extends VBElement {
  static formAssociated = true;
  static get observedAttributes() {
    return [
      'data-bind-to', 'data-capacity-points', 'data-cost-weights',
      'data-radius', 'data-show-envelope',
      'data-min-rationale', 'data-max-rationale',
      'data-min-overrun-rationale', 'data-max-overrun-rationale',
      'disabled', 'locked',
    ];
  }

  /** @type {ElementInternals} */
  #internals;
  /** @type {string[]} */
  #ilities = [...DEFAULT_ILITIES];
  /** @type {Record<string, string>} */
  #vector = {};
  /** @type {Record<string, string>} */
  #rationales = {};
  /** @type {Readonly<Record<string, number>>} */
  #costWeights = mergeCostWeights(DEFAULT_ILITIES);
  /** @type {string} */
  #overrunRationale = '';
  /** @type {boolean} */
  #wasOver = false;
  /** @type {(() => void) | null} */
  #unbindTriangle = null;
  /** @type {number | null} */
  #capacityPropOverride = null;
  /** @type {Record<string, HTMLDialogElement>} */
  #dialogs = {};
  /** @type {HTMLElement | null} */
  #footer = null;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this._adoptInternals(this.#internals);
  }

  setup() {
    this.#refreshCostWeights();
    this.#bindToTriangle();
    this.#renderViz();
    this.#ensureFooter();

    this.listen(this, 'click', (e) => this.#onClick(e));
    this.listen(this, 'keydown', (e) => this.#onKeydown(e));
    this.listen(this, 'input', (e) => this.#onFooterInput(e));
  }

  teardown() {
    this.#unbindTriangle?.();
    this.#unbindTriangle = null;
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'data-bind-to') {
      this.#bindToTriangle();
      this.#renderViz();
    } else if (name === 'data-capacity-points') {
      this.#renderViz();
    } else if (name === 'data-cost-weights') {
      this.#refreshCostWeights();
      this.#renderViz();
    } else if (name === 'data-radius' || name === 'data-show-envelope') {
      this.#renderViz();
    } else if (name === 'disabled' || name === 'locked') {
      this.#syncDisabledLocked();
    }
  }

  // ── Public API ────────────────────────────────────────────────────

  get vector()           { return { ...this.#vector }; }
  set vector(next)       { this.#applyVector(next); this.#publish('property'); }
  get rationales()       { return { ...this.#rationales }; }
  set rationales(next)   { this.#applyRationales(next); this.#publish('property'); }
  get costWeights()      { return { ...this.#costWeights }; }
  get capacityPoints()   { return this.#resolveCapacity(); }
  set capacityPoints(n)  { this.#capacityPropOverride = Number.isFinite(+n) ? +n : null; this.#publish('property'); }
  get criticalSum()      { return criticalSum(this.#vector, this.#costWeights); }
  get overBudget()       { const cap = this.#resolveCapacity(); return Number.isFinite(cap) && this.criticalSum > cap; }
  get overrunRationale() { return this.#overrunRationale; }
  set overrunRationale(s) {
    this.#overrunRationale = String(s ?? '');
    const ta = this.querySelector('[data-quality-overrun] textarea');
    if (ta) ta.value = this.#overrunRationale;
    this.#publishFormValue();
  }

  get ilities() { return [...this.#ilities]; }
  set ilities(next) {
    if (!Array.isArray(next) || next.length === 0) return;
    this.#ilities = [...next];
    this.#refreshCostWeights();
    this.#publish('property');
  }

  get value() {
    return {
      vector: { ...this.#vector },
      rationales: { ...this.#rationales },
      costWeights: { ...this.#costWeights },
      capacityPoints: this.#resolveCapacityForSerialize(),
      capacitySource: this.#capacitySourceLabel(),
      criticalSum: this.criticalSum,
      overrunRationale: this.#overrunRationale || undefined,
      ironTriangleHash: this.#readTriangleHash(),
    };
  }

  /** Imperatively open one axis's editor. */
  openEditor(ility) {
    if (!this.#ilities.includes(ility)) return;
    const dialog = this.#ensureDialog(ility);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  checkValidity() {
    const { valid, errors } = validateVector({
      vector: this.#vector,
      rationales: this.#rationales,
      costWeights: this.#costWeights,
      capacityPoints: this.#resolveCapacity(),
      overrunRationale: this.#overrunRationale,
      minRationale: this.#minRationale(),
      minOverrunRationale: this.#minOverrunRationale(),
    });
    this.setState('missing-rationale', !valid);
    const errBox = this.querySelector('[data-quality-errors]');
    if (errBox) errBox.textContent = errors.join(' ');
    return valid;
  }

  // ── Internal: SVG hit-target click + keyboard ────────────────────

  #onClick(event) {
    const axis = event.target.closest?.('.axis[data-ility]');
    if (axis && this.contains(axis)) {
      event.preventDefault();
      this.openEditor(axis.dataset.ility);
    }
  }

  #onKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const axis = event.target.closest?.('.axis[data-ility]');
    if (axis && this.contains(axis)) {
      event.preventDefault();
      this.openEditor(axis.dataset.ility);
    }
  }

  #onFooterInput(event) {
    const target = event.target;
    if (target?.matches?.('[data-quality-overrun] textarea')) {
      this.#overrunRationale = target.value;
      this.checkValidity();
      this.#publishFormValue();
    }
  }

  // ── Internal: per-axis dialog ────────────────────────────────────

  #ensureDialog(ility) {
    if (this.#dialogs[ility]) {
      this.#syncDialogFromState(ility);
      return this.#dialogs[ility];
    }
    const dialog = document.createElement('dialog');
    dialog.className = `quality-dialog quality-dialog--${ility}`;
    dialog.setAttribute('aria-label', `${ilityLabel(ility)} — edit priority`);

    const form = document.createElement('form');
    form.method = 'dialog';
    form.setAttribute('data-layout', 'stack');
    form.setAttribute('data-layout-gap', 'm');

    const heading = document.createElement('h3');
    heading.textContent = ilityLabel(ility);
    form.append(heading);

    // Level radio group (one fieldset).
    const fs = document.createElement('fieldset');
    fs.setAttribute('data-layout', 'stack');
    fs.setAttribute('data-layout-gap', '2xs');
    const lg = document.createElement('legend');
    lg.textContent = 'Priority';
    fs.append(lg);
    for (const level of LEVELS) {
      const lbl = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'level';
      input.value = level;
      lbl.append(input, document.createTextNode(' ' + LEVEL_LABELS[level]));
      fs.append(lbl);
    }
    form.append(fs);

    // Rationale form-field (required when Critical).
    const ff = document.createElement('form-field');
    const rl = document.createElement('label');
    rl.setAttribute('for', `quality-${ility}-rationale`);
    rl.textContent = 'Rationale (required when Critical)';
    const ta = document.createElement('textarea');
    ta.id = `quality-${ility}-rationale`;
    ta.name = 'rationale';
    ta.rows = 3;
    ta.minLength = this.#minRationale();
    ta.maxLength = this.#maxRationale();
    ta.placeholder = `Why ≥ ${this.#minRationale()} chars`;
    ff.append(rl, ta);
    form.append(ff);

    // Inline error spot.
    const err = document.createElement('p');
    err.className = 'message message-error';
    err.dataset.dialogError = '';
    err.hidden = true;
    form.append(err);

    // Actions.
    const actions = document.createElement('div');
    actions.setAttribute('data-layout', 'cluster');
    actions.setAttribute('data-layout-gap', 's');
    actions.setAttribute('data-layout-justify', 'end');
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => dialog.close('cancel'));
    const save = document.createElement('button');
    save.type = 'submit';
    save.textContent = 'Save';
    actions.append(cancel, save);
    form.append(actions);

    dialog.append(form);
    this.append(dialog);
    this.#dialogs[ility] = dialog;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const level = form.querySelector('input[name="level"]:checked')?.value;
      const rationale = form.querySelector('textarea[name="rationale"]').value;
      const result = canSaveAxis({ level, rationale, minRationale: this.#minRationale() });
      if (!result.ok) {
        err.hidden = false;
        err.textContent = result.reason === 'pick-level'
          ? 'Pick a priority level.'
          : `Rationale must be at least ${this.#minRationale()} characters.`;
        return;
      }
      this.#vector[ility] = level;
      if (level === 'critical') this.#rationales[ility] = rationale.trim();
      else delete this.#rationales[ility];
      dialog.close('save');
      this.#publish('dialog', ility);
    });

    this.#syncDialogFromState(ility);
    return dialog;
  }

  #syncDialogFromState(ility) {
    const dialog = this.#dialogs[ility];
    if (!dialog) return;
    const level = this.#vector[ility];
    for (const radio of dialog.querySelectorAll('input[name="level"]')) {
      radio.checked = (radio.value === level);
    }
    const ta = dialog.querySelector('textarea[name="rationale"]');
    if (ta) ta.value = this.#rationales[ility] || '';
    const err = dialog.querySelector('[data-dialog-error]');
    if (err) { err.hidden = true; err.textContent = ''; }
  }

  // ── Internal: footer (capacity + overrun rationale) ──────────────

  #ensureFooter() {
    if (this.#footer) return;
    const footer = document.createElement('section');
    footer.className = 'quality-footer';
    footer.dataset.qualityFooter = '';
    footer.setAttribute('data-layout', 'stack');
    footer.setAttribute('data-layout-gap', 's');

    const overrun = document.createElement('section');
    overrun.dataset.qualityOverrun = '';
    overrun.hidden = true;
    overrun.innerHTML = `
      <strong>Over budget — explain why.</strong>
      <small data-overrun-prompt></small>
      <form-field>
        <label for="quality-overrun">Overrun rationale (≥ ${this.#minOverrunRationale()} chars)</label>
        <textarea id="quality-overrun" name="overrunRationale"
                  minlength="${this.#minOverrunRationale()}"
                  maxlength="${this.#maxOverrunRationale()}"
                  rows="3"></textarea>
      </form-field>
    `;
    footer.append(overrun);

    const errors = document.createElement('p');
    errors.dataset.qualityErrors = '';
    errors.className = 'message message-error';
    errors.setAttribute('role', 'alert');
    footer.append(errors);

    this.append(footer);
    this.#footer = footer;
  }

  #updateFooter() {
    if (!this.#footer) return;
    const cap = this.#resolveCapacity();
    const sum = this.criticalSum;
    const isOver = Number.isFinite(cap) && sum > cap;
    const overrun = this.#footer.querySelector('[data-quality-overrun]');
    if (overrun) {
      overrun.hidden = !isOver;
      const prompt = overrun.querySelector('[data-overrun-prompt]');
      if (prompt && Number.isFinite(cap)) {
        prompt.textContent = `You're over budget by ${sum - cap} points (${sum}/${cap}).`;
      }
    }
  }

  // ── Internal: ility / weight wiring ──────────────────────────────

  #refreshCostWeights() {
    const overrides = parseJsonAttr(this.getAttribute('data-cost-weights') || '');
    this.#costWeights = mergeCostWeights(this.#ilities, overrides);
  }

  // ── Internal: vector / rationale setters ─────────────────────────

  #applyVector(next) {
    if (!next || typeof next !== 'object') return;
    for (const [ility, level] of Object.entries(next)) {
      if (LEVELS.includes(level)) this.#vector[ility] = level;
    }
  }

  #applyRationales(next) {
    if (!next || typeof next !== 'object') return;
    for (const [ility, text] of Object.entries(next)) {
      this.#rationales[ility] = String(text ?? '');
    }
  }

  // ── Internal: capacity resolution ────────────────────────────────

  #resolveCapacity() {
    const triangle = this.#findTriangle();
    if (triangle && Number.isFinite(triangle.capacityPoints) && triangle.capacityPoints > 0) {
      return triangle.capacityPoints;
    }
    const attr = Number(this.getAttribute('data-capacity-points'));
    if (Number.isFinite(attr) && attr > 0) return attr;
    if (Number.isFinite(this.#capacityPropOverride) && this.#capacityPropOverride > 0) {
      return this.#capacityPropOverride;
    }
    return Infinity;
  }

  #resolveCapacityForSerialize() {
    const cap = this.#resolveCapacity();
    return Number.isFinite(cap) ? cap : null;
  }

  #capacitySourceLabel() {
    const triangle = this.#findTriangle();
    if (triangle?.capacitySource === 'manual') return 'manual';
    if (triangle) return 'formula';
    if (this.getAttribute('data-capacity-points')) return 'manual';
    return 'manual';
  }

  #findTriangle() {
    const id = this.getAttribute('data-bind-to');
    if (!id) return null;
    const root = this.getRootNode();
    const found = root.getElementById ? root.getElementById(id) : document.getElementById(id);
    return found && found.localName === 'iron-triangle' ? found : null;
  }

  #readTriangleHash() {
    return this.#findTriangle()?.hash || null;
  }

  #bindToTriangle() {
    this.#unbindTriangle?.();
    this.#unbindTriangle = null;
    const triangle = this.#findTriangle();
    if (!triangle) return;
    const handler = () => this.#publish('iron-triangle');
    triangle.addEventListener('iron-triangle:change', handler);
    this.#unbindTriangle = () => triangle.removeEventListener('iron-triangle:change', handler);
  }

  // ── Internal: render + publish cycle ─────────────────────────────

  #renderViz() {
    const radius = clamp(Number(this.dataset.radius ?? 100), 30, 400);
    const showEnvelope = !this.dataset.showEnvelope || this.dataset.showEnvelope !== 'false';
    const cap = this.#resolveCapacity();
    const svg = buildTargetSvg({
      ilities: this.#ilities,
      vector: this.#vector,
      rationales: this.#rationales,
      costWeights: this.#costWeights,
      capacityPoints: cap,
      radius,
      showEnvelope,
    });
    const existing = this.querySelector(':scope > svg');
    if (existing) existing.replaceWith(svg);
    else this.prepend(svg);
  }

  #publish(source, field) {
    this.#renderViz();
    this.#updateFooter();
    const cap = this.#resolveCapacity();
    const sum = this.criticalSum;
    const isOver = Number.isFinite(cap) && sum > cap;
    this.setState('over-budget', isOver);
    this.#publishFormValue();

    if (isOver !== this.#wasOver) {
      const evt = isOver ? 'quality-target:over-budget' : 'quality-target:under-budget';
      const detail = isOver
        ? { delta: sum - cap, criticalSum: sum, capacityPoints: cap }
        : { slack: cap - sum, criticalSum: sum, capacityPoints: cap };
      this.dispatchEvent(new CustomEvent(evt, { bubbles: true, composed: true, detail }));
      this.#wasOver = isOver;
    }
    this.dispatchEvent(new CustomEvent('quality-target:change', {
      bubbles: true, composed: true,
      detail: { ...this.value, source, field },
    }));
  }

  #publishFormValue() {
    try {
      this.#internals.setFormValue(JSON.stringify(this.value));
    } catch { /* older Safari */ }
  }

  #syncDisabledLocked() {
    const off = this.hasAttribute('disabled') || this.hasAttribute('locked');
    for (const dialog of Object.values(this.#dialogs)) {
      for (const el of dialog.querySelectorAll('input, textarea, select, button')) el.disabled = off;
    }
  }

  // ── Internal: config readers ──────────────────────────────────────

  #minRationale()        { return Math.max(0, parseInt(this.dataset.minRationale ?? '10', 10) || 10); }
  #maxRationale()        { return Math.max(10, parseInt(this.dataset.maxRationale ?? '200', 10) || 200); }
  #minOverrunRationale() { return Math.max(0, parseInt(this.dataset.minOverrunRationale ?? '10', 10) || 10); }
  #maxOverrunRationale() { return Math.max(10, parseInt(this.dataset.maxOverrunRationale ?? '400', 10) || 400); }
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

registerComponent('quality-target', QualityTarget);

export { QualityTarget };
