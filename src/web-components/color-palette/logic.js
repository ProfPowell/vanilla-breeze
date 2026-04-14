/**
 * color-palette: Interactive color swatch display
 *
 * Renders a row/grid of color swatches from a comma-separated list.
 * Supports hex, rgb, hsl, and oklch color formats. Click to copy.
 * Names appear below swatches; hex values appear on hover inside.
 * All layout styles are inline so the component works without external CSS.
 *
 * @attr {string} colors - Comma-separated color values (hex, rgb, oklch, etc.)
 * @attr {string} names - Comma-separated swatch labels (optional)
 * @attr {string} layout - Display mode: "inline" (default), "grid", "list"
 * @attr {boolean} show-values - Always show color values (otherwise hover-only)
 * @attr {boolean} show-names - Show name labels below swatches (auto-enabled if names attr set)
 * @attr {string} size - Swatch size: "sm", "md" (default), "lg"
 *
 * @fires color-palette:select - When a swatch is clicked, detail: { color, name, index }
 *
 * @example
 * <color-palette colors="#ff6b6b,#4ecdc4,#45b7d1" names="Red,Teal,Sky"></color-palette>
 * <color-palette colors="oklch(50% 0.2 260),oklch(65% 0.18 30)" layout="grid" show-values></color-palette>
 */
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

export class ColorPalette extends VBElement {
  static observedAttributes = ['colors', 'names', 'layout', 'show-values', 'show-names', 'size'];

  setup() {
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
    const showNames = this.hasAttribute('show-names') || namesRaw.length > 0;

    const colors = this.#parseColorList(colorsRaw);
    const names = namesRaw ? namesRaw.split(',').map(n => n.trim()) : [];

    const sizes = { sm: 48, md: 80, lg: 120 };
    const px = sizes[size] || 80;

    // Layout styles — inline so no external CSS needed
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

      return `<div class="swatch-wrap" role="listitem" style="${wrapStyle}">
        <button type="button" class="color-box" data-index="${i}"
          style="background:${color};color:${contrast};width:${boxSize}px;height:${boxSize}px;border:1px solid oklch(0% 0 0/0.15);border-radius:var(--radius-s,0.25rem);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:var(--font-mono,monospace);position:relative;overflow:hidden;flex-shrink:0"
          title="Click to copy${name ? ': ' + name : ''}"
          aria-label="${name || 'Color ' + (i + 1)}: ${color}">
          <span class="color-value" style="font-size:0.625rem;line-height:1.2;opacity:${showValues ? '1' : '0'};text-align:center;padding:2px 4px;word-break:break-all;transition:opacity 0.15s ease">${this.#formatValue(color)}</span>
        </button>
        ${showNames && name ? `<span style="font-size:var(--font-size-xs,0.75rem);color:var(--color-text-muted,#666);text-align:center;max-inline-size:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>` : ''}
      </div>`;
    }).join('');

    this.innerHTML = `<div class="palette ${layout}" role="list" aria-label="Color palette" style="${containerStyle}">${swatches}</div>`;

    // Resolve var() references to computed values
    this.#resolveVarColors(colors, names);

    // Hover effect for value reveal + copy handler
    this.querySelectorAll('.color-box').forEach((/** @type {HTMLElement} */ btn) => {
      // Hover: show value
      if (!showValues) {
        btn.addEventListener('pointerenter', () => {
          const val = btn.querySelector('.color-value');
          if (val) val.style.opacity = '1';
        });
        btn.addEventListener('pointerleave', () => {
          const val = btn.querySelector('.color-value');
          if (val) val.style.opacity = '0';
        });
      }

      // Click: copy + feedback
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        const color = colors[idx];
        const name = names[idx] || '';

        navigator.clipboard?.writeText(color);
        this.dispatchEvent(new CustomEvent('color-palette:select', {
          bubbles: true, detail: { color, name, index: idx }
        }));

        btn.style.outline = '3px solid currentColor';
        btn.style.outlineOffset = '2px';
        setTimeout(() => { btn.style.outline = ''; btn.style.outlineOffset = ''; }, 600);
      });
    });
  }

  /** Resolve var() references to computed hex after swatches are in the DOM */
  #resolveVarColors(colors, names) {
    this.querySelectorAll('.color-box').forEach((/** @type {HTMLElement} */ btn) => {
      const idx = Number(btn.dataset.index);
      const raw = colors[idx];
      if (!raw || !raw.includes('var(')) return;

      const computed = getComputedStyle(btn).backgroundColor;
      const hex = this.#rgbToHex(computed) || computed;
      colors[idx] = hex;

      const val = btn.querySelector('.color-value');
      if (val) val.textContent = hex;

      btn.style.color = this.#contrastColor(hex);
      const name = names[idx] || '';
      btn.title = `Click to copy${name ? ': ' + name : ''} (${hex})`;
      btn.setAttribute('aria-label', `${name || 'Color ' + (idx + 1)}: ${hex}`);
    });
  }

  /** Convert rgb(r, g, b) to hex string */
  #rgbToHex(rgb) {
    const m = rgb.match(/rgba?\(\s*([\d.]+),?\s*([\d.]+),?\s*([\d.]+)/);
    if (!m) return null;
    const [, r, g, b] = m;
    const toHex = (n) => Math.round(Number(n)).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /** Shorten oklch values for display */
  #formatValue(color) {
    if (color.startsWith('#')) return color;
    const oklch = color.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/);
    if (oklch) return `${oklch[1]}% .${oklch[2].replace('0.', '')}`;
    return color.length > 12 ? color.slice(0, 12) + '…' : color;
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
    const oklchMatch = color.match(/oklch\(\s*([\d.]+)%?\s/);
    if (oklchMatch) {
      const L = parseFloat(oklchMatch[1]);
      const lightness = L > 1 ? L / 100 : L;
      return lightness > 0.6 ? '#000' : '#fff';
    }
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

registerComponent('color-palette', ColorPalette);
