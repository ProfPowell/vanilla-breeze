/**
 * <iron-triangle> — Triangle-as-UI project-shape constraint surface.
 *
 * The triangle IS the interface. Three vertex hit-targets (Scope / Time
 * / Cost) open native <dialog> editors on click; the center "Quality"
 * target fires `iron-triangle:open-quality` and falls back to
 * `data-quality-href` navigation when present. Hover surfaces the
 * current value via native <title> tooltips.
 *
 * Authoring shape — minimal:
 *
 *   <iron-triangle name="triangle" data-quality-href="/requirements">
 *   </iron-triangle>
 *
 * The component generates the SVG and the per-vertex dialogs. No form
 * markup needed in the host page. The component is form-associated;
 * the value serializes as JSON via setFormValue().
 *
 * Optional: pass a `data-quality-summary` attribute or set the
 * `qualitySummary` property to surface the bound NFR compass's
 * decision on hover (e.g. "3 critical: perf, sec, a11y").
 */

import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import {
  defaultFormula,
  triangleHash,
} from './_capacity.js';
import {
  triangleVertices,
  buildTriangleSvg,
} from './_triangle-geometry.js';

const SECTIONS = ['time', 'cost', 'scope'];

const FIELD_DEFS = {
  time: [
    { key: 'sprintWeeks',  label: 'Sprint length (weeks)', type: 'number', min: 1,  step: 1, value: 2,  width: '6rem' },
    { key: 'sprintCount',  label: 'Number of sprints',     type: 'number', min: 1,  step: 1, value: 3,  width: '6rem' },
    { key: 'hoursPerWeek', label: 'Hours per week (per FTE)', type: 'number', min: 1, max: 168, step: 1, value: 40, width: '6rem' },
    { key: 'deadline',     label: 'Deadline (optional)',   type: 'date',                     width: '12rem' },
  ],
  cost: [
    { key: 'teamFTE',         label: 'Team size (FTE)',        type: 'number', min: 0, step: 0.5, value: 1, width: '6rem' },
    { key: 'budgetTier',      label: 'Budget tier',            type: 'select', options: [
      ['solo',   'Solo'],
      ['small',  'Small (2-5)'],
      ['medium', 'Medium (6-15)'],
      ['large',  'Large (16+)'],
    ], value: 'solo', width: '14rem' },
    { key: 'contractorBudget', label: 'Contractor budget ($, optional)', type: 'number', min: 0, step: 100, width: '10rem' },
  ],
  scope: [
    { key: 'mustHaveCount',   label: 'Must-have feature count',  type: 'number', min: 0, step: 1, width: '6rem' },
    { key: 'shouldHaveCount', label: 'Should-have feature count', type: 'number', min: 0, step: 1, width: '6rem' },
    { key: 'scopeNotes',      label: 'Notes',                     type: 'textarea', rows: 3, maxlength: 2000 },
  ],
};

const SECTION_TITLES = {
  scope: 'Scope',
  time:  'Time',
  cost:  'Cost',
};

