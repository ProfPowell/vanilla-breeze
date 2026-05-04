/**
 * <score-card> — Single KPI tile for dashboards and analytics surfaces.
 *
 * Slots:
 *   title       — metric label
 *   value       — headline number (use <data value="..."> for machine-readable)
 *   change      — delta indicator (recommend nested <data> for change value)
 *   sparkline   — trend visualisation (compose with <chart-wc> or any element)
 *   description — supporting context line
 *   icon        — brand/category icon
 *
 * Attributes:
 *   trend       — up | down | flat   (drives :state(trend-*) and change color)
 *   tone        — default | success | warning | error | info  (accent color)
 *   layout      — stack | cluster | compact  (grid template variant)
 *   loading     — boolean (skeleton state via :state(loading))
 *
 * Internal :state() hooks:
 *   trend-up, trend-down, trend-flat  (mirrors `trend` attribute)
 *   loading                            (mirrors `loading` attribute)
 *   interactive                        (set when wrapped in an <a>)
 *
 * Drill-down: wrap in <a href="..."> — the anchor receives focus and click.
 * Score-card detects the ancestor anchor and sets :state(interactive) so CSS
 * can apply hover/active affordances on the tile itself.
 */

import { styles } from './styles.js';
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

const TREND_VALUES = new Set(['up', 'down', 'flat']);

const TEMPLATE = `
  <style>${styles}</style>
  <div class="card" part="card">
    <span class="title"       part="title"><slot name="title"></slot></span>
    <span class="value"       part="value"><slot name="value"><slot></slot></slot></span>
    <span class="change"      part="change"><slot name="change"></slot></span>
    <span class="sparkline"   part="sparkline"><slot name="sparkline"></slot></span>
    <span class="description" part="description"><slot name="description"></slot></span>
    <span class="icon"        part="icon"><slot name="icon"></slot></span>
  </div>
`;

class ScoreCard extends VBElement {
  static get observedAttributes() {
    return ['trend', 'loading'];
  }

  setup() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = TEMPLATE;
    }
    this.#syncTrend();
    this.#syncLoading();
    this.#syncInteractive();
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'trend') this.#syncTrend();
    else if (name === 'loading') this.#syncLoading();
  }

  #syncTrend() {
    const value = (this.getAttribute('trend') || '').toLowerCase();
    for (const t of TREND_VALUES) {
      this.setState(`trend-${t}`, t === value);
    }
  }

  #syncLoading() {
    this.setState('loading', this.hasAttribute('loading'));
  }

  #syncInteractive() {
    // closest() walks across shadow boundaries for ancestors in the light tree.
    const anchor = this.closest('a[href]');
    this.setState('interactive', !!anchor);
  }
}

registerComponent('score-card', ScoreCard);

export { ScoreCard };
