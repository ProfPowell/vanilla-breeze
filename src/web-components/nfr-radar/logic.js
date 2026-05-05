/**
 * <nfr-radar> — 11-axis radar viz for an NFR vector vs the project's
 * capacity envelope.
 *
 * Light DOM. Pairs with a sibling <nfr-compass> via data-bind-to:
 *
 *   <nfr-compass id="picker" data-bind-to="shape">…</nfr-compass>
 *   <nfr-radar   data-bind-to="picker"></nfr-radar>
 *
 * Listens for `nfr-compass:change` from the bound compass, reads the
 * compass's value, and re-renders an inline <svg> via the site-map-wc
 * pattern (createElementNS → swap into light DOM).
 *
 * Two SVG layers:
 *   - Capacity envelope (background polygon): the feasible region the
 *     project budget can afford if costs were uniformly distributed.
 *   - Vector overlay (foreground polygon + dots): the team's chosen
 *     priority levels mapped to per-axis ratios
 *     (critical = 1.0, important = 0.6, acceptable = 0.3, not-relevant = 0).
 *
 * Programmatic API:
 *   radar.value = { vector, costWeights, capacityPoints };
 *   radar.ilities = ['performance', 'security', …];
 */

import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { DEFAULT_ILITIES } from '../nfr-compass/_nfr-utils.js';
import { buildRadarSvg } from './_radar-geometry.js';

class NfrRadar extends VBElement {
  static get observedAttributes() {
    return ['data-bind-to', 'data-radius', 'data-show-envelope'];
  }

  /** @type {string[]} */
  #ilities = [...DEFAULT_ILITIES];
  /** @type {{ vector?: Record<string,string>, costWeights?: Record<string,number>, capacityPoints?: number }} */
  #value = {};
  /** @type {(() => void) | null} */
  #unbindCompass = null;

  setup() {
    this.#bindToCompass();
    this.#renderViz();
  }

  teardown() {
    this.#unbindCompass?.();
    this.#unbindCompass = null;
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'data-bind-to') {
      this.#bindToCompass();
      this.#renderViz();
    } else if (name === 'data-radius' || name === 'data-show-envelope') {
      this.#renderViz();
    }
  }

  // ── Public API ────────────────────────────────────────────────────

  get value() { return JSON.parse(JSON.stringify(this.#value)); }
  set value(next) {
    this.#value = (next && typeof next === 'object') ? next : {};
    this.#renderViz();
    this.dispatchEvent(new CustomEvent('nfr-radar:change', {
      bubbles: true, composed: true,
      detail: { value: this.value, source: 'property' },
    }));
  }

  get ilities() { return [...this.#ilities]; }
  set ilities(next) {
    if (!Array.isArray(next) || next.length === 0) return;
    this.#ilities = [...next];
    this.#renderViz();
  }

  // ── Internal ──────────────────────────────────────────────────────

  #findCompass() {
    const id = this.getAttribute('data-bind-to');
    if (!id) return null;
    const root = this.getRootNode();
    const found = root.getElementById ? root.getElementById(id) : document.getElementById(id);
    return found && found.localName === 'nfr-compass' ? found : null;
  }

  #bindToCompass() {
    this.#unbindCompass?.();
    this.#unbindCompass = null;
    const compass = this.#findCompass();
    if (!compass) return;

    const sync = () => {
      const v = compass.value || {};
      this.#value = {
        vector: v.vector,
        costWeights: v.costWeights,
        capacityPoints: v.capacityPoints,
      };
      this.#renderViz();
      this.dispatchEvent(new CustomEvent('nfr-radar:change', {
        bubbles: true, composed: true,
        detail: { value: this.value, source: 'iron-compass' },
      }));
    };
    compass.addEventListener('nfr-compass:change', sync);
    this.#unbindCompass = () => compass.removeEventListener('nfr-compass:change', sync);

    // Pull initial state synchronously if the compass has already upgraded.
    if (compass.hasAttribute('data-upgraded')) sync();
  }

  #renderViz() {
    const radius = clamp(Number(this.dataset.radius ?? 90), 30, 400);
    const showEnvelope = !this.dataset.showEnvelope || this.dataset.showEnvelope !== 'false';
    const svg = buildRadarSvg({
      ilities: this.#ilities,
      vector: this.#value.vector || {},
      costWeights: this.#value.costWeights || {},
      capacityPoints: this.#value.capacityPoints,
      radius,
      showEnvelope,
    });
    const existing = this.querySelector('svg');
    if (existing) existing.replaceWith(svg);
    else this.append(svg);
  }
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

registerComponent('nfr-radar', NfrRadar);

export { NfrRadar };
