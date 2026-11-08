/**
 * pop-over: General-purpose anchored popover container.
 *
 * A thin primitive over the native Popover API that:
 *  1. Applies the popover attribute (auto|manual|hint) so the host
 *     becomes a popover target. `hint` falls back to `auto` where the
 *     browser doesn't support it (an unknown value would mean manual).
 *  2. Wires CSS Anchor Positioning (anchor-name + position-anchor)
 *     when the browser supports it, so positioning is fully declarative.
 *     The anchor's anchor-name is a list, so several pop-overs (a tool-tip
 *     and a drop-down on one trigger) can share one anchor.
 *  3. Falls back to a JS-driven fixed-position calculation when anchor
 *     positioning is unavailable — measured after the popover is shown,
 *     flipped and clamped to the viewport.
 *  4. Re-asserts display:none under VB's authored cascade layers (UA
 *     hiding loses to author rules — see popover_display_gotcha).
 *  5. Emits 'pop-over:show' / 'pop-over:hide' (detail { state }) on toggle.
 *
 * data-mode, data-anchor and data-position are observed: changing them
 * after upgrade re-applies the popover mode and re-wires the anchor.
 *
 * Triggers use the standard popovertarget attribute on a button.
 *
 * @attr {string} data-mode      - auto (default) | manual | hint
 * @attr {string} data-anchor    - id or selector of the anchor element
 * @attr {string} data-position  - top|bottom|left|right(-start|-end). Default 'bottom'.
 * @attr {string} data-offset    - none|xs|s|m|l (gap, mapped to --size-* tokens)
 * @attr {string} data-anchor-name - output: the dashed-ident bound to the anchor
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

/* popover="hint" is newer than the Popover API; the IDL attribute
   reflects unknown values as "manual", which would silently drop
   light-dismiss and Escape. */
const supportsHint = (() => {
  const probe = document.createElement('span');
  probe.setAttribute('popover', 'hint');
  return /** @type {any} */ (probe).popover === 'hint';
})();

const MODES = ['auto', 'manual', 'hint'];

/** @param {string | undefined} mode */
function resolveMode(mode) {
  const m = MODES.includes(mode || '') ? /** @type {string} */ (mode) : 'auto';
  return m === 'hint' && !supportsHint ? 'auto' : m;
}

/* Inline properties the host writes on itself; teardown() clears them. */
const ANCHOR_INSET_PROPS = ['top', 'bottom', 'left', 'right', 'inset-inline-start', 'inset-inline-end'];
const FALLBACK_PROPS = ['position', 'top', 'left', 'right', 'bottom', 'margin'];
const VIEWPORT_GUTTER = 8;

let idCounter = 0;
let anchorIdentCounter = 0;

