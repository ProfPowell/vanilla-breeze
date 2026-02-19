/**
 * type-specimen-wc: Typography specimen display
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
 *
 * @example
 * <type-specimen-wc font-family="Georgia" label="Georgia" show-characters show-weights></type-specimen-wc>
 * <type-specimen-wc font-family="'Inter', sans-serif" show-scale></type-specimen-wc>
 */
class TypeSpecimenWc extends HTMLElement {
  static observedAttributes = ['font-family', 'label', 'sample', 'show-scale', 'show-weights', 'show-characters', 'weights'];

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
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

    // Header with font name and large sample
    html += `<div class="specimen-header" style="font-family:${fontFamily}">
      <span class="specimen-label">${label}</span>
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
}

customElements.define('type-specimen-wc', TypeSpecimenWc);
