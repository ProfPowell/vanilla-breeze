/**
 * token-specimen: Unified design token scale display
 *
 * One component for multiple token types — shadows, radii, borders,
 * colors, and sizes. The `type` attribute controls rendering while
 * sharing the same core API (tokens, prefix, show-values, label).
 *
 * Reads CSS custom properties and renders a visual specimen with
 * computed values after paint. All layout is inline so the component
 * works without external CSS.
 *
 * @attr {string} type - Token type: "shadow", "radius", "border", "color", "size"
 * @attr {string} tokens - Comma-separated token names (defaults vary by type)
 * @attr {string} prefix - CSS variable prefix (auto-set from type if omitted)
 * @attr {boolean} show-values - Show computed values (default: true)
 * @attr {string} label - Optional heading label
 *
 * @example
 * <token-specimen type="shadow"></token-specimen>
 * <token-specimen type="radius" tokens="s,m,l,xl,full"></token-specimen>
 * <token-specimen type="border" label="Border Widths"></token-specimen>
 */
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const TYPE_DEFAULTS = {
  shadow: {
    prefix: '--shadow-',
    tokens: 'xs,s,m,l,xl,2xl',
  },
  radius: {
    prefix: '--radius-',
    tokens: 'xs,s,m,l,xl,2xl,full',
  },
  border: {
    prefix: '--border-width-',
    tokens: 'thin,medium,thick',
  },
  color: {
    prefix: '--color-',
    tokens: 'primary,secondary,accent,success,warning,error,info',
  },
  size: {
    prefix: '--size-',
    tokens: '3xs,2xs,xs,s,m,l,xl,2xl,3xl',
  },
};

const RENDERERS = {
  shadow: renderShadow,
  radius: renderRadius,
  border: renderBorder,
  color: renderColor,
  size: renderSize,
};

class TokenSpecimen extends VBElement {
  static observedAttributes = ['type', 'tokens', 'prefix', 'show-values', 'label'];

  setup() { this.#render(); }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  #render() {
    const type = this.getAttribute('type') || 'shadow';
    const defaults = TYPE_DEFAULTS[type] || TYPE_DEFAULTS.shadow;
    const prefix = this.getAttribute('prefix') || defaults.prefix;
    const tokensAttr = this.getAttribute('tokens') || defaults.tokens;
    const showValues = this.getAttribute('show-values') !== 'false';
    const label = this.getAttribute('label') || '';
    const tokens = tokensAttr.split(',').map(t => t.trim());

    const renderer = RENDERERS[type] || RENDERERS.shadow;
    let html = '';

    if (label) {
      html += `<p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted,#666);margin-block-end:0.75rem;font-family:var(--font-sans,system-ui)">${label}</p>`;
    }

    html += renderer(tokens, prefix, showValues);
    this.innerHTML = html;

    if (showValues) {
      requestAnimationFrame(() => this.#readComputedValues(type, prefix, tokens));
    }
  }

  #readComputedValues(type, prefix, tokens) {
    const cs = getComputedStyle(this);
    this.querySelectorAll('[data-token-value]').forEach(el => {
      const name = el.dataset.tokenValue;
      const raw = cs.getPropertyValue(`${prefix}${name}`).trim();
      if (type === 'radius' || type === 'size') {
        // Show px for length values
        const sample = this.querySelector(`[data-token-sample="${name}"]`);
        if (sample) {
          const prop = type === 'radius' ? 'borderRadius' : 'width';
          const rect = type === 'size' ? sample.getBoundingClientRect().width : null;
          el.textContent = rect != null
            ? `${Math.round(rect * 100) / 100}px`
            : raw || '—';
        }
      } else {
        el.textContent = raw || '—';
      }
    });
  }
}

// ── Type renderers ────────────────────────────────────────────

