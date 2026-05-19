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
 * @attr {string} type - Token type: "shadow", "radius", "border", "color", "size", "icon"
 * @attr {string} tokens - Comma-separated token names (defaults vary by type)
 * @attr {string} prefix - CSS variable prefix (auto-set from type if omitted)
 * @attr {boolean} show-values - Show computed values (default: true)
 * @attr {string} label - Optional heading label
 * @attr {string} size - Icon size (icon type only): xs, sm, md, lg, xl, 2xl
 * @attr {string} icon-set - Icon set (icon type only, default: "lucide")
 * @attr {boolean} editable - Turn value cells into inputs that write the token on target scope
 * @attr {string} target - CSS selector for the element to receive token overrides (default: ":root")
 *
 * @fires token-specimen:change - When a token is edited. detail: { name, value, token, target }
 *
 * @example
 * <token-specimen type="shadow"></token-specimen>
 * <token-specimen type="radius" tokens="s,m,l,xl,full"></token-specimen>
 * <token-specimen type="icon" tokens="chevron-right,check,x,search"></token-specimen>
 * <token-specimen type="color" editable></token-specimen>
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
  icon: {
    prefix: '',
    tokens: 'home,search,settings,user,bell,heart,star,check,x,chevron-right,menu,trash',
  },
};

const RENDERERS = {
  shadow: renderShadow,
  radius: renderRadius,
  border: renderBorder,
  color: renderColor,
  size: renderSize,
  icon: renderIcon,
};

class TokenSpecimen extends VBElement {
  static observedAttributes = ['type', 'tokens', 'prefix', 'show-values', 'label', 'size', 'icon-set', 'editable', 'target'];

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

    html += renderer(tokens, prefix, showValues, this);
    this.innerHTML = html;

    const editable = this.hasAttribute('editable') && type !== 'icon';

    if (showValues && type !== 'icon') {
      requestAnimationFrame(() => {
        this.#readComputedValues(type, prefix, tokens);
        if (editable) this.#injectEditors(type, prefix);
      });
    } else if (editable) {
      requestAnimationFrame(() => this.#injectEditors(type, prefix));
    }
  }

  #injectEditors(type, prefix) {
    const cs = getComputedStyle(this);
    this.querySelectorAll('[data-token-value]').forEach((node) => {
      const el = /** @type {HTMLElement} */ (node);
      const name = el.dataset.tokenValue;
      const raw = cs.getPropertyValue(`${prefix}${name}`).trim();
      const input = document.createElement('input');
      input.type = type === 'color' && /^#[0-9a-f]{3,8}$/i.test(raw) ? 'color' : 'text';
      input.value = raw || '';
      input.className = 'ts-edit';
      input.setAttribute('data-token', name || '');
      input.setAttribute('aria-label', `${name} value`);
      input.style.cssText = `font-family:var(--font-mono,monospace);font-size:0.625rem;padding:0.125rem 0.25rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface,#fff);color:var(--color-text,#222);inline-size:${type === 'color' ? '3rem' : '100%'};${type === 'color' ? 'block-size:1.5rem;padding:0;' : 'max-inline-size:8rem;'}`;
      el.replaceWith(input);
      this.listen(input, 'change', () => this.#applyEdit(input, prefix));
      this.listen(input, 'keydown', (e) => { if (/** @type {KeyboardEvent} */ (e).key === 'Enter') this.#applyEdit(input, prefix); });
    });
  }

  #applyEdit(input, prefix) {
    const name = input.getAttribute('data-token');
    const value = input.value.trim();
    if (!name || !value) return;
    const target = /** @type {HTMLElement | null} */ (this.#resolveTarget());
    const token = `${prefix}${name}`;
    if (target) target.style.setProperty(token, value);
    this.dispatchEvent(new CustomEvent('token-specimen:change', {
      bubbles: true,
      detail: { name, value, token, target: this.getAttribute('target') || ':root' },
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

  #readComputedValues(type, prefix, tokens) {
    const cs = getComputedStyle(this);
    this.querySelectorAll('[data-token-value]').forEach(node => {
      const el = /** @type {HTMLElement} */ (node);
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

function renderIcon(tokens, _prefix, showValues, host) {
  const size = host?.getAttribute('size') || 'md';
  const iconSet = host?.getAttribute('icon-set') || '';
  const setAttr = iconSet ? ` set="${iconSet}"` : '';
  let html = `<div role="list" style="display:flex;flex-wrap:wrap;gap:1rem">`;
  for (const name of tokens) {
    html += `<div role="listitem" style="display:flex;flex-direction:column;align-items:center;gap:0.375rem;min-inline-size:4.5rem">
      <span style="display:inline-flex;align-items:center;justify-content:center;padding:var(--size-s,0.75rem);background:var(--color-surface-raised,#f5f5f5);border-radius:var(--radius-s,0.25rem);border:1px solid var(--color-border,#ddd);color:var(--color-text,#222)">
        <icon-wc name="${name}" size="${size}"${setAttr}></icon-wc>
      </span>
      ${showValues ? `<code style="font-family:var(--font-mono,monospace);font-size:0.625rem;color:var(--color-text-muted,#666);max-inline-size:5rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</code>` : ''}
    </div>`;
  }
  html += '</div>';
  return html;
}

registerComponent('token-specimen', TokenSpecimen);
