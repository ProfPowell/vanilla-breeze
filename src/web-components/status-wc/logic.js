/**
 * status-wc: Visual state indicator (live, online, recording, presence, system state).
 *
 * Presentational primitive — variant drives color, animation, and semantic intent.
 * Pairs with status-message (textual) and notification-wc (action-bearing).
 *
 * @attr {string}  data-variant   - One of the built-in variants OR a custom name
 *                                  Built-ins: live, recording, streaming, error,
 *                                  online, running, away, paused, busy, offline,
 *                                  stopped
 * @attr {string}  data-size      - xs | sm | md (default) | lg
 * @attr {string}  data-position  - before (default) | after | only
 * @attr {string}  data-pulse     - on | off (override variant default animation)
 * @attr {string}  data-live      - off (suppress live-region announcements)
 * @attr {string}  aria-label     - Required when slot has no text content
 *
 * @example
 *   <status-wc data-variant="live">Live</status-wc>
 *   <status-wc data-variant="online" data-position="only" aria-label="Online"></status-wc>
 *
 * @fires status-wc:change - Fires when data-variant mutates.
 *        detail: { variant, previousVariant }
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const BUILT_IN_VARIANTS = new Set([
  'live', 'recording', 'streaming', 'error',
  'online', 'running', 'away', 'paused', 'busy',
  'offline', 'stopped',
]);

class StatusWc extends VBElement {
  static observedAttributes = ['data-variant', 'data-live'];

  #label; // .status-label span

  setup() {
    // Wrap any pre-existing text/children in .status-label, prepend .status-dot.
    const dot = document.createElement('span');
    dot.className = 'status-dot';
    dot.setAttribute('aria-hidden', 'true');

    this.#label = document.createElement('span');
    this.#label.className = 'status-label';
    while (this.firstChild) this.#label.appendChild(this.firstChild);

    this.appendChild(dot);
    this.appendChild(this.#label);

    this.#applyAria();
    this.#warnIfUnknownVariant();
    this.#warnIfNoAccessibleName();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.isConnected || oldVal === newVal) return;
    if (name === 'data-variant') {
      this.#warnIfUnknownVariant();
      this.dispatchEvent(new CustomEvent('status-wc:change', {
        bubbles: true,
        detail: { variant: newVal, previousVariant: oldVal },
      }));
    } else if (name === 'data-live') {
      this.#applyAria();
    }
  }

  #applyAria() {
    if (this.getAttribute('data-live') === 'off') {
      // Decorative use — drop the role/aria-live so AT ignores it.
      this.removeAttribute('role');
      this.removeAttribute('aria-live');
    } else {
      if (!this.hasAttribute('role')) this.setAttribute('role', 'status');
      if (!this.hasAttribute('aria-live')) this.setAttribute('aria-live', 'polite');
    }
  }

  #warnIfUnknownVariant() {
    const v = this.getAttribute('data-variant');
    if (!v) return;
    if (BUILT_IN_VARIANTS.has(v)) return;
    // Custom variants are allowed (CSS-only extension). Just info-log so
    // authors know it's not a typo on a built-in.
    if (!this.#hasCustomVariantStyles(v)) {
      console.info(`[status-wc] data-variant="${v}" is not a built-in; add a CSS rule (status-wc[data-variant="${v}"] { --status-dot-color: …; }) or use a built-in.`);
    }
  }

  #hasCustomVariantStyles(variant) {
    // Heuristic: did CSS set --status-dot-color away from the muted default?
    // Cheap check via computed style on the dot.
    const dot = this.querySelector('.status-dot');
    if (!dot) return true; // skip during setup
    const color = getComputedStyle(dot).getPropertyValue('--status-dot-color').trim();
    return color && color !== '';
  }

  #warnIfNoAccessibleName() {
    const hasSlotText = this.#label?.textContent.trim();
    const hasAriaLabel = this.hasAttribute('aria-label');
    if (!hasSlotText && !hasAriaLabel) {
      console.warn('[status-wc] needs slot text or aria-label for accessibility.');
    }
  }

  /** Read-only accessor for the current variant. */
  get variant() { return this.getAttribute('data-variant'); }
  set variant(v) { v ? this.setAttribute('data-variant', v) : this.removeAttribute('data-variant'); }
}

registerComponent('status-wc', StatusWc);

export { StatusWc };