class IronTriangle extends VBElement {
  static formAssociated = true;
  static get observedAttributes() {
    return [
      'data-focus-factor', 'data-min-capacity',
      'data-quality-href', 'data-quality-summary',
      'disabled', 'locked',
    ];
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
  #revisionLog = [];
  #qualitySummary = '';
  /** @type {Record<string, HTMLDialogElement>} */
  #dialogs = {};

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this._adoptInternals(this.#internals);
  }

  setup() {
    // Prefer an explicit attribute over an empty default.
    this.#qualitySummary = this.getAttribute('data-quality-summary') || '';
    // Seed initial value from FIELD_DEFS so the formula has something to chew on.
    this.#seedDefaults();
    this.#renderViz();

    this.listen(this, 'click', (e) => this.#onClick(e));
    this.listen(this, 'keydown', (e) => this.#onKeydown(e));
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'data-focus-factor' || name === 'data-min-capacity') {
      this.#recompute({ source: 'attribute' });
    } else if (name === 'data-quality-summary') {
      this.#qualitySummary = this.getAttribute('data-quality-summary') || '';
      this.#renderViz();
    } else if (name === 'disabled' || name === 'locked') {
      this.#syncDisabledLocked();
    }
  }

  // ── Public API ────────────────────────────────────────────────────

  get value() {
    return JSON.parse(JSON.stringify({ ...this.#value, revisionLog: this.#revisionLog }));
  }
  set value(next) {
    if (!next || typeof next !== 'object') return;
    for (const section of SECTIONS) {
      if (next[section] && typeof next[section] === 'object') {
        this.#value[section] = { ...next[section] };
      }
    }
    if (next.capacitySource === 'manual' && Number.isFinite(next.capacityPoints)) {
      this.#manualPoints = next.capacityPoints;
      this.#value.capacitySource = 'manual';
    } else {
      this.#manualPoints = null;
      this.#value.capacitySource = 'formula';
    }
    if (Array.isArray(next.revisionLog)) this.#revisionLog = [...next.revisionLog];
    this.#syncDialogInputs();
    this.#recompute({ source: 'property' });
  }

  get capacityPoints() { return this.#value.capacityPoints; }
  get capacitySource() { return this.#value.capacitySource; }
  get hash()           { return this.#value.hash; }
  get revisionLog()    { return JSON.parse(JSON.stringify(this.#revisionLog)); }

  get qualitySummary() { return this.#qualitySummary; }
  set qualitySummary(s) {
    this.#qualitySummary = String(s ?? '');
    this.#renderViz();
  }

  /** Imperatively open a vertex editor. */
  openEditor(axis) {
    if (!SECTIONS.includes(axis)) return;
    const dialog = this.#ensureDialog(axis);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

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
    this.#syncDialogInputs();
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
    this.#recompute({ source: 'manual' });
  }

  setFormula() {
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

  recalc() { this.#recompute({ source: 'recalc' }); }

  // ── Internal: SVG hit-target click/keyboard ──────────────────────

  #onClick(event) {
    const vertex = event.target.closest?.('.vertex[data-axis]');
    if (vertex && this.contains(vertex)) {
      event.preventDefault();
      this.openEditor(vertex.dataset.axis);
      return;
    }
    const center = event.target.closest?.('.center[data-target="quality"]');
    if (center && this.contains(center)) {
      event.preventDefault();
      this.#fireQualityOpen();
    }
  }

  #onKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const vertex = event.target.closest?.('.vertex[data-axis]');
    if (vertex && this.contains(vertex)) {
      event.preventDefault();
      this.openEditor(vertex.dataset.axis);
      return;
    }
    const center = event.target.closest?.('.center[data-target="quality"]');
    if (center && this.contains(center)) {
      event.preventDefault();
      this.#fireQualityOpen();
    }
  }

  #fireQualityOpen() {
    const evt = new CustomEvent('iron-triangle:open-quality', {
      bubbles: true, composed: true, cancelable: true,
      detail: { qualitySummary: this.#qualitySummary, capacityPoints: this.#value.capacityPoints },
    });
    const allowDefault = this.dispatchEvent(evt);
    if (allowDefault) {
      const href = this.getAttribute('data-quality-href');
      if (href) window.location.assign(href);
    }
  }

  // ── Internal: dialogs ─────────────────────────────────────────────

  #ensureDialog(axis) {
    if (this.#dialogs[axis]) return this.#dialogs[axis];
    const dialog = document.createElement('dialog');
    dialog.className = `iron-triangle-dialog iron-triangle-dialog--${axis}`;
    dialog.setAttribute('aria-label', `${SECTION_TITLES[axis]} — edit`);

    const form = document.createElement('form');
    form.method = 'dialog';
    form.setAttribute('data-layout', 'stack');
    form.setAttribute('data-layout-gap', 'm');

    const heading = document.createElement('h3');
    heading.textContent = SECTION_TITLES[axis];
    form.append(heading);

    for (const def of FIELD_DEFS[axis]) {
      form.append(buildFormField(axis, def, this.#value[axis]?.[def.key]));
    }

    const actions = document.createElement('div');
    actions.setAttribute('data-layout', 'cluster');
    actions.setAttribute('data-layout-gap', 's');
    actions.setAttribute('data-layout-justify', 'end');
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.value = 'cancel';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => dialog.close('cancel'));
    const save = document.createElement('button');
    save.type = 'submit';
    save.value = 'save';
    save.textContent = 'Save';
    actions.append(cancel, save);
    form.append(actions);

    dialog.append(form);
    this.append(dialog);
    this.#dialogs[axis] = dialog;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.#captureDialog(axis, form);
      dialog.close('save');
      this.#recompute({ source: 'dialog', field: axis });
    });

    return dialog;
  }

  #captureDialog(axis, form) {
    const next = {};
    for (const def of FIELD_DEFS[axis]) {
      const input = form.querySelector(`[name="${axis}.${def.key}"]`);
      if (!input) continue;
      const raw = input.type === 'checkbox' ? input.checked : input.value;
      if (raw === '' || raw == null) continue;
      if (def.type === 'number') {
        const n = Number(raw);
        if (Number.isFinite(n)) next[def.key] = n;
      } else {
        next[def.key] = raw;
      }
    }
    this.#value[axis] = next;
  }

  #syncDialogInputs() {
    for (const axis of SECTIONS) {
      const dialog = this.#dialogs[axis];
      if (!dialog) continue;
      for (const def of FIELD_DEFS[axis]) {
        const input = /** @type {HTMLInputElement | null} */ (dialog.querySelector(`[name="${axis}.${def.key}"]`));
        if (!input) continue;
        const v = this.#value[axis]?.[def.key];
        input.value = v == null ? '' : String(v);
      }
    }
  }

  // ── Internal: capacity + viz ──────────────────────────────────────

  #seedDefaults() {
    for (const axis of SECTIONS) {
      for (const def of FIELD_DEFS[axis]) {
        if (def.value !== undefined && this.#value[axis][def.key] === undefined) {
          this.#value[axis][def.key] = def.value;
        }
      }
    }
    this.#recompute({ source: 'init' });
  }

  /** @param {{ source?: string, field?: string }} [options] */
  #recompute({ source, field } = {}) {
    const focusFactor = Number(this.dataset.focusFactor ?? 0.6);
    const minCapacity = Number(this.dataset.minCapacity ?? 1);

    let points;
    if (this.#value.capacitySource === 'manual' && this.#manualPoints != null) {
      points = this.#manualPoints;
    } else {
      points = defaultFormula(this.#value.time, this.#value.cost, focusFactor);
    }
    if (Number.isFinite(minCapacity) && points > 0 && points < minCapacity) {
      points = minCapacity;
    }
    this.#value.capacityPoints = points;
    this.#value.hash = triangleHash(this.#value);

    this.#renderViz();
    this.#syncStateFlags();
    this.#publishFormValue();

    this.dispatchEvent(new CustomEvent('iron-triangle:change', {
      bubbles: true, composed: true,
      detail: { ...this.value, source, field },
    }));
  }

  #renderViz() {
    const svg = buildTriangleSvg({
      value: this.#value,
      vertices: triangleVertices(this.#value),
      capacityPoints: this.#value.capacityPoints,
      capacitySource: this.#value.capacitySource,
      qualitySummary: this.#qualitySummary,
    });
    const existing = this.querySelector(':scope > svg');
    if (existing) existing.replaceWith(svg);
    else this.prepend(svg);
    this.dataset.capacityPoints = String(this.#value.capacityPoints);
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
    } catch { /* older Safari */ }
  }

  #syncDisabledLocked() {
    const off = this.hasAttribute('disabled') || this.hasAttribute('locked');
    for (const dialog of Object.values(this.#dialogs)) {
      for (const el of dialog.querySelectorAll('input, select, textarea, button')) /** @type {any} */ (el).disabled = off;
    }
  }

  // ── Internal: revise() field accessors ───────────────────────────

  #getField(path) {
    if (path === 'capacityPoints') return this.#value.capacityPoints;
    const [section, key] = path.split('.');
    return section && key ? this.#value[section]?.[key] : undefined;
  }
  #setField(path, value) {
    if (path === 'capacityPoints') { this.setManual(value); return; }
    const [section, key] = path.split('.');
    if (!section || !key) return;
    if (!this.#value[section]) this.#value[section] = {};
    this.#value[section][key] = value;
  }
}

// ── Module-level: build a <form-field> wrapper for one input def ──

function buildFormField(axis, def, currentValue) {
  const ff = document.createElement('form-field');
  const id = `${axis}-${def.key}`;
  const label = document.createElement('label');
  label.setAttribute('for', id);
  label.textContent = def.label;
  ff.append(label);

  let control;
  if (def.type === 'select') {
    control = document.createElement('select');
    for (const [val, text] of def.options) {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = text;
      if (currentValue === val || (currentValue == null && def.value === val)) opt.selected = true;
      control.append(opt);
    }
  } else if (def.type === 'textarea') {
    control = document.createElement('textarea');
    if (def.rows) control.rows = def.rows;
    if (def.maxlength) control.maxLength = def.maxlength;
    if (currentValue != null) control.value = String(currentValue);
  } else {
    control = document.createElement('input');
    control.type = def.type;
    if (def.min != null) control.min = String(def.min);
    if (def.max != null) control.max = String(def.max);
    if (def.step != null) control.step = String(def.step);
    if (currentValue != null) control.value = String(currentValue);
    else if (def.value != null) control.value = String(def.value);
  }
  control.id = id;
  control.name = `${axis}.${def.key}`;
  if (def.width) control.style.inlineSize = def.width;
  ff.append(control);
  return ff;
}

registerComponent('iron-triangle', IronTriangle);

export { IronTriangle };
