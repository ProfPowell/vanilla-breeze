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
import { ColorPalette } from '../color-palette/logic.js';
import { generatePalette } from './_palette-utils.js';

class PaletteGenerator extends ColorPalette {
  static observedAttributes = [
    ...ColorPalette.observedAttributes,
    'seed', 'harmony', 'include-seed', 'show-export',
  ];

  /** @type {HTMLElement|null} */
  #pickerEl = null;
  /** @type {string} */
  #currentSeed = '';

  setup() {
    // Capture child picker before parent render wipes innerHTML
    this.#pickerEl = this.querySelector('color-picker') || this.querySelector('input[type="color"]');
    const pickerMarkup = this.#pickerEl ? this.#pickerEl.outerHTML : '';

    // Resolve seed: child input takes priority over attribute
    this.#currentSeed = this.#resolveSeed();
    if (!this.#currentSeed) return;

    // Generate palette and set colors/names for parent to render
    const harmony = this.getAttribute('harmony') || 'complementary';
    const { colors, names } = generatePalette(this.#currentSeed, harmony);
    this.setAttribute('colors', colors.join(','));
    this.setAttribute('names', names.join(','));

    // Let ColorPalette render the swatches
    super.setup();

    // Prepend picker area if interactive
    if (pickerMarkup) {
      const pickerArea = document.createElement('div');
      pickerArea.className = 'pg-seed-picker';
      pickerArea.innerHTML = pickerMarkup;
      this.prepend(pickerArea);
      this.#wireInteractive(pickerArea);
    }

    // Append export toolbar if requested
    if (this.hasAttribute('show-export')) {
      this.#renderExportToolbar(colors, harmony);
    }

    this.dispatchEvent(new CustomEvent('palette-generator:generate', {
      bubbles: true,
      detail: { colors, harmony, seed: this.#currentSeed },
    }));
  }

  attributeChangedCallback(name) {
    // Only regenerate for our own attributes; parent handles its own
    if (['seed', 'harmony', 'include-seed', 'show-export'].includes(name) && this.isConnected) {
      this.#regenerate();
    } else {
      super.attributeChangedCallback(name);
    }
  }

  /** Extract seed hex from child input or attribute */
  #resolveSeed() {
    if (this.#pickerEl) {
      const cp = this.#pickerEl;
      if (cp.tagName === 'COLOR-PICKER') {
        return cp.value || cp.querySelector('input')?.value || '';
      }
      return cp.value || '';
    }
    return this.getAttribute('seed') || '';
  }

  /** Wire up interactive picker for live regeneration */
  #wireInteractive(pickerArea) {
    const cp = pickerArea.querySelector('color-picker');
    if (cp) {
      this.listen(cp, 'color-picker:change', (e) => {
        this.#currentSeed = e.detail.hex;
        this.#regenerate();
      });
      // Store ref for future seed resolution
      this.#pickerEl = cp;
    } else {
      const input = pickerArea.querySelector('input[type="color"]');
      if (input) {
        this.listen(input, 'input', () => {
          this.#currentSeed = input.value;
          this.#regenerate();
        });
        this.#pickerEl = input;
      }
    }
  }

  /** Regenerate palette from current seed without full teardown */
  #regenerate() {
    const seed = this.#pickerEl ? this.#resolveSeed() : (this.getAttribute('seed') || '');
    if (!seed) return;
    this.#currentSeed = seed;

    const harmony = this.getAttribute('harmony') || 'complementary';
    const { colors, names } = generatePalette(seed, harmony);

    // Save and restore picker area
    const pickerArea = this.querySelector('.pg-seed-picker');
    const pickerMarkup = pickerArea ? pickerArea.outerHTML : '';

    this.setAttribute('colors', colors.join(','));
    this.setAttribute('names', names.join(','));

    // Find the palette div rendered by parent and re-render just it
    const paletteDiv = this.querySelector('.palette');
    if (paletteDiv) {
      // Trigger parent re-render by calling setup on the palette portion
      // We need to let the parent re-render, then restore our additions
    }

    // Full re-render: remove non-picker children, let parent re-render
    const children = [...this.children];
    for (const child of children) {
      if (!child.classList.contains('pg-seed-picker')) {
        child.remove();
      }
    }

    // Temporarily remove picker to let parent render clean
    if (pickerArea) pickerArea.remove();

    // Re-run parent setup to render swatches
    this.removeAttribute('data-upgraded');
    super.setup();
    this.setAttribute('data-upgraded', '');

    // Restore picker
    if (pickerMarkup) {
      const restored = document.createElement('div');
      restored.className = 'pg-seed-picker';
      restored.innerHTML = pickerMarkup;
      this.prepend(restored);
      this.#wireInteractive(restored);
    }

    // Re-add export toolbar
    if (this.hasAttribute('show-export')) {
      this.#renderExportToolbar(colors, harmony);
    }

    this.dispatchEvent(new CustomEvent('palette-generator:generate', {
      bubbles: true,
      detail: { colors, harmony, seed },
    }));
  }

  /** Render the export toolbar below the palette */
  #renderExportToolbar(colors, harmony) {
    const existing = this.querySelector('.pg-export');
    if (existing) existing.remove();

    const toolbar = document.createElement('div');
    toolbar.className = 'pg-export';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Export palette');
    toolbar.style.cssText = 'display:flex;gap:0.5rem;margin-block-start:var(--size-xs,0.5rem)';

    const btnStyle = 'padding:0.25rem 0.75rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface,#fff);color:var(--color-text,#333);cursor:pointer;font-size:var(--font-size-xs,0.75rem);font-family:inherit';

    // Copy Hex button
    const hexBtn = document.createElement('button');
    hexBtn.type = 'button';
    hexBtn.textContent = 'Copy Hex';
    hexBtn.style.cssText = btnStyle;
    hexBtn.addEventListener('click', () => {
      navigator.clipboard?.writeText(colors.join(', '));
      this.#copyFeedback(hexBtn, 'Copy Hex');
    });

    // Copy CSS button
    const cssBtn = document.createElement('button');
    cssBtn.type = 'button';
    cssBtn.textContent = 'Copy CSS';
    cssBtn.style.cssText = btnStyle;
    cssBtn.addEventListener('click', () => {
      const css = this.#formatCSSExport(colors, harmony);
      navigator.clipboard?.writeText(css);
      this.#copyFeedback(cssBtn, 'Copy CSS');
    });

    toolbar.append(hexBtn, cssBtn);
    this.append(toolbar);
  }

  /** Format colors as CSS custom properties */
  #formatCSSExport(colors, harmony) {
    const names = (this.getAttribute('names') || '').split(',').map(n => n.trim());
    if (harmony === 'monochromatic') {
      return colors.map((c, i) => `--color-seed-${names[i] || i + 1}: ${c};`).join('\n');
    }
    return colors.map((c, i) => {
      const name = names[i] ? names[i].toLowerCase().replace(/\s+/g, '-') : `${i + 1}`;
      return `--palette-${name}: ${c};`;
    }).join('\n');
  }

  /** Button copy feedback — swap text for 1.5s */
  #copyFeedback(btn, originalText) {
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = originalText; }, 1500);
  }
}

registerComponent('palette-generator', PaletteGenerator);
