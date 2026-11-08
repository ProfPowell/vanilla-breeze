/**
 * status-wc: Visual state indicator (live, online, recording, presence, system state).
 *
 * Presentational primitive — variant drives color, animation, and semantic intent.
 * Pairs with status-message (textual) and notification-wc (action-bearing).
 *
 * Never colour-only: when the element has no slot text, a visually hidden
 * default label for the variant is rendered (e.g. "Online"), overridable per
 * variant with `data-label-<variant>` (or with `aria-label`). The generated
 * text follows `data-variant`, so variant changes are announced while the
 * element is a live region. Author-supplied slot text is never rewritten —
 * update it yourself when the variant changes.
 *
 * @attr {string}  data-variant   - One of the built-in variants OR a custom name
 *                                  Built-ins: live, recording, streaming, error,
 *                                  online, running, away, paused, busy, offline,
 *                                  stopped
 * @attr {string}  data-size      - xs | sm | md (default) | lg
 * @attr {string}  data-position  - before (default) | after | only
 * @attr {string}  data-pulse     - on | off (override variant default animation)
 * @attr {string}  data-live      - off (no role="status"/aria-live; decorative use)
 * @attr {string}  data-label-*   - Default hidden label per variant, e.g. data-label-online="En ligne"
 * @attr {string}  aria-label     - Explicit name; also used as the hidden label text
 *
 * @example
 *   <status-wc data-variant="live">Live</status-wc>
 *   <status-wc data-variant="online" data-position="only"></status-wc>
 *
 * @fires status-wc:change - Fires when data-variant mutates after upgrade.
 *        detail: { variant, previousVariant }
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/** English defaults for the generated label; override with data-label-<variant>. */
const DEFAULT_LABELS = /** @type {Record<string, string>} */ ({
  live: 'Live',
  recording: 'Recording',
  streaming: 'Streaming',
  error: 'Error',
  online: 'Online',
  running: 'Running',
  away: 'Away',
  paused: 'Paused',
  busy: 'Busy',
  offline: 'Offline',
  stopped: 'Stopped',
});

class StatusWc extends VBElement {
  static get observedAttributes() {
    return ['data-variant', 'data-live', 'aria-label'];
  }

  /** @type {HTMLSpanElement | null} */
  #label = null;
  /** @type {HTMLSpanElement | null} */
  #generated = null;
  /** True when this element (not the author) set role/aria-live. */
  #ownsRole = false;

  setup() {
    // Idempotent across reconnects, clones and serialized markup: reuse the
    // dot/label we (or a previous instance) built instead of re-wrapping.
    let dot = /** @type {HTMLSpanElement | null} */ (this.querySelector(':scope > .status-dot'));
    let label = /** @type {HTMLSpanElement | null} */ (this.querySelector(':scope > .status-label'));
    let generated = /** @type {HTMLSpanElement | null} */ (this.querySelector(':scope > .status-default-label'));

    if (!dot) {
      dot = document.createElement('span');
      dot.className = 'status-dot';
      dot.setAttribute('aria-hidden', 'true');
    }
    if (!label) {
      label = document.createElement('span');
      label.className = 'status-label';
    }
    if (!generated) {
      generated = document.createElement('span');
      generated.className = 'status-default-label';
    }

    // Author content (anything that is not one of our parts) goes in the label.
    for (const node of [...this.childNodes]) {
      if (node === dot || node === label || node === generated) continue;
      label.appendChild(node);
    }

    this.append(dot, label, generated);
    this.#label = label;
    this.#generated = generated;

    this.#applyAria();
    this.#syncGeneratedLabel();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    // Attributes present at upgrade (or changed while disconnected) are read
    // by setup(); only post-upgrade mutations count as changes.
    if (!this.isConnected || !this.hasAttribute('data-upgraded')) return;
    if (name === 'data-variant') {
      this.#syncGeneratedLabel();
      this.dispatchEvent(new CustomEvent('status-wc:change', {
        bubbles: true,
        detail: { variant: newVal, previousVariant: oldVal },
      }));
    } else if (name === 'data-live') {
      this.#applyAria();
    } else if (name === 'aria-label') {
      this.#syncGeneratedLabel();
    }
  }

  #applyAria() {
    if (this.getAttribute('data-live') === 'off') {
      // Decorative use — drop the role/aria-live we added so AT ignores it.
      if (this.#ownsRole) {
        this.removeAttribute('role');
        this.removeAttribute('aria-live');
        this.#ownsRole = false;
      }
    } else if (!this.hasAttribute('role') && !this.hasAttribute('aria-live')) {
      this.setAttribute('role', 'status');
      this.setAttribute('aria-live', 'polite');
      this.#ownsRole = true;
    }
  }

  /**
   * Keep the visually hidden default label in step with the variant. It is
   * empty whenever the author supplied slot text, so text is never doubled.
   */
  #syncGeneratedLabel() {
    const generated = this.#generated;
    if (!generated) return;
    const hasSlotText = !!this.#label?.textContent?.trim();
    let text = '';
    if (!hasSlotText) {
      const v = this.getAttribute('data-variant') || '';
      text = this.getAttribute('aria-label')
        || (v && this.getAttribute(`data-label-${v}`))
        || DEFAULT_LABELS[v]
        || v;
    }
    if (generated.textContent !== text) generated.textContent = text;
  }

  /**
   * Current variant (reflects data-variant).
   *
   * @returns {string|null} The data-variant value, or null.
   */
  get variant() { return this.getAttribute('data-variant'); }
  set variant(v) { v ? this.setAttribute('data-variant', v) : this.removeAttribute('data-variant'); }
}

registerComponent('status-wc', StatusWc);

export { StatusWc };
