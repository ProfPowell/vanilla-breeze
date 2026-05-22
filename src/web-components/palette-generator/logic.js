/**
 * palette-generator: Generate color palettes from a seed color
 *
 * Extends color-palette with algorithmic palette generation.
 * Accepts a seed color (via attribute or child input/color-picker)
 * and a harmony type to produce harmonious color swatches.
 *
 * @attr {string} seed - Hex seed color (e.g. "#6366f1"). Overridden by child input if present
 * @attr {string} harmony - Algorithm: complementary, analogous, triadic, split-complementary, tetradic, monochromatic
 * @attr {boolean} include-seed - Whether the seed appears in the palette (default: true, implicit)
 * @attr {boolean} show-export - Show Copy Hex / Copy CSS toolbar below the palette
 * @attr {string} layout - Inherited: "inline" (default), "grid", "list"
 * @attr {string} size - Inherited: "sm", "md" (default), "lg"
 * @attr {boolean} show-values - Inherited: always show hex values on swatches
 * @attr {boolean} show-names - Inherited: show name labels
 *
 * @fires palette-generator:generate - When palette is computed, detail: { colors, harmony, seed }
 * @fires color-palette:select - Inherited: when a swatch is clicked
 *
 * @example
 * <palette-generator seed="#6366f1" harmony="triadic" show-values></palette-generator>
 *
 * @example Interactive with color-picker
 * <palette-generator harmony="analogous" show-export>
 *   <color-picker><input type="color" value="#6366f1"></color-picker>
 * </palette-generator>
 */
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { copyText } from '../../utils/copy-init.js';
import { generatePalette } from './_palette-utils.js';
import { hexToRgb } from '../color-picker/_color-utils.js';

class PaletteGenerator extends VBElement {
  static observedAttributes = ['seed', 'harmony', 'include-seed', 'show-export',
    'layout', 'size', 'show-values', 'show-names'];

  /** @type {HTMLElement|null} */
  #pickerEl = null;
  /** @type {string} */
  #currentSeed = '';
  /** @type {string[]} */
  #colors = [];
  /** @type {string[]} */
  #names = [];

