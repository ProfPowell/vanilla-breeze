/**
 * type-specimen: Typography specimen display
 *
 * Renders a font specimen with sample text, character grid, weight scale,
 * and optional type scale display using VB's 9-step system.
 *
 * @attr {string} font-family - CSS font-family value
 * @attr {string} label - Display name for the font (optional, falls back to font-family)
 * @attr {string} sample - Custom sample text (default: "The quick brown fox...")
 * @attr {boolean} show-scale - Show VB type scale (xs–5xl)
 * @attr {boolean} show-weights - Show weight scale (100–900)
 * @attr {boolean} show-characters - Show character grid
 * @attr {string} weights - Comma-separated available weights (default: "400,700")
 * @attr {boolean} editable - Turn the font-family label into a live input that writes a CSS custom property
 * @attr {string} target - CSS selector for the element to receive token overrides (default: ":root")
 * @attr {string} token - Token name to write when editing (default: "font-family-base")
 *
 * @fires type-specimen:change - When edited. detail: { fontFamily, token, target }
 *
 * @example
 * <type-specimen font-family="Georgia" label="Georgia" show-characters show-weights></type-specimen>
 * <type-specimen font-family="'Inter', sans-serif" editable show-scale></type-specimen>
 */
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const QUICK_FONTS = ['system-ui', 'Georgia', 'Inter, sans-serif', '"JetBrains Mono", monospace', 'Verdana', 'Cambria', 'ui-serif'];

class TypeSpecimen extends VBElement {
  static observedAttributes = ['font-family', 'label', 'sample', 'show-scale', 'show-weights', 'show-characters', 'weights', 'editable', 'target', 'token'];

  setup() {
    this.#render();
    this.#wireEditing();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.#render();
      this.#wireEditing();
    }
  }

  #render() {
    const fontFamily = this.getAttribute('font-family') || 'system-ui';
    const label = this.getAttribute('label') || fontFamily.replace(/['"]/g, '').split(',')[0];
    const sample = this.getAttribute('sample') || 'The quick brown fox jumps over the lazy dog';
    const showScale = this.hasAttribute('show-scale');
    const showWeights = this.hasAttribute('show-weights');
    const showChars = this.hasAttribute('show-characters');
    const weightsAttr = this.getAttribute('weights') || '300,400,500,600,700';
    const weights = weightsAttr.split(',').map(w => w.trim());

    let html = '';

    const editable = this.hasAttribute('editable');

    // Header with font name and large sample
    const labelHTML = editable
      ? `<input type="text" class="specimen-font-input" value="${fontFamily.replace(/"/g, '&quot;')}" aria-label="Font family" style="font:inherit;padding:0.25rem 0.5rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);min-inline-size:18rem;max-inline-size:100%;font-family:${fontFamily};font-size:var(--font-size-sm,0.875rem)">
          <span class="specimen-quick" style="display:inline-flex;flex-wrap:wrap;gap:0.25rem;margin-inline-start:0.5rem">
            ${QUICK_FONTS.map((f) => `<button type="button" class="specimen-quick-btn" data-font="${f.replace(/"/g, '&quot;')}" style="font:inherit;font-size:var(--font-size-xs,0.75rem);padding:0.125rem 0.5rem;border:1px solid var(--color-border,#ccc);border-radius:999px;background:var(--color-surface,#fff);color:var(--color-text,#222);cursor:pointer">${f.split(',')[0].replace(/["']/g, '')}</button>`).join('')}
          </span>`
      : `<span class="specimen-label">${label}</span>`;

    html += `<div class="specimen-header" style="font-family:${fontFamily}">
      ${labelHTML}
      <p class="specimen-sample" contenteditable="plaintext-only" spellcheck="false">${sample}</p>
    </div>`;

    // Character grid
    if (showChars) {
      html += `<div class="specimen-chars" style="font-family:${fontFamily}">
        <div class="char-row"><span class="char-label">Upper</span>${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => `<span>${c}</span>`).join('')}</div>
        <div class="char-row"><span class="char-label">Lower</span>${'abcdefghijklmnopqrstuvwxyz'.split('').map(c => `<span>${c}</span>`).join('')}</div>
        <div class="char-row"><span class="char-label">Digits</span>${'0123456789'.split('').map(c => `<span>${c}</span>`).join('')}</div>
        <div class="char-row"><span class="char-label">Punct</span>${'!@#$%^&*()_+-=[]{}|;:,.<>?'.split('').map(c => `<span>${c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c}</span>`).join('')}</div>
      </div>`;
    }

    // Weight scale
    if (showWeights) {
      html += `<div class="specimen-weights">`;
      for (const w of weights) {
        html += `<div class="weight-sample" style="font-family:${fontFamily};font-weight:${w}">
          <span class="weight-label">${w}</span>
          <span class="weight-text">Aa</span>
        </div>`;
      }
      html += `</div>`;
    }

    // VB type scale
    if (showScale) {
      const scale = [
        { name: 'xs', rem: 0.75 },
        { name: 'sm', rem: 0.875 },
        { name: 'md', rem: 1 },
        { name: 'lg', rem: 1.125 },
        { name: 'xl', rem: 1.25 },
        { name: '2xl', rem: 1.5 },
        { name: '3xl', rem: 1.875 },
        { name: '4xl', rem: 2.25 },
        { name: '5xl', rem: 3 },
      ];
      html += `<div class="specimen-scale">`;
      for (const step of scale) {
        html += `<div class="scale-step" style="font-family:${fontFamily};font-size:${step.rem}rem">
          <span class="scale-label">${step.name}</span>
          <span class="scale-text">${sample.substring(0, 30)}</span>
        </div>`;
      }
      html += `</div>`;
    }

    this.innerHTML = html;
  }

  #wireEditing() {
    if (!this.hasAttribute('editable')) return;
    const input = /** @type {HTMLInputElement | null} */ (this.querySelector('.specimen-font-input'));
    if (input) {
      this.listen(input, 'input', () => this.#applyFontFamily(input.value));
    }
    this.querySelectorAll('.specimen-quick-btn').forEach((btn) => {
      this.listen(btn, 'click', () => {
        const font = btn.getAttribute('data-font') || '';
        if (input) input.value = font;
        this.#applyFontFamily(font);
      });
    });
  }

  #applyFontFamily(value) {
    const target = /** @type {HTMLElement | null} */ (this.#resolveTarget());
    const token = this.getAttribute('token') || 'font-family-base';
    if (target) target.style.setProperty(`--${token}`, value);
    // Update the attribute so the specimen re-renders with the new font
    this.setAttribute('font-family', value);
    this.dispatchEvent(new CustomEvent('type-specimen:change', {
      bubbles: true,
      detail: { fontFamily: value, token, target: this.getAttribute('target') || ':root' },
    }));
  }

  #resolveTarget() {
    const sel = this.getAttribute('target') || ':root';
    try {
      return sel === ':root' ? document.documentElement : document.querySelector(sel);
    } catch {
      return document.documentElement;
    }
  }
}

registerComponent('type-specimen', TypeSpecimen);
