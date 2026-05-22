/**
 * gradient-builder — Interactive CSS gradient tool
 *
 * Visual gradient preview with color stop management, angle/type controls,
 * color space selection, and CSS export. Companion to palette-generator.
 *
 * @attr {string}  colors        - Comma-separated initial stop colors
 * @attr {string}  type          - "linear" (default) or "radial"
 * @attr {number}  angle         - Gradient angle in degrees (default: 90)
 * @attr {string}  interpolation - Color space: "oklab" (default), "oklch", "srgb"
 * @attr {boolean} show-export   - Show Copy CSS toolbar
 * @attr {boolean} show-controls - Show type/angle/space controls (default: true)
 *
 * @fires gradient-builder:change - { css, stops, type, angle, interpolation }
 *
 * @example
 * <gradient-builder colors="#6366f1,#ec4899" show-export></gradient-builder>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { copyText } from '../../utils/copy-init.js';
import { buildGradientCSS, parseColorStops, defaultStops } from './_gradient-utils.js';

class GradientBuilder extends VBElement {
  static observedAttributes = ['colors', 'type', 'angle', 'interpolation', 'show-export', 'show-controls'];

  /** @type {import('./_gradient-utils.js').GradientStop[]} */
  #stops = [];
  #type = 'linear';
  #angle = 90;
  #interpolation = 'oklab';

  setup() {
    this.#stops = parseColorStops(this.getAttribute('colors') ?? '');
    this.#type = this.getAttribute('type') || 'linear';
    this.#angle = Number(this.getAttribute('angle')) || 90;
    this.#interpolation = this.getAttribute('interpolation') || 'oklab';
    this.#render();
    return true;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.isConnected) return;
    if (name === 'colors') this.#stops = parseColorStops(newVal);
    if (name === 'type') this.#type = newVal || 'linear';
    if (name === 'angle') this.#angle = Number(newVal) || 90;
    if (name === 'interpolation') this.#interpolation = newVal || 'oklab';
    this.#render();
  }

  get css() {
    return buildGradientCSS(this.#stops, {
      type: this.#type,
      angle: this.#angle,
      interpolation: this.#interpolation,
    });
  }

  #render() {
    const showExport = this.hasAttribute('show-export');
    const showControls = this.getAttribute('show-controls') !== 'false';
    const css = this.css;

    const gap = 'var(--size-m, 1rem)';
    const smGap = 'var(--size-s, 0.75rem)';
    const xsGap = 'var(--size-xs, 0.5rem)';
    const radius = 'var(--radius-m, 0.5rem)';
    const border = 'var(--color-border, #ddd)';
    const surface = 'var(--color-surface, #fff)';
    const muted = 'var(--color-text-muted, #666)';
    const mono = 'var(--font-mono, monospace)';
    const smFont = 'var(--font-size-sm, 0.875rem)';
    const xsFont = 'var(--font-size-xs, 0.75rem)';

    // Preview strip
    const preview = `<div class="gb-preview" style="height:4rem;border-radius:${radius};background:${css};border:1px solid ${border}"></div>`;

    // Controls — Row 1: Type + Angle, Row 2: Color Space
    const selectStyle = `font:inherit;font-size:${smFont};padding:0.25rem 0.5rem;border:1px solid ${border};border-radius:4px;background:${surface}`;
    let controls = '';
    if (showControls) {
      controls = `<div style="display:flex;flex-direction:column;gap:${smGap};font-size:${smFont}">
        <div style="display:flex;flex-wrap:wrap;gap:${gap};align-items:center">
          <label style="display:flex;align-items:center;gap:${xsGap}">
            Type
            <select class="gb-type" style="${selectStyle}">
              <option value="linear"${this.#type === 'linear' ? ' selected' : ''}>Linear</option>
              <option value="radial"${this.#type === 'radial' ? ' selected' : ''}>Radial</option>
            </select>
          </label>
          <label style="display:flex;align-items:center;gap:${xsGap}${this.#type === 'radial' ? ';opacity:0.4;pointer-events:none' : ''}">
            Angle
            <input type="range" class="gb-angle" min="0" max="360" value="${this.#angle}" style="width:8rem;accent-color:var(--color-interactive,oklch(55% .2 260))">
            <span class="gb-angle-value" style="min-width:2.5em;font-family:${mono};font-size:${xsFont}">${this.#angle}°</span>
          </label>
        </div>
        <label style="display:inline-flex;align-items:center;gap:${xsGap}">
          Color Space
          <select class="gb-space" style="${selectStyle}">
            <option value="oklab"${this.#interpolation === 'oklab' ? ' selected' : ''}>oklab</option>
            <option value="oklch"${this.#interpolation === 'oklch' ? ' selected' : ''}>oklch</option>
            <option value="srgb"${this.#interpolation === 'srgb' ? ' selected' : ''}>sRGB</option>
          </select>
        </label>
      </div>`;
    }

    // Sort stops by position for display
    const sorted = [...this.#stops].map((s, i) => ({ ...s, origIndex: i })).sort((a, b) => a.position - b.position);

    // Stop editors — horizontal wrapping row
    const stopRows = sorted.map((stop) => {
      const i = stop.origIndex;
      return `<div style="display:flex;align-items:center;gap:0.375rem" data-stop="${i}">
        <input type="color" value="${stop.color}" class="gb-stop-color" data-i="${i}"
          style="width:1.75rem;height:1.75rem;padding:0;border:1px solid ${border};border-radius:4px;cursor:pointer;flex-shrink:0">
        <input type="range" min="0" max="100" value="${stop.position}" class="gb-stop-pos-range" data-i="${i}"
          style="flex:1;min-width:3rem;max-width:8rem;accent-color:${stop.color}">
        <span style="font-family:${mono};font-size:${xsFont};min-width:2.5em;text-align:right" class="gb-stop-pos-label" data-i="${i}">${stop.position}%</span>
        ${this.#stops.length > 2 ? `<button type="button" class="gb-remove" data-i="${i}"
          style="all:unset;cursor:pointer;font-size:1rem;color:${muted};padding:0 0.25rem" title="Remove stop">&times;</button>` : ''}
      </div>`;
    }).join('');

    const addBtn = `<button type="button" class="gb-add"
      style="all:unset;cursor:pointer;font-size:${smFont};color:var(--color-interactive,oklch(55% .2 260));font-weight:600">+ Add Stop</button>`;


    this.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:${gap}">
        ${preview}
        ${controls}
        <div style="display:flex;flex-direction:column;gap:${xsGap}">
          <span style="font-size:${xsFont};font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.05em">Color Stops</span>
          ${stopRows}
          ${addBtn}
        </div>
        <div style="display:flex;flex-direction:column;gap:${xsGap}">
          <span style="font-size:${xsFont};font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.05em">Code</span>
          <div style="display:flex;align-items:start;gap:${xsGap}">
            <div style="flex:1;font-family:${mono};font-size:${xsFont};padding:${smGap};background:var(--color-surface-raised,#f5f5f5);border-radius:${radius};word-break:break-all;color:var(--color-text,#222)" class="gb-css-output">${css}</div>
            ${showExport ? `<button type="button" class="gb-copy"
              style="all:unset;cursor:pointer;font-size:${xsFont};padding:0.35rem 0.75rem;border:1px solid ${border};border-radius:4px;background:${surface};white-space:nowrap;flex-shrink:0">Copy CSS</button>` : ''}
          </div>
        </div>
      </div>
    `;

    this.#wire();
  }

  #wire() {
    // Type select
    this.querySelector('.gb-type')?.addEventListener('change', (e) => {
      const t = /** @type {HTMLSelectElement} */ (e.target);
      this.#type = t.value;
      this.#render();
      this.#emit();
    });

    // Angle slider
    const angleInput = this.querySelector('.gb-angle');
    const angleValue = this.querySelector('.gb-angle-value');
    angleInput?.addEventListener('input', (e) => {
      const t = /** @type {HTMLInputElement} */ (e.target);
      this.#angle = Number(t.value);
      if (angleValue) angleValue.textContent = `${this.#angle}°`;
      // Live update preview without full re-render
      const preview = /** @type {HTMLElement | null} */ (this.querySelector('.gb-preview'));
      if (preview) preview.style.background = this.css;
      this.#emit();
    });

    // Interpolation select
    this.querySelector('.gb-space')?.addEventListener('change', (e) => {
      const t = /** @type {HTMLSelectElement} */ (e.target);
      this.#interpolation = t.value;
      this.#render();
      this.#emit();
    });

    // Stop color inputs
    this.querySelectorAll('.gb-stop-color').forEach((input) => {
      input.addEventListener('input', (e) => {
        const t = /** @type {HTMLInputElement} */ (e.target);
        const i = Number(t.dataset.i);
        this.#stops[i].color = t.value;
        this.#updatePreview();
        this.#emit();
      });
    });

    // Stop position range sliders
    this.querySelectorAll('.gb-stop-pos-range').forEach((input) => {
      input.addEventListener('input', (e) => {
        const t = /** @type {HTMLInputElement} */ (e.target);
        const i = Number(t.dataset.i);
        const val = Math.max(0, Math.min(100, Number(t.value) || 0));
        this.#stops[i].position = val;
        const label = this.querySelector(`.gb-stop-pos-label[data-i="${i}"]`);
        if (label) label.textContent = `${val}%`;
        this.#updatePreview();
        this.#emit();
      });
    });

    // Remove stop buttons
    this.querySelectorAll('.gb-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const t = /** @type {HTMLElement} */ (e.target);
        const i = Number(t.dataset.i);
        this.#stops.splice(i, 1);
        this.#render();
        this.#emit();
      });
    });

    // Add stop button
    this.querySelector('.gb-add')?.addEventListener('click', () => {
      // Insert a new stop at the midpoint between the last two stops
      const last = this.#stops[this.#stops.length - 1];
      const prev = this.#stops[this.#stops.length - 2];
      const pos = Math.round((prev.position + last.position) / 2);
      this.#stops.splice(this.#stops.length - 1, 0, { color: '#888888', position: pos });
      this.#render();
      this.#emit();
    });

    // Copy CSS button
    this.querySelector('.gb-copy')?.addEventListener('click', (e) => {
      const btn = /** @type {HTMLElement | null} */ (e.target);
      if (!btn) return;
      copyText(this.css, { button: btn, announceMessage: 'Gradient CSS copied' });
    });
  }

  #updatePreview() {
    const css = this.css;
    const preview = /** @type {HTMLElement | null} */ (this.querySelector('.gb-preview'));
    if (preview) preview.style.background = css;
    const output = this.querySelector('.gb-css-output');
    if (output) output.textContent = css;
  }

  #emit() {
    this.dispatchEvent(new CustomEvent('gradient-builder:change', {
      bubbles: true,
      detail: {
        css: this.css,
        stops: [...this.#stops],
        type: this.#type,
        angle: this.#angle,
        interpolation: this.#interpolation,
      },
    }));
  }
}

registerComponent('gradient-builder', GradientBuilder);
export { GradientBuilder };