  setup() {
    // Find child picker — do NOT detach it
    this.#pickerEl = this.querySelector('color-picker') || this.querySelector('input[type="color"]');

    // Resolve seed
    this.#currentSeed = this.#resolveSeed();
    if (!this.#currentSeed) return;

    this.#render();
    this.#wireInteractive();
    this.#emitGenerate();
  }

  attributeChangedCallback() {
    if (this.isConnected && this.hasAttribute('data-upgraded')) {
      this.#currentSeed = this.#resolveSeed();
      if (this.#currentSeed) this.#render();
    }
  }

  /** Extract seed hex from the picker element or seed attribute */
  #resolveSeed() {
    if (this.#pickerEl) {
      const cp = /** @type {any} */ (this.#pickerEl);
      if (cp.tagName === 'COLOR-PICKER') {
        // Try upgraded getter first, fall back to inner input
        const val = cp.value;
        if (val && val !== '#000000') return val;
        const input = /** @type {HTMLInputElement | null} */ (cp.querySelector('input[type="color"]'));
        return input?.value || val || '';
      }
      return cp.value || '';
    }
    return this.getAttribute('seed') || '';
  }

  /** Render the full component: picker area + swatches + export toolbar */
  #render() {
    const harmony = this.getAttribute('harmony') || 'complementary';
    const layout = this.getAttribute('layout') || 'inline';
    const size = this.getAttribute('size') || 'md';
    const showValues = this.hasAttribute('show-values');
    const showNames = this.hasAttribute('show-names');
    const showExport = this.hasAttribute('show-export');

    const { colors, names } = generatePalette(this.#currentSeed, harmony);
    this.#colors = colors;
    this.#names = names;

    const sizes = { sm: 48, md: 80, lg: 120 };
    const px = sizes[size] || 80;

    // Build swatch HTML (same rendering as color-palette)
    let containerStyle = `display:flex;flex-wrap:wrap;gap:var(--size-xs,0.5rem)`;
    if (layout === 'grid') {
      containerStyle = `display:grid;grid-template-columns:repeat(auto-fill,minmax(${px}px,1fr));gap:var(--size-xs,0.5rem)`;
    } else if (layout === 'list') {
      containerStyle = `display:flex;flex-direction:column;gap:var(--size-xs,0.5rem)`;
    }

    const swatches = colors.map((color, i) => {
      const name = names[i] || '';
      const contrast = this.#contrastColor(color);
      const wrapStyle = layout === 'list'
        ? `display:flex;flex-direction:row;align-items:center;gap:0.75rem`
        : `display:flex;flex-direction:column;align-items:center;gap:0.25rem;max-inline-size:${px}px`;
      const boxSize = layout === 'list' ? 36 : px;
      const formatted = color.length > 12 ? color.slice(0, 12) + '\u2026' : color;

      return `<div class="swatch-wrap" role="listitem" style="${wrapStyle}">
        <button type="button" class="color-box" data-index="${i}"
          style="background:${color};color:${contrast};width:${boxSize}px;height:${boxSize}px;border:1px solid oklch(0% 0 0/0.15);border-radius:var(--radius-s,0.25rem);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:var(--font-mono,monospace);position:relative;overflow:hidden;flex-shrink:0"
          title="Click to copy${name ? ': ' + name : ''}"
          aria-label="${name || 'Color ' + (i + 1)}: ${color}">
          <span class="color-value" style="font-size:0.625rem;line-height:1.2;opacity:${showValues ? '1' : '0'};text-align:center;padding:2px 4px;word-break:break-all;transition:opacity 0.15s ease">${formatted}</span>
        </button>
        ${showNames && name ? `<span style="font-size:var(--font-size-xs,0.75rem);color:var(--color-text-muted,#666);text-align:center;max-inline-size:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>` : ''}
      </div>`;
    }).join('');

    // Build export toolbar HTML
    let exportHTML = '';
    if (showExport) {
      exportHTML = `<div class="pg-export" role="toolbar" aria-label="Export palette" style="display:flex;gap:0.5rem;margin-block-start:var(--size-xs,0.5rem)">
        <button type="button" class="pg-copy-hex" style="padding:0.25rem 0.75rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface,#fff);color:var(--color-text,#333);cursor:pointer;font-size:var(--font-size-xs,0.75rem);font-family:inherit">Copy Hex</button>
        <button type="button" class="pg-copy-css" style="padding:0.25rem 0.75rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface,#fff);color:var(--color-text,#333);cursor:pointer;font-size:var(--font-size-xs,0.75rem);font-family:inherit">Copy CSS</button>
      </div>`;
    }

    // Remove everything except the picker, then insert palette + export
    const pickerEl = this.#pickerEl;
    for (const child of [...this.children]) {
      if (child === pickerEl) continue;
      if (child.classList?.contains('pg-seed-label')) continue;
      child.remove();
    }

    // Add a label before the picker (once only — never move the picker)
    if (pickerEl && !this.querySelector('.pg-seed-label')) {
      const label = document.createElement('span');
      label.className = 'pg-seed-label';
      label.textContent = 'Seed Color';
      pickerEl.before(label);
    }

    // Insert palette after picker (or at start if no picker)
    const paletteDiv = document.createElement('div');
    paletteDiv.className = `palette ${layout}`;
    paletteDiv.setAttribute('role', 'list');
    paletteDiv.setAttribute('aria-label', 'Color palette');
    paletteDiv.style.cssText = containerStyle;
    paletteDiv.innerHTML = swatches;

    if (pickerEl) {
      pickerEl.after(paletteDiv);
    } else {
      this.prepend(paletteDiv);
    }

    // Insert export toolbar
    if (exportHTML) {
      const tmp = document.createElement('div');
      tmp.innerHTML = exportHTML;
      if (tmp.firstElementChild) this.append(tmp.firstElementChild);
    }

    // Wire swatch interactions
    this.#wireSwatches(paletteDiv, colors, names, showValues);

    // Wire export buttons
    if (showExport) {
      this.#wireExport();
    }
  }

  /** Wire click-to-copy and hover on swatches */
  #wireSwatches(container, colors, names, showValues) {
    container.querySelectorAll('.color-box').forEach((el) => {
      const btn = /** @type {HTMLElement} */ (el);
      if (!showValues) {
        btn.addEventListener('pointerenter', () => {
          const val = /** @type {HTMLElement | null} */ (btn.querySelector('.color-value'));
          if (val) val.style.opacity = '1';
        });
        btn.addEventListener('pointerleave', () => {
          const val = /** @type {HTMLElement | null} */ (btn.querySelector('.color-value'));
          if (val) val.style.opacity = '0';
        });
      }

      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        const color = colors[idx];
        const name = names[idx] || '';
        copyText(color, { button: btn, announceMessage: 'Color copied' });
        this.dispatchEvent(new CustomEvent('color-palette:select', {
          bubbles: true, detail: { color, name, index: idx },
        }));
        btn.style.outline = '3px solid currentColor';
        btn.style.outlineOffset = '2px';
        setTimeout(() => { btn.style.outline = ''; btn.style.outlineOffset = ''; }, 600);
      });
    });
  }

  /** Wire up interactive picker for live regeneration */
  #wireInteractive() {
    const cp = this.#pickerEl;
    if (!cp) return;

    if (cp.tagName === 'COLOR-PICKER') {
      this.listen(cp, 'color-picker:change', (e) => {
        this.#currentSeed = /** @type {CustomEvent} */ (e).detail.hex;
        this.#render();
        this.#emitGenerate();
      });
    } else {
      this.listen(cp, 'input', () => {
        this.#currentSeed = /** @type {any} */ (cp).value;
        this.#render();
        this.#emitGenerate();
      });
    }
  }

  /** Wire export toolbar buttons */
  #wireExport() {
    const hexBtn = this.querySelector('.pg-copy-hex');
    const cssBtn = this.querySelector('.pg-copy-css');

    if (hexBtn) {
      hexBtn.addEventListener('click', () => {
        copyText(this.#colors.join(', '), {
          button: /** @type {HTMLElement} */ (hexBtn),
          announceMessage: 'Hex values copied',
        });
      });
    }

    if (cssBtn) {
      cssBtn.addEventListener('click', () => {
        const harmony = this.getAttribute('harmony') || 'complementary';
        const css = this.#formatCSSExport(harmony);
        copyText(css, {
          button: /** @type {HTMLElement} */ (cssBtn),
          announceMessage: 'CSS variables copied',
        });
      });
    }
  }

  /** Return black or white depending on perceived lightness */
  #contrastColor(color) {
    if (color.startsWith('#')) {
      const { r, g, b } = hexToRgb(color);
      const lum = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
      return lum > 0.4 ? '#000' : '#fff';
    }
    return '#000';
  }

  /** Format colors as CSS custom properties */
  #formatCSSExport(harmony) {
    if (harmony === 'monochromatic') {
      return this.#colors.map((c, i) => `--color-seed-${this.#names[i] || i + 1}: ${c};`).join('\n');
    }
    return this.#colors.map((c, i) => {
      const name = this.#names[i] ? this.#names[i].toLowerCase().replace(/\s+/g, '-') : `${i + 1}`;
      return `--palette-${name}: ${c};`;
    }).join('\n');
  }

  #emitGenerate() {
    const harmony = this.getAttribute('harmony') || 'complementary';
    this.dispatchEvent(new CustomEvent('palette-generator:generate', {
      bubbles: true,
      detail: { colors: [...this.#colors], harmony, seed: this.#currentSeed },
    }));
  }
}

registerComponent('palette-generator', PaletteGenerator);
