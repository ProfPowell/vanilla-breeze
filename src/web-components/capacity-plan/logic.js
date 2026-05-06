/**
 * <capacity-plan> — Tiny ledger that ties the planning chain together.
 *
 * Reads:
 *   capacityPoints  ← <iron-triangle> via data-bind-triangle
 *   qualitySum      ← <quality-target>'s criticalSum via data-bind-quality
 *   featureSum      ← summed from slotted work-items' data-capacity-cost,
 *                     OR set as a property
 *
 * Renders a compact two-column ledger:
 *   numeric column (label + signed delta) + proportional stacked bar.
 *
 * Re-renders on bound triangle/quality changes and on slotted-children
 * mutations.
 */

import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import {
  sumWorkCosts,
  computeLedger,
  barProportions,
} from './_capacity-utils.js';

class CapacityPlan extends VBElement {
  static get observedAttributes() {
    return ['data-bind-triangle', 'data-bind-quality'];
  }

  /** @type {(() => void) | null} */
  #unbindTriangle = null;
  /** @type {(() => void) | null} */
  #unbindQuality = null;
  /** @type {MutationObserver | null} */
  #slotObserver = null;
  /** @type {number | null} */
  #featureSumOverride = null;
  /** @type {boolean} */
  #wasOver = false;

  setup() {
    this.#bindTriangle();
    this.#bindQuality();
    this.#observeSlotted();
    this.#render();
  }

  teardown() {
    this.#unbindTriangle?.();
    this.#unbindQuality?.();
    this.#slotObserver?.disconnect();
    this.#unbindTriangle = null;
    this.#unbindQuality = null;
    this.#slotObserver = null;
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'data-bind-triangle') { this.#bindTriangle(); this.#render(); }
    else if (name === 'data-bind-quality') { this.#bindQuality(); this.#render(); }
  }

  // ── Public API ────────────────────────────────────────────────────

  get capacityPoints() { return this.#triangleCap(); }
  get qualitySum()     { return this.#qualitySum(); }

  get featureSum() {
    if (this.#featureSumOverride != null) return this.#featureSumOverride;
    return sumWorkCosts(this.querySelectorAll('[data-capacity-cost]'));
  }
  set featureSum(n) {
    this.#featureSumOverride = Number.isFinite(+n) ? +n : null;
    this.#render();
  }

  get slack() {
    return computeLedger({
      capacityPoints: this.#triangleCap(),
      qualitySum: this.#qualitySum(),
      featureSum: this.featureSum,
    }).slack;
  }

  // ── Internal: bindings ────────────────────────────────────────────

  #findById(id) {
    if (!id) return null;
    const root = this.getRootNode();
    return root.getElementById ? root.getElementById(id) : document.getElementById(id);
  }

  #bindTriangle() {
    this.#unbindTriangle?.();
    this.#unbindTriangle = null;
    const el = this.#findById(this.dataset.bindTriangle);
    if (!el || el.localName !== 'iron-triangle') return;
    const handler = () => this.#render();
    el.addEventListener('iron-triangle:change', handler);
    this.#unbindTriangle = () => el.removeEventListener('iron-triangle:change', handler);
  }

  #bindQuality() {
    this.#unbindQuality?.();
    this.#unbindQuality = null;
    const el = this.#findById(this.dataset.bindQuality);
    if (!el || el.localName !== 'quality-target') return;
    const handler = () => this.#render();
    el.addEventListener('quality-target:change', handler);
    this.#unbindQuality = () => el.removeEventListener('quality-target:change', handler);
  }

  #observeSlotted() {
    if (this.#slotObserver) return;
    this.#slotObserver = new MutationObserver((records) => {
      // Ignore mutations that happen inside the rendered ledger table —
      // otherwise we'd loop on our own innerHTML writes.
      const meaningful = records.some(r => {
        const target = r.target;
        return !target.closest?.('[data-capacity-table]');
      });
      if (meaningful) this.#render();
    });
    this.#slotObserver.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-capacity-cost'],
    });
  }

  #triangleCap() {
    const el = this.#findById(this.dataset.bindTriangle);
    if (!el || el.localName !== 'iron-triangle') return Infinity;
    const v = el.capacityPoints;
    return Number.isFinite(v) && v > 0 ? v : Infinity;
  }

  #qualitySum() {
    const el = this.#findById(this.dataset.bindQuality);
    if (!el || el.localName !== 'quality-target') return 0;
    return Number(el.criticalSum) || 0;
  }

  // ── Internal: render ──────────────────────────────────────────────

  #render() {
    const ledger = computeLedger({
      capacityPoints: this.#triangleCap(),
      qualitySum: this.#qualitySum(),
      featureSum: this.featureSum,
    });
    const bars = barProportions(ledger);

    let table = this.querySelector(':scope > [data-capacity-table]');
    if (!table) {
      table = document.createElement('section');
      table.dataset.capacityTable = '';
      // Prepend so the ledger is the headline; slotted work-items
      // (the underlying data) render below.
      this.prepend(table);
    }

    const capCell  = formatPts(ledger.capacity);
    const qCell    = ledger.quality  > 0 ? `−${ledger.quality} pts`  : '0 pts';
    const fCell    = ledger.features > 0 ? `−${ledger.features} pts` : '0 pts';
    const slackCell = formatSignedSlack(ledger.slack);

    table.innerHTML = `
      <dl data-layout="grid" class="capacity-ledger" aria-label="Capacity ledger">
        <div data-row="capacity">
          <dt>Capacity</dt>
          <dd class="num">${capCell}</dd>
          <dd class="bar"><span class="bar-track"><span class="bar-fill bar-capacity" style="--w:100%"></span></span></dd>
        </div>
        <div data-row="quality">
          <dt>Quality</dt>
          <dd class="num">${qCell}</dd>
          <dd class="bar"><span class="bar-track"><span class="bar-fill bar-quality" style="--w:${bars.quality.toFixed(1)}%"></span></span></dd>
        </div>
        <div data-row="features">
          <dt>Features</dt>
          <dd class="num">${fCell}</dd>
          <dd class="bar"><span class="bar-track"><span class="bar-fill bar-features" style="--w:${bars.features.toFixed(1)}%"></span></span></dd>
        </div>
        <div data-row="slack" data-state="${ledger.slack < 0 ? 'over' : 'under'}">
          <dt>Slack</dt>
          <dd class="num">${slackCell}</dd>
          <dd class="bar"><span class="bar-track"><span class="bar-fill bar-slack" style="--w:${bars.slack.toFixed(1)}%"></span></span></dd>
        </div>
      </dl>
    `;

    this.setState('overdrawn', ledger.slack < 0);

    // Edge-triggered overdrawn event.
    const isOver = ledger.slack < 0;
    if (isOver !== this.#wasOver) {
      this.dispatchEvent(new CustomEvent('capacity-plan:overdrawn', {
        bubbles: true, composed: true,
        detail: { ledger, source: 'render' },
      }));
      this.#wasOver = isOver;
    }
  }
}

function formatPts(n) {
  if (!Number.isFinite(n)) return '∞';
  return `${n} pts`;
}

function formatSignedSlack(n) {
  if (!Number.isFinite(n)) return '∞';
  if (n === 0) return '0 pts';
  if (n > 0)   return `+${n} pts`;
  return `${n} pts`;   // already signed (negative)
}

registerComponent('capacity-plan', CapacityPlan);

export { CapacityPlan };
