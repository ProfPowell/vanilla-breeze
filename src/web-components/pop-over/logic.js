/**
 * pop-over: General-purpose anchored popover container.
 *
 * A thin primitive over the native Popover API that:
 *  1. Applies the popover attribute (auto|manual|hint) so the host
 *     becomes a popover target.
 *  2. Wires CSS Anchor Positioning (anchor-name + position-anchor)
 *     when the browser supports it, so positioning is fully declarative.
 *  3. Falls back to a JS-driven fixed-position calculation when anchor
 *     positioning is unavailable.
 *  4. Re-asserts display:none under VB's authored cascade layers (UA
 *     hiding loses to author rules — see popover_display_gotcha).
 *  5. Emits 'pop-over:show' / 'pop-over:hide' on toggle.
 *
 * Triggers use the standard popovertarget attribute on a button.
 *
 * @attr {string} data-mode      - auto (default) | manual | hint
 * @attr {string} data-anchor    - id or selector of the anchor element
 * @attr {string} data-position  - top|bottom|left|right(-start|-end). Default 'bottom'.
 * @attr {string} data-offset    - none|xs|s|m|l (gap, mapped to --size-* tokens)
 *
 * @example Bottom-anchored popover
 * <button popovertarget="prefs">Preferences</button>
 * <pop-over id="prefs" data-position="bottom-start">
 *   <p>Pop content</p>
 * </pop-over>
 *
 * @example Manual mode (script controls)
 * <pop-over id="dialog" data-mode="manual" data-position="top">…</pop-over>
 * <script>document.getElementById('dialog').show();</script>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const supportsAnchor = CSS.supports('anchor-name', '--x');
const supportsPositionArea = CSS.supports('position-area', 'bottom');

let anchorCounter = 0;

class PopOver extends VBElement {
  /** @type {HTMLElement | null} */
  #anchor = null;
  /** @type {string | null} */
  #anchorName = null;
  /** @type {((e: any) => void) | null} */
  #onBeforeToggle = null;
  /** @type {(() => void) | null} */
  #onWindowChange = null;

  setup() {
    if (!this.id) this.id = `pop-over-${++anchorCounter}`;

    const mode = this.dataset.mode || 'auto';
    if (!this.hasAttribute('popover')) this.setAttribute('popover', mode);

    this.#resolveAnchor();
    this.#bindAnchorPositioning();

    this.#onBeforeToggle = (e) => {
      const type = e.newState === 'open' ? 'show' : 'hide';
      this.dispatchEvent(new CustomEvent(`pop-over:${type}`, {
        detail: { state: e.newState },
        bubbles: true,
        composed: true,
      }));

      /* Fallback positioning runs only when CSS anchor positioning is
         missing. We compute on each show because layout may have changed. */
      if (!supportsAnchor && e.newState === 'open' && this.#anchor) {
        this.#positionFallback();
      }
    };
    this.listen(this, 'beforetoggle', this.#onBeforeToggle);

    if (!supportsAnchor) {
      this.#onWindowChange = () => {
        if (this.matches(':popover-open') && this.#anchor) this.#positionFallback();
      };
      this.listen(window, 'resize', this.#onWindowChange);
      this.listen(window, 'scroll', this.#onWindowChange, { capture: true, passive: true });
    }
  }

  // ── Imperative API ───────────────────────────────────────────────────

  /** Show the popover. */
  show() {
    if (!this.matches(':popover-open')) this.showPopover();
  }

  /** Hide the popover. */
  hide() {
    if (this.matches(':popover-open')) this.hidePopover();
  }

  /** Toggle. */
  toggle() {
    this.matches(':popover-open') ? this.hide() : this.show();
  }

  /** Open state. */
  get open() {
    return this.matches(':popover-open');
  }

  // ── Anchor wiring ────────────────────────────────────────────────────

  #resolveAnchor() {
    const ref = this.dataset.anchor;
    if (ref) {
      this.#anchor = /** @type {HTMLElement | null} */ (document.getElementById(ref) || document.querySelector(ref));
    } else {
      /* Find the trigger via popovertarget. Authors don't have to
         duplicate the anchor reference. */
      this.#anchor = /** @type {HTMLElement | null} */ (document.querySelector(`[popovertarget="${CSS.escape(this.id)}"]`));
    }
  }

  #bindAnchorPositioning() {
    if (!this.#anchor || !supportsAnchor) return;

    this.#anchorName = `--pop-over-anchor-${this.id}`;
    this.#anchor.style.setProperty('anchor-name', this.#anchorName);
    this.style.setProperty('position-anchor', this.#anchorName);
    this.setAttribute('data-anchor-name', this.#anchorName || '');

    /* When position-area isn't available but anchor-name is (e.g.,
       Safari TP), fall back to inset/anchor() arithmetic for the
       common 'bottom' positions. */
    if (!supportsPositionArea) {
      const pos = this.dataset.position || 'bottom';
      this.#applyAnchorInset(pos);
    }
  }

  #applyAnchorInset(pos) {
    const offsetVar = 'var(--_pop-over-offset, var(--size-xs))';
    const map = {
      top:    { bottom: `calc(anchor(top) + ${offsetVar})`, left:  'anchor(left)' },
      bottom: { top:    `calc(anchor(bottom) + ${offsetVar})`, left:  'anchor(left)' },
      left:   { right:  `calc(anchor(left) + ${offsetVar})`, top:   'anchor(top)' },
      right:  { left:   `calc(anchor(right) + ${offsetVar})`, top:   'anchor(top)' },
    };
    const base = pos.split('-')[0];
    const rules = map[base] || map.bottom;
    Object.entries(rules).forEach(([k, v]) => this.style.setProperty(k, v));
  }

  // ── JS-driven fallback (no anchor-positioning support) ──────────────

  #positionFallback() {
    if (!this.#anchor) return;
    const r = this.#anchor.getBoundingClientRect();
    const pos = this.dataset.position || 'bottom';
    const off = this.#offsetPx();
    let top, left;

    switch (pos.split('-')[0]) {
      case 'top':    top = r.top - this.offsetHeight - off; left = r.left; break;
      case 'left':   top = r.top; left = r.left - this.offsetWidth - off; break;
      case 'right':  top = r.top; left = r.right + off; break;
      case 'bottom':
      default:       top = r.bottom + off; left = r.left; break;
    }
    if (pos.endsWith('-end')) {
      if (pos.startsWith('top') || pos.startsWith('bottom'))
        left = r.right - this.offsetWidth;
      else
        top  = r.bottom - this.offsetHeight;
    }

    this.style.position = 'fixed';
    this.style.top  = `${Math.round(top)}px`;
    this.style.left = `${Math.round(left)}px`;
    this.style.margin = '0';
  }

  #offsetPx() {
    const map = { none: 0, xs: 4, s: 8, m: 16, l: 24 };
    return map[this.dataset.offset] ?? map.xs;
  }
}

registerComponent('pop-over', PopOver);
