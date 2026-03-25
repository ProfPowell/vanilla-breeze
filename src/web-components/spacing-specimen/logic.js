/**
 * spacing-specimen: Design token spacing scale display
 *
 * Reads VB spacing tokens from computed styles and renders a visual
 * scale with labeled bars and computed values. Auto-detects the current
 * theme's spacing system.
 *
 * Uses CSS variables directly for bar widths (no JS measurement needed
 * for rendering). Reads computed px values after paint for labels.
 * All layout styles are inline so the component works without external CSS.
 *
 * @attr {string} tokens - Comma-separated token names to display
 *   (default: "3xs,2xs,xs,s,m,l,xl,2xl,3xl")
 * @attr {string} prefix - CSS variable prefix (default: "--size-")
 * @attr {boolean} show-values - Show computed px values (default: true)
 * @attr {string} label - Optional heading label
 *
 * @example
 * <spacing-specimen></spacing-specimen>
 * <spacing-specimen tokens="xs,s,m,l,xl" label="Core Scale"></spacing-specimen>
 */
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class SpacingSpecimen extends VBElement {
  static observedAttributes = ['tokens', 'prefix', 'show-values', 'label'];

  setup() {
    this.#render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  #render() {
    const tokensAttr = this.getAttribute('tokens') || '3xs,2xs,xs,s,m,l,xl,2xl,3xl';
    const prefix = this.getAttribute('prefix') || '--size-';
    const showValues = this.getAttribute('show-values') !== 'false';
    const label = this.getAttribute('label') || '';

    const tokens = tokensAttr.split(',').map(t => t.trim());

    let html = '';

    if (label) {
      html += `<div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted,#666);margin-block-end:0.75rem;font-family:var(--font-sans,system-ui)">${label}</div>`;
    }

    html += `<div role="list" aria-label="${label || 'Spacing scale'}" style="display:flex;flex-direction:column;gap:0.25rem">`;

    for (const name of tokens) {
      const varName = `${prefix}${name}`;
      html += `<div role="listitem" style="display:grid;grid-template-columns:3rem 1fr auto;align-items:center;gap:0.75rem;min-block-size:1.75rem">
        <span style="font-family:var(--font-mono,monospace);font-size:0.875rem;color:var(--color-text-muted,#666);text-align:end">${name}</span>
        <div class="scale-bar" style="display:block;block-size:var(--size-m,1rem);min-inline-size:2px;inline-size:var(${varName});background:var(--color-interactive,oklch(55% 0.2 260));border-radius:var(--radius-s,0.25rem)" aria-hidden="true"></div>
        ${showValues ? `<span class="scale-value" style="font-family:var(--font-mono,monospace);font-size:0.75rem;color:var(--color-text-muted,#666);font-variant-numeric:tabular-nums;min-inline-size:3.5rem;text-align:end"></span>` : ''}
      </div>`;
    }

    html += '</div>';
    this.innerHTML = html;

    // Read computed px values after paint
    if (showValues) {
      requestAnimationFrame(() => {
        this.querySelectorAll('.scale-bar').forEach(bar => {
          const px = bar.getBoundingClientRect().width;
          const valueEl = bar.nextElementSibling;
          if (valueEl) {
            valueEl.textContent = `${Math.round(px * 100) / 100}px`;
          }
        });
      });
    }
  }
}

registerComponent('spacing-specimen', SpacingSpecimen);
