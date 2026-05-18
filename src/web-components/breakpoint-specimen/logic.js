/**
 * breakpoint-specimen: Responsive breakpoint visualization
 *
 * Joins the specimen family (spacing, type, motion, token). Renders a
 * ruler of viewport breakpoints with a live cursor at the current
 * width and the active breakpoint label called out.
 *
 * Reads --bp-* tokens from :root by default; can be given an explicit
 * tokens list. Tracks the viewport (window) by default; data-observe
 * accepts a CSS selector to track an arbitrary container instead.
 *
 * Progressive enhancement:
 *   1. HTML — a semantic <dl> of breakpoint name → value remains
 *      readable without JS or CSS.
 *   2. CSS  — pure-CSS active-row highlighting via @media rules pulls
 *      the matching token into a callout, no JS required for the
 *      "which breakpoint is active" cue (viewport mode only).
 *   3. JS   — adds the live numeric width readout and the moving
 *      cursor on the ruler, plus container-query mode (data-observe).
 *
 * @attr {string} tokens   - Comma-separated breakpoint names
 *                           (default: "sm,md,lg,xl")
 * @attr {string} prefix   - CSS variable prefix (default: "--bp-")
 * @attr {string} label    - Optional heading label
 * @attr {string} data-observe - CSS selector of a container to track
 *                               instead of the viewport. JS-only.
 *
 * @example
 * <breakpoint-specimen></breakpoint-specimen>
 * <breakpoint-specimen tokens="sm,md,lg" label="Core breakpoints"></breakpoint-specimen>
 * <breakpoint-specimen data-observe="#preview-frame"></breakpoint-specimen>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class BreakpointSpecimen extends VBElement {
  static observedAttributes = ['tokens', 'prefix', 'label', 'data-observe'];

  setup() {
    this.#render();
    this.#start();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.#stop();
      this.#render();
      this.#start();
    }
  }

  teardown() {
    this.#stop();
  }

  #render() {
    const tokensAttr = this.getAttribute('tokens') || 'sm,md,lg,xl';
    const prefix = this.getAttribute('prefix') || '--bp-';
    const label = this.getAttribute('label') || '';
    const names = tokensAttr.split(',').map((t) => t.trim()).filter(Boolean);

    const cs = getComputedStyle(document.documentElement);
    const stops = names
      .map((name) => {
        const raw = cs.getPropertyValue(`${prefix}${name}`).trim();
        const px = this.#toPx(raw);
        return { name, raw, px };
      })
      .filter((s) => s.px > 0)
      .sort((a, b) => a.px - b.px);

    this.#stops = stops;
    this.#max = stops.length ? stops[stops.length - 1].px * 1.15 : 1;

    const labelHTML = label ? `<header class="bps-label">${label}</header>` : '';

    const readoutHTML = `
      <output class="bps-readout" aria-live="polite">
        <span class="bps-width">—</span>
        <span class="bps-active" data-active="">—</span>
      </output>
    `;

    const rulerHTML = `
      <figure class="bps-ruler" aria-hidden="true">
        <span class="bps-cursor" data-cursor></span>
        ${stops.map((s) => `
          <span class="bps-stop" style="--bps-pos:${(s.px / this.#max) * 100}%" data-bp="${s.name}">
            <span class="bps-tick"></span>
            <span class="bps-stop-label">${s.name}<br><small>${Math.round(s.px)}px</small></span>
          </span>
        `).join('')}
      </figure>
    `;

    const tableHTML = `
      <dl class="bps-list">
        ${stops.map((s) => `
          <div class="bps-row" data-bp="${s.name}">
            <dt>${s.name}</dt>
            <dd><code>${s.raw}</code> — ${Math.round(s.px)}px and up</dd>
          </div>
        `).join('')}
      </dl>
    `;

    this.innerHTML = `${labelHTML}${readoutHTML}${rulerHTML}${tableHTML}`;
    this.#widthEl = /** @type {HTMLElement | null} */ (this.querySelector('.bps-width'));
    this.#activeEl = /** @type {HTMLElement | null} */ (this.querySelector('.bps-active'));
    this.#cursorEl = /** @type {HTMLElement | null} */ (this.querySelector('[data-cursor]'));
  }

  #start() {
    const sel = this.getAttribute('data-observe');
    if (sel) {
      const target = document.querySelector(sel);
      if (!target) return;
      this.#ro = new ResizeObserver(() => this.#update(target.clientWidth));
      this.#ro.observe(target);
      this.#update(target.clientWidth);
      return;
    }
    const update = () => this.#update(window.innerWidth);
    update();
    this.listen(window, 'resize', update, { passive: true });
  }

  #stop() {
    if (this.#ro) {
      this.#ro.disconnect();
      this.#ro = null;
    }
  }

  #update(width) {
    if (!this.#widthEl || !this.#activeEl) return;
    this.#widthEl.textContent = `${Math.round(width)}px`;
    const active = this.#activeFor(width);
    this.#activeEl.textContent = active ? active.name : 'base';
    this.#activeEl.dataset.active = active ? active.name : '';
    if (this.#cursorEl) {
      const pct = Math.min(100, (width / this.#max) * 100);
      this.#cursorEl.style.setProperty('--bps-pos', `${pct}%`);
    }
    this.querySelectorAll('[data-bp]').forEach((el) => {
      const matches = active && el.getAttribute('data-bp') === active.name;
      el.toggleAttribute('data-current', !!matches);
    });
  }

  #activeFor(width) {
    let match = null;
    for (const stop of this.#stops) {
      if (width >= stop.px) match = stop;
    }
    return match;
  }

  #toPx(value) {
    if (!value) return 0;
    const n = parseFloat(value);
    if (Number.isNaN(n)) return 0;
    if (value.endsWith('rem') || value.endsWith('em')) {
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      return n * root;
    }
    return n;
  }

  /** @type {Array<{name: string, raw: string, px: number}>} */
  #stops = [];
  #max = 1;
  /** @type {ResizeObserver | null} */
  #ro = null;
  /** @type {HTMLElement | null} */
  #widthEl = null;
  /** @type {HTMLElement | null} */
  #activeEl = null;
  /** @type {HTMLElement | null} */
  #cursorEl = null;
}

registerComponent('breakpoint-specimen', BreakpointSpecimen);

export { BreakpointSpecimen };