function renderShadow(tokens, prefix, showValues) {
  let html = `<div role="list" style="display:flex;flex-wrap:wrap;gap:1rem;align-items:end">`;
  for (const name of tokens) {
    html += `<div role="listitem" style="text-align:center">
      <div style="width:7rem;height:5rem;background:var(--color-surface,#fff);border-radius:var(--radius-m,0.5rem);box-shadow:var(${prefix}${name})" aria-hidden="true"></div>
      <p style="font-family:var(--font-mono,monospace);font-size:0.75rem;color:var(--color-text-muted,#666);margin-block-start:0.5rem">${name}</p>
      ${showValues ? `<p data-token-value="${name}" style="font-family:var(--font-mono,monospace);font-size:0.625rem;color:var(--color-text-muted,#999);max-width:7rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></p>` : ''}
    </div>`;
  }
  html += '</div>';
  return html;
}

function renderRadius(tokens, prefix, showValues) {
  let html = `<div role="list" style="display:flex;flex-wrap:wrap;gap:1rem;align-items:end">`;
  for (const name of tokens) {
    html += `<div role="listitem" style="text-align:center">
      <div data-token-sample="${name}" style="width:4.5rem;height:4.5rem;background:var(--color-primary,oklch(55% 0.2 260));border-radius:var(${prefix}${name});display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.75rem;font-family:var(--font-mono,monospace)" aria-hidden="true">${name}</div>
      ${showValues ? `<p data-token-value="${name}" style="font-family:var(--font-mono,monospace);font-size:0.625rem;color:var(--color-text-muted,#999);margin-block-start:0.25rem"></p>` : ''}
    </div>`;
  }
  html += '</div>';
  return html;
}

function renderBorder(tokens, prefix, showValues) {
  let html = `<div role="list" style="display:flex;flex-direction:column;gap:0.75rem">`;
  for (const name of tokens) {
    html += `<div role="listitem" style="display:grid;grid-template-columns:4rem 1fr auto;align-items:center;gap:0.75rem">
      <span style="font-family:var(--font-mono,monospace);font-size:0.875rem;color:var(--color-text-muted,#666);text-align:end">${name}</span>
      <div style="border-block-start:var(${prefix}${name}) solid var(--color-text,#333);min-inline-size:4rem" aria-hidden="true"></div>
      ${showValues ? `<span data-token-value="${name}" style="font-family:var(--font-mono,monospace);font-size:0.75rem;color:var(--color-text-muted,#666);font-variant-numeric:tabular-nums"></span>` : ''}
    </div>`;
  }
  html += '</div>';
  return html;
}

function renderColor(tokens, prefix, showValues) {
  let html = `<div role="list" style="display:flex;flex-wrap:wrap;gap:0.75rem">`;
  for (const name of tokens) {
    html += `<div role="listitem" style="text-align:center">
      <div style="width:4rem;height:3rem;background:var(${prefix}${name});border-radius:var(--radius-s,0.25rem);border:1px solid var(--color-border,#ddd)" aria-hidden="true"></div>
      <p style="font-family:var(--font-mono,monospace);font-size:0.625rem;color:var(--color-text-muted,#666);margin-block-start:0.25rem">${name}</p>
      ${showValues ? `<p data-token-value="${name}" style="font-family:var(--font-mono,monospace);font-size:0.5625rem;color:var(--color-text-muted,#999);max-width:4rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></p>` : ''}
    </div>`;
  }
  html += '</div>';
  return html;
}

function renderSize(tokens, prefix, showValues) {
  let html = `<div role="list" style="display:flex;flex-direction:column;gap:0.25rem">`;
  for (const name of tokens) {
    html += `<div role="listitem" style="display:grid;grid-template-columns:3rem 1fr auto;align-items:center;gap:0.75rem;min-block-size:1.75rem">
      <span style="font-family:var(--font-mono,monospace);font-size:0.875rem;color:var(--color-text-muted,#666);text-align:end">${name}</span>
      <div data-token-sample="${name}" style="display:block;block-size:var(--size-m,1rem);min-inline-size:2px;inline-size:var(${prefix}${name});background:var(--color-interactive,oklch(55% 0.2 260));border-radius:var(--radius-s,0.25rem)" aria-hidden="true"></div>
      ${showValues ? `<span data-token-value="${name}" style="font-family:var(--font-mono,monospace);font-size:0.75rem;color:var(--color-text-muted,#666);font-variant-numeric:tabular-nums;min-inline-size:3.5rem;text-align:end"></span>` : ''}
    </div>`;
  }
  html += '</div>';
  return html;
}

registerComponent('token-specimen', TokenSpecimen);
