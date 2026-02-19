/**
 * color-palette-wc: Interactive color swatch display
 *
 * Renders a row/grid of color swatches from a comma-separated list.
 * Supports hex, rgb, hsl, and oklch color formats. Click to copy.
 *
 * @attr {string} colors - Comma-separated color values (hex, rgb, oklch, etc.)
 * @attr {string} names - Comma-separated swatch labels (optional)
 * @attr {string} layout - Display mode: "inline" (default), "grid", "list"
 * @attr {boolean} show-values - Show color value text below swatches
 * @attr {boolean} show-names - Show name labels above swatches
 * @attr {string} size - Swatch size: "sm", "md" (default), "lg"
 *
 * @fires color-selected - When a swatch is clicked, detail: { color, name, index }
 *
 * @example
 * <color-palette-wc colors="#ff6b6b,#4ecdc4,#45b7d1" names="Red,Teal,Sky"></color-palette-wc>
 * <color-palette-wc colors="oklch(50% 0.2 260),oklch(65% 0.18 30)" layout="grid" show-values></color-palette-wc>
 */
class ColorPaletteWc extends HTMLElement {
  static observedAttributes = ['colors', 'names', 'layout', 'show-values', 'show-names', 'size'];

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  #render() {
    const colorsRaw = this.getAttribute('colors') || '';
    const namesRaw = this.getAttribute('names') || '';
    const layout = this.getAttribute('layout') || 'inline';
    const size = this.getAttribute('size') || 'md';
    const showValues = this.hasAttribute('show-values');
    const showNames = this.hasAttribute('show-names');

    // Parse colors — handle oklch() which contains commas
    const colors = this.#parseColorList(colorsRaw);
    const names = namesRaw ? namesRaw.split(',').map(n => n.trim()) : [];

    const sizes = { sm: 32, md: 48, lg: 72 };
    const px = sizes[size] || 48;

    const swatches = colors.map((color, i) => {
      const name = names[i] || '';
      const contrast = this.#contrastColor(color);
      return `<button type="button" class="swatch" data-index="${i}"
        style="background:${color};color:${contrast};width:${px}px;height:${px}px"
        title="${name ? name + ': ' : ''}${color}"
        aria-label="${name || 'Color ' + (i + 1)}: ${color}">
        ${showNames && name ? `<span class="name">${name}</span>` : ''}
        ${showValues ? `<span class="value">${color}</span>` : ''}
      </button>`;
    }).join('');

    this.innerHTML = `<div class="palette ${layout}" role="group" aria-label="Color palette">${swatches}</div>`;

    // Click handler — copy + dispatch event
    this.querySelectorAll('.swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        const color = colors[idx];
        const name = names[idx] || '';

        navigator.clipboard?.writeText(color);
        this.dispatchEvent(new CustomEvent('color-selected', {
          bubbles: true, detail: { color, name, index: idx }
        }));

        // Flash feedback
        btn.style.outline = '3px solid currentColor';
        btn.style.outlineOffset = '2px';
        setTimeout(() => { btn.style.outline = ''; btn.style.outlineOffset = ''; }, 400);
      });
    });
  }

  /** Parse comma-separated color list, handling oklch() which contains commas */
  #parseColorList(raw) {
    if (!raw) return [];
    const colors = [];
    let depth = 0;
    let current = '';
    for (const ch of raw) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      if (ch === ',' && depth === 0) {
        colors.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) colors.push(current.trim());
    return colors;
  }

  /** Return black or white depending on perceived lightness */
  #contrastColor(color) {
    // For oklch, parse lightness directly
    const oklchMatch = color.match(/oklch\(\s*([\d.]+)%?\s/);
    if (oklchMatch) {
      const L = parseFloat(oklchMatch[1]);
      // If L is 0-1 range vs 0-100 range
      const lightness = L > 1 ? L / 100 : L;
      return lightness > 0.6 ? '#000' : '#fff';
    }
    // For hex
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return lum > 0.4 ? '#000' : '#fff';
    }
    return '#000';
  }
}

customElements.define('color-palette-wc', ColorPaletteWc);
