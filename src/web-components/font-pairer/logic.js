/**
 * font-pairer — Interactive font pairing tool
 *
 * Pick heading + body fonts from a curated Google Fonts list,
 * preview them side-by-side, and export as CSS custom properties.
 *
 * @attr {string}  heading-font     - Initial heading font family
 * @attr {string}  body-font        - Initial body font family
 * @attr {string}  sample           - Custom sample heading text
 * @attr {boolean} show-export      - Show Copy CSS / Copy @import toolbar
 * @attr {boolean} show-suggestions - Show curated pairing suggestions
 *
 * @fires font-pairer:change - { heading, body }
 *
 * @example
 * <font-pairer heading-font="Playfair Display" body-font="Inter" show-export></font-pairer>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { FONTS, SUGGESTED_PAIRINGS, loadFont, googleFontsUrl } from './_font-data.js';

const BODY_SAMPLE = 'The quick brown fox jumps over the lazy dog. Good typography is invisible — it lets the content speak without distraction. The best font pairings create harmony between heading impact and body readability.';

class FontPairer extends VBElement {
  static observedAttributes = ['heading-font', 'body-font', 'sample', 'show-export', 'show-suggestions'];

  #heading = '';
  #body = '';

  setup() {
    this.#heading = this.getAttribute('heading-font') || 'Playfair Display';
    this.#body = this.getAttribute('body-font') || 'Inter';
    this.#render();
    this.#loadAndRender();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.isConnected) return;
    if (name === 'heading-font') this.#heading = newVal || 'Playfair Display';
    if (name === 'body-font') this.#body = newVal || 'Inter';
    this.#render();
    this.#loadAndRender();
  }

  async #loadAndRender() {
    const hFont = FONTS.find(f => f.name === this.#heading);
    const bFont = FONTS.find(f => f.name === this.#body);
    await Promise.all([
      loadFont(this.#heading, hFont?.weights || '400;700'),
      loadFont(this.#body, bFont?.weights || '400;700'),
    ]);
    // Re-render after fonts loaded for correct metrics
    this.#updatePreview();
  }

  #render() {
    const showExport = this.hasAttribute('show-export');
    const showSuggestions = this.hasAttribute('show-suggestions');
    const sample = this.getAttribute('sample') || 'The Art of Typography';

    const gap = 'var(--size-m, 1rem)';
    const smGap = 'var(--size-s, 0.75rem)';
    const xsGap = 'var(--size-xs, 0.5rem)';
    const radius = 'var(--radius-m, 0.5rem)';
    const border = 'var(--color-border, #ddd)';
    const surface = 'var(--color-surface, #fff)';
    const raised = 'var(--color-surface-raised, #f5f5f5)';
    const muted = 'var(--color-text-muted, #666)';
    const smFont = 'var(--font-size-sm, 0.875rem)';
    const xsFont = 'var(--font-size-xs, 0.75rem)';

    // Font selects
    const headingOptions = this.#buildOptions(this.#heading);
    const bodyOptions = this.#buildOptions(this.#body);

    const selects = `<div style="display:flex;flex-wrap:wrap;gap:${gap};align-items:end">
      <label style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:10rem;font-size:${smFont};font-weight:600">
        Heading Font
        <select class="fp-heading" style="font:inherit;font-size:${smFont};padding:0.4rem 0.5rem;border:1px solid ${border};border-radius:4px;background:${surface}">
          ${headingOptions}
        </select>
      </label>
      <label style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:10rem;font-size:${smFont};font-weight:600">
        Body Font
        <select class="fp-body" style="font:inherit;font-size:${smFont};padding:0.4rem 0.5rem;border:1px solid ${border};border-radius:4px;background:${surface}">
          ${bodyOptions}
        </select>
      </label>
    </div>`;

    // Preview area
    const preview = `<div class="fp-preview" style="padding:var(--size-xl,2rem);background:${raised};border-radius:${radius};border:1px solid ${border}">
      <h3 class="fp-heading-preview" style="font-family:'${this.#heading}',serif;font-size:var(--font-size-2xl,1.75rem);font-weight:700;margin:0 0 ${smGap}">${sample}</h3>
      <p class="fp-body-preview" style="font-family:'${this.#body}',sans-serif;font-size:var(--font-size-md,1rem);line-height:1.6;margin:0;color:${muted}">${BODY_SAMPLE}</p>
    </div>`;

    // Suggestions
    let suggestions = '';
    if (showSuggestions) {
      const pills = SUGGESTED_PAIRINGS.map(([h, b]) =>
        `<button type="button" class="fp-suggestion" data-h="${h}" data-b="${b}"
          style="all:unset;cursor:pointer;font-size:${xsFont};padding:0.3rem 0.6rem;border:1px solid ${border};border-radius:999px;white-space:nowrap;transition:border-color 0.15s"
          title="${h} + ${b}">${h} + ${b}</button>`
      ).join('');
      suggestions = `<div style="display:flex;flex-direction:column;gap:${xsGap}">
        <span style="font-size:${xsFont};font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.05em">Suggested Pairings</span>
        <div style="display:flex;flex-wrap:wrap;gap:${xsGap}">${pills}</div>
      </div>`;
    }

    // Export toolbar
    let exportBar = '';
    if (showExport) {
      exportBar = `<div style="display:flex;gap:${xsGap}">
        <button type="button" class="fp-copy-css"
          style="all:unset;cursor:pointer;font-size:${xsFont};padding:0.35rem 0.75rem;border:1px solid ${border};border-radius:4px;background:${surface}">Copy CSS</button>
        <button type="button" class="fp-copy-import"
          style="all:unset;cursor:pointer;font-size:${xsFont};padding:0.35rem 0.75rem;border:1px solid ${border};border-radius:4px;background:${surface}">Copy @import</button>
      </div>`;
    }

    this.innerHTML = `<div style="display:flex;flex-direction:column;gap:${gap}">
      ${selects}
      ${preview}
      ${suggestions}
      ${exportBar}
    </div>`;

    this.#wire();
  }

  #buildOptions(selected) {
    const categories = ['serif', 'sans-serif', 'display', 'monospace'];
    return categories.map(cat => {
      const fonts = FONTS.filter(f => f.category === cat);
      const opts = fonts.map(f =>
        `<option value="${f.name}"${f.name === selected ? ' selected' : ''}>${f.name}</option>`
      ).join('');
      return `<optgroup label="${cat}">${opts}</optgroup>`;
    }).join('');
  }

  #wire() {
    // Heading select
    this.querySelector('.fp-heading')?.addEventListener('change', (e) => {
      this.#heading = e.target.value;
      this.#loadAndRender();
      this.#updatePreview();
      this.#emit();
    });

    // Body select
    this.querySelector('.fp-body')?.addEventListener('change', (e) => {
      this.#body = e.target.value;
      this.#loadAndRender();
      this.#updatePreview();
      this.#emit();
    });

    // Suggestion pills
    this.querySelectorAll('.fp-suggestion').forEach(btn => {
      btn.addEventListener('click', () => {
        this.#heading = btn.dataset.h;
        this.#body = btn.dataset.b;
        this.#render();
        this.#loadAndRender();
        this.#emit();
      });
    });

    // Copy CSS
    this.querySelector('.fp-copy-css')?.addEventListener('click', (e) => {
      const hFont = FONTS.find(f => f.name === this.#heading);
      const bFont = FONTS.find(f => f.name === this.#body);
      const hFallback = hFont?.category || 'serif';
      const bFallback = bFont?.category || 'sans-serif';
      const css = `--font-heading: "${this.#heading}", ${hFallback};\n--font-body: "${this.#body}", ${bFallback};`;
      navigator.clipboard?.writeText(css);
      this.#copyFeedback(e.target);
    });

    // Copy @import
    this.querySelector('.fp-copy-import')?.addEventListener('click', (e) => {
      const hFont = FONTS.find(f => f.name === this.#heading);
      const bFont = FONTS.find(f => f.name === this.#body);
      const hUrl = googleFontsUrl(this.#heading, hFont?.weights || '400;700');
      const bUrl = googleFontsUrl(this.#body, bFont?.weights || '400;700');
      const imports = `@import url('${hUrl}');\n@import url('${bUrl}');`;
      navigator.clipboard?.writeText(imports);
      this.#copyFeedback(e.target);
    });
  }

  #updatePreview() {
    const h = this.querySelector('.fp-heading-preview');
    const b = this.querySelector('.fp-body-preview');
    if (h) h.style.fontFamily = `'${this.#heading}', serif`;
    if (b) b.style.fontFamily = `'${this.#body}', sans-serif`;
  }

  #copyFeedback(btn) {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  }

  #emit() {
    this.dispatchEvent(new CustomEvent('font-pairer:change', {
      bubbles: true,
      detail: { heading: this.#heading, body: this.#body },
    }));
  }
}

registerComponent('font-pairer', FontPairer);
export { FontPairer };