/** @param {string} value */
function parseAnchorNames(value) {
  if (!value || value === 'none') return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

class PopOver extends VBElement {
  static get observedAttributes() {
    return ['data-mode', 'data-anchor', 'data-position'];
  }

  /** @type {HTMLElement | null} */
  #anchor = null;
  /** @type {string | null} Anchor ident added to the anchor's anchor-name list. */
  #boundName = null;
  /** Stable per-instance dashed-ident (counter-based: ids may hold `.`, `:`, spaces). */
  #anchorIdent = `--pop-over-anchor-${++anchorIdentCounter}`;
  /** Whether this instance set the popover attribute (vs. the author). */
  #ownsPopover = false;
  #insetApplied = false;
  #fallbackApplied = false;

  setup() {
    if (!this.id) this.id = `pop-over-${++idCounter}`;

    /* An authored popover attribute wins at upgrade; data-mode only
       fills it in (or keeps it in step once we own it). */
    if (!this.hasAttribute('popover') || this.#ownsPopover) this.#applyMode();

    this.#resolveAnchor();
    this.#bindAnchorPositioning();

    this.listen(this, 'beforetoggle', (/** @type {any} */ e) => {
      const type = e.newState === 'open' ? 'show' : 'hide';
      this.dispatchEvent(new CustomEvent(`pop-over:${type}`, {
        detail: { state: e.newState },
        bubbles: true,
        composed: true,
      }));

      /* Fallback positioning runs only when CSS anchor positioning is
         missing. beforetoggle fires while the host is still display:none,
         so measure in a microtask — after showPopover() has rendered it
         into the top layer but before the next paint. */
      if (!supportsAnchor && e.newState === 'open' && this.#anchor) {
        queueMicrotask(() => {
          if (this.matches(':popover-open')) this.#positionFallback();
        });
      }
    });

    if (!supportsAnchor) {
      const onWindowChange = () => {
        if (this.matches(':popover-open') && this.#anchor) this.#positionFallback();
      };
      this.listen(window, 'resize', onWindowChange);
      this.listen(window, 'scroll', onWindowChange, { capture: true, passive: true });
    }
  }

  teardown() {
    this.#unbindAnchor();
    if (this.#insetApplied) {
      ANCHOR_INSET_PROPS.forEach((p) => this.style.removeProperty(p));
      this.#insetApplied = false;
    }
    if (this.#fallbackApplied) {
      FALLBACK_PROPS.forEach((p) => this.style.removeProperty(p));
      this.#fallbackApplied = false;
    }
    this.#anchor = null;
  }

  /**
   * @param {string} name
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    /* Before upgrade, setup() reads the current values. */
    if (!this.hasAttribute('data-upgraded')) {
      /* A data-mode change while disconnected should still win on
         reconnect, even over a popover attribute we set earlier. */
      if (name === 'data-mode' && this.hasAttribute('popover') && !this.isConnected) {
        this.#ownsPopover = true;
      }
      return;
    }
    if (name === 'data-mode') {
      this.#applyMode();
      return;
    }
    this._reinit();
  }

  #applyMode() {
    const mode = resolveMode(this.dataset.mode);
    if (this.getAttribute('popover') !== mode) this.setAttribute('popover', mode);
    this.#ownsPopover = true;
  }

  // ── Imperative API ───────────────────────────────────────────────────

  /** Show the popover. */
  show() {
    if (this.matches(':popover-open')) return;
    this.showPopover();
    /* Fallback: place synchronously so callers can measure right away
       (the beforetoggle microtask covers popovertarget opens). */
    if (!supportsAnchor && this.#anchor && this.matches(':popover-open')) this.#positionFallback();
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
      let found = document.getElementById(ref);
      if (!found) {
        try { found = document.querySelector(ref); } catch { found = null; }
      }
      this.#anchor = /** @type {HTMLElement | null} */ (found);
    } else {
      /* Find the trigger via popovertarget. Authors don't have to
         duplicate the anchor reference. */
      this.#anchor = /** @type {HTMLElement | null} */ (document.querySelector(`[popovertarget="${CSS.escape(this.id)}"]`));
    }
  }

  #bindAnchorPositioning() {
    if (!this.#anchor || !supportsAnchor) return;

    /* anchor-name accepts a list: append ours instead of replacing, so
       another pop-over (or an authored name) on the same anchor keeps
       working. Seed from the computed value so a stylesheet name isn't
       lost when we start writing the inline list. */
    const anchor = this.#anchor;
    const inline = anchor.style.getPropertyValue('anchor-name');
    const names = parseAnchorNames(inline || getComputedStyle(anchor).getPropertyValue('anchor-name'));
    if (!names.includes(this.#anchorIdent)) names.push(this.#anchorIdent);
    anchor.style.setProperty('anchor-name', names.join(', '));
    this.#boundName = this.#anchorIdent;

    this.style.setProperty('position-anchor', this.#anchorIdent);
    this.setAttribute('data-anchor-name', this.#anchorIdent);

    /* When position-area isn't available but anchor-name is, fall back
       to inset/anchor() arithmetic. */
    if (!supportsPositionArea) {
      this.#applyAnchorInset(this.dataset.position || 'bottom');
    }
  }

  #unbindAnchor() {
    if (this.#anchor && this.#boundName) {
      const names = parseAnchorNames(this.#anchor.style.getPropertyValue('anchor-name'))
        .filter((n) => n !== this.#boundName);
      if (names.length) this.#anchor.style.setProperty('anchor-name', names.join(', '));
      else this.#anchor.style.removeProperty('anchor-name');
    }
    this.#boundName = null;
    if (this.style.getPropertyValue('position-anchor')) this.style.removeProperty('position-anchor');
    if (this.hasAttribute('data-anchor-name')) this.removeAttribute('data-anchor-name');
  }

  /** @param {string} pos */
  #applyAnchorInset(pos) {
    const offsetVar = 'var(--_pop-over-offset, var(--size-xs))';
    /* top/bottom align on the inline axis with logical insets so the
       -start/-end variants mirror in RTL. */
    /** @type {Record<string, string>} */
    const inline = pos.endsWith('-end')
      ? { 'inset-inline-end': 'anchor(end)' }
      : { 'inset-inline-start': 'anchor(start)' };
    /** @type {Record<string, Record<string, string>>} */
    const map = {
      top:    { bottom: `calc(anchor(top) + ${offsetVar})`, ...inline },
      bottom: { top:    `calc(anchor(bottom) + ${offsetVar})`, ...inline },
      left:   { right:  `calc(anchor(left) + ${offsetVar})`, top:   'anchor(top)' },
      right:  { left:   `calc(anchor(right) + ${offsetVar})`, top:   'anchor(top)' },
    };
    const base = pos.split('-')[0];
    const rules = map[base] || map.bottom;
    Object.entries(rules).forEach(([k, v]) => this.style.setProperty(k, v));
    this.#insetApplied = true;
  }

  // ── JS-driven fallback (no anchor-positioning support) ──────────────

  #positionFallback() {
    if (!this.#anchor) return;
    const r = this.#anchor.getBoundingClientRect();
    const pos = this.dataset.position || 'bottom';
    const off = this.#offsetPx();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    /* Pin the box first so the measured size is the one it will render at. */
    this.style.position = 'fixed';
    this.style.margin = '0';
    this.style.right = 'auto';
    this.style.bottom = 'auto';
    this.#fallbackApplied = true;
    const w = this.offsetWidth;
    const h = this.offsetHeight;

    let side = pos.split('-')[0];
    if (!['top', 'bottom', 'left', 'right'].includes(side)) side = 'bottom';

    /* Flip to the opposite side when the preferred one overflows and the
       opposite has more room. */
    const room = {
      top: r.top - off,
      bottom: vh - r.bottom - off,
      left: r.left - off,
      right: vw - r.right - off,
    };
    const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    const need = side === 'top' || side === 'bottom' ? h : w;
    if (room[side] < need && room[opposite[side]] > room[side]) side = opposite[side];

    let top, left;
    switch (side) {
      case 'top':    top = r.top - h - off; left = r.left; break;
      case 'left':   top = r.top; left = r.left - w - off; break;
      case 'right':  top = r.top; left = r.right + off; break;
      default:       top = r.bottom + off; left = r.left; break;
    }
    if (side === 'top' || side === 'bottom') {
      /* -start/-end are logical: in RTL, start is the anchor's right edge. */
      const rtl = getComputedStyle(this).direction === 'rtl';
      const alignEnd = pos.endsWith('-end') !== rtl;
      left = alignEnd ? r.right - w : r.left;
    } else if (pos.endsWith('-end')) {
      top = r.bottom - h;
    }

    /* Clamp into the viewport (keep the start edge visible if it can't fit). */
    const clamp = (v, size, max) =>
      Math.max(VIEWPORT_GUTTER, Math.min(v, max - size - VIEWPORT_GUTTER));
    left = clamp(left, w, vw);
    top = clamp(top, h, vh);

    this.style.top  = `${Math.round(top)}px`;
    this.style.left = `${Math.round(left)}px`;
  }

  #offsetPx() {
    /** @type {Record<string, number>} */
    const map = { none: 0, xs: 4, s: 8, m: 16, l: 24 };
    return map[this.dataset.offset || ''] ?? map.xs;
  }
}

registerComponent('pop-over', PopOver);
