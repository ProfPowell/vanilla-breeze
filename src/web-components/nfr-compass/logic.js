/**
 * <nfr-compass> — 11-ility prioritization decision surface.
 *
 * Spends a numeric capacity budget supplied by a paired <iron-triangle>
 * (or by data-capacity-points, or by the capacityPoints property). Each
 * Critical pick costs points; sum > capacity reveals an overrunRationale
 * textarea; saving requires it. Each Critical also requires a per-row
 * rationale (default >=10 chars).
 *
 * Light DOM: the user's <fieldset>s live directly inside the element.
 * If the user supplies no fieldsets, the component injects the default
 * 11 ilities. The component reads native radios/textareas, computes
 * criticalSum live, manages the overrun textarea, and exposes the JSON
 * value to the surrounding form via ElementInternals.setFormValue().
 *
 * See spec.md for the full API surface.
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
} from './_nfr-utils.js';

class NfrCompass extends VBElement {
  static formAssociated = true;
  static get observedAttributes() {
    return [
      'data-bind-to', 'data-capacity-points', 'data-cost-weights',
      'data-min-rationale', 'data-max-rationale',
      'data-min-overrun-rationale', 'data-max-overrun-rationale',
      'disabled', 'locked',
    ];
  }

  /** @type {ElementInternals} */
  #internals;
  /** @type {Record<string, string>} */
  #vector = {};
  /** @type {Record<string, string>} */
  #rationales = {};
  /** @type {Readonly<Record<string, number>>} */
  #costWeights = mergeCostWeights(DEFAULT_ILITIES);
  /** @type {string} */
  #overrunRationale = '';
  /** @type {boolean} — last over-budget state, for edge-triggered events */
  #wasOver = false;
  /** @type {(() => void) | null} */
  #unbindTriangle = null;
  /** @type {boolean} — emit the no-capacity warning at most once */
  #warnedNoCapacity = false;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this._adoptInternals(this.#internals);
  }

  setup() {
    this.#ensureRows();
    this.#ensureHeader();
    this.#ensureOverrunBlock();
    this.#ensureErrorBlock();

    this.#readAllInputs();
    this.#refreshCostWeights();
    this.#bindToTriangle();
    this.#recompute({ source: 'init' });

    this.listen(this, 'change', (e) => this.#onInput(e));
    this.listen(this, 'input',  (e) => this.#onInput(e));
  }

  teardown() {
    this.#unbindTriangle?.();
    this.#unbindTriangle = null;
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'data-bind-to') {
      this.#bindToTriangle();
      this.#recompute({ source: 'attribute' });
    } else if (name === 'data-capacity-points') {
      this.#recompute({ source: 'attribute' });
    } else if (name === 'data-cost-weights') {
      this.#refreshCostWeights();
      this.#recompute({ source: 'attribute' });
    } else if (name === 'disabled' || name === 'locked') {
      this.#syncDisabledLocked();
    }
  }

  // ── Public API ────────────────────────────────────────────────────

  get vector()           { return { ...this.#vector }; }
  set vector(next)       { this.#applyVector(next); this.#recompute({ source: 'property' }); }
  get rationales()       { return { ...this.#rationales }; }
  set rationales(next)   { this.#applyRationales(next); this.#recompute({ source: 'property' }); }
  get costWeights()      { return { ...this.#costWeights }; }
  get capacityPoints()   { return this.#resolveCapacity(); }
  set capacityPoints(n)  { this._capacityPropOverride = Number.isFinite(+n) ? +n : null; this.#recompute({ source: 'property' }); }
  get criticalSum()      { return criticalSum(this.#vector, this.#costWeights); }
  get overBudget()       { const cap = this.#resolveCapacity(); return Number.isFinite(cap) && this.criticalSum > cap; }
  get overrunRationale() { return this.#overrunRationale; }
  set overrunRationale(s) {
    this.#overrunRationale = String(s ?? '');
    const ta = this.querySelector('[data-nfr-overrun] textarea');
    if (ta) ta.value = this.#overrunRationale;
    this.#publishFormValue();
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

  /** Validate; sets :state(missing-rationale) if invalid. */
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
    const errBox = this.querySelector('[data-nfr-errors]');
    if (errBox) errBox.textContent = errors.join(' ');
    return valid;
  }

  // ── Internal: row scaffolding ─────────────────────────────────────

  #ensureRows() {
    let rows = this.querySelector('[data-nfr-rows]');
    const existing = Array.from(this.querySelectorAll(':scope > fieldset'));
    if (existing.length === 0) {
      rows = document.createElement('section');
      rows.setAttribute('data-nfr-rows', '');
      for (const ility of DEFAULT_ILITIES) rows.append(this.#buildFieldset(ility));
      this.append(rows);
    } else if (!rows) {
      rows = document.createElement('section');
      rows.setAttribute('data-nfr-rows', '');
      for (const fs of existing) rows.append(fs);
      this.append(rows);
      // Upgrade each to the segmented pillgroup look + reveal-on-critical rationale.
      for (const fs of rows.querySelectorAll(':scope > fieldset')) this.#upgradeFieldset(fs);
    } else {
      for (const fs of rows.querySelectorAll(':scope > fieldset')) this.#upgradeFieldset(fs);
    }
  }

  #buildFieldset(ility) {
    const fs = document.createElement('fieldset');
    fs.name = ility;
    const legend = document.createElement('legend');
    legend.textContent = ilityLabel(ility);
    fs.append(legend);
    this.#upgradeFieldset(fs, { fillRadios: true, ility });
    return fs;
  }

  #upgradeFieldset(fs, { fillRadios = false, ility = fs.name } = {}) {
    if (fs.dataset.nfrUpgraded) return;

    let pillgroup = fs.querySelector('[data-nfr-pillgroup]');
    if (!pillgroup) {
      pillgroup = document.createElement('span');
      pillgroup.setAttribute('data-nfr-pillgroup', '');
      pillgroup.setAttribute('role', 'radiogroup');
      pillgroup.setAttribute('aria-label', `${ilityLabel(ility)} priority`);
      // Move pre-existing labels (one per radio) into the pillgroup.
      for (const label of Array.from(fs.querySelectorAll(':scope > label'))) pillgroup.append(label);
      // Insert after legend.
      const legend = fs.querySelector(':scope > legend');
      if (legend) legend.after(pillgroup); else fs.prepend(pillgroup);
    }

    if (fillRadios && pillgroup.children.length === 0) {
      const acceptableExists = !!fs.querySelector(`input[type="radio"][value="acceptable"]`);
      for (const lvl of LEVELS) {
        const lbl = document.createElement('label');
        const inp = document.createElement('input');
        inp.type = 'radio';
        inp.name = ility;
        inp.value = lvl;
        if (!acceptableExists && lvl === 'acceptable') inp.checked = true;
        lbl.append(inp, document.createTextNode(' ' + LEVEL_LABELS[lvl]));
        pillgroup.append(lbl);
      }
    }

    let rationale = fs.querySelector(`textarea[name="${CSS.escape(ility)}-rationale"]`);
    if (!rationale) {
      rationale = document.createElement('textarea');
      rationale.name = `${ility}-rationale`;
      rationale.placeholder = `Why is this Critical? (≥ ${this.#minRationale()} chars)`;
      rationale.minLength = this.#minRationale();
      rationale.maxLength = this.#maxRationale();
      rationale.hidden = true;
      fs.append(rationale);
    }

    let cost = fs.querySelector('[data-nfr-cost]');
    if (!cost) {
      cost = document.createElement('span');
      cost.setAttribute('data-nfr-cost', '');
      pillgroup.after(cost);
    }

    fs.dataset.nfrUpgraded = '1';
  }

  #ensureHeader() {
    if (this.querySelector('[data-nfr-header]')) return;
    const header = document.createElement('header');
    header.setAttribute('data-nfr-header', '');
    const title = this.querySelector('[slot="title"]');
    if (title) {
      header.append(title);
    } else {
      const h = document.createElement('h2');
      h.textContent = 'NFR Compass';
      header.append(h);
    }
    const readout = document.createElement('output');
    readout.setAttribute('data-nfr-readout', '');
    readout.setAttribute('aria-live', 'polite');
    readout.textContent = '0 of — points spent';
    header.append(readout);
    this.prepend(header);
  }

  #ensureOverrunBlock() {
    let block = this.querySelector('[data-nfr-overrun]');
    if (!block) {
      block = document.createElement('section');
      block.setAttribute('data-nfr-overrun', '');
      block.innerHTML = `
        <strong>Over budget — explain why.</strong>
        <small data-nfr-overrun-prompt></small>
        <textarea name="overrunRationale" minlength="${this.#minOverrunRationale()}"
                  maxlength="${this.#maxOverrunRationale()}"
                  placeholder="Why is the team accepting this overrun?"></textarea>
      `;
      this.append(block);
    } else {
      // Move a slotted textarea into our block if present
      const slotted = this.querySelector('[slot="overrun-rationale"]');
      if (slotted) {
        const existing = block.querySelector('textarea');
        if (existing) existing.replaceWith(slotted);
        slotted.removeAttribute('slot');
      }
    }
  }

  #ensureErrorBlock() {
    if (this.querySelector('[data-nfr-errors]')) return;
    const errs = document.createElement('p');
    errs.setAttribute('data-nfr-errors', '');
    errs.setAttribute('role', 'alert');
    this.append(errs);
  }

  // ── Internal: input / output ──────────────────────────────────────

  #onInput(event) {
    const target = /** @type {HTMLInputElement | HTMLTextAreaElement} */ (event.target);
    if (!target?.name) return;
    if (target.name === 'overrunRationale') {
      this.#overrunRationale = target.value;
      this.#publishFormValue();
      this.#updateReadout();
      return;
    }
    if (target.tagName === 'TEXTAREA' && target.name.endsWith('-rationale')) {
      const ility = target.name.slice(0, -'-rationale'.length);
      this.#rationales[ility] = target.value;
      this.#publishFormValue();
      return;
    }
    if (target.type === 'radio' && this.#hasOwnedField(target.name)) {
      this.#vector[target.name] = target.value;
      this.#syncRationaleVisibility(target.name, target.value);
      this.#recompute({ source: 'input', field: target.name });
    }
  }

  #hasOwnedField(name) {
    return !!this.querySelector(`fieldset[name="${CSS.escape(name)}"]`);
  }

  #readAllInputs() {
    this.#vector = {};
    this.#rationales = {};
    for (const fs of this.querySelectorAll(':scope > [data-nfr-rows] > fieldset, :scope > fieldset')) {
      const ility = fs.name || fs.getAttribute('name');
      if (!ility) continue;
      const checked = fs.querySelector(`input[type="radio"]:checked`);
      if (checked) this.#vector[ility] = checked.value;
      const ta = fs.querySelector(`textarea[name="${CSS.escape(ility)}-rationale"]`);
      if (ta && ta.value) this.#rationales[ility] = ta.value;
      this.#syncRationaleVisibility(ility, this.#vector[ility]);
    }
    const overrun = this.querySelector('[data-nfr-overrun] textarea');
    if (overrun) this.#overrunRationale = overrun.value || '';
  }

  #syncRationaleVisibility(ility, level) {
    const ta = this.querySelector(`textarea[name="${CSS.escape(ility)}-rationale"]`);
    if (!ta) return;
    if (level === 'critical') {
      ta.hidden = false;
      ta.required = true;
    } else {
      ta.hidden = true;
      ta.required = false;
    }
  }

  #applyVector(next) {
    if (!next || typeof next !== 'object') return;
    for (const [ility, level] of Object.entries(next)) {
      if (!LEVELS.includes(level)) continue;
      const radio = this.querySelector(`fieldset[name="${CSS.escape(ility)}"] input[value="${CSS.escape(level)}"]`);
      if (radio) {
        radio.checked = true;
        this.#vector[ility] = level;
        this.#syncRationaleVisibility(ility, level);
      }
    }
  }

  #applyRationales(next) {
    if (!next || typeof next !== 'object') return;
    for (const [ility, text] of Object.entries(next)) {
      const ta = this.querySelector(`textarea[name="${CSS.escape(ility)}-rationale"]`);
      if (ta) ta.value = String(text ?? '');
      this.#rationales[ility] = String(text ?? '');
    }
  }

  // ── Internal: capacity / cost weights ─────────────────────────────

  #refreshCostWeights() {
    const overrides = parseJsonAttr(this.getAttribute('data-cost-weights') || '');
    const ilities = Array.from(this.querySelectorAll('fieldset')).map(fs => fs.name).filter(Boolean);
    const list = ilities.length > 0 ? ilities : DEFAULT_ILITIES;
    this.#costWeights = mergeCostWeights(list, overrides);
  }

  #resolveCapacity() {
    const triangle = this.#findTriangle();
    if (triangle && Number.isFinite(triangle.capacityPoints) && triangle.capacityPoints > 0) {
      return triangle.capacityPoints;
    }
    const attr = Number(this.getAttribute('data-capacity-points'));
    if (Number.isFinite(attr) && attr > 0) return attr;
    if (Number.isFinite(this._capacityPropOverride) && this._capacityPropOverride > 0) {
      return this._capacityPropOverride;
    }
    return Infinity;
  }

  #resolveCapacityForSerialize() {
    const cap = this.#resolveCapacity();
    return Number.isFinite(cap) ? cap : null;
  }

  #capacitySourceLabel() {
    if (this.#findTriangle()) return 'iron-triangle';
    if (this.getAttribute('data-capacity-points')) return 'attribute';
    if (Number.isFinite(this._capacityPropOverride)) return 'property';
    return 'unbounded';
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
    if (!triangle) {
      if (!this.getAttribute('data-capacity-points') && !Number.isFinite(this._capacityPropOverride)) {
        // Spec: no capacity source → informational; warn once.
        if (!this.#warnedNoCapacity) {
          console.warn('[nfr-compass] No capacity source; pair with <iron-triangle data-bind-to> or set data-capacity-points to enable budget enforcement.');
          this.#warnedNoCapacity = true;
        }
      }
      return;
    }
    const handler = () => this.#recompute({ source: 'iron-triangle' });
    triangle.addEventListener('iron-triangle:change', handler);
    this.#unbindTriangle = () => triangle.removeEventListener('iron-triangle:change', handler);
  }

  // ── Internal: recompute / readout ─────────────────────────────────

  #recompute({ source, field } = {}) {
    this.#updateReadout();
    this.#updateCostBadges();
    const cap = this.#resolveCapacity();
    const sum = this.criticalSum;
    const isOver = Number.isFinite(cap) && sum > cap;
    this.setState('over-budget', isOver);
    this.#publishFormValue();

    if (isOver !== this.#wasOver) {
      const evt = isOver ? 'nfr-compass:over-budget' : 'nfr-compass:under-budget';
      const detail = isOver
        ? { delta: sum - cap, criticalSum: sum, capacityPoints: cap }
        : { slack: cap - sum, criticalSum: sum, capacityPoints: cap };
      this.dispatchEvent(new CustomEvent(evt, { bubbles: true, composed: true, detail }));
      this.#wasOver = isOver;
    }

    this.dispatchEvent(new CustomEvent('nfr-compass:change', {
      bubbles: true, composed: true,
      detail: { ...this.value, source, field },
    }));
  }

  #updateReadout() {
    const out = this.querySelector('[data-nfr-readout]');
    if (!out) return;
    const cap = this.#resolveCapacity();
    const sum = this.criticalSum;
    const capLabel = Number.isFinite(cap) ? cap : '—';
    out.textContent = `${sum} of ${capLabel} points spent`;
    let hint = out.querySelector('[data-nfr-readout-hint]');
    if (!hint) {
      hint = document.createElement('span');
      hint.setAttribute('data-nfr-readout-hint', '');
      out.append(hint);
    }
    if (!Number.isFinite(cap)) {
      hint.textContent = 'No capacity source — budget unbounded.';
    } else if (sum > cap) {
      hint.textContent = `Over budget by ${sum - cap} — rationale required to save.`;
    } else if (sum === cap) {
      hint.textContent = 'At capacity.';
    } else {
      hint.textContent = `${cap - sum} points remaining.`;
    }
    const overrunPrompt = this.querySelector('[data-nfr-overrun-prompt]');
    if (overrunPrompt && Number.isFinite(cap)) {
      overrunPrompt.textContent = `You're over budget by ${sum - cap} points (${sum}/${cap}).`;
    }
  }

  #updateCostBadges() {
    for (const fs of this.querySelectorAll('fieldset')) {
      const ility = fs.name;
      const badge = fs.querySelector('[data-nfr-cost]');
      if (!badge) continue;
      const cost = this.#costWeights[ility] ?? 0;
      const isCritical = this.#vector[ility] === 'critical';
      badge.textContent = isCritical
        ? `−${cost} pts`
        : `${cost} pts if Critical`;
      if (isCritical) badge.setAttribute('data-active', ''); else badge.removeAttribute('data-active');
    }
  }

  #publishFormValue() {
    try {
      this.#internals.setFormValue(JSON.stringify(this.value));
    } catch {
      /* older Safari */
    }
  }

  #syncDisabledLocked() {
    const off = this.hasAttribute('disabled') || this.hasAttribute('locked');
    for (const el of this.querySelectorAll('input, textarea, button')) el.disabled = off;
  }

  // ── Internal: config readers ──────────────────────────────────────

  #minRationale()        { return Math.max(0, parseInt(this.dataset.minRationale ?? '10', 10) || 10); }
  #maxRationale()        { return Math.max(10, parseInt(this.dataset.maxRationale ?? '200', 10) || 200); }
  #minOverrunRationale() { return Math.max(0, parseInt(this.dataset.minOverrunRationale ?? '10', 10) || 10); }
  #maxOverrunRationale() { return Math.max(10, parseInt(this.dataset.maxOverrunRationale ?? '400', 10) || 400); }
}

registerComponent('nfr-compass', NfrCompass);

export { NfrCompass };
